"""
API rate limiting (DRF throttling) shared by every endpoint.

Default limits apply to all DRF views through REST_FRAMEWORK['DEFAULT_THROTTLE_CLASSES']:
  - anonymous requests are counted per client IP           (scope 'anon')
  - authenticated requests are counted per user account    (scope 'user'), so every user
    has their own independent budget instead of sharing one
Sensitive endpoints add a stricter scope on top of the defaults with `with_default_throttles()`:
  - 'login'           per client IP    (brute-force protection for POST /api/auth/login/)
  - 'password_change' per user         (staff setting a student's password)
  - 'uploads'         per user         (requests that actually carry a file)

The rates themselves live in settings.REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'].
Counters are stored in the dedicated 'throttle' cache (settings.CACHES), which is shared
by all worker processes, so limits stay correct with several app processes running.
"""
import ipaddress

from django.core.cache import caches
from rest_framework.settings import api_settings
from rest_framework.throttling import AnonRateThrottle, SimpleRateThrottle, UserRateThrottle


def client_ip(request):
    """
    The client's IP address for per-IP limits.

    REMOTE_ADDR is used directly: on this deployment the web server (LiteSpeed) talks to
    clients itself, and REMOTE_ADDR cannot be forged, unlike X-Forwarded-For. Only if
    REMOTE_ADDR is a loopback/private address (the app is behind a local reverse proxy) do we
    fall back to the last X-Forwarded-For entry — the one that proxy appended.
    """
    remote_addr = request.META.get('REMOTE_ADDR', '')
    xff = request.META.get('HTTP_X_FORWARDED_FOR', '')
    if xff:
        try:
            behind_local_proxy = ipaddress.ip_address(remote_addr).is_private
        except ValueError:
            behind_local_proxy = False
        if behind_local_proxy:
            return xff.split(',')[-1].strip() or remote_addr
    return remote_addr


class SharedCacheThrottleMixin:
    """Store counters in the shared 'throttle' cache and identify clients with client_ip()."""

    @property
    def cache(self):
        return caches['throttle']

    def get_ident(self, request):
        return client_ip(request)


class AnonIPRateThrottle(SharedCacheThrottleMixin, AnonRateThrottle):
    """Default limit for anonymous requests, counted per client IP (scope 'anon')."""


class PerUserRateThrottle(SharedCacheThrottleMixin, UserRateThrottle):
    """Default limit for authenticated requests, counted per user id (scope 'user')."""


class LoginRateThrottle(SharedCacheThrottleMixin, SimpleRateThrottle):
    """Strict per-IP limit on login attempts, whoever is (or isn't) signed in."""
    scope = 'login'

    def get_cache_key(self, request, view):
        return self.cache_format % {'scope': self.scope, 'ident': self.get_ident(request)}


class PasswordChangeRateThrottle(SharedCacheThrottleMixin, UserRateThrottle):
    """Strict per-user limit on setting passwords."""
    scope = 'password_change'


class UploadRateThrottle(SharedCacheThrottleMixin, UserRateThrottle):
    """
    Per-user limit on file uploads. Only requests that actually include a file count, so
    listing, viewing and editing without a new file on the same endpoints are unaffected.
    """
    scope = 'uploads'

    def get_cache_key(self, request, view):
        if not request.FILES:
            return None  # no file in this request: not throttled by this scope
        return super().get_cache_key(request, view)


def with_default_throttles(*extra):
    """
    throttle_classes for a view that needs a stricter scope: keeps the global defaults
    (setting throttle_classes on a view replaces them) and adds the given classes.
    """
    return [*api_settings.DEFAULT_THROTTLE_CLASSES, *extra]
