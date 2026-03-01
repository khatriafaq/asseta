import json
import logging

from google import genai

from app.models.analytics import AIInsight
from app.models.risk_score import RiskScore

logger = logging.getLogger(__name__)


class GeminiService:
    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)

    def generate_portfolio_insights(
        self,
        portfolio_data: dict,
        risk_score: RiskScore,
        user_profile: dict,
        emergency_fund: dict,
    ) -> AIInsight:
        prompt = self._build_prompt(portfolio_data, risk_score, user_profile, emergency_fund)

        response = self.client.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": {
                    "type": "OBJECT",
                    "properties": {
                        "summary": {"type": "STRING"},
                        "strengths": {"type": "ARRAY", "items": {"type": "STRING"}},
                        "concerns": {"type": "ARRAY", "items": {"type": "STRING"}},
                        "recommendations": {"type": "ARRAY", "items": {"type": "STRING"}},
                        "market_context": {"type": "STRING"},
                        "emergency_fund_status": {"type": "STRING"},
                    },
                    "required": [
                        "summary",
                        "strengths",
                        "concerns",
                        "recommendations",
                        "market_context",
                        "emergency_fund_status",
                    ],
                },
            },
        )

        data = json.loads(response.text)
        # rebalance_reasoning not in schema (Gemini doesn't support additionalProperties)
        data.setdefault("rebalance_reasoning", {})
        return AIInsight(**data)

    def _build_prompt(
        self,
        portfolio_data: dict,
        risk_score: RiskScore,
        user_profile: dict,
        emergency_fund: dict,
    ) -> str:
        ef = emergency_fund
        ef_monthly = ef.get("monthly_essential", 0)
        ef_target = ef.get("target_amount", 0)
        ef_balance = ef.get("current_balance", 0)
        ef_months = ef.get("months_covered", 0)
        ef_gap = ef.get("gap", 0)
        ef_target_months = ef.get("target_months", 6)
        ef_status = ef.get("status", "unknown")  # critical / building / healthy / strong

        # Named accounts the user has explicitly tagged as their emergency fund
        tagged = ef.get("tagged_accounts", [])
        if tagged:
            ef_accounts_str = ", ".join(
                f"{a['name']} (PKR {a['current_value']:,.0f})" for a in tagged
            )
        else:
            ef_accounts_str = "None tagged yet — user should tag their EF account in the app"

        # Map service status to human-readable context for Gemini
        ef_status_label = {
            "critical": "CRITICAL — less than 1 month covered",
            "building": "BUILDING — 1–3 months covered",
            "healthy": f"HEALTHY — between 3 and {ef_target_months} months covered",
            "strong": f"STRONG — {ef_target_months}+ months fully covered",
        }.get(ef_status, "UNKNOWN — no expense data or tags set up")

        return f"""You are a financial advisor specializing in Shariah-compliant investing in Pakistan.
Analyze this portfolio and provide actionable insights.

## User Profile
- Age: {user_profile.get('age', 'Unknown')}
- Risk Tolerance: {user_profile.get('risk_tolerance', 'Unknown')}
- Investment Horizon: {user_profile.get('investment_horizon_years', 'Unknown')} years
- Monthly Income: PKR {user_profile.get('monthly_income', 'Unknown')}

## Emergency Fund Status (EVALUATE THIS FIRST — it is the #1 financial priority)
- Status: {ef_status_label}
- Monthly Essential Expenses: PKR {ef_monthly:,.0f}
- User's Target: {ef_target_months} months  |  Target Amount: PKR {ef_target:,.0f}
- Current Tagged EF Balance: PKR {ef_balance:,.0f}
- Coverage: {ef_months:.1f} months
- Shortfall to reach target: PKR {max(ef_gap, 0):,.0f}
- User's designated EF account(s): {ef_accounts_str}

## Net Worth Summary (for context only)
- Total Assets incl. Emergency Fund: PKR {portfolio_data.get('gross_current_value', 0):,.0f}
- Emergency Fund (excluded from investment analysis): PKR {portfolio_data.get('ef_value', 0):,.0f}

## Investable Portfolio (Emergency Fund EXCLUDED — use this for all investment analysis)
- Total Invested: PKR {portfolio_data.get('total_invested', 0):,.0f}
- Current Value: PKR {portfolio_data.get('current_value', 0):,.0f}
- Return: {portfolio_data.get('return_pct', 0):.1%}
- XIRR: {portfolio_data.get('xirr', 'N/A')}

## Allocation Breakdown
{json.dumps(portfolio_data.get('allocation', []), indent=2, default=str)}

## Risk Score
- Health Score: {risk_score.health_score}/100
- Diversification Grade: {risk_score.diversification_grade}
- Risk Factors: {'; '.join(risk_score.risk_factors) if risk_score.risk_factors else 'None'}
- Concentration Warnings: {len(risk_score.concentration_warnings)} warnings

## Instructions
0. ASSESS EMERGENCY FUND FIRST — it must inform all other advice:
   The user has designated specific account(s) as their emergency fund: {ef_accounts_str}.
   ALL EF recommendations MUST reference these tagged accounts by name — never suggest
   moving money to a different vehicle unless the current account is inappropriate.
   - "critical" or "building" (< 3 months): Flag as the top concern. The #1 recommendation must
     be to top up the designated EF account(s) ({ef_accounts_str}) by PKR {max(ef_gap, 0):,.0f}
     to reach the {ef_target_months}-month target (PKR {ef_target:,.0f}) BEFORE increasing equity.
   - "healthy" (3 months to target): Include as a concern and make topping up the designated
     EF account(s) the first recommendation. State the shortfall (PKR {max(ef_gap, 0):,.0f}).
   - "strong" ({ef_target_months}+ months): List as a key strength. The designated account(s)
     are fully funded.
   - "unknown": Recommend tagging EF assets in the Safety Net section of the app.
1. Provide a concise 2-3 sentence summary of the portfolio's current state (mention EF status)
2. List 2-4 specific strengths (things the investor is doing well)
3. List 2-4 specific concerns in priority order (EF concern first if not "strong")
4. List 2-4 actionable recommendations in priority order (EF first if not "strong")
5. Provide brief market context relevant to Pakistan's current economic conditions
6. For each asset type in the investable allocation, provide a one-sentence reasoning for
   whether to increase, decrease, or maintain. Note: Savings Account / liquid savings is
   handled by the Emergency Fund and should NOT appear as an investment target.
7. In emergency_fund_status: write ONE sentence naming the user's specific tagged EF account(s)
   and the exact next step (e.g. "Mashreq Bank covers 1.7 months — deposit PKR 155,000 more
   into Mashreq Bank to reach the 3-month target before adding equity exposure")

Keep responses concise and specific to this portfolio. Use PKR for amounts.
Focus on Shariah-compliant options only. Reference specific Pakistani mutual funds where relevant."""
