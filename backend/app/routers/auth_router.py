from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import select

from app.auth import create_access_token, create_refresh_token, decode_token
from app.config import get_settings
from app.database import SessionDep
from app.dependencies import CurrentUserDep
from app.models.user import User, UserCreate, UserRead, UserUpdate
from app.security import hash_password, verify_password

settings = get_settings()
router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/signup", response_model=UserRead, status_code=201)
def signup(user_data: UserCreate, session: SessionDep):
    existing = session.exec(select(User).where(User.email == user_data.email)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    user = User(
        name=user_data.name,
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.post("/login")
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    session: SessionDep,
):
    user = session.exec(select(User).where(User.email == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )
    refresh_token = create_refresh_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/refresh")
def refresh(token: str, session: SessionDep):
    payload = decode_token(token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )
    email = payload.get("sub")
    user = session.exec(select(User).where(User.email == email)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserRead)
def read_me(current_user: CurrentUserDep):
    return _user_to_read(current_user)


@router.patch("/me", response_model=UserRead)
def update_me(data: UserUpdate, current_user: CurrentUserDep, session: SessionDep):
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            setattr(current_user, key, value)
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return _user_to_read(current_user)


def _user_to_read(user: User) -> UserRead:
    """Convert User to UserRead with masked Gemini API key."""
    masked = None
    if user.gemini_api_key:
        key = user.gemini_api_key
        masked = f"{key[:4]}...{key[-4:]}" if len(key) > 8 else "****"
    return UserRead(
        id=user.id,  # type: ignore[arg-type]
        name=user.name,
        email=user.email,
        created_at=user.created_at,
        date_of_birth=user.date_of_birth,
        risk_tolerance=user.risk_tolerance,
        investment_horizon_years=user.investment_horizon_years,
        monthly_income=user.monthly_income,
        gemini_api_key_masked=masked,
    )
