from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from patients.models import Patient

class Prediction(models.Model):
    """Model for storing disease predictions"""
    
    DISEASE_CHOICES = [
        ('DIABETES', 'Diabetes Type 2'),
        ('HEART', 'Heart Disease'),
        ('STROKE', 'Stroke'),
        ('CKD', 'Chronic Kidney Disease'),
    ]
    
    RISK_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
    ]
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending Review'),
        ('REVIEWED', 'Reviewed'),
        ('ARCHIVED', 'Archived'),
    ]
    
    # Relationships
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='predictions')
    
    # Prediction Details
    disease_type = models.CharField(max_length=20, choices=DISEASE_CHOICES)
    probability = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)]
    )
    risk_level = models.CharField(max_length=10, choices=RISK_CHOICES)
    confidence = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)]
    )
    
    # Input Features (stored as JSON)
    input_features = models.JSONField()
    
    # SHAP Explanation (stored as JSON)
    shap_values = models.JSONField(blank=True, null=True)
    
    # Status
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    notes = models.TextField(blank=True, null=True)
    
    # Model Information
    model_version = models.CharField(max_length=20, default='v1.0.0')
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Prediction'
        verbose_name_plural = 'Predictions'
    
    def __str__(self):
        return f"{self.patient.patient_id} - {self.disease_type} - {self.risk_level}"