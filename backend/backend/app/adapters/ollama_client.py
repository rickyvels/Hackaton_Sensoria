"""Async Ollama adapter for local language-model completions."""

from __future__ import annotations

from typing import override

import httpx

from app.ports.assistant_chat import AssistantChatClient, AssistantMessage


class OllamaClientError(RuntimeError):
    """Raised when the Ollama adapter cannot produce a completion."""


class OllamaAssistantChatClient(AssistantChatClient):
    """HTTP client that sends chat completions to a local Ollama server."""

    def __init__(self, *, base_url: str, timeout_seconds: float) -> None:
        """Configures the target Ollama endpoint and request timeout."""
        self._base_url = base_url.rstrip("/")
        self._timeout_seconds = timeout_seconds

    @override
    async def complete(self, *, model: str, messages: list[AssistantMessage]) -> str:
        """Requests a non-streaming chat completion from Ollama."""
        payload = {
            "model": model,
            "stream": False,
            "think": False,
            "options": {"num_predict": 350},
            "messages": [
                {
                    "role": message.role,
                    "content": message.content,
                }
                for message in messages
            ],
        }
        try:
            async with httpx.AsyncClient(timeout=self._timeout_seconds) as client:
                response = await client.post(f"{self._base_url}/api/chat", json=payload)
                response.raise_for_status()
        except httpx.HTTPError as exc:
            msg = "No fue posible conectarse con Ollama."
            raise OllamaClientError(msg) from exc

        try:
            data = response.json()
        except ValueError as exc:
            msg = "Ollama respondió con un formato inválido."
            raise OllamaClientError(msg) from exc
        content = data.get("message", {}).get("content")
        if not isinstance(content, str) or not content.strip():
            msg = "Ollama respondió sin contenido utilizable."
            raise OllamaClientError(msg)
        return content.strip()
