from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated

from apps.products.models import Product
from apps.products.serializers import ProductSerializer

class ProductListView(APIView):
    """
    List all active cattle feed products with specifications and prices.
    GET /api/v1/products/
    """
    permission_classes = [AllowAny]

    def get(self, request):
        products = Product.objects.filter(is_active=True).prefetch_related('prices').order_by('id')
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
