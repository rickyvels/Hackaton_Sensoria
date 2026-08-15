"""Specialist endpoints router."""

from __future__ import annotations

from fastapi import APIRouter

specialist_router = APIRouter(prefix="/api/v1/specialist", tags=["Equipo Especializado"])
