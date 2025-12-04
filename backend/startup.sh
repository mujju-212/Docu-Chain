#!/bin/bash

# Azure App Service startup script for Python Flask app
# This script ensures the app runs correctly on Azure

# Navigate to the application directory
cd /home/site/wwwroot

# Set Python path to include the app directory
export PYTHONPATH="/home/site/wwwroot:$PYTHONPATH"

# Start gunicorn with the Flask app
gunicorn --bind=0.0.0.0:8000 --workers=2 --timeout=600 --chdir=/home/site/wwwroot application:app
