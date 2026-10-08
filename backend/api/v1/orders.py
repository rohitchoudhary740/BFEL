from decimal import Decimal
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.db.models import Q

from permissions import IsActiveBfelUser
from apps.users.models import Role
from apps.orders.models import Order
from apps.dealers.models import Dealer
from apps.orders.serializers import (
    OrderCreateSerializer,
    OrderDetailSerializer,
    OrderItemSerializer,
)
from services.orders import (
    create_order,
    submit_order,
    cancel_order,
    calculate_order_weight,
    validate_order,
    InvalidOrderStateTransitionError,
)

class OrderListCreateView(APIView):
    """
    List orders with strict ownership isolation, or create new feed orders.
    Mobile-first order creation for Dealers and Sales Agents.
    
    POST /api/v1/orders/
    GET  /api/v1/orders/
    """
    permission_classes = [IsActiveBfelUser]

    def get_queryset(self, user):
        role_code = getattr(getattr(user, 'role', None), 'code', None)

        if user.is_superuser or role_code == Role.Code.ADMIN:
            return Order.objects.all().select_related('dealer', 'distributor', 'created_by').prefetch_related('items__product')

        if role_code == Role.Code.DEALER:
            return Order.objects.filter(dealer__user=user).select_related('dealer', 'distributor', 'created_by').prefetch_related('items__product')

        if role_code == Role.Code.SALES_AGENT:
            # Sales Agent sees orders they created OR orders for dealers assigned to them
            return Order.objects.filter(
                Q(created_by=user) | Q(dealer__assigned_sales_agent__user=user)
            ).select_related('dealer', 'distributor', 'created_by').prefetch_related('items__product')

        if role_code == Role.Code.DISTRIBUTOR:
            # Distributor sees orders mapped to their distributorship or assigned dealers
            return Order.objects.filter(
                Q(distributor__user=user) | Q(dealer__assigned_distributor__user=user)
            ).select_related('dealer', 'distributor', 'created_by').prefetch_related('items__product')

        if role_code in {Role.Code.ACCOUNTS, Role.Code.LOADING_OPERATOR}:
            return Order.objects.all().select_related('dealer', 'distributor', 'created_by').prefetch_related('items__product')

        return Order.objects.none()

    def get(self, request):
        qs = self.get_queryset(request.user).order_by('-created_at')
        serializer = OrderDetailSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        role_code = getattr(getattr(request.user, 'role', None), 'code', None)

        # Only Dealer, Sales Agent, and Admin can create orders
        if role_code not in {Role.Code.DEALER, Role.Code.SALES_AGENT, Role.Code.ADMIN} and not request.user.is_superuser:
            return Response(
                {"detail": f"Role '{role_code}' is not authorized to create feed orders."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = OrderCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        # Determine and validate target dealer
        if role_code == Role.Code.DEALER:
            try:
                dealer = request.user.dealer_profile
            except Dealer.DoesNotExist:
                return Response(
                    {"detail": "No dealer profile linked to this user account."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            # If dealer_id was explicitly provided, ensure it matches
            if data.get('dealer') and data.get('dealer') != dealer:
                return Response(
                    {"detail": "Dealers are only permitted to place orders for their own dealership."},
                    status=status.HTTP_403_FORBIDDEN
                )
        elif role_code == Role.Code.SALES_AGENT:
            dealer = data.get('dealer')
            if not dealer:
                return Response(
                    {"dealer_id": ["Sales agent must specify the target dealer_id."]},
                    status=status.HTTP_400_BAD_REQUEST
                )
            # Verify sales agent assignment
            try:
                agent_profile = request.user.sales_agent_profile
                if dealer.assigned_sales_agent != agent_profile:
                    return Response(
                        {"detail": f"You are not assigned to dealer '{dealer.dealership_name}'."},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except Exception:
                return Response(
                    {"detail": "Sales agent profile not configured."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else: # Admin
            dealer = data.get('dealer')
            if not dealer:
                return Response(
                    {"dealer_id": ["Target dealer_id is required."]},
                    status=status.HTTP_400_BAD_REQUEST
                )

        try:
            order = create_order(
                dealer=dealer,
                truck_capacity=data['truck_capacity'],
                items=data['items'],
                destination=data['destination'],
                requested_dispatch_date=data.get('requested_dispatch_date'),
                notes=data.get('notes', ''),
                created_by=request.user,
                order_reference=data.get('order_reference'),
            )
        except ValidationError as e:
            msg = e.message if hasattr(e, 'message') else str(e)
            return Response({"detail": msg}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        response_serializer = OrderDetailSerializer(order)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class OrderDetailView(APIView):
    """
    Retrieve single order detail with role-based ownership protection.
    GET /api/v1/orders/{id}/
    """
    permission_classes = [IsActiveBfelUser]

    def check_object_access(self, order, user):
        role_code = getattr(getattr(user, 'role', None), 'code', None)
        if user.is_superuser or role_code == Role.Code.ADMIN:
            return True

        if role_code == Role.Code.DEALER:
            return order.dealer.user == user

        if role_code == Role.Code.SALES_AGENT:
            return (
                order.created_by == user or
                (order.dealer.assigned_sales_agent and order.dealer.assigned_sales_agent.user == user)
            )

        if role_code == Role.Code.DISTRIBUTOR:
            return (
                (order.distributor and order.distributor.user == user) or
                (order.dealer.assigned_distributor and order.dealer.assigned_distributor.user == user)
            )

        if role_code in {Role.Code.ACCOUNTS, Role.Code.LOADING_OPERATOR}:
            return True

        return False

    def get(self, request, pk):
        try:
            order = Order.objects.select_related('dealer', 'distributor', 'created_by').prefetch_related('items__product').get(pk=pk)
        except Order.DoesNotExist:
            return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        if not self.check_object_access(order, request.user):
            return Response({"detail": "You do not have permission to view this order."}, status=status.HTTP_403_FORBIDDEN)

        serializer = OrderDetailSerializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)


class OrderSubmitView(APIView):
    """
    Submit order from DRAFT to PLACED / PAYMENT_PENDING.
    POST /api/v1/orders/{id}/submit/
    """
    permission_classes = [IsActiveBfelUser]

    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        role_code = getattr(getattr(request.user, 'role', None), 'code', None)
        # Check permissions: only order owner (dealer), assigned sales agent, or admin can submit
        is_owner = (order.dealer.user == request.user)
        is_agent = (order.dealer.assigned_sales_agent and order.dealer.assigned_sales_agent.user == request.user) or (order.created_by == request.user)
        is_admin = request.user.is_superuser or role_code == Role.Code.ADMIN

        if not (is_owner or is_agent or is_admin):
            return Response(
                {"detail": "You are not authorized to submit this order."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            submitted = submit_order(order, user=request.user)
        except (InvalidOrderStateTransitionError, ValidationError) as e:
            msg = e.message if hasattr(e, 'message') else str(e)
            return Response({"detail": msg}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        serializer = OrderDetailSerializer(submitted)
        return Response(serializer.data, status=status.HTTP_200_OK)


class OrderCancelView(APIView):
    """
    Cancel an order before loading commences.
    POST /api/v1/orders/{id}/cancel/
    """
    permission_classes = [IsActiveBfelUser]

    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        role_code = getattr(getattr(request.user, 'role', None), 'code', None)
        is_owner = (order.dealer.user == request.user)
        is_agent = (order.dealer.assigned_sales_agent and order.dealer.assigned_sales_agent.user == request.user) or (order.created_by == request.user)
        is_admin = request.user.is_superuser or role_code == Role.Code.ADMIN

        if not (is_owner or is_agent or is_admin):
            return Response(
                {"detail": "You are not authorized to cancel this order."},
                status=status.HTTP_403_FORBIDDEN
            )

        reason = request.data.get('reason', '')
        try:
            cancelled = cancel_order(order, user=request.user, reason=reason)
        except (InvalidOrderStateTransitionError, ValidationError) as e:
            msg = e.message if hasattr(e, 'message') else str(e)
            return Response({"detail": msg}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        serializer = OrderDetailSerializer(cancelled)
        return Response(serializer.data, status=status.HTTP_200_OK)


class OrderCalculateWeightView(APIView):
    """
    Utility endpoint for mobile-first frontend to display authoritative MT values.
    GET /api/v1/orders/calculate-weight/?bags=400&truck_capacity=20_MT
    """
    permission_classes = [IsActiveBfelUser]

    def get(self, request):
        bags_str = request.query_params.get('bags')
        capacity = request.query_params.get('truck_capacity')
        if not bags_str:
            return Response({"detail": "Missing 'bags' parameter."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            bags = int(bags_str)
        except ValueError:
            return Response({"detail": "'bags' must be a valid integer."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if capacity:
                validate_order(capacity, bags)
            weight = calculate_order_weight(bags)
        except ValidationError as e:
            msg = e.message if hasattr(e, 'message') else str(e)
            return Response({"detail": msg, "is_valid": False}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "bags": bags,
            "truck_capacity": capacity,
            "weight_kg": str(weight.weight_kg),
            "weight_mt": str(weight.weight_mt),
            "is_valid": True,
        }, status=status.HTTP_200_OK)
