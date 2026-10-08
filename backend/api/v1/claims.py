from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError, PermissionDenied
from django.shortcuts import get_object_or_404
from django.db.models import Q

from permissions import IsActiveBfelUser
from apps.users.models import Role
from apps.claims.models import Claim
from apps.claims.serializers import (
    ClaimDetailSerializer,
    ClaimCreateInputSerializer,
    ClaimReviewActionSerializer,
    ClaimEvidenceSerializer,
)
from services.claims import ClaimService


class ClaimListCreateView(APIView):
    """
    List post-delivery claims with strict role isolation, or file a new claim.
    GET  /api/v1/claims/
    POST /api/v1/claims/
    """
    permission_classes = [IsActiveBfelUser]

    def get_queryset(self, user):
        role_code = getattr(getattr(user, 'role', None), 'code', None)
        if user.is_superuser or role_code in {Role.Code.ADMIN, Role.Code.ACCOUNTS}:
            return Claim.objects.all().select_related('order', 'dealer', 'created_by', 'reviewed_by').prefetch_related('evidence_files')

        if role_code == Role.Code.DEALER:
            return Claim.objects.filter(dealer__user=user).select_related(
                'order', 'dealer', 'created_by', 'reviewed_by'
            ).prefetch_related('evidence_files')

        if role_code == Role.Code.SALES_AGENT:
            return Claim.objects.filter(
                Q(created_by=user) | Q(dealer__assigned_sales_agent__user=user)
            ).select_related('order', 'dealer', 'created_by', 'reviewed_by').prefetch_related('evidence_files')

        return Claim.objects.none()

    def get(self, request):
        qs = self.get_queryset(request.user).order_by('-created_at')
        serializer = ClaimDetailSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        role_code = getattr(getattr(request.user, 'role', None), 'code', None)
        if not (request.user.is_superuser or role_code in {Role.Code.DEALER, Role.Code.SALES_AGENT, Role.Code.ADMIN}):
            return Response(
                {"detail": "Only Dealers, authorized Sales Agents, or Administrators can file claims."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = ClaimCreateInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        order = data['order']

        # Determine dealer
        dealer = order.dealer

        # Collect evidence files from request.FILES
        evidence_files = []
        for key in ['photos', 'evidence', 'files', 'file']:
            if key in request.FILES:
                evidence_files.extend(request.FILES.getlist(key))

        try:
            claim = ClaimService.file_claim(
                order=order,
                dealer=dealer,
                claim_type=data['claim_type'],
                affected_bags=data['affected_bags'],
                description=data['description'],
                created_by=request.user,
                evidence_files=evidence_files or None,
            )
        except ValidationError as e:
            msg = e.message if hasattr(e, 'message') else str(e)
            return Response({"detail": msg}, status=status.HTTP_400_BAD_REQUEST)
        except PermissionDenied as e:
            return Response({"detail": str(e)}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        response_serializer = ClaimDetailSerializer(claim)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class ClaimDetailView(APIView):
    """
    Retrieve single claim detail.
    GET /api/v1/claims/{id}/
    """
    permission_classes = [IsActiveBfelUser]

    def get(self, request, pk):
        claim = get_object_or_404(
            Claim.objects.select_related('order', 'dealer', 'created_by', 'reviewed_by').prefetch_related('evidence_files'),
            pk=pk
        )
        try:
            ClaimService.verify_dealer_access(claim, request.user)
        except PermissionDenied as e:
            return Response({"detail": str(e)}, status=status.HTTP_403_FORBIDDEN)

        serializer = ClaimDetailSerializer(claim)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ClaimEvidenceUploadView(APIView):
    """
    Upload additional photo evidence to an existing claim.
    POST /api/v1/claims/{id}/evidence/
    """
    permission_classes = [IsActiveBfelUser]

    def post(self, request, pk):
        claim = get_object_or_404(Claim, pk=pk)
        try:
            ClaimService.verify_dealer_access(claim, request.user)
        except PermissionDenied as e:
            return Response({"detail": str(e)}, status=status.HTTP_403_FORBIDDEN)

        files = []
        for key in ['photos', 'evidence', 'files', 'file']:
            if key in request.FILES:
                files.extend(request.FILES.getlist(key))

        if not files:
            return Response({"detail": "No photo evidence files provided in upload."}, status=status.HTTP_400_BAD_REQUEST)

        created_evidences = []
        try:
            for f in files:
                caption = request.data.get('caption', '')
                ev = ClaimService.add_evidence(claim, f, caption=caption, uploaded_by=request.user)
                created_evidences.append(ev)
        except ValidationError as e:
            msg = e.message if hasattr(e, 'message') else str(e)
            return Response({"detail": msg}, status=status.HTTP_400_BAD_REQUEST)

        serializer = ClaimEvidenceSerializer(created_evidences, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ClaimReviewView(APIView):
    """
    Review, approve, or reject a claim.
    POST /api/v1/claims/{id}/review/
    """
    permission_classes = [IsActiveBfelUser]

    def post(self, request, pk):
        claim = get_object_or_404(Claim, pk=pk)

        serializer = ClaimReviewActionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        action = data['action']
        notes = data.get('notes', '')
        approved_amount = data.get('approved_amount')

        try:
            if action == 'UNDER_REVIEW':
                claim = ClaimService.mark_under_review(claim, reviewer=request.user, review_notes=notes)
            elif action == 'APPROVE':
                claim = ClaimService.approve_claim(
                    claim,
                    reviewer=request.user,
                    approved_amount=approved_amount,
                    review_notes=notes,
                )
            elif action == 'REJECT':
                claim = ClaimService.reject_claim(claim, reviewer=request.user, rejection_reason=notes)
        except PermissionDenied as e:
            return Response({"detail": str(e)}, status=status.HTTP_403_FORBIDDEN)
        except ValidationError as e:
            msg = e.message if hasattr(e, 'message') else str(e)
            return Response({"detail": msg}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        response_serializer = ClaimDetailSerializer(claim)
        return Response(response_serializer.data, status=status.HTTP_200_OK)
