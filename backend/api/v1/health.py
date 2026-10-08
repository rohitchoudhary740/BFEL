from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from services.health import HealthService

class HealthCheckView(APIView):
    """
    Health check endpoint returning platform readiness.
    GET /api/v1/health/
    """
    permission_classes = []

    def get(self, request, *args, **kwargs):
        health_data = HealthService.get_health_status()
        return Response(health_data, status=status.HTTP_200_OK)
