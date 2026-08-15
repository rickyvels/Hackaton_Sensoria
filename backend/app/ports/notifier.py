"""Notifier port definition."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Protocol


@dataclass(frozen=True)
class ResultadoEnvio:
    """Represents the outcome of a notification dispatch."""

    sent: bool
    message_id: str
    recipient: str
    channel: str
    rendered_content: str
    timestamp: datetime
    error_message: str | None = None


class Notifier(Protocol):
    """Abstract notifier port for dispatching communications."""

    def send(self, recipient: str, template: str, context: dict[str, Any]) -> ResultadoEnvio:
        """Renders and sends a message to the recipient using their configured channel.

        Args:
            recipient: Recipient identifier, phone number or email address.
            template: Name or identifier of the message template.
            context: Variables used to render the message.

        Returns:
            ResultadoEnvio outcome.
        """
        ...
