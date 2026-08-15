"""Ports layer containing abstract protocols and interfaces."""

from __future__ import annotations

from app.ports.assistant_chat import AssistantChatClient, AssistantMessage
from app.ports.clock import Clock
from app.ports.event_bus import EventBus, EventHandler
from app.ports.file_storage import FileStorage, ReferenciaArchivo
from app.ports.knowledge_base import KnowledgeBase, KnowledgeBaseDocument
from app.ports.notifier import Notifier, ResultadoEnvio
from app.ports.repositories import (
    CasoRepository,
    CitaRepository,
    NotificacionRepository,
    PacienteRepository,
    QuerySpecification,
    Repository,
    TamizajeRepository,
    UsuarioRepository,
)
from app.ports.unit_of_work import UnitOfWork

__all__ = [
    "AssistantChatClient",
    "AssistantMessage",
    "CasoRepository",
    "CitaRepository",
    "Clock",
    "EventBus",
    "EventHandler",
    "FileStorage",
    "KnowledgeBase",
    "KnowledgeBaseDocument",
    "NotificacionRepository",
    "Notifier",
    "PacienteRepository",
    "QuerySpecification",
    "ReferenciaArchivo",
    "Repository",
    "ResultadoEnvio",
    "TamizajeRepository",
    "UnitOfWork",
    "UsuarioRepository",
]
