from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError, PermissionDenied
from django.shortcuts import get_object_or_404
from django.db.models import Q

from permissions import IsActiveBfelUser, IsLoadingOperatorRole
from apps.users.models import Role
from apps.dispatch.models import Dispatch
from apps.dispatch.serializers import DispatchDetailSerializer, CreateDispatchInputSerializer
from services.dispatch import DispatchService

class DispatchListCreateView(APIView):
    """
    List road dispatches with role visibility, or create new dispatch.
    GET  /api/v1/dispatch/
    POST /api/v1/dispatch/
    """
    permission_classes = [IsActiveBfelUser]

    def get_queryset(self, user):
        role_code = getattr(getattr(user, 'role', None), 'code', None)
        if user.is_superuser or role_code in {Role.Code.ADMIN, Role.Code.LOADING_OPERATOR, Role.Code.ACCOUNTS}:
            return Dispatch.objects.all().select_related('order', 'truck', 'driver', 'gate_pass')

        if role_code == Role.Code.DEALER:
            return Dispatch.objects.filter(order__dealer__user=user).select_related('order', 'truck', 'driver', 'gate_pass')

        if role_code == Role.Code.SALES_AGENT:
            return Dispatch.objects.filter(
                Q(order__created_by=user) | Q(order__dealer__assigned_sales_agent__user=user)
            ).select_related('order', 'truck', 'driver', 'gate_pass')

        if role_code == Role.Code.DISTRIBUTOR:
            return Dispatch.objects.filter(
                Q(order__distributor__user=user) | Q(order__dealer__assigned_distributor__user=user)
            ).select_related('order', 'truck', 'driver', 'gate_pass')

        return Dispatch.objects.none()

    def get(self, request):
        qs = self.get_queryset(request.user).order_by('-dispatched_at')
        serializer = DispatchDetailSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        role_code = getattr(getattr(request.user, 'role', None), 'code', None)
        if not (request.user.is_superuser or role_code in {Role.Code.LOADING_OPERATOR, Role.Code.ADMIN}):
            return Response(
                {"detail": "Only Plant Dispatch Operators or Administrators are authorized to dispatch shipments."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = CreateDispatchInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        try:
            dispatch = DispatchService.create_dispatch(
                order=data['order'],
                lr_number=data['lr_number'],
                operator_user=request.user,
                gate_pass=data.get('gate_pass'),
            )
        except ValidationError as e:
            msg = e.message if hasattr(e, 'message') else str(e)
            return Response({"detail": msg}, status=status.HTTP_400_BAD_REQUEST)
        except PermissionDenied as e:
            return Response({"detail": str(e)}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        response_serializer = DispatchDetailSerializer(dispatch)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class DispatchDetailView(APIView):
    """
    Retrieve single dispatch details.
    GET /api/v1/dispatch/{id}/
    """
    permission_classes = [IsActiveBfelUser]

    def get(self, request, pk):
        dispatch = get_object_or_404(
            Dispatch.objects.select_related('order', 'truck', 'driver', 'gate_pass'),
            pk=pk
        )
        role_code = getattr(getattr(request.user, 'role', None), 'code', None)
        if not (request.user.is_superuser or role_code in {Role.Code.ADMIN, Role.Code.LOADING_OPERATOR, Role.Code.ACCOUNTS}):
            if role_code == Role.Code.DEALER and dispatch.order.dealer.user != request.user:
                return Response({"detail": "Access forbidden."}, status=status.HTTP_403_FORBIDDEN)

        serializer = DispatchDetailSerializer(dispatch)
        return Response(serializer.data, status=status.HTTP_200_OK)
