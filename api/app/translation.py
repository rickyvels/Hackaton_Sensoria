from __future__ import annotations

import asyncio
from hashlib import sha256

import httpx
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from .config import get_settings
from .models import TranslationCache

# NLLB nombra los idiomas con código y sistema de escritura. `quy_Latn` es quechua ayacuchano,
# la variante sureña con más presencia en el corpus del modelo.
NLLB_CODES = {"es": "spa_Latn", "qu": "quy_Latn"}
SUPPORTED_TARGETS = frozenset({"qu"})
MAX_TEXTS_PER_REQUEST = 60
MAX_TEXT_LENGTH = 800


def source_hash(text: str) -> str:
    return sha256(text.encode("utf-8")).hexdigest()


async def _fetch_translations(texts: list[str], target: str) -> dict[str, str]:
    """Ask the model for the texts that were not cached yet.

    Devuelve solo lo que pudo traducir: si el proveedor falla, la frase se queda en español
    en vez de dejar la pantalla vacía. Un error de traducción no debe impedir usar la app.
    """
    settings = get_settings()
    if not settings.huggingface_api_token or not texts:
        return {}

    url = f"https://api-inference.huggingface.co/models/{settings.translation_model}"
    headers = {"Authorization": f"Bearer {settings.huggingface_api_token}"}
    payload = {
        "inputs": texts,
        "parameters": {"src_lang": NLLB_CODES["es"], "tgt_lang": NLLB_CODES[target]},
        # El modelo puede estar dormido; esto evita un 503 inmediato en la primera llamada.
        "options": {"wait_for_model": True},
    }
    try:
        async with httpx.AsyncClient(timeout=settings.translation_timeout_seconds) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            body = response.json()
    except (httpx.HTTPError, ValueError):
        return {}

    if not isinstance(body, list):
        return {}
    translated: dict[str, str] = {}
    for original, item in zip(texts, body, strict=False):
        candidate = item.get("translation_text") if isinstance(item, dict) else None
        if isinstance(candidate, str) and candidate.strip():
            translated[original] = candidate.strip()
    return translated


async def translate_texts(session: AsyncSession, *, texts: list[str], target: str) -> dict[str, str]:
    """Translate a batch, reading from cache first and writing back what the model returns."""
    if target not in SUPPORTED_TARGETS:
        return {}

    unique = []
    seen: set[str] = set()
    for text in texts:
        normalized = text.strip()
        if normalized and len(normalized) <= MAX_TEXT_LENGTH and normalized not in seen:
            seen.add(normalized)
            unique.append(normalized)
    unique = unique[:MAX_TEXTS_PER_REQUEST]
    if not unique:
        return {}

    hashes = {source_hash(text): text for text in unique}
    cached_rows = (
        await session.execute(
            select(TranslationCache).where(
                TranslationCache.target_lang == target,
                TranslationCache.source_hash.in_(list(hashes)),
            )
        )
    ).scalars()
    resolved = {row.source_text: row.translated_text for row in cached_rows}

    pending = [text for text in unique if text not in resolved]
    fresh = await _fetch_translations(pending, target)
    if not fresh:
        return resolved

    settings = get_settings()
    for original, translation in fresh.items():
        session.add(
            TranslationCache(
                source_hash=source_hash(original),
                target_lang=target,
                source_text=original,
                translated_text=translation,
                provider=settings.translation_model,
            )
        )
    try:
        await session.commit()
    except IntegrityError:
        # Otra invocación cacheó la misma frase entre la lectura y la escritura. La traducción
        # sigue siendo válida, así que solo se descarta el duplicado.
        await session.rollback()
    except asyncio.CancelledError:
        await session.rollback()
        raise

    resolved.update(fresh)
    return resolved
