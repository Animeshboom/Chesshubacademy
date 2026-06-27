# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . /app/

# Run collectstatic during image build (safely ignore failures if env vars are missing at build time)
RUN python manage.py collectstatic --no-input || true

# Expose default port
EXPOSE 8000

# Startup command: run database migrations, collect static files, and start Daphne ASGI server
CMD ["sh", "-c", "python manage.py migrate --no-input && python manage.py collectstatic --no-input && daphne -b 0.0.0.0 -p ${PORT:-8000} config.asgi:application"]
