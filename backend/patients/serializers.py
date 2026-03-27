from rest_framework import serializers
from .models import Patient

class PatientSerializer(serializers.ModelSerializer):
    age = serializers.ReadOnlyField()
    full_name = serializers.ReadOnlyField()
    prediction_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Patient
        fields = [
            'id', 'patient_id', 'first_name', 'last_name', 'full_name',
            'date_of_birth', 'age', 'gender', 'email', 'phone', 'address',
            'blood_group', 'medical_history', 'created_at', 'updated_at',
            'is_active', 'prediction_count'
        ]
        read_only_fields = ['patient_id', 'created_at', 'updated_at']
    
    def get_prediction_count(self, obj):
        return obj.predictions.count()

class PatientListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing patients"""
    age = serializers.ReadOnlyField()
    prediction_count = serializers.SerializerMethodField()
    last_prediction = serializers.SerializerMethodField()
    
    class Meta:
        model = Patient
        fields = [
            'id', 'patient_id', 'first_name', 'last_name',
            'age', 'gender', 'created_at', 'prediction_count', 'last_prediction'
        ]
    
    def get_prediction_count(self, obj):
        return obj.predictions.count()
    
    def get_last_prediction(self, obj):
        last_pred = obj.predictions.first()
        if last_pred:
            return last_pred.created_at
        return None