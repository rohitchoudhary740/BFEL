from decimal import Decimal
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError, PermissionDenied
from django.shortcuts import get_object_or_404

from permissions import IsActiveBfelUser, IsLoadingOperatorRole
from apps.users.models import Role
from apps.loading.models import (
    Truck,
    Driver,
    LoadingBay,
    LoadingSession,
    WeighbridgeReading,
)
from apps.dispatch.models import GatePass
from apps.loading.serializers import (
    TruckSerializer,
    DriverSerializer,
    LoadingBaySerializer,
    LoadingSessionDetailSerializer,
    WeighbridgeReadingSerializer,
    AssignTruckBayInputSerializer,
    RecordBagCountInputSerializer,
    WeighbridgeInputSerializer,
    CompleteLoadingInputSerializer,
    GatePassSerializer,
)
from services.loading import TruckLoadingService

class LoadingSessionListCreateView(APIView):
    """
    List loading queue or assign truck/bay to order.
    GET  /api/v1/loading/sessions/
    POST /api/v1/loading/sessions/assign/
    """
    permission_classes = [IsActiveBfelUser, IsLoadingOperatorRole]

    def get(self, request):
        qs = LoadingSession.objects.all().select_related(
            'order', 'truck', 'bay', 'driver', 'operator__user'
        ).prefetch_related('weighbridge_readings')
        serializer = LoadingSessionDetailSerializer(qs.order_by('-started_at'), many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class LoadingSessionAssignView(APIView):
    """
    Assign truck, bay, and driver to an order in LOADING_QUEUED status.
    POST /api/v1/loading/sessions/assign/
    """
    permission_classes = [IsActiveBfelUser, IsLoadingOperatorRole]

    def post(self, request):
        serializer = AssignTruckBayInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        try:
            session = TruckLoadingService.assign_truck_and_bay(
                order=data['order'],
                truck=data['truck'],
                bay=data['bay'],
                driver=data['driver'],
                operator_user=request.user,
            )
        except ValidationError as e:
            msg = e.message if hasattr(e, 'message') else str(e)
            return Response({"detail": msg}, status=status.HTTP_400_BAD_REQUEST)
        except PermissionDenied as e:
            return Response({"detail": str(e)}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        response_serializer = LoadingSessionDetailSerializer(session)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class LoadingSessionDetailView(APIView):
    """
    Retrieve single loading session details.
    GET /api/v1/loading/sessions/{id}/
    """
    permission_classes = [IsActiveBfelUser]

    def get(self, request, pk):
        session = get_object_or_404(
            LoadingSession.objects.select_related('order', 'truck', 'bay', 'driver', 'operator__user').prefetch_related('weighbridge_readings'),
            pk=pk
        )
        serializer = LoadingSessionDetailSerializer(session)
        return Response(serializer.data, status=status.HTTP_200_OK)


class LoadingStartView(APIView):
    """
    Begin loading process for session.
    POST /api/v1/loading/sessions/{id}/start/
    """
    permission_classes = [IsActiveBfelUser, IsLoadingOperatorRole]

    def post(self, request, pk):
        session = get_object_or_404(LoadingSession, pk=pk)
        try:
            started = TruckLoadingService.start_loading(session=session, operator_user=request.user)
        except ValidationError as e:
            msg = e.message if hasattr(e, 'message') else str(e)
            return Response({"detail": msg}, status=status.HTTP_400_BAD_REQUEST)
        except PermissionDenied as e:
            return Response({"detail": str(e)}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        serializer = LoadingSessionDetailSerializer(started)
        return Response(serializer.data, status=status.HTTP_200_OK)


class LoadingBagCountView(APIView):
    """
    Record actual bags loaded.
    POST /api/v1/loading/sessions/{id}/bag-count/
    """
    permission_classes = [IsActiveBfelUser, IsLoadingOperatorRole]

    def post(self, request, pk):
        session = get_object_or_404(LoadingSession, pk=pk)
        serializer = RecordBagCountInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        bags = serializer.validated_data['bags_loaded']
        try:
            updated = TruckLoadingService.record_bag_count(session=session, bags_loaded=bags, operator_user=request.user)
        except ValidationError as e:
            msg = e.message if hasattr(e, 'message') else str(e)
            return Response({"detail": msg}, status=status.HTTP_400_BAD_REQUEST)
        except PermissionDenied as e:
            return Response({"detail": str(e)}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        serializer = LoadingSessionDetailSerializer(updated)
        return Response(serializer.data, status=status.HTTP_200_OK)


class WeighbridgeRecordView(APIView):
    """
    Record electronic weighbridge ticket: gross, tare, net, and variance.
    POST /api/v1/loading/sessions/{id}/weighbridge/
    """
    permission_classes = [IsActiveBfelUser, IsLoadingOperatorRole]

    def post(self, request, pk):
        session = get_object_or_404(LoadingSession, pk=pk)
        serializer = WeighbridgeInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        try:
            reading = TruckLoadingService.record_weighbridge(
                session=session,
                tare_weight_kg=data['tare_weight_kg'],
                gross_weight_kg=data['gross_weight_kg'],
                operator_user=request.user,
                tolerance_kg=data.get('tolerance_kg', Decimal('100.00')),
            )
        except ValidationError as e:
            msg = e.message if hasattr(e, 'message') else str(e)
            return Response({"detail": msg}, status=status.HTTP_400_BAD_REQUEST)
        except PermissionDenied as e:
            return Response({"detail": str(e)}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        response_serializer = WeighbridgeReadingSerializer(reading)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class LoadingCompleteView(APIView):
    """
    Complete loading session with mandatory seal number.
    POST /api/v1/loading/sessions/{id}/complete/
    """
    permission_classes = [IsActiveBfelUser, IsLoadingOperatorRole]

    def post(self, request, pk):
        session = get_object_or_404(LoadingSession, pk=pk)
        serializer = CompleteLoadingInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        seal_number = serializer.validated_data['seal_number']
        try:
            completed = TruckLoadingService.complete_loading(
                session=session,
                seal_number=seal_number,
                operator_user=request.user,
            )
        except ValidationError as e:
            msg = e.message if hasattr(e, 'message') else str(e)
            return Response({"detail": msg}, status=status.HTTP_400_BAD_REQUEST)
        except PermissionDenied as e:
            return Response({"detail": str(e)}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        serializer = LoadingSessionDetailSerializer(completed)
        return Response(serializer.data, status=status.HTTP_200_OK)


class GatePassGenerateView(APIView):
    """
    Issue security gate pass certificate.
    POST /api/v1/loading/sessions/{id}/gate-pass/
    """
    permission_classes = [IsActiveBfelUser, IsLoadingOperatorRole]

    def post(self, request, pk):
        session = get_object_or_404(LoadingSession, pk=pk)
        try:
            gate_pass = TruckLoadingService.generate_gate_pass(
                order_or_session=session,
                operator_user=request.user,
            )
        except ValidationError as e:
            msg = e.message if hasattr(e, 'message') else str(e)
            return Response({"detail": msg}, status=status.HTTP_400_BAD_REQUEST)
        except PermissionDenied as e:
            return Response({"detail": str(e)}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        serializer = GatePassSerializer(gate_pass)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AssetListView(APIView):
    """
    List logistics assets for loading operator assignment: trucks, bays, drivers.
    GET /api/v1/loading/assets/
    """
    permission_classes = [IsActiveBfelUser, IsLoadingOperatorRole]

    def get(self, request):
        trucks = TruckSerializer(Truck.objects.filter(is_active=True), many=True).data
        bays = LoadingBaySerializer(LoadingBay.objects.filter(is_active=True), many=True).data
        drivers = DriverSerializer(Driver.objects.filter(is_active=True), many=True).data
        return Response({
            "trucks": trucks,
            "bays": bays,
            "drivers": drivers,
        }, status=status.HTTP_200_OK)
