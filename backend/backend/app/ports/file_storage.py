"""File storage port definition."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Protocol


@dataclass(frozen=True)
class ReferenciaArchivo:
    """Represents a stored file reference."""

    file_id: str
    filename: str
    content_type: str
    size_bytes: int
    created_at: datetime
    metadata: dict[str, str]


class FileStorage(Protocol):
    """Abstract file storage port."""

    def store(self, content: bytes, metadata: dict[str, str]) -> ReferenciaArchivo:
        """Stores a byte content and returns a file reference."""
        ...

    def retrieve(self, reference: ReferenciaArchivo) -> bytes:
        """Retrieves the raw bytes of a file reference."""
        ...

    def signed_url(self, reference: ReferenciaArchivo, expiration_seconds: int = 3600) -> str:
        """Generates a secure temporary download URL for the file."""
        ...
