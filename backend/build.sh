#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies
pip install -r backend/requirements.txt

# Collect static files
python backend/manage.py collectstatic --no-input

# Run migrations
python backend/manage.py migrate --no-input
