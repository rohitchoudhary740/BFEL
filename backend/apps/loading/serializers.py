from rest_framework import serializers
from apps.loading.models import (
    Truck,
    Driver,
    LoadingBay,
    LoadingOperator,
    LoadingSession,
    WeighbridgeReading,
)
from apps.dispatch.models import GatePass
from apps.orders.models import Order

class TruckSerializer(serializers.ModelSerializer):
    class Meta:
        model = Truck
        fields = [
            'id',
            'registration_number',
            'capacity_type',
            'capacity_mt',
            'max_bags',
            'is_active',
        ]

class DriverSerializer(serializers.ModelSerializer):
    class Meta:
        model = Driver
        fields = ['id', 'name', 'phone', 'license_number', 'is_active']

class LoadingBaySerializer(serializers.ModelSerializer):
    class Meta:
        model = LoadingBay
        fields = ['id', 'bay_number', 'name', 'is_active']

class WeighbridgeReadingSerializer(serializers.ModelSerializer):
    is_within_tolerance = serializers.BooleanField(read_only=True)
    operator_name = serializers.CharField(source='operator.get_full_name', read_only=True)

    class Meta:
        model = WeighbridgeReading
        fields = [
            'id',
            'tare_weight_kg',
            'gross_weight_kg',
            'net_weight_kg',
            'expected_weight_kg',
            'variance_kg',
            'tolerance_kg',
            'is_within_tolerance',
            'operator_name',
            'recorded_at',
        ]
        read_only_fields = ['id', 'net_weight_kg', 'expected_weight_kg', 'variance_kg', 'is_within_tolerance', 'recorded_at']

class LoadingSessionDetailSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    truck = TruckSerializer(read_only=True)
    driver = DriverSerializer(read_only=True)
    bay = LoadingBaySerializer(read_only=True)
    operator_name = serializers.CharField(source='operator.user.get_full_name', read_only=True)
    weighbridge_readings = WeighbridgeReadingSerializer(many=True, read_only=True)

    class Meta:
        model = LoadingSession
        fields = [
            'id',
            'order',
            'order_number',
            'truck',
            'driver',
            'bay',
            'operator_name',
            'status',
            'expected_bags',
            'bags_loaded',
            'seal_number',
            'started_at',
            'completed_at',
            'weighbridge_readings',
        ]

class AssignTruckBayInputSerializer(serializers.Serializer):
    order_id = serializers.PrimaryKeyRelatedField(queryset=Order.objects.all(), source='order')
    truck_id = serializers.PrimaryKeyRelatedField(queryset=Truck.objects.filter(is_active=True), source='truck')
    bay_id = serializers.PrimaryKeyRelatedField(queryset=LoadingBay.objects.filter(is_active=True), source='bay')
    driver_id = serializers.PrimaryKeyRelatedField(queryset=Driver.objects.filter(is_active=True), source='driver')

class RecordBagCountInputSerializer(serializers.Serializer):
    bags_loaded = serializers.IntegerField(min_value=0)

class WeighbridgeInputSerializer(serializers.Serializer):
    tare_weight_kg = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0)
    gross_weight_kg = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0)
    tolerance_kg = serializers.DecimalField(max_digits=6, decimal_places=2, required=False, default=100.00)

class CompleteLoadingInputSerializer(serializers.Serializer):
    seal_number = serializers.CharField(max_length=50, required=True, allow_blank=False)

class GatePassSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    truck_number = serializers.CharField(source='truck.registration_number', read_only=True)
    driver_name = serializers.CharField(source='driver.name', read_only=True)

    class Meta:
        model = GatePass
        fields = [
            'id',
            'gate_pass_number',
            'order_number',
            'truck_number',
            'driver_name',
            'seal_number',
            'qr_code_hash',
            'issued_at',
        ]
