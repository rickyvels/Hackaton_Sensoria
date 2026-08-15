"""Shared domain identity types."""

from __future__ import annotations

import uuid
from typing import NewType

PacienteId = NewType("PacienteId", str)
CuidadorId = NewType("CuidadorId", str)
CasoId = NewType("CasoId", str)
TamizajeId = NewType("TamizajeId", str)
CitaId = NewType("CitaId", str)
NotaClinicaId = NewType("NotaClinicaId", str)
PlanTerapeuticoId = NewType("PlanTerapeuticoId", str)
UsuarioId = NewType("UsuarioId", str)
TransicionId = NewType("TransicionId", str)
EventoId = NewType("EventoId", str)
ActividadId = NewType("ActividadId", str)


def generate_id() -> str:
    """Generates a unique identifier string (UUID)."""
    return str(uuid.uuid4())


def new_paciente_id() -> PacienteId:
    """Creates a new PacienteId."""
    return PacienteId(generate_id())


def new_cuidador_id() -> CuidadorId:
    """Creates a new CuidadorId."""
    return CuidadorId(generate_id())


def new_caso_id() -> CasoId:
    """Creates a new CasoId."""
    return CasoId(generate_id())


def new_tamizaje_id() -> TamizajeId:
    """Creates a new TamizajeId."""
    return TamizajeId(generate_id())


def new_cita_id() -> CitaId:
    """Creates a new CitaId."""
    return CitaId(generate_id())


def new_nota_clinica_id() -> NotaClinicaId:
    """Creates a new NotaClinicaId."""
    return NotaClinicaId(generate_id())


def new_plan_terapeutico_id() -> PlanTerapeuticoId:
    """Creates a new PlanTerapeuticoId."""
    return PlanTerapeuticoId(generate_id())


def new_usuario_id() -> UsuarioId:
    """Creates a new UsuarioId."""
    return UsuarioId(generate_id())


def new_transicion_id() -> TransicionId:
    """Creates a new TransicionId."""
    return TransicionId(generate_id())


def new_evento_id() -> EventoId:
    """Creates a new EventoId."""
    return EventoId(generate_id())


def new_actividad_id() -> ActividadId:
    """Creates a new ActividadId."""
    return ActividadId(generate_id())
