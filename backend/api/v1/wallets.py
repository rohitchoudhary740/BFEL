from decimal import Decimal
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError, PermissionDenied
from django.shortcuts import get_object_or_404

from permissions import IsActiveBfelUser
from apps.users.models import Role
from apps.distributors.models import DistributorWallet, WalletLedgerEntry, Distributor
from apps.distributors.serializers import (
    DistributorWalletSerializer,
    WalletLedgerEntrySerializer,
    WalletCreditInputSerializer,
)
from services.wallet import DistributorWalletService

class DistributorWalletDetailView(APIView):
    """
    Retrieve distributor wallet details.
    Distributors view their own wallet; Accounts and Admins can view any distributor wallet.
    GET /api/v1/wallets/{distributor_id}/
    """
    permission_classes = [IsActiveBfelUser]

    def get(self, request, distributor_id=None):
        role_code = getattr(getattr(request.user, 'role', None), 'code', None)

        if distributor_id is None:
            # Current user's distributor wallet
            if role_code != Role.Code.DISTRIBUTOR:
                return Response({"detail": "Only distributors have a personal credit wallet."}, status=status.HTTP_400_BAD_REQUEST)
            try:
                distributor = request.user.distributor_profile
            except Distributor.DoesNotExist:
                return Response({"detail": "No distributor profile associated with this account."}, status=status.HTTP_404_NOT_FOUND)
        else:
            distributor = get_object_or_404(Distributor, pk=distributor_id)
            if role_code == Role.Code.DISTRIBUTOR and distributor.user != request.user:
                return Response({"detail": "Distributors can only view their own credit wallet."}, status=status.HTTP_403_FORBIDDEN)
            if not (request.user.is_superuser or role_code in {Role.Code.ADMIN, Role.Code.ACCOUNTS, Role.Code.DISTRIBUTOR}):
                return Response({"detail": "Access forbidden."}, status=status.HTTP_403_FORBIDDEN)

        wallet = DistributorWalletService.get_or_create_wallet(distributor)
        serializer = DistributorWalletSerializer(wallet)
        return Response(serializer.data, status=status.HTTP_200_OK)


class WalletLedgerView(APIView):
    """
    View immutable ledger entries for a distributor wallet.
    GET /api/v1/wallets/{wallet_id}/ledger/
    """
    permission_classes = [IsActiveBfelUser]

    def get(self, request, pk):
        wallet = get_object_or_404(DistributorWallet, pk=pk)
        role_code = getattr(getattr(request.user, 'role', None), 'code', None)

        if role_code == Role.Code.DISTRIBUTOR and wallet.distributor.user != request.user:
            return Response({"detail": "Access forbidden."}, status=status.HTTP_403_FORBIDDEN)

        entries = wallet.ledger_entries.all().order_by('-created_at')
        serializer = WalletLedgerEntrySerializer(entries, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class WalletCreditView(APIView):
    """
    Accounts and Admin can top up / credit a distributor's wallet.
    POST /api/v1/wallets/{wallet_id}/credit/
    """
    permission_classes = [IsActiveBfelUser]

    def post(self, request, pk):
        role_code = getattr(getattr(request.user, 'role', None), 'code', None)
        if not (request.user.is_superuser or role_code in {Role.Code.ADMIN, Role.Code.ACCOUNTS}):
            return Response({"detail": "Only Accounts or Admin can credit distributor wallets."}, status=status.HTTP_403_FORBIDDEN)

        wallet = get_object_or_404(DistributorWallet, pk=pk)
        serializer = WalletCreditInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        try:
            updated_wallet = DistributorWalletService.credit_wallet(
                wallet=wallet,
                amount=data['amount'],
                reference=data['reference'],
                description=data['description'],
                actor=request.user,
            )
        except ValidationError as e:
            msg = e.message if hasattr(e, 'message') else str(e)
            return Response({"detail": msg}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        response_serializer = DistributorWalletSerializer(updated_wallet)
        return Response(response_serializer.data, status=status.HTTP_200_OK)
