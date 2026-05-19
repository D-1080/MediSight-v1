from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Prediction
from .serializers import PredictionSerializer, PredictionCreateSerializer
from patients.models import Patient
import requests
import logging

logger = logging.getLogger(__name__)

# ML Service URL
ML_SERVICE_URL = "http://localhost:8001"

class PredictionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Prediction CRUD operations with Real ML Integration
    """
    serializer_class = PredictionSerializer

    def get_queryset(self):
        """
        Role-based queryset:
        - ADMIN/DOCTOR/ANALYST: all predictions
        - PATIENT: only predictions linked to their own Patient record
        """
        user = self.request.user
        qs = Prediction.objects.select_related('patient').all()

        # ?mine=true filter (used by patient frontend)
        mine = self.request.query_params.get('mine', 'false').lower() == 'true'

        if hasattr(user, 'role') and user.role == 'PATIENT' or mine:
            # Match predictions where patient email = user email
            qs = qs.filter(patient__email=user.email)

        return qs.order_by('-created_at')
    
    @action(detail=False, methods=['post'])
    def create_prediction(self, request):
        """
        Create a new prediction using Real ML Models
        """
        serializer = PredictionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        patient_id = serializer.validated_data['patient_id']
        disease_type = serializer.validated_data['disease_type']
        input_features = serializer.validated_data['input_features']
        
        # Get patient
        try:
            patient = Patient.objects.get(id=patient_id)
        except Patient.DoesNotExist:
            return Response(
                {'error': 'Patient not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Call ML Service based on disease type
        try:
            if disease_type == 'DIABETES':
                ml_response = requests.post(
                    f"{ML_SERVICE_URL}/predict/diabetes",
                    json=input_features,
                    timeout=10
                )
            elif disease_type == 'HEART':
                ml_response = requests.post(
                    f"{ML_SERVICE_URL}/predict/heart_disease",
                    json=input_features,
                    timeout=10
                )
            elif disease_type == 'STROKE':
                ml_response = requests.post(
                    f"{ML_SERVICE_URL}/predict/stroke",
                    json=input_features,
                    timeout=10
                )
            elif disease_type == 'CKD':
                ml_response = requests.post(
                    f"{ML_SERVICE_URL}/predict/ckd",
                    json=input_features,
                    timeout=10
                )
            else:
                return Response(
                    {'error': f'Disease type {disease_type} not yet supported'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if ML service responded successfully
            if ml_response.status_code != 200:
                logger.error(f"ML Service error: {ml_response.text}")
                return Response(
                    {'error': 'ML service failed to generate prediction'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Parse ML service response
            ml_result = ml_response.json()
            
            # Create prediction record
            prediction = Prediction.objects.create(
                patient=patient,
                disease_type=disease_type,
                probability=ml_result['probability'],
                risk_level=ml_result['risk_level'],
                confidence=ml_result['confidence'],
                input_features=input_features,
                shap_values=[
                    {
                        'feature': shap['feature'],
                        'value': shap['value'],
                        'shap_value': shap['shap_value']
                    }
                    for shap in ml_result['shap_values']
                ],
                model_version=ml_result['model_version'],
                status='PENDING'
            )
            
            logger.info(f"Created prediction {prediction.id} for patient {patient.patient_id}")
            
            result_serializer = PredictionSerializer(prediction)
            return Response(result_serializer.data, status=status.HTTP_201_CREATED)
            
        except requests.exceptions.ConnectionError:
            logger.error("Could not connect to ML service")
            return Response(
                {'error': 'ML service is not available. Please ensure it is running on port 8001.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except requests.exceptions.Timeout:
            logger.error("ML service request timed out")
            return Response(
                {'error': 'ML service request timed out'},
                status=status.HTTP_504_GATEWAY_TIMEOUT
            )
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            return Response(
                {'error': f'Failed to create prediction: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get prediction statistics"""
        from django.utils import timezone
        from datetime import timedelta
        
        today = timezone.now().date()
        predictions_today = Prediction.objects.filter(
            created_at__date=today
        ).count()
        
        return Response({
            'predictions_today': predictions_today,
            'total_predictions': Prediction.objects.count(),
        })
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update prediction status"""
        prediction = self.get_object()
        new_status = request.data.get('status')
        notes = request.data.get('notes', '')
        
        if new_status not in dict(Prediction.STATUS_CHOICES):
            return Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        prediction.status = new_status
        prediction.notes = notes
        prediction.save()
        
        serializer = PredictionSerializer(prediction)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def ml_service_status(self, request):
        """Check ML service availability"""
        try:
            response = requests.get(f"{ML_SERVICE_URL}/health", timeout=5)
            if response.status_code == 200:
                return Response({
                    'ml_service': 'online',
                    'details': response.json()
                })
            else:
                return Response({
                    'ml_service': 'error',
                    'status_code': response.status_code
                })
        except requests.exceptions.ConnectionError:
            return Response({
                'ml_service': 'offline',
                'message': 'Could not connect to ML service on port 8001'
            })
        except Exception as e:
            return Response({
                'ml_service': 'error',
                'message': str(e)
            })