"""add barista_monthly_income to fi_profile

Revision ID: a1b2c3d4e5f6
Revises: 98bd22453b63
Create Date: 2026-02-24 12:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "98bd22453b63"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "fi_profile",
        sa.Column("barista_monthly_income", sa.Numeric(precision=18, scale=2), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("fi_profile", "barista_monthly_income")
