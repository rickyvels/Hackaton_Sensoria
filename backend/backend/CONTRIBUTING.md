# 🤝 Guía de Contribución al Backend — Neuroalianza

> ¡Bienvenido al equipo de desarrollo de **Neuroalianza**!  
> Este backend está diseñado bajo estándares de alta calidad médica, arquitectura hexagonal limpia y tipado estricto.  
> Cada integración o cambio que se agregue **DEBE incluir sus pruebas automatizadas correspondientes** para verificar su correcto funcionamiento.

---

## 🧭 1. Principios de Contribución

Antes de escribir la primera línea de código, ten presentes estos 4 pilares:
1. **La regla de dependencia es sagrada:** El dominio no conoce la infraestructura; los puertos definen contratos y los adaptadores los implementan.
2. **Testing obligatorio para toda integración:** Ninguna funcionalidad, endpoint, regla de negocio o adaptador se fusiona sin pruebas automatizadas que garanticen su comportamiento.
3. **El tiempo de desarrollo es valioso:** Usa adaptadores en memoria y el puerto `Clock` para pruebas que corren en milisegundos sin levantar bases de datos externas.
4. **Respeto absoluto a la privacidad médica:** Prohibido registrar datos personales o sensibles en logs o repositorios.

---

## 🛠️ 2. Entorno y Configuración Inicial

### 2.1 Prerrequisitos
* **Python 3.12+**
* **[`uv`](https://docs.astral.sh/uv/)** (Gestor ultrarrápido de paquetes y entornos Python de Astral)
* **Make**

### 2.2 Configuración Rápida
```bash
# 1. Posicionarse en el directorio del backend
cd backend

# 2. Sincronizar el entorno virtual y dependencias con uv
uv sync

# 3. Verificar que la suite de calidad pase completamente
make check
```

---

## 🌿 3. Flujo de Trabajo con Git y Convenciones

### 3.1 Nombres de Ramas
Usa la convención de prefijos descriptivos:
* `feat/<contexto>-<descripcion-corta>`: Nueva funcionalidad (ej. `feat/screening-mchat-catalog`)
* `fix/<contexto>-<descripcion-corta>`: Corrección de errores (ej. `fix/scheduling-overlap-detection`)
* `test/<contexto>-<descripcion-corta>`: Adición o mejora de pruebas (ej. `test/casefile-state-transitions`)
* `refactor/<contexto>-<descripcion-corta>`: Refactorización sin cambio de comportamiento (ej. `refactor/ports-repository-protocols`)
* `docs/<descripcion-corta>`: Documentación (ej. `docs/api-specification-update`)

### 3.2 Mensajes de Commit (Conventional Commits)
Sigue el estándar [Conventional Commits](https://www.conventionalcommits.org/):
```
<tipo>(<alcance>): <descripción concisa en imperativo y minúsculas>

[cuerpo opcional detallando el porqué del cambio]
```
Ejemplos:
* `feat(screening): implement m-chat-r/f scoring rules and risk level output`
* `fix(casefile): prevent invalid transition from DETECTADO directly to EN_TERAPIA`
* `test(scheduling): add property-based test for session grouping heuristic`
* `docs(api): document RFC 7807 error responses for specialist endpoints`

---

## 🏗️ 4. Reglas de Arquitectura y Capas

El backend sigue estrictamente el patrón **Puertos y Adaptadores (Arquitectura Hexagonal)**.

```
app/
├── domain/       # 1. Reglas de negocio puras (Screening, Casefile, Scheduling, Alerts)
├── ports/        # 2. Interfaces abstractas / Contratos (Protocol)
├── services/     # 3. Casos de uso / Orquestación de dominio y puertos
├── adapters/     # 4. Implementaciones concretas (Memory, Postgres, Notifier, Storage)
└── api/          # 5. Entrada HTTP (FastAPI, Esquemas Pydantic, RFC 7807)
```

### 4.1 Reglas de Importación (Verificadas por `import-linter`)
| Capa | Puede Importar | NUNCA Importa |
| :--- | :--- | :--- |
| **`app.domain`** | Únicamente `stdlib` de Python | `ports`, `adapters`, `services`, `api`, `fastapi`, `pydantic`, `sqlalchemy` |
| **`app.ports`** | `app.domain` y `stdlib` | `adapters`, `services`, `api` |
| **`app.services`** | `app.domain`, `app.ports`, `stdlib` | `adapters`, `api` |
| **`app.adapters`** | `app.domain`, `app.ports`, librerías I/O | `services`, `api` |
| **`app.api`** | `app.domain`, `app.ports`, `app.services`, `fastapi`, `pydantic` | `adapters` (salvo en el composition root `app/container.py`) |

> [!CAUTION]
> **Modularidad entre contextos de dominio:**  
> Los submódulos de dominio (`screening`, `casefile`, `scheduling`, `alerts`) son independientes entre sí. **No se importan directamente entre sí**, se comunican a través de **eventos de dominio** (`app.domain.events`).

---

## 🎨 5. Estándares de Código y Tipado

### 5.1 Ruff (Linter y Formateador Estricto)
* Ejecutamos Ruff con `select = ["ALL"]` (verificado por `make lint`).
* **Límite de línea:** 100 caracteres.
* **Complejidad ciclomática (McCabe):** Máximo 8 por función.
* **Docstrings:** Convención Google (`pydocstyle`).
* **Prohibido:** Código comentado (`ERA`), argumentos no utilizados (`ARG`), o silenciar reglas de Ruff sin justificación explícita en comentario.

### 5.2 MyPy (Tipado Estricto)
* Modo `strict = true` activo.
* **Tipos de Identidad Diferenciados:** Usar `NewType` para identificadores de agregados (`CasoId`, `PacienteId`, `CitaId`, `UsuarioId`) para evitar intercambios accidentales de UUIDs.
* **Inmutabilidad:** Las entidades y Value Objects del dominio deben usar `@dataclass(frozen=True)`.
* **Conjuntos Cerrados:** Usar `Literal` o `Enum` para estados, roles, severidades y modalidades.
* **Exhaustividad:** Usar `typing.assert_never()` en verificaciones de ramas de máquinas de estados.
* **Prohibido:** `# type: ignore` sin especificar el código de error correspondiente.

### 5.3 Modelos Pydantic en Capa API
* `extra = "forbid"` obligatorio en todos los esquemas de entrada (evita campos fantasma o mal escritos).
* Validación tipada estricta (rangos, longitudes, patrones regex).
* Ejemplos completos en cada esquema para alimentar la documentación OpenAPI interactiva.

---

## 🧪 6. Estrategia y Requisitos de Testing

El testing no es un añadido opcional; es el núcleo que garantiza la viabilidad del software en un entorno clínico.

### 6.1 Pirámide de Pruebas
| Nivel | Proporción | Alcance | Velocidad |
| :--- | :--- | :--- | :--- |
| **1. Unitarias de Dominio** | ~60% | Máquina de estados, motor de tamizaje, reglas de alerta | `< 10ms` por test |
| **2. Servicios de Aplicación** | ~20% | Casos de uso completos con adaptadores en memoria | `< 20ms` por test |
| **3. Conformidad de Puertos** | ~5% | Suites compartidas que validan implementaciones en memoria y DB | Rápida |
| **4. Integración API (ASGI)** | ~10% | Endpoints HTTP con `httpx.AsyncClient` en memoria (sin servidor externo) | Rápida |
| **5. Pruebas de Contrato (Schemathesis)** | ~5% | Pruebas basadas en propiedades sobre `openapi.json` | Moderada |

### 6.2 Umbrales Mínimos de Cobertura (Coverage)
El pipeline fallará si la cobertura desciende de estos umbrales:
* **`app/domain/`**: $\ge 95\%$
* **`app/services/`**: $\ge 90\%$
* **`app/ports/`**: $100\%$
* **`app/adapters/memory/`**: $\ge 90\%$
* **`app/api/`**: $\ge 85\%$
* **Global del Backend:** $\ge 90\%$

### 6.3 Reglas de Oro en Tests
1. **Prohibido `time.sleep()`:** El tiempo se controla exclusivamente a través del puerto `Clock` y su implementación simulada `SimulatedClock.advance()`.
2. **Sin red en pruebas:** Los tests no deben realizar llamadas HTTP externas ni depender de conexiones activas a internet.
3. **Tests independientes y reproducibles:** Cada test debe poder ejecutarse en cualquier orden sin compartir estado mutable.
4. **Pruebas basadas en propiedades (Hypothesis):** Usar generadores para verificar invariantes de la máquina de estados y el motor de tamizaje ante cientos de entradas sintéticas.

---

## ⚡ 7. Comandos de Desarrollo (`Makefile`)

Utiliza los comandos Make para todas las tareas de verificación:

| Comando | Descripción |
| :--- | :--- |
| `make install` | Instala y sincroniza las dependencias con `uv sync` |
| `make run` | Arranca el servidor FastAPI en modo desarrollo (`uv run fastapi dev main.py`) |
| `make lint` | Ejecuta verificación de formato y linter estricto con Ruff |
| `make format` | Aplica formateo automático con Ruff |
| `make types` | Ejecuta el análisis de tipos estático con MyPy |
| `make arch` | Valida los contratos de arquitectura y fronteras con `import-linter` |
| `make test` | Ejecuta la suite completa de Pytest con reporte de cobertura |
| `make contract` | Exporta `contracts/openapi.json` y ejecuta pruebas de conformidad con Schemathesis |
| `make check` | **La puerta de entrada:** Ejecuta `lint`, `types`, `arch`, `test` y `contract` en secuencia |
| `make seed` | Restablece el dataset de demostración precargado |

---

## 📋 8. Checklist para Pull Requests

Antes de abrir o solicitar revisión de un Pull Request, confirma que:
- [ ] Tu rama parte de la versión más reciente de `main`.
- [ ] Has añadido pruebas unitarias o de integración para cada nueva funcionalidad o cambio.
- [ ] La cobertura de código cumple o supera los umbrales mínimos definidos.
- [ ] Has ejecutado `make check` localmente y todas las comprobaciones pasan en verde (sin warnings ni errores).
- [ ] Los mensajes de commit siguen la convención Conventional Commits.
- [ ] No se incluye información sensible, credenciales o datos personales de prueba en el código o commits.
- [ ] Si modificaste endpoints o modelos de API, has regenerado y verificado `contracts/openapi.json`.
