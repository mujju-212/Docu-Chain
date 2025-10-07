"""
Quick email test - Replace YOUR_EMAIL with your actual email address
"""
import requests
import json

# 🔥 REPLACE THIS WITH YOUR ACTUAL EMAIL ADDRESS 🔥
YOUR_EMAIL = "mujju718263@gmail.com"  # ← Your Gmail address

print(f"🧪 Testing registration email for: {YOUR_EMAIL}")
print("=" * 50)

try:
    response = requests.post(
        "http://localhost:5000/api/auth/send-email-verification",
        json={"email": YOUR_EMAIL},
        headers={"Content-Type": "application/json"},
        timeout=10
    )
    
    print(f"📊 Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print("✅ SUCCESS! Email should be sent")
        print(f"📧 Message: {data.get('message')}")
        
        # Show OTP in development mode
        if 'otp' in data:
            print(f"🔑 OTP (dev mode): {data['otp']}")
            
        print(f"\n💌 CHECK YOUR EMAIL INBOX: {YOUR_EMAIL}")
        print("📁 Also check SPAM/JUNK folder")
        print("⏰ Email may take 1-2 minutes to arrive")
        
    elif response.status_code == 400:
        data = response.json()
        print(f"⚠️  Error: {data.get('message')}")
        if "already registered" in data.get('message', ''):
            print("💡 Try with a different email or use forgot password")
    else:
        print(f"❌ Failed: {response.text}")
        
except Exception as e:
    print(f"❌ Connection Error: {e}")
    print("💡 Make sure Flask server is running")

print("\n" + "=" * 50)