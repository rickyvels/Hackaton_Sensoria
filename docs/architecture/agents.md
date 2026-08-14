# Agentes y orquestación

La implementación reutilizable de la orquestación está en `api/app/orchestration/`.

| Módulo | Responsabilidad | Interfaz que deben usar otros módulos |
| --- | --- | --- |
| `manager.py` | Mantiene la máquina de estados, la cola, la pausa, la reanudación y los eventos persistidos de cada corrida. | Iniciar o controlar una corrida a través de las rutas de `routers/orchestration.py`. |
| `providers.py` | Adapta Ollama y el proveedor determinista al contrato de artefacto estructurado. | Configurar el proveedor mediante variables `NEUROALIANZA_AGENT_*`; no invocar Ollama desde los frontends. |
| `routers/orchestration.py` | Expone corridas, eventos SSE, controles y grafo de procedencia. | Consumir sus endpoints desde un cliente autenticado. |
| `services.py` | Aplica reglas de negocio para casos, barreras, validación y tareas. | Usar sus servicios desde rutas de FastAPI; evita duplicar reglas en el cliente. |

## Flujo y controles

1. Una familia registra una barrera.
2. Un profesional valida la síntesis del aviso.
3. El orquestador crea una corrida solo cuando el profesional la reproduce.
4. Cada agente devuelve un artefacto estructurado con resumen, propuesta y evidencia.
5. La corrida queda en espera de autorización antes de crear una tarea.

Los agentes no reciben permisos para cambiar el estado clínico, confirmar citas ni crear tareas. Esas operaciones están detrás de la decisión registrada del profesional.

## Proveedor local

El adaptador de Ollama espera un modelo que devuelva contenido estructurado. La configuración predeterminada es:

```text
NEUROALIANZA_AGENT_PROVIDER=ollama
NEUROALIANZA_OLLAMA_BASE_URL=http://127.0.0.1:11434
NEUROALIANZA_OLLAMA_MODEL=qwen3:8b
```

Para desarrollo sin modelo, use `NEUROALIANZA_AGENT_PROVIDER=deterministic`. El proveedor determinista conserva el contrato y permite probar el flujo completo.
