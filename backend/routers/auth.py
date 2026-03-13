"""
Nexora AI — Authentication Router
Signup, signin, session lookup, and signout endpoints.
"""

from fastapi import APIRouter, Depends, Header

from auth_store import (
    authenticate_user,
    create_session,
    create_user,
    delete_session,
    extract_bearer_token,
    require_authenticated_user,
)
from schemas import AuthResponse, AuthUser, SignInRequest, SignUpRequest

router = APIRouter()


def _build_auth_response(user: dict) -> AuthResponse:
    session = create_session(user["id"])
    return AuthResponse(
        token=session["token"],
        expires_at=session["expires_at"],
        user=AuthUser(**user),
    )


@router.post("/signup", response_model=AuthResponse)
async def signup(request: SignUpRequest):
    user = create_user(
        display_name=request.display_name,
        email=request.email,
        password=request.password,
    )
    return _build_auth_response(user)


@router.post("/signin", response_model=AuthResponse)
async def signin(request: SignInRequest):
    user = authenticate_user(email=request.email, password=request.password)
    return _build_auth_response(user)


@router.get("/me", response_model=AuthUser)
async def get_current_user(user: dict = Depends(require_authenticated_user)):
    return AuthUser(**user)


@router.post("/signout")
async def signout(
    authorization: str | None = Header(default=None),
    user: dict = Depends(require_authenticated_user),
):
    del user
    token = extract_bearer_token(authorization)
    delete_session(token)
    return {"ok": True}
