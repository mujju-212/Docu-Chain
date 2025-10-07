"""
Test the REST API endpoints for email functionality
"""
import requests
import json

def test_email_api_endpoints():
    """Test all email API endpoints"""
    base_url = "http://localhost:5000/auth/test-email"
    
    print("🧪 Testing DocuChain Email API Endpoints")
    print("=" * 50)
    
    # Test different email types
    test_cases = [
        {
            "type": "forgot-password",
            "data": {"email": "delivered@resend.dev"}
        },
        {
            "type": "verification", 
            "data": {"email": "delivered@resend.dev"}
        },
        {
            "type": "institution",
            "data": {"email": "delivered@resend.dev"}
        },
        {
            "type": "welcome",
            "data": {"email": "delivered@resend.dev", "role": "student"}
        },
        {
            "type": "welcome",
            "data": {"email": "delivered@resend.dev", "role": "faculty"}
        },
        {
            "type": "welcome", 
            "data": {"email": "delivered@resend.dev", "role": "admin"}
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        email_type = test_case["type"]
        data = test_case["data"]
        
        print(f"\n{i}. Testing {email_type} email API...")
        
        try:
            response = requests.post(
                f"{base_url}/{email_type}",
                json=data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"   ✅ Success: {result['message']}")
                if 'email_id' in result:
                    print(f"   📧 Email ID: {result['email_id']}")
            else:
                print(f"   ❌ Failed: {response.status_code} - {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("   ❌ Connection failed - Flask server may not be running")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
    
    print("\n=" * 50)
    print("🎉 API endpoint testing completed!")

if __name__ == "__main__":
    test_email_api_endpoints()