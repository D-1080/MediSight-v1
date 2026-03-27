from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class Patient(models.Model):
    """Patient model for storing patient information"""
    
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    ]
    
    # Basic Information
    patient_id = models.CharField(max_length=50, unique=True, editable=False)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    
    # Contact Information
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    
    # Medical Information
    blood_group = models.CharField(max_length=5, blank=True, null=True)
    medical_history = models.TextField(blank=True, null=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Patient'
        verbose_name_plural = 'Patients'
    
    def __str__(self):
        return f"{self.patient_id} - {self.first_name} {self.last_name}"
    
    def save(self, *args, **kwargs):
        # Auto-generate patient ID if not exists
        if not self.patient_id:
            from datetime import datetime
            year = datetime.now().year
            # Get last patient ID
            last_patient = Patient.objects.filter(
                patient_id__startswith=f'PT-{year}'
            ).order_by('-patient_id').first()
            
            if last_patient:
                last_num = int(last_patient.patient_id.split('-')[-1])
                new_num = last_num + 1
            else:
                new_num = 1
            
            self.patient_id = f'PT-{year}-{new_num:04d}'
        
        super().save(*args, **kwargs)
    
    @property
    def age(self):
        """Calculate age from date of birth"""
        from datetime import date
        today = date.today()
        return today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"