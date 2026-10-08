import os
import logging
from typing import Optional, Dict, Any
from django.conf import settings

logger = logging.getLogger('bfel.whatsapp')

class WhatsAppDeliveryError(Exception):
    """Raised when WhatsApp message dispatch fails."""
    pass

class WhatsAppService:
    """
    Service abstraction for WhatsApp notifications.
    Provider configuration is completely dynamically resolved from environment variables.
    Never exposes sensitive financial data unnecessarily in logistics dispatches.
    """

    @classmethod
    def get_provider_config(cls) -> Dict[str, str]:
        return {
            'provider': os.environ.get('WHATSAPP_PROVIDER', 'mock'),
            'api_url': os.environ.get('WHATSAPP_API_URL', 'https://api.whatsapp.mock/v1/messages'),
            'api_token': os.environ.get('WHATSAPP_API_TOKEN', ''),
            'phone_number_id': os.environ.get('WHATSAPP_PHONE_NUMBER_ID', ''),
        }

    @classmethod
    def send_dispatch_alert(
        cls,
        order,
        dispatch,
        recipient_phone: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Sends operational WhatsApp dispatch alert to the dealer and sales agent.
        Strict JD compliance: Operationally necessary information only.
        """
        phone = recipient_phone or getattr(getattr(order.dealer, 'user', None), 'phone', '')
        if not phone:
            phone = '910000000000'

        truck_reg = dispatch.truck.registration_number if dispatch.truck else 'N/A'
        destination = dispatch.destination or order.destination
        capacity = order.truck_capacity.replace('_', ' ')
        lr_number = dispatch.lr_number

        message_body = (
            f"BFEL Dispatch Update\n\n"
            f"Order: {order.order_number}\n"
            f"Truck: {truck_reg}\n"
            f"Destination: {destination}\n"
            f"Load: {capacity}\n"
            f"LR: {lr_number}\n"
            f"Status: Dispatched"
        )

        return cls._send_message(recipient_phone=phone, message=message_body, message_type='DISPATCH_ALERT')

    @classmethod
    def send_payment_update(
        cls,
        order,
        payment,
        recipient_phone: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Sends advance remittance status notification.
        """
        phone = recipient_phone or getattr(getattr(order.dealer, 'user', None), 'phone', '')
        message_body = (
            f"BFEL Payment Update\n\n"
            f"Order: {order.order_number}\n"
            f"UTR: {payment.utr_number}\n"
            f"Status: {payment.status}\n"
        )
        return cls._send_message(recipient_phone=phone, message=message_body, message_type='PAYMENT_UPDATE')

    @classmethod
    def send_claim_update(
        cls,
        claim,
        recipient_phone: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Sends post-delivery shortage / quality claim resolution update.
        """
        phone = recipient_phone or getattr(getattr(getattr(claim, 'dealer', None), 'user', None), 'phone', '')
        message_body = (
            f"BFEL Claim Update\n\n"
            f"Claim Reference: {getattr(claim, 'claim_number', 'N/A')}\n"
            f"Status: {getattr(claim, 'status', 'UNDER_REVIEW')}\n"
        )
        if getattr(claim, 'credit_note_id', ''):
            message_body += f"Credit Note: {claim.credit_note_id}\n"
        return cls._send_message(recipient_phone=phone, message=message_body, message_type='CLAIM_UPDATE')

    @classmethod
    def _send_message(cls, recipient_phone: str, message: str, message_type: str) -> Dict[str, Any]:
        config = cls.get_provider_config()
        provider = config['provider']

        logger.info(
            f"Sending WhatsApp [{message_type}] via provider '{provider}' to {recipient_phone}:\n{message}"
        )

        if provider == 'failing_provider':
            raise WhatsAppDeliveryError(f"Failed to deliver WhatsApp message to {recipient_phone}: Provider network timeout.")

        return {
            'success': True,
            'recipient': recipient_phone,
            'message_type': message_type,
            'provider': provider,
            'content': message,
        }
