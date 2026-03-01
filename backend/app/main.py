import logging
import time
from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import create_db_and_tables
from app.jobs.alert_evaluator import evaluate_alerts
from app.jobs.daily_value_job import record_all_daily_values
from app.jobs.nav_updater import run_nav_update
from app.jobs.snapshot_job import run_monthly_snapshots
from app.routers import (
    admin_router,
    alert_router,
    analytics_router,
    auth_router,
    emergency_fund_router,
    expense_router,
    fi_router,
    fund_router,
    holding_router,
    income_router,
    portfolio_router,
    daily_value_router,
    snapshot_router,
    target_allocation_router,
    transaction_router,
)

settings = get_settings()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    # Schedule daily NAV update at 11 AM PKT (06:00 UTC)
    # misfire_grace_time=7200: if container restarts within 2 hrs of scheduled time, job still runs
    scheduler.add_job(run_nav_update, "cron", hour=6, minute=0, id="nav_update", misfire_grace_time=7200)
    # Record daily portfolio values at 11:05 AM PKT (06:05 UTC), after NAV update
    scheduler.add_job(record_all_daily_values, "cron", hour=6, minute=5, id="daily_value", misfire_grace_time=7200)
    # Generate end-of-month snapshots on the 1st at 11:10 AM PKT (06:10 UTC)
    # Runs after NAV update + daily values, capturing the previous month's final prices
    scheduler.add_job(run_monthly_snapshots, "cron", day=1, hour=6, minute=10, id="monthly_snapshot", misfire_grace_time=7200)
    # Evaluate alerts every hour
    scheduler.add_job(evaluate_alerts, "interval", hours=1, id="alert_eval", misfire_grace_time=3600)
    scheduler.start()
    logger.info("Asseta backend started")
    yield
    scheduler.shutdown()
    logger.info("Asseta backend stopped")


app = FastAPI(
    title="Asseta API",
    description="Shariah-Compliant FinTech Portfolio Management",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Process-Time"],
)


@app.middleware("http")
async def add_process_time(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    response.headers["X-Process-Time"] = f"{time.perf_counter() - start:.4f}"
    return response


# Register routers
app.include_router(admin_router.router)
app.include_router(auth_router.router)
app.include_router(portfolio_router.router)
app.include_router(transaction_router.router)
app.include_router(holding_router.router)
app.include_router(fund_router.router)
app.include_router(analytics_router.router)
app.include_router(snapshot_router.router)
app.include_router(daily_value_router.router)
app.include_router(alert_router.router)
app.include_router(target_allocation_router.router)
app.include_router(fi_router.router)
app.include_router(income_router.router)
app.include_router(expense_router.router)
app.include_router(emergency_fund_router.router)


@app.get("/")
def root():
    return {
        "name": "Asseta",
        "tagline": "Your Path to Financial Independence",
        "version": "0.1.0",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
