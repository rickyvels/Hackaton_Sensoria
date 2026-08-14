# Convenciones del proyecto

## Producto

Neuroalianza — Ruta Viva es un MVP de coordinación y continuidad de atención. No diagnostica, prescribe ni reemplaza decisiones profesionales.

## Arquitectura

- `apps/platform`: plataforma web profesional.
- `apps/family-pwa`: PWA independiente para familias.
- `api`: API FastAPI y persistencia SQLite sintética compartida.
- `docs/architecture`: documentación de agentes, contratos y trazabilidad para integraciones futuras.

## Verificación obligatoria

Antes de cerrar cambios de código:

```bash
npm test
npm run build
```

Para cambios visuales, verificar escritorio, móvil, teclado y `prefers-reduced-motion`.

## Normas

- Preservar la autorización humana antes de crear tareas o cambiar la ruta.
- Los proveedores de IA solo proponen artefactos estructurados; nunca ejecutan acciones clínicas.
- Mantener plataforma y PWA como aplicaciones separadas conectadas a la misma API.
- No usar datos reales, secretos incrustados ni dependencias sin licencia compatible.
- No publicar, desplegar, hacer push ni modificar infraestructura externa sin autorización explícita.
