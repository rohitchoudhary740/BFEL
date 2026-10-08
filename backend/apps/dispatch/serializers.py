from rest_framework import serializers
from apps.dispatch.models import Dispatch, GatePass
from apps.orders.models import Order

class DispatchDetailSerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(source='order.id', read_only=True)
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    truck_number = serializers.CharField(source='truck.registration_number', read_only=True)
    driver_name = serializers.CharField(source='driver.name', read_only=True)
    driver_phone = serializers.CharField(source='driver.phone', read_only=True)
    gate_pass_number = serializers.CharField(source='gate_pass.gate_pass_number', read_only=True)
    seal_number = serializers.CharField(source='gate_pass.seal_number', read_only=True)

    class Meta:
        model = Dispatch
        fields = [
            'id',
            'dispatch_number',
            'order_id',
            'order_number',
            'truck_number',
            'driver_name',
            'driver_phone',
            'gate_pass_number',
            'seal_number',
            'destination',
            'lr_number',
            'status',
            'dispatched_at',
            'delivered_at',
        ]

class CreateDispatchInputSerializer(serializers.Serializer):
    order_id = serializers.PrimaryKeyRelatedField(
        queryset=Order.objects.all(),
        source='order'
    )
    lr_number = serializers.CharField(max_length=50, required=True, allow_blank=False)
    gate_pass_id = serializers.PrimaryKeyRelatedField(
        queryset=GatePass.objects.all(),
        source='gate_pass',
        required=False,
        allow_null=True
    )
