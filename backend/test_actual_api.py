"""
Test actual API endpoints that frontend will use
"""
import requests
import json

def test_api_endpoints():
    """Test the actual API endpoints for email functionality"""
    base_url = "http://localhost:5000"
    
    print("🧪 Testing DocuChain API Endpoints")
    print("=" * 50)
    
    # Test 1: Forgot Password (actual endpoint)
    print("\n1. Testing Forgot Password API endpoint...")
    try:
        response = requests.post(
            f"{base_url}/api/auth/forgot-password",
            json={"email": "delivered@resend.dev"},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Success: {result.get('message', 'Email sent')}")
        else:
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    # Test 2: Send Email Verification (registration)
    print("\n2. Testing Email Verification API endpoint...")
    try:
        response = requests.post(
            f"{base_url}/api/auth/send-email-verification",
            json={"email": "delivered@resend.dev"},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"   Status Code: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Success: {result.get('message', 'Verification email sent')}")
        else:
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    # Test 3: Check if server is responding
    print("\n3. Testing server health...")
    try:
        response = requests.get(f"{base_url}/", timeout=5)
        print(f"   ✅ Server is responding (Status: {response.status_code})")
    except Exception as e:
        print(f"   ❌ Server connection error: {str(e)}")
    
    print("\n" + "=" * 50)
    print("🎉 API endpoint testing completed!")

if __name__ == "__main__":
    test_api_endpoints()