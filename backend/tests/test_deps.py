"""Tests for FastAPI dependency injection providers."""

from __future__ import annotations

from app.api.deps import (
    get_caso_repo_dep,
    get_cita_repo_dep,
    get_clock_dep,
    get_container_dep,
    get_event_bus_dep,
    get_file_storage_dep,
    get_notificacion_repo_dep,
    get_notifier_dep,
    get_paciente_repo_dep,
    get_settings_dep,
    get_tamizaje_repo_dep,
    get_unit_of_work_dep,
    get_usuario_repo_dep,
)
from app.seed.demo_data import seed_demo_data


def test_dependency_providers_return_valid_instances() -> None:
    assert get_container_dep() is not None
    assert get_settings_dep() is not None
    assert get_clock_dep() is not None
    assert get_event_bus_dep() is not None
    assert get_notifier_dep() is not None
    assert get_file_storage_dep() is not None
    assert get_unit_of_work_dep() is not None
    assert get_paciente_repo_dep() is not None
    assert get_caso_repo_dep() is not None
    assert get_cita_repo_dep() is not None
    assert get_tamizaje_repo_dep() is not None
    assert get_notificacion_repo_dep() is not None
    assert get_usuario_repo_dep() is not None


def test_seed_demo_data_invokes_cleanly() -> None:
    seed_demo_data()
