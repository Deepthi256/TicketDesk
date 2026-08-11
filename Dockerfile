# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /frontend
COPY Frontend/package*.json ./
RUN npm install
COPY Frontend/ ./
RUN npm run build

# Stage 2: Python Builder / Wheel Generation
FROM python:3.11-slim AS python-builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends gcc libpq-dev && rm -rf /var/lib/apt/lists/*
COPY Backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 3: Final Security-Hardened Runtime Image
FROM python:3.11-slim AS final

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DATABASE_URL=sqlite:////tmp/ticketdesk.db \
    UPLOAD_FOLDER=/tmp/uploads

WORKDIR /app

# Install runtime PostgreSQL client library only (no compiler/SDK)
RUN apt-get update && apt-get install -y --no-install-recommends libpq5 curl && rm -rf /var/lib/apt/lists/*

# Create non-root user and group
RUN addgroup --system --gid 10001 appgroup && \
    adduser --system --uid 10001 --ingroup appgroup --home /app appuser

# Copy installed python packages from builder stage
COPY --from=python-builder /root/.local /app/.local
ENV PATH=/app/.local/bin:$PATH

# Copy backend source code & frontend dist build
COPY Backend/app ./app
COPY --from=frontend-builder /frontend/dist ./frontend_dist

# Create upload & data directory with proper ownership
RUN mkdir -p /tmp/uploads /tmp/data && chown -R appuser:appgroup /app /tmp/uploads /tmp/data

# Switch to non-root user
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
