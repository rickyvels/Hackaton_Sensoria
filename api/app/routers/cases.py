from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..dependencies import get_current_user
from ..models import CaseRecord, Task, User
from ..schemas import EventRead, FeedResponse, HealthResponse, TaskEnvelope
from ..services import fetch_current_case_for_family, fetch_events, fetch_latest_barrier_report, fetch_tasks

router = APIRouter(tags=["cases"])

FAMILY_EVENT_KINDS = {"FamilyReport", "Barrier", "ApprovalRequest", "Task", "Notification", "RouteState"}
FAMILY_METADATA_KEYS = {"channel", "status"}


async def _authorized_case(session: AsyncSession, *, case_id: int, user: User) -> CaseRecord:
    if user.role == "family":
        current_case = await fetch_current_case_for_family(session, user_id=user.id)
        if current_case.id != case_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
        return current_case

    result = await session.execute(
        select(CaseRecord).where(CaseRecord.id == case_id, CaseRecord.professional_user_id == user.id)
    )
    case = result.scalar_one_or_none()
    if case is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    return case


@router.get("/health", response_model=HealthResponse)
async def healthcheck() -> HealthResponse:
    return HealthResponse(status="ok")


@router.get("/cases/{case_id}/feed", response_model=FeedResponse)
async def get_case_feed(
    case_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> FeedResponse:
    case = await _authorized_case(session, case_id=case_id, user=user)
    events = await fetch_events(session, case_id=case.id)
    if user.role == "family":
        events = [
            EventRead(
                id=event.id,
                kind=event.kind,
                actor=event.actor,
                message=event.message,
                event_metadata={
                    key: value
                    for key, value in (event.event_metadata or {}).items()
                    if key in FAMILY_METADATA_KEYS
                },
                created_at=event.created_at,
            )
            for event in events
            if event.kind in FAMILY_EVENT_KINDS
        ]
    tasks = await fetch_tasks(session, case_id=case.id)
    latest_report = await fetch_latest_barrier_report(session, case_id=case.id)
    return FeedResponse(case=case, events=events, tasks=tasks, latest_barrier_report=latest_report)


@router.get("/tasks/{task_id}", response_model=TaskEnvelope)
async def get_task(
    task_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> TaskEnvelope:
    result = await session.execute(
        select(Task, CaseRecord)
        .join(CaseRecord, Task.case_id == CaseRecord.id)
        .where(Task.id == task_id)
    )
    row = result.first()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    task, case = row
    if user.role == "family":
        current_case = await fetch_current_case_for_family(session, user_id=user.id)
        if current_case.id != case.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    elif case.professional_user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return TaskEnvelope(task=task)
