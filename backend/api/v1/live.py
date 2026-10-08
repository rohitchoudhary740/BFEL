import hashlib
import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.core.exceptions import PermissionDenied, ValidationError
from django.utils.dateparse import parse_datetime

from permissions import IsActiveBfelUser, IsLoadingOperatorRole
from apps.orders.models import Order
from services.live import OperationalLiveUpdateService


class LiveOrderDetailView(APIView):
    """
    Authoritative live tracking view for a specific order.
    Returns real-time status across [PAYMENT] -> [LOADING] -> [GATE_PASS] -> [DISPATCH] -> [CLAIMS].
    GET /api/v1/live/orders/{id}/
    """
    permission_classes = [IsActiveBfelUser]

    def get(self, request, pk):
        try:
            status_data = OperationalLiveUpdateService.get_order_live_status(order=pk, user=request.user)
            return Response(status_data, status=status.HTTP_200_OK)
        except Order.DoesNotExist:
            return Response({"detail": f"Order #{pk} does not exist."}, status=status.HTTP_404_NOT_FOUND)
        except PermissionDenied as e:
            return Response({"detail": str(e)}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class LiveDashboardView(APIView):
    """
    High-frequency short-interval polling endpoint for operational web dashboards.
    Returns the authoritative role-tailored operational snapshot directly from PostgreSQL.
    Supports ?since=2026-10-02T12:00:00Z for delta syncing.
    GET /api/v1/live/dashboard/
    """
    permission_classes = [IsActiveBfelUser]

    def get(self, request):
        since_param = request.query_params.get('since')
        since_dt = parse_datetime(since_param) if since_param else None

        data = OperationalLiveUpdateService.get_role_dashboard_snapshot(user=request.user, since=since_dt)

        # Generate lightweight ETag hash to avoid unnecessary frontend re-renders
        serialized = json.dumps(data, sort_keys=True, default=str)
        etag = hashlib.md5(serialized.encode('utf-8')).hexdigest()

        response = Response(data, status=status.HTTP_200_OK)
        response['ETag'] = f'"{etag}"'
        response['Cache-Control'] = 'no-cache, private'
        return response


class LiveEventsStreamView(APIView):
    """
    Live stream of operational audit events for dashboards.
    Supports ?since=... and ?limit=... for incremental polling.
    GET /api/v1/live/events/
    """
    permission_classes = [IsActiveBfelUser]

    def get(self, request):
        since_param = request.query_params.get('since')
        since_dt = parse_datetime(since_param) if since_param else None
        limit = min(int(request.query_params.get('limit', 50)), 100)

        data = OperationalLiveUpdateService.get_admin_live_stream(since=since_dt, limit=limit)
        return Response(data, status=status.HTTP_200_OK)


class LoadingQueueLiveView(APIView):
    """
    Plant Loading Terminal live queue view.
    Displays orders ready for bay assignment, active loading sessions, and gate clearance queue.
    GET /api/v1/loading/queue/
    """
    permission_classes = [IsActiveBfelUser, IsLoadingOperatorRole]

    def get(self, request):
        queue_data = OperationalLiveUpdateService.get_loading_queue()
        return Response(queue_data, status=status.HTTP_200_OK)
