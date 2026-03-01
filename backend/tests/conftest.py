import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.database import get_session
from app.main import app


@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session):
    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


@pytest.fixture(name="auth_headers")
def auth_headers_fixture(client: TestClient):
    """Create a test user and return auth headers."""
    client.post(
        "/api/v1/auth/signup",
        json={"name": "Test User", "email": "test@example.com", "password": "testpass123"},
    )
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "test@example.com", "password": "testpass123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
