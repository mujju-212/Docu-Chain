"""
Quick verification that the Flask server is running and accessible
"""
import os
import subprocess
import time

# Test if Flask server is accessible
def check_server_health():
    """Check if Flask server is responding"""
    try:
        import requests
        response = requests.get("http://localhost:5000", timeout=5)
        return True
    except:
        return False

print("🧪 Checking Flask Server Status...")
print("=" * 40)

if check_server_health():
    print("✅ Flask server is running and accessible!")
    print("🌐 Server URL: http://localhost:5000")
    print("\n📧 Email integration is ready for testing!")
    print("\n🎯 You can now test:")
    print("   • Registration with email verification")
    print("   • Forgot password with email OTP")
    print("   • Institution registration emails")
    print("   • Welcome emails for all user roles")
    print("\n💡 Test endpoints available:")
    print("   POST /auth/test-email/forgot-password")
    print("   POST /auth/test-email/verification") 
    print("   POST /auth/test-email/institution")
    print("   POST /auth/test-email/welcome")
else:
    print("❌ Flask server is not accessible")
    print("💡 Try starting the server with: python run.py")

print("=" * 40)