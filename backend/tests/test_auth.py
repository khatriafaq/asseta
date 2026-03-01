def test_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["name"] == "Asseta"


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_signup(client):
    response = client.post(
        "/api/v1/auth/signup",
        json={"name": "Alice", "email": "alice@example.com", "password": "secret123"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "alice@example.com"
    assert data["name"] == "Alice"
    assert "id" in data
    assert "hashed_password" not in data


def test_signup_duplicate_email(client):
    client.post(
        "/api/v1/auth/signup",
        json={"name": "Alice", "email": "dup@example.com", "password": "secret123"},
    )
    response = client.post(
        "/api/v1/auth/signup",
        json={"name": "Alice2", "email": "dup@example.com", "password": "secret456"},
    )
    assert response.status_code == 400


def test_login(client):
    client.post(
        "/api/v1/auth/signup",
        json={"name": "Bob", "email": "bob@example.com", "password": "pass123"},
    )
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "bob@example.com", "password": "pass123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client):
    client.post(
        "/api/v1/auth/signup",
        json={"name": "Charlie", "email": "charlie@example.com", "password": "pass123"},
    )
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "charlie@example.com", "password": "wrong"},
    )
    assert response.status_code == 401


def test_me(client, auth_headers):
    response = client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["email"] == "test@example.com"


def test_update_me(client, auth_headers):
    response = client.patch(
        "/api/v1/auth/me",
        json={"name": "Updated Name"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Name"


def test_me_unauthorized(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
