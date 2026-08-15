# Neuroalianza Backend — Hoja de Ruta y Especificación Técnica

Este documento consolida la arquitectura, principios de diseño, estrategia de pruebas y secuencia de implementación para el backend de **Neuroalianza** (Hackatón Niño San Borja 2026 — Desafío 04: Neurodesarrollo).

---

## 1. Principios Arquitectónicos

1. **Puertos y Adaptadores (Arquitectura Hexagonal):**
   - El **Dominio (`domain/`)** es el núcleo puro del sistema y utiliza exclusivamente la biblioteca estándar de Python (`stdlib`). No importa FastAPI, Pydantic, SQLAlchemy ni HTTPX.
   - Los **Puertos (`ports/`)** son contratos abstractos (`Protocol` / `ABC`) definidos en términos del dominio.
   - Los **Adaptadores (`adapters/`)** implementan los puertos (ej. almacenamiento en memoria para prototipo/demo y PostgreSQL para producción).
   - Los **Servicios (`services/`)** son casos de uso que orquestan el dominio y los puertos, y publican eventos de dominio.
   - La **Capa API (`api/`)** expone los endpoints en FastAPI, traduce errores a RFC 7807 y maneja modelos Pydantic separados del dominio.
   - **Composition Root (`container.py`)**: Es el único archivo autorizado a instanciar y ensamblar adaptadores concretos.

2. **Comunicación por Eventos de Dominio:**
   - Los módulos de dominio no se invocan directamente entre sí. Publican eventos en un bus desacoplado.

3. **Verificación Estricta de Dependencias e Invariantes:**
   - Verificación estática automatizada de capas con `import-linter`.
   - Control estricto de tipos con `MyPy` en modo estricto y tipos nominales (`NewType`) para identificadores.
   - Linter exhaustivo con `Ruff` (`select = ["ALL"]`).

4. **Testing First y Calidad:**
   - Pruebas unitarias de dominio con `Hypothesis` (Property-based testing).
   - Pruebas de conformidad de puertos compartidas entre adaptadores de memoria y producción.
   - Pruebas de contrato con `Schemathesis` contra `contracts/openapi.json`.
   - Umbrales de cobertura mínimos: Domain $\ge 95\%$, Services $\ge 90\%$, Ports $= 100\%$, Adapters/Memory $\ge 90\%$, API $\ge 85\%$, Global $\ge 90\%$.

---

## 2. Hoja de Ruta de Implementación

| Fase | Entregable | Alcance Principal | Criterio de Término |
| :---: | :--- | :--- | :--- |
| **1** | **Esqueleto base, configuración, puertos y adaptadores en memoria** | Toolchain (`uv`, `ruff`, `mypy`, `import-linter`, `pytest`), `app/config.py`, `app/ports/`, `app/adapters/memory/`, `app/container.py`, `Makefile`. | `make check` pasa al 100% sobre proyecto base. |
| **2** | **Dominio: Estados y Tamizaje con pruebas** | Tipos `NewType`, máquina de estados de `Caso`, timeline inmutable, motor puro de tamizaje (EEDP/TEPSI/M-CHAT-R/F), reglas de alerta. | Cobertura $\ge 95\%$ en `domain/` con `Hypothesis`. |
| **3** | **Servicios y Bus de Eventos** | `ScreeningService`, `ReferralService`, `SchedulingService`, `CasefileService`, `NotificationService`, `AlertEngine`, `MetricsService`. | Flujo detección $\rightarrow$ derivación probado e2e. |
| **4** | **API: Rutas de los tres roles** | Endpoints de Personal de Salud, Familia, Especialista y Sistema. RFC 7807 error handler, esquemas Pydantic `extra="forbid"`. | `openapi.json` exportado y estable. |
| **5** | **Motor de Alertas y Reloj Simulado** | Evaluación periódica de alertas, disparadores por endpoint `/admin/alerts/run`, simulación temporal para el jurado. | Alertas disparables y validadas temporalmente. |
| **6** | **Métricas y Datos de Demostración** | Cálculo de métricas desde timeline, dataset verosímil (`demo_data.py`) con casos en todos los estados. | Panel de gestión con datos coherentes en demo. |
| **7** | **Schemathesis y Endurecimiento** | Pruebas de contrato con OpenAPI, validación de propiedades ASGI, seguridad (`bandit`). | Suite de contrato Schemathesis en verde. |
| **8** | **Adaptador PostgreSQL** *(Opcional)* | Adaptador de base de datos relacional y Unit of Work en PostgreSQL. | Suite de conformidad de puertos en verde con ambos adaptadores. |

---

## 3. Matriz de Comandos del Proyecto

- `make install`: Instala dependencias del proyecto y herramientas de desarrollo.
- `make run`: Arranca el servidor FastAPI con adaptadores en memoria.
- `make lint`: Ejecuta `ruff check` y `ruff format --check`.
- `make types`: Ejecuta análisis estático con `mypy`.
- `make arch`: Ejecuta verificación de contratos de capas con `import-linter`.
- `make test`: Ejecuta `pytest` con reporte y umbrales de cobertura.
- `make contract`: Exporta `contracts/openapi.json` y ejecuta `schemathesis`.
- `make check`: Ejecuta toda la suite de validación (`lint`, `types`, `arch`, `test`).
- `make seed`: Recarga el dataset de demostración.
