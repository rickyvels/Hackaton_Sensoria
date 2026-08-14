from fastapi import APIRouter, Depends
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..dependencies import require_role
from ..models import CaseRecord, FamilyProfile, User
from ..orchestration import orchestration_manager
from ..schemas import (
    ApprovalDecisionCreate,
    ApprovalDecisionResponse,
    BarrierReportRead,
    CaseSummary,
    FamilyProfileRead,
    ProfessionalCaseDetailResponse,
    ProfessionalCaseListItem,
    ProfessionalCasesResponse,
    SynthesisValidationCreate,
)
from ..services import (
    create_approval_decision,
    fetch_approval_history,
    fetch_latest_barrier_report,
    fetch_tasks,
    validate_synthesis,
)

router = APIRouter(prefix="/professional", tags=["professional"])


@router.post("/cases/{case_id}/synthesis-validation", response_model=ProfessionalCaseDetailResponse)
async def review_synthesis(
    case_id: int,
    payload: SynthesisValidationCreate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_role("professional")),
) -> ProfessionalCaseDetailResponse:
    current_case, report = await validate_synthesis(session, case_id=case_id, payload=payload, professional=user)
    profile = await session.scalar(select(FamilyProfile).where(FamilyProfile.id == current_case.family_profile_id))
    return ProfessionalCaseDetailResponse(
        case=CaseSummary.model_validate(current_case),
        family_profile=FamilyProfileRead.model_validate(profile),
        latest_barrier_report=BarrierReportRead.model_validate(report),
        approval_history=await fetch_approval_history(session, case_id=case_id),
        tasks=await fetch_tasks(session, case_id=case_id, barrier_report_id=report.id),
    )


@router.get("/cases", response_model=ProfessionalCasesResponse)
async def list_professional_cases(
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_role("professional")),
) -> ProfessionalCasesResponse:
    result = await session.execute(
        select(CaseRecord, FamilyProfile, User.full_name)
        .join(FamilyProfile, CaseRecord.family_profile_id == FamilyProfile.id)
        .join(User, FamilyProfile.user_id == User.id)
        .where(CaseRecord.professional_user_id == user.id)
        .order_by(desc(CaseRecord.updated_at), desc(CaseRecord.id))
    )
    items: list[ProfessionalCaseListItem] = []
    for case, _, family_name in result.all():
        latest_report = await fetch_latest_barrier_report(session, case_id=case.id)
        items.append(
            ProfessionalCaseListItem(
                id=case.id,
                case_code=case.case_code,
                family_name=family_name,
                patient_name=case.patient_name,
                route_status=case.route_status,
                approval_status=case.approval_status,
                last_barrier_title=latest_report.title if latest_report else None,
                updated_at=case.updated_at,
            )
        )
    return ProfessionalCasesResponse(items=items)


@router.get("/cases/{case_id}", response_model=ProfessionalCaseDetailResponse)
async def get_professional_case(
    case_id: int,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_role("professional")),
) -> ProfessionalCaseDetailResponse:
    result = await session.execute(
        select(CaseRecord, FamilyProfile)
        .join(FamilyProfile, CaseRecord.family_profile_id == FamilyProfile.id)
        .where(CaseRecord.id == case_id, CaseRecord.professional_user_id == user.id)
    )
    row = result.first()
    if row is None:
        from fastapi import HTTPException, status

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    current_case, profile = row
    latest_report = await fetch_latest_barrier_report(session, case_id=case_id)
    approval_history = await fetch_approval_history(session, case_id=case_id)
    tasks = await fetch_tasks(
        session,
        case_id=case_id,
        barrier_report_id=latest_report.id if latest_report is not None else None,
    )
    return ProfessionalCaseDetailResponse(
        case=CaseSummary.model_validate(current_case),
        family_profile=FamilyProfileRead.model_validate(profile),
        latest_barrier_report=BarrierReportRead.model_validate(latest_report) if latest_report else None,
        approval_history=approval_history,
        tasks=tasks,
    )


@router.post("/cases/{case_id}/approval-decisions", response_model=ApprovalDecisionResponse)
async def decide_case(
    case_id: int,
    payload: ApprovalDecisionCreate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(require_role("professional")),
) -> ApprovalDecisionResponse:
    current_case, decision, task = await create_approval_decision(
        session,
        case_id=case_id,
        payload=payload,
        professional=user,
    )
    if decision.orchestration_run_id is not None:
        await orchestration_manager.resume_after_decision(decision.orchestration_run_id)
    return ApprovalDecisionResponse(
        decision=decision,
        case=CaseSummary.model_validate(current_case),
        task=task,
    )
