from fastapi import HTTPException, status


ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    "Placed": {"Paid"},
    "Paid": {"Ready for Pickup"},
    "Ready for Pickup": {"Completed"},
    "Completed": set(),
}


def can_transition(current_status: str, new_status: str) -> bool:
    allowed = ALLOWED_TRANSITIONS.get(current_status, set())
    return new_status in allowed


def enforce_transition(current_status: str, new_status: str) -> None:
    if not can_transition(current_status, new_status):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Invalid status transition: '{current_status}' -> '{new_status}'. "
                f"Allowed next: {sorted(ALLOWED_TRANSITIONS.get(current_status, set()))}"
            ),
        )

