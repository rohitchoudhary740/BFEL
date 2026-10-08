from rest_framework import serializers
from decimal import Decimal
from apps.claims.models import Claim, ClaimEvidence
from apps.orders.models import Order
from apps.dealers.models import Dealer


class ClaimEvidenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClaimEvidence
        fields = [
            'id',
            'file_reference',
            'file_url',
            'content_type',
            'size_bytes',
            'caption',
            'uploaded_at',
        ]


class ClaimDetailSerializer(serializers.ModelSerializer):
    evidence_files = ClaimEvidenceSerializer(many=True, read_only=True)
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    dealer_name = serializers.CharField(source='dealer.dealership_name', read_only=True)
    dealer_code = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    reviewed_by_name = serializers.SerializerMethodField()

    def get_dealer_code(self, obj):
        return getattr(obj.dealer, 'dealer_code', f"DLR-{obj.dealer.pk:04d}")

    class Meta:
        model = Claim
        fields = [
            'id',
            'claim_number',
            'order',
            'order_number',
            'dealer',
            'dealer_name',
            'dealer_code',
            'claim_type',
            'affected_bags',
            'expected_bags',
            'received_bags',
            'shortage_bags',
            'shortage_weight_kg',
            'description',
            'status',
            'credit_note_id',
            'credit_note_amount',
            'created_by',
            'created_by_name',
            'reviewed_by',
            'reviewed_by_name',
            'reviewed_at',
            'review_notes',
            'admin_remarks',
            'evidence_files',
            'created_at',
            'updated_at',
        ]

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return None

    def get_reviewed_by_name(self, obj):
        if obj.reviewed_by:
            return obj.reviewed_by.get_full_name() or obj.reviewed_by.username
        return None


class ClaimCreateInputSerializer(serializers.Serializer):
    order = serializers.PrimaryKeyRelatedField(queryset=Order.objects.all())
    claim_type = serializers.CharField(max_length=30)
    affected_bags = serializers.IntegerField(min_value=1)
    description = serializers.CharField()


class ClaimReviewActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['UNDER_REVIEW', 'APPROVE', 'REJECT'])
    notes = serializers.CharField(required=False, allow_blank=True, default='')
    approved_amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True)
