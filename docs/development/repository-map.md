# Mapa del repositorio

```text
.
├── apps/
│   ├── platform/                 # React + Vite para profesionales
│   └── family-pwa/               # React + Vite PWA para familias
├── api/                          # FastAPI, SQLite, reglas y orquestación
│   └── app/orchestration/        # Cola, máquina de estados y proveedores
├── docs/
│   ├── architecture/             # Agentes, contratos y trazabilidad
│   ├── development/              # Guías para el equipo
│   ├── entrega/                  # Anexos exigidos por las bases de la Hackatón
│   ├── project/                  # Límites, ética y bitácora del MVP
│   └── research/                 # Material de referencia, no requerido en runtime
├── scripts/                      # Utilidades de los scripts de npm
└── LICENSE                       # MIT
```

## Dónde trabajar

- Para la vista profesional: `apps/platform/src/App.tsx` y sus estilos locales.
- Para la PWA: `apps/family-pwa/src/App.tsx` y `apps/family-pwa/src/api.ts`.
- Para endpoints: `api/app/routers/`.
- Para entidades y contratos: `api/app/models.py` y `api/app/schemas.py`.
- Para agentes, reglas de ejecución y trazabilidad: `api/app/orchestration/`.

Cada aplicación tiene su propio `package.json` y se puede instalar o compilar de forma independiente.
