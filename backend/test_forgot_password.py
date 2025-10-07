"""
Test forgot password with your email address
"""
import requests
import json

def test_forgot_password():
    """Test forgot password endpoint with user's email"""
    email = "mujju718263@gmail.com"
    base_url = "http://localhost:5000/api"
    
    print(f"🧪 Testing Forgot Password for: {email}")
    print("=" * 50)
    
    try:
        response = requests.post(
            f"{base_url}/auth/forgot-password",
            json={"email": email},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ SUCCESS! Forgot password email sent")
            print(f"📧 Message: {data.get('message')}")
            
            # Show OTP in development mode
            if 'otp' in data:
                print(f"🔑 OTP (dev mode): {data['otp']}")
                
            print(f"\n💌 CHECK YOUR EMAIL: {email}")
            print("📁 Also check SPAM/JUNK folder")
            
        elif response.status_code == 404:
            data = response.json()
            print(f"❌ User not found: {data.get('message')}")
            print("💡 This email is not registered yet")
            print("💡 Try registering first, then use forgot password")
            
        elif response.status_code == 400:
            data = response.json()
            print(f"⚠️  Error: {data.get('message')}")
            
        else:
            print(f"❌ Unexpected status: {response.text}")
            
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        print("💡 Make sure Flask server is running")

if __name__ == "__main__":
    test_forgot_password()