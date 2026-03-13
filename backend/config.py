"""
Nexora AI — Backend Configuration
Loads environment variables and exposes typed settings
"""

from pydantic_settings import BaseSettings
from typing import Literal


class Settings(BaseSettings):
    # AI Provider
    AI_PROVIDER: Literal["openai", "nvidia"] = "nvidia"
    OPENAI_API_KEY: str = ""
    NVIDIA_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"
    NVIDIA_LLAMA_MODEL: str = "meta/llama-2-70b-chat"

    # Server
    BACKEND_HOST: str = "127.0.0.1"
    BACKEND_PORT: int = 8000
    AUTH_DB_PATH: str = "backend/data/nexora_auth.db"
    AUTH_SESSION_DAYS: int = 14

    # Feature Flags
    ENABLE_CLIPBOARD_MONITOR: bool = True
    ENABLE_SCREENSHOT_CAPTURE: bool = True
    ENABLE_ERROR_WATCHER: bool = True

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
