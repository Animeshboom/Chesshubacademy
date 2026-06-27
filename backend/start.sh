#!/usr/bin/env bash
# exit on error
set -o errexit

# Run Daphne ASGI server
PYTHONPATH=./backend daphne -b 0.0.0.0 -p $PORT config.asgi:application
