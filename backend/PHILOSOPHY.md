# 🏛️ Filosofía y Principios de Diseño del Backend — Neuroalianza

> **Proyecto:** Neuroalianza (Hackatón INSN San Borja 2026 — Desafío 04: Neurodesarrollo)  
> **Propósito:** Definir los fundamentos éticos, clínicos, arquitectónicos y de ingeniería que rigen cada línea de código del backend.

---

## 1. Misión y Postura Ético-Clínica

Neuroalianza nace para transformar la ruta asistencial de niños y adolescentes con sospecha o diagnóstico de trastornos del neurodesarrollo (TEA, TDAH, trastornos del lenguaje, retraso global del desarrollo). En el Perú, donde el **85.4% de infantes evaluados en hospitales de referencia presentan alteraciones no detectadas a tiempo** y las familias de regiones enfrentan barreras geográficas y económicas críticas, el software médico tiene un impacto humano directo.

Bajo este contexto, el backend adopta tres principios ético-clínicos inquebrantables:

### 1.1 El Sistema NO Diagnostica
* **Postura:** El software es un facilitador de la ruta y un soporte para la toma de decisiones, nunca un sustituto del criterio médico o multidisciplinario.
* **Reflejo en Código:** El motor de tamizaje genera **niveles de riesgo** (`BAJO`, `MODERADO`, `ALTO`), **justificaciones de ítems activados** y **recomendaciones de acción** (ej. *"Reevaluar en 3 meses"*, *"Derivar a evaluación especializada"*). Está estrictamente prohibido que el backend emita etiquetas diagnósticas automatizadas o sugerencias farmacológicas.

### 1.2 Minimización y Protección Rigurosa de Datos Pediátricos
* **Postura:** Tratamos con información de salud de menores de edad y familias en situación de vulnerabilidad.
* **Reflejo en Código:** 
  * Solo se persisten los campos indispensables para la articulación de la ruta asistencial.
  * **Cero datos personales en logs:** Nombres, DNIs, números telefónicos y contenidos de notas clínicas jamás se escriben en los logs del sistema. Los logs operan únicamente con identificadores tipados (`CasoId`, `PacienteId`, `RequestId`).
  * Trazabilidad y auditoría inmutable de accesos y transiciones.

### 1.3 Empatía Estructural con la Realidad Nacional
* **La inasistencia no es falta de compromiso:** Las cancelaciones y ausencias capturan motivos estructurales tipados (costo de traslado, distancia, horario laboral, salud).
* **Conectividad intermitente:** Operaciones idempotentes (`Idempotency-Key`) y paginación por cursor para tolerar conexiones lentas en postas de salud rurales y zonas periurbanas.
* **Agrupación de sesiones:** Algoritmos pensados para concentrar evaluaciones de 4 a 7 sesiones en la menor cantidad de viajes para familias de provincia.

---

## 2. Principios Arquitectónicos Fundamentales

```
┌─────────────────────────────────────────────────────────────┐
│                            API                              │
│   (FastAPI, Rutas por Rol, RFC 7807, Esquemas Pydantic)     │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               │
┌──────────────────────────────┐               │
│           SERVICES           │               │
│  (Casos de Uso, Orquestación)│               │
└──────────────┬───────────────┘               │
               │                               │
               ▼                               ▼
┌──────────────────────────────┐  implementa   ┌──────────────┐
│            PORTS             │◄──────────────│   ADAPTERS   │
│    (Protocolos / ABC)        │               │(Memory, PG,  │
└──────────────▲───────────────┘               │ Notifier...) │
               │                               └──────────────┘
               │
┌──────────────┴───────────────┐
│            DOMAIN            │
│ (Entidades Puras, Máquina de │
│  Estados, Motor de Tamizaje) │
└──────────────────────────────┘
```

### 2.1 Puertos y Adaptadores (Arquitectura Hexagonal)
* **Aislamiento del Dominio:** El núcleo del negocio (`app/domain/`) es Python puro (`stdlib`). No tiene dependencias de frameworks web (FastAPI), bases de datos (SQLAlchemy/Postgres), ORMs ni librerías de serialización externa.
* **Contratos Explícitos (Puertos):** Los puertos (`app/ports/`) definen interfaces abstractas mediante `typing.Protocol`. El dominio y los servicios expresan qué necesitan (guardar un caso, despachar una notificación, consultar la hora), no cómo se hace.
* **Sustituibilidad Total:** El sistema puede arrancar en modo demostración con adaptadores en memoria con cero dependencias externas y migrar a PostgreSQL y colas asíncronas en producción simplemente cambiando variables de entorno.

### 2.2 Regla de Dependencia Estricta
* **Flujo Unidireccional:** Las capas exteriores pueden importar de las interiores; las capas interiores jamás importan de las exteriores.
  * `domain` no importa nada del proyecto (solo `stdlib`).
  * `ports` solo importa de `domain`.
  * `services` importa de `domain` y `ports`.
  * `adapters` implementa `ports` y usa `domain`.
  * `api` coordina `services`, `ports` y `domain`.
* **Guardián Automático:** Esta regla no es una sugerencia verbal: está codificada en contratos de `import-linter` que fallan el pipeline de CI ante cualquier transgresión.

### 2.3 Modularidad por Contextos Funcionales (DDD)
* Dentro de `app/domain/`, la separación se realiza por contextos de negocio delimitados, no por tipo técnico:
  * `screening` (Tamizaje clínico y reglas de riesgo).
  * `casefile` (Expediente, ciclo de vida del caso, notas multidisciplinarias).
  * `scheduling` (Agenda, disponibilidad, heurística de agrupamiento).
  * `alerts` (Reglas temporales de detección de estancamiento o deserción).
* **Independencia de Contextos:** Los módulos del dominio no se importan entre sí; se comunican mediante **Eventos de Dominio** desacoplados.

### 2.4 Comunicación Desacoplada por Eventos
* Cuando ocurre un cambio relevante (ej. `CasoDerivado`, `CitaNoAsistida`), el servicio emite un evento al `EventBus`.
* Los módulos de métricas, notificaciones y alertas reaccionan de manera independiente.
* Añadir un nuevo efecto secundario (como una auditoría o un aviso a un actor comunitario) no modifica el flujo principal.

### 2.5 Inmutabilidad y Trazabilidad (Timeline como Fuente de Verdad)
* Toda transición de estado en un caso (`Transicion`) es inmutable y `append-only`.
* Cada transición registra: `estado_origen`, `estado_destino`, `actor_id`, `motivo`, `timestamp` y `metadata`.
* No existen borrados ni modificaciones de historial. Las métricas de tiempos de espera y cuellos de botella se calculan dinámicamente desde el timeline.

### 2.6 Funciones Puras para la Lógica Crítica
* La máquina de estados y el motor de tamizaje son **funciones puras**: dadas las mismas entradas, producen exactamente la misma salida sin efectos secundarios ni llamadas I/O.
* Esto garantiza que los algoritmos clínicos sean **100% deterministas, auditables y testeables en milisegundos**.

### 2.7 Control Absoluto del Tiempo (Virtual Clock)
* Prohibido el uso de `datetime.now()` directo o llamadas a `time.sleep()`.
* Todo cálculo temporal y vencimiento de alertas pasa por el puerto `Clock`.
* En modo demostración y testing, el reloj simulado permite avanzar semanas completas instantáneamente para evidenciar la activación de alertas de inasistencia y estancamiento ante el jurado y en tests automatizados.

---

## 3. Filosofía de Desarrollo y Calidad

1. **Tipado Estricto de Extremo a Extremo:** Tipos diferenciados (`NewType`) para identidades (`CasoId`, `PacienteId`), modelos inmutables (`dataclasses(frozen=True)`), enums cerrados y modo `mypy --strict`. Los bugs se previenen en tiempo de edición, no en runtime.
2. **El Esquema OpenAPI como Fuente de Verdad:** Contrato formal versionado (`contracts/openapi.json`). Schemathesis verifica que la API cumpla estrictamente lo prometido.
3. **Cero Tolerancia a Fallos Silenciosos:** `extra="forbid"` en Pydantic, errores RFC 7807 unificados y `assert_never` en evaluación de exhaustividad.
4. **Lo que corre en Local corre en CI:** El comando `make check` unifica formateo, linting, análisis estático, reglas de arquitectura, suite de pruebas y pruebas de contrato.
