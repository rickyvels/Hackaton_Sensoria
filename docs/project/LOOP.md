# Loop de entrega del MVP

## Objetivo

Entregar una demostración funcional y verificable de Neuroalianza — Ruta Viva con dos productos independientes conectados a la misma API: plataforma profesional y PWA familiar.

## Alcance obligatorio

- Visualización de una ejecución multiagente explicable, iniciada únicamente por “Reproducir caso” y sin reproducción automática ni bucles.
- Cuatro agentes: Navegador de Ruta, Coordinador de Atención, Seguimiento Personalizado e Inteligencia y Calidad.
- Compuerta humana separada de los agentes: ninguna propuesta modifica la ruta ni crea tareas sin aprobación profesional.
- Cada paso expone estado textual, entrada, acción/herramienta, salida, evidencia y confianza; el significado nunca depende solo del color.
- PWA familiar separada, instalable, táctil, responsive y conectada al mismo caso sintético.
- Movimiento reducido: los viajes entre nodos se sustituyen por cambios de estado y texto.

## Restricciones

- No usar datos clínicos reales ni presentar diagnósticos, prescripciones o decisiones automatizadas.
- No otorgar privilegios de escritura a proveedores LLM; los modelos solo pueden proponer artefactos estructurados.
- No añadir dependencias pesadas salvo que exista una mejora demostrable y verificada.
- No copiar código sin licencia compatible; adaptar patrones con implementación propia.
- No publicar, desplegar ni modificar servicios externos sin autorización explícita.
- No hay auto-merge ni auto-deploy; todo cambio externo exige una decisión humana explícita.

## Presupuesto y corte

- Un run aborda un flujo demostrable o un conjunto pequeño de defectos relacionados.
- Tres fallos consecutivos con la misma causa activan el circuit breaker.
- Las dependencias nuevas son cero por defecto.
- El detalle se mantiene en `loop-budget.md` y las restricciones estructuradas en `loop-constraints.md`.

## Ciclo

1. Auditar producto, diseño, accesibilidad y flujo de extremo a extremo.
2. Seleccionar el mayor problema demostrable pendiente en `STATE.md`.
3. Implementar un cambio acotado preservando los contratos clínicos y de autorización.
4. Ejecutar build, pruebas, revisión de movimiento y comprobaciones de accesibilidad.
5. Registrar evidencia y siguiente prioridad en `STATE.md`.

## Criterios de salida

- `npm test` termina sin fallos.
- `npm run build` termina sin fallos.
- La plataforma muestra la ejecución paso a paso y permite aprobar o rechazar en una compuerta explícita.
- La PWA conserva login, ruta familiar y reporte de barreras con objetivos táctiles de al menos 44 px.
- No hay animaciones esenciales que se pierdan con `prefers-reduced-motion`.
- La revisión independiente no mantiene hallazgos bloqueantes o altos sin resolver.
