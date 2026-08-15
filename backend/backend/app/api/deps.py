"""Dependency injection helpers for FastAPI route handlers."""

from __future__ import annotations

from app.config import Settings
from app.container import Container, get_container
from app.ports.assistant_chat import AssistantChatClient
from app.ports.clock import Clock
from app.ports.event_bus import EventBus
from app.ports.file_storage import FileStorage
from app.ports.knowledge_base import KnowledgeBase
from app.ports.notifier import Notifier
from app.ports.repositories import (
    CasoRepository,
    CitaRepository,
    NotificacionRepository,
    PacienteRepository,
    TamizajeRepository,
    UsuarioRepository,
)
from app.ports.unit_of_work import UnitOfWork


def get_container_dep() -> Container:
    """Returns application container."""
    return get_container()


def get_settings_dep() -> Settings:
    """Returns application configuration settings."""
    return get_container().settings


def get_clock_dep() -> Clock:
    """Returns Clock port instance."""
    return get_container().clock


def get_event_bus_dep() -> EventBus:
    """Returns EventBus port instance."""
    return get_container().event_bus


def get_notifier_dep() -> Notifier:
    """Returns Notifier port instance."""
    return get_container().notifier


def get_file_storage_dep() -> FileStorage:
    """Returns FileStorage port instance."""
    return get_container().file_storage


def get_knowledge_base_dep() -> KnowledgeBase:
    """Returns KnowledgeBase port instance."""
    return get_container().knowledge_base


def get_assistant_chat_dep() -> AssistantChatClient:
    """Returns AssistantChatClient port instance."""
    return get_container().assistant_chat


def get_unit_of_work_dep() -> UnitOfWork:
    """Returns UnitOfWork port instance."""
    return get_container().unit_of_work


def get_paciente_repo_dep() -> PacienteRepository:
    """Returns PacienteRepository port instance."""
    return get_container().paciente_repo


def get_caso_repo_dep() -> CasoRepository:
    """Returns CasoRepository port instance."""
    return get_container().caso_repo


def get_cita_repo_dep() -> CitaRepository:
    """Returns CitaRepository port instance."""
    return get_container().cita_repo


def get_tamizaje_repo_dep() -> TamizajeRepository:
    """Returns TamizajeRepository port instance."""
    return get_container().tamizaje_repo


def get_notificacion_repo_dep() -> NotificacionRepository:
    """Returns NotificacionRepository port instance."""
    return get_container().notificacion_repo


def get_usuario_repo_dep() -> UsuarioRepository:
    """Returns UsuarioRepository port instance."""
    return get_container().usuario_repo
