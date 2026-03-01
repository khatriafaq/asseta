"""Daily portfolio value recording job using APScheduler."""

import logging

from sqlmodel import Session, select

from app.database import engine
from app.models.portfolio import Portfolio
from app.services.daily_value_service import DailyValueService

logger = logging.getLogger(__name__)


def record_all_daily_values():
    """Record daily portfolio values for all portfolios."""
    logger.info("Starting daily portfolio value recording job")
    with Session(engine) as session:
        portfolios = list(session.exec(select(Portfolio)).all())
        service = DailyValueService(session)
        recorded = 0
        for portfolio in portfolios:
            try:
                service.record_daily_value(portfolio.id)
                recorded += 1
            except Exception as e:
                logger.error(f"Failed to record daily value for portfolio {portfolio.id}: {e}")
        logger.info(f"Daily value recording complete: {recorded}/{len(portfolios)} portfolios")
