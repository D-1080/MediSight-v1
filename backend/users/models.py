from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    """
    Custom User model with role-based access
    """
    
    ROLE_CHOICES = [
        ('DOCTOR', 'Doctor'),
        ('ADMIN', 'Administrator'),
        ('ANALYST', 'Data Analyst'),
        ('PATIENT', 'Patient'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='DOCTOR')
    phone = models.CharField(max_length=20, blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profiles/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"
    
    @property
    def is_doctor(self):
        return self.role == 'DOCTOR'
    
    @property
    def is_admin(self):
        return self.role == 'ADMIN'
    
    @property
    def is_analyst(self):
        return self.role == 'ANALYST'