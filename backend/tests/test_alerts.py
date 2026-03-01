from decimal import Decimal

from sqlmodel import Session

from app.models.fund import Fund


def _seed_fund(session: Session) -> int:
    fund = Fund(
        scheme_key="Test | Alert Fund",
        name="Alert Fund",
        fund_type="Equity Fund",
        current_nav=Decimal("25.0000"),
        is_shariah_compliant=True,
    )
    session.add(fund)
    session.commit()
    session.refresh(fund)
    return fund.id


def test_create_alert(client, session, auth_headers):
    fund_id = _seed_fund(session)
    response = client.post(
        "/api/v1/alerts/",
        json={"fund_id": fund_id, "alert_type": "nav_above", "threshold": "30.0"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["alert_type"] == "nav_above"
    assert data["is_active"] is True


def test_list_alerts(client, session, auth_headers):
    fund_id = _seed_fund(session)
    client.post(
        "/api/v1/alerts/",
        json={"fund_id": fund_id, "alert_type": "nav_above", "threshold": "30.0"},
        headers=auth_headers,
    )
    response = client.get("/api/v1/alerts/", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_delete_alert(client, session, auth_headers):
    fund_id = _seed_fund(session)
    create = client.post(
        "/api/v1/alerts/",
        json={"fund_id": fund_id, "alert_type": "nav_below", "threshold": "20.0"},
        headers=auth_headers,
    )
    alert_id = create.json()["id"]
    response = client.delete(f"/api/v1/alerts/{alert_id}", headers=auth_headers)
    assert response.status_code == 204

    response = client.get("/api/v1/alerts/", headers=auth_headers)
    assert len(response.json()) == 0
