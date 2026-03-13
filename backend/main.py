"""
Nexora AI — FastAPI Backend
Main server entry point
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from auth_store import init_auth_store
from routers import assist, auth, context, health, history
from config import settings

# ─── App Init ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Nexora AI Backend",
    description="Context-aware AI assistant backend",
    version="1.0.0",
)
init_auth_store()

# ─── CORS (allow Electron renderer) ──────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "file://"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ─────────────────────────────────────────────────────────────────
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(history.router, prefix="/history", tags=["History"])
app.include_router(context.router, prefix="/context", tags=["Context"])
app.include_router(assist.router, prefix="/assist", tags=["Assist"])


# ─── Run ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.BACKEND_HOST,
        port=settings.BACKEND_PORT,
        reload=False,
        log_level="info",
    )
