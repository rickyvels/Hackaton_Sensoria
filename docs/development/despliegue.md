# Despliegue de la demostración pública

Guía para publicar Ruta Viva sin instalar nada en tu máquina. Todo se compila en la nube a partir
del repositorio de GitHub.

## Arquitectura del despliegue

```text
Vercel  →  apps/platform      (plataforma profesional, estático)
Vercel  →  apps/family-pwa    (PWA familiar, estático)
Render  →  api                (FastAPI, contenedor persistente)
```

### Por qué la API no va en Vercel

Vercel ejecuta funciones serverless: el proceso se congela en cuanto responde. La API de Ruta Viva
necesita un proceso vivo entre peticiones porque:

- El worker de orquestación es una tarea de fondo con `asyncio.Queue` (`api/app/orchestration/manager.py`).
- El canal de eventos es un pub/sub **en memoria** que conecta ese worker con el endpoint SSE. En
  serverless, el evento se emitiría en una instancia y se escucharía en otra.
- El stream de la corrida usa `StreamingResponse` con `text/event-stream`, que exige conexión
  persistente.
- SQLite escribe en disco.

Llevar la API a Vercel obligaría a rehacer la orquestación como stateless, sustituir SSE por sondeo
y migrar a Postgres. Eso rompería la corrida observable con compuerta humana, que es el núcleo de la
demostración.

**Ollama no se despliega.** En la nube se usa `NEUROALIANZA_AGENT_PROVIDER=deterministic`, que
conserva el mismo contrato y permite recorrer el flujo completo sin modelo ni red externa.

---

## Paso 1 — Publicar la API en Render

1. Entra a [render.com](https://render.com) y crea una cuenta con GitHub.
2. **New → Blueprint**.
3. Selecciona el repositorio `neuroalianza-ruta-viva-mvp`. Render detectará `render.yaml`.
4. Confirma la creación del servicio `ruta-viva-api`.
5. En la pantalla de variables, deja `NEUROALIANZA_CORS_ORIGINS` **vacía por ahora**: aún no existen
   las URL de Vercel. Volveremos en el paso 3.
6. Espera a que el despliegue termine y **copia la URL** del servicio. Tendrá esta forma:

   ```text
   https://ruta-viva-api.onrender.com
   ```

Para comprobar que arrancó, abre `https://ruta-viva-api.onrender.com/api/v1/health`. Debe responder
con un JSON de estado. Ese es también el endpoint que Render usa como health check.

> **Nota sobre `/docs`.** La cabecera `Content-Security-Policy: default-src 'none'` que aplica
> `api/app/main.py` bloquea los scripts de Swagger UI, así que `/docs` cargará en blanco aunque el
> servicio funcione. Es esperado. No lo uses como prueba de que la API arrancó, ni se lo muestres al
> jurado como documentación navegable.

---

## Paso 2 — Publicar los dos frontends en Vercel

Son **dos proyectos separados** creados desde el mismo repositorio. La única diferencia es el
directorio raíz.

1. Entra a [vercel.com](https://vercel.com) y crea una cuenta con GitHub.
2. **Add New → Project** e importa `neuroalianza-ruta-viva-mvp`.
3. Configura el **primer** proyecto:

   | Campo | Valor |
   | --- | --- |
   | Project Name | `ruta-viva-plataforma` |
   | Root Directory | `apps/platform` |
   | Framework Preset | Vite *(se detecta solo)* |

4. Antes de pulsar Deploy, añade la variable de entorno:

   | Key | Value |
   | --- | --- |
   | `VITE_API_URL` | `https://ruta-viva-api.onrender.com/api/v1` |

   ⚠️ **El sufijo `/api/v1` es obligatorio.** Sin él ninguna petición encontrará su ruta.

5. Deploy. Copia la URL resultante, por ejemplo `https://ruta-viva-plataforma.vercel.app`.
6. Repite todo el paso 2 para el segundo proyecto, cambiando únicamente:

   | Campo | Valor |
   | --- | --- |
   | Project Name | `ruta-viva-familia` |
   | Root Directory | `apps/family-pwa` |

   La variable `VITE_API_URL` es **la misma** en ambos proyectos.

---

## Paso 3 — Autorizar el CORS en Render

Ahora que existen las URL de Vercel, la API tiene que aceptarlas.

1. Vuelve al servicio en Render → **Environment**.
2. Edita `NEUROALIANZA_CORS_ORIGINS` con las dos URL separadas por coma **y sin espacios**:

   ```text
   https://ruta-viva-plataforma.vercel.app,https://ruta-viva-familia.vercel.app
   ```

3. Guarda. Render reinicia el servicio automáticamente.

Sin este paso el navegador bloqueará todas las peticiones y las aplicaciones se verán cargadas pero
sin datos.

---

## Paso 4 — Verificar

Recorre el guion de demostración completo:

1. Abre la PWA familiar e inicia sesión con `12345678` / `familia123`.
2. Reporta una dificultad.
3. Abre la plataforma profesional e inicia sesión con `87654321` / `profesional123`.
4. Valida la síntesis del aviso.
5. Pulsa **Reproducir caso** y confirma que los eventos aparecen en vivo. **Esta es la prueba
   crítica**: si los pasos se muestran progresivamente, el SSE funciona a través de Render.
6. Aprueba en la compuerta humana y comprueba que la tarea aparece en la PWA familiar.

---

## Advertencias para la demostración ante el jurado

### El plan gratuito de Render duerme el servicio

Tras 15 minutos sin tráfico, el servicio se suspende y el siguiente arranque tarda cerca de un
minuto. Delante de un jurado eso parece una aplicación rota.

Opciones, de menor a mayor costo:

- **Abrir la URL de la API entre 2 y 3 minutos antes** de presentar. Es lo mínimo imprescindible.
- Configurar un ping externo cada 10 minutos con un servicio de monitoreo gratuito.
- Pasar al plan de pago de Render (~7 USD/mes), que no duerme.

### Las variables de Vite se congelan al compilar

`VITE_API_URL` se incrusta en el bundle **durante el build**, no se lee en tiempo de ejecución. Si
cambias esa variable en Vercel, **debes volver a desplegar** el proyecto; reiniciar no basta.

### La base de datos se reinicia

El disco del plan gratuito es efímero: cada reinicio borra `neuroalianza.db`. Como
`NEUROALIANZA_ENVIRONMENT=demo` vuelve a sembrar los datos sintéticos al arrancar, la demostración
se restablece sola. Para esta entrega es una ventaja, no un defecto: el caso siempre parte limpio.

Ten en cuenta que las sesiones abiertas se invalidan tras un reinicio y habrá que iniciar sesión de
nuevo.

### Cuentas de demostración

Las credenciales del paso 4 son sintéticas y ya están en el repositorio público. No corresponden a
ninguna persona real. Si prefieres que no queden visibles durante el pitch, cámbialas en
`api/app/seed.py` antes de desplegar.

---

## Después de desplegar

Actualiza la tabla de entregables del Anexo 1 con los enlaces definitivos:

| Entregable | Enlace |
| --- | --- |
| Demo o prototipo funcional | URL de la PWA y de la plataforma |
| Repositorio de código | https://github.com/miguel-isidro05/neuroalianza-ruta-viva-mvp |

Las bases exigen que el enlace sea **público y verificable**. Compruébalo en una ventana de
incógnito antes de entregar.
