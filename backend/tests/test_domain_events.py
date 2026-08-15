"""Tests for domain events catalog."""

from __future__ import annotations

from datetime import UTC, datetime

from app.domain.events import (
    CasoAbandonado,
    CasoCreado,
    CasoDerivado,
    CasoReactivado,
    CitaAsignada,
    CitaConfirmada,
    CitaNoAsistida,
    ContrarreferenciaEnviada,
    DiagnosticoRegistrado,
    EvaluacionCompletada,
    EvaluacionIniciada,
    InasistenciaJustificada,
    PlanTerapeuticoDefinido,
    TamizajeAplicado,
)
from app.domain.shared.ids import new_caso_id


def test_domain_events_creation_and_fields() -> None:
    case_id = new_caso_id()
    now = datetime.now(UTC)

    evt = TamizajeAplicado(
        case_id=case_id,
        actor_id="user-1",
        occurred_at=now,
        payload={"score": 10},
    )
    assert evt.event_type == "TamizajeAplicado"
    assert evt.case_id == case_id
    assert evt.actor_id == "user-1"
    assert evt.payload == {"score": 10}

    # Verify other events instantiate cleanly
    events = [
        CasoCreado(case_id=case_id, actor_id="a1", occurred_at=now),
        CasoDerivado(case_id=case_id, actor_id="a1", occurred_at=now),
        CitaAsignada(case_id=case_id, actor_id="a1", occurred_at=now),
        CitaConfirmada(case_id=case_id, actor_id="a1", occurred_at=now),
        CitaNoAsistida(case_id=case_id, actor_id="a1", occurred_at=now),
        InasistenciaJustificada(case_id=case_id, actor_id="a1", occurred_at=now),
        EvaluacionIniciada(case_id=case_id, actor_id="a1", occurred_at=now),
        EvaluacionCompletada(case_id=case_id, actor_id="a1", occurred_at=now),
        DiagnosticoRegistrado(case_id=case_id, actor_id="a1", occurred_at=now),
        PlanTerapeuticoDefinido(case_id=case_id, actor_id="a1", occurred_at=now),
        ContrarreferenciaEnviada(case_id=case_id, actor_id="a1", occurred_at=now),
        CasoAbandonado(case_id=case_id, actor_id="a1", occurred_at=now),
        CasoReactivado(case_id=case_id, actor_id="a1", occurred_at=now),
    ]
    for e in events:
        assert e.case_id == case_id
        assert e.event_id is not None
