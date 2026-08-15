"""In-memory synchronous event bus adapter."""

from __future__ import annotations

from collections import defaultdict
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.domain.events import DomainEvent
    from app.ports.event_bus import EventHandler


class InMemoryEventBus:
    """In-memory event bus that dispatches events synchronously to registered subscribers."""

    def __init__(self) -> None:
        """Initializes empty subscription registry and event history log."""
        self._subscribers: dict[type[DomainEvent], list[EventHandler]] = defaultdict(list)
        self._published_events: list[DomainEvent] = []

    def subscribe(self, event_type: type[DomainEvent], handler: EventHandler) -> None:
        """Subscribes a handler to a specific event type."""
        self._subscribers[event_type].append(handler)

    def publish(self, event: DomainEvent) -> None:
        """Publishes a domain event and executes all registered handlers synchronously."""
        self._published_events.append(event)
        event_cls = type(event)
        # Direct subscribers for this event class
        for handler in self._subscribers.get(event_cls, []):
            handler(event)
        # Also invoke subscribers for base types if registered
        for sub_cls, handlers in self._subscribers.items():
            if sub_cls is not event_cls and issubclass(event_cls, sub_cls):
                for handler in handlers:
                    handler(event)

    @property
    def published_events(self) -> list[DomainEvent]:
        """Returns read-only copy of all published events."""
        return list(self._published_events)

    def clear(self) -> None:
        """Clears the event log and subscribers."""
        self._published_events.clear()
        self._subscribers.clear()
