"""Tests for application settings and configuration validation."""

from __future__ import annotations

import pytest

from app.config import Settings, get_settings


def test_default_settings_are_valid() -> None:
    settings = Settings()
    assert settings.MODE == "demo"
    assert settings.REPOSITORY == "memory"
    assert settings.CLOCK == "simulated"
    assert settings.NOTIFIER == "recording"
    assert settings.FILE_STORAGE == "memory"


def test_get_settings_returns_instance() -> None:
    settings = get_settings()
    assert isinstance(settings, Settings)


def test_production_mode_rejects_simulated_clock() -> None:
    with pytest.raises(ValueError, match="El reloj simulado"):
        Settings(
            MODE="production",
            CLOCK="simulated",
            REPOSITORY="postgres",
            NOTIFIER="whatsapp",
            FILE_STORAGE="object",
        )


def test_production_mode_rejects_memory_repository() -> None:
    with pytest.raises(ValueError, match="El repositorio memoria"):
        Settings(
            MODE="production",
            CLOCK="system",
            REPOSITORY="memory",
            NOTIFIER="whatsapp",
            FILE_STORAGE="object",
        )


def test_production_mode_rejects_recording_notifier() -> None:
    with pytest.raises(ValueError, match="El notificador grabacion"):
        Settings(
            MODE="production",
            CLOCK="system",
            REPOSITORY="postgres",
            NOTIFIER="recording",
            FILE_STORAGE="object",
        )


def test_production_mode_rejects_memory_storage() -> None:
    with pytest.raises(ValueError, match="El almacenamiento memoria"):
        Settings(
            MODE="production",
            CLOCK="system",
            REPOSITORY="postgres",
            NOTIFIER="whatsapp",
            FILE_STORAGE="memory",
        )


def test_valid_production_settings() -> None:
    settings = Settings(
        MODE="production",
        CLOCK="system",
        REPOSITORY="postgres",
        NOTIFIER="whatsapp",
        FILE_STORAGE="object",
    )
    assert settings.MODE == "production"
    assert settings.CLOCK == "system"
    assert settings.REPOSITORY == "postgres"
