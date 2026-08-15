"""Shared test fixtures and configuration."""

from __future__ import annotations

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.container import Container, reset_container
from app.main import create_app


@pytest.fixture
def test_settings() -> Settings:
    """Provides test settings configured for memory/demo mode."""
    return Settings(
        MODE="demo",
        REPOSITORY="memory",
        NOTIFIER="recording",
        EVENT_BUS="inprocess",
        CLOCK="simulated",
        FILE_STORAGE="memory",
    )


@pytest.fixture
def test_container(test_settings: Settings) -> Generator[Container, None, None]:
    """Provides an isolated test container."""
    container = reset_container(settings=test_settings)
    yield container
    reset_container()


@pytest.fixture
def client(test_settings: Settings) -> Generator[TestClient, None, None]:
    """Provides a TestClient connected to an in-memory FastAPI app."""
    reset_container(settings=test_settings)
    app = create_app(settings=test_settings)
    with TestClient(app) as test_client:
        yield test_client
    reset_container()
