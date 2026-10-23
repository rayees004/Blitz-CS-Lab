from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User
from courses.models import Lab, LabQuestion, LabSubmission, Subject, SubjectEnrollment, StudentClass


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
        self.subject = Subject.objects.create(name='CEH', code='CEH')
        SubjectEnrollment.objects.create(student=self.student, subject=self.subject)
        self.lab = Lab.objects.create(name='SQLi Basics', points=100, subject=self.subject)
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


class SubjectBasedLabAccessTests(TestCase):
    """Students may only attend labs of their assigned subjects, in both access modes."""

    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(
            username='rohith', email='rohith@blitzcyberlab.io', password='Student@12345', user_type='student'
        )
        self.ceh = Subject.objects.create(name='CEH', code='CEH')
        self.soc = Subject.objects.create(name='SOC', code='SOC')
        self.ceh_lab = Lab.objects.create(name='CEH Lab', subject=self.ceh)
        self.soc_lab = Lab.objects.create(name='SOC Lab', subject=self.soc)
        self.no_subject_lab = Lab.objects.create(name='Standalone Lab')
        self.client.force_authenticate(self.student)

    def _listed_lab_ids(self):
        return {lab['id'] for lab in self.client.get('/api/student/labs/').data['labs']}

    def _attend_status(self, lab):
        return self.client.post(f'/api/student/labs/{lab.id}/attend/').status_code

    def test_unrestricted_student_without_subjects_cannot_attend_any_lab(self):
        self.assertEqual(self._listed_lab_ids(), set())
        for lab in (self.ceh_lab, self.soc_lab, self.no_subject_lab):
            self.assertEqual(self._attend_status(lab), status.HTTP_403_FORBIDDEN)

    def test_unrestricted_student_only_attends_assigned_subject_labs(self):
        SubjectEnrollment.objects.create(student=self.student, subject=self.ceh)
        self.assertEqual(self._listed_lab_ids(), {self.ceh_lab.id})
        self.assertEqual(self._attend_status(self.soc_lab), status.HTTP_403_FORBIDDEN)
        self.assertEqual(self._attend_status(self.no_subject_lab), status.HTTP_403_FORBIDDEN)
        self.assertEqual(self._attend_status(self.ceh_lab), status.HTTP_200_OK)

    def test_inactive_subject_enrollment_gives_no_access(self):
        SubjectEnrollment.objects.create(student=self.student, subject=self.ceh, is_active=False)
        self.assertEqual(self._listed_lab_ids(), set())
        self.assertEqual(self._attend_status(self.ceh_lab), status.HTTP_403_FORBIDDEN)

    def test_class_based_student_needs_both_class_and_subject(self):
        student_class = StudentClass.objects.create(name='Batch A')
        student_class.labs.set([self.ceh_lab, self.soc_lab, self.no_subject_lab])
        self.student.assigned_class = student_class
        self.student.lab_access_mode = 'class_based'
        self.student.save()

        # In the class, but no subjects assigned: nothing
        self.assertEqual(self._listed_lab_ids(), set())
        self.assertEqual(self._attend_status(self.ceh_lab), status.HTTP_403_FORBIDDEN)

        # Assigned CEH: only the class lab of that subject
        SubjectEnrollment.objects.create(student=self.student, subject=self.ceh)
        self.assertEqual(self._listed_lab_ids(), {self.ceh_lab.id})
        self.assertEqual(self._attend_status(self.soc_lab), status.HTTP_403_FORBIDDEN)
        self.assertEqual(self._attend_status(self.no_subject_lab), status.HTTP_403_FORBIDDEN)
        self.assertEqual(self._attend_status(self.ceh_lab), status.HTTP_200_OK)

    def test_class_based_subject_lab_outside_class_is_blocked(self):
        student_class = StudentClass.objects.create(name='Batch B')
        self.student.assigned_class = student_class
        self.student.lab_access_mode = 'class_based'
        self.student.save()
        SubjectEnrollment.objects.create(student=self.student, subject=self.ceh)

        self.assertEqual(self._listed_lab_ids(), set())
        self.assertEqual(self._attend_status(self.ceh_lab), status.HTTP_403_FORBIDDEN)
