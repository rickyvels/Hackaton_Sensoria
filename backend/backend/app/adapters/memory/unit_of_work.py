"""In-memory Unit of Work adapter."""

from __future__ import annotations

from types import TracebackType
from typing import Self


class InMemoryUnitOfWork:
    """In-memory transaction context manager simulating commit and rollback."""

    def __init__(self) -> None:
        """Initializes unit of work state."""
        self.committed = False
        self.rolled_back = False

    def __enter__(self) -> Self:
        """Enters transaction."""
        self.committed = False
        self.rolled_back = False
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc_val: BaseException | None,
        exc_tb: TracebackType | None,
    ) -> bool | None:
        """Exits transaction, triggering rollback if an unhandled exception occurred."""
        if exc_type is not None:
            self.rollback()
        return None

    def commit(self) -> None:
        """Marks transaction as committed."""
        self.committed = True

    def rollback(self) -> None:
        """Marks transaction as rolled back."""
        self.rolled_back = True
