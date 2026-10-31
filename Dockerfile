# Multi-stage Dockerfile for full-stack TRACE-Q deployment
# Stage 1: Build the React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 2: Python backend environment
FROM python:3.11-slim AS production
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install backend dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy built frontend assets from stage 1 into backend static location
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Initialize DB on first run if needed and start uvicorn
WORKDIR /app/backend
EXPOSE 8000

CMD ["sh", "-c", "python -c 'from app.core.database import init_db; init_db()' && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
