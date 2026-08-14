from __future__ import annotations

from datetime import date, datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


Role = Literal["family", "professional"]
RouteStatus = Literal["scheduled", "barrier_reported", "awaiting_authorization", "coordination_active"]
# Eje clínico del recorrido, distinto del estado operativo de la ruta.
CareStage = Literal["detection", "referral", "assessment", "intervention", "followup", "discharge"]
NoteSetting = Literal["casa", "colegio", "terapia", "comunidad", "otro"]
NoteProgress = Literal["avance", "sin_cambios", "retroceso"]
ApprovalStatus = Literal["not_requested", "pending", "approved", "rejected"]
BarrierType = Literal["availability", "transport", "administrative", "other"]
BarrierReviewStatus = Literal["pending_validation", "pending_review", "approved", "rejected", "clarification_requested"]
DecisionType = Literal["approved", "rejected"]
TaskStatus = Literal["pending", "in_progress", "completed"]
RunStatus = Literal["queued", "running", "paused", "waiting_approval", "completed", "failed"]


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role: Role
    dni: str
    full_name: str


class AuthLoginRequest(BaseModel):
    dni: str = Field(min_length=8, max_length=16)
    password: str = Field(min_length=6, max_length=128)


class AuthLoginResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"]
    user: UserRead


class FamilyRegistrationRequestCreate(BaseModel):
    dni: str = Field(min_length=8, max_length=16)
    companion_name: str = Field(min_length=3, max_length=120)
    patient_name: str = Field(min_length=2, max_length=120)
    relationship: str = Field(min_length=2, max_length=64)
    phone: str = Field(min_length=7, max_length=32)
    district: str = Field(min_length=2, max_length=64)
    consent_confirmed: Literal[True]

    @field_validator("dni")
    @classmethod
    def dni_must_be_numeric(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized.isdigit():
            raise ValueError("dni must contain only digits")
        return normalized


class FamilyRegistrationRequestResponse(BaseModel):
    status: Literal["pending_review"]
    message: str


class FamilyProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_name: str
    relationship: str
    phone: str
    district: str


class CaseSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    case_code: str
    patient_name: str
    route_status: RouteStatus
    care_stage: CareStage
    early_detection: bool | None = None
    approval_status: ApprovalStatus
    barrier_reported: bool
    family_message: str
    updated_at: datetime


class BarrierReportCreate(BaseModel):
    barrier_type: BarrierType
    title: str = Field(min_length=4, max_length=140)
    description: str = Field(min_length=10, max_length=2000)
    availability_note: str | None = Field(default=None, max_length=500)


class BarrierReportRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: BarrierReviewStatus
    barrier_type: BarrierType
    title: str
    description: str
    availability_note: str | None
    ai_synthesis: dict[str, Any] | None = None
    validation_status: str
    validated_by_professional: bool
    reviewer_comment: str | None = None
    created_at: datetime


class SynthesisValidationCreate(BaseModel):
    decision: Literal["approved", "rejected", "clarification_requested"]
    edited_summary: str | None = Field(default=None, max_length=2000)
    professional_comment: str = Field(min_length=3, max_length=2000)


class FamilyNoteCreate(BaseModel):
    setting: NoteSetting
    observation: str = Field(min_length=10, max_length=2000)
    progress: NoteProgress
    occurred_on: date

    @field_validator("occurred_on")
    @classmethod
    def cannot_be_in_the_future(cls, value: date) -> date:
        # La libreta documenta lo que ya pasó. Una fecha futura sería una expectativa, y
        # mezclarla con las observaciones distorsionaría la línea de tiempo que lee el equipo.
        if value > datetime.now().date():
            raise ValueError("occurred_on cannot be in the future")
        return value


class FamilyNoteReviewCreate(BaseModel):
    professional_comment: str = Field(min_length=3, max_length=2000)


class FamilyNoteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    setting: NoteSetting
    observation: str
    progress: NoteProgress
    occurred_on: date
    author_name: str
    professional_comment: str | None = None
    reviewed_at: datetime | None = None
    created_at: datetime


class FamilyNoteSummary(BaseModel):
    """Recuento simple para que la familia vea que su registro se acumula y se lee."""

    total: int
    advances: int
    steady: int
    setbacks: int
    pending_review: int


class FamilyNotesResponse(BaseModel):
    notes: list[FamilyNoteRead]
    summary: FamilyNoteSummary


class FamilyNoteResponse(BaseModel):
    note: FamilyNoteRead
    summary: FamilyNoteSummary


class PendingApprovalRead(BaseModel):
    barrier_report_id: int
    status: Literal["pending"]
    requested_at: datetime


class TaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    owner: str
    status: TaskStatus
    authorized_proposal: str
    due_label: str
    created_at: datetime


class ApprovalDecisionCreate(BaseModel):
    model_config = ConfigDict(validate_default=True)

    decision: DecisionType
    professional_note: str = Field(min_length=5, max_length=2000)
    authorized_proposal: str | None = Field(default=None, max_length=2000)

    @field_validator("authorized_proposal")
    @classmethod
    def validate_authorized_proposal(cls, value: str | None, info: Any) -> str | None:
        decision = info.data.get("decision") if info.data else None
        normalized = value.strip() if value is not None else None
        if decision == "approved" and not normalized:
            raise ValueError("authorized_proposal is required when decision is approved")
        return normalized or None


class ApprovalDecisionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    orchestration_run_id: str | None
    decision: DecisionType
    professional_note: str
    authorized_proposal: str | None
    proposal_hash: str | None
    created_at: datetime


class EventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    kind: str
    actor: str
    message: str
    metadata: dict[str, Any] | None = Field(validation_alias="event_metadata")
    created_at: datetime


class FamilyMeResponse(BaseModel):
    user: UserRead
    family_profile: FamilyProfileRead
    active_case: CaseSummary


class FamilyCaseResponse(BaseModel):
    case: CaseSummary
    latest_barrier_report: BarrierReportRead | None
    tasks: list[TaskRead]
    pending_approval: PendingApprovalRead | None


class FamilyAssistantRequest(BaseModel):
    message: str = Field(min_length=2, max_length=800)


class FamilyAssistantResponse(BaseModel):
    answer: str = Field(min_length=4, max_length=1200)
    provider: Literal["ollama", "deterministic"]
    model: str
    disclaimer: str


class BarrierReportResponse(BaseModel):
    report: BarrierReportRead
    case: CaseSummary
    task_created: Literal[False]


class ProfessionalCaseListItem(BaseModel):
    id: int
    case_code: str
    family_name: str
    patient_name: str
    route_status: RouteStatus
    care_stage: CareStage
    approval_status: ApprovalStatus
    last_barrier_title: str | None
    unreviewed_notes: int
    updated_at: datetime


class ProfessionalCasesResponse(BaseModel):
    items: list[ProfessionalCaseListItem]


class ProfessionalCaseDetailResponse(BaseModel):
    case: CaseSummary
    family_profile: FamilyProfileRead
    latest_barrier_report: BarrierReportRead | None
    approval_history: list[ApprovalDecisionRead]
    tasks: list[TaskRead]
    family_notes: list[FamilyNoteRead]
    family_notes_summary: FamilyNoteSummary


class ApprovalDecisionResponse(BaseModel):
    decision: ApprovalDecisionRead
    case: CaseSummary
    task: TaskRead | None


class FeedResponse(BaseModel):
    case: CaseSummary
    events: list[EventRead]
    tasks: list[TaskRead]
    latest_barrier_report: BarrierReportRead | None


class TaskEnvelope(BaseModel):
    task: TaskRead


class HealthResponse(BaseModel):
    status: Literal["ok"]


class OrchestrationRunRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    case_id: int
    barrier_report_id: int | None
    status: RunStatus
    provider: str
    model: str
    current_agent: str | None
    proposal: str | None
    artifacts: list[dict[str, Any]]
    error: str | None
    created_at: datetime
    updated_at: datetime


class RunControlCreate(BaseModel):
    action: Literal["pause", "resume"]


class ProvenanceNodeRead(BaseModel):
    id: str
    kind: str
    label: str
    actor: str
    timestamp: datetime
    origin: str
    sensitivity: str
    explanation: str
    status: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class ProvenanceEdgeRead(BaseModel):
    id: str
    source: str
    target: str
    relation: str
    explanation: str


class ProvenanceGraphResponse(BaseModel):
    nodes: list[ProvenanceNodeRead]
    edges: list[ProvenanceEdgeRead]
