from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError, PermissionDenied
from django.shortcuts import get_object_or_404
from django.db.models import Q

from permissions import IsActiveBfelUser, IsAccountsRole
from apps.users.models import Role
from apps.payments.models import Payment
from apps.orders.models import Order
from apps.payments.serializers import (
    PaymentSubmissionSerializer,
    PaymentDetailSerializer,
    PaymentActionNotesSerializer,
    PaymentActionRejectSerializer,
)
from services.payments import PaymentService

class PaymentListCreateView(APIView):
    """
    List payments according to role visibility, or submit advance payments.
    GET  /api/v1/payments/
    POST /api/v1/payments/
    """
    permission_classes = [IsActiveBfelUser]

    def get_queryset(self, user):
        role_code = getattr(getattr(user, 'role', None), 'code', None)
        if user.is_superuser or role_code in {Role.Code.ADMIN, Role.Code.ACCOUNTS}:
            return Payment.objects.all().select_related('order', 'dealer', 'submitted_by', 'verified_by')

        if role_code == Role.Code.DEALER:
            return Payment.objects.filter(dealer__user=user).select_related('order', 'dealer', 'submitted_by', 'verified_by')

        if role_code == Role.Code.SALES_AGENT:
            return Payment.objects.filter(
                Q(submitted_by=user) | Q(dealer__assigned_sales_agent__user=user)
            ).select_related('order', 'dealer', 'submitted_by', 'verified_by')

        if role_code == Role.Code.DISTRIBUTOR:
            return Payment.objects.filter(
                Q(order__distributor__user=user) | Q(dealer__assigned_distributor__user=user)
            ).select_related('order', 'dealer', 'submitted_by', 'verified_by')

        return Payment.objects.none()

    def get(self, request):
        qs = self.get_queryset(request.user)
        status_param = request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param.upper())
        order_param = request.query_params.get('order_id')
        if order_param:
            qs = qs.filter(order_id=order_param)

        serializer = PaymentDetailSerializer(qs.order_by('-created_at'), many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        role_code = getattr(getattr(request.user, 'role', None), 'code', None)
        # Dealers, Sales Agents, and Admin can submit advance payment
        if role_code not in {Role.Code.DEALER, Role.Code.SALES_AGENT, Role.Code.ADMIN} and not request.user.is_superuser:
            return Response(
                {"detail": f"Role '{role_code}' is not authorized to submit payments."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = PaymentSubmissionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        order = data['order']

        # Ownership authorization check
        if role_code == Role.Code.DEALER:
            if order.dealer.user != request.user:
                return Response(
                    {"detail": "Dealers are only authorized to submit payments for their own orders."},
                    status=status.HTTP_403_FORBIDDEN
                )
        elif role_code == Role.Code.SALES_AGENT:
            if order.dealer.assigned_sales_agent and order.dealer.assigned_sales_agent.user != request.user:
                return Response(
                    {"detail": "Sales agents cannot submit payments for unassigned dealers."},
                    status=status.HTTP_403_FORBIDDEN
                )

        try:
            payment = PaymentService.submit_payment(
                order=order,
                payment_mode=data['payment_mode'],
                utr_number=data['utr_number'],
                bank_name=data['bank_name'],
                submitted_by=request.user,
                amount=data.get('amount'),
                receipt_url=data.get('receipt_url', ''),
            )
        except ValidationError as e:
            msg = e.message if hasattr(e, 'message') else str(e)
            return Response({"detail": msg}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        response_serializer = PaymentDetailSerializer(payment)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class PaymentDetailView(APIView):
    """
    Inspect payment details.
    GET /api/v1/payments/{id}/
    """
    permission_classes = [IsActiveBfelUser]

    def get(self, request, pk):
        try:
            payment = Payment.objects.select_related('order', 'dealer', 'submitted_by', 'verified_by').get(pk=pk)
        except Payment.DoesNotExist:
            return Response({"detail": "Payment not found."}, status=status.HTTP_404_NOT_FOUND)

        role_code = getattr(getattr(request.user, 'role', None), 'code', None)
        if not (request.user.is_superuser or role_code in {Role.Code.ADMIN, Role.Code.ACCOUNTS}):
            if role_code == Role.Code.DEALER and payment.dealer.user != request.user:
                return Response({"detail": "Access forbidden."}, status=status.HTTP_403_FORBIDDEN)
            if role_code == Role.Code.SALES_AGENT and payment.submitted_by != request.user:
                return Response({"detail": "Access forbidden."}, status=status.HTTP_403_FORBIDDEN)

        serializer = PaymentDetailSerializer(payment)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PaymentVerifyView(APIView):
    """
    Accounts officer verifies payment and unlocks order workflow.
    POST /api/v1/payments/{id}/verify/
    """
    permission_classes = [IsActiveBfelUser]

    def post(self, request, pk):
        role_code = getattr(getattr(request.user, 'role', None), 'code', None)
        if not (request.user.is_superuser or role_code in {Role.Code.ACCOUNTS, Role.Code.ADMIN}):
            return Response(
                {"detail": "Only Accounts Desk personnel or Administrator can verify payments."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            payment = Payment.objects.get(pk=pk)
        except Payment.DoesNotExist:
            return Response({"detail": "Payment not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = PaymentActionNotesSerializer(data=request.data)
        serializer.is_valid()
        notes = serializer.validated_data.get('notes', '')

        try:
            verified_payment = PaymentService.verify_payment(
                payment=payment,
                user=request.user,
                notes=notes,
            )
        except ValidationError as e:
            msg = e.message if hasattr(e, 'message') else str(e)
            return Response({"detail": msg}, status=status.HTTP_400_BAD_REQUEST)
        except PermissionDenied as e:
            return Response({"detail": str(e)}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        response_serializer = PaymentDetailSerializer(verified_payment)
        return Response(response_serializer.data, status=status.HTTP_200_OK)


class PaymentRejectView(APIView):
    """
    Accounts officer rejects remittance with mandatory reason and reverts order to PAYMENT_PENDING.
    POST /api/v1/payments/{id}/reject/
    """
    permission_classes = [IsActiveBfelUser]

    def post(self, request, pk):
        role_code = getattr(getattr(request.user, 'role', None), 'code', None)
        if not (request.user.is_superuser or role_code in {Role.Code.ACCOUNTS, Role.Code.ADMIN}):
            return Response(
                {"detail": "Only Accounts Desk personnel or Administrator can reject payments."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            payment = Payment.objects.get(pk=pk)
        except Payment.DoesNotExist:
            return Response({"detail": "Payment not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = PaymentActionRejectSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        reason = serializer.validated_data['reason']

        try:
            rejected_payment = PaymentService.reject_payment(
                payment=payment,
                user=request.user,
                reason=reason,
            )
        except ValidationError as e:
            msg = e.message if hasattr(e, 'message') else str(e)
            return Response({"detail": msg}, status=status.HTTP_400_BAD_REQUEST)
        except PermissionDenied as e:
            return Response({"detail": str(e)}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        response_serializer = PaymentDetailSerializer(rejected_payment)
        return Response(response_serializer.data, status=status.HTTP_200_OK)
