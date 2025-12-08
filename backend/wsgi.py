# WSGI entry point for Gunicorn with Socket.IO support
# This file is specifically for production deployment with eventlet

import os

# Eventlet monkey-patching MUST be done before any other imports
if os.getenv('FLASK_ENV') == 'production':
    import eventlet
    eventlet.monkey_patch()

from app import create_app, socketio

# Create Flask app instance
app = create_app()

# For Gunicorn with eventlet worker, we need to expose the SocketIO instance
# This allows Gunicorn to properly handle WebSocket connections
if __name__ == '__main__':
    socketio.run(app)
