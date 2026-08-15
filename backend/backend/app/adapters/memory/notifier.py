"""In-memory inspectable notification adapter."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from app.ports.notifier import ResultadoEnvio


class RecordingNotifier:
    """Recording notifier that logs rendered notifications in memory for inspection."""

    def __init__(self) -> None:
        """Initializes empty notification log."""
        self._sent_notifications: list[ResultadoEnvio] = []

    def send(self, recipient: str, template: str, context: dict[str, Any]) -> ResultadoEnvio:
        """Renders simulated template and stores the result."""
        rendered = f"[{template}] Para: {recipient} | Datos: {context}"
        result = ResultadoEnvio(
            sent=True,
            message_id=str(uuid.uuid4()),
            recipient=recipient,
            channel="simulated",
            rendered_content=rendered,
            timestamp=datetime.now(UTC),
        )
        self._sent_notifications.append(result)
        return result

    @property
    def sent_notifications(self) -> list[ResultadoEnvio]:
        """Returns all recorded notifications."""
        return list(self._sent_notifications)

    def clear(self) -> None:
        """Clears the recorded notifications."""
        self._sent_notifications.clear()
