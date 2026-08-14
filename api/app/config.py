from functools import lru_cache
from pathlib import Path
from secrets import token_urlsafe
from urllib.parse import urlparse

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Neuroalianza MVP API"
    api_prefix: str = "/api/v1"
    environment: str = "demo"
    jwt_secret: str = ""
    jwt_algorithm: str = "HS256"
    token_exp_minutes: int = 60 * 12
    database_url: str = f"sqlite+aiosqlite:///{Path(__file__).resolve().parents[2] / 'neuroalianza.db'}"
    cors_origins: str = "http://127.0.0.1:5173,http://127.0.0.1:5174,http://localhost:5173,http://localhost:5174"
    agent_provider: str = "ollama"
    ollama_base_url: str = "http://127.0.0.1:11434"
    ollama_model: str = "qwen3:8b"
    ollama_timeout_seconds: float = 120.0
    agent_fallback_enabled: bool = True

    model_config = SettingsConfigDict(
        env_prefix="NEUROALIANZA_",
        extra="ignore",
    )

    @model_validator(mode="after")
    def require_secure_production_secret(self) -> "Settings":
        if self.environment.lower() == "demo" and not self.jwt_secret:
            self.jwt_secret = token_urlsafe(32)
        if self.environment.lower() != "demo" and len(self.jwt_secret) < 32:
            raise ValueError("NEUROALIANZA_JWT_SECRET must be at least 32 characters outside demo mode")
        parsed_ollama_url = urlparse(self.ollama_base_url)
        if parsed_ollama_url.scheme not in {"http", "https"} or not parsed_ollama_url.hostname:
            raise ValueError("NEUROALIANZA_OLLAMA_BASE_URL must be an absolute HTTP(S) URL")
        loopback_hosts = {"127.0.0.1", "localhost", "::1"}
        if parsed_ollama_url.hostname not in loopback_hosts and parsed_ollama_url.scheme != "https":
            raise ValueError("Remote Ollama endpoints must use HTTPS")
        return self

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
