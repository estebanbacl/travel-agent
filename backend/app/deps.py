from functools import lru_cache

from fastapi import Header, HTTPException

from app.config import get_settings
from app.services.claude_service import PlanGenerator, build_generator
from app.storage import build_repository
from app.storage.base import PlanRepository


@lru_cache
def get_repo() -> PlanRepository:
    return build_repository(get_settings())


@lru_cache
def get_generator() -> PlanGenerator:
    return build_generator(get_settings())


def require_api_key(x_api_key: str | None = Header(default=None)) -> None:
    expected = get_settings().app_api_key
    if expected and x_api_key != expected:
        raise HTTPException(401, "Invalid or missing X-API-Key")
