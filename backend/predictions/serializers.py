from rest_framework import serializers
from .models import Prediction
from patients.serializers import PatientListSerializer

class PredictionSerializer(serializers.ModelSerializer):
    patient_details = PatientListSerializer(source='patient', read_only=True)
    
    class Meta:
        model = Prediction
        fields = [
            'id', 'patient', 'patient_details', 'disease_type',
            'probability', 'risk_level', 'confidence', 'input_features',
            'shap_values', 'status', 'notes', 'model_version',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

class PredictionCreateSerializer(serializers.Serializer):
    """Serializer for creating new predictions"""
    patient_id = serializers.IntegerField()
    disease_type = serializers.ChoiceField(choices=Prediction.DISEASE_CHOICES)
    input_features = serializers.JSONField()