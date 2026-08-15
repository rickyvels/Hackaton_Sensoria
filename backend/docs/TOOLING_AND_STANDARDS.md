# 🛠️ Estándares de Calidad y Configuración de Herramientas — Neuroalianza

> **Proyecto:** Neuroalianza (Hackatón INSN San Borja 2026 — Desafío 04: Neurodesarrollo)  
> **Objetivo:** Establecer reglas inmutables de calidad de código, análisis estático, tipado y contratos de arquitectura.

---

## 1. Gestor de Entornos y Paquetes: Astral `uv`

El proyecto utiliza **[`uv`](https://docs.astral.sh/uv/)**, el gestor de paquetes de Python más rápido y determinista del ecosistema moderno.

### 1.1 Comandos Habituales con `uv`
```bash
# Sincronizar el entorno y dependencias según pyproject.toml y uv.lock
uv sync

# Agregar una dependencia de producción
uv add fastapi pydantic pydantic-settings

# Agregar dependencias de desarrollo y testing
uv add --dev pytest pytest-cov hypothesis schemathesis ruff mypy import-linter

# Ejecutar cualquier comando dentro del entorno virtual gestionado
uv run fastapi dev main.py
uv run pytest
```

---

## 2. Configuración Estricta de Ruff

Ruff se ejecuta como linter y formateador unificado con **todas las familias de reglas activadas (`select = ["ALL"]`)**, garantizando consistencia y seguridad.

```toml
# pyproject.toml - Fragmento de configuración de Ruff
[tool.ruff]
target-version = "py312"
line-length = 100
src = ["app", "tests"]

[tool.ruff.lint]
select = ["ALL"]
ignore = [
    "D203",   # Incompatible con D211 (one-blank-line-before-class)
    "D213",   # Incompatible con D212 (multi-line-summary-first-line)
    "COM812", # Conflicto con el formateador automático
    "ISC001", # Conflicto con el formateador automático
]

[tool.ruff.lint.per-file-ignores]
"tests/*" = ["S101", "PLR2004", "ANN201", "D103"]
"app/api/routes/*" = ["B008"]  # Permite Depends() en valores por defecto de FastAPI
"app/seed/*" = ["E501"]        # Permite líneas largas en datasets precargados

[tool.ruff.lint.pydocstyle]
convention = "google"

[tool.ruff.lint.mccabe]
max-complexity = 8

[tool.ruff.lint.flake8-type-checking]
strict = true

[tool.ruff.lint.isort]
known-first-party = ["app"]
required-imports = ["from __future__ import annotations"]

[tool.ruff.lint.flake8-bugbear]
extend-immutable-calls = ["fastapi.Depends", "fastapi.Query", "fastapi.Path"]

[tool.ruff.format]
quote-style = "double"
docstring-code-format = true
```

### 2.1 Familias de Reglas Críticas para Neuroalianza
| Prefijo | Familia | Impacto y Justificación |
| :--- | :--- | :--- |
| **`ANN`** | Anotaciones de Tipo | Base indispensable para que MyPy estricto sea 100% efectivo. |
| **`S`** | Seguridad (Bandit) | Detección de vulnerabilidades de seguridad en el manejo de datos de menores. |
| **`B`** | Bugbear | Detección temprana de errores sutiles de sintaxis y mutabilidad por defecto. |
| **`RUF`** | Reglas específicas de Ruff | Detección de antipatrones modernos en Python 3.12+. |
| **`C90`** | Complejidad Ciclomática (McCabe $\le 8$) | Fuerza a particionar la lógica compleja en funciones puras y cohesivas. |
| **`TCH`** | Bloques de Solo-Tipado (`if TYPE_CHECKING:`) | Mantiene limpias las dependencias en tiempo de ejecución. |
| **`ERA`** | Código Comentado | Prohibido: el historial vive en Git, no en código muerto comentado. |
| **`ARG`** | Argumentos no usados | Detección inmediata de firmas desactualizadas. |
| **`SLF`** | Acceso a Privados | Protege las fronteras de encapsulamiento entre módulos. |
| **`TID`** | Imports Acoplados | Refuerza las fronteras de capas. |

---

## 3. Tipado Estático Estricto con MyPy

```toml
# pyproject.toml - Fragmento de configuración de MyPy
[tool.mypy]
python_version = "3.12"
strict = true

disallow_any_unimported = true
disallow_any_expr = false       # Necesario por compatibilidad con internals de Pydantic
disallow_any_decorated = false  # Necesario por compatibilidad con decoradores de rutas FastAPI
disallow_any_explicit = true
disallow_any_generics = true
disallow_subclassing_any = true
warn_unreachable = true
warn_no_return = true
strict_equality = true
strict_bytes = true
extra_checks = true
enable_error_code = [
    "redundant-expr",
    "possibly-undefined",
    "truthy-bool",
    "truthy-iterable",
    "ignore-without-code",
    "unused-awaitable",
    "explicit-override",
    "mutable-override",
    "unimported-reveal",
]
show_error_codes = true
pretty = true

[[tool.mypy.overrides]]
module = "tests.*"
disallow_untyped_defs = true

[[tool.mypy.overrides]]
module = ["app.domain.*"]
disallow_any_explicit = true
warn_return_any = true
```

---

## 4. Contratos de Arquitectura con `import-linter`

La regla de dependencias no se deja al criterio subjetivo; se valida en cada build mediante contratos formales:

```ini
# .importlinter
[importlinter]
root_package = app

[importlinter:contract:1]
name = Arquitectura en capas
type = layers
layers = 
    app.api
    app.services
    app.ports
    app.domain

[importlinter:contract:2]
name = El dominio no depende de nada
type = forbidden
source_modules = 
    app.domain
forbidden_modules = 
    app.api
    app.services
    app.adapters
    app.ports
    fastapi
    pydantic
    sqlalchemy
    httpx

[importlinter:contract:3]
name = Adaptadores solo desde el composition root
type = forbidden
source_modules = 
    app.api
    app.services
    app.domain
forbidden_modules = 
    app.adapters

[importlinter:contract:4]
name = Modulos de dominio independientes entre si
type = independence
modules = 
    app.domain.screening
    app.domain.casefile
    app.domain.scheduling
    app.domain.alerts
```

---

## 5. El `Makefile` como Puerta de Entrada

El comando `make check` es la puerta de entrada local y en CI:

```makefile
.PHONY: install run lint format types arch test contract check seed

install:
	uv sync

run:
	uv run fastapi dev main.py

lint:
	uv run ruff check app tests
	uv run ruff format --check app tests

format:
	uv run ruff format app tests
	uv run ruff check --fix app tests

types:
	uv run mypy app tests

arch:
	uv run lint-imports

test:
	uv run pytest --cov=app --cov-report=term-missing --cov-fail-under=90

contract:
	uv run python -m app.export_openapi
	uv run schemathesis run contracts/openapi.json --app=app.main:app

check: lint types arch test contract

seed:
	uv run python -m app.seed.demo_data
```
