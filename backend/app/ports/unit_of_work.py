"""Unit of Work port definition."""

from __future__ import annotations

from types import TracebackType
from typing import Protocol, Self


class UnitOfWork(Protocol):
    """Abstract Unit of Work context manager for atomic operations."""

    def __enter__(self) -> Self:
        """Enters the transaction context."""
        ...

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc_val: BaseException | None,
        exc_tb: TracebackType | None,
    ) -> bool | None:
        """Exits the transaction context, rolling back if exception occurred."""
        ...

    def commit(self) -> None:
        """Commits all pending operations in the transaction."""
        ...

    def rollback(self) -> None:
        """Rolls back all pending operations in the transaction."""
        ...
