"""
Complete registration flow test for mujju718263@gmail.com
"""
import requests
import json

def complete_registration_test():
    """Test the complete registration flow"""
    email = "mujju718263@gmail.com"
    base_url = "http://localhost:5000/api"
    
    print(f"🧪 Complete Registration Test for: {email}")
    print("=" * 60)
    
    # Step 1: Send verification email
    print("📧 Step 1: Sending verification email...")
    try:
        response = requests.post(
            f"{base_url}/auth/send-email-verification",
            json={"email": email},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Verification email sent!")
            print(f"🔑 OTP: {data.get('otp', 'Check your email')}")
            
            # Test OTP verification
            if 'otp' in data:
                otp = data['otp']
                print(f"\n🔐 Step 2: Testing OTP verification with: {otp}")
                
                verify_response = requests.post(
                    f"{base_url}/auth/verify-email-otp",
                    json={"email": email, "otp": otp},
                    headers={"Content-Type": "application/json"},
                    timeout=10
                )
                
                print(f"Status: {verify_response.status_code}")
                verify_data = verify_response.json()
                print(f"Response: {verify_data}")
                
        else:
            print(f"❌ Failed to send email: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n" + "=" * 60)
    print("📋 NEXT STEPS:")
    print("1. Check your Gmail inbox for verification email")
    print("2. Use the OTP shown above to complete registration")
    print("3. After registration, forgot password will work")
    print("4. Both registration and forgot password emails will be sent!")

if __name__ == "__main__":
    complete_registration_test()