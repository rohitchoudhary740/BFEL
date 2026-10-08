import pytest
from django.apps import apps
from django.conf import settings

@pytest.mark.django_db
def test_django_starts():
    """Verify that Django initializes and apps are properly loaded."""
    assert apps.ready is True
    assert settings.SECRET_KEY is not None

def test_bfel_apps_loaded():
    """Verify that all 10 domain apps are registered in INSTALLED_APPS."""
    expected_apps = [
        'apps.accounts',
        'apps.users',
        'apps.dealers',
        'apps.distributors',
        'apps.products',
        'apps.orders',
        'apps.payments',
        'apps.loading',
        'apps.dispatch',
        'apps.claims',
    ]
    for app_name in expected_apps:
        assert app_name in settings.INSTALLED_APPS, f"{app_name} not found in INSTALLED_APPS"
        assert apps.is_installed(app_name), f"{app_name} is not installed in Django registry"
