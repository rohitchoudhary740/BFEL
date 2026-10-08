from rest_framework.permissions import BasePermission
from apps.users.models import Role

class IsActiveBfelUser(BasePermission):
    """
    Requires the user to be authenticated and have an 'active' account status.
    """
    message = "Your account is not active or is pending administrative approval."

    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            getattr(request.user, 'status', None) == 'active'
        )

class IsAdminRole(BasePermission):
    """
    Allows access only to Central Command Administrators.
    """
    message = "Administrator privileges are required to perform this action."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.is_staff or request.user.is_superuser:
            return True
        user_role = getattr(request.user, 'role', None)
        return bool(user_role and user_role.code == Role.Code.ADMIN)

class IsDealerRole(BasePermission):
    """
    Allows access to authorized Tier-1 Dealers.
    """
    message = "Dealer workspace privileges required."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        user_role = getattr(request.user, 'role', None)
        return bool(user_role and (user_role.code == Role.Code.DEALER or user_role.code == Role.Code.ADMIN))

class IsDistributorRole(BasePermission):
    """
    Allows access to authorized Regional Distributors.
    """
    message = "Distributor workspace privileges required."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        user_role = getattr(request.user, 'role', None)
        return bool(user_role and (user_role.code == Role.Code.DISTRIBUTOR or user_role.code == Role.Code.ADMIN))

class IsSalesAgentRole(BasePermission):
    """
    Allows access to authorized Field Sales Agents.
    """
    message = "Sales agent workspace privileges required."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        user_role = getattr(request.user, 'role', None)
        return bool(user_role and (user_role.code == Role.Code.SALES_AGENT or user_role.code == Role.Code.ADMIN))

class IsAccountsRole(BasePermission):
    """
    Allows access to Accounts and Finance Desk personnel.
    """
    message = "Accounts Desk clearance required."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        user_role = getattr(request.user, 'role', None)
        return bool(user_role and (user_role.code == Role.Code.ACCOUNTS or user_role.code == Role.Code.ADMIN))

class IsLoadingOperatorRole(BasePermission):
    """
    Allows access to Weighbridge Terminal & Plant Loading Operators.
    """
    message = "Loading Terminal clearance required."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        user_role = getattr(request.user, 'role', None)
        return bool(user_role and (user_role.code == Role.Code.LOADING_OPERATOR or user_role.code == Role.Code.ADMIN))
