import requests
import json

# Test the backend API
print("DocuChain API Test")
print("==================")
print()

# Test health endpoint
try:
    health_response = requests.get("http://localhost:5000/api/health")
    if health_response.status_code == 200:
        print(f"✅ Health Check: {health_response.json()['message']}")
    else:
        print(f"❌ Health Check Failed: {health_response.status_code}")
        exit(1)
except Exception as e:
    print(f"❌ Health Check Error: {e}")
    exit(1)

print()

# Test login credentials
test_credentials = [
    {"email": "admin@mu.ac.in", "password": "admin123", "name": "Rajesh Kumar", "role": "admin"},
    {"email": "meera.patel@mu.ac.in", "password": "faculty123", "name": "Dr. Meera Patel", "role": "faculty"},
    {"email": "aarav.sharma@student.mu.ac.in", "password": "student123", "name": "Aarav Sharma", "role": "student"},
]

print("Testing Login Credentials...")
print()

success_count = 0
total_count = len(test_credentials)

for cred in test_credentials:
    try:
        login_data = {
            "email": cred["email"],
            "password": cred["password"]
        }
        
        response = requests.post(
            "http://localhost:5000/api/auth/login",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                print(f"✅ Login successful: {cred['name']} ({cred['role']})")
                success_count += 1
            else:
                print(f"❌ Login failed: {cred['name']} - {result.get('message', 'Unknown error')}")
        else:
            print(f"❌ Login error: {cred['name']} - HTTP {response.status_code}")
            if response.text:
                print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Login exception: {cred['name']} - {e}")

print()
print("Test Results:")
print("=============")
print(f"Successful logins: {success_count}/{total_count}")

if success_count == total_count:
    print()
    print("🎉 ALL TESTS PASSED!")
    print("Your DocuChain authentication system is working perfectly!")
    print()
    print("Frontend Ready:")
    print("1. Start frontend: cd frontend && npm run dev")
    print("2. Open http://localhost:5173") 
    print("3. Login with any of the tested credentials")
else:
    print()
    print("⚠️  Some tests failed. Check the backend logs for errors.")

print()