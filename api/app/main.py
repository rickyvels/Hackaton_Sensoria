from __future__ import annotations

import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import get_settings
from .database import Base, SessionLocal, engine
from .migrations import ensure_orchestration_schema
from .orchestration import orchestration_manager
from .routers import auth, cases, family, orchestration, professional
from .seed import seed_demo_data


@asynccontextmanager
async def lifespan(_: FastAPI):
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
        await ensure_orchestration_schema(connection)
    if engine.url.get_backend_name() == "sqlite" and engine.url.database:
        database_path = Path(engine.url.database)
        if database_path.exists():
            os.chmod(database_path, 0o600)
    if settings.environment.lower() == "demo":
        async with SessionLocal() as session:
            async with session.begin():
                await seed_demo_data(session)
    await orchestration_manager.start()
    await orchestration_manager.recover()
    yield
    await orchestration_manager.stop()


settings = get_settings()
app = FastAPI(title=settings.app_name, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(family.router, prefix=settings.api_prefix)
app.include_router(professional.router, prefix=settings.api_prefix)
app.include_router(cases.router, prefix=settings.api_prefix)
app.include_router(orchestration.router, prefix=settings.api_prefix)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
    if request.url.path.startswith(settings.api_prefix):
        response.headers["Cache-Control"] = "no-store, private"
    return response


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, __: Exception) -> JSONResponse:
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})
