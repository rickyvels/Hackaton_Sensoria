import os
from functools import lru_cache
from pathlib import Path
from secrets import token_urlsafe
from urllib.parse import parse_qsl, urlencode, urlparse, urlsplit, urlunsplit

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

LOCAL_SQLITE_URL = f"sqlite+aiosqlite:///{Path(__file__).resolve().parents[2] / 'neuroalianza.db'}"

# Los proveedores gestionados exponen la conexión con nombres distintos. Se prefiere la conexión
# directa sobre la agrupada: en serverless cada invocación abre y cierra su propia conexión, así
# que el agrupador no aporta y sí introduce los límites de sentencias preparadas de pgbouncer.
DATABASE_URL_ENV_VARS = (
    "DATABASE_URL_UNPOOLED",
    "POSTGRES_URL_NON_POOLING",
    "DATABASE_URL",
    "POSTGRES_URL",
)

# asyncpg rechaza los parámetros que solo entiende libpq; van en connect_args, no en la URL.
LIBPQ_ONLY_QUERY_PARAMS = frozenset(
    {"sslmode", "channel_binding", "sslrootcert", "sslcert", "sslkey", "options", "supa"}
)


def running_on_vercel() -> bool:
    return bool(os.environ.get("VERCEL"))


def normalize_database_url(raw: str) -> str:
    """Convert a provider connection string into an async SQLAlchemy URL."""
    if not raw:
        return LOCAL_SQLITE_URL
    if raw.startswith("sqlite"):
        return raw
    parsed = urlsplit(raw)
    if parsed.scheme not in {"postgres", "postgresql"} and not parsed.scheme.startswith("postgresql+"):
        return raw
    retained = [
        (key, value)
        for key, value in parse_qsl(parsed.query, keep_blank_values=True)
        if key not in LIBPQ_ONLY_QUERY_PARAMS
    ]
    return urlunsplit(
        ("postgresql+asyncpg", parsed.netloc, parsed.path, urlencode(retained), parsed.fragment)
    )


class Settings(BaseSettings):
    app_name: str = "Neuroalianza MVP API"
    api_prefix: str = "/api/v1"
    environment: str = "demo"
    jwt_secret: str = ""
    jwt_algorithm: str = "HS256"
    token_exp_minutes: int = 60 * 12
    database_url: str = ""
    cors_origins: str = "http://127.0.0.1:5173,http://127.0.0.1:5174,http://localhost:5173,http://localhost:5174"
    # Traducción al quechua. Sin token el endpoint responde con el texto original, así que la
    # aplicación sigue funcionando en español en lugar de romperse.
    huggingface_api_token: str = ""
    translation_model: str = "facebook/nllb-200-distilled-600M"
    translation_timeout_seconds: float = 25.0
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
    def resolve_database_url(self) -> "Settings":
        raw = self.database_url
        if not raw:
            for variable in DATABASE_URL_ENV_VARS:
                candidate = os.environ.get(variable, "").strip()
                if candidate:
                    raw = candidate
                    break
        self.database_url = normalize_database_url(raw)
        return self

    @model_validator(mode="after")
    def require_secure_production_secret(self) -> "Settings":
        # Cada instancia serverless arranca en frío. Un secreto generado al vuelo firmaría cada
        # sesión con una clave distinta y cerraría la sesión del usuario sin motivo aparente.
        if running_on_vercel() and not self.jwt_secret:
            raise ValueError(
                "NEUROALIANZA_JWT_SECRET es obligatorio en Vercel: sin un secreto estable "
                "cada arranque en frío invalidaría las sesiones abiertas"
            )
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

    @property
    def uses_postgres(self) -> bool:
        return self.database_url.startswith("postgresql")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
