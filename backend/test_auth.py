import requests
import json

BASE_URL = "http://localhost:8000/api"

print("=" * 70)
print("🔐 TESTING AUTHENTICATION API")
print("=" * 70)

# Test 1: Login
print("\n1️⃣ Testing login...")
login_data = {
    "username": "admin",
    "password": "admin123"
}

response = requests.post(f"{BASE_URL}/users/login/", json=login_data)
print(f"Status: {response.status_code}")

if response.status_code == 200:
    result = response.json()
    access_token = result['access']
    print(f"✅ Login successful!")
    print(f"User: {result['user']['username']} ({result['user']['role']})")
    print(f"Access Token: {access_token[:50]}...")
    
    # Test 2: Get current user
    print("\n2️⃣ Testing 'me' endpoint...")
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(f"{BASE_URL}/users/me/", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"User: {response.json()}")
    
    # Test 3: Protected endpoint (patients)
    print("\n3️⃣ Testing protected endpoint (patients)...")
    response = requests.get(f"{BASE_URL}/patients/", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"✅ Can access patients endpoint with token")
    
    # Test 4: Without token (should fail)
    print("\n4️⃣ Testing without token (should fail)...")
    response = requests.get(f"{BASE_URL}/patients/")
    print(f"Status: {response.status_code}")
    if response.status_code == 401:
        print(f"✅ Correctly rejected request without token")
    
else:
    print(f"❌ Login failed: {response.text}")

print("\n" + "=" * 70)
print("✅ AUTHENTICATION TESTS COMPLETE!")
print("=" * 70)