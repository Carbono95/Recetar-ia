"""Add source column to shopping_list

Revision ID: b2f4a1c9d3e7
Revises: 9f70dc295314
Create Date: 2026-08-08 21:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2f4a1c9d3e7'
down_revision: Union[str, None] = '9f70dc295314'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # server_default para que las filas existentes queden como 'recipe'.
    op.add_column(
        'shopping_list',
        sa.Column('source', sa.String(length=20), nullable=False, server_default='recipe'),
    )


def downgrade() -> None:
    op.drop_column('shopping_list', 'source')
