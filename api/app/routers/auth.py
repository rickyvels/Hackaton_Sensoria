from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..models import FamilyRegistrationRequest, User
from ..schemas import (
    AuthLoginRequest,
    AuthLoginResponse,
    FamilyRegistrationRequestCreate,
    FamilyRegistrationRequestResponse,
    UserRead,
)
from ..security import create_access_token, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/family-registration", response_model=FamilyRegistrationRequestResponse, status_code=status.HTTP_202_ACCEPTED)
async def request_family_registration(
    payload: FamilyRegistrationRequestCreate, session: AsyncSession = Depends(get_session)
) -> FamilyRegistrationRequestResponse:
    """Collect a minimal request without exposing whether a DNI already exists."""
    existing_user = await session.scalar(select(User.id).where(User.dni == payload.dni))
    existing_request = await session.scalar(
        select(FamilyRegistrationRequest.id).where(FamilyRegistrationRequest.dni == payload.dni)
    )
    if existing_user is None and existing_request is None:
        session.add(FamilyRegistrationRequest(**payload.model_dump()))
        await session.commit()
    return FamilyRegistrationRequestResponse(
        status="pending_review",
        message="Recibimos tu solicitud. El equipo verificará los datos antes de habilitar el acceso.",
    )


@router.post("/login", response_model=AuthLoginResponse)
async def login(payload: AuthLoginRequest, session: AsyncSession = Depends(get_session)) -> AuthLoginResponse:
    result = await session.execute(select(User).where(User.dni == payload.dni))
    user = result.scalar_one_or_none()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(user_id=user.id, role=user.role, dni=user.dni)
    return AuthLoginResponse(access_token=token, token_type="bearer", user=UserRead.model_validate(user))
