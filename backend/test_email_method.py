"""
Test the specific EmailService method that's causing 500 error
"""
import sys
sys.path.append('.')
from app.services.email_service import EmailService

def test_forgot_password_email_method():
    """Test the forgot password email method directly"""
    print("🧪 Testing EmailService.send_forgot_password_email method")
    print("=" * 60)
    
    email = "aarav.sharma@student.mu.ac.in"
    otp = "123456"
    user_name = "Aarav"
    
    print(f"📧 Email: {email}")
    print(f"🔑 OTP: {otp}")
    print(f"👤 Name: {user_name}")
    print("-" * 40)
    
    try:
        print("📤 Calling EmailService.send_forgot_password_email...")
        success, response = EmailService.send_forgot_password_email(email, otp, user_name)
        
        print(f"✅ Success: {success}")
        print(f"📋 Response: {response}")
        
        if success:
            print("🎉 Email method works correctly!")
            print("📧 Forgot password email should be sent")
        else:
            print("❌ Email method failed")
            print(f"🔍 Error: {response}")
            
    except Exception as e:
        print(f"❌ EXCEPTION in email method: {str(e)}")
        print(f"🔍 Exception type: {type(e).__name__}")
        import traceback
        print(f"📋 Full traceback:")
        traceback.print_exc()

if __name__ == "__main__":
    test_forgot_password_email_method()