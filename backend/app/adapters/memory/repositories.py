"""In-memory repository implementations."""

from __future__ import annotations

from typing import Any, Generic, TypeVar

from app.domain.shared.errors import EntityNotFoundError
from app.domain.shared.ids import (
    CasoId,
    CitaId,
    PacienteId,
    TamizajeId,
    UsuarioId,
)
from app.ports.repositories import QuerySpecification

T = TypeVar("T")
ID_t = TypeVar("ID_t", bound=str)


class InMemoryRepository(Generic[T, ID_t]):
    """Base generic in-memory dictionary repository."""

    def __init__(self, entity_name: str, id_attr: str = "id") -> None:
        """Initializes repository with entity name and identity attribute."""
        self._entity_name = entity_name
        self._id_attr = id_attr
        self._storage: dict[str, Any] = {}

    def _get_id(self, entity: Any) -> str:
        """Extracts identifier string from entity."""
        if hasattr(entity, self._id_attr):
            return str(getattr(entity, self._id_attr))
        if isinstance(entity, dict) and self._id_attr in entity:
            return str(entity[self._id_attr])
        msg = f"Entity missing identity attribute '{self._id_attr}'"
        raise ValueError(msg)

    def add(self, entity: Any) -> None:
        """Adds entity to in-memory store."""
        entity_id = self._get_id(entity)
        self._storage[entity_id] = entity

    def get(self, entity_id: ID_t | str) -> Any:
        """Retrieves entity by id or raises EntityNotFoundError."""
        str_id = str(entity_id)
        if str_id not in self._storage:
            raise EntityNotFoundError(self._entity_name, str_id)
        return self._storage[str_id]

    def find(self, criteria: QuerySpecification | None = None) -> list[Any]:
        """Finds entities matching criteria."""
        items = list(self._storage.values())
        if criteria and criteria.filters:
            filtered: list[Any] = []
            for item in items:
                matches = True
                for key, val in criteria.filters.items():
                    item_val = (
                        getattr(item, key, None)
                        if hasattr(item, key)
                        else item.get(key)
                        if isinstance(item, dict)
                        else None
                    )
                    if item_val != val:
                        matches = False
                        break
                if matches:
                    filtered.append(item)
            items = filtered
        if criteria and criteria.offset:
            items = items[criteria.offset :]
        if criteria and criteria.limit:
            items = items[: criteria.limit]
        return items

    def update(self, entity: Any) -> None:
        """Updates existing entity."""
        entity_id = self._get_id(entity)
        if entity_id not in self._storage:
            raise EntityNotFoundError(self._entity_name, entity_id)
        self._storage[entity_id] = entity

    def exists(self, entity_id: ID_t | str) -> bool:
        """Checks if entity exists."""
        return str(entity_id) in self._storage

    def clear(self) -> None:
        """Clears all entities."""
        self._storage.clear()


class InMemoryPacienteRepository(InMemoryRepository[Any, PacienteId]):
    """In-memory repository for Pacientes."""

    def __init__(self) -> None:
        """Initializes with Paciente identity."""
        super().__init__(entity_name="Paciente", id_attr="paciente_id")


class InMemoryCasoRepository(InMemoryRepository[Any, CasoId]):
    """In-memory repository for Casos."""

    def __init__(self) -> None:
        """Initializes with Caso identity."""
        super().__init__(entity_name="Caso", id_attr="caso_id")

    def get_active_by_paciente(self, paciente_id: PacienteId) -> Any | None:
        """Retrieves active case for a patient."""
        terminal_states = {"SIN_RIESGO", "ALTA"}
        for case in self._storage.values():
            case_paciente_id = (
                getattr(case, "paciente_id", None)
                if hasattr(case, "paciente_id")
                else case.get("paciente_id")
            )
            case_estado = (
                getattr(case, "estado", None) if hasattr(case, "estado") else case.get("estado")
            )
            if str(case_paciente_id) == str(paciente_id) and case_estado not in terminal_states:
                return case
        return None


class InMemoryCitaRepository(InMemoryRepository[Any, CitaId]):
    """In-memory repository for Citas."""

    def __init__(self) -> None:
        """Initializes with Cita identity."""
        super().__init__(entity_name="Cita", id_attr="cita_id")


class InMemoryTamizajeRepository(InMemoryRepository[Any, TamizajeId]):
    """In-memory repository for Tamizajes."""

    def __init__(self) -> None:
        """Initializes with Tamizaje identity."""
        super().__init__(entity_name="Tamizaje", id_attr="tamizaje_id")


class InMemoryNotificacionRepository(InMemoryRepository[Any, str]):
    """In-memory repository for Notificaciones."""

    def __init__(self) -> None:
        """Initializes with Notificacion identity."""
        super().__init__(entity_name="Notificacion", id_attr="notificacion_id")


class InMemoryUsuarioRepository(InMemoryRepository[Any, UsuarioId]):
    """In-memory repository for Usuarios."""

    def __init__(self) -> None:
        """Initializes with Usuario identity."""
        super().__init__(entity_name="Usuario", id_attr="usuario_id")

    def get_by_username(self, username: str) -> Any | None:
        """Retrieves usuario by username or email."""
        for user in self._storage.values():
            u_name = (
                getattr(user, "username", None)
                if hasattr(user, "username")
                else user.get("username")
            )
            if u_name == username:
                return user
        return None
