from __future__ import annotations

import asyncio
import os
from pathlib import Path

from sqlalchemy.exc import DBAPIError, IntegrityError, OperationalError, ProgrammingError

from .config import get_settings, running_on_vercel
from .database import Base, SessionLocal, engine
from .migrations import ensure_orchestration_schema
from .orchestration import orchestration_manager
from .seed import seed_demo_data

# Dos instancias que arrancan en frío a la vez compiten por crear el esquema y por sembrar.
# Ambas operaciones son idempotentes por diseño, así que basta con absorber el choque.
CONCURRENT_BOOTSTRAP_ERRORS = (IntegrityError, ProgrammingError, OperationalError, DBAPIError)

_ready = False
_lock = asyncio.Lock()


async def _create_schema() -> None:
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
        await ensure_orchestration_schema(connection)


async def _seed() -> None:
    async with SessionLocal() as session:
        async with session.begin():
            await seed_demo_data(session)


async def ensure_ready() -> None:
    """Prepare schema, demo data and worker once per process.

    En Vercel cada arranque en frío vuelve a ejecutar esto, así que cada paso tiene que ser
    idempotente y barato en el camino feliz: la bandera corta el trabajo durante el resto de
    la vida de la instancia.
    """
    global _ready
    if _ready:
        return
    async with _lock:
        if _ready:
            return
        settings = get_settings()
        try:
            await _create_schema()
        except CONCURRENT_BOOTSTRAP_ERRORS:
            # Otra instancia ganó la carrera; el esquema ya está puesto.
            pass
        if engine.url.get_backend_name() == "sqlite" and engine.url.database:
            database_path = Path(engine.url.database)
            if database_path.exists():
                os.chmod(database_path, 0o600)
        if settings.environment.lower() == "demo":
            try:
                await _seed()
            except CONCURRENT_BOOTSTRAP_ERRORS:
                pass
        if not running_on_vercel():
            # El worker de fondo y la recuperación solo tienen sentido en un proceso que
            # sobrevive entre peticiones. En serverless la corrida se ejecuta dentro del
            # propio request que la observa.
            await orchestration_manager.start()
            await orchestration_manager.recover()
        _ready = True


async def shutdown() -> None:
    await orchestration_manager.stop()
