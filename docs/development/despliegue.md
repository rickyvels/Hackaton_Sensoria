# Despliegue de la demostración pública

Guía para publicar Ruta Viva sin instalar nada en tu máquina. Todo se compila en la nube a partir
del repositorio de GitHub.

## Arquitectura del despliegue

Un solo proyecto de Vercel sirve las dos aplicaciones y la API bajo el **mismo dominio**:

```text
https://<proyecto>.vercel.app/            PWA familiar        (apps/family-pwa)
https://<proyecto>.vercel.app/pro/        Plataforma          (apps/platform)
https://<proyecto>.vercel.app/api/v1/…    API FastAPI         (api/, función Python)
```

El mismo origen no es una comodidad estética: elimina de raíz los dos fallos que más veces rompen
una demostración desplegada.

- **No hay CORS que configurar.** No existe el paso circular de desplegar los frontends para
  conocer sus URL y luego volver al backend a autorizarlas.
- **No hay URL de API congelada en el bundle.** Los frontends piden `/api/v1`, una ruta relativa.
  Antes, cambiar `VITE_API_URL` obligaba a recompilar; ahora no hay nada que recompilar.

El enrutamiento vive en [`vercel.json`](../../vercel.json) y el ensamblado de los dos frontends en
[`scripts/build-web.mjs`](../../scripts/build-web.mjs).

### Cómo funciona la orquestación sin un proceso vivo

Vercel ejecuta funciones que se congelan en cuanto responden. La corrida de agentes necesita un
productor de eventos y un consumidor del stream, y el canal pub/sub del MVP vive en memoria. La
solución es que **ambos compartan invocación**:

1. `POST /orchestration/cases/{id}/runs` crea la corrida y la deja en `queued`. No la ejecuta.
2. `GET /orchestration/runs/{id}/events` se suscribe al canal, y solo entonces lanza la ejecución
   dentro de esa misma invocación. Productor y consumidor comparten proceso, así que ningún
   evento se pierde entre instancias.
3. La corrida se detiene sola en la compuerta humana y la función termina.
4. Tras la decisión profesional la corrida vuelve a `queued`, el frontend reabre el stream y la
   siguiente invocación la retoma desde donde quedó.

Fuera de Vercel (local o Render) sigue funcionando el worker de fondo de siempre. La diferencia la
decide `NEUROALIANZA_*`/`VERCEL` en tiempo de ejecución, no dos ramas de código distintas.

**Ollama no se despliega.** En la nube se usa `NEUROALIANZA_AGENT_PROVIDER=deterministic`, que
conserva el mismo contrato y permite recorrer el flujo completo sin modelo ni red externa.

---

## Paso 1 — Crear la base de datos

SQLite escribe en disco y el sistema de archivos de una función es efímero y no se comparte entre
instancias. La demostración necesita Postgres.

1. En Vercel entra a **Storage → Create Database → Neon (Serverless Postgres)**.
2. Elige el plan gratuito y la región más cercana.
3. Conéctala al proyecto cuando Vercel te lo ofrezca.

La integración inyecta sola las variables de conexión (`DATABASE_URL`, `DATABASE_URL_UNPOOLED` y
compañía). No hay que copiarlas a mano: la API las detecta en ese orden y prefiere la conexión
directa, porque en serverless cada invocación abre y cierra la suya.

---

## Paso 2 — Importar el repositorio

1. **Add New → Project** e importa `rickyvels/Hackaton_Sensoria`.
2. Deja el **Root Directory** en la raíz del repositorio. No lo cambies a `apps/…`: el proyecto
   compila las dos aplicaciones a la vez.
3. Vercel leerá `vercel.json`, así que no hace falta tocar Build Command ni Output Directory.

---

## Paso 3 — Variables de entorno

Antes de pulsar Deploy, añade estas tres:

| Key | Value | Por qué |
| --- | --- | --- |
| `NEUROALIANZA_JWT_SECRET` | una cadena aleatoria de 32 caracteres o más | Obligatoria |
| `NEUROALIANZA_ENVIRONMENT` | `demo` | Siembra los datos sintéticos al arrancar |
| `NEUROALIANZA_AGENT_PROVIDER` | `deterministic` | Sin Ollama en la nube |

`NEUROALIANZA_JWT_SECRET` no es opcional y la API se niega a arrancar en Vercel sin ella. El motivo
es concreto: en modo demostración el secreto se generaba al vuelo, y cada arranque en frío firmaría
las sesiones con una clave distinta, cerrando la sesión del usuario en mitad de la demostración.

Para generarla en Windows:

```bash
powershell -Command "[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))"
```

---

## Paso 4 — Verificar

Empieza por la API, que es donde se ven los fallos de configuración:

```text
https://<proyecto>.vercel.app/api/v1/health
```

Debe responder `{"status":"ok"}`. Si devuelve 500, el problema casi siempre es la base de datos o
el secreto; míralo en **Logs → Runtime Logs**, no en los logs de build.

> **Nota sobre `/docs`.** La cabecera `Content-Security-Policy: default-src 'none'` que aplica
> `api/app/main.py` bloquea los scripts de Swagger UI, así que `/docs` cargará en blanco aunque el
> servicio funcione. Es esperado. No lo uses como prueba de que la API arrancó, ni se lo muestres al
> jurado como documentación navegable.

Luego recorre el guion completo:

1. Abre `/` e inicia sesión como familiar con `12345678` / `familia123`.
2. Reporta una dificultad.
3. Abre `/pro/` e inicia sesión como profesional con `87654321` / `profesional123`.
4. Valida la síntesis del aviso.
5. Pulsa **Reproducir caso**. **Esta es la prueba crítica**: si los pasos aparecen
   progresivamente y no todos de golpe al final, el streaming funciona a través de Vercel.
6. Aprueba en la compuerta humana y comprueba que la tarea aparece en la PWA familiar.

---

## Advertencias para la demostración ante el jurado

### El primer acceso es más lento

No hay servicio que duerma, pero una función sin tráfico reciente arranca en frío: la primera
petición paga el arranque del intérprete y la conexión a Postgres. Son segundos, no el minuto de un
contenedor suspendido. Abrir la URL un par de minutos antes de presentar lo deja caliente.

### Los datos persisten entre despliegues

Con Postgres el caso sintético **ya no se reinicia solo**. El sembrado solo actúa sobre una base
vacía, así que si ensayas la demostración varias veces el caso queda con barreras y decisiones ya
registradas.

Para volver a empezar limpio, borra las filas desde la consola de Neon o elimina y recrea la base de
datos. Conviene hacerlo justo antes del pitch, no durante.

### Cuentas de demostración

Las credenciales del paso 4 son sintéticas y ya están en el repositorio público. No corresponden a
ninguna persona real. Si prefieres que no queden visibles durante el pitch, cámbialas en
`api/app/seed.py` antes de desplegar.

### Un solo entrypoint de Python

Vercel construye una función por cada módulo bajo `api/` que exponga una aplicación ASGI llamada
`app`. Por eso la instancia de `api/app/main.py` se llama `api_app` y solo `api/index.py` la
reexporta como `app`. Si al añadir código vuelves a llamarla `app`, aparecerá una segunda función
que publica una copia entera de la API en otra ruta. Compruébalo en **Deployment → Resources**:
debe haber exactamente una función.

---

## Alternativa: la API en Render

[`render.yaml`](../../render.yaml) sigue siendo válido y describe el despliegue de la API como
contenedor persistente, con worker de fondo y SQLite. Es la ruta de respaldo si el modo serverless
diera problemas: en ese caso los frontends necesitarían de nuevo `VITE_API_URL` absoluta y la
autorización de CORS en `NEUROALIANZA_CORS_ORIGINS`.

Para esa ruta se conservan `apps/platform/vercel.json` y `apps/family-pwa/vercel.json`, que
configuran cada aplicación como un proyecto independiente con su propio Root Directory. En el
despliegue de un solo dominio **no se usan**: manda el `vercel.json` de la raíz.

---

## Después de desplegar

Actualiza la tabla de entregables del Anexo 1 con los enlaces definitivos:

| Entregable | Enlace |
| --- | --- |
| Demo o prototipo funcional | URL de la PWA y de la plataforma |
| Repositorio de código | https://github.com/rickyvels/Hackaton_Sensoria |

Las bases exigen que el enlace sea **público y verificable**. Compruébalo en una ventana de
incógnito antes de entregar.
