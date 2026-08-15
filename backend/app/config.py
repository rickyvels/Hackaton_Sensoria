"""Typed application configuration with Pydantic Settings."""

from __future__ import annotations

from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Global configuration model validating NEURO_* environment variables."""

    model_config = SettingsConfigDict(
        env_prefix="NEURO_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Mode & Adapters Selection
    MODE: Literal["demo", "production"] = "demo"
    REPOSITORY: Literal["memory", "postgres"] = "memory"
    NOTIFIER: Literal["recording", "whatsapp", "sms"] = "recording"
    EVENT_BUS: Literal["inprocess", "queue"] = "inprocess"
    CLOCK: Literal["simulated", "system"] = "simulated"
    FILE_STORAGE: Literal["memory", "object"] = "memory"

    # Alert Thresholds
    STALLED_REFERRAL_DAYS: int = 7
    INACTIVE_WEEKS_RISK: int = 3
    REMINDER_HOURS_AHEAD: int = 24
    REEVALUATION_MAX_WEEKS: int = 12

    # Screening
    CATALOG_VERSION: str = "1.0.0"

    # Scheduling
    SESSION_DURATION_MINUTES: int = 45
    MAX_GROUPING_DAYS_WINDOW: int = 5

    # Security
    SECRET_KEY: str = "neuroalianza-dev-secret-key"  # noqa: S105
    TOKEN_EXPIRE_MINUTES: int = 60
    ALLOWED_ORIGINS: list[str] = ["*"]

    # Observability
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: Literal["json", "text"] = "json"

    # Family assistant
    KNOWLEDGE_BASE_PATH: str = "knowledge_base"
    OLLAMA_URL: str = "http://127.0.0.1:11434"
    OLLAMA_MODEL: str = "qwen3:8b"
    OLLAMA_TIMEOUT_SECONDS: float = 25.0
    ASSISTANT_MAX_SOURCES: int = 4

    @model_validator(mode="after")
    def validate_adapter_compatibility(self) -> Settings:
        """Validates that adapter selections match the target operational mode."""
        if self.MODE == "production":
            if self.CLOCK == "simulated":
                msg = "El reloj simulado (NEURO_CLOCK=simulated) no esta permitido en produccion."
                raise ValueError(msg)
            if self.REPOSITORY == "memory":
                msg = "El repositorio memoria (NEURO_REPOSITORY=memory) no esta permitido."
                raise ValueError(msg)
            if self.NOTIFIER == "recording":
                msg = "El notificador grabacion (NEURO_NOTIFIER=recording) no esta permitido."
                raise ValueError(msg)
            if self.FILE_STORAGE == "memory":
                msg = "El almacenamiento memoria (NEURO_FILE_STORAGE=memory) no esta permitido."
                raise ValueError(msg)
        if self.ASSISTANT_MAX_SOURCES < 1:
            msg = "ASSISTANT_MAX_SOURCES debe ser mayor o igual a 1."
            raise ValueError(msg)
        return self


def get_settings() -> Settings:
    """Returns singleton settings instance."""
    return Settings()
