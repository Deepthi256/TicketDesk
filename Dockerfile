# Stage 1: Python Builder / Wheel Installation
FROM python:3.11-slim AS python-builder
WORKDIR /app
COPY Backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Final Lean Security-Hardened API Runtime Image
FROM python:3.11-slim AS final

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DATABASE_URL=sqlite:////tmp/ticketdesk.db \
    UPLOAD_FOLDER=/tmp/uploads

WORKDIR /app

# Create non-root system user and group
RUN addgroup --system --gid 10001 appgroup && \
    adduser --system --uid 10001 --ingroup appgroup --home /app appuser

# Copy installed python packages from builder stage with appuser ownership
COPY --chown=appuser:appgroup --from=python-builder /root/.local /app/.local
ENV PATH=/app/.local/bin:$PATH

# Copy Python FastAPI backend application source code
COPY --chown=appuser:appgroup Backend/app ./app

# Create upload & data directory with appuser ownership
RUN mkdir -p /tmp/uploads /tmp/data && chown -R appuser:appgroup /tmp/uploads /tmp/data

# Switch to non-root user
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]