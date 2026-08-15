"""Tests for composition root container."""

from __future__ import annotations

from app.config import Settings
from app.container import Container, get_container, reset_container


def test_container_initializes_all_ports() -> None:
    settings = Settings(MODE="demo", CLOCK="simulated")
    container = Container(settings=settings)

    assert container.clock is not None
    assert container.event_bus is not None
    assert container.notifier is not None
    assert container.file_storage is not None
    assert container.unit_of_work is not None
    assert container.paciente_repo is not None
    assert container.caso_repo is not None
    assert container.cita_repo is not None
    assert container.tamizaje_repo is not None
    assert container.notificacion_repo is not None
    assert container.usuario_repo is not None


def test_container_system_clock_selection() -> None:
    settings = Settings(MODE="demo", CLOCK="system")
    container = Container(settings=settings)
    assert container.clock is not None


def test_get_container_and_reset_container() -> None:
    c1 = get_container()
    assert c1 is not None
    c2 = get_container()
    assert c1 is c2

    c3 = reset_container()
    assert c3 is not None
