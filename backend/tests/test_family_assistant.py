from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.adapters.local_knowledge_base import FileSystemKnowledgeBase
from app.adapters.memory.unit_of_work import InMemoryUnitOfWork
from app.adapters.ollama_client import OllamaClientError
from app.config import Settings
from app.container import get_container, reset_container
from app.main import create_app
from app.ports.assistant_chat import AssistantMessage
from app.ports.knowledge_base import KnowledgeBaseDocument
from app.services.family_assistant import (
    AssistantUnavailableError,
    FamilyAssistantInput,
    FamilyAssistantService,
    _sanitize_answer,
)


class FakeAssistantChatClient:
    """Test double that records the final prompt and returns a fixed answer."""

    def __init__(self, response: str) -> None:
        """Stores the canned model answer used by the test."""
        self.response = response
        self.messages: list[AssistantMessage] = []

    async def complete(self, *, model: str, messages: list[AssistantMessage]) -> str:
        assert model == "qwen3:8b"
        self.messages = messages
        return self.response


class ExplodingAssistantChatClient:
    """Test double that simulates an unavailable Ollama server."""

    async def complete(self, *, model: str, messages: list[AssistantMessage]) -> str:
        del model, messages
        raise OllamaClientError("fallo de ollama")


class StaticKnowledgeBase:
    """Simple in-memory corpus used by service-level tests."""

    def __init__(self, documents: list[KnowledgeBaseDocument]) -> None:
        """Loads the static list of documents returned by search."""
        self.documents = documents

    def search(
        self,
        *,
        query: str,
        child_age_months: int | None = None,
        preferred_categories: tuple[str, ...] = (),
        limit: int = 4,
    ) -> list[KnowledgeBaseDocument]:
        del query, child_age_months, preferred_categories
        return self.documents[:limit]


def test_family_assistant_chat_returns_traceable_sources(tmp_path: Path) -> None:
    knowledge_base_path = _create_sample_knowledge_base(tmp_path)
    settings = Settings(
        MODE="demo",
        REPOSITORY="memory",
        NOTIFIER="recording",
        EVENT_BUS="inprocess",
        CLOCK="simulated",
        FILE_STORAGE="memory",
        KNOWLEDGE_BASE_PATH=str(knowledge_base_path),
    )
    reset_container(settings=settings)
    container = get_container()
    container.assistant_chat = FakeAssistantChatClient(
        "Puedes trabajar en contacto visual y juego compartido en casa. "
        "Si la preocupación continúa, consulta con su centro de salud."
    )
    app = create_app(settings=settings)

    with TestClient(app) as client:
        response = client.post(
            "/api/v1/family/assistant/chat",
            json={
                "consent_granted": True,
                "question": (
                    "Mi hijo de 18 meses no responde siempre a su nombre, ¿qué puedo revisar?"
                ),
                "child_age_months": 18,
            },
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["used_model"] is True
    assert payload["model"] == "qwen3:8b"
    assert len(payload["sources"]) == 1
    assert payload["sources"][0]["title"] == "Señales de alerta del desarrollo"
    assert payload["sources"][0]["official_url"] == "https://www.gob.pe/recurso-oficial"
    assert payload["sources"][0]["resource_types"] == ["lectura"]
    assert payload["sources"][0]["source_file_path"] == "00_RAW/source_files/MINSA_ALERTA_001.pdf"


def test_sanitize_answer_preserves_safe_markdown_and_blocks_diagnostic_markdown() -> None:
    safe_answer = "- Revisa **la cartilla oficial**.\n\nLuego anota lo que observas."

    assert _sanitize_answer(safe_answer) == safe_answer
    assert _sanitize_answer("El niño tiene **autismo**.").startswith(
        "No puedo indicar medicación ni confirmar diagnósticos."
    )
    assert _sanitize_answer("El niño es **autista**.").startswith(
        "No puedo indicar medicación ni confirmar diagnósticos."
    )


def test_family_assistant_chat_requires_consent(client: TestClient) -> None:
    response = client.post(
        "/api/v1/family/assistant/chat",
        json={
            "consent_granted": False,
            "question": "Quiero hablar con el asistente",
        },
    )

    assert response.status_code == 403
    assert response.headers["content-type"] == "application/problem+json"
    assert (
        response.json()["detail"]
        == "Se requiere autorización familiar antes de activar el asistente."
    )


def test_family_assistant_rejects_possible_identifiers(client: TestClient) -> None:
    response = client.post(
        "/api/v1/family/assistant/chat",
        json={
            "consent_granted": True,
            "question": "El DNI de mi hijo es 78349201",
        },
    )

    assert response.status_code == 422
    assert "DNI o teléfonos" in response.json()["errors"][0]["msg"]


def test_family_assistant_downloads_real_source_file(tmp_path: Path) -> None:
    knowledge_base_path = _create_sample_knowledge_base(tmp_path)
    settings = Settings(KNOWLEDGE_BASE_PATH=str(knowledge_base_path))
    reset_container(settings=settings)
    app = create_app(settings=settings)

    with TestClient(app) as client:
        response = client.get(
            "/api/v1/family/assistant/source-file",
            params={"path": "00_RAW/source_files/MINSA_ALERTA_001.pdf"},
        )

    assert response.status_code == 200
    assert response.content == b"%PDF-1.4\nrecurso real\n"
    assert "MINSA_ALERTA_001.pdf" in response.headers["content-disposition"]


def test_family_assistant_download_rejects_path_traversal(tmp_path: Path) -> None:
    knowledge_base_path = _create_sample_knowledge_base(tmp_path)
    settings = Settings(KNOWLEDGE_BASE_PATH=str(knowledge_base_path))
    reset_container(settings=settings)
    app = create_app(settings=settings)

    with TestClient(app) as client:
        response = client.get(
            "/api/v1/family/assistant/source-file",
            params={"path": "../secret.pdf"},
        )

    assert response.status_code == 400


def test_knowledge_base_maps_family_intent_to_rag_category(tmp_path: Path) -> None:
    knowledge_base_path = tmp_path / "knowledge_base"
    _write_rag_resource(
        knowledge_base_path,
        {
            "folder": "03_casa",
            "resource_id": "CASA_001",
            "title": "Actividades para realizar en el hogar",
            "category": "casa",
            "content": "Juegos simples y rutinas para acompañar el desarrollo en casa.",
        },
    )
    _write_rag_resource(
        knowledge_base_path,
        {
            "folder": "02_senales",
            "resource_id": "SENAL_GENERAL_001",
            "title": "Señales generales",
            "category": "senal",
            "content": "Observa cambios importantes en el desarrollo.",
        },
    )
    _write_rag_resource(
        knowledge_base_path,
        {
            "folder": "02_senales",
            "resource_id": "SENAL_LENGUAJE_001",
            "title": "Señales de lenguaje",
            "category": "senal",
            "content": "Observa la comunicación y las palabras que usa el niño.",
            "area": "lenguaje_comunicacion",
        },
    )
    _write_rag_resource(
        knowledge_base_path,
        {
            "folder": "06_hitos",
            "resource_id": "HITO_0_A_6_MESES",
            "title": "Hitos de 0 a 6 meses",
            "category": "hitos",
            "content": "Hitos para los primeros seis meses.",
        },
    )
    _write_rag_resource(
        knowledge_base_path,
        {
            "folder": "06_hitos",
            "resource_id": "HITO_3_MESES",
            "title": "Hitos de desarrollo: 3 meses",
            "category": "hitos",
            "content": "Hitos para los tres meses.",
        },
    )
    _write_rag_resource(
        knowledge_base_path,
        {
            "folder": "06_hitos",
            "resource_id": "HITO_GENERAL",
            "title": "Hitos del desarrollo infantil",
            "category": "hitos",
            "content": "Registra los logros del desarrollo según la etapa.",
        },
    )
    _write_rag_resource(
        knowledge_base_path,
        {
            "folder": "04_consulta",
            "resource_id": "CONSULTA_001",
            "title": "Preparación para la consulta",
            "category": "consulta",
            "content": "Registra qué observas y prepara preguntas para el profesional.",
        },
    )
    knowledge_base = FileSystemKnowledgeBase(knowledge_base_path)

    home_results = knowledge_base.search(query="¿Qué actividad puedo hacer en casa?")
    consultation_results = knowledge_base.search(
        query="¿Qué debo observar y llevar antes de la consulta?"
    )
    mixed_results = knowledge_base.search(
        query="Me preocupa que no habla, ¿qué juego puedo hacer en casa?"
    )
    milestone_results = knowledge_base.search(
        query="¿Qué hito debería lograr a los 18 meses?", child_age_months=18
    )
    language_results = knowledge_base.search(query="¿Qué señal observo si no habla?")
    early_milestone_results = knowledge_base.search(
        query="¿Qué hito debería lograr a los 3 meses?", child_age_months=3
    )

    assert home_results[0].resource_id == "CASA_001"
    assert consultation_results[0].resource_id == "CONSULTA_001"
    assert mixed_results[0].resource_id == "CASA_001"
    assert milestone_results[0].resource_id == "HITO_GENERAL"
    assert "HITO_3_MESES" not in {result.resource_id for result in milestone_results}
    assert language_results[0].resource_id == "SENAL_LENGUAJE_001"
    assert "HITO_0_A_6_MESES" in {result.resource_id for result in early_milestone_results}
    assert knowledge_base.search(query="actividad en casa", limit=0) == []


@pytest.mark.asyncio
async def test_family_assistant_rolls_back_when_model_fails() -> None:
    document = KnowledgeBaseDocument(
        resource_id="MINSA_ALERTA_001",
        title="Señales de alerta del desarrollo",
        institution="MINSA",
        official_url="https://www.gob.pe/recurso-oficial",
        source_quality="official_link",
        categories=("senal", "casa"),
        resource_types=("lectura",),
        age_min_months=12,
        age_max_months=24,
        excerpt="Si notas una señal de alarma, consulta al establecimiento de salud.",
        content="Contenido",
        audience="familias_y_profesionales",
        usage_policy="orientacion_no_diagnostica_con_fuente",
        relative_path="02_RAG_READY/02_senales/MINSA_ALERTA_001.md",
    )
    unit_of_work = InMemoryUnitOfWork()
    service = FamilyAssistantService(
        knowledge_base=StaticKnowledgeBase([document]),
        assistant_chat=ExplodingAssistantChatClient(),
        unit_of_work=unit_of_work,
        model_name="qwen3:8b",
        max_sources=4,
    )

    with pytest.raises(AssistantUnavailableError):
        await service.answer(
            FamilyAssistantInput(
                question="¿Qué puedo hacer en casa para ayudar con el lenguaje?",
                child_age_months=18,
            )
        )

    assert unit_of_work.committed is False
    assert unit_of_work.rolled_back is True


@pytest.mark.asyncio
async def test_family_assistant_bypasses_model_for_medication_request() -> None:
    document = KnowledgeBaseDocument(
        resource_id="MINSA_ALERTA_001",
        title="Señales de alerta del desarrollo",
        institution="MINSA",
        official_url="https://www.gob.pe/recurso-oficial",
        source_quality="official_link",
        categories=("senal",),
        resource_types=("lectura",),
        age_min_months=12,
        age_max_months=24,
        excerpt="Consulta al establecimiento de salud si existe una señal de alarma.",
        content="Contenido",
        audience="familias_y_profesionales",
        usage_policy="orientacion_no_diagnostica_con_fuente",
        relative_path="02_RAG_READY/02_senales/MINSA_ALERTA_001.md",
    )
    model = FakeAssistantChatClient("Esta respuesta no debe usarse.")
    service = FamilyAssistantService(
        knowledge_base=StaticKnowledgeBase([document]),
        assistant_chat=model,
        unit_of_work=InMemoryUnitOfWork(),
        model_name="qwen3:8b",
        max_sources=4,
    )

    result = await service.answer(
        FamilyAssistantInput(question="¿Qué dosis de melatonina le doy a mi hijo?")
    )

    assert result.used_model is False
    assert model.messages == []
    assert "No puedo confirmar diagnósticos ni indicar medicación" in result.answer


def _create_sample_knowledge_base(tmp_path: Path) -> Path:
    knowledge_base_path = tmp_path / "knowledge_base" / "02_RAG_READY" / "02_senales"
    knowledge_base_path.mkdir(parents=True)
    source_files_path = tmp_path / "knowledge_base" / "00_RAW" / "source_files"
    source_files_path.mkdir(parents=True)
    (source_files_path / "MINSA_ALERTA_001.pdf").write_bytes(b"%PDF-1.4\nrecurso real\n")
    sample_file = knowledge_base_path / "MINSA_ALERTA_001.md"
    sample_file.write_text(
        """---
id: "MINSA_ALERTA_001"
titulo: "Señales de alerta del desarrollo"
tipo_recurso:
  - "lectura"
categorias:
  - "senal"
  - "casa"
edad_min_meses: 12
edad_max_meses: 24
fuente:
  institucion: "MINSA"
url_original: "https://www.gob.pe/recurso-oficial"
archivo_origen_local: "00_RAW/source_files/MINSA_ALERTA_001.pdf"
audiencia_rag: "familias_y_profesionales"
uso_permitido_rag: "orientacion_no_diagnostica_con_fuente"
---

# Contenido crudo

Si notas que no responde al nombre o perdió habilidades, consulta con un profesional.
En casa puedes observar juegos compartidos, lenguaje y contacto visual.
""",
        encoding="utf-8",
    )
    return tmp_path / "knowledge_base"


def _write_rag_resource(knowledge_base_path: Path, resource: dict[str, str]) -> None:
    resource_directory = knowledge_base_path / "02_RAG_READY" / resource["folder"]
    resource_directory.mkdir(parents=True, exist_ok=True)
    resource_path = resource_directory / f"{resource['resource_id']}.md"
    metadata_lines = [
        "---",
        f'id: "{resource["resource_id"]}"',
        f'titulo: "{resource["title"]}"',
        "tipo_recurso:",
        '  - "lectura"',
        "categorias:",
        f'  - "{resource["category"]}"',
    ]
    if "area" in resource:
        metadata_lines.extend(["areas:", f'  - "{resource["area"]}"'])
    metadata_lines.extend(
        [
            "fuente:",
            '  institucion: "MINSA"',
            'url_original: "https://www.gob.pe/recurso-oficial"',
            'audiencia_rag: "familias_y_profesionales"',
            'uso_permitido_rag: "orientacion_no_diagnostica_con_fuente"',
            "---",
            "",
            "# Contenido crudo",
            "",
            resource["content"],
            "",
        ]
    )
    resource_path.write_text(
        "\n".join(metadata_lines),
        encoding="utf-8",
    )
