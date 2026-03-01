"""Alert evaluation job — checks alert rules against current data."""

import logging
from datetime import datetime, timezone

from sqlmodel import Session, select

from app.database import engine
from app.models.alert import AlertLog, AlertRule
from app.models.fund import Fund

logger = logging.getLogger(__name__)


def evaluate_alerts():
    """Check all active alert rules and trigger if conditions are met."""
    logger.info("Evaluating alert rules")
    with Session(engine) as session:
        rules = list(
            session.exec(select(AlertRule).where(AlertRule.is_active == True)).all()  # noqa: E712
        )

        triggered = 0
        for rule in rules:
            message = _evaluate_rule(rule, session)
            if message:
                log = AlertLog(
                    rule_id=rule.id,
                    triggered_at=datetime.now(timezone.utc),
                    message=message,
                )
                session.add(log)
                triggered += 1

        session.commit()
        logger.info(f"Alert evaluation complete: {triggered} alerts triggered")


def _evaluate_rule(rule: AlertRule, session: Session) -> str | None:
    """Evaluate a single alert rule. Returns message if triggered, None otherwise."""
    if not rule.fund_id:
        return None

    fund = session.get(Fund, rule.fund_id)
    if not fund or not fund.current_nav:
        return None

    nav = fund.current_nav
    threshold = rule.threshold

    if rule.alert_type == "nav_above" and nav > threshold:
        return f"{fund.name} NAV ({nav}) is above {threshold}"
    elif rule.alert_type == "nav_below" and nav < threshold:
        return f"{fund.name} NAV ({nav}) is below {threshold}"
    elif rule.alert_type == "return_above" and fund.return_ytd and fund.return_ytd > threshold:
        return f"{fund.name} YTD return ({fund.return_ytd}) is above {threshold}"

    return None
