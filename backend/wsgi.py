"""
WSGI entry point for Azure App Service
This file ensures the app directory is in Python path before importing
"""
import os
import sys

# CRITICAL: Add current directory to Python path FIRST
# This is needed because Azure Oryx extracts to /tmp/{hash}/ 
# but doesn't add it to PYTHONPATH
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

# Now we can safely import from app package
from app import create_app, db

# Create the application instance
application = create_app()
app = application  # Alias for gunicorn (both work: wsgi:app or wsgi:application)

# Initialize database tables
with app.app_context():
    db.create_all()
