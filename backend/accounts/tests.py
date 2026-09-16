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
