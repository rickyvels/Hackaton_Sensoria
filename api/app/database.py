from collections.abc import AsyncIterator
from typing import Any
from urllib.parse import urlsplit

from sqlalchemy import event
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from .config import get_settings

LOOPBACK_HOSTS = {"127.0.0.1", "localhost", "::1", None, ""}


class Base(DeclarativeBase):
    pass


settings = get_settings()


def _engine_options(database_url: str) -> dict[str, Any]:
    if not database_url.startswith("postgresql"):
        return {}
    connect_args: dict[str, Any] = {
        # pgbouncer en modo transacción no conserva sentencias preparadas entre consultas.
        # Desactivar la caché cuesta un poco de latencia y evita un fallo intermitente.
        "statement_cache_size": 0,
    }
    if urlsplit(database_url).hostname not in LOOPBACK_HOSTS:
        connect_args["ssl"] = "require"
    return {
        # Una instancia serverless se congela en cuanto responde: las conexiones que dejara
        # abiertas el pool quedarían colgadas del lado del servidor hasta agotar el límite.
        "poolclass": NullPool,
        "connect_args": connect_args,
    }


engine: AsyncEngine = create_async_engine(
    settings.database_url, future=True, **_engine_options(settings.database_url)
)


if settings.database_url.startswith("sqlite"):
    @event.listens_for(engine.sync_engine, "connect")
    def _enable_sqlite_foreign_keys(dbapi_connection, _connection_record) -> None:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_session() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        yield session
