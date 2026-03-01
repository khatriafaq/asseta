from datetime import date


def calculate_xirr(
    dates: list[date], cashflows: list[float], guess: float = 0.1
) -> float | None:
    """Calculate XIRR (Extended Internal Rate of Return).

    Args:
        dates: List of dates for each cashflow.
        cashflows: List of cashflows (negative = outflow, positive = inflow).
        guess: Initial guess for the rate.

    Returns:
        Annualized return rate or None if calculation fails.
    """
    if not dates or not cashflows or len(dates) != len(cashflows):
        return None
    if len(dates) < 2:
        return None

    try:
        from scipy.optimize import brentq
    except ImportError:
        return _xirr_newton(dates, cashflows, guess)

    d0 = min(dates)

    def xnpv(rate: float) -> float:
        return sum(
            cf / (1 + rate) ** ((d - d0).days / 365.0)
            for d, cf in zip(dates, cashflows)
        )

    try:
        return brentq(xnpv, -0.999, 100.0, xtol=1e-8)
    except (ValueError, RuntimeError):
        return _xirr_newton(dates, cashflows, guess)


def _xirr_newton(
    dates: list[date], cashflows: list[float], guess: float = 0.1
) -> float | None:
    """Newton's method fallback for XIRR."""
    d0 = min(dates)
    rate = guess
    for _ in range(200):
        npv = 0.0
        dnpv = 0.0
        for d, cf in zip(dates, cashflows):
            t = (d - d0).days / 365.0
            denom = (1 + rate) ** t
            if denom == 0:
                return None
            npv += cf / denom
            if t != 0:
                dnpv -= t * cf / ((1 + rate) ** (t + 1))
        if abs(npv) < 1e-8:
            return rate
        if dnpv == 0:
            return None
        rate -= npv / dnpv
        if rate < -1:
            return None
    return None
