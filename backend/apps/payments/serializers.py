from rest_framework import serializers
from apps.payments.models import Payment
from apps.orders.models import Order
from apps.users.models import User

class PaymentSubmissionSerializer(serializers.Serializer):
    order_id = serializers.PrimaryKeyRelatedField(
        queryset=Order.objects.all(),
        source='order'
    )
    amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        required=False,
        allow_null=True
    )
    payment_mode = serializers.ChoiceField(choices=Payment.Mode.choices)
    utr_number = serializers.CharField(max_length=100)
    bank_name = serializers.CharField(max_length=150)
    receipt_url = serializers.CharField(max_length=500, required=False, allow_blank=True, default='')

class PaymentActionNotesSerializer(serializers.Serializer):
    notes = serializers.CharField(required=False, allow_blank=True, default='')

class PaymentActionRejectSerializer(serializers.Serializer):
    reason = serializers.CharField(required=True, allow_blank=False)

class PaymentUserSummarySerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source='role.name', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'phone', 'role_name']

class PaymentDetailSerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(source='order.id', read_only=True)
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    dealer_name = serializers.CharField(source='dealer.dealership_name', read_only=True)
    submitted_by = PaymentUserSummarySerializer(read_only=True)
    verified_by = PaymentUserSummarySerializer(read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id',
            'order_id',
            'order_number',
            'dealer_name',
            'amount',
            'payment_mode',
            'utr_number',
            'bank_name',
            'status',
            'receipt_url',
            'submitted_by',
            'created_at',
            'verified_by',
            'verified_at',
            'rejection_reason',
        ]
