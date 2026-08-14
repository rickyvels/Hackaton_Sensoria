from __future__ import annotations

from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import CaseEvent, CaseRecord, FamilyNote, FamilyProfile, User
from .security import hash_password

# Observaciones sintéticas para que la libreta no aparezca vacía en la demostración.
DEMO_NOTES = (
    (6, "colegio", "avance", "La maestra contó que Mateo participó en la ronda de saludo y esperó su turno sin ayuda. Es la primera vez este mes."),
    (4, "casa", "retroceso", "Dos noches seguidas le costó dormir y se despertó llorando. Coincidió con el cambio de horario de la terapia."),
    (2, "terapia", "avance", "En la sesión de lenguaje repitió tres palabras nuevas. La terapeuta pidió que las practiquemos en casa antes de la próxima cita."),
)


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
        care_stage="intervention",
        early_detection=True,
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

    today = datetime.now(UTC).date()
    for days_ago, setting, progress, observation in DEMO_NOTES:
        session.add(
            FamilyNote(
                case_id=case.id,
                author_user_id=family_user.id,
                setting=setting,
                observation=observation,
                progress=progress,
                occurred_on=today - timedelta(days=days_ago),
            )
        )
