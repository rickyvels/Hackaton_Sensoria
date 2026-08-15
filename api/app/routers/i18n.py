import time

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..schemas import TranslationRequest, TranslationResponse
from ..translation import translate_texts

router = APIRouter(prefix="/i18n", tags=["i18n"])

# El endpoint es público a propósito: la pantalla de acceso necesita traducirse antes de que
# exista una sesión. A cambio lleva un límite por IP, porque detrás hay un modelo que se paga.
MIN_SECONDS_BETWEEN_CALLS = 1.0
LAST_CALL_BY_CLIENT: dict[str, float] = {}


@router.post("/translate", response_model=TranslationResponse)
async def translate(
    payload: TranslationRequest,
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> TranslationResponse:
    client = request.client.host if request.client else "unknown"
    now = time.monotonic()
    if now - LAST_CALL_BY_CLIENT.get(client, 0.0) < MIN_SECONDS_BETWEEN_CALLS:
        # Sin traducción, no un error: el cliente ya tiene el español en pantalla.
        return TranslationResponse(target=payload.target, translations={})
    LAST_CALL_BY_CLIENT[client] = now

    return TranslationResponse(
        target=payload.target,
        translations=await translate_texts(session, texts=payload.texts, target=payload.target),
    )
