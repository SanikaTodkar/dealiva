"""add user profile fields and shop otp

Revision ID: 0002_user_profile_and_shop_otp
Revises: 0001_init_schema
Create Date: 2026-04-15 00:00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "0002_user_profile_and_shop_otp"
down_revision: Union[str, None] = "0001_init_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("mobile", sa.String(length=20), nullable=True))
    op.add_column("users", sa.Column("address", sa.String(length=500), nullable=True))
    op.add_column(
        "shops",
        sa.Column(
            "is_otp_verified",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )

    op.create_table(
        "shop_otps",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("shop_id", sa.Integer(), nullable=False),
        sa.Column("code", sa.String(length=6), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "is_verified",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(["shop_id"], ["shops.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_shop_otps_id"), "shop_otps", ["id"], unique=False)
    op.create_index(op.f("ix_shop_otps_shop_id"), "shop_otps", ["shop_id"], unique=False)

    op.execute("UPDATE users SET mobile = '0000000000' WHERE mobile IS NULL")
    op.execute("UPDATE users SET address = 'Not Provided' WHERE address IS NULL")

    op.alter_column("users", "mobile", nullable=False)
    op.alter_column("users", "address", nullable=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_shop_otps_shop_id"), table_name="shop_otps")
    op.drop_index(op.f("ix_shop_otps_id"), table_name="shop_otps")
    op.drop_table("shop_otps")
    op.drop_column("shops", "is_otp_verified")
    op.drop_column("users", "address")
    op.drop_column("users", "mobile")

