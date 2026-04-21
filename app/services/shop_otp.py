import random
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.shop import Shop
from app.models.shop_otp import ShopOtp


def generate_shop_otp(db: Session, shop: Shop) -> ShopOtp:
    code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    otp = ShopOtp(shop_id=shop.id, code=code, expires_at=expires_at, is_verified=False)
    db.add(otp)
    db.commit()
    db.refresh(otp)
    return otp


def verify_shop_otp(db: Session, shop: Shop, code: str) -> bool:
    now = datetime.now(timezone.utc)
    otp = db.scalar(
        select(ShopOtp)
        .where(
            ShopOtp.shop_id == shop.id,
            ShopOtp.code == code,
            ShopOtp.is_verified.is_(False),
            ShopOtp.expires_at >= now,
        )
        .order_by(ShopOtp.id.desc())
    )
    if not otp:
        return False

    otp.is_verified = True
    shop.is_otp_verified = True
    db.add(otp)
    db.add(shop)
    db.commit()
    return True

