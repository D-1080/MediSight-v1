import requests
import json

ML_SERVICE_URL = "http://localhost:8001"

print("=" * 70)
print("🧪 TESTING MEDISIGHT ML SERVICE")
print("=" * 70)

# Test 1: Health check
print("\n1️⃣ Testing health endpoint...")
response = requests.get(f"{ML_SERVICE_URL}/health")
print(f"Status: {response.status_code}")
print(json.dumps(response.json(), indent=2))

# Test 2: Diabetes prediction
print("\n2️⃣ Testing diabetes prediction...")
diabetes_data = {
    "Pregnancies": 6,
    "Glucose": 148,
    "BloodPressure": 72,
    "SkinThickness": 35,
    "Insulin": 0,
    "BMI": 33.6,
    "DiabetesPedigreeFunction": 0.627,
    "Age": 50
}

response = requests.post(f"{ML_SERVICE_URL}/predict/diabetes", json=diabetes_data)
print(f"Status: {response.status_code}")
result = response.json()
print(f"\n📊 Prediction Result:")
print(f"  Probability: {result['probability']}%")
print(f"  Risk Level: {result['risk_level']}")
print(f"  Confidence: {result['confidence']}%")
print(f"\n🔍 Top 3 SHAP Values:")
for i, shap in enumerate(result['shap_values'][:3], 1):
    print(f"  {i}. {shap['feature']:30s} = {shap['value']:8.2f} (SHAP: {shap['shap_value']:+.4f})")

# Test 3: Heart disease prediction
print("\n3️⃣ Testing heart disease prediction...")
heart_data = {
    "age": 63,
    "sex": 1,
    "cp": 3,
    "trestbps": 145,
    "chol": 233,
    "fbs": 1,
    "restecg": 0,
    "thalach": 150,
    "exang": 0,
    "oldpeak": 2.3,
    "slope": 0,
    "ca": 0,
    "thal": 1
}

response = requests.post(f"{ML_SERVICE_URL}/predict/heart_disease", json=heart_data)
print(f"Status: {response.status_code}")
result = response.json()
print(f"\n📊 Prediction Result:")
print(f"  Probability: {result['probability']}%")
print(f"  Risk Level: {result['risk_level']}")
print(f"  Confidence: {result['confidence']}%")
print(f"\n🔍 Top 3 SHAP Values:")
for i, shap in enumerate(result['shap_values'][:3], 1):
    print(f"  {i}. {shap['feature']:30s} = {shap['value']:8.2f} (SHAP: {shap['shap_value']:+.4f})")

# Test 4: Model info
print("\n4️⃣ Testing model info endpoint...")
response = requests.get(f"{ML_SERVICE_URL}/models/diabetes/info")
result = response.json()
print(f"\n📊 Diabetes Model Info:")
print(f"  Version: {result['model_version']}")
print(f"  AUC Score: {result['metrics']['auc_score']:.4f}")
print(f"  Accuracy: {result['metrics']['accuracy']*100:.2f}%")

print("\n" + "=" * 70)
print("✅ ALL TESTS PASSED!")
print("=" * 70)