from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_session
from ..models import User
from ..schemas import (
    AuthLoginRequest,
    AuthLoginResponse,
    FamilyRegistrationRequestCreate,
    UserRead,
)
from ..security import create_access_token, verify_password
from ..services import register_family_account

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/family-registration", response_model=AuthLoginResponse, status_code=status.HTTP_201_CREATED)
async def request_family_registration(
    payload: FamilyRegistrationRequestCreate, session: AsyncSession = Depends(get_session)
) -> AuthLoginResponse:
    """Create the family account and return a session, so the registration ends signed in.

    A diferencia de la versión anterior, esto responde distinto cuando el DNI ya existe. Se
    pierde la protección contra enumeración de DNI a cambio de que la familia entienda por qué
    no puede entrar; es una decisión aceptable mientras los datos sean sintéticos.
    """
    user = await register_family_account(session, payload=payload)
    return AuthLoginResponse(
        access_token=create_access_token(user_id=user.id, role=user.role, dni=user.dni),
        token_type="bearer",
        user=UserRead.model_validate(user),
    )


@router.post("/login", response_model=AuthLoginResponse)
async def login(payload: AuthLoginRequest, session: AsyncSession = Depends(get_session)) -> AuthLoginResponse:
    result = await session.execute(select(User).where(User.dni == payload.dni))
    user = result.scalar_one_or_none()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(user_id=user.id, role=user.role, dni=user.dni)
    return AuthLoginResponse(access_token=token, token_type="bearer", user=UserRead.model_validate(user))
