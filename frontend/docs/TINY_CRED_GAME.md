# Juego del desarrollo con Tiny

Vigilancia lúdica del neurodesarrollo para familias, accesible desde el botón central (**+**) de la barra inferior de la PWA. Traduce la Libreta de Control de Crecimiento y Desarrollo (CRED) del MINSA a un recorrido de preguntas cortas, con mascota, semáforo y NeuroCoins.

## 1. Alcance clínico

Esto es **vigilancia orientativa**, no un tamizaje diagnóstico. La libreta CRED distingue ambas cosas y el juego respeta esa frontera:

- No emite diagnósticos ni nombra trastornos.
- El resultado siempre deriva a la consulta con el profesional de salud.
- El semáforo rojo muestra además las "Señales de alto riesgo" de la libreta, que son motivo de atención inmediata.
- El pie de cada resultado repite que no reemplaza una evaluación profesional.

## 2. Procedencia de los datos

Todo el contenido vive en [`src/data/credDevelopment.ts`](../src/data/credDevelopment.ts) y proviene de la Libreta CRED del MINSA:

| Constante | Sección de la libreta | Fuente citada en la libreta |
| --- | --- | --- |
| `CRED_MILESTONES` | "¿Cómo va mi desarrollo?" → tabla *Vigilancia del desarrollo* | Huanca, D. *Guía de Vigilancia del Neurodesarrollo* |
| `CRED_ALERT_SIGNS` | *Señales de alerta en mi desarrollo* | Queensland Government, *The "Red Flag" Early Intervention Referral Guide for children 0 - 5 years* |
| `SEMAFORO_COPY` | *Tamizaje del desarrollo* → semáforo verde / amarillo / rojo | — |
| `CRED_HIGH_RISK_SIGNS` | *Señales de alto riesgo* | — |
| `CRED_HOME_ACTIVITIES` | *Promoviendo mi desarrollo* | — |

Cada hito y cada señal conserva su texto literal en `skill` / `sign`. El campo `question` es la reformulación en lenguaje familiar que se muestra en pantalla. En el resultado se listan los textos literales, no las reformulaciones, para que la familia pueda mostrarlos en el establecimiento de salud.

## 3. Selección de preguntas

La tabla de vigilancia tiene columnas en recién nacido, 3, 6, 9, 12, 18, 24 y 30 meses. La tabla de señales de alerta tiene columnas en 6, 9, 12, 18 meses y 2, 3, 4, 5 años, más una columna "cualquier edad".

La libreta indica: *"Busca mi edad en la parte de arriba o la edad menor más cercana a la mía"*. `getMilestonesForAge` y `getAlertSignsForAge` implementan exactamente esa regla — la columna documentada mayor que no supere la edad elegida.

Dos consecuencias que conviene tener presentes:

- **Sobre los 30 meses la tabla de hitos se agota.** Para 3, 4 y 5 años se reutiliza la columna de 30 meses: son habilidades que a esa edad ya deberían estar consolidadas, así que fallarlas es más significativo, no menos.
- Las señales de "cualquier edad" (`ageMonths === 0`) se añaden siempre, en cualquier etapa.

Un mazo (`buildDeck`) ordena primero los hitos y después las alertas: se empieza reconociendo logros antes de preguntar por preocupaciones.

## 4. Semáforo

`resolveSemaforo(hitosNoLogrados, señalesActivas)` en [`src/services/tinyScreening.ts`](../src/services/tinyScreening.ts):

| Resultado | Condición |
| --- | --- |
| 🔴 Rojo | Al menos **una** señal de alerta, **o** tres o más hitos no logrados |
| 🟡 Amarillo | Uno o dos hitos no logrados, sin señales de alerta |
| 🟢 Verde | Todos los hitos logrados y ninguna señal de alerta |

Una sola señal de alerta basta para el rojo aunque todos los hitos estén logrados: en la libreta las señales de alerta son motivo de consulta por sí mismas.

El semáforo de la barra superior se recalcula en vivo con cada respuesta, así que la familia ve el estado cambiar durante el recorrido.

## 5. NeuroCoins

`calculateCoins(respuestas, completado)` otorga **5 monedas por respuesta** más **25 al terminar** el recorrido.

> Las monedas premian el registro honesto, **no el resultado**. Responder "aún no" da exactamente lo mismo que responder "sí lo hace", y la pantalla de preguntas lo dice explícitamente.

Esta es la diferencia deliberada con una app de aprendizaje: allí se premia acertar. Aquí, premiar las respuestas positivas incentivaría a la familia a ocultar señales, que es justo lo contrario de lo que busca la vigilancia del desarrollo. Hay una prueba que fija esta regla (`otorga lo mismo por cada respuesta, sea cual sea el contenido`).

El saldo se guarda en `sessionStorage` (`neuroalianza.preview.tiny-coins`) junto con el historial de partidas (`neuroalianza.preview.tiny-runs`, últimas 10), siguiendo el patrón de persistencia de vista previa que ya usa `CaseContext`.

## 6. Piezas del módulo

| Archivo | Rol |
| --- | --- |
| `src/data/credDevelopment.ts` | Datos de la libreta CRED (sin lógica) |
| `src/services/tinyScreening.ts` | Funciones puras: mazo, semáforo, monedas |
| `src/context/TinyProgressContext.tsx` | Saldo de NeuroCoins e historial |
| `src/components/tiny/TinyMascot.tsx` | Tiny en SVG y su globo de diálogo |
| `src/components/tiny/TinyCoinsBadge.tsx` | Contador de NeuroCoins |
| `src/components/tiny/tinySound.ts` | Efectos de sonido sintetizados |
| `src/components/tiny/TinyDevelopmentGame.tsx` | Recorrido completo |

`MobileAppLayout` abre el juego desde `onCenterAction` del `BottomNavBar`.

## 7. Decisiones de implementación

- **Sin assets externos.** Tiny es SVG en línea y los sonidos se sintetizan con la Web Audio API. La PWA se usa en postas con conexión intermitente, así que el juego no descarga nada. Si no hay `AudioContext`, el juego funciona igual, en silencio.
- **Tokens, no colores sueltos.** `--tiny-*`, `--semaforo-*` y `--neurocoin*` se declaran en `src/index.css` para modo claro y oscuro, y se registran en `@theme` para existir como utilidades (`bg-semaforo-verde`, `fill-tiny-fur`…). Nada de hexadecimales en las clases.
- **Se reinicia al abrir.** Cada apertura del juego limpia las respuestas: un tamizaje no debe arrastrar el estado del anterior.
- **`prefers-reduced-motion`** desactiva animaciones y sonidos.
