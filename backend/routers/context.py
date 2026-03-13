"""
Nexora AI — Context Router
Exposes endpoints to capture current application context
"""

from fastapi import APIRouter
from context import build_context
from schemas import AppContext
from config import settings

router = APIRouter()


@router.get("/capture", response_model=AppContext)
async def capture_context():
    """
    Captures the current active application context from the OS.
    Called by the overlay just before sending a user query.
    """
    ctx = build_context(
        include_screenshot=settings.ENABLE_SCREENSHOT_CAPTURE,
        include_clipboard=settings.ENABLE_CLIPBOARD_MONITOR,
    )
    return ctx


@router.get("/clipboard")
async def get_clipboard():
    """Returns current clipboard content."""
    from context import get_clipboard_content
    content = get_clipboard_content()
    return {"clipboard": content}
