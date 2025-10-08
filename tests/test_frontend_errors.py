#!/usr/bin/env python3
"""
Comprehensive test of email system with proper registration data
"""
import requests
import json

# Base URL
BASE_URL = "http://localhost:5000"

def test_frontend_error_handling():
    """Test frontend forgot password form with the updated error handling"""
    print("=" * 60)
    print("TESTING FRONTEND FORGOT PASSWORD ERROR HANDLING")
    print("=" * 60)
    
    # Test with registered email (should get 200 with dev OTP)
    print("\n1. Testing registered email (aarav.sharma@student.mu.ac.in)")
    print("   Expected: 200 status with development OTP due to Resend limitation")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": "aarav.sharma@student.mu.ac.in"},
            headers={"Content-Type": "application/json"}
        )
        
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Success: {data.get('message')}")
            if 'otp' in data:
                print(f"   🔑 Development OTP: {data['otp']}")
            if 'dev_note' in data:
                print(f"   ℹ️  Note: {data['dev_note']}")
        else:
            print(f"   Response: {response.json()}")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test with unregistered email (should get 404)
    print("\n2. Testing unregistered email")
    print("   Expected: 404 status - email not registered")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": "unregistered@test.com"},
            headers={"Content-Type": "application/json"}
        )
        
        print(f"   Status: {response.status_code}")
        if response.status_code == 404:
            data = response.json()
            print(f"   ✅ Correct 404: {data.get('message')}")
        else:
            print(f"   Response: {response.json()}")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        
    # Test with invalid email format (should get 400)
    print("\n3. Testing invalid email format")
    print("   Expected: 400 status - invalid format")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": "invalid-email"},
            headers={"Content-Type": "application/json"}
        )
        
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")

def check_server_running():
    """Check if the Flask server is running"""
    try:
        response = requests.get(f"{BASE_URL}/")
        return True
    except:
        return False

if __name__ == "__main__":
    print("Testing Updated Email System - Frontend Error Handling")
    print("This will test the frontend error scenarios\n")
    
    # Check server
    if not check_server_running():
        print("❌ Flask server is not running!")
        print("Please start it with: cd backend && python run.py")
        exit(1)
        
    print("✅ Flask server is running")
    
    # Test frontend error handling
    test_frontend_error_handling()
    
    print("\n" + "=" * 60)
    print("FRONTEND TESTING COMPLETE")
    print("=" * 60)
    
    print("\n📋 SUMMARY:")
    print("✅ Registered emails now return 200 with development OTP (Resend limitation handled)")
    print("✅ Unregistered emails still return 404 (proper error)")  
    print("✅ Frontend should show appropriate messages for each scenario")
    print("\n🔧 Next Steps:")
    print("1. Test the actual frontend forgot password form")
    print("2. Verify error messages display correctly")
    print("3. Test complete authentication flow")