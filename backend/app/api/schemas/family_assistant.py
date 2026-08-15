"""Pydantic request and response contracts for the family assistant."""

from __future__ import annotations

import re
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

_POSSIBLE_PERSONAL_IDENTIFIER = re.compile(r"\b\d(?:[\s-]?\d){7,8}\b")


class FamilyAssistantHistoryTurn(BaseModel):
    """One previous conversation turn sent back to the assistant."""

    model_config = ConfigDict(extra="forbid")
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, max_length=1600)


class FamilyAssistantChatRequest(BaseModel):
    """Request payload for the family-facing assistant."""

    model_config = ConfigDict(extra="forbid")
    consent_granted: bool = Field(
        ...,
        description="Consentimiento explícito para usar el asistente",
    )
    question: str = Field(..., min_length=3, max_length=1600)
    child_age_months: int | None = Field(default=None, ge=0, le=216)
    history: list[FamilyAssistantHistoryTurn] = Field(default_factory=list, max_length=12)

    @model_validator(mode="after")
    def reject_possible_identifiers(self) -> FamilyAssistantChatRequest:
        """Prevents DNI and phone-like sequences from entering the assistant prompt."""
        text_to_check = [self.question, *(turn.content for turn in self.history)]
        if any(_POSSIBLE_PERSONAL_IDENTIFIER.search(text) for text in text_to_check):
            msg = "No incluyas números que parezcan DNI o teléfonos en la consulta."
            raise ValueError(msg)
        return self


class FamilyAssistantSourceResponse(BaseModel):
    """Traceable source returned alongside an assistant answer."""

    model_config = ConfigDict(extra="forbid")
    resource_id: str
    title: str
    institution: str
    official_url: str | None
    source_quality: str
    categories: list[str]
    resource_types: list[str]
    age_min_months: int | None
    age_max_months: int | None
    excerpt: str
    relative_path: str
    source_file_path: str | None = None


class FamilyAssistantChatResponse(BaseModel):
    """Response payload for the family-facing assistant."""

    model_config = ConfigDict(extra="forbid")
    answer: str
    disclaimer: str
    consent_required: bool = False
    used_model: bool
    model: str
    sources: list[FamilyAssistantSourceResponse]
