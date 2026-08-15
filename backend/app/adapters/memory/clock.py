"""In-memory simulated clock adapter."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta


class SimulatedClock:
    """Simulated clock for controlling and manipulating time in tests and demos."""

    def __init__(self, initial_time: datetime | None = None) -> None:
        """Initializes simulated clock with initial time or current UTC time."""
        self._current_time = initial_time or datetime.now(UTC)
        self._initial_time = self._current_time

    def now(self) -> datetime:
        """Returns the simulated current UTC datetime."""
        return self._current_time

    def advance(self, delta: timedelta) -> datetime:
        """Advances the simulated clock by the specified delta."""
        self._current_time += delta
        return self._current_time

    def set(self, target: datetime) -> datetime:
        """Sets the simulated clock to a specific datetime."""
        if target.tzinfo is None:
            self._current_time = target.replace(tzinfo=UTC)
        else:
            self._current_time = target
        return self._current_time

    def reset(self) -> None:
        """Resets the clock back to its initial time."""
        self._current_time = self._initial_time


class SystemClock:
    """Real system clock adapter."""

    def now(self) -> datetime:
        """Returns the real current system UTC datetime."""
        return datetime.now(UTC)
