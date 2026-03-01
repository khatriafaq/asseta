def test_fi_profile_not_set(client, auth_headers):
    response = client.get("/api/v1/fi/profile", headers=auth_headers)
    assert response.status_code == 200
    assert response.json() is None


def test_set_fi_profile(client, auth_headers):
    response = client.put(
        "/api/v1/fi/profile",
        json={"monthly_expenses": "200000"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert float(data["monthly_expenses"]) == 200000.0
    # FI number = 200000 * 12 / 0.04 = 60,000,000
    assert float(data["fi_number"]) == 60000000.0
    assert data["fi_strategy"] == "moderate"


def test_update_fi_profile(client, auth_headers):
    client.put(
        "/api/v1/fi/profile",
        json={"monthly_expenses": "200000"},
        headers=auth_headers,
    )
    response = client.put(
        "/api/v1/fi/profile",
        json={"monthly_expenses": "300000", "fi_strategy": "fat"},
        headers=auth_headers,
    )
    data = response.json()
    assert float(data["monthly_expenses"]) == 300000.0
    assert data["fi_strategy"] == "fat"
    # FI number = 300000 * 12 / 0.04 = 90,000,000
    assert float(data["fi_number"]) == 90000000.0


def test_fi_dashboard(client, auth_headers):
    client.put(
        "/api/v1/fi/profile",
        json={"monthly_expenses": "200000"},
        headers=auth_headers,
    )
    response = client.get("/api/v1/fi/dashboard", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "fi_number" in data
    assert "fi_progress_pct" in data
    assert "savings_rate" in data
    assert "passive_income_ratio" in data


def test_income_crud(client, auth_headers):
    # Create
    response = client.post(
        "/api/v1/fi/income/",
        json={
            "month": "2026-01",
            "source": "salary",
            "amount": "500000",
            "is_passive": False,
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    income_id = response.json()["id"]

    # List
    response = client.get("/api/v1/fi/income/", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) == 1

    # Filter by month
    response = client.get(
        "/api/v1/fi/income/?month=2026-01", headers=auth_headers
    )
    assert len(response.json()) == 1

    response = client.get(
        "/api/v1/fi/income/?month=2025-12", headers=auth_headers
    )
    assert len(response.json()) == 0

    # Update
    response = client.patch(
        f"/api/v1/fi/income/{income_id}",
        json={"amount": "550000"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert float(response.json()["amount"]) == 550000.0

    # Delete
    response = client.delete(
        f"/api/v1/fi/income/{income_id}", headers=auth_headers
    )
    assert response.status_code == 204


def test_expense_crud(client, auth_headers):
    # Create
    response = client.post(
        "/api/v1/fi/expenses/",
        json={
            "month": "2026-01",
            "category": "housing",
            "amount": "80000",
            "is_essential": True,
        },
        headers=auth_headers,
    )
    assert response.status_code == 201

    client.post(
        "/api/v1/fi/expenses/",
        json={
            "month": "2026-01",
            "category": "entertainment",
            "amount": "20000",
            "is_essential": False,
        },
        headers=auth_headers,
    )

    # Summary
    response = client.get(
        "/api/v1/fi/expenses/summary?month=2026-01", headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert float(data["total"]) == 100000.0
    assert len(data["by_category"]) == 2


def test_networth_generate(client, auth_headers):
    client.put(
        "/api/v1/fi/profile",
        json={"monthly_expenses": "200000"},
        headers=auth_headers,
    )
    response = client.post(
        "/api/v1/fi/networth/generate", headers=auth_headers
    )
    assert response.status_code == 201
    data = response.json()
    assert "net_worth" in data
    assert "savings_rate" in data

    # List
    response = client.get("/api/v1/fi/networth", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_fi_projection(client, auth_headers):
    client.put(
        "/api/v1/fi/profile",
        json={"monthly_expenses": "200000"},
        headers=auth_headers,
    )
    response = client.get("/api/v1/fi/projection", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "fi_number" in data
    assert "fi_progress_pct" in data


def test_fi_what_if(client, auth_headers):
    client.put(
        "/api/v1/fi/profile",
        json={"monthly_expenses": "200000"},
        headers=auth_headers,
    )
    response = client.get(
        "/api/v1/fi/what-if?monthly_savings=300000&expected_return=0.20",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert "scenario" in data
    assert "projected_fi_date" in data
