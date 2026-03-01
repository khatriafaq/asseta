# ---------- Dev stage (hot reload) ----------
FROM python:3.12-slim AS dev
WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

COPY pyproject.toml uv.lock* ./
ENV UV_PROJECT_ENVIRONMENT=/opt/venv
RUN uv sync --frozen --no-dev 2>/dev/null || uv sync --no-dev

ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# ---------- Build stage (production) ----------
FROM python:3.12-slim AS builder
WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

COPY pyproject.toml uv.lock* ./
RUN uv sync --frozen --no-dev 2>/dev/null || uv sync --no-dev

# ---------- Runtime stage (production) ----------
FROM python:3.12-slim
WORKDIR /app

RUN useradd --create-home --uid 1000 appuser

COPY --from=builder /app/.venv /app/.venv
COPY --chown=appuser:appuser app ./app
COPY --chown=appuser:appuser alembic ./alembic
COPY --chown=appuser:appuser alembic.ini ./
COPY --chown=appuser:appuser start.sh ./

RUN chmod +x start.sh

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

USER appuser

HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT:-8000}/health')" || exit 1

EXPOSE 8000

LABEL org.opencontainers.image.title="Asseta API" \
      org.opencontainers.image.description="Shariah-Compliant FinTech Portfolio Management" \
      org.opencontainers.image.version="0.1.0"

# start.sh: runs `alembic upgrade head` then starts uvicorn on $PORT (injected by Render)
CMD ["./start.sh"]
