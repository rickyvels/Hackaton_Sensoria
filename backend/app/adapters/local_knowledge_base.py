"""Filesystem-backed retrieval over the RAG-ready markdown corpus."""

from __future__ import annotations

import re
import unicodedata
from pathlib import Path
from typing import override

from app.ports.knowledge_base import KnowledgeBase, KnowledgeBaseDocument

_NO_AVAILABLE_VALUE = "NO DISPONIBLE EN LA FUENTE"
_TITLE_AGE_PATTERN = re.compile(r"\b(\d{1,2})\s*mes(?:es)?\b", flags=re.IGNORECASE)
_TITLE_AGE_RANGE_PATTERN = re.compile(
    r"\b(\d{1,2})\s*(?:a|\u2013|-)\s*(\d{1,2})\s*mes(?:es)?\b", flags=re.IGNORECASE
)

_INTENT_CATEGORY_TRIGGERS: dict[str, tuple[str, ...]] = {
    "edad": ("edad", "meses", "etapa", "desarrollo"),
    "senal": ("senal", "alarma", "preocupa", "no responde", "no habla", "perdio"),
    "casa": ("casa", "actividad", "juego", "jugar", "rutina", "estimular"),
    "consulta": ("consulta", "cita", "profesional", "observar", "registrar", "llevar"),
    "informacion_oficial": ("oficial", "minsa", "guia", "cartilla"),
    "hitos": ("hito", "deberia", "lograr", "alcanza", "gatea", "camina"),
}

_INTENT_CATEGORY_PRIORITY = (
    "casa",
    "consulta",
    "senal",
    "hitos",
    "informacion_oficial",
    "edad",
)

_AREA_TRIGGERS: dict[str, tuple[str, ...]] = {
    "lenguaje_comunicacion": ("habla", "palabra", "lenguaje", "comunica", "nombre"),
    "motor_grueso": ("camina", "gatea", "mueve", "motor"),
    "motor_fino": ("mano", "agarra", "pinza", "dibuja"),
    "social_interaccion": ("mirada", "contacto visual", "interactua", "juega con"),
    "audicion": ("escucha", "sonido", "oye"),
    "alimentacion": ("come", "comida", "alimentacion"),
}


class FileSystemKnowledgeBase(KnowledgeBase):
    """Indexes family-safe markdown resources from the local knowledge base."""

    def __init__(self, base_path: str | Path) -> None:
        """Initializes the adapter with the repository knowledge-base path."""
        self._base_path = Path(base_path)
        self._documents: list[KnowledgeBaseDocument] | None = None

    @override
    def search(
        self,
        *,
        query: str,
        child_age_months: int | None = None,
        preferred_categories: tuple[str, ...] = (),
        limit: int = 4,
    ) -> list[KnowledgeBaseDocument]:
        """Returns sources ranked by family intent, age, area, and lexical relevance."""
        if limit <= 0:
            return []
        documents = self._load_documents()
        intent_categories = _unique_values(
            (*preferred_categories, *_infer_intent_categories(query))
        )
        requested_areas = _infer_values(query, _AREA_TRIGGERS)
        age_eligible_documents = _filter_by_age(documents, child_age_months)
        candidates = _filter_by_categories(age_eligible_documents, intent_categories)
        candidates = candidates or age_eligible_documents
        query_tokens = _tokenize(query)
        ranked = sorted(
            (
                (
                    _score_document(
                        doc,
                        query_tokens,
                        child_age_months,
                        intent_categories,
                        requested_areas,
                    ),
                    doc,
                )
                for doc in candidates
            ),
            key=lambda item: item[0],
            reverse=True,
        )
        selected: list[KnowledgeBaseDocument] = []
        seen_resource_ids: set[str] = set()
        for score, document in ranked:
            if score <= 0 or document.resource_id in seen_resource_ids:
                continue
            selected.append(document)
            seen_resource_ids.add(document.resource_id)
            if len(selected) == limit:
                break
        return selected

    def _load_documents(self) -> list[KnowledgeBaseDocument]:
        """Loads and caches the markdown corpus."""
        if self._documents is not None:
            return self._documents

        corpus_root = self._base_path / "02_RAG_READY"
        if not corpus_root.exists():
            msg = f"No se encontró la base de conocimiento en '{corpus_root}'."
            raise FileNotFoundError(msg)

        documents = [
            _parse_markdown_document(file_path, self._base_path)
            for file_path in sorted(corpus_root.rglob("*.md"))
        ]
        self._documents = [doc for doc in documents if _is_family_safe(doc)]
        return self._documents


def _parse_markdown_document(file_path: Path, base_path: Path) -> KnowledgeBaseDocument:
    """Parses front matter and body sections from a RAG-ready markdown file."""
    raw_text = file_path.read_text(encoding="utf-8")
    front_matter, body = _split_front_matter(raw_text)
    title = _extract_scalar(front_matter, "titulo") or file_path.stem
    institution = (
        _extract_nested_scalar(front_matter, "fuente", "institucion") or "Fuente no indicada"
    )
    official_url = _normalize_url(
        _extract_scalar(front_matter, "url_original")
        or _extract_nested_scalar(front_matter, "fuente", "url_original")
    )
    categories = tuple(_extract_list(front_matter, "categorias"))
    resource_types = tuple(_extract_list(front_matter, "tipo_recurso"))
    areas = tuple(_extract_list(front_matter, "areas"))
    keywords = tuple(_extract_list(front_matter, "palabras_clave"))
    age_min_months = _extract_int(front_matter, "edad_min_meses")
    age_max_months = _extract_int(front_matter, "edad_max_meses")
    audience = _extract_scalar(front_matter, "audiencia_rag") or ""
    usage_policy = _extract_scalar(front_matter, "uso_permitido_rag") or ""
    excerpt = _extract_excerpt(body)
    return KnowledgeBaseDocument(
        resource_id=_extract_scalar(front_matter, "id") or file_path.stem,
        title=title,
        institution=institution,
        official_url=official_url,
        source_quality="official_link" if official_url else "local_traceability",
        categories=categories,
        resource_types=resource_types,
        age_min_months=age_min_months,
        age_max_months=age_max_months,
        excerpt=excerpt,
        content=body,
        audience=audience,
        usage_policy=usage_policy,
        relative_path=str(file_path.relative_to(base_path)),
        source_file_path=_extract_scalar(front_matter, "archivo_origen_local"),
        areas=areas,
        keywords=keywords,
    )


def _split_front_matter(raw_text: str) -> tuple[str, str]:
    """Splits markdown into YAML-like front matter and body."""
    if not raw_text.startswith("---\n"):
        return "", raw_text
    try:
        _, front_matter, body = raw_text.split("---\n", 2)
    except ValueError:
        return "", raw_text
    return front_matter, body


def _extract_scalar(front_matter: str, key: str) -> str | None:
    """Extracts a flat scalar from the front matter."""
    match = re.search(rf"^{re.escape(key)}:\s*(.+)$", front_matter, flags=re.MULTILINE)
    if match is None:
        return None
    return _clean_scalar(match.group(1))


def _extract_nested_scalar(front_matter: str, parent: str, key: str) -> str | None:
    """Extracts a scalar nested under a top-level object."""
    parent_match = re.search(
        rf"^{re.escape(parent)}:\s*$([\s\S]*?)(?:^\S|\Z)",
        front_matter,
        flags=re.MULTILINE,
    )
    if parent_match is None:
        return None
    nested_block = parent_match.group(1)
    match = re.search(rf"^\s{{2}}{re.escape(key)}:\s*(.+)$", nested_block, flags=re.MULTILINE)
    if match is None:
        return None
    return _clean_scalar(match.group(1))


def _extract_list(front_matter: str, key: str) -> list[str]:
    """Extracts a YAML-like list of strings."""
    match = re.search(
        rf"^{re.escape(key)}:\s*$([\s\S]*?)(?:^\S|\Z)",
        front_matter,
        flags=re.MULTILINE,
    )
    if match is None:
        return []
    block = match.group(1)
    items = re.findall(r'^\s*-\s*"?(.+?)"?\s*$', block, flags=re.MULTILINE)
    return [_clean_scalar(item) for item in items if _clean_scalar(item)]


def _extract_int(front_matter: str, key: str) -> int | None:
    """Extracts an integer or null scalar."""
    value = _extract_scalar(front_matter, key)
    if value in {None, "null"}:
        return None
    return int(value)


def _clean_scalar(value: str) -> str:
    """Normalizes a quoted YAML scalar."""
    return value.strip().strip('"').strip("'")


def _normalize_url(value: str | None) -> str | None:
    """Converts placeholder URLs to None."""
    if value is None:
        return None
    normalized = value.strip()
    if normalized == _NO_AVAILABLE_VALUE:
        return None
    return normalized


def _extract_excerpt(body: str) -> str:
    """Builds a compact excerpt from the raw content section."""
    marker = "# Contenido crudo"
    content = body.split(marker, maxsplit=1)[1] if marker in body else body
    lines = [line.strip() for line in content.splitlines() if line.strip()]
    excerpt = " ".join(lines[:6])
    return excerpt[:420]


def _is_family_safe(document: KnowledgeBaseDocument) -> bool:
    """Keeps only content explicitly authorized for family-facing guidance."""
    return (
        "familias" in document.audience
        and document.usage_policy == "orientacion_no_diagnostica_con_fuente"
        and document.institution != _NO_AVAILABLE_VALUE
    )


def _score_document(
    document: KnowledgeBaseDocument,
    query_tokens: set[str],
    child_age_months: int | None,
    intent_categories: tuple[str, ...],
    requested_areas: tuple[str, ...],
) -> int:
    """Assigns a simple retrieval score to each candidate document."""
    return (
        _score_lexical_match(document, query_tokens)
        + _score_metadata_match(document, intent_categories, requested_areas)
        + _score_age_match(document, child_age_months)
        + int(document.official_url is not None)
    )


def _score_lexical_match(document: KnowledgeBaseDocument, query_tokens: set[str]) -> int:
    """Scores title, metadata, and excerpt overlap with the family wording."""
    haystack = _normalize_text(
        " ".join(
            [
                document.title,
                document.institution,
                " ".join(document.categories),
                " ".join(document.resource_types),
                " ".join(document.areas),
                " ".join(document.keywords),
                document.excerpt,
            ]
        )
    )
    title_tokens = _tokenize(document.title)
    score = 0

    for token in query_tokens:
        if token in title_tokens:
            score += 4
        elif token in haystack:
            score += 2

    return score


def _score_metadata_match(
    document: KnowledgeBaseDocument,
    intent_categories: tuple[str, ...],
    requested_areas: tuple[str, ...],
) -> int:
    """Prioritizes the controlled category and development-area mapping."""
    document_categories = {_normalize_text(category) for category in document.categories}
    document_areas = {_normalize_text(area) for area in document.areas}
    category_score = sum(
        16 if index == 0 else 8
        for index, category in enumerate(intent_categories)
        if _normalize_text(category) in document_categories
    )
    area_score = sum(8 for area in requested_areas if _normalize_text(area) in document_areas)
    return category_score + area_score


def _score_age_match(document: KnowledgeBaseDocument, child_age_months: int | None) -> int:
    """Adds relevance only when the source explicitly covers the child's age."""
    return 4 if child_age_months is not None and _matches_age(document, child_age_months) else 0


def _matches_age(document: KnowledgeBaseDocument, child_age_months: int) -> bool:
    """Returns True when the document fits the provided age range."""
    min_age = document.age_min_months
    max_age = document.age_max_months
    if min_age is None and max_age is None:
        return False
    if min_age is not None and child_age_months < min_age:
        return False
    return max_age is None or child_age_months <= max_age


def _has_compatible_age_range(document: KnowledgeBaseDocument, child_age_months: int) -> bool:
    """Rejects declared or title-specific age ranges that do not fit the child."""
    if document.age_min_months is not None or document.age_max_months is not None:
        return _matches_age(document, child_age_months)
    title_age_ranges = [
        (int(minimum), int(maximum))
        for minimum, maximum in _TITLE_AGE_RANGE_PATTERN.findall(document.title)
    ]
    if title_age_ranges:
        return any(minimum <= child_age_months <= maximum for minimum, maximum in title_age_ranges)
    title_ages = [int(value) for value in _TITLE_AGE_PATTERN.findall(document.title)]
    return not title_ages or child_age_months in title_ages


def _filter_by_categories(
    documents: list[KnowledgeBaseDocument], categories: tuple[str, ...]
) -> list[KnowledgeBaseDocument]:
    """Restricts retrieval to mapped intents when the corpus has matching resources."""
    normalized_categories = {_normalize_text(category) for category in categories}
    if not normalized_categories:
        return []
    return [
        document
        for document in documents
        if normalized_categories.intersection(
            _normalize_text(category) for category in document.categories
        )
    ]


def _filter_by_age(
    documents: list[KnowledgeBaseDocument], child_age_months: int | None
) -> list[KnowledgeBaseDocument]:
    """Removes sources whose declared age range excludes the child's current age."""
    if child_age_months is None:
        return documents
    return [
        document for document in documents if _has_compatible_age_range(document, child_age_months)
    ]


def _infer_values(query: str, mapping: dict[str, tuple[str, ...]]) -> tuple[str, ...]:
    """Maps family wording to controlled RAG metadata values."""
    normalized_query = _normalize_text(query)
    return tuple(
        value
        for value, triggers in mapping.items()
        if any(trigger in normalized_query for trigger in triggers)
    )


def _infer_intent_categories(query: str) -> tuple[str, ...]:
    """Orders multiple user goals while keeping the requested action first."""
    detected_categories = set(_infer_values(query, _INTENT_CATEGORY_TRIGGERS))
    return tuple(
        category for category in _INTENT_CATEGORY_PRIORITY if category in detected_categories
    )


def _unique_values(values: tuple[str, ...]) -> tuple[str, ...]:
    """Preserves order while removing repeated metadata values."""
    return tuple(dict.fromkeys(values))


def _tokenize(value: str) -> set[str]:
    """Tokenizes normalized text into searchable terms."""
    return set(re.findall(r"[a-z0-9]+", _normalize_text(value)))


def _normalize_text(value: str) -> str:
    """Lowercases and removes accents for lightweight lexical matching."""
    normalized = unicodedata.normalize("NFKD", value.lower())
    return "".join(char for char in normalized if not unicodedata.combining(char))
