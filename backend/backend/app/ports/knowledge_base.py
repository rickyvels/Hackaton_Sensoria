"""Knowledge base retrieval port definitions."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class KnowledgeBaseDocument:
    """Normalized family-safe resource ready for retrieval."""

    resource_id: str
    title: str
    institution: str
    official_url: str | None
    source_quality: str
    categories: tuple[str, ...]
    resource_types: tuple[str, ...]
    age_min_months: int | None
    age_max_months: int | None
    excerpt: str
    content: str
    audience: str
    usage_policy: str
    relative_path: str
    source_file_path: str | None = None
    areas: tuple[str, ...] = ()
    keywords: tuple[str, ...] = ()


class KnowledgeBase(Protocol):
    """Abstract retrieval interface over the prepared RAG corpus."""

    def search(
        self,
        *,
        query: str,
        child_age_months: int | None = None,
        preferred_categories: tuple[str, ...] = (),
        limit: int = 4,
    ) -> list[KnowledgeBaseDocument]:
        """Returns the best matching family-safe documents for a query."""
        ...
