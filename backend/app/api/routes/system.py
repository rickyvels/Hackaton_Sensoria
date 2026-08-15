"""System health and diagnostic endpoints."""

from __future__ import annotations

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, Field

from app.api.deps import get_clock_dep, get_settings_dep
from app.config import Settings
from app.ports.clock import Clock

system_router = APIRouter(tags=["Sistema"])


class HealthResponse(BaseModel):
    """Health check response."""

    model_config = ConfigDict(extra="forbid")
    status: str = Field(..., examples=["ok"])


class SystemInfoResponse(BaseModel):
    """System metadata and configuration overview."""

    model_config = ConfigDict(extra="forbid")
    version: str = Field(..., examples=["0.1.0"])
    mode: str = Field(..., examples=["demo"])
    repository_type: str = Field(..., examples=["memory"])
    notifier_type: str = Field(..., examples=["recording"])
    current_time: datetime = Field(..., examples=["2026-08-14T20:00:00Z"])


@system_router.get("/health", response_model=HealthResponse, summary="Liveness probe")
def health_liveness() -> HealthResponse:
    """Returns basic liveness status."""
    return HealthResponse(status="ok")


@system_router.get("/health/ready", response_model=HealthResponse, summary="Readiness probe")
def health_readiness() -> HealthResponse:
    """Returns readiness status."""
    return HealthResponse(status="ready")


@system_router.get(
    "/api/v1/system/info", response_model=SystemInfoResponse, summary="System information"
)
def get_system_info(
    settings: Annotated[Settings, Depends(get_settings_dep)],
    clock: Annotated[Clock, Depends(get_clock_dep)],
) -> SystemInfoResponse:
    """Returns metadata about system mode and current clock."""
    return SystemInfoResponse(
        version="0.1.0",
        mode=settings.MODE,
        repository_type=settings.REPOSITORY,
        notifier_type=settings.NOTIFIER,
        current_time=clock.now(),
    )
