from django.urls import path
from .health import HealthCheckView
from .auth import (
    LoginView,
    RequestOTPView,
    VerifyOTPView,
    CurrentUserView,
    DealerSignupView,
    SalesAgentSignupView,
    DistributorRequestView,
    AdminSignupBlockView,
)
from .workspaces import (
    AdminCommandCenterView,
    DealerWorkspaceView,
    DistributorWorkspaceView,
    SalesAgentWorkspaceView,
    AccountsWorkspaceView,
    LoadingWorkspaceView,
)
from .orders import (
    OrderListCreateView,
    OrderDetailView,
    OrderSubmitView,
    OrderCancelView,
    OrderCalculateWeightView,
)
from .payments import (
    PaymentListCreateView,
    PaymentDetailView,
    PaymentVerifyView,
    PaymentRejectView,
)
from .wallets import (
    DistributorWalletDetailView,
    WalletLedgerView,
    WalletCreditView,
)
from .loading import (
    LoadingSessionListCreateView,
    LoadingSessionAssignView,
    LoadingSessionDetailView,
    LoadingStartView,
    LoadingBagCountView,
    WeighbridgeRecordView,
    LoadingCompleteView,
    GatePassGenerateView,
    AssetListView,
)

from .dispatch import (
    DispatchListCreateView,
    DispatchDetailView,
)
from .claims import (
    ClaimListCreateView,
    ClaimDetailView,
    ClaimEvidenceUploadView,
    ClaimReviewView,
)
from .live import (
    LiveOrderDetailView,
    LiveDashboardView,
    LiveEventsStreamView,
    LoadingQueueLiveView,
)
from .products import ProductListView
from .dealers import DealerListView

app_name = 'api_v1'

urlpatterns = [
    # System Health
    path('health/', HealthCheckView.as_view(), name='health'),

    # Master Catalog & Profiles
    path('products/', ProductListView.as_view(), name='product_list'),
    path('dealers/', DealerListView.as_view(), name='dealer_list'),

    # Authentication & Session
    path('auth/login/', LoginView.as_view(), name='auth_login'),
    path('auth/otp/request/', RequestOTPView.as_view(), name='auth_otp_request'),
    path('auth/otp/verify/', VerifyOTPView.as_view(), name='auth_otp_verify'),
    path('auth/me/', CurrentUserView.as_view(), name='auth_me'),

    # Partner Onboarding (Public Signups)
    path('auth/signup/dealer/', DealerSignupView.as_view(), name='signup_dealer'),
    path('auth/signup/sales-agent/', SalesAgentSignupView.as_view(), name='signup_sales_agent'),
    path('auth/signup/distributor/', DistributorRequestView.as_view(), name='signup_distributor'),
    path('auth/signup/admin/', AdminSignupBlockView.as_view(), name='signup_admin_blocked'),

    # Role-Protected Workspaces
    path('admin/command-center/', AdminCommandCenterView.as_view(), name='admin_command_center'),
    path('dealer/workspace/', DealerWorkspaceView.as_view(), name='dealer_workspace'),
    path('distributor/workspace/', DistributorWorkspaceView.as_view(), name='distributor_workspace'),
    path('sales/workspace/', SalesAgentWorkspaceView.as_view(), name='sales_workspace'),
    path('accounts/workspace/', AccountsWorkspaceView.as_view(), name='accounts_workspace'),
    path('loading/workspace/', LoadingWorkspaceView.as_view(), name='loading_workspace'),

    # Orders (Layer 4)
    path('orders/', OrderListCreateView.as_view(), name='order_list_create'),
    path('orders/calculate-weight/', OrderCalculateWeightView.as_view(), name='order_calculate_weight'),
    path('orders/<int:pk>/', OrderDetailView.as_view(), name='order_detail'),
    path('orders/<int:pk>/submit/', OrderSubmitView.as_view(), name='order_submit'),
    path('orders/<int:pk>/cancel/', OrderCancelView.as_view(), name='order_cancel'),

    # Payments (Layer 5)
    path('payments/', PaymentListCreateView.as_view(), name='payment_list_create'),
    path('payments/<int:pk>/', PaymentDetailView.as_view(), name='payment_detail'),
    path('payments/<int:pk>/verify/', PaymentVerifyView.as_view(), name='payment_verify'),
    path('payments/<int:pk>/reject/', PaymentRejectView.as_view(), name='payment_reject'),

    # Distributor Wallets (Layer 5)
    path('wallets/my/', DistributorWalletDetailView.as_view(), name='wallet_my'),
    path('wallets/<int:pk>/credit/', WalletCreditView.as_view(), name='wallet_credit'),
    path('wallets/<int:pk>/ledger/', WalletLedgerView.as_view(), name='wallet_ledger'),
    path('wallets/<int:distributor_id>/', DistributorWalletDetailView.as_view(), name='wallet_distributor_detail'),

    # Truck Loading Operations (Layer 6)
    path('loading/sessions/', LoadingSessionListCreateView.as_view(), name='loading_session_list'),
    path('loading/sessions/assign/', LoadingSessionAssignView.as_view(), name='loading_session_assign'),
    path('loading/sessions/<int:pk>/', LoadingSessionDetailView.as_view(), name='loading_session_detail'),
    path('loading/sessions/<int:pk>/start/', LoadingStartView.as_view(), name='loading_session_start'),
    path('loading/sessions/<int:pk>/bag-count/', LoadingBagCountView.as_view(), name='loading_session_bag_count'),
    path('loading/sessions/<int:pk>/weighbridge/', WeighbridgeRecordView.as_view(), name='loading_session_weighbridge'),
    path('loading/sessions/<int:pk>/complete/', LoadingCompleteView.as_view(), name='loading_session_complete'),
    path('loading/sessions/<int:pk>/gate-pass/', GatePassGenerateView.as_view(), name='loading_session_gate_pass'),
    path('loading/assets/', AssetListView.as_view(), name='loading_assets_list'),
    path('loading/queue/', LoadingQueueLiveView.as_view(), name='loading_queue_live'),

    # Dispatch & Road Transit (Layer 7)
    path('dispatch/', DispatchListCreateView.as_view(), name='dispatch_list_create'),
    path('dispatch/<int:pk>/', DispatchDetailView.as_view(), name='dispatch_detail'),

    # Shortage & Quality Claims (Layer 8)
    path('claims/', ClaimListCreateView.as_view(), name='claim_list_create'),
    path('claims/<int:pk>/', ClaimDetailView.as_view(), name='claim_detail'),
    path('claims/<int:pk>/evidence/', ClaimEvidenceUploadView.as_view(), name='claim_evidence_upload'),
    path('claims/<int:pk>/review/', ClaimReviewView.as_view(), name='claim_review'),

    # Operational Live Updates & Polling (Layer 9)
    path('live/dashboard/', LiveDashboardView.as_view(), name='live_dashboard'),
    path('live/events/', LiveEventsStreamView.as_view(), name='live_events_stream'),
    path('live/orders/<int:pk>/', LiveOrderDetailView.as_view(), name='live_order_detail'),
]
