from datetime import date
from decimal import Decimal, ROUND_HALF_UP


def calculate_discount(expiry_date: date | None, price: Decimal) -> tuple[int, Decimal]:
    """
    Returns (discount_percent, final_price) according to PRD rules.
    """
    if expiry_date is None:
        return 0, price

    today = date.today()
    days_left = (expiry_date - today).days

    if days_left < 0:
        # Expired – caller should hide the product
        return 0, price

    if days_left > 30:
        discount = 0
    elif 15 <= days_left <= 30:
        discount = 10
    elif 7 <= days_left <= 14:
        discount = 25
    elif 3 <= days_left <= 6:
        discount = 40
    elif 1 <= days_left <= 2:
        discount = 60
    else:
        discount = 0

    factor = Decimal("1") - (Decimal(discount) / Decimal("100"))
    final_price = (price * factor).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    return discount, final_price

