"""MUFAP daily NAV scraper.

Fetches fund NAV data from mufap.com.pk and updates the fund table.
Uses the new IndustryStatDaily page which provides a clean 18-column table.
"""

import logging
from datetime import date, datetime, time, timezone
from decimal import Decimal, InvalidOperation

import httpx
from bs4 import BeautifulSoup
from sqlalchemy import func
from sqlmodel import Session, col, select

from app.models.fund import Fund, NAVHistory

logger = logging.getLogger(__name__)

MUFAP_NAV_URL = "https://www.mufap.com.pk/Industry/IndustryStatDaily?tab=1"

# Column indices in the MUFAP table
COL_SECTOR = 0
COL_CATEGORY = 1
COL_FUND_NAME = 2
COL_RATING = 3
COL_BENCHMARK = 4
COL_VALIDITY_DATE = 5
COL_NAV = 6
COL_YTD = 7
COL_MTD = 8
COL_1D = 9
COL_15D = 10
COL_30D = 11
COL_90D = 12
COL_180D = 13
COL_270D = 14
COL_365D = 15
COL_2Y = 16
COL_3Y = 17


async def fetch_mufap_nav_page() -> str | None:
    """Fetch the MUFAP NAV returns page."""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(MUFAP_NAV_URL)
            response.raise_for_status()
            return response.text
    except httpx.HTTPError as e:
        logger.error(f"Failed to fetch MUFAP page: {e}")
        return None


def parse_mufap_html(html: str) -> list[dict]:
    """Parse MUFAP IndustryStatDaily table into fund records.

    The table (id='table_id') has 18 columns:
    Sector, Category, Fund Name, Rating, Benchmark, Validity Date,
    NAV, YTD, MTD, 1 Day, 15 Days, 30 Days, 90 Days, 180 Days,
    270 Days, 365 Days, 2 Years, 3 Years
    """
    soup = BeautifulSoup(html, "html.parser")
    table = soup.find("table", {"id": "table_id"})
    if not table:
        logger.warning("No table with id='table_id' found in MUFAP page")
        return []

    rows = table.find_all("tr")
    records = []

    for row in rows[1:]:  # Skip header row
        cells = [td.get_text(strip=True) for td in row.find_all("td")]
        if len(cells) < 7:
            continue

        fund_name = cells[COL_FUND_NAME]
        category = cells[COL_CATEGORY]
        if not fund_name or not category:
            continue

        nav = _safe_decimal(cells[COL_NAV])
        if nav is None:
            continue

        scheme_key = f"{category} | {fund_name}"

        record = {
            "name": fund_name,
            "category": category,
            "sector": cells[COL_SECTOR] if len(cells) > COL_SECTOR else None,
            "scheme_key": scheme_key,
            "nav": nav,
            "rating": cells[COL_RATING] if len(cells) > COL_RATING else None,
            "benchmark": cells[COL_BENCHMARK] if len(cells) > COL_BENCHMARK else None,
            "validity_date": cells[COL_VALIDITY_DATE] if len(cells) > COL_VALIDITY_DATE else None,
        }

        # Parse all return columns
        return_columns = [
            ("return_ytd", COL_YTD),
            ("return_mtd", COL_MTD),
            ("return_1d", COL_1D),
            ("return_15d", COL_15D),
            ("return_30d", COL_30D),
            ("return_90d", COL_90D),
            ("return_180d", COL_180D),
            ("return_270d", COL_270D),
            ("return_365d", COL_365D),
            ("return_2y", COL_2Y),
            ("return_3y", COL_3Y),
        ]
        for field, idx in return_columns:
            if len(cells) > idx:
                record[field] = _safe_decimal(cells[idx])

        records.append(record)

    return records


def _safe_decimal(value: str) -> Decimal | None:
    """Safely convert string to Decimal, stripping commas and percent signs."""
    if not value or value in ("-", "N/A", "Nil", ""):
        return None
    cleaned = value.replace(",", "").replace("%", "").strip()
    if not cleaned:
        return None
    try:
        return Decimal(cleaned)
    except InvalidOperation:
        return None


async def update_fund_navs(session: Session) -> dict:
    """Fetch latest NAVs from MUFAP and update fund records.

    Returns a summary dict with counts.
    """
    html = await fetch_mufap_nav_page()
    if not html:
        return {"scraped": 0, "matched": 0, "updated": 0, "error": "Failed to fetch MUFAP page"}

    records = parse_mufap_html(html)
    if not records:
        return {"scraped": 0, "matched": 0, "updated": 0, "error": "No records parsed from MUFAP page"}

    # Build a lookup by scheme_key for O(1) matching
    record_by_key: dict[str, dict] = {}
    record_by_name: dict[str, list[dict]] = {}
    for rec in records:
        record_by_key[rec["scheme_key"]] = rec
        record_by_name.setdefault(rec["name"], []).append(rec)

    # Load all funds from DB
    funds = session.exec(select(Fund)).all()
    updated = 0

    for fund in funds:
        record = None

        # Primary match: exact scheme_key
        if fund.scheme_key and fund.scheme_key in record_by_key:
            record = record_by_key[fund.scheme_key]
        else:
            # Fallback: match by exact name (take first match)
            matches = record_by_name.get(fund.name, [])
            if len(matches) == 1:
                record = matches[0]
            elif len(matches) > 1:
                logger.warning(
                    f"Multiple MUFAP matches for fund '{fund.name}' (id={fund.id}), skipping ambiguous match"
                )

        if not record:
            continue

        # Update NAV and return fields
        fund.current_nav = record["nav"]
        fund.nav_updated_at = datetime.now(timezone.utc)

        if record.get("rating"):
            fund.rating = record["rating"]
        if record.get("benchmark"):
            fund.benchmark = record["benchmark"]

        return_fields = [
            "return_ytd", "return_mtd", "return_1d", "return_15d",
            "return_30d", "return_90d", "return_180d", "return_270d",
            "return_365d", "return_2y", "return_3y",
        ]
        for field in return_fields:
            val = record.get(field)
            if val is not None:
                setattr(fund, field, val)

        session.add(fund)

        # Upsert NAV history: one entry per fund per calendar day
        today = date.today()
        existing_nav = session.exec(
            select(NAVHistory)
            .where(NAVHistory.fund_id == fund.id)
            .where(func.date(NAVHistory.date) == today)
        ).first()
        if existing_nav:
            existing_nav.nav = record["nav"]
            existing_nav.date = datetime.now(timezone.utc)
            session.add(existing_nav)
        else:
            session.add(NAVHistory(
                fund_id=fund.id,
                date=datetime.now(timezone.utc),
                nav=record["nav"],
            ))
        updated += 1

    session.commit()
    logger.info(f"MUFAP scrape complete: {len(records)} scraped, {updated} funds updated")
    return {"scraped": len(records), "matched": updated, "updated": updated}
