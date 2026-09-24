import logging
from .models import AuditLog

logger = logging.getLogger(__name__)


def get_client_ip(request):
    """Safely extracts client IP address from standard headers."""
    if not request:
        return None
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def get_user_agent(request):
    """Safely extracts client user-agent string."""
    if not request:
        return ''
    return request.META.get('HTTP_USER_AGENT', '')[:490]


def record_audit_log(
    action_type,
    description,
    request=None,
    actor=None,
    target_entity='',
    target_id='',
    target_name='',
    severity='INFO',
    details=None,
    ip_address=None,
    user_agent=None
):
    """
    Creates an immutable audit record safely without raising exceptions to callers.
    """
    try:
        user = actor
        if user is None and request and hasattr(request, 'user') and request.user.is_authenticated:
            user = request.user

        username = ''
        email = ''
        role = ''

        if user and user.is_authenticated:
            username = user.username
            email = getattr(user, 'email', '')
            role = getattr(user, 'user_type', 'user')
        elif actor:
            username = str(actor)

        ip_addr = ip_address or get_client_ip(request)
        ua = user_agent if user_agent is not None else get_user_agent(request)

        return AuditLog.objects.create(
            actor=user if (user and user.is_authenticated) else None,
            actor_username=username,
            actor_email=email,
            actor_role=role,
            action_type=action_type,
            severity=severity,
            target_entity=target_entity,
            target_id=str(target_id) if target_id is not None else '',
            target_name=str(target_name) if target_name is not None else '',
            description=description,
            details=details or {},
            ip_address=ip_addr,
            user_agent=ua
        )
    except Exception as e:
        logger.warning(f"Failed to record audit log: {e}")
        return None
