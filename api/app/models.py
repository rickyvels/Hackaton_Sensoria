from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship as sa_relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    dni: Mapped[str] = mapped_column(String(16), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(120))
    role: Mapped[str] = mapped_column(String(32), index=True)
    password_hash: Mapped[str] = mapped_column(String(256))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    family_profile: Mapped[FamilyProfile | None] = sa_relationship(back_populates="user", uselist=False)


class FamilyRegistrationRequest(Base):
    """Minimal pre-registration. It does not create a clinical case or grant access."""

    __tablename__ = "family_registration_requests"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    dni: Mapped[str] = mapped_column(String(16), unique=True, index=True)
    companion_name: Mapped[str] = mapped_column(String(120))
    patient_name: Mapped[str] = mapped_column(String(120))
    relationship: Mapped[str] = mapped_column(String(64))
    phone: Mapped[str] = mapped_column(String(32))
    district: Mapped[str] = mapped_column(String(64))
    consent_confirmed: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(32), default="pending_review", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class FamilyProfile(Base):
    __tablename__ = "family_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    patient_name: Mapped[str] = mapped_column(String(120))
    relationship: Mapped[str] = mapped_column(String(64))
    phone: Mapped[str] = mapped_column(String(32))
    district: Mapped[str] = mapped_column(String(64))

    user: Mapped[User] = sa_relationship(back_populates="family_profile")
    cases: Mapped[list[CaseRecord]] = sa_relationship(back_populates="family_profile")


class CaseRecord(Base):
    __tablename__ = "cases"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    case_code: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    family_profile_id: Mapped[int] = mapped_column(ForeignKey("family_profiles.id"), index=True)
    professional_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    patient_name: Mapped[str] = mapped_column(String(120))
    route_status: Mapped[str] = mapped_column(String(64), index=True)
    approval_status: Mapped[str] = mapped_column(String(64), index=True)
    barrier_reported: Mapped[bool] = mapped_column(Boolean, default=False)
    family_message: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    family_profile: Mapped[FamilyProfile] = sa_relationship(back_populates="cases")
    professional_user: Mapped[User] = sa_relationship()
    barrier_reports: Mapped[list[BarrierReport]] = sa_relationship(back_populates="case")
    approval_decisions: Mapped[list[ApprovalDecision]] = sa_relationship(back_populates="case")
    tasks: Mapped[list[Task]] = sa_relationship(back_populates="case")
    events: Mapped[list[CaseEvent]] = sa_relationship(back_populates="case")
    orchestration_runs: Mapped[list[OrchestrationRun]] = sa_relationship(back_populates="case")


class BarrierReport(Base):
    __tablename__ = "barrier_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), index=True)
    reporter_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    barrier_type: Mapped[str] = mapped_column(String(32))
    title: Mapped[str] = mapped_column(String(140))
    description: Mapped[str] = mapped_column(Text)
    availability_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_synthesis: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    validation_status: Mapped[str] = mapped_column(String(32), default="pending_validation", index=True)
    validated_by_professional: Mapped[bool] = mapped_column(Boolean, default=False)
    reviewer_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    reviewer_comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    validated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(32), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    case: Mapped[CaseRecord] = sa_relationship(back_populates="barrier_reports")
    reporter_user: Mapped[User] = sa_relationship(foreign_keys=[reporter_user_id])


class ApprovalDecision(Base):
    __tablename__ = "approval_decisions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), index=True)
    barrier_report_id: Mapped[int] = mapped_column(ForeignKey("barrier_reports.id"), unique=True, index=True)
    orchestration_run_id: Mapped[str | None] = mapped_column(
        ForeignKey("orchestration_runs.id"), unique=True, index=True, nullable=True
    )
    professional_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    decision: Mapped[str] = mapped_column(String(32), index=True)
    professional_note: Mapped[str] = mapped_column(Text)
    authorized_proposal: Mapped[str | None] = mapped_column(Text, nullable=True)
    proposal_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    case: Mapped[CaseRecord] = sa_relationship(back_populates="approval_decisions")
    barrier_report: Mapped[BarrierReport] = sa_relationship()
    professional_user: Mapped[User] = sa_relationship()
    task: Mapped[Task | None] = sa_relationship(back_populates="approval_decision", uselist=False)


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), index=True)
    approval_decision_id: Mapped[int] = mapped_column(ForeignKey("approval_decisions.id"), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(140))
    owner: Mapped[str] = mapped_column(String(120))
    status: Mapped[str] = mapped_column(String(32), index=True)
    authorized_proposal: Mapped[str] = mapped_column(Text)
    due_label: Mapped[str] = mapped_column(String(80))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    case: Mapped[CaseRecord] = sa_relationship(back_populates="tasks")
    approval_decision: Mapped[ApprovalDecision] = sa_relationship(back_populates="task")


class CaseEvent(Base):
    __tablename__ = "case_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), index=True)
    kind: Mapped[str] = mapped_column(String(64), index=True)
    actor: Mapped[str] = mapped_column(String(120))
    message: Mapped[str] = mapped_column(Text)
    event_metadata: Mapped[dict[str, Any] | None] = mapped_column("metadata", JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    case: Mapped[CaseRecord] = sa_relationship(back_populates="events")


class OrchestrationRun(Base):
    __tablename__ = "orchestration_runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"), index=True)
    barrier_report_id: Mapped[int | None] = mapped_column(ForeignKey("barrier_reports.id"), index=True, nullable=True)
    status: Mapped[str] = mapped_column(String(32), index=True)
    provider: Mapped[str] = mapped_column(String(32))
    model: Mapped[str] = mapped_column(String(120))
    current_agent: Mapped[str | None] = mapped_column(String(64), nullable=True)
    proposal: Mapped[str | None] = mapped_column(Text, nullable=True)
    artifacts: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    case: Mapped[CaseRecord] = sa_relationship(back_populates="orchestration_runs")

    __table_args__ = (
        Index(
            "uq_active_run_per_barrier",
            "barrier_report_id",
            unique=True,
            sqlite_where=status.in_(("queued", "running", "paused", "waiting_approval")),
        ),
    )
