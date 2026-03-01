from typing import Annotated

from fastapi import Depends
from sqlmodel import Session, SQLModel, create_engine

from app.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.database_url,
    echo=False,
    pool_pre_ping=True,   # Re-verify connections before use (handles Supabase idle drops)
    pool_size=5,          # Keep small — Supabase free tier has a 60-connection cap
    max_overflow=5,       # Allow burst up to 10 total
    pool_recycle=300,     # Recycle connections every 5 min to avoid stale Supabase sessions
)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_session)]
