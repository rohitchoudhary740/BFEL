from rest_framework import serializers
from decimal import Decimal
from apps.products.models import Product, ProductPrice

class ProductSerializer(serializers.ModelSerializer):
    price_per_bag = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id',
            'sku',
            'name',
            'category',
            'bag_weight_kg',
            'protein_percent',
            'fat_percent',
            'price_per_bag',
            'is_active',
        ]

    def get_price_per_bag(self, obj) -> str:
        active_price = obj.prices.filter(is_active=True).first()
        if active_price:
            return str(active_price.price_per_bag)
        return "1400.00"
