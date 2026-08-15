"""Result pattern for fallible domain operations."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Generic, TypeVar

T = TypeVar("T")
E = TypeVar("E")


@dataclass(frozen=True)
class Ok(Generic[T]):
    """Represents a successful operation result."""

    value: T

    def is_ok(self) -> bool:
        """Returns True if the result is Ok."""
        return True

    def is_err(self) -> bool:
        """Returns False if the result is Ok."""
        return False

    def unwrap(self) -> T:
        """Returns the contained value."""
        return self.value

    def unwrap_err(self) -> None:
        """Raises ValueError because Ok has no error."""
        raise ValueError("Called unwrap_err on Ok")


@dataclass(frozen=True)
class Err(Generic[E]):
    """Represents a failed operation result."""

    error: E

    def is_ok(self) -> bool:
        """Returns False if the result is Err."""
        return False

    def is_err(self) -> bool:
        """Returns True if the result is Err."""
        return True

    def unwrap(self) -> None:
        """Raises ValueError because Err has no success value."""
        raise ValueError(f"Called unwrap on Err: {self.error}")

    def unwrap_err(self) -> E:
        """Returns the contained error."""
        return self.error


Result = Ok[T] | Err[E]
