from fastapi import HTTPException, status
from app.core.enums import OrderStatus

ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    OrderStatus.PLACED: {OrderStatus.PAID},
    OrderStatus.PAID: {OrderStatus.READY},
    OrderStatus.READY: {OrderStatus.COMPLETED},
    OrderStatus.COMPLETED: set(),
}

def can_transition(current_status: OrderStatus, new_status: OrderStatus) -> bool:
    allowed = ALLOWED_TRANSITIONS.get(current_status, set())
    return new_status in allowed


def enforce_transition(current_status: OrderStatus, new_status: OrderStatus) -> None:
    if not can_transition(current_status, new_status):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Invalid status transition: '{current_status}' -> '{new_status}'. "
                f"Allowed next: {sorted(ALLOWED_TRANSITIONS.get(current_status, set()))}"
            ),
        )
    