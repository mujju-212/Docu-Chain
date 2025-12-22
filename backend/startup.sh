#!/bin/bash
# Azure App Service Startup Script for DocuChain
# Optimized for 50+ concurrent users

echo "Starting DocuChain API..."

# Network diagnostics for Azure App Service
echo "=== Network Diagnostics ==="
echo "Testing DNS resolution for api.brevo.com..."
nslookup api.brevo.com || echo "DNS resolution failed"

echo "Testing connectivity to api.brevo.com..."
curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 https://api.brevo.com || echo "Connection failed"

echo "Current DNS servers:"
cat /etc/resolv.conf | grep nameserver

echo "=== Starting Application ==="

# Set environment
export FLASK_ENV=production

# Run database migrations if needed
# python -m flask db upgrade

# Start Gunicorn with SocketIO support
# Worker class is auto-detected in gunicorn.conf.py (eventlet/gevent/sync)
# Use wsgi.py module for proper Socket.IO integration
gunicorn --config gunicorn.conf.py --bind 0.0.0.0:$PORT wsgi:app \
    --workers 3 \
    --timeout 120 \
    --keep-alive 5 \
    --log-level info

