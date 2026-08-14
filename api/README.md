# Neuroalianza MVP API

Backend FastAPI para el flujo sintético de Neuroalianza. Expone el acceso demo, los casos, la orquestación local con Qwen, la autorización profesional, las tareas, la transmisión de eventos y el grafo causal. Reportar una barrera nunca crea una tarea.

## Stack

- FastAPI
- SQLAlchemy 2.0 async
- SQLite con `aiosqlite`
- PyJWT para token demo bearer
- Ollama con `qwen3:8b` para artefactos estructurados
- SSE para observar corridas en curso
- Pytest + HTTPX para pruebas async

## Datos demo

- Familia
  - `dni`: `12345678`
  - `password`: `familia123`
- Profesional
  - `dni`: `87654321`
  - `password`: `profesional123`

## Arranque

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:api_app --reload --host 127.0.0.1 --port 8000
```

La base SQLite se crea automáticamente en `neuroalianza.db` durante el arranque. Para usar el modelo local, inicie Ollama en `http://127.0.0.1:11434` y descargue `qwen3:8b`. Si Ollama no está disponible, el backend puede usar el proveedor determinista configurando `NEUROALIANZA_AGENT_PROVIDER=deterministic`.

## Pruebas

```bash
source .venv/bin/activate
pytest -q
```

## Endpoints

Base: `/api/v1`

- `POST /auth/login`
- `GET /family/me`
- `GET /family/cases/current`
- `POST /family/cases/current/assistant`
- `POST /family/cases/{case_id}/barrier-reports`
- `GET /family/cases/current/notes`
- `POST /family/cases/{case_id}/notes`
- `GET /professional/cases`
- `GET /professional/cases/{case_id}`
- `GET /professional/cases/{case_id}/notes`
- `POST /professional/cases/{case_id}/notes/{note_id}/review`
- `POST /professional/cases/{case_id}/synthesis-validation`
- `POST /professional/cases/{case_id}/approval-decisions`
- `POST /orchestration/cases/{case_id}/runs`
- `GET /orchestration/cases/{case_id}/runs/current`
- `GET /orchestration/runs/{run_id}`
- `POST /orchestration/runs/{run_id}/control`
- `GET /orchestration/runs/{run_id}/events`
- `GET /orchestration/cases/{case_id}/graph`
- `GET /cases/{case_id}/feed`
- `GET /tasks/{task_id}`
- `GET /health`

## Libreta de la familia

`family_notes` guarda observaciones del entorno diario del niño (casa, colegio, terapia) escritas
por el cuidador. Es evidencia longitudinal, no una solicitud: crear una nota **no** cambia
`route_status`, **no** cambia `care_stage` y **no** crea tareas. El profesional puede responderla y
esa respuesta vuelve a la familia dentro de su propia libreta.

Las notas no aparecen en `GET /cases/{case_id}/feed` de la familia: se leen en su endpoint propio,
y el feed conserva su lista blanca de tipos y de metadatos.

## Etapa clínica

`cases.care_stage` recorre `detection → referral → assessment → intervention → followup →
discharge`. Es un eje distinto de `route_status`, que describe el estado operativo de la
coordinación. Un caso puede estar en `intervention` y a la vez en `barrier_reported`.

## Gate humano

1. La familia reporta una barrera.
2. El backend registra `FamilyReport` y `Barrier`. El estado queda en `barrier_reported`; todavía no existe una solicitud de aprobación.
3. El profesional valida, corrige o solicita aclaración sobre la síntesis antes de habilitar la coordinación.
4. El profesional pulsa `Reproducir caso`. El backend crea una corrida y el proveedor configurado genera artefactos JSON validados.
5. El orquestador registra `PolicyCheck` y `ApprovalRequest`, y luego se detiene en `waiting_approval`.
6. Solo una decisión profesional aprobada crea la tarea y reanuda la misma corrida.
7. El agente de calidad agrega una señal anónima y la corrida termina en `completed`.

## Variables opcionales

- `NEUROALIANZA_ENVIRONMENT`: `demo` por defecto. En cualquier otro valor no se cargan credenciales sintéticas.
- `NEUROALIANZA_DATABASE_URL`
- `NEUROALIANZA_JWT_SECRET`: obligatorio fuera de `demo`, mínimo 32 caracteres y nunca el valor demo.
- `NEUROALIANZA_TOKEN_EXP_MINUTES`
- `NEUROALIANZA_CORS_ORIGINS`: lista separada por comas de orígenes permitidos para los clientes.
- `NEUROALIANZA_AGENT_PROVIDER`: `ollama` por defecto; usa `deterministic` para pruebas sin modelo.
- `NEUROALIANZA_OLLAMA_BASE_URL`: `http://127.0.0.1:11434` por defecto.
- `NEUROALIANZA_OLLAMA_MODEL`: `qwen3:8b` por defecto.
- `NEUROALIANZA_OLLAMA_TIMEOUT_SECONDS`: tiempo máximo por invocación.
- `NEUROALIANZA_AGENT_FALLBACK_ENABLED`: activa el fallback determinista seguro.
