import pytest
from django.db import connection
from services.health import HealthService

@pytest.mark.django_db
def test_db_connection_cursor():
    """Verify that database connection is active and can execute queries."""
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1;")
        row = cursor.fetchone()
        assert row is not None
        assert row[0] == 1

@pytest.mark.django_db
def test_health_service_database_check():
    """Verify that HealthService.check_database() returns True when DB is connected."""
    is_connected = HealthService.check_database()
    assert is_connected is True
