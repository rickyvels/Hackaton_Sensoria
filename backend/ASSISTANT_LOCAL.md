# Asistente local con Ollama

El asistente familiar usa los archivos de `knowledge_base/02_RAG_READY`; el corpus no está incluido aún en este repositorio. Configura su ruta absoluta antes de iniciar el backend.

```bash
cd backend
NEURO_KNOWLEDGE_BASE_PATH="/ruta/absoluta/a/knowledge_base" \
NEURO_OLLAMA_URL="http://127.0.0.1:11434" \
NEURO_OLLAMA_MODEL="qwen3:8b" \
uv run uvicorn app.main:app --reload --port 8000
```

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

Abre `http://127.0.0.1:5173`. El proxy de Vite dirige `/api` al backend local de `http://127.0.0.1:8000`.

Si el puerto 8000 ya está ocupado, inicia el backend en otro puerto y configura el proxy al iniciar Vite:

```bash
NEURO_API_URL="http://127.0.0.1:8001" npm run dev
```

La pantalla solicita consentimiento antes de enviar una consulta. Solo se envían la pregunta, la edad en meses y hasta seis intervenciones previas; no se envían nombre, DNI, teléfono ni el perfil clínico completo.

Para producción falta incorporar el corpus al repositorio o a un almacenamiento administrado y vincular el consentimiento a una cuenta autenticada.
