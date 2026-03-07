from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.deps import require_customer
from app.db.session import get_db
from app.models.rating import Rating
from app.models.shop import Shop
from app.models.user import User
from app.schemas.rating import RatingCreate, RatingRead, ShopRatingsResponse, ShopRatingItem


router = APIRouter(prefix="/ratings", tags=["ratings"])


@router.post("", response_model=RatingRead, status_code=status.HTTP_200_OK)
def create_or_update_rating(
    payload: RatingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
) -> RatingRead:
    shop = db.get(Shop, payload.shop_id)
    if not shop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Shop not found"
        )

    existing = db.scalar(
        select(Rating).where(
            Rating.user_id == current_user.id, Rating.shop_id == payload.shop_id
        )
    )

    if existing:
        existing.rating = payload.rating
        existing.feedback = payload.feedback
        db.add(existing)
        db.commit()
        db.refresh(existing)
        rating_obj = existing
    else:
        rating_obj = Rating(
            user_id=current_user.id,
            shop_id=payload.shop_id,
            rating=payload.rating,
            feedback=payload.feedback,
        )
        db.add(rating_obj)
        db.commit()
        db.refresh(rating_obj)

    return RatingRead(
        id=rating_obj.id,
        shop_id=rating_obj.shop_id,
        user_id=rating_obj.user_id,
        user_name=current_user.name,
        rating=rating_obj.rating,
        feedback=rating_obj.feedback,
        created_at=rating_obj.created_at,
    )

