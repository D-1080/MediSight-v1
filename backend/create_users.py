import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'medisight_api.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

users_data = [
    {
        'username': 'doctor1',
        'email': 'doctor1@medisight.com',
        'password': 'doctor123',
        'first_name': 'Dr. Sarah',
        'last_name': 'Johnson',
        'role': 'DOCTOR',
    },
    {
        'username': 'analyst1',
        'email': 'analyst1@medisight.com',
        'password': 'analyst123',
        'first_name': 'John',
        'last_name': 'Data',
        'role': 'ANALYST',
    },
]

print("Creating sample users...")

for user_data in users_data:
    password = user_data.pop('password')
    user, created = User.objects.get_or_create(
        username=user_data['username'],
        defaults=user_data
    )
    if created:
        user.set_password(password)
        user.save()
        print(f"✅ Created user: {user.username} ({user.role})")
    else:
        print(f"⚠️  User already exists: {user.username}")

print("\n✅ Sample users created!")
print("\nLogin credentials:")
print("Admin: admin / admin123")
print("Doctor: doctor1 / doctor123")
print("Analyst: analyst1 / analyst123")