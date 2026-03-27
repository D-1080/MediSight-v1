import requests
import json

# Test diabetes prediction
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

print("Testing Diabetes Prediction...")
response = requests.post("http://localhost:8000/predict/diabetes", json=diabetes_data)
print(json.dumps(response.json(), indent=2))

print("\n" + "="*50 + "\n")

# Test heart disease prediction
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

print("Testing Heart Disease Prediction...")
response = requests.post("http://localhost:8000/predict/heart_disease", json=heart_data)
print(json.dumps(response.json(), indent=2))