from __future__ import annotations

import asyncio
from uuid import uuid4

import pytest
from sqlalchemy import desc, select, text

from app.database import SessionLocal
from app.models import BarrierReport, CaseEvent, CaseRecord, OrchestrationRun
from app.orchestration import orchestration_manager
from app.services import emit_event
from conftest import login


async def wait_for_status(client, token: str, run_id: str, expected: str) -> dict:
    for _ in range(100):
        response = await client.get(
            f"/api/v1/orchestration/runs/{run_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        payload = response.json()
        if payload["status"] == expected:
            return payload
        await asyncio.sleep(0.01)
    raise AssertionError(f"run {run_id} did not reach {expected}")


async def validate_synthesis(client, token: str, case_id: int) -> dict:
    response = await client.post(
        f"/api/v1/professional/cases/{case_id}/synthesis-validation",
        headers={"Authorization": f"Bearer {token}"},
        json={"decision": "approved", "professional_comment": "Revisé la información y autorizo su uso para coordinar."},
    )
    assert response.status_code == 200
    return response.json()


@pytest.mark.asyncio
async def test_real_run_waits_for_human_then_resumes_and_updates_graph(client):
    family_token = await login(client, dni="12345678", password="familia123")
    professional_token = await login(client, dni="87654321", password="profesional123")
    current_case = await client.get(
        "/api/v1/family/cases/current",
        headers={"Authorization": f"Bearer {family_token}"},
    )
    case_id = current_case.json()["case"]["id"]

    report = await client.post(
        f"/api/v1/family/cases/{case_id}/barrier-reports",
        headers={"Authorization": f"Bearer {family_token}"},
        json={
            "barrier_type": "availability",
            "title": "No encuentro cupo",
            "description": "Solo puedo asistir despues de las 4pm y no veo horarios compatibles.",
            "availability_note": "Martes y jueves por la tarde",
        },
    )
    assert report.status_code == 201
    assert report.json()["case"]["approval_status"] == "not_requested"
    assert report.json()["case"]["route_status"] == "barrier_reported"

    feed_before_run = await client.get(
        f"/api/v1/cases/{case_id}/feed",
        headers={"Authorization": f"Bearer {professional_token}"},
    )
    assert "ApprovalRequest" not in {event["kind"] for event in feed_before_run.json()["events"]}

    blocked = await client.post(
        f"/api/v1/orchestration/cases/{case_id}/runs",
        headers={"Authorization": f"Bearer {professional_token}"},
    )
    assert blocked.status_code == 409
    validation = await validate_synthesis(client, professional_token, case_id)
    assert validation["latest_barrier_report"]["validated_by_professional"] is True

    started = await client.post(
        f"/api/v1/orchestration/cases/{case_id}/runs",
        headers={"Authorization": f"Bearer {professional_token}"},
    )
    assert started.status_code == 202
    run_id = started.json()["id"]

    waiting = await wait_for_status(client, professional_token, run_id, "waiting_approval")
    assert waiting["provider"] == "deterministic"
    assert waiting["model"] == "rules-v1"
    assert waiting["current_agent"] == "followup"

    feed_at_gate = await client.get(
        f"/api/v1/cases/{case_id}/feed",
        headers={"Authorization": f"Bearer {professional_token}"},
    )
    kinds = [event["kind"] for event in feed_at_gate.json()["events"]]
    assert kinds.count("AgentExecution") >= 6
    assert kinds.count("AgentProposal") == 3
    assert "PolicyCheck" in kinds
    assert "ApprovalRequest" in kinds
    assert feed_at_gate.json()["tasks"] == []

    graph_at_gate = await client.get(
        f"/api/v1/orchestration/cases/{case_id}/graph",
        headers={"Authorization": f"Bearer {professional_token}"},
    )
    assert graph_at_gate.status_code == 200
    graph_payload = graph_at_gate.json()
    graph_kinds = {node["kind"] for node in graph_payload["nodes"]}
    assert {"Case", "OrchestrationRun", "FamilyReport", "Barrier", "AgentExecution", "AgentProposal", "PolicyCheck", "ApprovalRequest"} <= graph_kinds
    assert any(edge["relation"] == "requires_approval" for edge in graph_payload["edges"])
    run_node = next(node for node in graph_payload["nodes"] if node["id"] == f"run-{run_id}")
    assert run_node["status"] == "waiting_approval"
    assert run_node["metadata"]["trace_id"] == run_id
    assert run_node["metadata"]["provider"] == "deterministic"
    assert run_node["metadata"]["model"] == "rules-v1"
    assert run_node["metadata"]["event_count"] >= 11
    assert run_node["metadata"]["agent_count"] == 3
    assert run_node["metadata"]["gate_status"] == "waiting_approval"
    run_events = [
        node for node in graph_payload["nodes"]
        if node["metadata"].get("run_id") == run_id and node["kind"] != "OrchestrationRun"
    ]
    sequences = [node["metadata"]["sequence"] for node in run_events]
    assert sequences == sorted(sequences)
    completed_spans = [
        node for node in run_events
        if node["kind"] == "AgentExecution" and node["status"] == "completed"
    ]
    assert len(completed_spans) == 3
    assert all(node["metadata"]["trace_id"] == run_id for node in completed_spans)
    assert all(node["metadata"]["span_id"] for node in completed_spans)
    assert all(node["metadata"]["duration_ms"] >= 0 for node in completed_spans)

    decision_payload = {
        "decision": "approved",
        "professional_note": "Autorizar coordinacion operativa.",
        "authorized_proposal": "Buscar cupo en horario de tarde y confirmar con la familia.",
    }
    blank_decision = await client.post(
        f"/api/v1/professional/cases/{case_id}/approval-decisions",
        headers={"Authorization": f"Bearer {professional_token}"},
        json={**decision_payload, "authorized_proposal": "   "},
    )
    assert blank_decision.status_code == 422
    decisions = await asyncio.gather(
        *(
            client.post(
                f"/api/v1/professional/cases/{case_id}/approval-decisions",
                headers={"Authorization": f"Bearer {professional_token}"},
                json=decision_payload,
            )
            for _ in range(2)
        )
    )
    assert sorted(response.status_code for response in decisions) == [200, 409]

    completed = await wait_for_status(client, professional_token, run_id, "completed")
    assert completed["current_agent"] == "quality"
    artifact_policy = {item["agent_id"]: item["requires_approval"] for item in completed["artifacts"]}
    assert artifact_policy == {
        "navigator": False,
        "coordinator": True,
        "followup": True,
        "quality": False,
    }

    final_feed = await client.get(
        f"/api/v1/cases/{case_id}/feed",
        headers={"Authorization": f"Bearer {professional_token}"},
    )
    final_kinds = [event["kind"] for event in final_feed.json()["events"]]
    assert "Task" in final_kinds
    assert "Notification" in final_kinds
    assert "RouteState" in final_kinds
    assert "AggregateMetric" in final_kinds

    replay = await client.post(
        f"/api/v1/orchestration/cases/{case_id}/runs",
        headers={"Authorization": f"Bearer {professional_token}"},
    )
    assert replay.status_code == 409

    next_report = await client.post(
        f"/api/v1/family/cases/{case_id}/barrier-reports",
        headers={"Authorization": f"Bearer {family_token}"},
        json={
            "barrier_type": "transport",
            "title": "Apareció una nueva dificultad",
            "description": "El traslado disponible ya no coincide con el horario previsto.",
        },
    )
    assert next_report.status_code == 201
    family_after_new_barrier = await client.get(
        "/api/v1/family/cases/current",
        headers={"Authorization": f"Bearer {family_token}"},
    )
    assert family_after_new_barrier.json()["tasks"] == []
    current_after_new_barrier = await client.get(
        f"/api/v1/orchestration/cases/{case_id}/runs/current",
        headers={"Authorization": f"Bearer {professional_token}"},
    )
    assert current_after_new_barrier.status_code == 200
    assert current_after_new_barrier.json() is None

    await validate_synthesis(client, professional_token, case_id)
    next_run = await client.post(
        f"/api/v1/orchestration/cases/{case_id}/runs",
        headers={"Authorization": f"Bearer {professional_token}"},
    )
    assert next_run.status_code == 202
    assert next_run.json()["id"] != run_id
    await wait_for_status(client, professional_token, next_run.json()["id"], "waiting_approval")


@pytest.mark.asyncio
async def test_run_event_stream_replays_persisted_events(client):
    family_token = await login(client, dni="12345678", password="familia123")
    professional_token = await login(client, dni="87654321", password="profesional123")
    current_case = await client.get(
        "/api/v1/family/cases/current",
        headers={"Authorization": f"Bearer {family_token}"},
    )
    case_id = current_case.json()["case"]["id"]
    await client.post(
        f"/api/v1/family/cases/{case_id}/barrier-reports",
        headers={"Authorization": f"Bearer {family_token}"},
        json={
            "barrier_type": "transport",
            "title": "No puedo llegar",
            "description": "El traslado disponible no coincide con el horario asignado.",
        },
    )
    await validate_synthesis(client, professional_token, case_id)
    starts = await asyncio.gather(
        *(
            client.post(
                f"/api/v1/orchestration/cases/{case_id}/runs",
                headers={"Authorization": f"Bearer {professional_token}"},
            )
            for _ in range(2)
        )
    )
    assert all(response.status_code == 202 for response in starts)
    assert len({response.json()["id"] for response in starts}) == 1
    run_id = starts[0].json()["id"]
    await wait_for_status(client, professional_token, run_id, "waiting_approval")

    stream = await client.get(
        f"/api/v1/orchestration/runs/{run_id}/events?follow=false",
        headers={"Authorization": f"Bearer {professional_token}"},
    )
    assert stream.status_code == 200
    assert stream.headers["content-type"].startswith("text/event-stream")
    assert "event: agent_execution" in stream.text
    assert f'"run_id": "{run_id}"' in stream.text

    replayed_terminal = await client.get(
        f"/api/v1/orchestration/runs/{run_id}/events",
        headers={"Authorization": f"Bearer {professional_token}"},
    )
    assert replayed_terminal.status_code == 200
    assert "event: approval_request" in replayed_terminal.text


@pytest.mark.asyncio
async def test_provider_failure_uses_a_visible_deterministic_fallback(client, monkeypatch):
    class FailingProvider:
        name = "ollama"
        model = "qwen3:8b"

        async def propose(self, *_):
            raise TimeoutError("simulated provider timeout")

    monkeypatch.setattr("app.orchestration.manager.build_provider", lambda _: FailingProvider())
    family_token = await login(client, dni="12345678", password="familia123")
    professional_token = await login(client, dni="87654321", password="profesional123")
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
            "title": "Horario incompatible",
            "description": "Solo puedo asistir por la tarde.",
        },
    )
    await validate_synthesis(client, professional_token, case_id)
    started = await client.post(
        f"/api/v1/orchestration/cases/{case_id}/runs",
        headers={"Authorization": f"Bearer {professional_token}"},
    )
    waiting = await wait_for_status(client, professional_token, started.json()["id"], "waiting_approval")

    assert {artifact["provider"] for artifact in waiting["artifacts"]} == {"deterministic"}
    feed = await client.get(
        f"/api/v1/cases/{case_id}/feed",
        headers={"Authorization": f"Bearer {professional_token}"},
    )
    fallback_events = [
        event for event in feed.json()["events"] if event["metadata"].get("status") == "fallback"
    ]
    assert len(fallback_events) == 3
    assert all(event["metadata"]["provider"] == "deterministic" for event in fallback_events)


@pytest.mark.asyncio
async def test_recover_requeues_a_persisted_running_run(client):
    family_token = await login(client, dni="12345678", password="familia123")
    professional_token = await login(client, dni="87654321", password="profesional123")
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
            "title": "Horario incompatible",
            "description": "Solo puedo asistir por la tarde.",
        },
    )
    async with SessionLocal() as session:
        report = await session.scalar(
            select(BarrierReport)
            .where(BarrierReport.case_id == case_id)
            .order_by(desc(BarrierReport.id))
        )
        run = OrchestrationRun(
            id=str(uuid4()),
            case_id=case_id,
            barrier_report_id=report.id,
            status="running",
            provider="deterministic",
            model="rules-v1",
            artifacts=[],
        )
        session.add(run)
        await session.commit()
        run_id = run.id

    await orchestration_manager.recover()
    recovered = await wait_for_status(client, professional_token, run_id, "waiting_approval")
    assert len(recovered["artifacts"]) == 3


@pytest.mark.asyncio
async def test_recover_repairs_a_partial_human_gate(client):
    family_token = await login(client, dni="12345678", password="familia123")
    professional_token = await login(client, dni="87654321", password="profesional123")
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
            "title": "Horario incompatible",
            "description": "Solo puedo asistir por la tarde.",
        },
    )
    async with SessionLocal() as session:
        case = await session.get(CaseRecord, case_id)
        report = await session.scalar(
            select(BarrierReport)
            .where(BarrierReport.case_id == case_id)
            .order_by(desc(BarrierReport.id))
        )
        run = OrchestrationRun(
            id=str(uuid4()),
            case_id=case_id,
            barrier_report_id=report.id,
            status="waiting_approval",
            provider="deterministic",
            model="rules-v1",
            current_agent="followup",
            artifacts=[{"agent_id": agent_id} for agent_id in ("navigator", "coordinator", "followup")],
        )
        case.route_status = "awaiting_authorization"
        case.approval_status = "pending"
        session.add(run)
        await session.flush()
        await emit_event(
            session,
            case_id=case_id,
            kind="PolicyCheck",
            actor="Orquestador",
            message="Política persistida antes del reinicio simulado.",
            metadata={"run_id": run.id, "run_status": "waiting_approval"},
        )
        await session.commit()
        run_id = run.id

    await orchestration_manager.recover()
    await wait_for_status(client, professional_token, run_id, "waiting_approval")
    async with SessionLocal() as session:
        events = list(
            (
                await session.execute(
                    select(CaseEvent).where(
                        CaseEvent.case_id == case_id,
                        CaseEvent.kind.in_(("PolicyCheck", "ApprovalRequest")),
                    )
                )
            ).scalars()
        )
        kinds = [event.kind for event in events if (event.event_metadata or {}).get("run_id") == run_id]
        assert kinds.count("PolicyCheck") == 1
        assert kinds.count("ApprovalRequest") == 1


@pytest.mark.asyncio
async def test_sqlite_foreign_keys_are_enabled():
    async with SessionLocal() as session:
        assert await session.scalar(text("PRAGMA foreign_keys")) == 1
