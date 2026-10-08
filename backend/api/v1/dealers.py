from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q

from permissions import IsActiveBfelUser
from apps.users.models import Role
from apps.dealers.models import Dealer
from apps.orders.serializers import DealerSummarySerializer

class DealerListView(APIView):
    """
    List dealers accessible to the current user.
    Sales agents see assigned dealers; Admin and Accounts see all dealers.
    Dealers see their own profile.
    GET /api/v1/dealers/
    """
    permission_classes = [IsActiveBfelUser]

    def get(self, request):
        role_code = getattr(getattr(request.user, 'role', None), 'code', None)

        if request.user.is_superuser or role_code in {Role.Code.ADMIN, Role.Code.ACCOUNTS}:
            qs = Dealer.objects.all().select_related('user')
        elif role_code == Role.Code.SALES_AGENT:
            qs = Dealer.objects.filter(
                Q(assigned_sales_agent__user=request.user) | Q(assigned_sales_agent__isnull=True)
            ).select_related('user')
        elif role_code == Role.Code.DISTRIBUTOR:
            qs = Dealer.objects.filter(
                assigned_distributor__user=request.user
            ).select_related('user')
        elif role_code == Role.Code.DEALER:
            qs = Dealer.objects.filter(user=request.user).select_related('user')
        else:
            qs = Dealer.objects.none()

        serializer = DealerSummarySerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
