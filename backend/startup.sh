#!/bin/bash
# Azure App Service Startup Script for DocuChain
# Optimized for 50+ concurrent users

echo "Starting DocuChain API..."

# Set environment
export FLASK_ENV=production

# Run database migrations if needed
# python -m flask db upgrade

# Start Gunicorn with SocketIO support
# Using eventlet for WebSocket + high concurrency
gunicorn --config gunicorn.conf.py --bind 0.0.0.0:$PORT 'app:create_app()' \
    --worker-class eventlet \
    --workers 3 \
    --timeout 120 \
    --keep-alive 5 \
    --log-level info

