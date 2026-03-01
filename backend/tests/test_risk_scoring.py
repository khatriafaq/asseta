import datetime as dt
from decimal import Decimal

from sqlmodel import Session, select

from app.models.fund import Fund
from app.models.holding import PortfolioHolding
from app.models.institution import Institution
from app.models.manual_asset import ManualAsset
from app.models.portfolio import Portfolio
from app.models.target_allocation import TargetAllocation
from app.models.user import RiskTolerance, User
from app.security import hash_password
from app.services.risk_scoring_service import RiskScoringService


def _create_user(session: Session, **kwargs) -> User:
    defaults = dict(
        email="test@example.com",
        hashed_password=hash_password("testpass"),
        name="Test User",
    )
    defaults.update(kwargs)
    user = User(**defaults)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def _create_portfolio(session: Session, user_id: int) -> Portfolio:
    portfolio = Portfolio(user_id=user_id, name="My Portfolio")
    session.add(portfolio)
    session.commit()
    session.refresh(portfolio)
    return portfolio


def _create_holding(
    session: Session, portfolio_id: int, fund_id: int, current_value: Decimal
) -> PortfolioHolding:
    h = PortfolioHolding(
        portfolio_id=portfolio_id,
        fund_id=fund_id,
        units_held=Decimal("100"),
        total_invested=current_value,
        avg_cost_per_unit=current_value / 100,
        current_value=current_value,
        gain_loss=Decimal("0"),
        return_pct=Decimal("0"),
        updated_at=dt.datetime.now(dt.timezone.utc),
    )
    session.add(h)
    session.commit()
    session.refresh(h)
    return h


def test_empty_portfolio_score(session: Session):
    user = _create_user(session)
    portfolio = _create_portfolio(session, user.id)

    score = RiskScoringService(session).calculate_risk_score(portfolio.id, user)
    assert score.health_score == 50
    assert score.diversification_grade == "N/A"


def test_diversified_portfolio_high_score(session: Session):
    user = _create_user(session, date_of_birth=dt.date(1995, 1, 1))
    portfolio = _create_portfolio(session, user.id)

    inst = Institution(name="Test AMC", institution_type="AMC")
    session.add(inst)
    session.commit()
    session.refresh(inst)

    # Create 4 fund types — should get grade A
    for ft in ["Equity Fund", "Debt Fund", "Money Market Fund", "Savings Account"]:
        fund = Fund(
            scheme_key=f"key_{ft}",
            name=f"Test {ft}",
            fund_type=ft,
            institution_id=inst.id,
        )
        session.add(fund)
        session.commit()
        session.refresh(fund)
        _create_holding(session, portfolio.id, fund.id, Decimal("25000"))

    # Set targets
    for ft, pct in [
        ("Equity Fund", "0.25"),
        ("Debt Fund", "0.25"),
        ("Money Market Fund", "0.25"),
        ("Savings Account", "0.25"),
    ]:
        t = TargetAllocation(portfolio_id=portfolio.id, asset_type=ft, target_pct=Decimal(pct))
        session.add(t)
    session.commit()

    # Spread funds across 4 institutions (one per fund, 25% each)
    inst2 = Institution(name="Test AMC 2", institution_type="AMC")
    inst3 = Institution(name="Test Bank", institution_type="Bank")
    inst4 = Institution(name="Test AMC 3", institution_type="AMC")
    session.add_all([inst2, inst3, inst4])
    session.commit()
    session.refresh(inst2)
    session.refresh(inst3)
    session.refresh(inst4)

    debt_fund = session.exec(select(Fund).where(Fund.scheme_key == "key_Debt Fund")).one()
    mm_fund = session.exec(select(Fund).where(Fund.scheme_key == "key_Money Market Fund")).one()
    savings_fund = session.exec(
        select(Fund).where(Fund.scheme_key == "key_Savings Account")
    ).one()
    debt_fund.institution_id = inst2.id
    mm_fund.institution_id = inst3.id
    savings_fund.institution_id = inst4.id
    session.add_all([debt_fund, mm_fund, savings_fund])
    session.commit()

    score = RiskScoringService(session).calculate_risk_score(portfolio.id, user)
    assert score.health_score >= 80
    assert score.diversification_grade == "A"
    assert score.concentration_warnings == []
    assert score.age_appropriate is True


def test_concentrated_portfolio_warnings(session: Session):
    user = _create_user(session)
    portfolio = _create_portfolio(session, user.id)

    fund = Fund(scheme_key="key_eq", name="Big Equity Fund", fund_type="Equity Fund")
    session.add(fund)
    session.commit()
    session.refresh(fund)

    # Single fund = 100% concentration
    _create_holding(session, portfolio.id, fund.id, Decimal("100000"))

    score = RiskScoringService(session).calculate_risk_score(portfolio.id, user)
    assert score.diversification_grade == "D"
    assert len(score.concentration_warnings) > 0
    assert any(w.entity == "Big Equity Fund" for w in score.concentration_warnings)
    assert score.health_score < 70


def test_age_inappropriate_equity(session: Session):
    # User age 60 — max equity should be 40%
    user = _create_user(session, date_of_birth=dt.date(1966, 1, 1))
    portfolio = _create_portfolio(session, user.id)

    inst = Institution(name="AMC1", institution_type="AMC")
    session.add(inst)
    session.commit()
    session.refresh(inst)

    equity_fund = Fund(
        scheme_key="eq1", name="Equity1", fund_type="Equity Fund", institution_id=inst.id
    )
    debt_fund = Fund(
        scheme_key="dt1", name="Debt1", fund_type="Debt Fund", institution_id=inst.id
    )
    session.add_all([equity_fund, debt_fund])
    session.commit()
    session.refresh(equity_fund)
    session.refresh(debt_fund)

    # 80% equity, 20% debt
    _create_holding(session, portfolio.id, equity_fund.id, Decimal("80000"))
    _create_holding(session, portfolio.id, debt_fund.id, Decimal("20000"))

    score = RiskScoringService(session).calculate_risk_score(portfolio.id, user)
    assert score.age_appropriate is False
    assert "exceeds recommended" in (score.age_appropriate_message or "")


def test_no_targets_set_risk_factor(session: Session):
    user = _create_user(session)
    portfolio = _create_portfolio(session, user.id)

    fund = Fund(scheme_key="k1", name="F1", fund_type="Equity Fund")
    session.add(fund)
    session.commit()
    session.refresh(fund)
    _create_holding(session, portfolio.id, fund.id, Decimal("50000"))

    score = RiskScoringService(session).calculate_risk_score(portfolio.id, user)
    assert any("target allocation" in f.lower() for f in score.risk_factors)
