from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User, Role
from app.schemas.user import UserCreate, UserUpdate, User as UserSchema
from app.core.security import get_password_hash, require_role
import math

router = APIRouter()


@router.get("/")
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    total = db.query(User).count()
    users = db.query(User).offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": users,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": math.ceil(total / page_size) if total > 0 else 1,
    }


@router.post("/", response_model=UserSchema, status_code=201)
def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(400, f"Email '{data.email}' already registered")

    roles = db.query(Role).filter(Role.id.in_(data.role_ids)).all()
    user = User(
        email=data.email,
        full_name=data.full_name,
        department=data.department,
        hashed_password=get_password_hash(data.password),
        roles=roles,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/roles")
def list_roles(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return db.query(Role).all()


@router.put("/{user_id}", response_model=UserSchema)
def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, f"User {user_id} not found")

    if data.role_ids is not None:
        roles = db.query(Role).filter(Role.id.in_(data.role_ids)).all()
        user.roles = roles

    for field, value in data.dict(exclude_unset=True, exclude={"role_ids"}).items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user
