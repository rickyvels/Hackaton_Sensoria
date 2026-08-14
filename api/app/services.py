from __future__ import annotations

import hashlib
from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import HTTPException, status
from sqlalchemy import desc, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from .models import (
    ApprovalDecision,
    BarrierReport,
    CaseEvent,
    CaseRecord,
    FamilyNote,
    FamilyProfile,
    OrchestrationRun,
    Task,
    User,
)
from .schemas import (
    ApprovalDecisionCreate,
    BarrierReportCreate,
    FamilyNoteCreate,
    FamilyNoteRead,
    FamilyNoteReviewCreate,
    FamilyNoteSummary,
    SynthesisValidationCreate,
)

LIMA_TZ = ZoneInfo("America/Lima")


def build_task_payload(authorized_proposal: str) -> dict[str, str]:
    due_label = datetime.now(LIMA_TZ).strftime("%Y-%m-%d 16:00 PET")
    return {
        "title": "Coordinar alternativa de horario y cupo",
        "owner": "Admisión y coordinación",
        "status": "pending",
        "authorized_proposal": authorized_proposal,
        "due_label": due_label,
    }


def family_message_for_case(route_status: str, approval_status: str) -> str:
    if approval_status == "approved":
        return "El equipo está coordinando una alternativa compatible con tu horario."
    if approval_status == "rejected":
        return "El equipo revisará la propuesta antes de darte una alternativa."
    if route_status == "awaiting_authorization":
        return "Recibimos tu aviso. Estamos revisando alternativas con el equipo."
    if route_status == "barrier_reported":
        return "Recibimos tu aviso. El equipo puede iniciar una revisión transparente de la barrera."
    return "Tu próxima atención está programada. Si surge una dificultad, cuéntanos para coordinar contigo."


def synthesize_report(payload: BarrierReportCreate) -> dict[str, object]:
    """Deterministic, inspectable synthesis; the model may later replace this implementation."""
    items = [
        {"category": "Continuidad", "text": payload.title},
        {"category": "Barrera reportada", "text": payload.description},
    ]
    if payload.availability_note:
        items.append({"category": "Disponibilidad", "text": payload.availability_note})
    missing = ["Confirmar si la dificultad afecta una cita, terapia o evaluación específica."]
    return {
        "version": 1,
        "summary": f"{payload.title}. {payload.description}",
        "items": items,
        "missing_information": missing,
        "possible_contradictions": [],
        "administrative_action": "Revisar el siguiente paso con el profesional responsable.",
        "generated_by": "síntesis estructurada local",
    }


async def emit_event(
    session: AsyncSession,
    *,
    case_id: int,
    kind: str,
    actor: str,
    message: str,
    metadata: dict[str, str | int | bool] | None = None,
) -> CaseEvent:
    latest_id = await session.scalar(
        select(CaseEvent.id).where(CaseEvent.case_id == case_id).order_by(desc(CaseEvent.id)).limit(1)
    )
    event_metadata = {
        "origin": "neuroalianza-api",
        "sensitivity": "synthetic",
        "explanation": message,
        **(metadata or {}),
    }
    if latest_id is not None and "previous_event_id" not in event_metadata:
        event_metadata["previous_event_id"] = latest_id
    event = CaseEvent(case_id=case_id, kind=kind, actor=actor, message=message, event_metadata=event_metadata)
    session.add(event)
    await session.flush()
    return event


async def fetch_family_profile_for_user(session: AsyncSession, *, user_id: int) -> FamilyProfile:
    result = await session.execute(select(FamilyProfile).where(FamilyProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Family profile not found")
    return profile


async def fetch_current_case_for_family(session: AsyncSession, *, user_id: int) -> CaseRecord:
    result = await session.execute(
        select(CaseRecord)
        .join(FamilyProfile, CaseRecord.family_profile_id == FamilyProfile.id)
        .where(FamilyProfile.user_id == user_id)
        .order_by(desc(CaseRecord.updated_at), desc(CaseRecord.id))
    )
    case = result.scalars().first()
    if case is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    return case


async def fetch_latest_barrier_report(session: AsyncSession, *, case_id: int) -> BarrierReport | None:
    result = await session.execute(
        select(BarrierReport).where(BarrierReport.case_id == case_id).order_by(desc(BarrierReport.created_at), desc(BarrierReport.id))
    )
    return result.scalars().first()


async def fetch_approval_history(session: AsyncSession, *, case_id: int) -> list[ApprovalDecision]:
    result = await session.execute(
        select(ApprovalDecision).where(ApprovalDecision.case_id == case_id).order_by(desc(ApprovalDecision.created_at), desc(ApprovalDecision.id))
    )
    return list(result.scalars().all())


async def fetch_tasks(
    session: AsyncSession,
    *,
    case_id: int,
    barrier_report_id: int | None = None,
) -> list[Task]:
    statement = select(Task).join(ApprovalDecision, Task.approval_decision_id == ApprovalDecision.id)
    statement = statement.where(Task.case_id == case_id)
    if barrier_report_id is not None:
        statement = statement.where(ApprovalDecision.barrier_report_id == barrier_report_id)
    result = await session.execute(statement.order_by(desc(Task.created_at), desc(Task.id)))
    return list(result.scalars().all())


async def fetch_events(session: AsyncSession, *, case_id: int) -> list[CaseEvent]:
    result = await session.execute(
        select(CaseEvent).where(CaseEvent.case_id == case_id).order_by(CaseEvent.created_at.asc(), CaseEvent.id.asc())
    )
    return list(result.scalars().all())


async def fetch_family_notes(session: AsyncSession, *, case_id: int, limit: int = 60) -> list[FamilyNoteRead]:
    """Devuelve la libreta ordenada por cuándo ocurrió, no por cuándo se escribió."""
    rows = (
        await session.execute(
            select(FamilyNote, User.full_name)
            .join(User, FamilyNote.author_user_id == User.id)
            .where(FamilyNote.case_id == case_id)
            .order_by(desc(FamilyNote.occurred_on), desc(FamilyNote.id))
            .limit(limit)
        )
    ).all()
    return [
        FamilyNoteRead(
            id=note.id,
            setting=note.setting,
            observation=note.observation,
            progress=note.progress,
            occurred_on=note.occurred_on,
            author_name=author_name,
            professional_comment=note.professional_comment,
            reviewed_at=note.reviewed_at,
            created_at=note.created_at,
        )
        for note, author_name in rows
    ]


async def summarize_family_notes(session: AsyncSession, *, case_id: int) -> FamilyNoteSummary:
    rows = (
        await session.execute(
            select(FamilyNote.progress, func.count())
            .where(FamilyNote.case_id == case_id)
            .group_by(FamilyNote.progress)
        )
    ).all()
    counts = {progress: total for progress, total in rows}
    pending_review = await session.scalar(
        select(func.count())
        .select_from(FamilyNote)
        .where(FamilyNote.case_id == case_id, FamilyNote.reviewed_at.is_(None))
    )
    return FamilyNoteSummary(
        total=sum(counts.values()),
        advances=counts.get("avance", 0),
        steady=counts.get("sin_cambios", 0),
        setbacks=counts.get("retroceso", 0),
        pending_review=pending_review or 0,
    )


async def create_family_note(
    session: AsyncSession,
    *,
    case_id: int,
    payload: FamilyNoteCreate,
    author: User,
) -> FamilyNoteRead:
    """Registra una observación de la familia.

    Deliberadamente no toca `route_status`, `care_stage` ni crea tareas: la libreta es
    testimonio, y cualquier cambio de atención sigue exigiendo una decisión profesional.
    """
    try:
        case = await fetch_current_case_for_family(session, user_id=author.id)
        if case.id != case_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")

        note = FamilyNote(
            case_id=case.id,
            author_user_id=author.id,
            setting=payload.setting,
            observation=payload.observation,
            progress=payload.progress,
            occurred_on=payload.occurred_on,
        )
        session.add(note)
        await session.flush()
        await emit_event(
            session,
            case_id=case.id,
            kind="FamilyNote",
            actor=author.full_name,
            message=f"Nota de la familia sobre {payload.setting}.",
            metadata={
                "channel": "family-pwa",
                "family_note_id": note.id,
                "setting": payload.setting,
                "progress": payload.progress,
                "occurred_on": payload.occurred_on.isoformat(),
                "changes_route": False,
            },
        )
        await session.commit()
        await session.refresh(note)
    except Exception:
        await session.rollback()
        raise

    return FamilyNoteRead(
        id=note.id,
        setting=note.setting,
        observation=note.observation,
        progress=note.progress,
        occurred_on=note.occurred_on,
        author_name=author.full_name,
        professional_comment=note.professional_comment,
        reviewed_at=note.reviewed_at,
        created_at=note.created_at,
    )


async def review_family_note(
    session: AsyncSession,
    *,
    case_id: int,
    note_id: int,
    payload: FamilyNoteReviewCreate,
    professional: User,
) -> FamilyNoteRead:
    """Deja constancia de que el equipo leyó una nota y qué respondió."""
    case = await session.scalar(
        select(CaseRecord).where(CaseRecord.id == case_id, CaseRecord.professional_user_id == professional.id)
    )
    if case is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    note = await session.scalar(
        select(FamilyNote).where(FamilyNote.id == note_id, FamilyNote.case_id == case_id)
    )
    if note is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")

    note.reviewed_by_user_id = professional.id
    note.reviewed_at = datetime.now(LIMA_TZ)
    note.professional_comment = payload.professional_comment
    await emit_event(
        session,
        case_id=case_id,
        kind="FamilyNoteReviewed",
        actor=professional.full_name,
        message="El equipo revisó una nota de la familia.",
        metadata={"family_note_id": note.id, "changes_route": False},
    )
    await session.commit()
    await session.refresh(note)

    author_name = await session.scalar(select(User.full_name).where(User.id == note.author_user_id))
    return FamilyNoteRead(
        id=note.id,
        setting=note.setting,
        observation=note.observation,
        progress=note.progress,
        occurred_on=note.occurred_on,
        author_name=author_name or "Familia",
        professional_comment=note.professional_comment,
        reviewed_at=note.reviewed_at,
        created_at=note.created_at,
    )


async def create_barrier_report(
    session: AsyncSession,
    *,
    case_id: int,
    payload: BarrierReportCreate,
    reporter: User,
) -> tuple[CaseRecord, BarrierReport]:
    try:
        case = await fetch_current_case_for_family(session, user_id=reporter.id)
        if case.id != case_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")

        latest_report = await fetch_latest_barrier_report(session, case_id=case_id)
        if latest_report is not None and latest_report.validation_status == "pending_validation":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="There is already a pending barrier report")
        if case.approval_status == "pending":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="The current coordination must be resolved before reporting another barrier")

        report = BarrierReport(
            case_id=case.id,
            reporter_user_id=reporter.id,
            barrier_type=payload.barrier_type,
            title=payload.title,
            description=payload.description,
            availability_note=payload.availability_note,
            status="pending_validation",
            validation_status="pending_validation",
            validated_by_professional=False,
            ai_synthesis=synthesize_report(payload),
        )
        session.add(report)

        case.barrier_reported = True
        case.route_status = "barrier_reported"
        case.approval_status = "not_requested"
        case.family_message = family_message_for_case(case.route_status, case.approval_status)

        await session.flush()
        await emit_event(
            session,
            case_id=case.id,
            kind="FamilyReport",
            actor=reporter.full_name,
            message=payload.title,
            metadata={"channel": "family-pwa", "barrier_report_id": report.id},
        )
        await emit_event(
            session,
            case_id=case.id,
            kind="SynthesisGenerated",
            actor="Capa de síntesis",
            message="Síntesis generada por IA. Pendiente de revisión profesional.",
            metadata={"barrier_type": payload.barrier_type, "barrier_report_id": report.id, "validation_status": "pending_validation", "synthesis_version": 1},
        )
        await session.commit()
        await session.refresh(case)
        await session.refresh(report)
    except Exception:
        await session.rollback()
        raise

    return case, report


async def validate_synthesis(
    session: AsyncSession, *, case_id: int, payload: SynthesisValidationCreate, professional: User
) -> tuple[CaseRecord, BarrierReport]:
    case = await session.scalar(select(CaseRecord).where(CaseRecord.id == case_id, CaseRecord.professional_user_id == professional.id))
    if case is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    report = await fetch_latest_barrier_report(session, case_id=case_id)
    if report is None or report.validation_status != "pending_validation":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="No synthesis is awaiting professional validation")
    report.reviewer_user_id = professional.id
    report.reviewer_comment = payload.professional_comment
    report.validated_at = datetime.now(LIMA_TZ)
    if payload.edited_summary and report.ai_synthesis:
        report.ai_synthesis = {**report.ai_synthesis, "summary": payload.edited_summary, "version": int(report.ai_synthesis.get("version", 1)) + 1}
    report.validation_status = payload.decision
    report.validated_by_professional = payload.decision == "approved"
    report.status = "pending_review" if payload.decision == "approved" else payload.decision
    await emit_event(session, case_id=case_id, kind="SynthesisValidation", actor=professional.full_name,
        message="Información validada por profesional" if payload.decision == "approved" else "La síntesis requiere aclaración o fue rechazada",
        metadata={"barrier_report_id": report.id, "validated_by_professional": report.validated_by_professional, "decision": payload.decision, "synthesis_version": (report.ai_synthesis or {}).get("version", 1)})
    if payload.decision == "approved":
        await emit_event(
            session,
            case_id=case_id,
            kind="Barrier",
            actor="Profesional responsable",
            message="Barrera confirmada tras la revisión profesional.",
            metadata={
                "barrier_report_id": report.id,
                "barrier_type": report.barrier_type,
                "validated_by_professional": True,
            },
        )
        await emit_event(session, case_id=case_id, kind="OrchestratorGate", actor="Orquestador",
            message="Información validada — agentes habilitados.", metadata={"barrier_report_id": report.id, "validated_by_professional": True})
    await session.commit()
    await session.refresh(case)
    await session.refresh(report)
    return case, report


async def create_approval_decision(
    session: AsyncSession,
    *,
    case_id: int,
    payload: ApprovalDecisionCreate,
    professional: User,
) -> tuple[CaseRecord, ApprovalDecision, Task | None]:
    try:
        result = await session.execute(
            select(CaseRecord).where(CaseRecord.id == case_id, CaseRecord.professional_user_id == professional.id)
        )
        case = result.scalar_one_or_none()
        if case is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
        if case.approval_status != "pending":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Case is not awaiting approval")

        report = await fetch_latest_barrier_report(session, case_id=case_id)
        if report is None or report.status != "pending_review":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="No pending barrier report found")
        run = await session.scalar(
            select(OrchestrationRun).where(
                OrchestrationRun.case_id == case_id,
                OrchestrationRun.barrier_report_id == report.id,
                OrchestrationRun.status == "waiting_approval",
            )
        )
        if run is None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="No matching run is awaiting approval")

        claim = await session.execute(
            update(CaseRecord)
            .where(CaseRecord.id == case_id, CaseRecord.approval_status == "pending")
            .values(approval_status="decision_in_progress")
        )
        if claim.rowcount != 1:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="The decision was already claimed")

        authorized_text = payload.authorized_proposal or run.proposal or ""
        proposal_hash = hashlib.sha256(authorized_text.encode("utf-8")).hexdigest()
        decision = ApprovalDecision(
            case_id=case.id,
            barrier_report_id=report.id,
            orchestration_run_id=run.id,
            professional_user_id=professional.id,
            decision=payload.decision,
            professional_note=payload.professional_note,
            authorized_proposal=authorized_text if payload.decision == "approved" else None,
            proposal_hash=proposal_hash,
        )
        session.add(decision)
        await session.flush()

        task: Task | None = None
        if payload.decision == "approved":
            report.status = "approved"
            case.approval_status = "approved"
            case.route_status = "coordination_active"
            task_payload = build_task_payload(authorized_text)
            task = Task(case_id=case.id, approval_decision_id=decision.id, **task_payload)
            session.add(task)
            await session.flush()
        else:
            report.status = "rejected"
            case.approval_status = "rejected"
            case.route_status = "awaiting_authorization"

        case.family_message = family_message_for_case(case.route_status, case.approval_status)

        await emit_event(
            session,
            case_id=case.id,
            kind="ApprovalDecision",
            actor=professional.full_name,
            message=payload.professional_note,
            metadata={
                "decision": payload.decision,
                "relation": "approved_by" if payload.decision == "approved" else "rejected_by",
                "status": payload.decision,
                "run_id": run.id,
                "trace_id": run.id,
                "event_schema": "neuroalianza.trace.v1",
                "proposal_hash": proposal_hash,
            },
        )
        if task is not None:
            await emit_event(
                session,
                case_id=case.id,
                kind="Task",
                actor="Orquestador",
                message=f"Creó tarea autorizada: {task.authorized_proposal}",
                metadata={
                    "relation": "created",
                    "status": task.status,
                    "run_id": run.id,
                    "trace_id": run.id,
                    "event_schema": "neuroalianza.trace.v1",
                    "proposal_hash": proposal_hash,
                },
            )
        await session.commit()
        await session.refresh(case)
        await session.refresh(decision)
        if task is not None:
            await session.refresh(task)
    except Exception:
        await session.rollback()
        raise

    return case, decision, task
