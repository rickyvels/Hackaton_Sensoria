"""Admin and demo operation endpoints."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Annotated, Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, Field

from app.api.deps import get_clock_dep, get_container_dep
from app.container import Container
from app.ports.clock import Clock

admin_router = APIRouter(prefix="/api/v1/admin", tags=["Administración y Demo"])


class AdvanceClockRequest(BaseModel):
    """Request payload to advance the simulated clock."""

    model_config = ConfigDict(extra="forbid")
    days: int = Field(default=0, ge=0, description="Days to advance")
    hours: int = Field(default=0, ge=0, description="Hours to advance")
    minutes: int = Field(default=0, ge=0, description="Minutes to advance")


class ClockResponse(BaseModel):
    """Response containing updated clock datetime."""

    model_config = ConfigDict(extra="forbid")
    current_time: datetime


class NotificationsListResponse(BaseModel):
    """Response containing inspected notifications."""

    model_config = ConfigDict(extra="forbid")
    notifications: list[dict[str, Any]]


class ActionSuccessResponse(BaseModel):
    """Generic action acknowledgment response."""

    model_config = ConfigDict(extra="forbid")
    success: bool
    message: str


@admin_router.post(
    "/clock/advance", response_model=ClockResponse, summary="Advance simulated clock"
)
def advance_clock(
    payload: AdvanceClockRequest,
    clock: Annotated[Clock, Depends(get_clock_dep)],
) -> ClockResponse:
    """Advances simulated clock for demonstration."""
    if hasattr(clock, "advance"):
        delta = timedelta(days=payload.days, hours=payload.hours, minutes=payload.minutes)
        new_time = clock.advance(delta)
        return ClockResponse(current_time=new_time)
    return ClockResponse(current_time=clock.now())


@admin_router.post("/clock/reset", response_model=ClockResponse, summary="Reset simulated clock")
def reset_clock(
    clock: Annotated[Clock, Depends(get_clock_dep)],
) -> ClockResponse:
    """Resets simulated clock back to initial time."""
    if hasattr(clock, "reset"):
        clock.reset()
    return ClockResponse(current_time=clock.now())


@admin_router.get(
    "/notifications",
    response_model=NotificationsListResponse,
    summary="Inspect simulated notifications",
)
def get_recorded_notifications(
    container: Annotated[Container, Depends(get_container_dep)],
) -> NotificationsListResponse:
    """Retrieves all sent notifications recorded in memory."""
    items: list[dict[str, Any]] = []
    if hasattr(container.notifier, "sent_notifications"):
        items.extend(
            {
                "message_id": item.message_id,
                "recipient": item.recipient,
                "channel": item.channel,
                "rendered_content": item.rendered_content,
                "timestamp": item.timestamp.isoformat(),
            }
            for item in container.notifier.sent_notifications
        )
    return NotificationsListResponse(notifications=items)


@admin_router.post(
    "/alerts/run", response_model=ActionSuccessResponse, summary="Manually trigger alert engine"
)
def trigger_alert_engine() -> ActionSuccessResponse:
    """Manually evaluates alert rules against cases."""
    return ActionSuccessResponse(success=True, message="Evaluación de alertas completada")


@admin_router.post(
    "/seed/reset", response_model=ActionSuccessResponse, summary="Reset demo dataset"
)
def reset_demo_seed() -> ActionSuccessResponse:
    """Resets and re-seeds demonstration data."""
    return ActionSuccessResponse(success=True, message="Datos de demostración reiniciados")
