from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest

from conftest import login


def note_payload(**overrides) -> dict:
    payload = {
        "setting": "colegio",
        "observation": "Hoy logró quedarse en el aula toda la mañana sin necesitar salir.",
        "progress": "avance",
        "occurred_on": (datetime.now(UTC).date() - timedelta(days=1)).isoformat(),
    }
    payload.update(overrides)
    return payload


@pytest.mark.asyncio
async def test_family_note_is_recorded_without_changing_the_route(client):
    family_token = await login(client, dni="12345678", password="familia123")
    headers = {"Authorization": f"Bearer {family_token}"}
    current = await client.get("/api/v1/family/cases/current", headers=headers)
    case_id = current.json()["case"]["id"]
    route_status_before = current.json()["case"]["route_status"]

    created = await client.post(
        f"/api/v1/family/cases/{case_id}/notes", headers=headers, json=note_payload()
    )
    assert created.status_code == 201
    assert created.json()["note"]["author_name"] == "Maria Quispe"
    assert created.json()["note"]["reviewed_at"] is None

    # La libreta es testimonio, no una solicitud: no puede mover la ruta ni crear tareas.
    after = await client.get("/api/v1/family/cases/current", headers=headers)
    assert after.json()["case"]["route_status"] == route_status_before
    assert after.json()["case"]["barrier_reported"] is False
    assert after.json()["tasks"] == []


@pytest.mark.asyncio
async def test_notebook_orders_by_when_it_happened_and_counts_progress(client):
    family_token = await login(client, dni="12345678", password="familia123")
    headers = {"Authorization": f"Bearer {family_token}"}
    current = await client.get("/api/v1/family/cases/current", headers=headers)
    case_id = current.json()["case"]["id"]

    today = datetime.now(UTC).date()
    # Se escribe primero la observación más antigua para comprobar que ordena por `occurred_on`.
    for days_ago, progress in ((20, "retroceso"), (1, "avance")):
        response = await client.post(
            f"/api/v1/family/cases/{case_id}/notes",
            headers=headers,
            json=note_payload(
                progress=progress, occurred_on=(today - timedelta(days=days_ago)).isoformat()
            ),
        )
        assert response.status_code == 201

    notebook = await client.get("/api/v1/family/cases/current/notes", headers=headers)
    assert notebook.status_code == 200
    dates = [note["occurred_on"] for note in notebook.json()["notes"]]
    assert dates == sorted(dates, reverse=True)

    summary = notebook.json()["summary"]
    assert summary["total"] == len(notebook.json()["notes"])
    assert summary["advances"] >= 1
    assert summary["setbacks"] >= 1
    assert summary["pending_review"] == summary["total"]


@pytest.mark.asyncio
async def test_professional_reads_and_answers_a_note(client):
    family_token = await login(client, dni="12345678", password="familia123")
    professional_token = await login(client, dni="87654321", password="profesional123")
    family_headers = {"Authorization": f"Bearer {family_token}"}
    professional_headers = {"Authorization": f"Bearer {professional_token}"}

    current = await client.get("/api/v1/family/cases/current", headers=family_headers)
    case_id = current.json()["case"]["id"]
    created = await client.post(
        f"/api/v1/family/cases/{case_id}/notes", headers=family_headers, json=note_payload()
    )
    note_id = created.json()["note"]["id"]

    listed = await client.get(f"/api/v1/professional/cases/{case_id}/notes", headers=professional_headers)
    assert listed.status_code == 200
    assert note_id in {note["id"] for note in listed.json()["notes"]}

    cases = await client.get("/api/v1/professional/cases", headers=professional_headers)
    assert cases.json()["items"][0]["unreviewed_notes"] >= 1

    reviewed = await client.post(
        f"/api/v1/professional/cases/{case_id}/notes/{note_id}/review",
        headers=professional_headers,
        json={"professional_comment": "Gracias por el detalle. Lo revisamos en la próxima sesión."},
    )
    assert reviewed.status_code == 200
    assert reviewed.json()["reviewed_at"] is not None
    assert reviewed.json()["professional_comment"].startswith("Gracias")

    detail = await client.get(f"/api/v1/professional/cases/{case_id}", headers=professional_headers)
    answered = next(note for note in detail.json()["family_notes"] if note["id"] == note_id)
    assert answered["professional_comment"].startswith("Gracias")

    # La respuesta del equipo vuelve a la familia dentro de su propia libreta.
    notebook = await client.get("/api/v1/family/cases/current/notes", headers=family_headers)
    from_family = next(note for note in notebook.json()["notes"] if note["id"] == note_id)
    assert from_family["professional_comment"].startswith("Gracias")


@pytest.mark.asyncio
async def test_a_note_cannot_be_dated_in_the_future(client):
    family_token = await login(client, dni="12345678", password="familia123")
    headers = {"Authorization": f"Bearer {family_token}"}
    current = await client.get("/api/v1/family/cases/current", headers=headers)
    case_id = current.json()["case"]["id"]

    response = await client.post(
        f"/api/v1/family/cases/{case_id}/notes",
        headers=headers,
        json=note_payload(occurred_on=(datetime.now(UTC).date() + timedelta(days=2)).isoformat()),
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_a_family_cannot_write_into_another_case(client):
    family_token = await login(client, dni="12345678", password="familia123")
    headers = {"Authorization": f"Bearer {family_token}"}

    response = await client.post("/api/v1/family/cases/999999/notes", headers=headers, json=note_payload())
    assert response.status_code == 404
