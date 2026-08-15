"""API routes package."""

from __future__ import annotations

from app.api.routes.admin import admin_router
from app.api.routes.family import family_router
from app.api.routes.health_worker import health_worker_router
from app.api.routes.specialist import specialist_router
from app.api.routes.system import system_router

__all__ = [
    "admin_router",
    "family_router",
    "health_worker_router",
    "specialist_router",
    "system_router",
]
