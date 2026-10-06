from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User


class AuthApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='admin',
            email='admin@blitzcyberlab.io',
            password='Admin@12345',
            user_type='admin'
        )
        self.student = User.objects.create_user(
            username='rohith',
            email='rohith@blitzcyberlab.io',
            password='Student@12345',
            user_type='student'
        )

        self.instructor = User.objects.create_user(
            username='instructor',
            email='instructor@blitzcyberlab.io',
            password='Instructor@12345',
            user_type='instructor'
        )

    def test_admin_login_with_email_success(self):
        response = self.client.post('/api/auth/login/', {
            'email': 'admin@blitzcyberlab.io',
            'password': 'Admin@12345'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['user_type'], 'admin')
        self.assertEqual(response.data['user']['user_type'], 'admin')
        self.assertEqual(response.data['user']['email'], 'admin@blitzcyberlab.io')

    def test_instructor_login_and_admin_permission_success(self):
        response = self.client.post('/api/auth/login/', {
            'email': 'instructor@blitzcyberlab.io',
            'password': 'Instructor@12345'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['user_type'], 'instructor')
        self.assertEqual(response.data['user']['user_type'], 'instructor')
        self.assertTrue(response.data['user']['is_admin'])

        # Verify instructor can access admin endpoints (e.g. students list)
        token = response.data['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        admin_res = self.client.get('/api/students/')
        self.assertEqual(admin_res.status_code, status.HTTP_200_OK)

    def test_admin_login_with_username_success(self):
        response = self.client.post('/api/auth/login/', {
            'username': 'admin',
            'password': 'Admin@12345'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user_type'], 'admin')

    def test_student_login_success(self):
        response = self.client.post('/api/auth/login/', {
            'email': 'rohith@blitzcyberlab.io',
            'password': 'Student@12345'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user_type'], 'student')

    def test_login_invalid_password(self):
        response = self.client.post('/api/auth/login/', {
            'email': 'admin@blitzcyberlab.io',
            'password': 'WrongPassword'
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', response.data)

    def test_role_access_flags_in_api(self):
        from accounts.serializers import UserSerializer
        admin_data = UserSerializer(self.admin).data
        self.assertTrue(admin_data['can_access_django_admin'])
        self.assertTrue(admin_data['can_access_admin_dashboard'])
        self.assertTrue(admin_data['can_access_student_panel'])

        instructor_data = UserSerializer(self.instructor).data
        self.assertFalse(instructor_data['can_access_django_admin'])
        self.assertTrue(instructor_data['can_access_admin_dashboard'])
        self.assertFalse(instructor_data['can_access_student_panel'])

        student_data = UserSerializer(self.student).data
        self.assertFalse(student_data['can_access_django_admin'])
        self.assertFalse(student_data['can_access_admin_dashboard'])
        self.assertTrue(student_data['can_access_student_panel'])

    def test_django_admin_permission_check(self):
        from django.contrib import admin
        from django.test import RequestFactory
        factory = RequestFactory()

        # Admin user
        req_admin = factory.get('/admin/')
        req_admin.user = self.admin
        self.assertTrue(admin.site.has_permission(req_admin))

        # Instructor user - MUST NOT have Django admin panel access
        req_ins = factory.get('/admin/')
        req_ins.user = self.instructor
        self.assertFalse(admin.site.has_permission(req_ins))

        # Student user - MUST NOT have Django admin panel access
        req_stu = factory.get('/admin/')
        req_stu.user = self.student
        self.assertFalse(admin.site.has_permission(req_stu))

    def test_student_cannot_access_admin_endpoints(self):
        # Authenticate as student
        token_res = self.client.post('/api/auth/login/', {
            'email': 'rohith@blitzcyberlab.io',
            'password': 'Student@12345'
        }, format='json')
        student_token = token_res.data['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {student_token}')

        # Attempt to access admin dashboard API
        res = self.client.get('/api/students/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_instructor_cannot_create_admin_account(self):
        # Authenticate as instructor
        token_res = self.client.post('/api/auth/login/', {
            'email': 'instructor@blitzcyberlab.io',
            'password': 'Instructor@12345'
        }, format='json')
        instructor_token = token_res.data['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {instructor_token}')

        # Attempt to create an admin user
        res = self.client.post('/api/students/', {
            'username': 'newadmin',
            'email': 'newadmin@blitzcyberlab.io',
            'first_name': 'New',
            'password': 'AdminPassword@123',
            'confirm_password': 'AdminPassword@123',
            'user_type': 'admin'
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

