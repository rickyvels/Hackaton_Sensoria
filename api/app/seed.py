from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import CaseEvent, CaseRecord, FamilyProfile, User
from .security import hash_password


async def seed_demo_data(session: AsyncSession) -> None:
    existing = await session.scalar(select(func.count()).select_from(User))
    if existing and existing > 0:
        return

    family_user = User(
        dni="12345678",
        full_name="Maria Quispe",
        role="family",
        password_hash=hash_password("familia123"),
    )
    professional_user = User(
        dni="87654321",
        full_name="Dra. Lucia Ramos",
        role="professional",
        password_hash=hash_password("profesional123"),
    )
    session.add_all([family_user, professional_user])
    await session.flush()

    family_profile = FamilyProfile(
        user_id=family_user.id,
        patient_name="Mateo Quispe",
        relationship="Madre",
        phone="+51 900 000 001",
        district="San Borja",
    )
    session.add(family_profile)
    await session.flush()

    case = CaseRecord(
        case_code="CASO-SINT-014",
        family_profile_id=family_profile.id,
        professional_user_id=professional_user.id,
        patient_name="Mateo Quispe",
        route_status="scheduled",
        approval_status="not_requested",
        barrier_reported=False,
        family_message="Tu proxima atencion esta programada. Si surge una dificultad, cuentanos para coordinar contigo.",
    )
    session.add(case)
    await session.flush()

    session.add(
        CaseEvent(
            case_id=case.id,
            kind="RouteState",
            actor="Sistema",
            message="Caso sintetico listo para demostracion.",
            event_metadata={"sensitivity": "synthetic"},
        )
    )
