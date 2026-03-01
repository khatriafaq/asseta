def test_create_portfolio(client, auth_headers):
    response = client.post(
        "/api/v1/portfolios/",
        json={"name": "My Portfolio", "description": "Main tracker"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "My Portfolio"
    assert data["description"] == "Main tracker"
    assert "id" in data


def test_list_portfolios(client, auth_headers):
    client.post(
        "/api/v1/portfolios/",
        json={"name": "Portfolio 1"},
        headers=auth_headers,
    )
    client.post(
        "/api/v1/portfolios/",
        json={"name": "Portfolio 2"},
        headers=auth_headers,
    )
    response = client.get("/api/v1/portfolios/", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_get_portfolio(client, auth_headers):
    create = client.post(
        "/api/v1/portfolios/",
        json={"name": "Test"},
        headers=auth_headers,
    )
    pid = create.json()["id"]
    response = client.get(f"/api/v1/portfolios/{pid}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Test"


def test_update_portfolio(client, auth_headers):
    create = client.post(
        "/api/v1/portfolios/",
        json={"name": "Old Name"},
        headers=auth_headers,
    )
    pid = create.json()["id"]
    response = client.patch(
        f"/api/v1/portfolios/{pid}",
        json={"name": "New Name"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["name"] == "New Name"


def test_delete_portfolio(client, auth_headers):
    create = client.post(
        "/api/v1/portfolios/",
        json={"name": "Delete Me"},
        headers=auth_headers,
    )
    pid = create.json()["id"]
    response = client.delete(f"/api/v1/portfolios/{pid}", headers=auth_headers)
    assert response.status_code == 204

    response = client.get(f"/api/v1/portfolios/{pid}", headers=auth_headers)
    assert response.status_code == 404


def test_portfolio_not_found(client, auth_headers):
    response = client.get("/api/v1/portfolios/9999", headers=auth_headers)
    assert response.status_code == 404


def test_portfolio_unauthorized(client):
    response = client.get("/api/v1/portfolios/")
    assert response.status_code == 401
