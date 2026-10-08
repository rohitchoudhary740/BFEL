from rest_framework import serializers
from apps.distributors.models import DistributorWallet, WalletLedgerEntry, Distributor

class WalletLedgerEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletLedgerEntry
        fields = [
            'id',
            'entry_type',
            'amount',
            'balance_after',
            'reference',
            'description',
            'created_at',
        ]

class DistributorWalletSerializer(serializers.ModelSerializer):
    distributor_name = serializers.CharField(source='distributor.company_name', read_only=True)
    distributor_code = serializers.CharField(source='distributor.distributor_code', read_only=True)
    available_credit = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    ledger_entries = WalletLedgerEntrySerializer(many=True, read_only=True)

    class Meta:
        model = DistributorWallet
        fields = [
            'id',
            'distributor',
            'distributor_name',
            'distributor_code',
            'available_balance',
            'credit_limit',
            'reserved_funds',
            'available_credit',
            'updated_at',
            'ledger_entries',
        ]

class WalletCreditInputSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=14, decimal_places=2, min_value=1)
    reference = serializers.CharField(max_length=100)
    description = serializers.CharField(max_length=255)
