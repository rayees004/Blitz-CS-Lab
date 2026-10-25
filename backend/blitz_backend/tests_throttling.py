"""
Tests for API rate limiting (blitz_backend/throttling.py).

Ordinary tests run with a dummy throttle cache (no limits). These tests switch the 'throttle'
cache to a real in-memory cache, and shrink rates with patch.dict where a test would otherwise
need 100 requests.
"""
from unittest.mock import patch

from django.core.cache import caches
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.settings import api_settings
from rest_framework.test import APIClient
from rest_framework.throttling import SimpleRateThrottle

from accounts.models import User
from courses.models import Lab, Subject

THROTTLE_CACHE = {
    'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'},
    'throttle': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache', 'LOCATION': 'throttle-tests'},
}
RATES = SimpleRateThrottle.THROTTLE_RATES  # the live DEFAULT_THROTTLE_RATES dict


@override_settings(CACHES=THROTTLE_CACHE)
class ThrottleTestCase(TestCase):
    def setUp(self):
        caches['throttle'].clear()
        self.client = APIClient()
        self.alice = User.objects.create_user(username='alice', email='alice@blitz.io', password='Alice#Pass2026', user_type='student')
        self.bob = User.objects.create_user(username='bob', email='bob@blitz.io', password='Bob#Pass2026', user_type='student')

    def get_as(self, user, url='/api/auth/me/', ip='10.0.0.1'):
        self.client.force_authenticate(user)
        return self.client.get(url, REMOTE_ADDR=ip)

    def login(self, ip='10.0.0.9', email='alice@blitz.io', password='wrong'):
        self.client.force_authenticate(None)
        return self.client.post('/api/auth/login/', {'email': email, 'password': password}, format='json', REMOTE_ADDR=ip)


class ConfiguredRatesTests(TestCase):
    def test_default_rates_and_classes(self):
        self.assertEqual(RATES['anon'], '20/minute')
        self.assertEqual(RATES['user'], '100/minute')
        self.assertEqual(RATES['login'], '20/minute')
        self.assertEqual(RATES['password_change'], '3/minute')
        self.assertEqual(RATES['uploads'], '10/hour')
        self.assertEqual(
            [c.__name__ for c in api_settings.DEFAULT_THROTTLE_CLASSES],
            ['AnonIPRateThrottle', 'PerUserRateThrottle'],
        )


class AuthenticatedUserLimitTests(ThrottleTestCase):
    def test_requests_within_the_limit_succeed(self):
        for _ in range(100):  # the real default: 100/minute per user
            self.assertEqual(self.get_as(self.alice).status_code, status.HTTP_200_OK)

    @patch.dict(RATES, {'user': '3/minute'})
    def test_429_after_exceeding_the_limit(self):
        for _ in range(3):
            self.assertEqual(self.get_as(self.alice).status_code, status.HTTP_200_OK)
        response = self.get_as(self.alice)
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertIn('Retry-After', response)
        self.assertIn('throttled', response.data['detail'])

    @patch.dict(RATES, {'user': '3/minute'})
    def test_each_user_has_an_independent_limit(self):
        for _ in range(3):
            self.get_as(self.alice)
        self.assertEqual(self.get_as(self.alice).status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        # Bob, from the same IP, still has his full budget
        for _ in range(3):
            self.assertEqual(self.get_as(self.bob).status_code, status.HTTP_200_OK)
        self.assertEqual(self.get_as(self.bob).status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    @patch.dict(RATES, {'user': '3/minute'})
    def test_user_limit_follows_the_account_not_the_ip(self):
        for i in range(3):
            self.get_as(self.alice, ip=f'10.0.1.{i}')
        self.assertEqual(self.get_as(self.alice, ip='10.0.1.99').status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    @patch.dict(RATES, {'user': '3/minute'})
    def test_works_with_token_authentication(self):
        token = self.client.post('/api/auth/login/', {'email': 'alice@blitz.io', 'password': 'Alice#Pass2026'}, format='json').data['token']
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        for _ in range(3):
            self.assertEqual(client.get('/api/auth/me/').status_code, status.HTTP_200_OK)
        self.assertEqual(client.get('/api/auth/me/').status_code, status.HTTP_429_TOO_MANY_REQUESTS)


class AnonymousIPLimitTests(ThrottleTestCase):
    """
    DRF checks permissions before throttles, so anonymous requests to protected endpoints get
    401 straight away; the anonymous limit matters on public endpoints (login). The login limit
    is raised here so the 20/minute anonymous limit is the one that triggers.
    """

    @patch.dict(RATES, {'login': '100/minute'})
    def test_anonymous_limited_per_ip(self):
        for _ in range(20):
            self.assertEqual(self.login(ip='203.0.113.5').status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.login(ip='203.0.113.5').status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        # A different IP is counted separately
        self.assertEqual(self.login(ip='203.0.113.6').status_code, status.HTTP_400_BAD_REQUEST)

    def test_forged_forwarded_for_header_does_not_bypass_the_limit(self):
        def attempt(fake_ip):
            # A public client address (documentation ranges like 203.0.113.0/24 count as private)
            return self.client.post('/api/auth/login/', {'email': 'x@blitz.io', 'password': 'x'}, format='json',
                                    REMOTE_ADDR='93.184.216.34', HTTP_X_FORWARDED_FOR=fake_ip)
        for i in range(20):
            attempt(f'198.51.100.{i}')
        self.assertEqual(attempt('198.51.100.250').status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_behind_a_local_proxy_the_forwarded_client_ip_is_used(self):
        def attempt(client_ip):
            return self.client.post('/api/auth/login/', {'email': 'x@blitz.io', 'password': 'x'}, format='json',
                                    REMOTE_ADDR='127.0.0.1', HTTP_X_FORWARDED_FOR=client_ip)
        for _ in range(20):
            attempt('198.51.100.1')
        self.assertEqual(attempt('198.51.100.1').status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        # Another client behind the same proxy has its own budget
        self.assertEqual(attempt('198.51.100.2').status_code, status.HTTP_400_BAD_REQUEST)


class SensitiveEndpointTests(ThrottleTestCase):
    # Anonymous limit raised so the 21st attempt is refused by the login scope itself
    @patch.dict(RATES, {'anon': '100/minute'})
    def test_login_limited_to_20_per_minute_per_ip(self):
        for _ in range(20):
            self.assertEqual(self.login().status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.login().status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        # Even the right password is refused from that IP until the window passes
        self.assertEqual(self.login(password='Alice#Pass2026').status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        # Another IP can still log in
        response = self.login(ip='10.0.0.10', password='Alice#Pass2026')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)

    def test_password_change_limited_to_3_per_minute(self):
        admin = User.objects.create_user(username='admin', email='admin@blitz.io', password='x', user_type='admin')
        self.client.force_authenticate(admin)
        url = f'/api/students/{self.alice.id}/set-password/'
        for i in range(3):
            pw = f'New#Pass2026{i}'
            self.assertEqual(self.client.post(url, {'password': pw, 'confirm_password': pw}, format='json').status_code, status.HTTP_200_OK)
        pw = 'New#Pass2026x'
        self.assertEqual(self.client.post(url, {'password': pw, 'confirm_password': pw}, format='json').status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    @patch.dict(RATES, {'uploads': '2/hour'})
    def test_upload_limit_counts_only_requests_with_files(self):
        instructor = User.objects.create_user(username='inst', email='inst@blitz.io', password='x', user_type='instructor')
        subject = Subject.objects.create(name='CEH', code='CEH')
        lab = Lab.objects.create(name='Lab', subject=subject, created_by=instructor)
        self.client.force_authenticate(instructor)
        url = f'/api/labs/{lab.id}/'

        # Edits without a file are not counted
        for i in range(5):
            self.assertEqual(self.client.patch(url, {'name': f'Lab {i}'}, format='json').status_code, status.HTTP_200_OK)

        def upload(n):
            return self.client.patch(url, {'source_file': SimpleUploadedFile(f'src{n}.zip', b'zip', content_type='application/zip')}, format='multipart')

        with self.settings(MEDIA_ROOT=self._tmp_media()):
            self.assertEqual(upload(1).status_code, status.HTTP_200_OK)
            self.assertEqual(upload(2).status_code, status.HTTP_200_OK)
            self.assertEqual(upload(3).status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        # Viewing the same endpoint still works
        self.assertEqual(self.client.get(url).status_code, status.HTTP_200_OK)

    def _tmp_media(self):
        import shutil
        import tempfile
        path = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, path, ignore_errors=True)
        return path


class ExistingFunctionalityTests(ThrottleTestCase):
    """With real throttling on, normal use is unaffected."""

    def test_login_then_use_the_api(self):
        response = self.login(password='Alice#Pass2026')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {response.data['token']}")
        me = client.get('/api/auth/me/')
        self.assertEqual(me.status_code, status.HTTP_200_OK)
        self.assertEqual(me.data['user']['username'], 'alice')
        self.assertEqual(client.get('/api/student/labs/').status_code, status.HTTP_200_OK)
        self.assertEqual(client.post('/api/auth/logout/').status_code, status.HTTP_200_OK)

    def test_permissions_still_apply(self):
        # A student still can't reach staff endpoints (403, not 429)
        self.assertEqual(self.get_as(self.alice, url='/api/students/').status_code, status.HTTP_403_FORBIDDEN)
