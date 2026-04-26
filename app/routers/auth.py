from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.user import UserCreate, UserRead
from app.core.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

ALLOWED_ROLES = {"customer", "shop_owner", "admin"}


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)) -> User:
    logger.info(f"Register attempt for email = {payload.email}")

    role = payload.role.strip()

    if role not in ALLOWED_ROLES:
        logger.warning(f"Invalid role attempt: {role}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Allowed: {sorted(ALLOWED_ROLES)}",
        )

    existing = db.scalar(select(User).where(User.email == payload.email.lower()))
    if existing:
        logger.warning(f"Duplicate registeration attempt: {payload.email}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email already registered"
        )

    user = User(
        name=payload.name,
        email=payload.email.lower(),
        password=hash_password(payload.password),
        role=role,
        mobile=payload.mobile,
        address=payload.address,
        city=payload.city,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    logger.info(f"User registered successfully: id = {user.id}, role = {user.role}")
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    logger.info(f"Login attempt for email={payload.email}")

    user = db.scalar(select(User).where(User.email == payload.email.lower()))

    if not user or not verify_password(payload.password, user.password):
        logger.warning(f"Invalid login attempt for email={payload.email}")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if user.is_blocked:
        logger.warning(f"Blocked user login attempt: user_id={user.id}")
        raise HTTPException(status_code=403, detail="User account is blocked")

    if payload.role and payload.role.strip() != user.role:
        logger.warning(f"Role mismatch for user_id={user.id}")
        raise HTTPException(status_code=403, detail="Role mismatch")

    token = create_access_token(subject=str(user.id), role=user.role)

    logger.info(f"Login successful: user_id={user.id}, role={user.role}")

    return TokenResponse(access_token=token, role=user.role)
