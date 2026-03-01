from unittest.mock import MagicMock, patch


def test_ai_insights_no_api_key(client, auth_headers):
    """Should return 400 if user has no Gemini API key set."""
    # Create portfolio first
    resp = client.post(
        "/api/v1/portfolios/",
        json={"name": "Test Portfolio"},
        headers=auth_headers,
    )
    portfolio_id = resp.json()["id"]

    resp = client.post(
        f"/api/v1/portfolios/{portfolio_id}/analytics/ai-insights",
        headers=auth_headers,
    )
    assert resp.status_code == 400
    assert "Gemini API key" in resp.json()["detail"]


def test_ai_insights_with_mocked_gemini(client, auth_headers):
    """Should return AI insights when Gemini API key is set."""
    # Set Gemini API key
    client.patch(
        "/api/v1/auth/me",
        json={"gemini_api_key": "test-key-12345678"},
        headers=auth_headers,
    )

    # Create portfolio
    resp = client.post(
        "/api/v1/portfolios/",
        json={"name": "Test Portfolio"},
        headers=auth_headers,
    )
    portfolio_id = resp.json()["id"]

    mock_insight = {
        "summary": "Test summary",
        "strengths": ["Good diversification"],
        "concerns": ["High concentration"],
        "recommendations": ["Rebalance"],
        "market_context": "Stable market",
        "rebalance_reasoning": {"Equity Fund": "Increase equity"},
    }

    with patch("app.routers.analytics_router.GeminiService") as MockGemini:
        from app.models.analytics import AIInsight

        mock_instance = MagicMock()
        mock_instance.generate_portfolio_insights.return_value = AIInsight(
            summary="Test summary",
            strengths=["Good diversification"],
            concerns=["High concentration"],
            recommendations=["Rebalance"],
            market_context="Stable market",
            emergency_fund_status="Emergency fund not set — recommend establishing 6-month liquid reserve first",
            rebalance_reasoning={"Equity Fund": "Increase equity"},
        )
        MockGemini.return_value = mock_instance

        resp = client.post(
            f"/api/v1/portfolios/{portfolio_id}/analytics/ai-insights",
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["summary"] == "Test summary"
        assert len(data["strengths"]) == 1


def test_risk_score_endpoint(client, auth_headers):
    """Should return a risk score for the portfolio."""
    resp = client.post(
        "/api/v1/portfolios/",
        json={"name": "Test Portfolio"},
        headers=auth_headers,
    )
    portfolio_id = resp.json()["id"]

    resp = client.get(
        f"/api/v1/portfolios/{portfolio_id}/analytics/risk-score",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "health_score" in data
    assert "diversification_grade" in data
    assert "risk_factors" in data


def test_user_profile_fields(client, auth_headers):
    """Should save and retrieve new user profile fields."""
    resp = client.patch(
        "/api/v1/auth/me",
        json={
            "date_of_birth": "1995-06-15",
            "risk_tolerance": "moderate",
            "investment_horizon_years": 15,
            "monthly_income": 200000,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["date_of_birth"] == "1995-06-15"
    assert data["risk_tolerance"] == "moderate"
    assert data["investment_horizon_years"] == 15
    assert float(data["monthly_income"]) == 200000.0

    # Verify masked key is null when not set
    assert data["gemini_api_key_masked"] is None


def test_gemini_key_masking(client, auth_headers):
    """Should mask the Gemini API key in GET /me."""
    client.patch(
        "/api/v1/auth/me",
        json={"gemini_api_key": "AIzaSyTestKeyHere123456"},
        headers=auth_headers,
    )
    resp = client.get("/api/v1/auth/me", headers=auth_headers)
    data = resp.json()
    assert data["gemini_api_key_masked"] == "AIza...3456"
