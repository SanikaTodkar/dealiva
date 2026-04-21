from collections import Counter, defaultdict

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import require_customer
from app.db.session import get_db
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.user import User
from app.schemas.recommendation import RecommendationItem, RecommendationResponse


router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("/frequently-bought-together", response_model=RecommendationResponse)
def frequently_bought_together(
    product_id: int = Query(..., gt=0),
    limit: int = Query(default=5, ge=1, le=20),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
) -> RecommendationResponse:
    rows = db.execute(
        select(OrderItem.order_id, OrderItem.product_id)
        .join(Order, Order.id == OrderItem.order_id)
        .where(Order.status == "Completed")
    ).all()

    baskets: dict[int, set[int]] = defaultdict(set)
    for order_id, pid in rows:
        baskets[order_id].add(pid)

    pair_counts: Counter[int] = Counter()
    overall_counts: Counter[int] = Counter()
    for products in baskets.values():
        for pid in products:
            overall_counts[pid] += 1
        if product_id in products:
            for pid in products:
                if pid != product_id:
                    pair_counts[pid] += 1

    # fallback: recommend globally frequent products when pair not found
    if not pair_counts:
        for pid, count in overall_counts.items():
            if pid != product_id:
                pair_counts[pid] = count

    top_ids = [pid for pid, _count in pair_counts.most_common(limit)]
    if not top_ids:
        return RecommendationResponse(base_product_id=product_id, recommendations=[])

    products = db.scalars(select(Product).where(Product.id.in_(top_ids))).all()
    product_map = {p.id: p for p in products}

    items: list[RecommendationItem] = []
    for pid in top_ids:
        p = product_map.get(pid)
        if not p:
            continue
        items.append(
            RecommendationItem(
                product_id=pid,
                product_name=p.name,
                support_count=int(pair_counts[pid]),
            )
        )

    return RecommendationResponse(base_product_id=product_id, recommendations=items)

