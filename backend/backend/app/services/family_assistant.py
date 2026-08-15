"""Family-facing assistant orchestration with local retrieval and Ollama."""

from __future__ import annotations

import asyncio
import re
from dataclasses import dataclass, field

from app.ports.assistant_chat import AssistantChatClient, AssistantMessage
from app.ports.knowledge_base import KnowledgeBase, KnowledgeBaseDocument
from app.ports.unit_of_work import UnitOfWork

_DISCLAIMER = (
    "Esta orientación no reemplaza una evaluación profesional. "
    "Si notas pérdida de habilidades, ausencia de respuesta al nombre, crisis o cualquier alarma, "
    "acude a un profesional de salud."
)


class KnowledgeBaseUnavailableError(RuntimeError):
    """Raised when the local RAG corpus cannot be accessed."""


class AssistantUnavailableError(RuntimeError):
    """Raised when the assistant model cannot respond."""


@dataclass(frozen=True)
class FamilyAssistantInput:
    """Normalized request sent from the API layer to the assistant service."""

    question: str
    child_age_months: int | None = None
    preferred_categories: tuple[str, ...] = ()
    history: tuple[AssistantMessage, ...] = ()


@dataclass(frozen=True)
class FamilyAssistantResult:
    """Assistant answer plus the retrieved sources that support it."""

    answer: str
    model: str
    used_model: bool
    disclaimer: str = _DISCLAIMER
    sources: tuple[KnowledgeBaseDocument, ...] = field(default_factory=tuple)


class FamilyAssistantService:
    """Coordinates retrieval, guardrails, model prompting, and transaction handling."""

    def __init__(
        self,
        *,
        knowledge_base: KnowledgeBase,
        assistant_chat: AssistantChatClient,
        unit_of_work: UnitOfWork,
        model_name: str,
        max_sources: int,
    ) -> None:
        """Wires ports required by the family assistant use case."""
        self._knowledge_base = knowledge_base
        self._assistant_chat = assistant_chat
        self._unit_of_work = unit_of_work
        self._model_name = model_name
        self._max_sources = max_sources

    async def answer(self, request: FamilyAssistantInput) -> FamilyAssistantResult:
        """Returns a traceable family-safe answer for the current question."""
        try:
            with self._unit_of_work as transaction:
                documents = await asyncio.to_thread(
                    self._knowledge_base.search,
                    query=request.question,
                    child_age_months=request.child_age_months,
                    preferred_categories=request.preferred_categories,
                    limit=self._max_sources,
                )
                sources = tuple(documents)
                if not sources:
                    transaction.commit()
                    return FamilyAssistantResult(
                        answer=(
                            "No encontré un recurso trazable para esa consulta en la base actual. "
                            "Prueba con una señal concreta, la edad de tu hijo "
                            "o una actividad que quieras hacer en casa."
                        ),
                        model=self._model_name,
                        used_model=False,
                        sources=sources,
                    )

                if _requires_guardrail_response(request.question):
                    transaction.commit()
                    return FamilyAssistantResult(
                        answer=_build_guardrail_answer(sources),
                        model=self._model_name,
                        used_model=False,
                        sources=sources,
                    )

                response = await self._assistant_chat.complete(
                    model=self._model_name,
                    messages=_build_messages(request, sources),
                )
                transaction.commit()
                return FamilyAssistantResult(
                    answer=_sanitize_answer(response),
                    model=self._model_name,
                    used_model=True,
                    sources=sources,
                )
        except FileNotFoundError as exc:
            raise KnowledgeBaseUnavailableError(str(exc)) from exc
        except AssistantUnavailableError:
            raise
        except Exception as exc:
            if exc.__class__.__name__ == "OllamaClientError":
                msg = "El asistente local no está disponible temporalmente."
                raise AssistantUnavailableError(msg) from exc
            raise


def _build_messages(
    request: FamilyAssistantInput,
    sources: tuple[KnowledgeBaseDocument, ...],
) -> list[AssistantMessage]:
    """Builds the chat prompt with explicit non-diagnostic guardrails."""
    child_profile = [
        (
            f"Edad en meses: {request.child_age_months}"
            if request.child_age_months is not None
            else None
        ),
        (
            "Categorías priorizadas: " + ", ".join(request.preferred_categories)
            if request.preferred_categories
            else None
        ),
    ]
    formatted_sources = "\n\n".join(
        [
            (
                f"[{source.resource_id}] {source.title}\n"
                f"Institución: {source.institution}\n"
                f"URL oficial: {source.official_url or 'No disponible; usar trazabilidad local'}\n"
                f"Categorías: {', '.join(source.categories)}\n"
                f"Extracto: {source.excerpt}"
            )
            for source in sources
        ]
    )
    system_prompt = (
        "Eres el asistente familiar de Neuroalianza. "
        "Responde solo con orientación educativa y no diagnóstica. "
        "Nunca diagnostiques, no sugieras medicación "
        "y no afirmes que un niño 'tiene' un trastorno. "
        "Usa únicamente la información de las fuentes entregadas. "
        "Si la evidencia no alcanza, dilo con claridad. "
        "Cierra con una recomendación breve sobre cuándo consultar a un profesional."
    )
    user_prompt = "\n".join(
        [
            "Perfil del niño y familia:",
            *[item for item in child_profile if item],
            "",
            f"Consulta: {request.question}",
            "",
            "Fuentes disponibles:",
            formatted_sources,
            "",
            (
                "Responde en español claro para familias. Máximo 3 párrafos cortos. "
                "Puedes usar viñetas y **negrita** solo para nombrar recursos de las fuentes."
            ),
        ]
    )
    messages = [AssistantMessage(role="system", content=system_prompt), *request.history]
    messages.append(AssistantMessage(role="user", content=user_prompt))
    return messages


def _requires_guardrail_response(question: str) -> bool:
    """Detects questions that should bypass the model for safety."""
    patterns = (
        r"\bdiagn[oó]stic",
        (
            r"\b(?:medic|recet|f[aá]rmaco|dosis|dosific|miligr|melatonina|"
            r"clonazepam|jarabe|gotas?|pastilla|puede\s+tomar)\b"
        ),
        r"\bcura\b",
        r"\b(?:trastorno|autismo|asperger|tdah|tea)\b",
        r"\bconfirm",
    )
    normalized = question.lower()
    return any(re.search(pattern, normalized) for pattern in patterns)


def _build_guardrail_answer(sources: tuple[KnowledgeBaseDocument, ...]) -> str:
    """Builds a deterministic safety response for diagnostic requests."""
    resource_names = ", ".join(source.title for source in sources[:2])
    return (
        "No puedo confirmar diagnósticos ni indicar medicación. "
        "Sí puedo orientarte sobre señales, hitos y cómo prepararte para una consulta profesional. "
        f"Como punto de partida revisa: {resource_names}. "
        "Si hay pérdida de habilidades, ausencia de respuesta al nombre "
        "o preocupación persistente, busca evaluación profesional."
    )


def _sanitize_answer(answer: str) -> str:
    """Removes unsupported diagnostic phrasing from model output."""
    cleaned = re.sub(r"[ \t]+", " ", answer)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned).strip()
    plain_text = re.sub(r"[*_`]+", "", cleaned)
    if re.search(
        r"\b(?:\d+\s*(?:mg|ml)|dosis|dosific|recet|medicaci[oó]n|"
        r"tiene\s+(?:autismo|tdah|asperger)|es\s+autista)\b",
        plain_text,
        flags=re.IGNORECASE,
    ):
        return (
            "No puedo indicar medicación ni confirmar diagnósticos. "
            "Puedo ayudarte a revisar señales, hitos y recursos "
            "para preparar una consulta profesional."
        )
    replacements = {
        "diagnóstico": "evaluación profesional",
        "diagnosticar": "evaluar",
        "tiene autismo": "puede necesitar evaluación especializada",
        "tiene tdah": "merece una evaluación clínica",
    }
    for old, new in replacements.items():
        cleaned = re.sub(old, new, cleaned, flags=re.IGNORECASE)
    return cleaned
