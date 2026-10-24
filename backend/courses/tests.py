from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User
from courses.models import Lab, LabQuestion, LabSubmission, LabScore, Subject, SubjectEnrollment, StudentClass


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

    def test_retake_request_only_for_completed_labs(self):
        self.client.force_authenticate(self.student)
        url = f'/api/student/labs/{self.lab.id}/retake-request/'

        response = self.client.post(url, {'reason': 'again'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        self.client.post(f'/api/student/labs/{self.lab.id}/submit/', {
            'question_id': self.question.id, 'flag': 'BLITZ{secret}'
        }, format='json')
        response = self.client.post(url, {'reason': 'again'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)

        # A second request while one is pending is rejected
        response = self.client.post(url, {'reason': 'again'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

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


class LeaderboardTests(TestCase):
    """Class-based students rank within their class; unrestricted students see the global board."""

    def setUp(self):
        self.client = APIClient()
        self.class_a = StudentClass.objects.create(name='Batch A', code='A')
        self.class_b = StudentClass.objects.create(name='Batch B', code='B')
        self.lab1 = Lab.objects.create(name='Lab 1', points=100)
        self.lab2 = Lab.objects.create(name='Lab 2', points=50)

        def student(username, klass=None):
            return User.objects.create_user(
                username=username, email=f'{username}@blitz.io', password='Student@12345', user_type='student',
                assigned_class=klass, lab_access_mode='class_based' if klass else 'unrestricted',
            )

        self.a1 = student('a1', self.class_a)
        self.a2 = student('a2', self.class_a)
        self.b1 = student('b1', self.class_b)
        self.free = student('free')

        LabScore.objects.create(student=self.a1, lab=self.lab1, score=100, is_completed=True, solved_questions_count=3)
        LabScore.objects.create(student=self.a2, lab=self.lab1, score=40, solved_questions_count=1)
        LabScore.objects.create(student=self.b1, lab=self.lab1, score=100, is_completed=True, solved_questions_count=3)
        LabScore.objects.create(student=self.b1, lab=self.lab2, score=50, is_completed=True, solved_questions_count=2)
        # Score above the lab maximum is capped at lab.points
        LabScore.objects.create(student=self.free, lab=self.lab2, score=999, solved_questions_count=1)

    def _board(self, user):
        self.client.force_authenticate(user)
        return self.client.get('/api/student/leaderboard/').data

    def test_class_based_student_sees_only_own_class(self):
        data = self._board(self.a2)
        self.assertEqual(data['scope'], 'class')
        self.assertEqual(data['class_name'], 'Batch A')
        self.assertEqual([r['username'] for r in data['results']], ['a1', 'a2'])
        self.assertEqual(data['my_rank'], 2)
        self.assertTrue(data['results'][1]['is_me'])

    def test_unrestricted_student_sees_global_board(self):
        data = self._board(self.free)
        self.assertEqual(data['scope'], 'global')
        usernames = [r['username'] for r in data['results']]
        self.assertEqual(usernames, ['b1', 'a1', 'free', 'a2'])
        points = {r['username']: r['points'] for r in data['results']}
        self.assertEqual(points, {'b1': 150, 'a1': 100, 'free': 50, 'a2': 40})
        self.assertEqual(data['my_rank'], 3)

    def test_equal_stats_share_rank(self):
        LabScore.objects.filter(student=self.a2).update(score=100, is_completed=True, solved_questions_count=3)
        ranks = {r['username']: r['rank'] for r in self._board(self.a1)['results']}
        self.assertEqual(ranks, {'a1': 1, 'a2': 1})

    def test_leaderboard_requires_login(self):
        self.assertEqual(self.client.get('/api/student/leaderboard/').status_code, status.HTTP_401_UNAUTHORIZED)


class PaginationTests(TestCase):
    """List endpoints return 20 items per page with ?page=, and the full list without it."""

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='admin', email='admin@blitz.io', password='Admin@12345', user_type='admin'
        )
        Lab.objects.bulk_create([Lab(name=f'Lab {i:02d}') for i in range(45)])
        self.client.force_authenticate(self.admin)

    def test_paginated_labs(self):
        page1 = self.client.get('/api/labs/?page=1').data
        self.assertEqual(page1['count'], 45)
        self.assertEqual(page1['page_size'], 20)
        self.assertEqual(page1['total_pages'], 3)
        self.assertEqual(len(page1['results']), 20)
        self.assertTrue(page1['has_next'])
        self.assertFalse(page1['has_previous'])

        page3 = self.client.get('/api/labs/?page=3').data
        self.assertEqual(len(page3['results']), 5)
        self.assertFalse(page3['has_next'])
        self.assertTrue(page3['has_previous'])

        page2_ids = {l['id'] for l in self.client.get('/api/labs/?page=2').data['results']}
        page1_ids = {l['id'] for l in page1['results']}
        self.assertFalse(page1_ids & page2_ids)

    def test_out_of_range_page_is_clamped(self):
        data = self.client.get('/api/labs/?page=99').data
        self.assertEqual(data['page'], 3)
        self.assertEqual(len(data['results']), 5)

    def test_unpaginated_request_returns_everything(self):
        data = self.client.get('/api/labs/').data
        self.assertEqual(len(data['results']), 45)
        self.assertNotIn('page', data)

    def test_paginated_search_counts_matches(self):
        data = self.client.get('/api/labs/?page=1&q=Lab 1').data
        self.assertEqual(data['count'], 10)  # Lab 10 .. Lab 19

    def test_students_endpoint_paginates(self):
        User.objects.bulk_create([
            User(username=f's{i}', email=f's{i}@blitz.io', user_type='student') for i in range(25)
        ])
        data = self.client.get('/api/students/?page=2&user_type=student').data
        self.assertEqual(data['count'], 25)
        self.assertEqual(len(data['results']), 5)

    def test_paginated_labs_include_platform_stats(self):
        data = self.client.get('/api/labs/?page=2').data
        self.assertEqual(data['stats']['total_labs'], 45)
        self.assertIn('categories', data)

    def test_students_role_counts_ignore_role_filter(self):
        User.objects.create_user(username='inst', email='inst@blitz.io', password='x', user_type='instructor')
        User.objects.bulk_create([
            User(username=f'st{i}', email=f'st{i}@blitz.io', user_type='student') for i in range(3)
        ])
        data = self.client.get('/api/students/?page=1&user_type=student').data
        self.assertEqual(data['count'], 3)
        self.assertEqual(data['role_counts'], {'student': 3, 'instructor': 1, 'admin': 1})

    def test_student_labs_status_filter_and_stats_cover_all_labs(self):
        subject = Subject.objects.create(name='CEH')
        student = User.objects.create_user(username='stu', email='stu@blitz.io', password='x', user_type='student')
        SubjectEnrollment.objects.create(student=student, subject=subject)
        Lab.objects.filter(name__in=['Lab 00', 'Lab 01', 'Lab 02']).update(subject=subject)
        started = Lab.objects.get(name='Lab 01')
        LabScore.objects.create(student=student, lab=started, score=10)

        self.client.force_authenticate(student)
        data = self.client.get('/api/student/labs/?status=IN_PROGRESS&page=1').data
        self.assertEqual([l['id'] for l in data['labs']], [started.id])
        self.assertEqual(data['pagination']['count'], 1)
        self.assertEqual(data['stats']['labs_assigned'], 3)


import shutil
import tempfile
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from courses.models import LabCategory

TEST_MEDIA_ROOT = tempfile.mkdtemp()


class LabCategoryTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.instructor = User.objects.create_user(
            username='instructor', email='instructor@blitz.io', password='x', user_type='instructor'
        )
        self.student = User.objects.create_user(
            username='student', email='student@blitz.io', password='x', user_type='student'
        )

    def test_instructor_can_add_category_and_duplicates_are_rejected(self):
        self.client.force_authenticate(self.instructor)
        response = self.client.post('/api/lab-categories/', {'name': '  Mobile   Security '}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data['category']['name'], 'Mobile Security')

        duplicate = self.client.post('/api/lab-categories/', {'name': 'mobile security'}, format='json')
        self.assertEqual(duplicate.status_code, status.HTTP_400_BAD_REQUEST)

    def test_rename_updates_labs_using_the_category(self):
        category = LabCategory.objects.create(name='Forensics')
        lab = Lab.objects.create(name='Disk Image', category='Forensics')
        other = Lab.objects.create(name='Other', category='OSINT')

        self.client.force_authenticate(self.instructor)
        response = self.client.patch(f'/api/lab-categories/{category.id}/', {'name': 'Digital Forensics'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        lab.refresh_from_db(); other.refresh_from_db()
        self.assertEqual(lab.category, 'Digital Forensics')
        self.assertEqual(other.category, 'OSINT')

    def test_students_can_list_but_not_change_categories(self):
        LabCategory.objects.create(name='Forensics')
        self.client.force_authenticate(self.student)
        self.assertEqual(self.client.get('/api/lab-categories/').status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.post('/api/lab-categories/', {'name': 'X'}, format='json').status_code, status.HTTP_403_FORBIDDEN)


@override_settings(MEDIA_ROOT=TEST_MEDIA_ROOT)
class LabFileRemovalTests(TestCase):
    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(TEST_MEDIA_ROOT, ignore_errors=True)
        super().tearDownClass()

    def setUp(self):
        self.client = APIClient()
        self.instructor = User.objects.create_user(
            username='instructor', email='instructor@blitz.io', password='x', user_type='instructor'
        )
        self.client.force_authenticate(self.instructor)
        self.lab = Lab.objects.create(name='Video Lab', created_by=self.instructor)
        self.lab.video_file = SimpleUploadedFile('walkthrough.mp4', b'fake-video', content_type='video/mp4')
        self.lab.save()

    def test_remove_uploaded_video(self):
        path = self.lab.video_file.path
        response = self.client.patch(f'/api/labs/{self.lab.id}/', {'remove_video_file': True}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.lab.refresh_from_db()
        self.assertFalse(self.lab.video_file)
        import os
        self.assertFalse(os.path.exists(path))

    def test_edit_without_flag_keeps_video(self):
        response = self.client.patch(f'/api/labs/{self.lab.id}/', {'name': 'Renamed'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.lab.refresh_from_db()
        self.assertTrue(self.lab.video_file)


class LabEditAccessTests(TestCase):
    """Instructors edit only their own labs or labs shared with them; platform admins edit all."""

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(username='admin', email='admin@blitz.io', password='x', user_type='admin')
        self.owner = User.objects.create_user(username='owner', email='owner@blitz.io', password='x', user_type='instructor')
        self.other = User.objects.create_user(username='other', email='other@blitz.io', password='x', user_type='instructor')
        self.third = User.objects.create_user(username='third', email='third@blitz.io', password='x', user_type='instructor')
        self.student = User.objects.create_user(username='stud', email='stud@blitz.io', password='x', user_type='student')
        self.lab = Lab.objects.create(name='Owner Lab', created_by=self.owner)
        self.other_lab = Lab.objects.create(name='Other Lab', created_by=self.other)

    def _rename(self, user, lab, name='Renamed'):
        self.client.force_authenticate(user)
        return self.client.patch(f'/api/labs/{lab.id}/', {'name': name}, format='json')

    def _set_editors(self, user, ids):
        self.client.force_authenticate(user)
        return self.client.put(f'/api/labs/{self.lab.id}/editors/', {'editor_ids': ids}, format='json')

    def test_creator_and_admin_can_edit_others_cannot(self):
        self.assertEqual(self._rename(self.owner, self.lab).status_code, status.HTTP_200_OK)
        self.assertEqual(self._rename(self.admin, self.lab).status_code, status.HTTP_200_OK)
        self.assertEqual(self._rename(self.other, self.lab).status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self._rename(self.student, self.lab).status_code, status.HTTP_403_FORBIDDEN)

    def test_creator_shares_edit_access_with_multiple_instructors(self):
        response = self._set_editors(self.owner, [self.other.id, self.third.id])
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual({e['id'] for e in response.data['editors']}, {self.other.id, self.third.id})
        self.assertEqual(self._rename(self.other, self.lab).status_code, status.HTTP_200_OK)
        self.assertEqual(self._rename(self.third, self.lab).status_code, status.HTTP_200_OK)

        # A shared editor can edit but can neither re-share nor archive the lab
        self.assertEqual(self._set_editors(self.other, []).status_code, status.HTTP_403_FORBIDDEN)
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.delete(f'/api/labs/{self.lab.id}/').status_code, status.HTTP_403_FORBIDDEN)

        # Removing access takes effect immediately
        self.assertEqual(self._set_editors(self.owner, [self.third.id]).status_code, status.HTTP_200_OK)
        self.assertEqual(self._rename(self.other, self.lab).status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_manage_editors_and_only_instructors_allowed(self):
        self.assertEqual(self._set_editors(self.admin, [self.other.id]).status_code, status.HTTP_200_OK)
        self.assertEqual(self._set_editors(self.admin, [self.student.id]).status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self._set_editors(self.other, [self.third.id]).status_code, status.HTTP_403_FORBIDDEN)

    def test_archive_limited_to_creator_and_admin(self):
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.delete(f'/api/labs/{self.lab.id}/').status_code, status.HTTP_403_FORBIDDEN)
        self.client.force_authenticate(self.owner)
        self.assertEqual(self.client.delete(f'/api/labs/{self.lab.id}/').status_code, status.HTTP_200_OK)

    def test_my_labs_lists_created_and_shared(self):
        self.lab.editors.add(self.other)
        self.client.force_authenticate(self.other)
        response = self.client.get('/api/labs/?mine=1&page=1')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = {l['name'] for l in response.data['results']}
        self.assertEqual(names, {'Owner Lab', 'Other Lab'})
        self.assertEqual(response.data['stats']['total_labs'], 2)
        flags = {l['name']: (l['can_edit'], l['can_manage_editors']) for l in response.data['results']}
        self.assertEqual(flags['Owner Lab'], (True, False))
        self.assertEqual(flags['Other Lab'], (True, True))

        self.client.force_authenticate(self.third)
        self.assertEqual(self.client.get('/api/labs/?mine=1').data['results'], [])
        all_labs = self.client.get('/api/labs/').data['results']
        self.assertTrue(all(not l['can_edit'] for l in all_labs))


class ClassManageAccessTests(TestCase):
    """Instructors manage only classes they created or were given access to; platform admins manage all."""

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(username='admin', email='admin@blitz.io', password='x', user_type='admin')
        self.owner = User.objects.create_user(username='owner', email='owner@blitz.io', password='x', user_type='instructor')
        self.other = User.objects.create_user(username='other', email='other@blitz.io', password='x', user_type='instructor')
        self.third = User.objects.create_user(username='third', email='third@blitz.io', password='x', user_type='instructor')
        self.student = User.objects.create_user(username='stud', email='stud@blitz.io', password='x', user_type='student')
        self.klass = StudentClass.objects.create(name='Owner Class', created_by=self.owner)
        self.lab = Lab.objects.create(name='Any Lab')

    def _as(self, user):
        self.client.force_authenticate(user)
        return self.client

    def _rename(self, user, name='Renamed'):
        return self._as(user).patch(f'/api/classes/{self.klass.id}/', {'name': name}, format='json')

    def test_create_records_creator(self):
        response = self._as(self.other).post('/api/classes/', {'name': 'New Class'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(StudentClass.objects.get(name='New Class').created_by, self.other)
        self.assertTrue(response.data['can_manage_access'])

    def test_creator_and_admin_manage_others_cannot(self):
        self.assertEqual(self._rename(self.owner, 'A').status_code, status.HTTP_200_OK)
        self.assertEqual(self._rename(self.admin, 'B').status_code, status.HTTP_200_OK)
        self.assertEqual(self._rename(self.other, 'C').status_code, status.HTTP_403_FORBIDDEN)
        url = f'/api/classes/{self.klass.id}/'
        self.assertEqual(self._as(self.other).post(url + 'assign-labs/', {'lab_ids': [self.lab.id]}, format='json').status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self._as(self.other).post(url + 'assign-students/', {'student_ids': [self.student.id]}, format='json').status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self._as(self.other).delete(url).status_code, status.HTTP_403_FORBIDDEN)
        # Viewing is still allowed
        self.assertEqual(self._as(self.other).get(url).status_code, status.HTTP_200_OK)

    def test_shared_managers_manage_but_cannot_share_or_delete(self):
        url = f'/api/classes/{self.klass.id}/'
        response = self._as(self.owner).put(url + 'managers/', {'manager_ids': [self.other.id, self.third.id]}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual({m['id'] for m in response.data['managers']}, {self.other.id, self.third.id})

        self.assertEqual(self._rename(self.other, 'Managed').status_code, status.HTTP_200_OK)
        self.assertEqual(self._as(self.third).post(url + 'assign-students/', {'student_ids': [self.student.id]}, format='json').status_code, status.HTTP_200_OK)
        self.assertEqual(self._as(self.other).put(url + 'managers/', {'manager_ids': []}, format='json').status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self._as(self.other).delete(url).status_code, status.HTTP_403_FORBIDDEN)

        # Admin can change managers; only instructors are accepted
        self.assertEqual(self._as(self.admin).put(url + 'managers/', {'manager_ids': [self.student.id]}, format='json').status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self._as(self.admin).put(url + 'managers/', {'manager_ids': [self.third.id]}, format='json').status_code, status.HTTP_200_OK)
        self.assertEqual(self._rename(self.other, 'Gone').status_code, status.HTTP_403_FORBIDDEN)

    def test_list_flags_per_viewer(self):
        self.klass.managers.add(self.other)
        rows = {c['name']: c for c in self._as(self.other).get('/api/classes/?page=1').data['results']}
        self.assertEqual((rows['Owner Class']['can_manage'], rows['Owner Class']['can_manage_access']), (True, False))
        rows = {c['name']: c for c in self._as(self.third).get('/api/classes/').data['results']}
        self.assertFalse(rows['Owner Class']['can_manage'])

    def test_student_class_assignment_requires_managing_the_class(self):
        url = f'/api/students/{self.student.id}/'
        self.assertEqual(self._as(self.other).patch(url, {'assigned_class_id': self.klass.id}, format='json').status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self._as(self.owner).patch(url, {'assigned_class_id': self.klass.id}, format='json').status_code, status.HTTP_200_OK)
        # ...and taking a student out of the class too
        self.assertEqual(self._as(self.other).patch(url, {'assigned_class_id': None}, format='json').status_code, status.HTTP_403_FORBIDDEN)
        # Unrelated edits by another instructor still work
        self.assertEqual(self._as(self.other).patch(url, {'first_name': 'Stu'}, format='json').status_code, status.HTTP_200_OK)
