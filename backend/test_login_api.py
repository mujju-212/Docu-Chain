#!/usr/bin/env python3
"""Test the login API endpoint directly"""

import requests
import json

def test_login_api():
    """Test login with correct credentials"""
    
    url = "http://localhost:5000/api/auth/login"
    
    # Get Mumbai University ID from institutions
    inst_response = requests.get("http://localhost:5000/api/institutions/list")
    institutions = inst_response.json()['institutions']
    mumbai_id = None
    
    for inst in institutions:
        if inst['name'] == 'Mumbai University':
            mumbai_id = inst['id']
            break
    
    print(f"🏢 Mumbai University ID: {mumbai_id}")
    
    # Test login
    login_data = {
        "email": "diya.patel@student.mu.ac.in",
        "password": "student123", 
        "institutionId": mumbai_id
    }
    
    print(f"🔐 Testing login with data: {login_data}")
    
    try:
        response = requests.post(url, json=login_data, headers={'Content-Type': 'application/json'})
        print(f"📡 Response status: {response.status_code}")
        print(f"📄 Response data: {response.text}")
        
        if response.status_code == 200:
            print("✅ LOGIN SUCCESS!")
        else:
            print("❌ LOGIN FAILED!")
            
    except requests.ConnectionError:
        print("❌ Cannot connect to backend. Make sure it's running on localhost:5000")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_login_api()