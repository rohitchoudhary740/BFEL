import pytest
from django.urls import reverse
from services.health import HealthService

def test_health_service_direct():
    """Verify that HealthService.get_health_status() returns status ok."""
    status_data = HealthService.get_health_status()
    assert status_data == {"status": "ok"}

@pytest.mark.django_db
def test_health_api_endpoint(api_client):
    """
    Verify GET /api/v1/health/ returns status 200 and {"status": "ok"}.
    """
    url = reverse('v1:health')
    assert url == '/api/v1/health/'
    response = api_client.get(url)
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
