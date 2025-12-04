"""
Azure App Service entry point
This file creates the Flask application for Azure deployment
"""
import os
import sys

# Get the directory containing this file
basedir = os.path.abspath(os.path.dirname(__file__))

# Add the base directory to Python path FIRST to ensure 'app' module is found
if basedir not in sys.path:
    sys.path.insert(0, basedir)

# Now import after path is set
from app import create_app, db

# Create the Flask application
app = create_app()

# Create database tables if they don't exist
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8000)))
