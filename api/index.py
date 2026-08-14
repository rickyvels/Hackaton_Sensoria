"""Entrypoint de la función de Vercel.

Este es el único módulo bajo `api/` que expone la aplicación como `app`, y por eso es la única
función que Vercel construye. El rewrite `/api/(.*)` de `vercel.json` entrega la ruta original
sin modificar, así que la aplicación conserva su prefijo `/api/v1` y no necesita saber que
está detrás de un rewrite.
"""

import sys
from pathlib import Path

# El paquete vive en `api/app`, y `api/` no es un paquete. Añadir este directorio al path
# hace que `app` sea importable sin depender de cuál sea el directorio de trabajo.
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.main import api_app as app  # noqa: E402

__all__ = ["app"]
