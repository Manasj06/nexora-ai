"""
Nexora AI — FastAPI Backend
Main server entry point
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import assist, context, health
from config import settings

# ─── App Init ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Nexora AI Backend",
    description="Context-aware AI assistant backend",
    version="1.0.0",
)

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
