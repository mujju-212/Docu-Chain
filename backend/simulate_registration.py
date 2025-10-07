"""
Test exactly what happens when registration form is submitted
"""
import requests
import json

def simulate_registration_flow():
    """Simulate the exact frontend registration flow"""
    print("🧪 Simulating Frontend Registration Flow")
    print("=" * 60)
    
    base_url = "http://localhost:5000/api"
    test_email = "your-email@example.com"  # Replace with your actual email
    
    print(f"📧 Using email: {test_email}")
    print("🔄 Step 1: Sending email verification request...")
    print("-" * 40)
    
    try:
        # This is exactly what the frontend sends
        response = requests.post(
            f"{base_url}/auth/send-email-verification",
            json={
                "email": test_email
            },
            headers={
                "Content-Type": "application/json"
            },
            timeout=15
        )
        
        print(f"Status: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ SUCCESS - Email verification request processed")
            print(f"Message: {data.get('message', 'No message')}")
            if 'otp' in data:
                print(f"OTP (for testing): {data['otp']}")
        else:
            print("❌ ERROR - Request failed")
            try:
                error_data = response.json()
                print(f"Error: {error_data}")
            except:
                print(f"Raw response: {response.text}")
                
    except Exception as e:
        print(f"❌ EXCEPTION: {str(e)}")
    
    print("\n" + "=" * 60)
    print("💡 DEBUGGING INFO:")
    print(f"1. Backend server: {base_url}")
    print(f"2. Email address: {test_email}")
    print("3. Check Flask server logs for any errors")
    print("4. Verify email in inbox/spam folder")
    print("5. Check Resend dashboard for delivery status")

if __name__ == "__main__":
    print("⚠️  IMPORTANT: Replace 'your-email@example.com' with your actual email address")
    print("Edit the test_email variable in this script with your email")
    print()
    simulate_registration_flow()