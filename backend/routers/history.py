"""
Nexora AI — Encrypted History Router
Stores and retrieves per-user encrypted conversation records.
"""

from fastapi import APIRouter, Depends

from auth_store import clear_history_entries, list_history_entries, require_authenticated_user, save_history_entry
from schemas import HistoryEntryCreate, HistoryEntryResponse

router = APIRouter()


@router.get("/", response_model=list[HistoryEntryResponse])
async def get_history(user: dict = Depends(require_authenticated_user)):
    return [HistoryEntryResponse(**entry) for entry in list_history_entries(user["id"])]


@router.post("/", response_model=HistoryEntryResponse)
async def create_history_entry(
    request: HistoryEntryCreate,
    user: dict = Depends(require_authenticated_user),
):
    entry = save_history_entry(
        user_id=user["id"],
        encrypted_payload=request.encrypted_payload,
        iv=request.iv,
    )
    return HistoryEntryResponse(**entry)


@router.delete("/")
async def clear_history(user: dict = Depends(require_authenticated_user)):
    clear_history_entries(user["id"])
    return {"ok": True}
