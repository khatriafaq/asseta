"""Daily NAV update job using APScheduler."""

import logging

from sqlmodel import Session

from app.database import engine
from app.scrapers.mufap_scraper import update_fund_navs

logger = logging.getLogger(__name__)


async def run_nav_update():
    """Async NAV update job — runs inside the existing asyncio event loop."""
    logger.info("Starting daily NAV update job")
    with Session(engine) as session:
        try:
            result = await update_fund_navs(session)
            logger.info(f"NAV update complete: {result}")
        except Exception as e:
            logger.error(f"NAV update failed: {e}")
