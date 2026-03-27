import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medisight_api.settings')
django.setup()

from patients.models import Patient
from predictions.models import Prediction
from datetime import date, timedelta
import random

print("Creating test data...")

# Create sample patients
patients_data = [
    {
        'first_name': 'John',
        'last_name': 'Doe',
        'date_of_birth': date(1965, 5, 15),
        'gender': 'M',
        'email': 'john.doe@example.com',
        'phone': '+1-555-0101',
    },
    {
        'first_name': 'Sarah',
        'last_name': 'Smith',
        'date_of_birth': date(1978, 8, 22),
        'gender': 'F',
        'email': 'sarah.smith@example.com',
        'phone': '+1-555-0102',
    },
    {
        'first_name': 'Michael',
        'last_name': 'Johnson',
        'date_of_birth': date(1962, 3, 10),
        'gender': 'M',
        'email': 'michael.j@example.com',
        'phone': '+1-555-0103',
    },
    {
        'first_name': 'Emily',
        'last_name': 'Brown',
        'date_of_birth': date(1972, 11, 5),
        'gender': 'F',
        'email': 'emily.brown@example.com',
        'phone': '+1-555-0104',
    },
]

created_patients = []
for patient_data in patients_data:
    patient, created = Patient.objects.get_or_create(
        email=patient_data['email'],
        defaults=patient_data
    )
    created_patients.append(patient)
    print(f"{'Created' if created else 'Found'} patient: {patient.full_name}")

# Create sample predictions
disease_types = ['DIABETES', 'HEART', 'STROKE', 'CKD']
risk_levels = ['LOW', 'MEDIUM', 'HIGH']

for patient in created_patients:
    # Create 2-3 predictions per patient
    num_predictions = random.randint(2, 3)
    
    for i in range(num_predictions):
        disease = random.choice(disease_types)
        probability = random.uniform(20, 85)
        
        if probability >= 70:
            risk = 'HIGH'
        elif probability >= 40:
            risk = 'MEDIUM'
        else:
            risk = 'LOW'
        
        # Mock input features
        if disease == 'DIABETES':
            input_features = {
                'Glucose': random.randint(80, 200),
                'BMI': round(random.uniform(18, 45), 1),
                'Age': patient.age,
                'BloodPressure': random.randint(60, 120),
            }
        else:
            input_features = {
                'age': patient.age,
                'feature1': random.randint(50, 150),
                'feature2': round(random.uniform(0, 10), 2),
            }
        
        # Mock SHAP values
        shap_values = [
            {
                'feature': key,
                'value': value,
                'shap_value': round(random.uniform(-0.5, 0.5), 3)
            }
            for key, value in input_features.items()
        ]
        
        prediction = Prediction.objects.create(
            patient=patient,
            disease_type=disease,
            probability=round(probability, 2),
            risk_level=risk,
            confidence=round(random.uniform(75, 95), 2),
            input_features=input_features,
            shap_values=shap_values,
            status=random.choice(['PENDING', 'REVIEWED']),
            model_version='v1.0.0-mock'
        )
        print(f"  Created prediction: {disease} - {risk} risk ({probability:.1f}%)")

print("\n✅ Test data created successfully!")
print(f"Total patients: {Patient.objects.count()}")
print(f"Total predictions: {Prediction.objects.count()}")