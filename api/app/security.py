from __future__ import annotations

import hashlib
import hmac
import os
from datetime import UTC, datetime, timedelta

import jwt

from .config import get_settings


def hash_password(password: str) -> str:
    salt = b"neuroalianza-demo-salt"
    derived = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120_000)
    return derived.hex()


def verify_password(password: str, password_hash: str) -> bool:
    return hmac.compare_digest(hash_password(password), password_hash)


def create_access_token(*, user_id: int, role: str, dni: str) -> str:
    settings = get_settings()
    expire_at = datetime.now(UTC) + timedelta(minutes=settings.token_exp_minutes)
    payload = {
        "sub": str(user_id),
        "role": role,
        "dni": dni,
        "exp": expire_at,
        "iat": datetime.now(UTC),
        "jti": os.urandom(8).hex(),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict[str, str]:
    settings = get_settings()
    payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    return {
        "sub": str(payload["sub"]),
        "role": str(payload["role"]),
        "dni": str(payload["dni"]),
    }
