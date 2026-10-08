from decimal import Decimal
from typing import Union, Optional
from django.db import transaction
from django.core.exceptions import ValidationError
from django.utils import timezone

from apps.distributors.models import Distributor, DistributorWallet, WalletLedgerEntry
from services.audit import AuditService

class DistributorWalletService:
    """
    Financial ledger operations for regional distributor wallets.
    Guarantees that every balance or credit modification produces an immutable ledger entry.
    All operations execute inside database transactions with row-level locks (select_for_update).
    """

    @staticmethod
    def get_or_create_wallet(distributor: Union[Distributor, int]) -> DistributorWallet:
        if isinstance(distributor, (int, str)):
            distributor = Distributor.objects.get(pk=distributor)
        wallet, _ = DistributorWallet.objects.get_or_create(
            distributor=distributor,
            defaults={
                'available_balance': Decimal('0.00'),
                'credit_limit': Decimal('1000000.00'),
                'reserved_funds': Decimal('0.00'),
            }
        )
        return wallet

    @classmethod
    def credit_wallet(
        cls,
        wallet: Union[DistributorWallet, int],
        amount: Decimal,
        reference: str,
        description: str,
        actor=None,
    ) -> DistributorWallet:
        """
        Credits funds to the distributor's prepaid balance and records an immutable ledger entry.
        """
        amount = Decimal(str(amount))
        if amount <= Decimal('0.00'):
            raise ValidationError("Credit amount must be greater than zero.")

        wallet_id = wallet.pk if isinstance(wallet, DistributorWallet) else wallet

        with transaction.atomic():
            wallet = DistributorWallet.objects.select_for_update().get(pk=wallet_id)
            new_balance = wallet.available_balance + amount
            wallet.available_balance = new_balance
            wallet.save()

            WalletLedgerEntry.objects.create(
                wallet=wallet,
                entry_type=WalletLedgerEntry.EntryType.CREDIT,
                amount=amount,
                balance_after=new_balance,
                reference=reference,
                description=description,
            )

            AuditService.log_event(
                action='WALLET_CREDITED',
                entity='DistributorWallet',
                entity_id=str(wallet.pk),
                role=getattr(getattr(actor, 'role', None), 'code', 'system'),
                actor=actor,
                metadata={
                    'amount': str(amount),
                    'balance_after': str(new_balance),
                    'reference': reference,
                }
            )

        return wallet

    @classmethod
    def debit_wallet(
        cls,
        wallet: Union[DistributorWallet, int],
        amount: Decimal,
        reference: str,
        description: str,
        actor=None,
    ) -> DistributorWallet:
        """
        Debits funds from the distributor's prepaid balance with strict overdraft prevention.
        """
        amount = Decimal(str(amount))
        if amount <= Decimal('0.00'):
            raise ValidationError("Debit amount must be greater than zero.")

        wallet_id = wallet.pk if isinstance(wallet, DistributorWallet) else wallet

        with transaction.atomic():
            wallet = DistributorWallet.objects.select_for_update().get(pk=wallet_id)
            if wallet.available_balance < amount:
                raise ValidationError(
                    f"Insufficient wallet balance. Available: ₹{wallet.available_balance}, "
                    f"attempted debit: ₹{amount}."
                )

            new_balance = wallet.available_balance - amount
            wallet.available_balance = new_balance
            wallet.save()

            WalletLedgerEntry.objects.create(
                wallet=wallet,
                entry_type=WalletLedgerEntry.EntryType.DEBIT,
                amount=amount,
                balance_after=new_balance,
                reference=reference,
                description=description,
            )

            AuditService.log_event(
                action='WALLET_DEBITED',
                entity='DistributorWallet',
                entity_id=str(wallet.pk),
                role=getattr(getattr(actor, 'role', None), 'code', 'system'),
                actor=actor,
                metadata={
                    'amount': str(amount),
                    'balance_after': str(new_balance),
                    'reference': reference,
                }
            )

        return wallet

    @classmethod
    def reserve_credit(
        cls,
        wallet: Union[DistributorWallet, int],
        amount: Decimal,
        reference: str,
        description: str,
        actor=None,
    ) -> DistributorWallet:
        """
        Encumbers distributor revolving credit headroom for an active order dispatch.
        """
        amount = Decimal(str(amount))
        if amount <= Decimal('0.00'):
            raise ValidationError("Reservation amount must be greater than zero.")

        wallet_id = wallet.pk if isinstance(wallet, DistributorWallet) else wallet

        with transaction.atomic():
            wallet = DistributorWallet.objects.select_for_update().get(pk=wallet_id)
            avail_credit = wallet.available_credit
            if avail_credit < amount:
                raise ValidationError(
                    f"Insufficient credit limit headroom. Available credit: ₹{avail_credit}, "
                    f"attempted reservation: ₹{amount}."
                )

            wallet.reserved_funds += amount
            wallet.save()

            WalletLedgerEntry.objects.create(
                wallet=wallet,
                entry_type=WalletLedgerEntry.EntryType.DEBIT,
                amount=amount,
                balance_after=wallet.available_balance,
                reference=reference,
                description=f"CREDIT_RESERVATION: {description}",
            )

        return wallet

    @classmethod
    def release_reserved_credit(
        cls,
        wallet: Union[DistributorWallet, int],
        amount: Decimal,
        reference: str,
        description: str,
        actor=None,
    ) -> DistributorWallet:
        """
        Releases encumbered credit headroom.
        """
        amount = Decimal(str(amount))
        if amount <= Decimal('0.00'):
            raise ValidationError("Release amount must be greater than zero.")

        wallet_id = wallet.pk if isinstance(wallet, DistributorWallet) else wallet

        with transaction.atomic():
            wallet = DistributorWallet.objects.select_for_update().get(pk=wallet_id)
            wallet.reserved_funds = max(Decimal('0.00'), wallet.reserved_funds - amount)
            wallet.save()

            WalletLedgerEntry.objects.create(
                wallet=wallet,
                entry_type=WalletLedgerEntry.EntryType.CREDIT,
                amount=amount,
                balance_after=wallet.available_balance,
                reference=reference,
                description=f"CREDIT_RELEASE: {description}",
            )

        return wallet
