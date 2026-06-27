# Use an official Python runtime as a parent image
FROM python:3.11-slim as base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=7860

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for Hugging Face security compatibility
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

# Install dependencies
COPY --chown=user requirements.txt /app/
RUN pip install --no-cache-dir --user -r requirements.txt

# Copy project files
COPY --chown=user . /app/

# Expose port
EXPOSE 7860

# Start application server dynamically on the assigned PORT
CMD ["sh", "-c", "daphne -b 0.0.0.0 -p $PORT config.asgi:application"]
