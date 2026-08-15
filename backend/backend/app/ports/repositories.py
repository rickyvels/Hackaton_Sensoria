"""Repository port interfaces for domain aggregates."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Protocol, TypeVar

from app.domain.shared.ids import (
    CasoId,
    CitaId,
    PacienteId,
    TamizajeId,
    UsuarioId,
)

T = TypeVar("T")
ID_contra = TypeVar("ID_contra", contravariant=True)


@dataclass(frozen=True)
class QuerySpecification:
    """Specification object for typed repository queries."""

    filters: dict[str, Any]
    limit: int | None = None
    offset: int | None = None
    order_by: str | None = None


class Repository(Protocol[T, ID_contra]):
    """Generic repository protocol."""

    def add(self, entity: T) -> None:
        """Adds a new entity to the repository."""
        ...

    def get(self, entity_id: ID_contra) -> T:
        """Retrieves an entity by its identifier.

        Raises:
            EntityNotFoundError: If entity does not exist.
        """
        ...

    def find(self, criteria: QuerySpecification | None = None) -> list[T]:
        """Finds entities matching the query specification."""
        ...

    def update(self, entity: T) -> None:
        """Updates an existing entity."""
        ...

    def exists(self, entity_id: ID_contra) -> bool:
        """Checks if an entity exists by identifier."""
        ...


class PacienteRepository(Protocol):
    """Repository port for Paciente aggregate."""

    def add(self, entity: Any) -> None:
        """Adds a new patient."""
        ...

    def get(self, entity_id: PacienteId) -> Any:
        """Gets a patient by id."""
        ...

    def find(self, criteria: QuerySpecification | None = None) -> list[Any]:
        """Finds patients by criteria."""
        ...

    def update(self, entity: Any) -> None:
        """Updates patient."""
        ...

    def exists(self, entity_id: PacienteId) -> bool:
        """Checks existence."""
        ...


class CasoRepository(Protocol):
    """Repository port for Caso aggregate."""

    def add(self, entity: Any) -> None:
        """Adds a new case."""
        ...

    def get(self, entity_id: CasoId) -> Any:
        """Gets a case by id."""
        ...

    def find(self, criteria: QuerySpecification | None = None) -> list[Any]:
        """Finds cases by criteria."""
        ...

    def get_active_by_paciente(self, paciente_id: PacienteId) -> Any | None:
        """Retrieves the currently active case for a patient if one exists."""
        ...

    def update(self, entity: Any) -> None:
        """Updates case."""
        ...

    def exists(self, entity_id: CasoId) -> bool:
        """Checks existence."""
        ...


class CitaRepository(Protocol):
    """Repository port for Cita aggregate."""

    def add(self, entity: Any) -> None:
        """Adds a new appointment."""
        ...

    def get(self, entity_id: CitaId) -> Any:
        """Gets an appointment by id."""
        ...

    def find(self, criteria: QuerySpecification | None = None) -> list[Any]:
        """Finds appointments by criteria."""
        ...

    def update(self, entity: Any) -> None:
        """Updates appointment."""
        ...

    def exists(self, entity_id: CitaId) -> bool:
        """Checks existence."""
        ...


class TamizajeRepository(Protocol):
    """Repository port for Tamizaje aggregate."""

    def add(self, entity: Any) -> None:
        """Adds a new screening result."""
        ...

    def get(self, entity_id: TamizajeId) -> Any:
        """Gets a screening result by id."""
        ...

    def find(self, criteria: QuerySpecification | None = None) -> list[Any]:
        """Finds screenings by criteria."""
        ...

    def update(self, entity: Any) -> None:
        """Updates screening."""
        ...

    def exists(self, entity_id: TamizajeId) -> bool:
        """Checks existence."""
        ...


class NotificacionRepository(Protocol):
    """Repository port for Notificacion log."""

    def add(self, entity: Any) -> None:
        """Adds a notification record."""
        ...

    def get(self, entity_id: str) -> Any:
        """Gets a notification by id."""
        ...

    def find(self, criteria: QuerySpecification | None = None) -> list[Any]:
        """Finds notifications by criteria."""
        ...

    def update(self, entity: Any) -> None:
        """Updates notification record."""
        ...

    def exists(self, entity_id: str) -> bool:
        """Checks existence."""
        ...


class UsuarioRepository(Protocol):
    """Repository port for Usuario aggregate."""

    def add(self, entity: Any) -> None:
        """Adds a user."""
        ...

    def get(self, entity_id: UsuarioId) -> Any:
        """Gets a user by id."""
        ...

    def get_by_username(self, username: str) -> Any | None:
        """Gets a user by username/email."""
        ...

    def find(self, criteria: QuerySpecification | None = None) -> list[Any]:
        """Finds users by criteria."""
        ...

    def update(self, entity: Any) -> None:
        """Updates user."""
        ...

    def exists(self, entity_id: UsuarioId) -> bool:
        """Checks existence."""
        ...
