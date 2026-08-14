# Seguridad y límites

## Gates humanos

- Un reporte familiar puede generar una propuesta, pero no una tarea.
- Solo un profesional autenticado puede aprobar o rechazar la propuesta.
- Una aprobación debe incluir la acción operativa autorizada.
- Un rechazo bloquea la acción; no existe ejecución silenciosa ni reintento automático.

## Acciones prohibidas

- Diagnosticar, prescribir, priorizar clínicamente o prometer atención.
- Exponer DNI, contraseña, tokens o información clínica real en registros o pantallas.
- Permitir escritura directa del LLM en la base de datos.
- Hacer auto-merge, push, despliegue o cambios en servicios de terceros.

## Datos y demostración

El MVP usa identidades y casos sintéticos. La procedencia de cada propuesta debe distinguir entrada, regla, herramienta, salida y decisión humana.

## MCP y conectores

No son necesarios en ejecución. Cualquier conector futuro será de solo lectura por defecto y requerirá autorización explícita para escribir en sistemas externos.
