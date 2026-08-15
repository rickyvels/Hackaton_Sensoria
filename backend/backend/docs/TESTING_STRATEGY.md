# 🧪 Estrategia y Guía de Testing — Neuroalianza Backend

> **Regla de Oro del Proyecto:** *Cada funcionalidad, regla clínica o integración técnica DEBE contar con pruebas automatizadas que verifiquen su correcto funcionamiento.*  
> En un sistema de salud infantil, la confiabilidad del código no es negociable.

---

## 1. La Pirámide de Pruebas de Neuroalianza

El backend organiza sus pruebas en **5 niveles complementarios**, priorizando la velocidad de ejecución y la solidez lógica:

```
                      ▲
                     / \
                    /   \
                   /  5  \    Contrato OpenAPI (Schemathesis) [~5%]
                  /───────\
                 /    4    \   Integración API ASGI (HTTPX) [~10%]
                /───────────\
               /      3      \  Conformidad de Puertos [~5%]
              /───────────────\
             /        2        \ Servicios de Aplicación (In-Memory) [~20%]
            /───────────────────\
           /          1          \ Pruebas Unitarias de Dominio (Puras) [~60%]
          /───────────────────────\
```

| Nivel | Tipo de Prueba | Componente Probado | Velocidad |
| :--- | :--- | :--- | :--- |
| **Nivel 1** | **Unitarias de Dominio** | Máquina de estados, reglas de tamizaje, cálculo de puntajes, reglas de alerta. | `< 5 ms` por test |
| **Nivel 2** | **Servicios de Aplicación** | Casos de uso orquestando dominio + puertos en memoria + bus de eventos. | `< 15 ms` por test |
| **Nivel 3** | **Conformidad de Puertos** | Suites compartidas que prueban adaptadores en memoria y PostgreSQL contra el mismo protocolo. | Rápida / Moderada |
| **Nivel 4** | **Integración ASGI** | Endpoints FastAPI invocados mediante `httpx.AsyncClient` en memoria (cero socket TCP). | Rápida |
| **Nivel 5** | **Contrato (Schemathesis)** | Fuzzing y pruebas basadas en propiedades contra la especificación `contracts/openapi.json`. | Moderada |

---

## 2. Pruebas Basadas en Propiedades con Hypothesis

Más allá de los casos de ejemplo tradicionales, utilizamos **Hypothesis** para estresar los invariantes fundamentales del sistema con miles de combinaciones generadas:

```python
# Ejemplo: Invariante de la Máquina de Estados con Hypothesis
from hypothesis import given, strategies as st
from app.domain.casefile.states import EstadoCaso, transicionar_caso
from app.domain.casefile.models import Caso

@given(
    estado_inicial=st.sampled_from(EstadoCaso),
    nuevo_estado=st.sampled_from(EstadoCaso),
)
def test_transicion_solo_permite_caminos_validos_declarados(
    estado_inicial: EstadoCaso,
    nuevo_estado: EstadoCaso,
) -> None:
    """Verifica que ninguna combinación no autorizada pueda ejecutarse sin arrojar error."""
    caso = crear_caso_en_estado(estado_inicial)
    
    if nuevo_estado in TRANSICIONES_VALIDAS[estado_inicial]:
        resultado = transicionar_caso(caso, nuevo_estado, actor=ACTOR_VALIDO, motivo="Test")
        assert resultado.estado_actual == nuevo_estado
    else:
        with pytest.raises(InvalidStateTransitionError):
            transicionar_caso(caso, nuevo_estado, actor=ACTOR_VALIDO, motivo="Test")
```

### Invariantes Verificados por Propiedades:
1. **Cronología del Timeline:** Ninguna secuencia de transiciones puede generar marcas de tiempo desordenadas.
2. **Exhaustividad del Tamizaje:** Cualquier edad dentro del rango del catálogo produce un resultado de riesgo categorizado (`BAJO`, `MODERADO`, `ALTO`); cualquier edad fuera del rango arroja un error explícito.
3. **Idempotencia de Alertas:** Correr el evaluador de alertas $N$ veces consecutivas sobre el mismo estado no produce alertas duplicadas.

---

## 3. Control del Tiempo con el Puerto `Clock` (Cero `sleep`)

> [!CAUTION]
> **Prohibición Absoluta:** Está estrictamente prohibido utilizar `time.sleep()`, `asyncio.sleep()` o llamadas directas a `datetime.now()` en la lógica del sistema y en las pruebas.

Todo cálculo de expiración, vencimiento de citas o reglas de estancamiento temporal consulta el puerto `Clock`. En los tests, se utiliza `SimulatedClock` para manipular el tiempo de forma instantánea:

```python
def test_alerta_derivacion_estancada_se_dispara_a_los_15_dias(
    container: Container,
) -> None:
    # 1. Crear un caso y derivarlo en t = 0
    caso_id = container.referral_service.crear_derivacion(...)
    
    # 2. En t = 10 días, no debe haber alerta
    container.clock.advance(days=10)
    alertas_t10 = container.alert_engine.evaluar_reglas()
    assert len(alertas_t10) == 0
    
    # 3. En t = 16 días, se dispara la alerta de estancamiento
    container.clock.advance(days=6)
    alertas_t16 = container.alert_engine.evaluar_reglas()
    assert len(alertas_t16) == 1
    assert alertas_t16[0].regla == "DERIVACION_ESTANCADA"
```

---

## 4. Pruebas de Conformidad de Puertos

Para asegurar que los adaptadores en memoria y los adaptadores de base de datos real sean 100% intercambiables sin alterar el comportamiento, se define una **Suite de Conformidad** común:

```python
# tests/adapters/test_repositories_contract.py
import pytest
from app.ports.repositories import PacienteRepository

class PacienteRepositoryContractTests:
    """Clase base de pruebas que toda implementación de PacienteRepository debe heredar."""
    
    @pytest.fixture
    def repo(self) -> PacienteRepository:
        raise NotImplementedError

    def test_guardar_y_recuperar_paciente(self, repo: PacienteRepository) -> None:
        paciente = factory_paciente()
        repo.add(paciente)
        recuperado = repo.get(paciente.id)
        assert recuperado == paciente

# Pruebas concretas para Memory y Postgres:
class TestInMemoryPacienteRepository(PacienteRepositoryContractTests):
    @pytest.fixture
    def repo(self) -> PacienteRepository:
        return InMemoryPacienteRepository()

class TestPostgresPacienteRepository(PacienteRepositoryContractTests):
    @pytest.fixture
    def repo(self) -> PacienteRepository:
        return PostgresPacienteRepository(session_test)
```

---

## 5. Pruebas de Contrato OpenAPI con Schemathesis

Schemathesis toma `contracts/openapi.json` y ejecuta fuzzing automatizado sobre la aplicación ASGI:

```bash
# Ejecutar verificación de contrato
make contract
```

### Propiedades Evaluadas:
* `not_a_server_error`: Ausencia total de errores $500$ no controlados ante cualquier entrada deforme o extrema.
* `status_code_conformance`: Todo código de respuesta HTTP devuelto está documentado en el esquema OpenAPI.
* `content_type_conformance`: Todas las respuestas son `application/json` o `application/problem+json`.
* `response_schema_conformance`: El cuerpo de las respuestas coincide exactamente con los modelos Pydantic declarados.

---

## 6. Estructura del Directorio `tests/`

La carpeta `tests/` replica fielmente la arquitectura interna de `app/`:

```
backend/tests/
├── conftest.py                      # Fixtures globales, container en memoria, reloj simulado
├── factories/                       # Generadores de entidades de prueba con datos verosímiles
│   ├── paciente_factory.py
│   ├── caso_factory.py
│   └── cita_factory.py
│
├── domain/                          # Nivel 1: Tests unitarios puros
│   ├── screening/
│   │   ├── test_catalog.py
│   │   └── test_rules_pure.py
│   ├── casefile/
│   │   ├── test_state_machine.py
│   │   └── test_timeline.py
│   ├── scheduling/
│   │   └── test_grouping_heuristic.py
│   └── alerts/
│       └── test_temporal_rules.py
│
├── services/                        # Nivel 2: Tests de servicios de aplicación
│   ├── test_screening_service.py
│   ├── test_referral_service.py
│   ├── test_scheduling_service.py
│   └── test_alert_engine.py
│
├── adapters/                        # Nivel 3: Tests de conformidad de adaptadores
│   ├── test_repositories_compliance.py
│   ├── test_notifier_recording.py
│   └── test_clock_simulated.py
│
├── api/                             # Nivel 4: Tests de integración ASGI
│   ├── test_health_worker_routes.py
│   ├── test_family_routes.py
│   ├── test_specialist_routes.py
│   ├── test_admin_routes.py
│   └── test_errors_rfc7807.py
│
└── contracts/                       # Nivel 5: Tests de contrato y Schemathesis
    └── test_openapi_contract.py
```

---

## 7. Umbrales y Comandos de Ejecución

```bash
# Ejecutar toda la suite de pruebas con cálculo de cobertura
uv run pytest --cov=app --cov-report=term-missing --cov-fail-under=90

# Ejecutar únicamente pruebas unitarias rápidas de dominio
uv run pytest tests/domain

# Ejecutar pruebas con reporte detallado
make test
```
