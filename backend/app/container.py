"""Composition root: the only module authorized to import concrete adapters."""

from __future__ import annotations

from pathlib import Path

from app.adapters.local_knowledge_base import FileSystemKnowledgeBase
from app.adapters.memory.clock import SimulatedClock, SystemClock
from app.adapters.memory.event_bus import InMemoryEventBus
from app.adapters.memory.file_storage import InMemoryFileStorage
from app.adapters.memory.notifier import RecordingNotifier
from app.adapters.memory.repositories import (
    InMemoryCasoRepository,
    InMemoryCitaRepository,
    InMemoryNotificacionRepository,
    InMemoryPacienteRepository,
    InMemoryTamizajeRepository,
    InMemoryUsuarioRepository,
)
from app.adapters.memory.unit_of_work import InMemoryUnitOfWork
from app.adapters.ollama_client import OllamaAssistantChatClient
from app.config import Settings, get_settings
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


class Container:
    """Dependency injection container and composition root."""

    def __init__(self, settings: Settings | None = None) -> None:
        """Builds and wires application components based on settings."""
        self.settings = settings or get_settings()

        # 1. Clock
        if self.settings.CLOCK == "simulated":
            self.clock: Clock = SimulatedClock()
        else:
            self.clock = SystemClock()

        # 2. Event Bus
        self.event_bus: EventBus = InMemoryEventBus()

        # 3. Notifier
        self.notifier: Notifier = RecordingNotifier()

        # 4. File Storage
        self.file_storage: FileStorage = InMemoryFileStorage()

        # 5. Family assistant infrastructure
        project_root = Path(__file__).resolve().parents[1]
        knowledge_base_path = Path(self.settings.KNOWLEDGE_BASE_PATH)
        if not knowledge_base_path.is_absolute():
            knowledge_base_path = project_root / knowledge_base_path
        self.knowledge_base: KnowledgeBase = FileSystemKnowledgeBase(knowledge_base_path)
        self.assistant_chat: AssistantChatClient = OllamaAssistantChatClient(
            base_url=self.settings.OLLAMA_URL,
            timeout_seconds=self.settings.OLLAMA_TIMEOUT_SECONDS,
        )

        # 6. Unit of Work
        self.unit_of_work: UnitOfWork = InMemoryUnitOfWork()

        # 7. Repositories
        self.paciente_repo: PacienteRepository = InMemoryPacienteRepository()
        self.caso_repo: CasoRepository = InMemoryCasoRepository()
        self.cita_repo: CitaRepository = InMemoryCitaRepository()
        self.tamizaje_repo: TamizajeRepository = InMemoryTamizajeRepository()
        self.notificacion_repo: NotificacionRepository = InMemoryNotificacionRepository()
        self.usuario_repo: UsuarioRepository = InMemoryUsuarioRepository()


_container_instance: Container | None = None


def get_container() -> Container:
    """Returns or creates the global container singleton."""
    global _container_instance
    if _container_instance is None:
        _container_instance = Container()
    return _container_instance


def reset_container(settings: Settings | None = None) -> Container:
    """Resets and re-creates container (useful in tests)."""
    global _container_instance
    _container_instance = Container(settings=settings)
    return _container_instance
