from decimal import Decimal

from sqlmodel import Session

from app.models.fund import Fund, FundCategory
from app.models.institution import Institution


def _seed_funds(session: Session):
    """Create test funds."""
    cat = FundCategory(name="Shariah Equity", sector="Open-End Funds")
    session.add(cat)
    session.commit()
    session.refresh(cat)

    inst = Institution(name="Al Meezan", institution_type="AMC")
    session.add(inst)
    session.commit()
    session.refresh(inst)

    funds = [
        Fund(
            scheme_key="Shariah Equity | Meezan Islamic Fund",
            name="Meezan Islamic Fund",
            fund_type="Equity Fund",
            category_id=cat.id,
            institution_id=inst.id,
            current_nav=Decimal("50.1234"),
            return_ytd=Decimal("0.2500"),
            is_shariah_compliant=True,
        ),
        Fund(
            scheme_key="Shariah Equity | Meezan Growth Fund",
            name="Meezan Growth Fund",
            fund_type="Equity Fund",
            category_id=cat.id,
            institution_id=inst.id,
            current_nav=Decimal("23.6700"),
            return_ytd=Decimal("0.1800"),
            is_shariah_compliant=True,
        ),
        Fund(
            scheme_key="Conventional | ABC Fund",
            name="ABC Fund",
            fund_type="Equity Fund",
            category_id=cat.id,
            current_nav=Decimal("15.0000"),
            return_ytd=Decimal("0.1000"),
            is_shariah_compliant=False,
        ),
    ]
    for f in funds:
        session.add(f)
    session.commit()


def test_list_funds(client, session):
    _seed_funds(session)
    response = client.get("/api/v1/funds/")
    assert response.status_code == 200
    assert len(response.json()) == 3


def test_search_funds(client, session):
    _seed_funds(session)
    response = client.get("/api/v1/funds/?q=Meezan")
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_shariah_filter(client, session):
    _seed_funds(session)
    response = client.get("/api/v1/funds/shariah-compliant")
    assert response.status_code == 200
    assert len(response.json()) == 2
    for fund in response.json():
        assert fund["is_shariah_compliant"] is True


def test_get_fund(client, session):
    _seed_funds(session)
    response = client.get("/api/v1/funds/1")
    assert response.status_code == 200
    assert response.json()["name"] == "Meezan Islamic Fund"


def test_fund_not_found(client, session):
    response = client.get("/api/v1/funds/9999")
    assert response.status_code == 404


def test_top_performers(client, session):
    _seed_funds(session)
    response = client.get("/api/v1/funds/top-performers?period=return_ytd&limit=2")
    assert response.status_code == 200
    funds = response.json()
    assert len(funds) == 2
    # Should be sorted by YTD return desc
    assert Decimal(funds[0]["return_ytd"]) >= Decimal(funds[1]["return_ytd"])


def test_categories(client, session):
    _seed_funds(session)
    response = client.get("/api/v1/funds/categories")
    assert response.status_code == 200
    assert len(response.json()) >= 1
