from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    llm_mode: Literal["claude", "mock"] = "claude"
    claude_model: str = "claude-opus-5-5"
    claude_effort: Literal["low", "medium", "high", "xhigh", "max"] = "medium"
    claude_max_tokens: int = 16000

    storage_backend: Literal["local", "s3"] = "local"
    local_data_dir: str = "./data"
    s3_bucket: str = ""
    s3_prefix: str = "plans/"

    app_api_key: str = ""
    cors_origins: str = "*"


@lru_cache
def get_settings() -> Settings:
    return Settings()
