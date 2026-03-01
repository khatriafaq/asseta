from decimal import Decimal

from sqlmodel import Session

from app.models.fund import Fund
from app.models.institution import Institution


def _seed_fund(session: Session) -> int:
    """Create a test fund and return its ID."""
    inst = Institution(name="Test AMC", institution_type="AMC")
    session.add(inst)
    session.commit()
    session.refresh(inst)

    fund = Fund(
        scheme_key="Test Category | Test Fund",
        name="Test Fund",
        fund_type="Equity Fund",
        institution_id=inst.id,
        current_nav=Decimal("25.0000"),
        is_shariah_compliant=True,
    )
    session.add(fund)
    session.commit()
    session.refresh(fund)
    return fund.id


def _create_portfolio(client, auth_headers) -> int:
    response = client.post(
        "/api/v1/portfolios/",
        json={"name": "Test Portfolio"},
        headers=auth_headers,
    )
    return response.json()["id"]


def test_create_transaction(client, session, auth_headers):
    fund_id = _seed_fund(session)
    pid = _create_portfolio(client, auth_headers)

    response = client.post(
        f"/api/v1/portfolios/{pid}/transactions/",
        json={
            "fund_id": fund_id,
            "date": "2025-12-01",
            "transaction_type": "Deposit",
            "units": "100.0000",
            "price_per_unit": "25.0000",
            "amount": "2500.00",
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["fund_id"] == fund_id
    assert data["transaction_type"] == "Deposit"
    assert Decimal(data["amount"]) == Decimal("2500.00")
    assert Decimal(data["signed_amount"]) == Decimal("2500.00")
    assert Decimal(data["xirr_cashflow"]) == Decimal("-2500.00")


def test_list_transactions(client, session, auth_headers):
    fund_id = _seed_fund(session)
    pid = _create_portfolio(client, auth_headers)

    client.post(
        f"/api/v1/portfolios/{pid}/transactions/",
        json={
            "fund_id": fund_id,
            "date": "2025-12-01",
            "transaction_type": "Deposit",
            "units": "100.0",
            "price_per_unit": "25.0",
            "amount": "2500.0",
        },
        headers=auth_headers,
    )
    response = client.get(
        f"/api/v1/portfolios/{pid}/transactions/",
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_delete_transaction(client, session, auth_headers):
    fund_id = _seed_fund(session)
    pid = _create_portfolio(client, auth_headers)

    create = client.post(
        f"/api/v1/portfolios/{pid}/transactions/",
        json={
            "fund_id": fund_id,
            "date": "2025-12-01",
            "transaction_type": "Deposit",
            "units": "100.0",
            "price_per_unit": "25.0",
            "amount": "2500.0",
        },
        headers=auth_headers,
    )
    txn_id = create.json()["id"]

    response = client.delete(
        f"/api/v1/portfolios/{pid}/transactions/{txn_id}",
        headers=auth_headers,
    )
    assert response.status_code == 204


def test_holdings_created_after_transaction(client, session, auth_headers):
    fund_id = _seed_fund(session)
    pid = _create_portfolio(client, auth_headers)

    client.post(
        f"/api/v1/portfolios/{pid}/transactions/",
        json={
            "fund_id": fund_id,
            "date": "2025-12-01",
            "transaction_type": "Deposit",
            "units": "100.0",
            "price_per_unit": "25.0",
            "amount": "2500.0",
        },
        headers=auth_headers,
    )

    response = client.get(
        f"/api/v1/portfolios/{pid}/holdings/",
        headers=auth_headers,
    )
    assert response.status_code == 200
    holdings = response.json()
    assert len(holdings) == 1
    assert holdings[0]["fund_id"] == fund_id
    assert Decimal(holdings[0]["units_held"]) == Decimal("100.0")


def test_bulk_create_transactions(client, session, auth_headers):
    fund_id = _seed_fund(session)
    pid = _create_portfolio(client, auth_headers)

    response = client.post(
        f"/api/v1/portfolios/{pid}/transactions/bulk",
        json=[
            {
                "fund_id": fund_id,
                "date": "2025-12-01",
                "transaction_type": "Deposit",
                "units": "100.0",
                "price_per_unit": "25.0",
                "amount": "2500.0",
            },
            {
                "fund_id": fund_id,
                "date": "2025-12-15",
                "transaction_type": "Deposit",
                "units": "50.0",
                "price_per_unit": "26.0",
                "amount": "1300.0",
            },
        ],
        headers=auth_headers,
    )
    assert response.status_code == 201
    assert len(response.json()) == 2


def test_profit_adds_to_value_not_invested(client, session, auth_headers):
    """Profit on deposit should increase current_value but NOT total_invested."""
    fund_id = _seed_fund(session)
    pid = _create_portfolio(client, auth_headers)

    # Deposit PKR 2500 (100 units @ 25)
    client.post(
        f"/api/v1/portfolios/{pid}/transactions/",
        json={
            "fund_id": fund_id,
            "date": "2025-12-01",
            "transaction_type": "Deposit",
            "units": "100.0",
            "price_per_unit": "25.0",
            "amount": "2500.0",
        },
        headers=auth_headers,
    )

    # Record profit of PKR 500 (0 units — cash profit)
    client.post(
        f"/api/v1/portfolios/{pid}/transactions/",
        json={
            "fund_id": fund_id,
            "date": "2025-12-31",
            "transaction_type": "Profit",
            "units": "0",
            "price_per_unit": "0",
            "amount": "500.0",
        },
        headers=auth_headers,
    )

    response = client.get(
        f"/api/v1/portfolios/{pid}/holdings/",
        headers=auth_headers,
    )
    assert response.status_code == 200
    holdings = response.json()
    assert len(holdings) == 1

    h = holdings[0]
    assert float(h["total_invested"]) == 2500.0  # only deposit
    assert float(h["current_value"]) == 3000.0   # 100*25 NAV + 500 profit
    assert float(h["gain_loss"]) == 500.0         # profit shows as gain
