"""In-memory adapters package."""

from __future__ import annotations

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

__all__ = [
    "InMemoryCasoRepository",
    "InMemoryCitaRepository",
    "InMemoryEventBus",
    "InMemoryFileStorage",
    "InMemoryNotificacionRepository",
    "InMemoryPacienteRepository",
    "InMemoryRepository",
    "InMemoryTamizajeRepository",
    "InMemoryUnitOfWork",
    "InMemoryUsuarioRepository",
    "RecordingNotifier",
    "SimulatedClock",
    "SystemClock",
]
