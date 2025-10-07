"""
Test script to verify Resend email integration with DocuChain
"""
from app.services.email_service import EmailService

def test_all_emails():
    """Test all email templates"""
    print("🧪 Testing DocuChain Email Templates with Resend API")
    print("=" * 60)
    
    test_email = "delivered@resend.dev"  # Using Resend's test email
    
    # Test 1: Forgot Password Email
    print("1. Testing Forgot Password Email...")
    try:
        success, response = EmailService.send_forgot_password_email(
            email=test_email,
            otp="123456", 
            user_name="John Doe"
        )
        if success:
            print("   ✅ Forgot password email sent successfully!")
            print(f"   📧 Email ID: {response.get('id', 'N/A')}")
        else:
            print(f"   ❌ Failed: {response}")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    print()
    
    # Test 2: Registration Verification Email
    print("2. Testing Registration Verification Email...")
    try:
        success, response = EmailService.send_verification_email(
            email=test_email,
            otp="789012",
            user_name="Jane Smith",
            role="student"
        )
        if success:
            print("   ✅ Verification email sent successfully!")
            print(f"   📧 Email ID: {response.get('id', 'N/A')}")
        else:
            print(f"   ❌ Failed: {response}")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    print()
    
    # Test 3: Institution Registration Email
    print("3. Testing Institution Registration Email...")
    try:
        success, response = EmailService.send_institution_registration_email(
            admin_email=test_email,
            institution_name="Test University",
            admin_name="Dr. Admin Smith",
            admin_password="TempPass123"
        )
        if success:
            print("   ✅ Institution registration email sent successfully!")
            print(f"   📧 Email ID: {response.get('id', 'N/A')}")
        else:
            print(f"   ❌ Failed: {response}")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    print()
    
    # Test 4: Welcome Email
    print("4. Testing Welcome Email...")
    try:
        success, response = EmailService.send_welcome_email(
            email=test_email,
            user_name="Welcome User",
            role="faculty",
            institution_name="DocuChain University"
        )
        if success:
            print("   ✅ Welcome email sent successfully!")
            print(f"   📧 Email ID: {response.get('id', 'N/A')}")
        else:
            print(f"   ❌ Failed: {response}")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    print()
    print("=" * 60)
    print("🎉 Email testing completed! Check your email inbox for all templates.")

if __name__ == "__main__":
    test_all_emails()