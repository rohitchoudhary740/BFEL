from rest_framework import serializers
from apps.orders.models import Order, OrderItem
from apps.products.models import Product
from apps.dealers.models import Dealer
from apps.distributors.models import Distributor
from apps.users.models import User

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            'id',
            'product',
            'product_name',
            'product_sku',
            'bags',
            'bag_weight_kg',
            'weight_kg',
            'weight_mt',
            'rate_per_bag',
            'total_amount',
        ]
        read_only_fields = ['id', 'bag_weight_kg', 'weight_kg', 'weight_mt', 'total_amount']

class OrderCreateItemInputSerializer(serializers.Serializer):
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source='product'
    )
    bags = serializers.IntegerField(min_value=1)
    rate_per_bag = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        allow_null=True
    )

class OrderCreateSerializer(serializers.Serializer):
    dealer_id = serializers.PrimaryKeyRelatedField(
        queryset=Dealer.objects.all(),
        source='dealer',
        required=False,
        allow_null=True
    )
    truck_capacity = serializers.ChoiceField(choices=Order.TruckCapacity.choices)
    items = OrderCreateItemInputSerializer(many=True, min_length=1)
    destination = serializers.CharField(max_length=255)
    requested_dispatch_date = serializers.DateField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True, default='')
    order_reference = serializers.CharField(required=False, allow_blank=True, max_length=50)

class DealerSummarySerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)

    class Meta:
        model = Dealer
        fields = [
            'id',
            'dealership_name',
            'city',
            'district',
            'state',
            'user_name',
            'phone',
        ]

class DistributorSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Distributor
        fields = ['id', 'company_name', 'distributor_code']

class UserSummarySerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source='role.name', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'phone', 'role_name']

class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    dealer = DealerSummarySerializer(read_only=True)
    distributor = DistributorSummarySerializer(read_only=True)
    created_by = UserSummarySerializer(read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'order_number',
            'dealer',
            'distributor',
            'truck_capacity',
            'max_bags',
            'total_bags',
            'total_weight_kg',
            'total_weight_mt',
            'subtotal',
            'discount',
            'net_total',
            'advance_payable',
            'advance_paid',
            'status',
            'destination',
            'requested_dispatch_date',
            'notes',
            'created_by',
            'created_at',
            'updated_at',
            'items',
        ]
