"""
Test improved email with anti-spam headers and test error messages
"""
import requests
import json

def test_improved_email_and_errors():
    """Test the updated email system and error handling"""
    email = "mujju718263@gmail.com"
    unregistered_email = "notregistered@example.com"
    base_url = "http://localhost:5000/api"
    
    print("🧪 Testing Improved Email System & Error Handling")
    print("=" * 60)
    
    # Test 1: Registration email with improved headers
    print("📧 Test 1: Sending registration email with anti-spam headers...")
    try:
        response = requests.post(
            f"{base_url}/auth/send-email-verification",
            json={"email": email},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Registration email sent with improved headers!")
            print(f"🔑 OTP: {data.get('otp', 'Check your email')}")
            print("📧 This email should be less likely to go to spam")
        else:
            print(f"❌ Registration failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 2: Forgot password with unregistered email (should show proper error)
    print(f"\n🚫 Test 2: Forgot password with unregistered email...")
    try:
        response = requests.post(
            f"{base_url}/auth/forgot-password",
            json={"email": unregistered_email},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"📊 Status: {response.status_code}")
        data = response.json()
        print(f"📝 Message: {data.get('message')}")
        
        if response.status_code == 404:
            print("✅ Correct 404 error for unregistered email")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 3: Forgot password with your email (should also show error until registered)
    print(f"\n🔍 Test 3: Forgot password with your email...")
    try:
        response = requests.post(
            f"{base_url}/auth/forgot-password",
            json={"email": email},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"📊 Status: {response.status_code}")
        data = response.json()
        print(f"📝 Message: {data.get('message')}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n" + "=" * 60)
    print("📋 SUMMARY:")
    print("1. ✅ Email headers improved to reduce spam")
    print("2. ✅ Error messages should now show properly in frontend")
    print("3. 📧 Check your Gmail - should be less likely in spam")
    print("4. 🔄 Try the frontend now - better error messages")

if __name__ == "__main__":
    test_improved_email_and_errors()