"""
URL configuration for medisight_api project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from patients.views import PatientViewSet
from predictions.views import PredictionViewSet
from users.views import UserViewSet
from rest_framework_simplejwt.views import TokenRefreshView
from django.http import JsonResponse

# Create router
router = DefaultRouter()
router.register(r'patients', PatientViewSet, basename='patient')
router.register(r'predictions', PredictionViewSet, basename='prediction')
router.register(r'users', UserViewSet, basename='user')

def api_root(request):
    return JsonResponse({
        "service": "MediSight API",
        "version": "1.0.0",
        "status": "online",
        "endpoints": {
            "api": "/api/",
            "admin": "/admin/",
            "token_refresh": "/api/token/refresh/",
        }
    })

urlpatterns = [
    path('', api_root),
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]