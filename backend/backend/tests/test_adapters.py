"""Tests for memory adapters."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

import pytest

from app.adapters.memory.clock import SimulatedClock, SystemClock
from app.adapters.memory.event_bus import InMemoryEventBus
from app.adapters.memory.file_storage import InMemoryFileStorage
from app.adapters.memory.notifier import RecordingNotifier
from app.adapters.memory.repositories import (
    InMemoryCasoRepository,
    InMemoryCitaRepository,
    InMemoryNotificacionRepository,
    InMemoryPacienteRepository,
    InMemoryRepository,
    InMemoryTamizajeRepository,
    InMemoryUsuarioRepository,
)
from app.adapters.memory.unit_of_work import InMemoryUnitOfWork
from app.domain.events import DomainEvent, TamizajeAplicado
from app.domain.shared.errors import EntityNotFoundError
from app.domain.shared.ids import (
    new_caso_id,
    new_cita_id,
    new_paciente_id,
    new_tamizaje_id,
    new_usuario_id,
)
from app.ports.repositories import QuerySpecification


def test_simulated_and_system_clock() -> None:
    base_time = datetime(2026, 8, 14, 12, 0, 0, tzinfo=UTC)
    sim = SimulatedClock(initial_time=base_time)
    assert sim.now() == base_time

    advanced = sim.advance(timedelta(days=2, hours=3))
    assert advanced == datetime(2026, 8, 16, 15, 0, 0, tzinfo=UTC)

    target_time = datetime(2026, 9, 1, 0, 0, 0, tzinfo=UTC)
    sim.set(target_time)
    assert sim.now() == target_time

    # Set naive datetime
    naive_time = datetime(2026, 10, 1, 0, 0, 0)
    sim.set(naive_time)
    assert sim.now().tzinfo == UTC

    sim.reset()
    assert sim.now() == base_time

    sys_clock = SystemClock()
    assert sys_clock.now().year >= 2024


def test_in_memory_event_bus() -> None:
    bus = InMemoryEventBus()
    received_events: list[DomainEvent] = []

    def handler(event: DomainEvent) -> None:
        received_events.append(event)

    bus.subscribe(TamizajeAplicado, handler)

    case_id = new_caso_id()
    evt = TamizajeAplicado(case_id=case_id, actor_id="hw-1", occurred_at=datetime.now(UTC))
    bus.publish(evt)

    assert len(received_events) == 1
    assert received_events[0] == evt
    assert len(bus.published_events) == 1

    bus.clear()
    assert len(bus.published_events) == 0


def test_recording_notifier() -> None:
    notifier = RecordingNotifier()
    res = notifier.send(
        recipient="+51999888777",
        template="cita_recordatorio",
        context={"paciente": "Juan", "fecha": "2026-08-20"},
    )
    assert res.sent is True
    assert "Juan" in res.rendered_content
    assert len(notifier.sent_notifications) == 1

    notifier.clear()
    assert len(notifier.sent_notifications) == 0


def test_in_memory_file_storage() -> None:
    storage = InMemoryFileStorage()
    content = b"fake video content"
    metadata = {"filename": "video.mp4", "content_type": "video/mp4"}

    ref = storage.store(content, metadata)
    assert ref.size_bytes == len(content)
    assert ref.filename == "video.mp4"

    retrieved = storage.retrieve(ref)
    assert retrieved == content

    url = storage.signed_url(ref, expiration_seconds=1800)
    assert ref.file_id in url

    # Default metadata fallback
    ref_default = storage.store(b"abc", {})
    assert ref_default.filename.endswith(".bin")

    storage.clear()
    with pytest.raises(EntityNotFoundError):
        storage.retrieve(ref)


def test_in_memory_unit_of_work() -> None:
    uow = InMemoryUnitOfWork()
    with uow:
        uow.commit()
    assert uow.committed is True
    assert uow.rolled_back is False

    with pytest.raises(RuntimeError):
        with uow:
            raise RuntimeError("Database error")
    assert uow.rolled_back is True


def test_in_memory_repositories() -> None:
    # Generic repository tests
    repo: InMemoryRepository[dict[str, Any], str] = InMemoryRepository(
        entity_name="TestEntity", id_attr="entity_id"
    )
    e1 = {"entity_id": "1", "name": "Item 1", "category": "A"}
    e2 = {"entity_id": "2", "name": "Item 2", "category": "B"}
    repo.add(e1)
    repo.add(e2)

    assert repo.get("1") == e1
    assert repo.exists("1") is True
    assert repo.exists("999") is False

    with pytest.raises(EntityNotFoundError):
        repo.get("999")

    # Update
    repo.update({"entity_id": "1", "name": "Updated 1", "category": "A"})
    assert repo.get("1")["name"] == "Updated 1"

    with pytest.raises(EntityNotFoundError):
        repo.update({"entity_id": "nonexistent", "name": "Nope"})

    # Query Specification filtering, offset, limit
    criteria = QuerySpecification(filters={"category": "A"}, limit=10, offset=0)
    results = repo.find(criteria)
    assert len(results) == 1
    assert results[0]["name"] == "Updated 1"

    # Specific Repositories
    pac_repo = InMemoryPacienteRepository()
    p_id = new_paciente_id()
    pac_repo.add({"paciente_id": p_id, "nombre": "Pedrito"})
    assert pac_repo.get(p_id)["nombre"] == "Pedrito"
    assert pac_repo.exists(p_id) is True

    caso_repo = InMemoryCasoRepository()
    c_id = new_caso_id()
    caso_repo.add({"caso_id": c_id, "paciente_id": p_id, "estado": "DERIVADO"})
    assert caso_repo.get(c_id)["estado"] == "DERIVADO"
    assert caso_repo.get_active_by_paciente(p_id) is not None

    # Inactive case
    caso_repo.update({"caso_id": c_id, "paciente_id": p_id, "estado": "ALTA"})
    assert caso_repo.get_active_by_paciente(p_id) is None

    cita_repo = InMemoryCitaRepository()
    ci_id = new_cita_id()
    cita_repo.add({"cita_id": ci_id, "caso_id": c_id})
    assert cita_repo.get(ci_id)["caso_id"] == c_id

    tam_repo = InMemoryTamizajeRepository()
    t_id = new_tamizaje_id()
    tam_repo.add({"tamizaje_id": t_id, "score": 5})
    assert tam_repo.get(t_id)["score"] == 5

    notif_repo = InMemoryNotificacionRepository()
    notif_repo.add({"notificacion_id": "n1", "recipient": "demo"})
    assert notif_repo.get("n1")["recipient"] == "demo"

    user_repo = InMemoryUsuarioRepository()
    u_id = new_usuario_id()
    user_repo.add({"usuario_id": u_id, "username": "admin@neuroalianza.pe"})
    assert user_repo.get(u_id)["username"] == "admin@neuroalianza.pe"
    assert user_repo.get_by_username("admin@neuroalianza.pe") is not None
    assert user_repo.get_by_username("notfound") is None
