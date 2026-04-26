from enum import Enum

class UserRole(str, Enum):
    CUSTOMER = "customer"
    SHOP_OWNER = "shop_owner"
    ADMIN = "admin"


class OrderStatus(str, Enum):
    PLACED = "Placed"
    PAID = "Paid"
    READY = "Ready for Pickup"
    COMPLETED = "Completed"