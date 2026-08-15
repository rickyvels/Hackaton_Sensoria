"""FastAPI application entrypoint and composition."""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import override

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

from app.api.errors import register_error_handlers
from app.api.routes import (
    admin_router,
    family_router,
    health_worker_router,
    specialist_router,
    system_router,
)
from app.config import Settings, get_settings
from app.container import get_container


class RequestIdMiddleware(BaseHTTPMiddleware):
    """Middleware that assigns a unique X-Request-Id to every request."""

    @override
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        """Processes request and injects request id header."""
        request_id = request.headers.get("X-Request-Id") or str(uuid.uuid4())
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-Id"] = request_id
        return response


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Application lifespan context for startup and shutdown hooks."""
    _ = get_container()
    yield


def create_app(settings: Settings | None = None) -> FastAPI:
    """Factory creating and configuring the FastAPI application."""
    active_settings = settings or get_settings()

    app = FastAPI(
        title="Neuroalianza Backend API",
        description="Plataforma de detección y seguimiento para neurodesarrollo infantil (MINSA)",
        version="0.1.0",
        lifespan=lifespan,
    )

    # 1. Middlewares
    app.add_middleware(
        CORSMiddleware,
        allow_origins=active_settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(RequestIdMiddleware)

    # 2. Error handlers (RFC 7807)
    register_error_handlers(app)

    # 3. Routes
    app.include_router(system_router)
    app.include_router(health_worker_router)
    app.include_router(family_router)
    app.include_router(specialist_router)

    # Demo routes are only registered in demo mode
    if active_settings.MODE == "demo":
        app.include_router(admin_router)

    return app


app = create_app()
