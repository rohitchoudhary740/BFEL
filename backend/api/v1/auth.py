from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from services.auth import (
    AuthService,
    AuthError,
    AccountStatusError,
    RateLimitError,
    InvalidOTPError,
    RegistrationNotAllowedError,
)
from permissions import IsActiveBfelUser

class LoginView(APIView):
    """
    Credentials password login endpoint.
    POST /api/v1/auth/login/
    """
    permission_classes = [AllowAny]

    def post(self, request):
        identifier = request.data.get('identifier') or request.data.get('phone') or request.data.get('email')
        password = request.data.get('password')

        if not identifier or not password:
            return Response(
                {"error": "Please provide your identifier (mobile or email) and password."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            result = AuthService.login_with_credentials(identifier, password)
            user = result['user']
            return Response({
                "tokens": result['tokens'],
                "user": {
                    "id": user.id,
                    "name": user.get_full_name() or user.username,
                    "phone": user.phone,
                    "email": user.email,
                    "role": user.role.code if user.role else None,
                    "status": user.status,
                    "organization": user.organization,
                    "territory": user.territory,
                }
            }, status=status.HTTP_200_OK)
        except AccountStatusError as exc:
            return Response({"error": str(exc), "code": "ACCOUNT_INACTIVE"}, status=status.HTTP_403_FORBIDDEN)
        except AuthError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_401_UNAUTHORIZED)

class RequestOTPView(APIView):
    """
    Mobile OTP request endpoint with rate limiting.
    POST /api/v1/auth/otp/request/
    """
    permission_classes = [AllowAny]

    def post(self, request):
        phone = request.data.get('phone')
        if not phone:
            return Response({"error": "Mobile number is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = AuthService.request_otp(phone)
            return Response(result, status=status.HTTP_200_OK)
        except RateLimitError as exc:
            return Response({"error": str(exc), "code": "RATE_LIMITED"}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        except AccountStatusError as exc:
            return Response({"error": str(exc), "code": "ACCOUNT_INACTIVE"}, status=status.HTTP_403_FORBIDDEN)
        except AuthError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

class VerifyOTPView(APIView):
    """
    Mobile OTP verification and login endpoint.
    POST /api/v1/auth/otp/verify/
    """
    permission_classes = [AllowAny]

    def post(self, request):
        phone = request.data.get('phone')
        otp = request.data.get('otp')

        if not phone or not otp:
            return Response({"error": "Mobile number and verification code are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = AuthService.verify_otp_and_login(phone, otp)
            if not result.get('is_registered', False):
                return Response(result, status=status.HTTP_200_OK)

            user = result['user']
            return Response({
                "tokens": result['tokens'],
                "user": {
                    "id": user.id,
                    "name": user.get_full_name() or user.username,
                    "phone": user.phone,
                    "email": user.email,
                    "role": user.role.code if user.role else None,
                    "status": user.status,
                    "organization": user.organization,
                }
            }, status=status.HTTP_200_OK)
        except InvalidOTPError as exc:
            return Response({"error": str(exc), "code": "INVALID_OTP"}, status=status.HTTP_400_BAD_REQUEST)
        except AccountStatusError as exc:
            return Response({"error": str(exc), "code": "ACCOUNT_INACTIVE"}, status=status.HTTP_403_FORBIDDEN)
        except AuthError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

class CurrentUserView(APIView):
    """
    Profile endpoint for authenticated user.
    GET /api/v1/auth/me/
    """
    permission_classes = [IsAuthenticated, IsActiveBfelUser]

    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "name": user.get_full_name() or user.username,
            "phone": user.phone,
            "email": user.email,
            "role": user.role.code if user.role else None,
            "status": user.status,
            "organization": user.organization,
            "territory": user.territory,
        })

class DealerSignupView(APIView):
    """
    Public Tier-1 Dealer registration (creates pending account).
    POST /api/v1/auth/signup/dealer/
    """
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            user, dealer = AuthService.register_dealer(request.data)
            return Response({
                "success": True,
                "message": "Dealer registration submitted successfully. Account pending administrative verification.",
                "dealer_id": dealer.id,
                "dealership_name": dealer.dealership_name,
                "status": user.status,
            }, status=status.HTTP_201_CREATED)
        except AuthError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

class SalesAgentSignupView(APIView):
    """
    Public Sales Agent application (creates pending account).
    POST /api/v1/auth/signup/sales-agent/
    """
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            user, agent = AuthService.register_sales_agent(request.data)
            return Response({
                "success": True,
                "message": "Sales agent application submitted successfully. Account pending administrative verification.",
                "agent_id": agent.id,
                "employee_id": agent.employee_id,
                "status": user.status,
            }, status=status.HTTP_201_CREATED)
        except AuthError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

class DistributorRequestView(APIView):
    """
    Public Wholesale Distributor request (creates pending account).
    POST /api/v1/auth/signup/distributor/
    """
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            user, distributor = AuthService.register_distributor_request(request.data)
            return Response({
                "success": True,
                "message": "Distributor partnership request submitted successfully. Under review by BFEL Management.",
                "distributor_id": distributor.id,
                "company_name": distributor.company_name,
                "status": user.status,
            }, status=status.HTTP_201_CREATED)
        except AuthError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

class AdminSignupBlockView(APIView):
    """
    Enforces strict security rule: Central Admin must NOT have public signup.
    POST /api/v1/auth/signup/admin/
    """
    permission_classes = [AllowAny]

    def post(self, request):
        return Response(
            {"error": "Public registration is prohibited for Central Admin. Administrative accounts are provisioned internally."},
            status=status.HTTP_403_FORBIDDEN
        )
