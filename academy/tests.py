from django.test import TestCase
from django.urls import reverse
from .models import User, Student, Course, AcademyClass, Lab, StudyMaterial


class BlitzAcademySecurityTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username='admin',
            email='admin@blitzacademy.test',
            password='SecurePass!123',
            role='SUPER_ADMIN',
            is_staff=True,
            is_superuser=True,
        )
        self.course = Course.objects.create(name='Bug Bounty Basics', slug='bug-bounty-basics')
        self.aclass = AcademyClass.objects.create(
            class_id='BA-101',
            name='Bug Bounty Bootcamp',
            batch_name='Batch 01',
            course=self.course,
            status='ACTIVE',
        )
        self.student_user = User.objects.create_user(
            username='student01',
            email='student01@blitzacademy.test',
            password='SecurePass!123',
            role='STUDENT',
        )
        self.student = Student.objects.create(
            user=self.student_user,
            student_id='STU-001',
            full_name='Student One',
            phone='1234567890',
            academy_class=self.aclass,
            fee_status='PAID',
            lab_access='ENABLED',
        )
        self.lab = Lab.objects.create(
            lab_id='LAB-001',
            name='Information Disclosure',
            category='Recon',
            difficulty='BEGINNER',
            points=100,
            flag='FLAG{initial_lab_flag}',
            is_active=True,
        )
        self.material = StudyMaterial.objects.create(
            title='Intro to recon',
            description='Notes for the first lab',
            course=self.course,
            academy_class=self.aclass,
            visibility='CLASS',
            file_name='intro.pdf',
            file_type='pdf',
        )

    def test_login_and_dashboard_access(self):
        response = self.client.post(
            reverse('login'),
            {'username': 'student01', 'password': 'SecurePass!123'},
            follow=True,
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Student Dashboard')

    def test_student_cannot_access_admin_pages(self):
        self.client.login(username='student01', password='SecurePass!123')
        response = self.client.get(reverse('admin_dashboard'))
        self.assertEqual(response.status_code, 403)

    def test_student_cannot_access_other_class_material(self):
        other_class = AcademyClass.objects.create(
            class_id='BA-202',
            name='Other Batch',
            batch_name='Batch 02',
            course=self.course,
            status='ACTIVE',
        )
        other_material = StudyMaterial.objects.create(
            title='Secret notes',
            description='Not for this class',
            course=self.course,
            academy_class=other_class,
            visibility='CLASS',
            file_name='secret.pdf',
            file_type='pdf',
        )
        self.client.login(username='student01', password='SecurePass!123')
        response = self.client.get(reverse('study_material_detail', args=[other_material.pk]))
        self.assertEqual(response.status_code, 403)

    def test_flag_submission_requires_server_side_validation(self):
        self.client.login(username='student01', password='SecurePass!123')
        response = self.client.post(
            reverse('lab_submit', args=[self.lab.pk]),
            {'flag': 'wrong-flag'},
            follow=True,
        )
        self.assertContains(response, 'Incorrect flag')

    def test_lab_access_is_enforced_for_fee_due_students(self):
        self.student.fee_status = 'DUE'
        self.student.lab_access = 'DISABLED'
        self.student.save()
        self.client.login(username='student01', password='SecurePass!123')
        response = self.client.get(reverse('lab_detail', args=[self.lab.pk]))
        self.assertEqual(response.status_code, 403)
