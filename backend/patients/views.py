from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Patient
from .serializers import PatientSerializer, PatientListSerializer

class PatientViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Patient CRUD operations
    """
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PatientListSerializer
        return PatientSerializer
    
    @action(detail=True, methods=['get'])
    def predictions(self, request, pk=None):
        """Get all predictions for a patient"""
        patient = self.get_object()
        predictions = patient.predictions.all()
        
        from predictions.serializers import PredictionSerializer
        serializer = PredictionSerializer(predictions, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get patient statistics"""
        total_patients = Patient.objects.filter(is_active=True).count()
        
        from predictions.models import Prediction
        active_cases = Prediction.objects.filter(
            status='PENDING'
        ).values('patient').distinct().count()
        
        return Response({
            'total_patients': total_patients,
            'active_cases': active_cases,
        })