from decimal import Decimal

from sqlmodel import Session

from app.models.fund import Fund
from app.models.institution import Institution


def _setup_portfolio_with_transactions(client, session, auth_headers) -> int:
    """Create a portfolio with transactions and return portfolio_id."""
    inst = Institution(name="Test AMC", institution_type="AMC")
    session.add(inst)
    session.commit()
    session.refresh(inst)

    fund = Fund(
        scheme_key="Test | Analytics Fund",
        name="Analytics Fund",
        fund_type="Equity Fund",
        institution_id=inst.id,
        current_nav=Decimal("28.0000"),
        is_shariah_compliant=True,
    )
    session.add(fund)
    session.commit()
    session.refresh(fund)

    pid = client.post(
        "/api/v1/portfolios/",
        json={"name": "Analytics Portfolio"},
        headers=auth_headers,
    ).json()["id"]

    client.post(
        f"/api/v1/portfolios/{pid}/transactions/",
        json={
            "fund_id": fund.id,
            "date": "2025-11-01",
            "transaction_type": "Deposit",
            "units": "1000.0",
            "price_per_unit": "25.0",
            "amount": "25000.0",
        },
        headers=auth_headers,
    )
    return pid


def test_portfolio_returns(client, session, auth_headers):
    pid = _setup_portfolio_with_transactions(client, session, auth_headers)
    response = client.get(
        f"/api/v1/portfolios/{pid}/analytics/returns",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert "total_invested" in data
    assert "current_value" in data
    assert "absolute_gain" in data
    assert "return_pct" in data
    # Fund NAV is 28, bought at 25, gain should be positive
    assert float(data["absolute_gain"]) > 0


def test_portfolio_summary(client, session, auth_headers):
    pid = _setup_portfolio_with_transactions(client, session, auth_headers)
    response = client.get(
        f"/api/v1/portfolios/{pid}/summary",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert float(data["total_invested"]) == 25000.0


def test_allocation_drift(client, session, auth_headers):
    pid = _setup_portfolio_with_transactions(client, session, auth_headers)
    response = client.get(
        f"/api/v1/portfolios/{pid}/analytics/allocation-drift",
        headers=auth_headers,
    )
    assert response.status_code == 200


def test_snapshot_generate(client, session, auth_headers):
    pid = _setup_portfolio_with_transactions(client, session, auth_headers)
    response = client.post(
        f"/api/v1/portfolios/{pid}/snapshots/generate",
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert float(data["total_invested"]) == 25000.0
    assert "portfolio_xirr" in data

    # List snapshots
    response = client.get(
        f"/api/v1/portfolios/{pid}/snapshots/",
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_target_allocation(client, session, auth_headers):
    pid = client.post(
        "/api/v1/portfolios/",
        json={"name": "Target Portfolio"},
        headers=auth_headers,
    ).json()["id"]

    # Set target allocation
    response = client.put(
        f"/api/v1/portfolios/{pid}/target-allocation/",
        json=[
            {"asset_type": "Equity Fund", "target_pct": "0.60"},
            {"asset_type": "Money Market Fund", "target_pct": "0.15"},
            {"asset_type": "Gold Fund", "target_pct": "0.15"},
            {"asset_type": "Savings Account", "target_pct": "0.10"},
        ],
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert len(response.json()) == 4

    # Get target allocation
    response = client.get(
        f"/api/v1/portfolios/{pid}/target-allocation/",
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert len(response.json()) == 4


def test_holdings_by_institution(client, session, auth_headers):
    pid = _setup_portfolio_with_transactions(client, session, auth_headers)
    response = client.get(
        f"/api/v1/portfolios/{pid}/holdings/by-institution",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["institution"] == "Test AMC"


def test_holdings_by_asset_type(client, session, auth_headers):
    pid = _setup_portfolio_with_transactions(client, session, auth_headers)
    response = client.get(
        f"/api/v1/portfolios/{pid}/holdings/by-asset-type",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["asset_type"] == "Equity Fund"
