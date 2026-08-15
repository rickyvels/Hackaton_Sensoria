"""Family endpoints router."""

from __future__ import annotations

from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse

from app.api.deps import (
    get_assistant_chat_dep,
    get_knowledge_base_dep,
    get_settings_dep,
    get_unit_of_work_dep,
)
from app.api.schemas.family_assistant import (
    FamilyAssistantChatRequest,
    FamilyAssistantChatResponse,
    FamilyAssistantSourceResponse,
)
from app.config import Settings
from app.ports.assistant_chat import AssistantChatClient, AssistantMessage
from app.ports.knowledge_base import KnowledgeBase, KnowledgeBaseDocument
from app.ports.unit_of_work import UnitOfWork
from app.services.family_assistant import (
    AssistantUnavailableError,
    FamilyAssistantInput,
    FamilyAssistantService,
    KnowledgeBaseUnavailableError,
)

family_router = APIRouter(prefix="/api/v1/family", tags=["Familia"])


@family_router.post(
    "/assistant/chat",
    response_model=FamilyAssistantChatResponse,
    summary="Asistente familiar con RAG local y Ollama",
)
async def chat_with_family_assistant(
    payload: FamilyAssistantChatRequest,
    settings: Annotated[Settings, Depends(get_settings_dep)],
    knowledge_base: Annotated[KnowledgeBase, Depends(get_knowledge_base_dep)],
    assistant_chat: Annotated[AssistantChatClient, Depends(get_assistant_chat_dep)],
    unit_of_work: Annotated[UnitOfWork, Depends(get_unit_of_work_dep)],
) -> FamilyAssistantChatResponse:
    """Answers family questions with local retrieval, consent gating, and source traceability."""
    if not payload.consent_granted:
        msg = "Se requiere autorización familiar antes de activar el asistente."
        raise HTTPException(status_code=403, detail=msg)

    service = FamilyAssistantService(
        knowledge_base=knowledge_base,
        assistant_chat=assistant_chat,
        unit_of_work=unit_of_work,
        model_name=settings.OLLAMA_MODEL,
        max_sources=settings.ASSISTANT_MAX_SOURCES,
    )
    try:
        result = await service.answer(
            FamilyAssistantInput(
                question=payload.question,
                child_age_months=payload.child_age_months,
                history=tuple(
                    AssistantMessage(role=turn.role, content=turn.content)
                    for turn in payload.history
                ),
            )
        )
    except KnowledgeBaseUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except AssistantUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return FamilyAssistantChatResponse(
        answer=result.answer,
        disclaimer=result.disclaimer,
        consent_required=False,
        used_model=result.used_model,
        model=result.model,
        sources=[_to_source_response(source) for source in result.sources],
    )


@family_router.get(
    "/assistant/source-file",
    summary="Descarga segura del archivo fuente local usado por el RAG",
)
async def download_family_assistant_source_file(
    path: Annotated[str, Query(min_length=1, max_length=300)],
    settings: Annotated[Settings, Depends(get_settings_dep)],
) -> FileResponse:
    """Returns a local source file from the configured knowledge base."""
    source_path = _resolve_source_file_path(settings, path)
    if not source_path.exists() or not source_path.is_file():
        raise HTTPException(status_code=404, detail="No se encontró el archivo fuente.")
    return FileResponse(source_path, filename=source_path.name)


def _to_source_response(source: KnowledgeBaseDocument) -> FamilyAssistantSourceResponse:
    """Converts a retrieved document into the public API response contract."""
    return FamilyAssistantSourceResponse(
        resource_id=source.resource_id,
        title=source.title,
        institution=source.institution,
        official_url=source.official_url,
        source_quality=source.source_quality,
        categories=list(source.categories),
        resource_types=list(source.resource_types),
        age_min_months=source.age_min_months,
        age_max_months=source.age_max_months,
        excerpt=source.excerpt,
        relative_path=source.relative_path,
        source_file_path=source.source_file_path,
    )


def _resolve_source_file_path(settings: Settings, requested_path: str) -> Path:
    """Resolves only relative files inside the configured knowledge base."""
    relative_path = Path(requested_path)
    if relative_path.is_absolute() or ".." in relative_path.parts:
        raise HTTPException(status_code=400, detail="Ruta de archivo no permitida.")
    if relative_path.parts[:2] != ("00_RAW", "source_files"):
        raise HTTPException(status_code=400, detail="Ruta de archivo no permitida.")

    project_root = Path(__file__).resolve().parents[3]
    knowledge_base_path = Path(settings.KNOWLEDGE_BASE_PATH)
    if not knowledge_base_path.is_absolute():
        knowledge_base_path = project_root / knowledge_base_path

    base_path = knowledge_base_path.resolve()
    source_path = (base_path / relative_path).resolve()
    if not source_path.is_relative_to(base_path):
        raise HTTPException(status_code=400, detail="Ruta de archivo no permitida.")
    return source_path
