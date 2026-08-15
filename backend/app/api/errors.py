"""RFC 7807 Problem Details error handling for FastAPI."""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from app.domain.shared.errors import (
    ActiveCaseConflictError,
    BusinessRuleViolationError,
    DomainError,
    EntityNotFoundError,
    InvalidCatalogError,
    InvalidTransitionError,
)


class ProblemDetail(BaseModel):
    """RFC 7807 Problem Detail structure."""

    type: str = Field(..., description="URI reference identifying the problem type")
    title: str = Field(..., description="Short, human-readable summary of problem")
    status: int = Field(..., description="HTTP status code")
    detail: str = Field(..., description="Human-readable explanation specific to this occurrence")
    instance: str = Field(..., description="URI reference identifying the specific occurrence")
    request_id: str | None = Field(default=None, description="Correlation identifier")
    errors: list[dict[str, Any]] = Field(
        default_factory=list, description="Detailed validation errors if any"
    )


def get_request_id(request: Request) -> str | None:
    """Extracts request_id from request state or headers."""
    if hasattr(request.state, "request_id"):
        return str(request.state.request_id)
    return request.headers.get("X-Request-Id")


def create_problem_response(  # noqa: PLR0913
    *,
    status: int,
    error_slug: str,
    title: str,
    detail: str,
    request: Request,
    errors: list[dict[str, Any]] | None = None,
) -> JSONResponse:
    """Constructs RFC 7807 JSONResponse."""
    req_id = get_request_id(request)
    body = ProblemDetail(
        type=f"https://neuroalianza.pe/errors/{error_slug}",
        title=title,
        status=status,
        detail=detail,
        instance=str(request.url.path),
        request_id=req_id,
        errors=errors or [],
    )
    return JSONResponse(
        status_code=status,
        content=body.model_dump(),
        media_type="application/problem+json",
    )


def register_domain_error_handlers(app: FastAPI) -> None:
    """Registers domain exception handlers."""

    @app.exception_handler(EntityNotFoundError)
    async def handle_not_found(request: Request, exc: EntityNotFoundError) -> JSONResponse:
        return create_problem_response(
            status=404,
            error_slug="not-found",
            title="Recurso no encontrado",
            detail=exc.message,
            request=request,
        )

    @app.exception_handler(InvalidTransitionError)
    async def handle_invalid_transition(
        request: Request, exc: InvalidTransitionError
    ) -> JSONResponse:
        return create_problem_response(
            status=409,
            error_slug="invalid-transition",
            title="Transición de estado no permitida",
            detail=exc.message,
            request=request,
        )

    @app.exception_handler(ActiveCaseConflictError)
    async def handle_case_conflict(request: Request, exc: ActiveCaseConflictError) -> JSONResponse:
        return create_problem_response(
            status=409,
            error_slug="active-case-conflict",
            title="Conflicto de caso activo",
            detail=exc.message,
            request=request,
        )

    @app.exception_handler(BusinessRuleViolationError)
    async def handle_rule_violation(
        request: Request, exc: BusinessRuleViolationError
    ) -> JSONResponse:
        return create_problem_response(
            status=422,
            error_slug="business-rule-violation",
            title="Violación de regla de negocio",
            detail=exc.message,
            request=request,
        )

    @app.exception_handler(InvalidCatalogError)
    async def handle_invalid_catalog(request: Request, exc: InvalidCatalogError) -> JSONResponse:
        return create_problem_response(
            status=400,
            error_slug="invalid-catalog",
            title="Catálogo inválido",
            detail=exc.message,
            request=request,
        )

    @app.exception_handler(DomainError)
    async def handle_generic_domain_error(request: Request, exc: DomainError) -> JSONResponse:
        return create_problem_response(
            status=400,
            error_slug="domain-error",
            title="Error de dominio",
            detail=exc.message,
            request=request,
        )


def register_http_error_handlers(app: FastAPI) -> None:
    """Registers standard HTTP and validation exception handlers."""

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        formatted_errors = [
            {
                "loc": list(err.get("loc", [])),
                "msg": err.get("msg", ""),
                "type": err.get("type", ""),
            }
            for err in exc.errors()
        ]
        return create_problem_response(
            status=422,
            error_slug="validation-error",
            title="Error de validación en la solicitud",
            detail="Uno o más campos de la solicitud no cumplen las restricciones del esquema.",
            request=request,
            errors=formatted_errors,
        )

    @app.exception_handler(HTTPException)
    async def handle_http_exception(request: Request, exc: HTTPException) -> JSONResponse:
        title_text = str(exc.detail) if exc.detail else "Error HTTP"
        return create_problem_response(
            status=exc.status_code,
            error_slug="http-error",
            title=title_text,
            detail=str(exc.detail),
            request=request,
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_exception(request: Request, _exc: Exception) -> JSONResponse:
        return create_problem_response(
            status=500,
            error_slug="internal-server-error",
            title="Error interno del servidor",
            detail="Ocurrió un error inesperado al procesar la solicitud.",
            request=request,
        )


def register_error_handlers(app: FastAPI) -> None:
    """Registers all application error handlers."""
    register_domain_error_handlers(app)
    register_http_error_handlers(app)
