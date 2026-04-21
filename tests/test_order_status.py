from fastapi import HTTPException

from app.services.order_status import can_transition, enforce_transition


def test_valid_status_transitions() -> None:
    assert can_transition("Placed", "Paid")
    assert can_transition("Paid", "Ready for Pickup")
    assert can_transition("Ready for Pickup", "Completed")


def test_invalid_status_transition_raises() -> None:
    try:
        enforce_transition("Placed", "Completed")
        assert False, "Expected HTTPException"
    except HTTPException as exc:
        assert exc.status_code == 400

