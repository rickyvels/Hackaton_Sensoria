from __future__ import annotations

import os
import sys
from pathlib import Path

import pytest_asyncio
from httpx import ASGITransport, AsyncClient

API_ROOT = Path(__file__).resolve().parents[1]
DB_PATH = API_ROOT / "test_neuroalianza.db"

os.environ["NEUROALIANZA_DATABASE_URL"] = f"sqlite+aiosqlite:///{DB_PATH}"
os.environ["NEUROALIANZA_AGENT_PROVIDER"] = "deterministic"
sys.path.insert(0, str(API_ROOT))

from app.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.orchestration import orchestration_manager  # noqa: E402
from app.seed import seed_demo_data  # noqa: E402


@pytest_asyncio.fixture(autouse=True)
async def reset_db():
    await orchestration_manager.reset()
    await engine.dispose()
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
        await connection.run_sync(Base.metadata.create_all)
    async with SessionLocal() as session:
        async with session.begin():
            await seed_demo_data(session)
    try:
        yield
    finally:
        await orchestration_manager.reset()
        await engine.dispose()


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://testserver") as async_client:
        yield async_client


async def login(client: AsyncClient, *, dni: str, password: str) -> str:
    response = await client.post("/api/v1/auth/login", json={"dni": dni, "password": password})
    response.raise_for_status()
    return response.json()["access_token"]
