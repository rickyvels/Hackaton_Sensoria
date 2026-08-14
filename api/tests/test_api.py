from __future__ import annotations

import pytest
from sqlalchemy import func, select

from app.database import SessionLocal
from app.models import ApprovalDecision, BarrierReport, CaseRecord, FamilyRegistrationRequest, Task


async def login(client, *, dni: str, password: str) -> str:
    response = await client.post("/api/v1/auth/login", json={"dni": dni, "password": password})
    response.raise_for_status()
    return response.json()["access_token"]


async def validate_synthesis(client, token: str, case_id: int) -> dict:
    response = await client.post(
        f"/api/v1/professional/cases/{case_id}/synthesis-validation",
        headers={"Authorization": f"Bearer {token}"},
        json={"decision": "approved", "professional_comment": "Revisé la síntesis antes de habilitar la coordinación."},
    )
    assert response.status_code == 200
    return response.json()


@pytest.mark.asyncio
async def test_family_pre_registration_accepts_dni_without_creating_a_case(client):
    payload = {
        "dni": "44556677",
        "companion_name": "Andrea Torres",
        "patient_name": "Valeria Torres",
        "relationship": "Madre",
        "phone": "+51 900 123 456",
        "district": "San Borja",
        "consent_confirmed": True,
    }
    response = await client.post("/api/v1/auth/family-registration", json=payload)
    assert response.status_code == 202
    assert response.json()["status"] == "pending_review"

    repeated = await client.post("/api/v1/auth/family-registration", json=payload)
    assert repeated.status_code == 202
    async with SessionLocal() as session:
        requests = list((await session.execute(select(FamilyRegistrationRequest))).scalars())
        assert len(requests) == 1
        assert requests[0].dni == "44556677"
        assert requests[0].status == "pending_review"
        assert await session.scalar(select(func.count()).select_from(CaseRecord)) == 1


@pytest.mark.asyncio
async def test_family_assistant_uses_only_authenticated_route_context(client, monkeypatch):
    family_token = await login(client, dni="12345678", password="familia123")

    async def fake_answer(message: str, **_: object) -> tuple[str, str, str]:
        assert message == "¿Qué sigue en mi ruta?"
        return "Tu ruta sigue registrada y el equipo te avisará el siguiente paso.", "ollama", "qwen3:8b"

    monkeypatch.setattr("app.routers.family.answer_family_question", fake_answer)
    response = await client.post(
        "/api/v1/family/cases/current/assistant",
        headers={"Authorization": f"Bearer {family_token}"},
        json={"message": "¿Qué sigue en mi ruta?"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["provider"] == "ollama"
    assert body["model"] == "qwen3:8b"
    assert "no realiza diagnósticos" in body["disclaimer"]


@pytest.mark.asyncio
async def test_family_report_requires_human_approval_before_task_creation(client):
    family_token = await login(client, dni="12345678", password="familia123")
    professional_token = await login(client, dni="87654321", password="profesional123")

    current_case = await client.get(
        "/api/v1/family/cases/current",
        headers={"Authorization": f"Bearer {family_token}"},
    )
    case_id = current_case.json()["case"]["id"]

    report_response = await client.post(
        f"/api/v1/family/cases/{case_id}/barrier-reports",
        headers={"Authorization": f"Bearer {family_token}"},
        json={
            "barrier_type": "availability",
            "title": "No encuentro cupo",
            "description": "Solo puedo asistir despues de las 4pm y no veo horarios compatibles.",
            "availability_note": "Martes y jueves por la tarde",
        },
    )
    assert report_response.status_code == 201
    report_body = report_response.json()
    assert report_body["task_created"] is False
    assert report_body["case"]["approval_status"] == "not_requested"
    assert report_body["case"]["route_status"] == "barrier_reported"
    assert report_body["report"]["validation_status"] == "pending_validation"

    feed_before_approval = await client.get(
        f"/api/v1/cases/{case_id}/feed",
        headers={"Authorization": f"Bearer {family_token}"},
    )
    assert feed_before_approval.status_code == 200
    assert feed_before_approval.json()["tasks"] == []

    blocked_run = await client.post(
        f"/api/v1/orchestration/cases/{case_id}/runs",
        headers={"Authorization": f"Bearer {professional_token}"},
    )
    assert blocked_run.status_code == 409
    validation = await validate_synthesis(client, professional_token, case_id)
    assert validation["latest_barrier_report"]["validated_by_professional"] is True

    run_response = await client.post(
        f"/api/v1/orchestration/cases/{case_id}/runs",
        headers={"Authorization": f"Bearer {professional_token}"},
    )
    run_id = run_response.json()["id"]
    for _ in range(100):
        run_state = await client.get(
            f"/api/v1/orchestration/runs/{run_id}",
            headers={"Authorization": f"Bearer {professional_token}"},
        )
        if run_state.json()["status"] == "waiting_approval":
            break
        await __import__("asyncio").sleep(0.01)

    approval_response = await client.post(
        f"/api/v1/professional/cases/{case_id}/approval-decisions",
        headers={"Authorization": f"Bearer {professional_token}"},
        json={
            "decision": "approved",
            "professional_note": "Autorizar coordinacion operativa.",
            "authorized_proposal": "Buscar cupo en horario de tarde y confirmar con la familia.",
        },
    )
    assert approval_response.status_code == 200
    approval_body = approval_response.json()
    assert approval_body["case"]["approval_status"] == "approved"
    assert approval_body["case"]["route_status"] == "coordination_active"
    assert approval_body["task"]["authorized_proposal"] == "Buscar cupo en horario de tarde y confirmar con la familia."

    feed_after_approval = await client.get(
        f"/api/v1/cases/{case_id}/feed",
        headers={"Authorization": f"Bearer {family_token}"},
    )
    assert feed_after_approval.status_code == 200
    assert len(feed_after_approval.json()["tasks"]) == 1
    assert any(event["kind"] == "Task" for event in feed_after_approval.json()["events"])
    assert not any(
        event["kind"] in {"AgentExecution", "AgentProposal", "PolicyCheck"}
        for event in feed_after_approval.json()["events"]
    )
    assert all(
        set((event["metadata"] or {}).keys()) <= {"channel", "status"}
        for event in feed_after_approval.json()["events"]
    )
    for _ in range(100):
        completed_run = await client.get(
            f"/api/v1/orchestration/runs/{run_id}",
            headers={"Authorization": f"Bearer {professional_token}"},
        )
        if completed_run.json()["status"] == "completed":
            break
        await __import__("asyncio").sleep(0.01)
    assert completed_run.json()["status"] == "completed"


@pytest.mark.asyncio
async def test_approval_validation_requires_authorized_proposal_when_approved(client):
    professional_token = await login(client, dni="87654321", password="profesional123")
    family_token = await login(client, dni="12345678", password="familia123")

    current_case = await client.get(
        "/api/v1/family/cases/current",
        headers={"Authorization": f"Bearer {family_token}"},
    )
    case_id = current_case.json()["case"]["id"]

    await client.post(
        f"/api/v1/family/cases/{case_id}/barrier-reports",
        headers={"Authorization": f"Bearer {family_token}"},
        json={
            "barrier_type": "availability",
            "title": "No encuentro cupo",
            "description": "Solo puedo asistir despues de las 4pm y no veo horarios compatibles.",
            "availability_note": "Martes y jueves por la tarde",
        },
    )

    invalid_approval = await client.post(
        f"/api/v1/professional/cases/{case_id}/approval-decisions",
        headers={"Authorization": f"Bearer {professional_token}"},
        json={
            "decision": "approved",
            "professional_note": "Autorizar coordinacion operativa.",
        },
    )
    assert invalid_approval.status_code == 422
    errors = invalid_approval.json()["detail"]
    assert any(error["loc"][-1] == "authorized_proposal" for error in errors)


@pytest.mark.asyncio
async def test_transaction_rolls_back_when_task_creation_fails(client, monkeypatch):
    professional_token = await login(client, dni="87654321", password="profesional123")
    family_token = await login(client, dni="12345678", password="familia123")

    current_case = await client.get(
        "/api/v1/family/cases/current",
        headers={"Authorization": f"Bearer {family_token}"},
    )
    case_id = current_case.json()["case"]["id"]

    await client.post(
        f"/api/v1/family/cases/{case_id}/barrier-reports",
        headers={"Authorization": f"Bearer {family_token}"},
        json={
            "barrier_type": "availability",
            "title": "No encuentro cupo",
            "description": "Solo puedo asistir despues de las 4pm y no veo horarios compatibles.",
            "availability_note": "Martes y jueves por la tarde",
        },
    )
    await validate_synthesis(client, professional_token, case_id)

    run_response = await client.post(
        f"/api/v1/orchestration/cases/{case_id}/runs",
        headers={"Authorization": f"Bearer {professional_token}"},
    )
    run_id = run_response.json()["id"]
    for _ in range(100):
        run_state = await client.get(
            f"/api/v1/orchestration/runs/{run_id}",
            headers={"Authorization": f"Bearer {professional_token}"},
        )
        if run_state.json()["status"] == "waiting_approval":
            break
        await __import__("asyncio").sleep(0.01)

    def broken_task_payload(_: str) -> dict[str, str]:
        raise RuntimeError("task builder exploded")

    monkeypatch.setattr("app.services.build_task_payload", broken_task_payload)

    failed_approval = await client.post(
        f"/api/v1/professional/cases/{case_id}/approval-decisions",
        headers={"Authorization": f"Bearer {professional_token}"},
        json={
            "decision": "approved",
            "professional_note": "Autorizar coordinacion operativa.",
            "authorized_proposal": "Buscar cupo en horario de tarde y confirmar con la familia.",
        },
    )
    assert failed_approval.status_code == 500
    assert failed_approval.json() == {"detail": "Internal server error"}

    async with SessionLocal() as session:
        task_count = await session.scalar(select(func.count()).select_from(Task))
        decision_count = await session.scalar(select(func.count()).select_from(ApprovalDecision))
        case = await session.get(CaseRecord, case_id)
        report = await session.scalar(select(BarrierReport).where(BarrierReport.case_id == case_id))

    assert task_count == 0
    assert decision_count == 0
    assert case is not None
    assert case.approval_status == "pending"
    assert case.route_status == "awaiting_authorization"
    assert report is not None
    assert report.status == "pending_review"
