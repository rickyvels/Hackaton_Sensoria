from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import get_settings
from .routers import auth, cases, family, orchestration, professional
from .startup import ensure_ready, shutdown


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Un servidor de larga vida puede preparar todo por adelantado. En serverless el ciclo de
    # vida no es un punto fiable de arranque, así que `ensure_ready` también se llama por
    # petición: es idempotente y sale de inmediato una vez la instancia está lista.
    await ensure_ready()
    yield
    await shutdown()


settings = get_settings()

# La instancia NO se llama `app` a propósito. Vercel construye una función por cada módulo bajo
# `api/` que exponga una aplicación ASGI con ese nombre, así que llamarla `app` aquí publicaría
# una segunda copia de toda la API en `/api/app/main`. El único entrypoint es `api/index.py`.
api_app = FastAPI(title=settings.app_name, lifespan=lifespan)
api_app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
api_app.include_router(auth.router, prefix=settings.api_prefix)
api_app.include_router(family.router, prefix=settings.api_prefix)
api_app.include_router(professional.router, prefix=settings.api_prefix)
api_app.include_router(cases.router, prefix=settings.api_prefix)
api_app.include_router(orchestration.router, prefix=settings.api_prefix)


@api_app.middleware("http")
async def security_headers(request: Request, call_next):
    await ensure_ready()
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
    if request.url.path.startswith(settings.api_prefix):
        response.headers["Cache-Control"] = "no-store, private"
    return response


@api_app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, __: Exception) -> JSONResponse:
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})
