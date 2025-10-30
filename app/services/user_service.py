from __future__ import annotations

import secrets
from typing import Optional

from sqlalchemy.orm import Session

from app.core.security import get_password_hash, verify_password
from app.core.time_utils import now_shanghai
from app.models import User
from app.schemas import UserCreate


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()


def get_user_by_api_key(db: Session, api_key: str) -> Optional[User]:
    return db.query(User).filter(User.api_key == api_key).first()


def create_user(db: Session, user_in: UserCreate, is_admin: bool = False) -> User:
    user = User(
        username=user_in.username,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        is_active=True,
        is_admin=is_admin,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    user = get_user_by_username(db, username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def generate_api_key(db: Session, user: User) -> str:
    api_key = secrets.token_urlsafe(32)
    user.api_key = api_key
    db.add(user)
    db.commit()
    db.refresh(user)
    return api_key


def ensure_default_admin(db: Session) -> User:
    admin = db.query(User).filter(User.is_admin.is_(True)).first()
    if admin:
        return admin
    default_admin = User(
        username="admin",
        full_name="System Administrator",
        hashed_password=get_password_hash("admin123"),
        is_active=True,
        is_admin=True,
        created_at=now_shanghai(),
    )
    db.add(default_admin)
    db.commit()
    db.refresh(default_admin)
    return default_admin
