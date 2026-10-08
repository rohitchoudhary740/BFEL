from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from permissions import (
    IsActiveBfelUser,
    IsAdminRole,
    IsDealerRole,
    IsDistributorRole,
    IsSalesAgentRole,
    IsAccountsRole,
    IsLoadingOperatorRole,
)
from services.live import OperationalLiveUpdateService


class AdminCommandCenterView(APIView):
    """
    Central Admin operational command center endpoint.
    Strictly protected by IsAdminRole: Any non-admin role (e.g. Dealer) receives 403 Forbidden.
    GET /api/v1/admin/command-center/
    """
    permission_classes = [IsActiveBfelUser, IsAdminRole]

    def get(self, request):
        live_data = OperationalLiveUpdateService.get_admin_live_stream()
        return Response({
            "workspace": "admin",
            "message": "Welcome to Central Admin Command Center.",
            "operator": request.user.get_full_name() or request.user.username,
            "kpis": live_data.get('kpis', {}),
            "events": live_data.get('events', []),
            "timestamp": live_data.get('timestamp'),
        }, status=status.HTTP_200_OK)


class DealerWorkspaceView(APIView):
    """
    Dealer dashboard feed ordering & tracking endpoint.
    GET /api/v1/dealer/workspace/
    """
    permission_classes = [IsActiveBfelUser, IsDealerRole]

    def get(self, request):
        live_data = OperationalLiveUpdateService.get_dealer_live_dashboard(request.user)
        return Response({
            "workspace": "dealer",
            "message": "Welcome to Dealer Workspace.",
            "dealer": request.user.get_full_name() or request.user.username,
            "dealer_info": live_data.get('dealer'),
            "active_orders": live_data.get('active_orders', []),
            "pending_payments": live_data.get('pending_payment_orders', []),
            "in_transit_dispatches": live_data.get('in_transit_dispatches', []),
            "claims": live_data.get('claims', []),
            "counts": live_data.get('counts', {}),
        }, status=status.HTTP_200_OK)


class DistributorWorkspaceView(APIView):
    """
    Distributor wallet and allocations workspace endpoint.
    GET /api/v1/distributor/workspace/
    """
    permission_classes = [IsActiveBfelUser, IsDistributorRole]

    def get(self, request):
        live_data = OperationalLiveUpdateService.get_distributor_live_dashboard(request.user)
        return Response({
            "workspace": "distributor",
            "message": "Welcome to Distributor Wholesale Hub.",
            "distributor": request.user.get_full_name() or request.user.username,
            "wallet": live_data.get('wallet'),
            "recent_ledger": live_data.get('recent_ledger', []),
            "dealer_orders": live_data.get('dealer_orders', []),
            "claims": live_data.get('claims', []),
        }, status=status.HTTP_200_OK)


class SalesAgentWorkspaceView(APIView):
    """
    Field sales agent territory and check-in endpoint.
    GET /api/v1/sales/workspace/
    """
    permission_classes = [IsActiveBfelUser, IsSalesAgentRole]

    def get(self, request):
        live_data = OperationalLiveUpdateService.get_role_dashboard_snapshot(request.user)
        return Response({
            "workspace": "sales_agent",
            "message": "Welcome to Field Sales Agent Workspace.",
            "agent": request.user.get_full_name() or request.user.username,
            "assigned_dealers_count": live_data.get('assigned_dealers_count', 0),
            "active_orders": live_data.get('active_orders', []),
        }, status=status.HTTP_200_OK)


class AccountsWorkspaceView(APIView):
    """
    Central plant accounts payment verification workspace endpoint.
    GET /api/v1/accounts/workspace/
    """
    permission_classes = [IsActiveBfelUser, IsAccountsRole]

    def get(self, request):
        live_data = OperationalLiveUpdateService.get_accounts_live()
        return Response({
            "workspace": "accounts",
            "message": "Welcome to Accounts & Finance Desk.",
            "officer": request.user.get_full_name() or request.user.username,
            "pending_payments": live_data.get('pending_payments', []),
            "recently_verified": live_data.get('recently_verified', []),
            "pending_claims": live_data.get('pending_claims', []),
            "counts": live_data.get('counts', {}),
        }, status=status.HTTP_200_OK)


class LoadingWorkspaceView(APIView):
    """
    Weighbridge & dispatch bay loading terminal endpoint.
    GET /api/v1/loading/workspace/
    """
    permission_classes = [IsActiveBfelUser, IsLoadingOperatorRole]

    def get(self, request):
        live_data = OperationalLiveUpdateService.get_loading_queue()
        return Response({
            "workspace": "loading_operator",
            "message": "Welcome to Plant Loading Terminal.",
            "operator": request.user.get_full_name() or request.user.username,
            "queued_orders": live_data.get('queued_orders', []),
            "active_sessions": live_data.get('active_sessions', []),
            "awaiting_gate_pass": live_data.get('awaiting_gate_pass', []),
            "ready_for_dispatch": live_data.get('ready_for_dispatch', []),
            "counts": live_data.get('counts', {}),
        }, status=status.HTTP_200_OK)
