#!/usr/bin/env python3
"""
Test updated auth endpoints with Resend API limitation handling
"""
import requests
import json

# Base URL
BASE_URL = "http://localhost:5000"

def test_forgot_password_scenarios():
    """Test updated forgot password with different email scenarios"""
    print("=" * 60)
    print("TESTING UPDATED FORGOT PASSWORD ENDPOINTS")
    print("=" * 60)
    
    # Test scenarios
    test_cases = [
        {
            "description": "Registered email (should trigger Resend limitation)",
            "email": "aarav.sharma@student.mu.ac.in",
            "expected": "Should return development OTP due to Resend API limitation"
        },
        {
            "description": "Verified email address (should work normally)",
            "email": "mujju718263@gmail.com",
            "expected": "Should send email successfully or return not registered"
        },
        {
            "description": "Unregistered email",
            "email": "nonexistent@example.com",
            "expected": "Should return 404 - email not registered"
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{i}. {test_case['description']}")
        print(f"   Email: {test_case['email']}")
        print(f"   Expected: {test_case['expected']}")
        
        try:
            response = requests.post(
                f"{BASE_URL}/api/auth/forgot-password",
                json={"email": test_case['email']},
                headers={"Content-Type": "application/json"}
            )
            
            print(f"   Status Code: {response.status_code}")
            
            try:
                response_data = response.json()
                print(f"   Response: {json.dumps(response_data, indent=2)}")
                
                # Check for development mode features
                if 'otp' in response_data:
                    print(f"   ✅ Development OTP provided: {response_data['otp']}")
                if 'dev_note' in response_data:
                    print(f"   ℹ️  Dev Note: {response_data['dev_note']}")
                    
            except ValueError:
                print(f"   Response Text: {response.text}")
                
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
        
        print("-" * 50)

def test_register_scenarios():
    """Test registration with different email scenarios"""
    print("\n" + "=" * 60)
    print("TESTING UPDATED REGISTRATION ENDPOINTS")
    print("=" * 60)
    
    # Test scenarios
    test_cases = [
        {
            "description": "New user with non-verified email",
            "email": "test.user@example.com",
            "username": "testuser123",
            "password": "TestPass123!",
            "expected": "Should return development OTP due to Resend API limitation"
        },
        {
            "description": "New user with verified email",
            "email": "mujju718263@gmail.com",
            "username": "verifieduser123",
            "password": "TestPass123!",
            "expected": "Should work normally (send email or handle existing user)"
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{i}. {test_case['description']}")
        print(f"   Email: {test_case['email']}")
        print(f"   Expected: {test_case['expected']}")
        
        try:
            response = requests.post(
                f"{BASE_URL}/api/auth/register",
                json={
                    "email": test_case['email'],
                    "username": test_case['username'],
                    "password": test_case['password'],
                    "role": "student"
                },
                headers={"Content-Type": "application/json"}
            )
            
            print(f"   Status Code: {response.status_code}")
            
            try:
                response_data = response.json()
                print(f"   Response: {json.dumps(response_data, indent=2)}")
                
                # Check for development mode features
                if 'otp' in response_data:
                    print(f"   ✅ Development OTP provided: {response_data['otp']}")
                if 'dev_note' in response_data:
                    print(f"   ℹ️  Dev Note: {response_data['dev_note']}")
                    
            except ValueError:
                print(f"   Response Text: {response.text}")
                
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
        
        print("-" * 50)

if __name__ == "__main__":
    print("Testing Updated Authentication Endpoints with Resend API Limitation Handling")
    print("This will test both forgot password and registration scenarios\n")
    
    # Test forgot password scenarios
    test_forgot_password_scenarios()
    
    # Test registration scenarios  
    test_register_scenarios()
    
    print("\n" + "=" * 60)
    print("TESTING COMPLETE")
    print("=" * 60)
    print("✅ If you see development OTPs for non-verified emails, the limitation handling is working")
    print("✅ If verified emails work normally, the email service is functioning")
    print("✅ Check that 404 responses still work for unregistered emails")