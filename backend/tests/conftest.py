import os
import pytest
from rest_framework.test import APIClient

@pytest.fixture
def api_client():
    """Returns a DRF unauthenticated API test client."""
    return APIClient()
