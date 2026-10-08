from django.db import connection
from typing import Dict, Any

class HealthService:
    """
    Service layer class handling platform health verification and readiness checks.
    Encapsulates business and system integrity validation outside view controllers.
    """

    @staticmethod
    def get_health_status() -> Dict[str, str]:
        """
        Returns basic operational health status as required by specification.
        """
        return {"status": "ok"}

    @staticmethod
    def check_database() -> bool:
        """
        Validates active connection to the database.
        """
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1;")
                row = cursor.fetchone()
                return row is not None and row[0] == 1
        except Exception:
            return False

    @staticmethod
    def get_detailed_health() -> Dict[str, Any]:
        """
        Returns detailed diagnostic information for internal operations.
        """
        db_healthy = HealthService.check_database()
        return {
            "status": "ok" if db_healthy else "degraded",
            "service": "BFEL FLOW Backend",
            "version": "1.0.0",
            "database": "connected" if db_healthy else "unavailable",
        }
