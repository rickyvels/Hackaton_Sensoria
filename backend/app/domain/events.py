"""Domain events catalog."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from app.domain.shared.ids import CasoId, EventoId, new_evento_id


@dataclass(frozen=True)
class DomainEvent:
    """Base class for all domain events."""

    case_id: CasoId
    actor_id: str
    occurred_at: datetime
    event_id: EventoId = field(default_factory=new_evento_id)
    event_type: str = "DomainEvent"
    payload: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class TamizajeAplicado(DomainEvent):
    """Fired when a screening questionnaire is submitted."""

    event_type: str = "TamizajeAplicado"


@dataclass(frozen=True)
class CasoCreado(DomainEvent):
    """Fired when a new case is initiated."""

    event_type: str = "CasoCreado"


@dataclass(frozen=True)
class CasoDerivado(DomainEvent):
    """Fired when a case transitions to DERIVADO."""

    event_type: str = "CasoDerivado"


@dataclass(frozen=True)
class CitaAsignada(DomainEvent):
    """Fired when an appointment is scheduled."""

    event_type: str = "CitaAsignada"


@dataclass(frozen=True)
class CitaConfirmada(DomainEvent):
    """Fired when the caregiver confirms an appointment."""

    event_type: str = "CitaConfirmada"


@dataclass(frozen=True)
class CitaNoAsistida(DomainEvent):
    """Fired when an appointment is missed."""

    event_type: str = "CitaNoAsistida"


@dataclass(frozen=True)
class InasistenciaJustificada(DomainEvent):
    """Fired when the caregiver reports a justification for missing an appointment."""

    event_type: str = "InasistenciaJustificada"


@dataclass(frozen=True)
class EvaluacionIniciada(DomainEvent):
    """Fired when an evaluation block begins."""

    event_type: str = "EvaluacionIniciada"


@dataclass(frozen=True)
class EvaluacionCompletada(DomainEvent):
    """Fired when an evaluation block finishes."""

    event_type: str = "EvaluacionCompletada"


@dataclass(frozen=True)
class DiagnosticoRegistrado(DomainEvent):
    """Fired when a diagnostic conclusion is entered."""

    event_type: str = "DiagnosticoRegistrado"


@dataclass(frozen=True)
class PlanTerapeuticoDefinido(DomainEvent):
    """Fired when the therapeutic plan is established."""

    event_type: str = "PlanTerapeuticoDefinido"


@dataclass(frozen=True)
class ContrarreferenciaEnviada(DomainEvent):
    """Fired when counter-referral communication is sent back to origin."""

    event_type: str = "ContrarreferenciaEnviada"


@dataclass(frozen=True)
class CasoAbandonado(DomainEvent):
    """Fired when a case transitions to ABANDONO."""

    event_type: str = "CasoAbandonado"


@dataclass(frozen=True)
class CasoReactivado(DomainEvent):
    """Fired when a case transitions from ABANDONO back to active state."""

    event_type: str = "CasoReactivado"
