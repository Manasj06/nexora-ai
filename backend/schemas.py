"""
Nexora AI — Pydantic Schemas
Request/response models for the API
"""

from pydantic import BaseModel
from typing import Optional, Literal


# ─── Context ──────────────────────────────────────────────────────────────────
class AppContext(BaseModel):
    app_name: str = "Unknown"
    window_title: str = "Unknown"
    platform: str = "Unknown"
    clipboard_content: Optional[str] = None
    screenshot_base64: Optional[str] = None
    error_message: Optional[str] = None
    ui_elements: Optional[str] = None
    user_action: Optional[str] = None


# ─── Assist Request ───────────────────────────────────────────────────────────
class AssistRequest(BaseModel):
    query: str
    context: AppContext
    expertise_level: Literal["beginner", "intermediate", "advanced"] = "intermediate"
    stream: bool = False


# ─── Assist Response ──────────────────────────────────────────────────────────
class AssistResponse(BaseModel):
    answer: str
    context_used: AppContext
    tokens_used: Optional[int] = None
    model: Optional[str] = None


# ─── Error Detection Request ──────────────────────────────────────────────────
class ErrorFixRequest(BaseModel):
    error_text: str
    app_name: str
    context: Optional[AppContext] = None
    expertise_level: Literal["beginner", "intermediate", "advanced"] = "intermediate"


# ─── Authentication ───────────────────────────────────────────────────────────
class AuthUser(BaseModel):
    id: int
    email: str
    display_name: str
    created_at: str
    last_login_at: Optional[str] = None
    history_salt: str


class SignUpRequest(BaseModel):
    display_name: str
    email: str
    password: str


class SignInRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    token: str
    expires_at: str
    user: AuthUser


# ─── Encrypted History ────────────────────────────────────────────────────────
class HistoryEntryCreate(BaseModel):
    encrypted_payload: str
    iv: str


class HistoryEntryResponse(BaseModel):
    id: int
    encrypted_payload: str
    iv: str
    created_at: str
