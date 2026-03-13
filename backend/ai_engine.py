"""
Nexora AI — AI Engine
Handles prompt building and API calls to OpenAI / NVIDIA
"""

from config import settings
from schemas import AppContext, AssistRequest
from prompt_builder import build_system_prompt, build_user_prompt
from typing import AsyncGenerator
import httpx

# ─── Provider Clients ─────────────────────────────────────────────────────────
_openai_client = None
_nvidia_client = None


def get_openai_client():
    global _openai_client
    if _openai_client is None:
        from openai import AsyncOpenAI
        _openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    return _openai_client


def get_nvidia_client():
    global _nvidia_client
    if _nvidia_client is None:
        from openai import AsyncOpenAI
        _nvidia_client = AsyncOpenAI(
            api_key=settings.NVIDIA_API_KEY,
            base_url="https://integrate.api.nvidia.com/v1"
        )
    return _nvidia_client


# ─── Main Ask Function ────────────────────────────────────────────────────────
async def ask(request: AssistRequest) -> dict:
    """
    Routes the request to the configured AI provider and returns the response.
    Returns: { answer: str, model: str, tokens_used: int }
    """
    system_prompt = build_system_prompt()
    user_prompt = build_user_prompt(request)

    try:
        if settings.AI_PROVIDER == "nvidia":
            return await _ask_nvidia(system_prompt, user_prompt)
        else:
            return await _ask_openai(system_prompt, user_prompt)
    except Exception as e:
        # Fallback to demo mode if API fails
        print(f"[AI Engine] API call failed: {e}")
        return _ask_demo(request)


async def _ask_nvidia(system_prompt: str, user_prompt: str) -> dict:
    """Call NVIDIA Llama API."""
    client = get_nvidia_client()

    response = await client.chat.completions.create(
        model=settings.NVIDIA_LLAMA_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=1024,
    )

    return {
        "answer": response.choices[0].message.content,
        "model": settings.NVIDIA_LLAMA_MODEL,
        "tokens_used": response.usage.total_tokens,
    }


async def _ask_openai(system_prompt: str, user_prompt: str) -> dict:
    """Call OpenAI GPT API."""
    client = get_openai_client()

    response = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=1024,
    )

    return {
        "answer": response.choices[0].message.content,
        "model": settings.OPENAI_MODEL,
        "tokens_used": response.usage.total_tokens,
    }


# ─── Streaming (both providers support this) ──────────────────────────────────
async def ask_stream(request: AssistRequest) -> AsyncGenerator[str, None]:
    """Streams the response token by token."""
    system_prompt = build_system_prompt()
    user_prompt = build_user_prompt(request)
    
    try:
        if settings.AI_PROVIDER == "nvidia":
            client = get_nvidia_client()
            model = settings.NVIDIA_LLAMA_MODEL
        else:
            client = get_openai_client()
            model = settings.OPENAI_MODEL

        with client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=1024,
            stream=True,
        ) as stream:
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
    except Exception as e:
        # Fallback to demo response for streaming
        print(f"[AI Engine] Streaming API call failed: {e}")
        demo_result = _ask_demo(request)
        yield demo_result["answer"]


# ─── Demo/Fallback Mode ───────────────────────────────────────────────────────
def _ask_demo(request: AssistRequest) -> dict:
    """
    Fallback demo response when API is unavailable.
    Useful for development and testing.
    """
    demo_responses = {
        "joke": "Why did the programmer go broke? Because he used up all his cache! 😄",
        "hello": "Hello! I'm Nexora AI, your context-aware assistant. I'm currently running in demo mode. To enable real AI responses, please configure your API credentials in the .env file.",
        "how are you": "I'm functioning perfectly! Currently in demo mode, but ready to provide real AI assistance once you set up your API keys.",
        "test": "This is a demo response. The backend is working and ready to connect to an AI provider!",
    }
    
    query = request.query.lower()
    
    # Simple keyword matching for demo
    answer = None
    for key, response in demo_responses.items():
        if key in query:
            answer = response
            break
    
    if not answer and (
        "integrated application" in query
        or "analyze the current issue" in query
        or "analyze the currently open work" in query
        or "live app" in query
    ):
        context_bits = [
            f"I can currently see {request.context.app_name} on {request.context.platform}.",
            f"The active window looks like '{request.context.window_title}'.",
        ]

        if request.context.clipboard_content:
            clipped = request.context.clipboard_content[:180]
            context_bits.append(f"Clipboard hint: {clipped}")

        answer = (
            "Demo mode: Nexora captured live app context successfully. "
            + " ".join(context_bits)
            + " To get a full AI diagnosis from this live context, configure your API credentials in the .env file."
        )

    if not answer:
        answer = f"Demo mode: I received your query '{request.query}'. To get real AI responses, please configure your API credentials (OPENAI_API_KEY or NVIDIA_API_KEY) in the .env file."
    
    return {
        "answer": answer,
        "model": "nexora-ai-demo",
        "tokens_used": 0,
    }
