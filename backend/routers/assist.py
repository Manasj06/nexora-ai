"""
Nexora AI — Assist Router
Core AI assistance endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from schemas import AssistRequest, AssistResponse, ErrorFixRequest, AppContext
from ai_engine import ask, ask_stream
from context import build_context
from config import settings
from auth_store import require_authenticated_user

router = APIRouter()


@router.post("/ask", response_model=AssistResponse)
async def ask_assistant(request: AssistRequest, _user: dict = Depends(require_authenticated_user)):
    """
    Main endpoint: receives user query + context, returns AI guidance.
    """
    try:
        result = await ask(request)
        return AssistResponse(
            answer=result["answer"],
            context_used=request.context,
            tokens_used=result.get("tokens_used"),
            model=result.get("model"),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ask/stream")
async def ask_assistant_stream(request: AssistRequest, _user: dict = Depends(require_authenticated_user)):
    """
    Streaming version: returns AI response token by token via SSE.
    """
    async def event_generator():
        try:
            async for token in ask_stream(request):
                yield f"data: {token}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: [ERROR] {str(e)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/fix-error", response_model=AssistResponse)
async def fix_error(request: ErrorFixRequest, _user: dict = Depends(require_authenticated_user)):
    """
    Dedicated error fix endpoint.
    Accepts raw error text and auto-builds a fix-focused request.
    """
    context = request.context or build_context(include_clipboard=False)
    context.error_message = request.error_text
    context.app_name = request.app_name or context.app_name

    assist_request = AssistRequest(
        query=f"I'm getting this error. How do I fix it?\n\n{request.error_text}",
        context=context,
        expertise_level=request.expertise_level,
    )

    try:
        result = await ask(assist_request)
        return AssistResponse(
            answer=result["answer"],
            context_used=context,
            tokens_used=result.get("tokens_used"),
            model=result.get("model"),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/quick-ask")
async def quick_ask(
    query: str,
    expertise_level: str = "intermediate",
    _user: dict = Depends(require_authenticated_user),
):
    """
    Minimal endpoint: auto-captures context and answers a quick question.
    """
    ctx = build_context(
        include_screenshot=False,
        include_clipboard=settings.ENABLE_CLIPBOARD_MONITOR,
    )

    request = AssistRequest(
        query=query,
        context=ctx,
        expertise_level=expertise_level,
    )

    try:
        result = await ask(request)
        return {"answer": result["answer"], "model": result.get("model")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
