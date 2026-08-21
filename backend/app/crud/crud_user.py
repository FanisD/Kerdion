from typing import Optional
import secrets

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    """Read a single user by their email address."""
    result = await db.execute(select(User).where(User.email == email))
    return result.scalars().first()


async def create_user(db: AsyncSession, user_in: UserCreate) -> User:
    """Insert a new user row with a hashed password and a verification token."""
    token = secrets.token_urlsafe(32)
    user = User(
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        occupation=user_in.occupation,
        verification_token=token,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(db: AsyncSession, email: str, password: str) -> Optional[User]:
    """Return the user if the email exists and the password matches, else None."""
    user = await get_user_by_email(db, email)
    if user is None or not verify_password(password, user.hashed_password):
        return None
    return user


async def verify_user_by_token(db: AsyncSession, token: str) -> Optional[User]:
    """Find a user by verification token, mark as verified, and clear the token."""
    result = await db.execute(
        select(User).where(User.verification_token == token)
    )
    user = result.scalars().first()
    if user is None:
        return None
    user.is_verified = True
    user.verification_token = None
    await db.commit()
    await db.refresh(user)
    return user


async def update_user(db: AsyncSession, user: User, updates: UserUpdate) -> User:
    """Apply partial updates to a user record. Returns (user, email_changed)."""
    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    await db.commit()
    await db.refresh(user)
    return user


async def delete_user(db: AsyncSession, user: User) -> None:
    """Permanently delete a user record."""
    await db.delete(user)
    await db.commit()
