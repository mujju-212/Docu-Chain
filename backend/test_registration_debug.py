"""
Interactive email test for debugging registration issues
"""
import requests
import json

def test_registration_email():
    """Test registration email with specific email address"""
    print("🧪 Testing Registration Email Flow")
    print("=" * 50)
    
    # Get email from user
    test_email = input("Enter the email address you're using for registration: ").strip()
    
    if not test_email:
        test_email = "delivered@resend.dev"  # Default test email
        print(f"Using default test email: {test_email}")
    
    base_url = "http://localhost:5000/api"
    
    print(f"\n📧 Testing with email: {test_email}")
    print("-" * 30)
    
    # Test the registration verification endpoint
    try:
        print("1. Sending verification email...")
        response = requests.post(
            f"{base_url}/auth/send-email-verification",
            json={"email": test_email},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Success: {result.get('message', 'Email sent')}")
            print(f"   📧 Check your inbox: {test_email}")
            print("   📁 Also check your spam/junk folder")
            print("   ⏰ OTP expires in 15 minutes")
        elif response.status_code == 400:
            result = response.json()
            print(f"   ⚠️  Warning: {result.get('message', 'Bad request')}")
        elif response.status_code == 500:
            result = response.json()
            print(f"   ❌ Server Error: {result.get('message', 'Internal error')}")
        else:
            print(f"   ❌ Unexpected status: {response.text}")
            
        # Show response details for debugging
        print(f"\n🔍 Full Response:")
        try:
            response_json = response.json()
            print(json.dumps(response_json, indent=2))
        except:
            print(response.text)
            
    except requests.exceptions.ConnectionError:
        print("   ❌ Connection failed - Flask server may not be running")
        print("   💡 Make sure Flask server is running on http://localhost:5000")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    print("\n" + "=" * 50)
    print("💡 Troubleshooting Tips:")
    print("1. Check your spam/junk folder")
    print("2. Verify the email address is correct")
    print("3. Try with a different email provider (Gmail, Outlook)")
    print("4. Check if your email provider blocks automated emails")
    print("5. Wait 2-3 minutes for delivery")

if __name__ == "__main__":
    test_registration_email()