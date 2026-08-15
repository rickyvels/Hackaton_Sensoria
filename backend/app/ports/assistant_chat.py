"""Assistant chat client port definitions."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal, Protocol


@dataclass(frozen=True)
class AssistantMessage:
    """Represents a chat turn sent to the language model."""

    role: Literal["system", "user", "assistant"]
    content: str


class AssistantChatClient(Protocol):
    """Abstract async client for assistant completions."""

    async def complete(self, *, model: str, messages: list[AssistantMessage]) -> str:
        """Generates a completion from the configured model."""
        ...
