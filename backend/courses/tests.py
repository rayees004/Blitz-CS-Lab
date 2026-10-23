from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User
from courses.models import Lab, LabQuestion, LabSubmission


class LabSecurityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='admin', email='admin@blitzcyberlab.io', password='Admin@12345', user_type='admin'
        )
        self.instructor = User.objects.create_user(
            username='instructor', email='instructor@blitzcyberlab.io', password='Instructor@12345', user_type='instructor'
        )
        self.student = User.objects.create_user(
            username='rohith', email='rohith@blitzcyberlab.io', password='Student@12345', user_type='student'
        )
        self.other_student = User.objects.create_user(
            username='anjali', email='anjali@blitzcyberlab.io', password='Student@12345', user_type='student'
        )
        self.lab = Lab.objects.create(name='SQLi Basics', points=100)
        self.question = LabQuestion.objects.create(lab=self.lab, title='Find the flag', flag='BLITZ{secret}', points=50)

    def _first_question(self, response):
        return response.data['results'][0]['questions'][0]

    def test_student_lab_list_hides_flags(self):
        self.client.force_authenticate(self.student)
        response = self.client.get('/api/labs/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn('flag', self._first_question(response))

    def test_student_lab_detail_hides_flags(self):
        self.client.force_authenticate(self.student)
        response = self.client.get(f'/api/labs/{self.lab.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn('flag', response.data['questions'][0])

    def test_admin_and_instructor_see_flags(self):
        for user in (self.admin, self.instructor):
            self.client.force_authenticate(user)
            response = self.client.get('/api/labs/')
            self.assertEqual(self._first_question(response)['flag'], 'BLITZ{secret}')

    def test_student_endpoints_require_login(self):
        for url in (
            '/api/student/labs/',
            '/api/student/lab-scores/',
            '/api/student/materials/',
            f'/api/student/labs/{self.lab.id}/attend/',
            f'/api/student/labs/{self.lab.id}/retake-request/',
            '/api/materials/',
        ):
            response = self.client.get(url)
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED, url)

        response = self.client.post(f'/api/student/labs/{self.lab.id}/submit/', {
            'student_id': self.student.id, 'question_id': self.question.id, 'flag': 'BLITZ{secret}'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(LabSubmission.objects.exists())

    def test_lab_creator_visible_to_admin_and_instructor_only(self):
        self.lab.created_by = self.instructor
        self.lab.save()
        creator_fields = ('created_by', 'created_by_name', 'created_by_username', 'created_by_role', 'created_by_id')

        for user in (self.admin, self.instructor):
            self.client.force_authenticate(user)
            lab_data = self.client.get(f'/api/labs/{self.lab.id}/').data
            self.assertEqual(lab_data['created_by_username'], 'instructor')
            self.assertEqual(lab_data['created_by_role'], 'instructor')
            student_view = self.client.get('/api/student/labs/').data['labs'][0]
            self.assertEqual(student_view['created_by_username'], 'instructor')

        self.client.force_authenticate(self.student)
        lab_data = self.client.get(f'/api/labs/{self.lab.id}/').data
        listed = self.client.get('/api/labs/').data['results'][0]
        student_list = self.client.get('/api/student/labs/').data['labs'][0]
        attend = self.client.get(f'/api/student/labs/{self.lab.id}/attend/').data['lab']
        for payload in (lab_data, listed, student_list, attend):
            for field in creator_fields:
                self.assertNotIn(field, payload)

    def test_subject_lab_create_records_creator(self):
        from courses.models import Subject
        subject = Subject.objects.create(name='Web Security')
        self.client.force_authenticate(self.instructor)
        response = self.client.post(f'/api/subjects/{subject.id}/labs/', {'name': 'XSS Lab'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(Lab.objects.get(name='XSS Lab').created_by, self.instructor)
        self.assertEqual(response.data['lab']['created_by_username'], 'instructor')

    def test_student_dashboard_stats_include_assigned_and_questions(self):
        self.client.force_authenticate(self.student)
        self.client.post(f'/api/student/labs/{self.lab.id}/submit/', {
            'question_id': self.question.id, 'flag': 'BLITZ{secret}'
        }, format='json')
        stats = self.client.get('/api/student/labs/').data['stats']
        self.assertEqual(stats['labs_assigned'], 1)
        self.assertEqual(stats['total_questions_completed'], 1)

    def test_submit_ignores_student_id_parameter(self):
        self.client.force_authenticate(self.student)
        response = self.client.post(f'/api/student/labs/{self.lab.id}/submit/', {
            'student_id': self.other_student.id, 'question_id': self.question.id, 'flag': 'BLITZ{secret}'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertTrue(LabSubmission.objects.filter(student=self.student, lab=self.lab).exists())
        self.assertFalse(LabSubmission.objects.filter(student=self.other_student).exists())
