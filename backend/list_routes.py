#!/usr/bin/env python3
"""
List all available routes in the Flask application
"""

import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app

def list_routes():
    """List all available routes in the Flask app"""
    app = create_app()
    
    with app.app_context():
        print("Available Routes:")
        print("=" * 50)
        
        for rule in app.url_map.iter_rules():
            methods = ','.join(rule.methods - {'HEAD', 'OPTIONS'})
            print(f"{rule.endpoint:30} {methods:20} {rule}")
        
        print("=" * 50)
        print(f"Total routes: {len(list(app.url_map.iter_rules()))}")

if __name__ == '__main__':
    list_routes()