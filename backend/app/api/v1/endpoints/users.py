import secrets

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.crud.crud_user import delete_user, get_user_by_email, update_user
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate
from app.services.email_service import send_verification_email

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Return the full profile of the currently logged-in user."""
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_me(
    updates: UserUpdate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update the current user's profile. Re-triggers verification if email changes."""
    email_changed = False

    if updates.email is not None and updates.email != current_user.email:
        # Check the new email isn't already taken
        existing = await get_user_by_email(db, updates.email)
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email already exists.",
            )
        email_changed = True

    user = await update_user(db, current_user, updates)

    if email_changed:
        # Reset verification and send a new email
        token = secrets.token_urlsafe(32)
        user.is_verified = False
        user.verification_token = token
        await db.commit()
        await db.refresh(user)
        background_tasks.add_task(
            send_verification_email,
            email=user.email,
            token=token,
            first_name=user.first_name,
        )

    return user


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_me(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Permanently delete the current user's account."""
    await delete_user(db, current_user)
    return None
