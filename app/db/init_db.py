from app.db.base import Base
from app.db.session import engine

# Ensure models are imported so SQLAlchemy registers them on Base.metadata
from app import models  # noqa: F401


def init_db() -> None:
    Base.metadata.create_all(bind=engine)

