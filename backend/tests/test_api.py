"""Tests for FastAPI API endpoints and RFC 7807 error handling."""

from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

from app.api.errors import register_error_handlers
from app.config import Settings
from app.domain.shared.errors import (
    ActiveCaseConflictError,
    BusinessRuleViolationError,
    DomainError,
    EntityNotFoundError,
    InvalidCatalogError,
    InvalidTransitionError,
)
from app.main import create_app


def test_system_health_endpoints(client: TestClient) -> None:
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}
    assert "X-Request-Id" in res.headers

    res_ready = client.get("/health/ready")
    assert res_ready.status_code == 200
    assert res_ready.json() == {"status": "ready"}

    res_info = client.get("/api/v1/system/info")
    assert res_info.status_code == 200
    data = res_info.json()
    assert data["version"] == "0.1.0"
    assert data["mode"] == "demo"
    assert data["repository_type"] == "memory"


def test_admin_demo_endpoints(client: TestClient) -> None:
    # 1. Advance clock
    res_adv = client.post(
        "/api/v1/admin/clock/advance", json={"days": 10, "hours": 2, "minutes": 0}
    )
    assert res_adv.status_code == 200
    assert "current_time" in res_adv.json()

    # 2. Reset clock
    res_reset = client.post("/api/v1/admin/clock/reset")
    assert res_reset.status_code == 200

    # 3. Notifications
    res_notif = client.get("/api/v1/admin/notifications")
    assert res_notif.status_code == 200
    assert "notifications" in res_notif.json()

    # 4. Trigger alerts
    res_alerts = client.post("/api/v1/admin/alerts/run")
    assert res_alerts.status_code == 200
    assert res_alerts.json()["success"] is True

    # 5. Seed reset
    res_seed = client.post("/api/v1/admin/seed/reset")
    assert res_seed.status_code == 200
    assert res_seed.json()["success"] is True


def test_admin_endpoints_absent_in_production_mode() -> None:
    prod_settings = Settings(
        MODE="production",
        REPOSITORY="postgres",
        CLOCK="system",
        NOTIFIER="whatsapp",
        FILE_STORAGE="object",
    )
    prod_app = create_app(settings=prod_settings)
    with TestClient(prod_app) as prod_client:
        res = prod_client.get("/api/v1/admin/notifications")
        assert res.status_code == 404


def test_rfc7807_validation_error_format(client: TestClient) -> None:
    # Send negative days (invalid by schema)
    res = client.post("/api/v1/admin/clock/advance", json={"days": -5})
    assert res.status_code == 422
    assert res.headers["content-type"] == "application/problem+json"
    data = res.json()
    assert data["type"] == "https://neuroalianza.pe/errors/validation-error"
    assert data["status"] == 422
    assert len(data["errors"]) > 0


def test_rfc7807_domain_exceptions() -> None:
    test_app = FastAPI()
    register_error_handlers(test_app)

    @test_app.get("/error/not-found")
    def raise_not_found() -> None:
        raise EntityNotFoundError("Caso", "c-123")

    @test_app.get("/error/invalid-transition")
    def raise_invalid_transition() -> None:
        raise InvalidTransitionError("DETECTADO", "EN_TERAPIA", "No permitido")

    @test_app.get("/error/active-conflict")
    def raise_active_conflict() -> None:
        raise ActiveCaseConflictError("p-1", "c-1")

    @test_app.get("/error/rule-violation")
    def raise_rule_violation() -> None:
        raise BusinessRuleViolationError("Regla1", "Violacion de regla")

    @test_app.get("/error/invalid-catalog")
    def raise_invalid_catalog() -> None:
        raise InvalidCatalogError("Catalogo corrupto")

    @test_app.get("/error/domain-generic")
    def raise_domain_generic() -> None:
        raise DomainError("Error generico")

    with TestClient(test_app) as err_client:
        assert err_client.get("/error/not-found").status_code == 404
        assert err_client.get("/error/invalid-transition").status_code == 409
        assert err_client.get("/error/active-conflict").status_code == 409
        assert err_client.get("/error/rule-violation").status_code == 422
        assert err_client.get("/error/invalid-catalog").status_code == 400
        assert err_client.get("/error/domain-generic").status_code == 400


def test_rfc7807_system_exceptions() -> None:
    test_app = FastAPI()
    register_error_handlers(test_app)

    @test_app.get("/error/http-error")
    def raise_http_error() -> None:
        raise HTTPException(status_code=403, detail="Acceso denegado")

    @test_app.get("/error/server-error")
    def raise_server_error() -> None:
        raise RuntimeError("Crash inesperado")

    with TestClient(test_app, raise_server_exceptions=False) as err_client:
        r_http = err_client.get("/error/http-error")
        assert r_http.status_code == 403
        assert r_http.json()["type"] == "https://neuroalianza.pe/errors/http-error"

        r_server = err_client.get("/error/server-error")
        assert r_server.status_code == 500
        assert r_server.json()["type"] == "https://neuroalianza.pe/errors/internal-server-error"
