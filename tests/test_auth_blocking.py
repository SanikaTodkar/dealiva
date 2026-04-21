from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.base import Base
from app.models.user import User
from app.routers.auth import login
from app.schemas.auth import LoginRequest


def _test_session() -> Session:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    return Session(bind=engine)


def test_blocked_user_login_is_rejected() -> None:
    db = _test_session()
    blocked_user = User(
        name="Blocked User",
        email="blocked@example.com",
        password=hash_password("secret123"),
        role="customer",
        mobile="9876543210",
        address="Pune Camp Road",
        city="Pune",
        is_blocked=True,
    )
    db.add(blocked_user)
    db.commit()

    payload = LoginRequest(
        email="blocked@example.com", password="secret123", role="customer"
    )

    try:
        login(payload=payload, db=db)
        assert False, "Expected blocked login to fail"
    except HTTPException as exc:
        assert exc.status_code == 403

    db.close()

