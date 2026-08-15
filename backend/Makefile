.PHONY: install run lint format types arch test check contract seed clean

install:
	uv sync

run:
	uv run uvicorn app.main:app --reload --port 8000

lint:
	uv run ruff check .
	uv run ruff format --check .

format:
	uv run ruff format .
	uv run ruff check --fix .

types:
	uv run mypy app tests

arch:
	uv run lint-imports

test:
	uv run pytest

check: lint types arch test

contract:
	@mkdir -p contracts
	uv run python -c "import json; from app.main import app; from fastapi.openapi.utils import get_openapi; openapi_schema = get_openapi(title=app.title, version=app.version, routes=app.routes, tags=app.openapi_tags, servers=app.servers); open('contracts/openapi.json', 'w').write(json.dumps(openapi_schema, indent=2))"
	uv run schemathesis run contracts/openapi.json --app=app.main:app

seed:
	uv run python -c "from app.seed.demo_data import seed_demo_data; seed_demo_data()"

clean:
	rm -rf .pytest_cache .ruff_cache .mypy_cache .coverage htmlcov .import_linter_cache
