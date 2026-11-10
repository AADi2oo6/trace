"""TRACE Database Engine and Session Management."""

import os
from collections.abc import Generator
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session

from app.core.config import settings

# Ensure data directory exists if using local sqlite path
db_url = settings.database_url
if db_url.startswith("sqlite:///"):
    sqlite_path = db_url.replace("sqlite:///", "")
    db_file = Path(sqlite_path)
    # If it's a relative or absolute file path, create parent folder
    if not sqlite_path.startswith(":memory:"):
        db_file.parent.mkdir(parents=True, exist_ok=True)

# Create engine
# connect_args={"check_same_thread": False} is required for SQLite with FastAPI multi-threading
connect_args = {"check_same_thread": False} if "sqlite" in db_url else {}
engine = create_engine(db_url, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Dependency that yields a database session and safely closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Initialize database tables."""
    Base.metadata.create_all(bind=engine)
