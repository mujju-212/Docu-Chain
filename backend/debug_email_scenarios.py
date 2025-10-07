"""
Test both emails to debug the 500 error vs 404 error
"""
import requests
import json

def test_both_email_scenarios():
    """Test registered vs unregistered email scenarios"""
    registered_email = "aarav.sharma@student.mu.ac.in"  # In database
    unregistered_email = "mujju718263@gmail.com"  # Not in database
    base_url = "http://localhost:5000/api"
    
    print("🧪 Testing Both Email Scenarios")
    print("=" * 60)
    
    # Test 1: Registered email (should work and send email)
    print(f"✅ Test 1: REGISTERED email - {registered_email}")
    print("-" * 40)
    try:
        response = requests.post(
            f"{base_url}/auth/forgot-password",
            json={"email": registered_email},
            headers={"Content-Type": "application/json"},
            timeout=15
        )
        
        print(f"📊 Status Code: {response.status_code}")
        print(f"📋 Response Headers: {dict(response.headers)}")
        
        try:
            data = response.json()
            print(f"📝 Response: {json.dumps(data, indent=2)}")
        except:
            print(f"📝 Raw Response: {response.text}")
            
        if response.status_code == 200:
            print("🎉 SUCCESS - Forgot password email should be sent!")
        elif response.status_code == 500:
            print("❌ INTERNAL SERVER ERROR - Need to check server logs")
        else:
            print(f"⚠️  Unexpected status: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Request Error: {e}")
    
    print("\n" + "=" * 60)
    
    # Test 2: Unregistered email (should return 404)
    print(f"❌ Test 2: UNREGISTERED email - {unregistered_email}")
    print("-" * 40)
    try:
        response = requests.post(
            f"{base_url}/auth/forgot-password",
            json={"email": unregistered_email},
            headers={"Content-Type": "application/json"},
            timeout=15
        )
        
        print(f"📊 Status Code: {response.status_code}")
        
        try:
            data = response.json()
            print(f"📝 Response: {json.dumps(data, indent=2)}")
        except:
            print(f"📝 Raw Response: {response.text}")
            
        if response.status_code == 404:
            print("✅ CORRECT - Should show 'not registered' message")
        else:
            print(f"⚠️  Unexpected status: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Request Error: {e}")
    
    print("\n" + "=" * 60)
    print("🔍 ANALYSIS:")
    print("1. Registered email should return 200 and send email")
    print("2. Unregistered email should return 404 with error message")
    print("3. If registered email returns 500, there's a server bug")
    print("4. Check Flask server terminal for detailed error logs")

if __name__ == "__main__":
    test_both_email_scenarios()