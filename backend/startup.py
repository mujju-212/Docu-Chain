#!/usr/bin/env python3
"""
Azure App Service Startup Script
Handles PYTHONPATH issues with Oryx compressed deployments
"""
import os
import sys
import subprocess

# Get the directory where this script is located
script_dir = os.path.dirname(os.path.abspath(__file__))
print(f"[STARTUP] Script directory: {script_dir}")

# Add script directory to PYTHONPATH
if script_dir not in sys.path:
    sys.path.insert(0, script_dir)
    print(f"[STARTUP] Added {script_dir} to sys.path")

# Set PYTHONPATH environment variable for gunicorn subprocess
os.environ['PYTHONPATH'] = script_dir + ':' + os.environ.get('PYTHONPATH', '')
print(f"[STARTUP] PYTHONPATH: {os.environ['PYTHONPATH']}")

# List files in directory
print(f"[STARTUP] Files in {script_dir}:")
for f in os.listdir(script_dir):
    print(f"  - {f}")

# Change to script directory
os.chdir(script_dir)
print(f"[STARTUP] Changed to directory: {os.getcwd()}")

# Run gunicorn
cmd = [
    sys.executable, '-m', 'gunicorn',
    '--bind=0.0.0.0:8000',
    '--workers=2',
    '--timeout=600',
    '--access-logfile=-',
    '--error-logfile=-',
    '--log-level=info',
    'wsgi:app'
]

print(f"[STARTUP] Running: {' '.join(cmd)}")
sys.exit(subprocess.call(cmd))
