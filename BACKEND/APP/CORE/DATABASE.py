"""
DATABASE CONFIGURATION

This module creates the database connection for CivicLens AI.
Currently it uses SQLite for local development.
It can later be switched to PostgreSQL without changing other files.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from APP.CORE.CONFIG import settings

DATABASE_URL = settings.DATABASE_URL

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    """
    Dependency used in FastAPI routes.
    Provides a database session and closes it automatically.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()