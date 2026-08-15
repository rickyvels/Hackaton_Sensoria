"""Clock port definition."""

from __future__ import annotations

from datetime import datetime
from typing import Protocol


class Clock(Protocol):
    """Abstract clock port for obtaining current time."""

    def now(self) -> datetime:
        """Returns the current datetime in UTC."""
        ...
