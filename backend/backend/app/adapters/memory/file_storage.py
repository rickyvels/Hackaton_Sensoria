"""In-memory file storage adapter."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from app.domain.shared.errors import EntityNotFoundError
from app.ports.file_storage import ReferenciaArchivo


class InMemoryFileStorage:
    """Stores files in memory dictionary and produces fictitious signed URLs."""

    def __init__(self, base_url: str = "https://storage.neuroalianza.pe/files") -> None:
        """Initializes storage."""
        self._base_url = base_url
        self._files: dict[str, tuple[bytes, ReferenciaArchivo]] = {}

    def store(self, content: bytes, metadata: dict[str, str]) -> ReferenciaArchivo:
        """Stores file content and creates reference."""
        file_id = str(uuid.uuid4())
        filename = metadata.get("filename", f"{file_id}.bin")
        content_type = metadata.get("content_type", "application/octet-stream")
        ref = ReferenciaArchivo(
            file_id=file_id,
            filename=filename,
            content_type=content_type,
            size_bytes=len(content),
            created_at=datetime.now(UTC),
            metadata=metadata,
        )
        self._files[file_id] = (content, ref)
        return ref

    def retrieve(self, reference: ReferenciaArchivo) -> bytes:
        """Retrieves file bytes by reference."""
        if reference.file_id not in self._files:
            raise EntityNotFoundError("File", reference.file_id)
        return self._files[reference.file_id][0]

    def signed_url(self, reference: ReferenciaArchivo, expiration_seconds: int = 3600) -> str:
        """Generates fictitious signed URL."""
        return f"{self._base_url}/{reference.file_id}?expires={expiration_seconds}"

    def clear(self) -> None:
        """Clears all stored files."""
        self._files.clear()
