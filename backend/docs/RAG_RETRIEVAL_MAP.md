# Mapa de recuperación RAG familiar

El asistente indexa todos los archivos Markdown de `knowledge_base/02_RAG_READY` que estén autorizados para familias. Descarta recursos sin institución identificada y documentos cuyo `uso_permitido_rag` no sea `orientacion_no_diagnostica_con_fuente`.

Cada consulta se asigna, de manera determinista, a una categoría principal antes de llamar al modelo:

| Intención familiar | Categoría RAG | Ejemplos de señales en la consulta |
| --- | --- | --- |
| Etapa del desarrollo | `edad` | edad, meses, etapa, desarrollo |
| Comprender una preocupación | `senal` | señal, alarma, preocupa, no responde, no habla |
| Actividad práctica | `casa` | casa, actividad, juego, rutina, estimular |
| Preparar atención profesional | `consulta` | consulta, cita, observar, registrar, llevar |
| Material verificable | `informacion_oficial` | oficial, MINSA, guía, cartilla |
| Revisar logros | `hitos` | hito, debería, lograr, gatea, camina |

Si una consulta contiene más de una señal, se prioriza: `casa`, `consulta`, `senal`, `hitos`, `informacion_oficial` y `edad`. Así una petición explícita de actividades en casa no se mezcla con recursos generales de edad. Además, se usan `areas` y `palabras_clave` de cada recurso para priorizar lenguaje, motricidad, interacción social, audición y alimentación. La edad del niño mejora la prioridad cuando el recurso declara límites de edad; si el título indica una edad concreta incompatible, el recurso se excluye. Los resultados se deduplican por `id` y cada respuesta expone título, institución, enlace oficial o trazabilidad local.

Actualmente la mayoría de archivos preparados no declara `edad_min_meses` ni `edad_max_meses`. Por ello el motor evita recomendar una edad explícita incompatible, pero no presenta la edad como una cobertura precisa hasta completar esos metadatos o segmentar la Libreta CRED por etapa.

El modelo solo recibe los cuatro recursos con mayor relevancia y nunca el corpus completo. Así se conserva la trazabilidad y se evita que responda fuera de la base validada.
