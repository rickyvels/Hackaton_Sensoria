"""Health worker endpoints router."""

from __future__ import annotations

from fastapi import APIRouter

health_worker_router = APIRouter(prefix="/api/v1/health-worker", tags=["Personal de Salud"])
