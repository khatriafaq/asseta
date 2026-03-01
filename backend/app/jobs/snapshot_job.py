"""Monthly snapshot job — runs on the 1st of each month.

NAV values for the last day of month N are published by MUFAP on day N+1.
The NAV update job (06:00 UTC) and daily value job (06:05 UTC) both run first,
so by 06:10 UTC all holdings reflect the previous month's final prices.
This job then freezes that state as the end-of-month snapshot.
"""

import logging
from datetime import date, timedelta

from sqlmodel import Session, select

from app.database import engine
from app.models.portfolio import Portfolio
from app.services.snapshot_service import SnapshotService

logger = logging.getLogger(__name__)


def run_monthly_snapshots():
    """Generate end-of-month snapshots for all portfolios using last month's final NAV."""
    # Last day of the previous month
    last_day_of_prev_month = date.today().replace(day=1) - timedelta(days=1)
    month_label = last_day_of_prev_month.strftime("%B %Y")

    logger.info(f"Starting monthly snapshot job for {month_label}")
    with Session(engine) as session:
        portfolios = list(session.exec(select(Portfolio)).all())
        service = SnapshotService(session)
        recorded = 0
        for portfolio in portfolios:
            try:
                service.generate_snapshot(portfolio.id, target_date=last_day_of_prev_month)
                recorded += 1
            except Exception as e:
                logger.error(f"Failed to snapshot portfolio {portfolio.id} for {month_label}: {e}")
        logger.info(f"Monthly snapshot complete: {recorded}/{len(portfolios)} portfolios for {month_label}")
