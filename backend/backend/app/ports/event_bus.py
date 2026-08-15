"""Event bus port definition."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any, Protocol, TypeVar

from app.domain.events import DomainEvent

E_contra = TypeVar("E_contra", bound=DomainEvent, contravariant=True)
EventHandler = Callable[[Any], None]


class EventBus(Protocol):
    """Abstract event bus for publishing domain events and subscribing handlers."""

    def publish(self, event: DomainEvent) -> None:
        """Publishes a domain event to all registered subscribers."""
        ...

    def subscribe(self, event_type: type[DomainEvent], handler: EventHandler) -> None:
        """Subscribes an event handler to a specific domain event type."""
        ...
