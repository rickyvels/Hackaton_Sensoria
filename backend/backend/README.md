# 🧠 Neuroalianza — Backend API

> **Hackatón Instituto Nacional de Salud del Niño San Borja (INSN SB) 2026**  
> *Desafío 04: Neurodesarrollo — Neurología Pediátrica · Psiquiatría Infantil · Psicología · Genética · Medicina Física y Rehabilitación*

Backend de alta especialidad para la plataforma **Neuroalianza**, diseñado para articular la detección temprana en el primer nivel de atención (CRED), la referencia oportuna a centros especializados y el acompañamiento familiar en trastornos del neurodesarrollo.

---

## 📚 Índice de Documentación Profunda

Para una comprensión técnica exhaustiva del sistema, consulta los documentos especializados:

| Documento | Enlace | Contenido Principal |
| :--- | :--- | :--- |
| **Filosofía y Principios** | [PHILOSOPHY.md](file:///home/techatlasdev/Proyectos/Sensoria/hackatones/neuroalianza-v1/backend/PHILOSOPHY.md) | Principios ético-clínicos, minimización de datos, arquitectura hexagonal y determinismo. |
| **Guía de Contribución** | [CONTRIBUTING.md](file:///home/techatlasdev/Proyectos/Sensoria/hackatones/neuroalianza-v1/backend/CONTRIBUTING.md) | Flujo Git, Conventional Commits, reglas de capas, estándares de PR y testing obligatorio. |
| **Arquitectura Técnica** | [ARCHITECTURE.md](file:///home/techatlasdev/Proyectos/Sensoria/hackatones/neuroalianza-v1/backend/docs/ARCHITECTURE.md) | Capas, puertos y adaptadores, Composition Root (`container.py`), Event Bus y RFC 7807. |
| **Dominio y Estados** | [DOMAIN_AND_STATE_MACHINE.md](file:///home/techatlasdev/Proyectos/Sensoria/hackatones/neuroalianza-v1/backend/docs/DOMAIN_AND_STATE_MACHINE.md) | Máquina de estados inmutable, motor de tamizaje clínico (EEDP/TEPSI/M-CHAT) y alertas. |
| **Contratos de la API** | [API_CONTRACTS.md](file:///home/techatlasdev/Proyectos/Sensoria/hackatones/neuroalianza-v1/backend/docs/API_CONTRACTS.md) | Catálogo de endpoints por actor, modelos Pydantic, idempotencia y proyecciones por rol. |
| **Estrategia de Testing** | [TESTING_STRATEGY.md](file:///home/techatlasdev/Proyectos/Sensoria/hackatones/neuroalianza-v1/backend/docs/TESTING_STRATEGY.md) | Pirámide de 5 niveles, Hypothesis, Schemathesis, Simulated Clock y cobertura $\ge 90\%$. |
| **Estándares y Herramientas** | [TOOLING_AND_STANDARDS.md](file:///home/techatlasdev/Proyectos/Sensoria/hackatones/neuroalianza-v1/backend/docs/TOOLING_AND_STANDARDS.md) | Configuración de `uv`, Ruff (`ALL`), MyPy (`strict`), `import-linter` y Makefile. |

---

## ⚡ 1. Características Principales del Backend

> Para activar el asistente familiar con Ollama y la base RAG local, sigue [ASSISTANT_LOCAL.md](ASSISTANT_LOCAL.md). El corpus debe configurarse mediante `NEURO_KNOWLEDGE_BASE_PATH`.

* **Arquitectura Hexagonal (Puertos y Adaptadores):** Núcleo de dominio puro en Python (`stdlib`), sin dependencias de frameworks ni bases de datos en la lógica de negocio.
* **Arranque Inmediato sin Dependencias Externas:** Adaptadores en memoria de alto rendimiento para desarrollo y demostración en vivo con cero configuración.
* **Trazabilidad Inmutable (Timeline Append-Only):** Cada transición de estado se audita con actor, fecha y motivo; las métricas institucionales se calculan directamente del historial.
* **Motor Clínico de Tamizaje Puro:** Basado en escalas peruanas validadas (EEDP, TEPSI, M-CHAT-R/F, Pauta Breve MINSA) con resultados 100% explicables y orientados a la acción.
* **Reloj Simulado (`SimulatedClock`):** Capacidad de avanzar semanas en segundos para demostrar activación de alertas en vivo sin manipular el sistema operativo.
* **Contrato OpenAPI como Fuente de Verdad:** Esquema sincronizado y verificado mediante pruebas automáticas con Schemathesis.

---

## 🚀 2. Inicio Rápido con `uv`

### 2.1 Prerrequisitos
* **Python 3.12+**
* **[`uv`](https://docs.astral.sh/uv/)** instalado (`curl -LsSf https://astral.sh/uv/install.sh | sh` o via brew/cargo)

### 2.2 Instalación y Puesta en Marcha
```bash
# 1. Posicionarse en el directorio del backend
cd backend

# 2. Sincronizar el entorno virtual y dependencias
uv sync

# 3. Iniciar el servidor de desarrollo FastAPI
uv run fastapi dev main.py
```

* **API Interactiva (Swagger UI):** [`http://localhost:8000/docs`](http://localhost:8000/docs)
* **Especificación ReDoc:** [`http://localhost:8000/redoc`](http://localhost:8000/redoc)
* **Diagnóstico de Salud:** [`http://localhost:8000/health`](http://localhost:8000/health)

---

## 🧪 3. Verificación y Testing Automatizado

En cumplimiento con la directriz del proyecto, **toda funcionalidad cuenta con pruebas automatizadas**:

```bash
# Ejecutar toda la suite de pruebas con cobertura
uv run pytest --cov=app --cov-report=term-missing --cov-fail-under=90

# O ejecutar el comando consolidado de calidad (Lint + Tipos + Arquitectura + Tests)
make check
```

---

## 🏗️ 4. Estructura de Directorios

```
app/
├── main.py                      # Composición y arranque de FastAPI
├── config.py                    # Settings tipadas con Pydantic (NEURO_*)
├── container.py                 # Composition Root (Fábrica de dependencias)
├── domain/                      # Núcleo puro (Screening, Casefile, Scheduling, Alerts)
├── ports/                       # Interfaces abstractas (typing.Protocol)
├── adapters/                    # Implementaciones (Memory, Postgres, Notifier, Storage)
├── services/                    # Casos de uso y orquestación
├── api/                         # Rutas por actor, schemas y manejadores RFC 7807
└── seed/                        # Dataset precargado para demostraciones
```

---

## 📄 5. Licencia y Créditos
Desarrollado para el **Hackatón INSN San Borja 2026** por el equipo Neuroalianza.
