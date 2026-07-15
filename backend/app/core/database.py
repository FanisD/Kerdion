from typing import AsyncGenerator
from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

# ==========================================
# 1. Database Engine
# ==========================================
# The engine manages the connection pool to PostgreSQL.
# We turn echo=True in development to see the actual SQL queries printed in the terminal.
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=(settings.ENVIRONMENT == "development"),
    future=True,
    pool_pre_ping=True # Tests connections before using them to prevent dropouts
)

# ==========================================
# 2. Session Factory
# ==========================================
# This creates new async sessions for our database transactions.
# expire_on_commit=False prevents SQLAlchemy from blocking async operations after a commit.
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# ==========================================
# 3. Base Model Class
# ==========================================
# All of our database models (tables) will inherit from this base class.
class Base(DeclarativeBase):
    pass

# ==========================================
# 4. Dependency Injection
# ==========================================
# This function is injected into our FastAPI routes. It gives each user request 
# its own database session and automatically closes it when the request is done.
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    # Quick connectivity check: confirm we can run a trivial query before
    # handing a session to the route handler. If the DB is unreachable,
    # raise a 503 so clients get a clear error instead of an internal 500.
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception as exc:  # pragma: no cover - hard to hit in CI
        raise HTTPException(status_code=503, detail=f"Database unavailable: {exc}")

    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()