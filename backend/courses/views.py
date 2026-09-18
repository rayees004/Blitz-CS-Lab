from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
import json
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction
from accounts.models import User
from accounts.views import IsAdminOrStaff
from .models import (
    Course, Enrollment, Module, Subject, SubjectEnrollment,
    Lab, LabQuestion, QuestionHint, LabSubmission, LabScore,
    StudyMaterial
)
from .serializers import (
    CourseSerializer,
    CourseListSerializer,
    CreateCourseSerializer,
    ModuleSerializer,
    SubjectSerializer,
    CreateSubjectSerializer,
    EnrollmentSerializer,
    EnrollCreateSerializer,
    EnrollmentUpdateSerializer,
    SubjectEnrollmentSerializer,
    LabSerializer,
    LabSubmissionSerializer,
    LabScoreSerializer,
    StudyMaterialSerializer,
    CreateStudyMaterialSerializer,
)



class CourseListCreateView(APIView):
    """
    GET  /api/courses/  — list all classes (with module & enrollment counts)
    POST /api/courses/  — create a new class
    """
    permission_classes = [IsAdminOrStaff]

    def get(self, request):
        courses = Course.objects.prefetch_related('modules', 'subjects', 'enrollments').filter(is_active=True)
        serializer = CourseListSerializer(courses, many=True)
        return Response({'count': courses.count(), 'results': serializer.data})

    def post(self, request):
        serializer = CreateCourseSerializer(data=request.data)
        if serializer.is_valid():
            course = serializer.save()
            return Response({
                'message': f'Class "{course.name}" created successfully.',
                'course': CourseSerializer(course).data,
            }, status=status.HTTP_201_CREATED)

        errors = serializer.errors
        first_key = next(iter(errors))
        first_msg = errors[first_key]
        if isinstance(first_msg, list):
            first_msg = first_msg[0]
        return Response({'detail': str(first_msg), 'errors': errors}, status=status.HTTP_400_BAD_REQUEST)


class CourseDetailView(APIView):
    """
    GET    /api/courses/<id>/  — full course detail with modules
    PATCH  /api/courses/<id>/  — update course
    DELETE /api/courses/<id>/  — deactivate course
    """
    permission_classes = [IsAdminOrStaff]

    def get_course(self, pk):
        return get_object_or_404(Course, pk=pk)

    def get(self, request, pk):
        course = self.get_course(pk)
        return Response(CourseSerializer(course).data)

    def patch(self, request, pk):
        course = self.get_course(pk)
        serializer = CreateCourseSerializer(course, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Class updated.',
                'course': CourseSerializer(course).data,
            })
        return Response({'detail': 'Update failed.', 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        course = self.get_course(pk)
        name = course.name
        course.is_active = False
        course.save()
        return Response({'message': f'Class "{name}" deactivated.'})


class CourseModulesView(APIView):
    """
    GET  /api/courses/<id>/modules/  — list modules for a class
    POST /api/courses/<id>/modules/  — add a module to a class
    """
    permission_classes = [IsAdminOrStaff]

    def get_course(self, pk):
        return get_object_or_404(Course, pk=pk)

    def get(self, request, pk):
        course = self.get_course(pk)
        modules = course.modules.filter(is_active=True)
        return Response({
            'course_id': course.id,
            'course_name': course.name,
            'count': modules.count(),
            'results': ModuleSerializer(modules, many=True).data,
        })

    def post(self, request, pk):
        course = self.get_course(pk)
        title = request.data.get('title', '').strip()
        if not title:
            return Response({'detail': 'Module title is required.'}, status=status.HTTP_400_BAD_REQUEST)

        order = request.data.get('order')
        if order is None:
            order = course.modules.count()

        subject_id = request.data.get('subject_id')
        subject = None
        if subject_id:
            subject = get_object_or_404(Subject, pk=subject_id)

        module = Module.objects.create(
            course=course,
            subject=subject,
            title=title,
            description=request.data.get('description', ''),
            duration_hours=request.data.get('duration_hours', 1.0),
            order=order,
        )
        return Response({
            'message': f'Module "{title}" added to {course.name}.',
            'module': ModuleSerializer(module).data,
        }, status=status.HTTP_201_CREATED)


class ModuleDetailView(APIView):
    """
    GET    /api/modules/<id>/
    PATCH  /api/modules/<id>/  — update title, description, duration_hours, order
    DELETE /api/modules/<id>/  — deactivate module
    """
    permission_classes = [IsAdminOrStaff]

    def get_module(self, pk):
        return get_object_or_404(Module, pk=pk)

    def get(self, request, pk):
        return Response(ModuleSerializer(self.get_module(pk)).data)

    def patch(self, request, pk):
        module = self.get_module(pk)
        for field in ['title', 'description', 'duration_hours', 'order', 'is_active']:
            if field in request.data:
                setattr(module, field, request.data[field])
        if 'subject_id' in request.data:
            sid = request.data['subject_id']
            module.subject = get_object_or_404(Subject, pk=sid) if sid else None
        module.save()
        return Response({
            'message': 'Module updated.',
            'module': ModuleSerializer(module).data,
        })

    def delete(self, request, pk):
        module = self.get_module(pk)
        title = module.title
        module.delete()
        return Response({'message': f'Module "{title}" removed.'})


# ─── SUBJECTS ──────────────────────────────────────────────────
class SubjectListCreateView(APIView):
    """
    GET  /api/subjects/  — list subjects (optional ?course_id= or ?q=)
    POST /api/subjects/  — create a new subject
    """
    permission_classes = [IsAdminOrStaff]

    def get(self, request):
        qs = Subject.objects.select_related('course').prefetch_related('modules').filter(is_active=True)
        course_id = request.query_params.get('course_id')
        if course_id:
            qs = qs.filter(course_id=course_id)
        q = request.query_params.get('q')
        if q:
            qs = qs.filter(name__icontains=q) | qs.filter(code__icontains=q) | qs.filter(description__icontains=q)
        serializer = SubjectSerializer(qs, many=True)
        return Response({'count': qs.count(), 'results': serializer.data})

    def post(self, request):
        serializer = CreateSubjectSerializer(data=request.data)
        if serializer.is_valid():
            subject = serializer.save()
            return Response({
                'message': f'Subject "{subject.name}" created successfully.',
                'subject': SubjectSerializer(subject).data,
            }, status=status.HTTP_201_CREATED)

        errors = serializer.errors
        first_key = next(iter(errors))
        first_msg = errors[first_key]
        if isinstance(first_msg, list):
            first_msg = first_msg[0]
        return Response({'detail': str(first_msg), 'errors': errors}, status=status.HTTP_400_BAD_REQUEST)


class SubjectDetailView(APIView):
    """
    GET    /api/subjects/<id>/
    PATCH  /api/subjects/<id>/
    DELETE /api/subjects/<id>/
    """
    permission_classes = [IsAdminOrStaff]

    def get_subject(self, pk):
        return get_object_or_404(Subject, pk=pk)

    def get(self, request, pk):
        subject = self.get_subject(pk)
        return Response(SubjectSerializer(subject).data)

    def patch(self, request, pk):
        subject = self.get_subject(pk)
        serializer = CreateSubjectSerializer(subject, data=request.data, partial=True)
        if serializer.is_valid():
            subject = serializer.save()
            return Response({
                'message': 'Subject updated successfully.',
                'subject': SubjectSerializer(subject).data,
            })
        return Response({'detail': 'Update failed.', 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        subject = self.get_subject(pk)
        name = subject.name
        subject.is_active = False
        subject.save()
        return Response({'message': f'Subject "{name}" deactivated.'})


class SubjectModulesView(APIView):
    """
    GET  /api/subjects/<id>/modules/ — list modules for a course (subject)
    POST /api/subjects/<id>/modules/ — add a module to a course (subject)
    """
    permission_classes = [IsAdminOrStaff]

    def get_subject(self, pk):
        return get_object_or_404(Subject, pk=pk)

    def get(self, request, pk):
        subject = self.get_subject(pk)
        modules = subject.modules.filter(is_active=True).order_by('order', 'created_at')
        return Response({
            'subject_id': subject.id,
            'subject_name': subject.name,
            'count': modules.count(),
            'results': ModuleSerializer(modules, many=True).data,
        })

    def post(self, request, pk):
        subject = self.get_subject(pk)
        title = request.data.get('title', '').strip()
        if not title:
            return Response({'detail': 'Module title is required.'}, status=status.HTTP_400_BAD_REQUEST)

        order = request.data.get('order')
        if order is None or order == '':
            order = subject.modules.filter(is_active=True).count() + 1
        else:
            try:
                order = int(order)
            except (ValueError, TypeError):
                order = subject.modules.filter(is_active=True).count() + 1

        try:
            duration = float(request.data.get('duration_hours', 1.0))
        except (ValueError, TypeError):
            duration = 1.0

        module = Module.objects.create(
            subject=subject,
            course=subject.course,
            title=title,
            description=request.data.get('description', ''),
            duration_hours=duration,
            order=order,
        )
        return Response({
            'message': f'Module "{title}" added to {subject.name}.',
            'module': ModuleSerializer(module).data,
        }, status=status.HTTP_201_CREATED)


class CourseSubjectsView(APIView):
    """
    GET /api/courses/<id>/subjects/ — list subjects for a class
    """
    permission_classes = [IsAdminOrStaff]

    def get(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        subjects = course.subjects.filter(is_active=True)
        return Response({
            'course_id': course.id,
            'course_name': course.name,
            'count': subjects.count(),
            'results': SubjectSerializer(subjects, many=True).data,
        })


# ─── ENROLLMENTS ───────────────────────────────────────────────
class StudentEnrollmentsView(APIView):
    """
    GET  /api/students/<id>/enrollments/  — list all courses student is enrolled in
    POST /api/students/<id>/enrollments/  — enroll student in a course
    """
    permission_classes = [IsAdminOrStaff]

    def get_student(self, pk):
        return get_object_or_404(User, pk=pk, user_type='student')

    def get(self, request, pk):
        student = self.get_student(pk)
        enrollments = student.enrollments.select_related('course').filter(is_active=True)
        serializer = EnrollmentSerializer(enrollments, many=True)
        return Response({
            'student_id': student.id,
            'student_name': f"{student.first_name} {student.last_name}".strip() or student.username,
            'count': enrollments.count(),
            'results': serializer.data,
        })

    def post(self, request, pk):
        student = self.get_student(pk)
        serializer = EnrollCreateSerializer(data=request.data, context={'student': student})
        if serializer.is_valid():
            enrollment = serializer.save()
            return Response({
                'message': f'Enrolled in "{enrollment.course.name}" successfully.',
                'enrollment': EnrollmentSerializer(enrollment).data,
            }, status=status.HTTP_201_CREATED)

        errors = serializer.errors
        first_key = next(iter(errors))
        first_msg = errors[first_key]
        if isinstance(first_msg, list):
            first_msg = first_msg[0]
        return Response({'detail': str(first_msg), 'errors': errors}, status=status.HTTP_400_BAD_REQUEST)


class StudentBulkEnrollView(APIView):
    """
    POST /api/students/<id>/assign-courses/
    Bulk assign/manage multiple courses for a student.
    Body:
      - course_ids: list of int IDs (e.g. [1, 2, 4])
      - fee_status: 'PAID' | 'DUE' | 'PARTIAL' (default: 'DUE')
      - sync: bool (if True, unrolls courses not in course_ids; if False, adds without removing)
    """
    permission_classes = [IsAdminOrStaff]

    def post(self, request, pk):
        student = get_object_or_404(User, pk=pk, user_type='student')
        course_ids = request.data.get('course_ids', [])
        fee_status = request.data.get('fee_status', 'DUE')
        sync = request.data.get('sync', True)

        if not isinstance(course_ids, list):
            return Response({'detail': 'course_ids must be a list of course IDs.'}, status=status.HTTP_400_BAD_REQUEST)

        valid_courses = Course.objects.filter(id__in=course_ids, is_active=True)
        valid_course_ids = set(valid_courses.values_list('id', flat=True))

        with transaction.atomic():
            if sync:
                # Remove active enrollments not in selected course list
                Enrollment.objects.filter(student=student, is_active=True).exclude(course_id__in=valid_course_ids).delete()

            # Ensure all chosen courses are actively enrolled
            for course in valid_courses:
                enrollment, created = Enrollment.objects.get_or_create(
                    student=student,
                    course=course,
                    defaults={'fee_status': fee_status, 'is_active': True}
                )
                if not created and not enrollment.is_active:
                    enrollment.is_active = True
                    enrollment.save(update_fields=['is_active'])

        enrollments = student.enrollments.select_related('course').filter(is_active=True)
        from accounts.serializers import UserSerializer
        return Response({
            'message': f'Successfully updated course assignments for "{student.get_full_name() or student.username}".',
            'student': UserSerializer(student).data,
            'count': enrollments.count(),
            'enrollments': EnrollmentSerializer(enrollments, many=True).data,
        }, status=status.HTTP_200_OK)


class StudentBulkAssignSubjectsView(APIView):
    """
    POST /api/students/<id>/assign-subjects/
    Bulk assign/manage multiple subjects for a student.
    Body:
      - subject_ids: list of int IDs (e.g. [1, 2, 9, 10])
      - sync: bool (default: True - syncs assigned subjects)
    """
    permission_classes = [IsAdminOrStaff]

    def post(self, request, pk):
        student = get_object_or_404(User, pk=pk, user_type='student')
        subject_ids = request.data.get('subject_ids', [])
        sync = request.data.get('sync', True)

        if not isinstance(subject_ids, list):
            return Response({'detail': 'subject_ids must be a list of subject IDs.'}, status=status.HTTP_400_BAD_REQUEST)

        valid_subjects = Subject.objects.filter(id__in=subject_ids, is_active=True)
        valid_subject_ids = set(valid_subjects.values_list('id', flat=True))

        with transaction.atomic():
            if sync:
                # Remove active subject enrollments not in selected list
                SubjectEnrollment.objects.filter(student=student, is_active=True).exclude(subject_id__in=valid_subject_ids).delete()

            # Ensure all chosen subjects are actively enrolled
            for subj in valid_subjects:
                enrollment, created = SubjectEnrollment.objects.get_or_create(
                    student=student,
                    subject=subj,
                    defaults={'is_active': True}
                )
                if not created and not enrollment.is_active:
                    enrollment.is_active = True
                    enrollment.save(update_fields=['is_active'])

        enrollments = student.subject_enrollments.select_related('subject', 'subject__course').filter(is_active=True)
        from accounts.serializers import UserSerializer
        return Response({
            'message': f'Successfully updated subject assignments for "{student.get_full_name() or student.username}".',
            'student': UserSerializer(student).data,
            'count': enrollments.count(),
            'subjects': SubjectEnrollmentSerializer(enrollments, many=True).data,
        }, status=status.HTTP_200_OK)


class StudentSubjectEnrollmentsView(APIView):
    """
    GET  /api/students/<id>/subjects/ — list subjects assigned to a student
    POST /api/students/<id>/subjects/ — assign a single subject to a student
    """
    permission_classes = [IsAdminOrStaff]

    def get(self, request, pk):
        student = get_object_or_404(User, pk=pk, user_type='student')
        enrollments = student.subject_enrollments.select_related('subject', 'subject__course').filter(is_active=True)
        return Response({
            'student_id': student.id,
            'student_name': f"{student.first_name} {student.last_name}".strip() or student.username,
            'count': enrollments.count(),
            'results': SubjectEnrollmentSerializer(enrollments, many=True).data,
        })

    def post(self, request, pk):
        student = get_object_or_404(User, pk=pk, user_type='student')
        subject_id = request.data.get('subject_id')
        if not subject_id:
            return Response({'detail': 'subject_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        subject = get_object_or_404(Subject, pk=subject_id, is_active=True)
        enrollment, created = SubjectEnrollment.objects.get_or_create(
            student=student,
            subject=subject,
            defaults={'is_active': True}
        )
        if not created and not enrollment.is_active:
            enrollment.is_active = True
            enrollment.save(update_fields=['is_active'])
        return Response({
            'message': f'Subject "{subject.name}" assigned successfully.',
            'enrollment': SubjectEnrollmentSerializer(enrollment).data,
        }, status=status.HTTP_201_CREATED)


class EnrollmentDetailView(APIView):
    """PATCH /api/enrollments/<id>/  DELETE /api/enrollments/<id>/"""
    permission_classes = [IsAdminOrStaff]

    def patch(self, request, pk):
        enrollment = get_object_or_404(Enrollment, pk=pk)
        serializer = EnrollmentUpdateSerializer(enrollment, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Enrollment updated.',
                'enrollment': EnrollmentSerializer(enrollment).data,
            })
        return Response({'detail': 'Update failed.', 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        enrollment = get_object_or_404(Enrollment, pk=pk)
        course_name = enrollment.course.name
        enrollment.delete()
        return Response({'message': f'Removed from "{course_name}".'})


class LabListCreateView(APIView):
    """
    GET  /api/labs/  - List all active labs with nested questions and hints
    POST /api/labs/  - Create a new lab with questions and hints (Admin/Staff only)
    """
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAdminOrStaff()]

    def get(self, request):
        labs = Lab.objects.prefetch_related('questions__hints').filter(is_active=True)
        category = request.query_params.get('category')
        difficulty = request.query_params.get('difficulty')
        search = request.query_params.get('q')

        subject_id = request.query_params.get('subject_id')
        course_id = request.query_params.get('course_id')

        if category:
            labs = labs.filter(category__iexact=category)
        if difficulty:
            labs = labs.filter(difficulty__iexact=difficulty)
        if search:
            labs = labs.filter(name__icontains=search)
        if subject_id:
            labs = labs.filter(subject_id=subject_id)
        if course_id:
            labs = labs.filter(course_id=course_id)

        serializer = LabSerializer(labs, many=True)
        return Response({'count': labs.count(), 'results': serializer.data})


    def post(self, request):
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        if 'questions' in data and isinstance(data['questions'], str):
            try:
                data['questions'] = json.loads(data['questions'])
            except Exception:
                pass
        serializer = LabSerializer(data=data)
        if serializer.is_valid():
            lab = serializer.save()
            return Response({
                'message': f'Lab "{lab.name}" created successfully.',
                'lab': LabSerializer(lab).data,
            }, status=status.HTTP_201_CREATED)

        errors = serializer.errors
        first_key = next(iter(errors))
        first_msg = errors[first_key]
        if isinstance(first_msg, list):
            first_msg = first_msg[0]
        return Response({'detail': str(first_msg), 'errors': errors}, status=status.HTTP_400_BAD_REQUEST)


class LabDetailView(APIView):
    """
    GET    /api/labs/<id>/  - Lab detail with questions & hints
    PATCH  /api/labs/<id>/  - Update lab, questions, hints (Admin/Staff only)
    DELETE /api/labs/<id>/  - Soft-delete or delete lab (Admin/Staff only)
    """
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAdminOrStaff()]

    def get_object(self, pk):
        return get_object_or_404(Lab.objects.prefetch_related('questions__hints'), pk=pk)

    def get(self, request, pk):
        lab = self.get_object(pk)
        serializer = LabSerializer(lab)
        return Response(serializer.data)

    def patch(self, request, pk):
        lab = self.get_object(pk)
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        if 'questions' in data and isinstance(data['questions'], str):
            try:
                data['questions'] = json.loads(data['questions'])
            except Exception:
                pass
        serializer = LabSerializer(lab, data=data, partial=True)
        if serializer.is_valid():
            updated_lab = serializer.save()
            return Response({
                'message': f'Lab "{updated_lab.name}" updated successfully.',
                'lab': LabSerializer(updated_lab).data,
            })
        return Response({'detail': 'Update failed.', 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        lab = self.get_object(pk)
        name = lab.name
        lab.is_active = False
        lab.save()
        return Response({'message': f'Lab "{name}" archived successfully.'})


class SubjectLabsView(APIView):
    """
    GET  /api/subjects/<id>/labs/ — list active labs for a course/subject
    POST /api/subjects/<id>/labs/ — create a lab linked to this course/subject
    """
    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAdminOrStaff()]

    def get(self, request, pk):
        subject = get_object_or_404(Subject, pk=pk)
        labs = subject.labs.prefetch_related('questions__hints').filter(is_active=True)
        return Response({
            'subject_id': subject.id,
            'subject_name': subject.name,
            'count': labs.count(),
            'results': LabSerializer(labs, many=True).data,
        })

    def post(self, request, pk):
        subject = get_object_or_404(Subject, pk=pk)
        data = request.data.copy()
        data['subject_id'] = subject.id
        if subject.course_id and not data.get('course_id'):
            data['course_id'] = subject.course_id
        serializer = LabSerializer(data=data)
        if serializer.is_valid():
            lab = serializer.save()
            return Response({
                'message': f'Lab "{lab.name}" added to course "{subject.name}".',
                'lab': LabSerializer(lab).data,
            }, status=status.HTTP_201_CREATED)
        errors = serializer.errors
        first_key = next(iter(errors))
        first_msg = errors[first_key]
        if isinstance(first_msg, list):
            first_msg = first_msg[0]
        return Response({'detail': str(first_msg), 'errors': errors}, status=status.HTTP_400_BAD_REQUEST)


class SeedLabsView(APIView):
    """
    POST /api/labs/seed/ — Seed starter cybersecurity labs into database
    """
    permission_classes = [IsAdminOrStaff]

    def post(self, request):
        SAMPLE_LABS = [
            {
                "name": "SQL Injection in ShopX Storefront",
                "description": "Identify and exploit a classic SQL injection vulnerability inside the ShopX storefront search API to bypass authentication and dump table data.",
                "org": "ShopX",
                "category": "Web Security",
                "difficulty": "Intermediate",
                "points": 200,
                "target_url": "https://shopx.blitzlab.internal",
                "questions": [
                    {
                        "title": "Discover injectable parameter",
                        "description": "Identify which parameter in the product catalog endpoint is unsanitized.",
                        "flag": "BLITZ{sql_param_discovered}",
                        "points": 75,
                        "hints": [
                            {"hint_text": "Supply single quotes (') into GET query parameters.", "cost": 10},
                            {"hint_text": "Inspect the SQL syntax error response.", "cost": 15},
                        ],
                    },
                    {
                        "title": "Extract administrator hash",
                        "description": "Use UNION SELECT to read the password hash from the users table.",
                        "flag": "BLITZ{union_select_admin_extracted}",
                        "points": 125,
                        "hints": [
                            {"hint_text": "Determine the number of returned columns using ORDER BY.", "cost": 10},
                            {"hint_text": "Match column types with NULL placeholders.", "cost": 20},
                        ],
                    },
                ],
            },
            {
                "name": "Broken Access Control in Acme Portal",
                "description": "Escalate a standard employee account to an administrative role inside Acme's internal HR portal by manipulating role claims.",
                "org": "Acme Employee Portal",
                "category": "Authentication",
                "difficulty": "Beginner",
                "points": 100,
                "target_url": "https://acme-portal.blitzlab.internal",
                "questions": [
                    {
                        "title": "Bypass client-side role check",
                        "description": "Modify the user role attribute in the profile update request.",
                        "flag": "BLITZ{privilege_escalated_admin}",
                        "points": 100,
                        "hints": [
                            {"hint_text": "Intercept the PUT /api/user/profile request in proxy.", "cost": 10},
                        ],
                    },
                ],
            },
            {
                "name": "JWT Token Forgery Gate",
                "description": "Forge a cryptographically signed session token to bypass FinSecure's two-factor login gate and access financial ledger.",
                "org": "FinSecure",
                "category": "Authentication",
                "difficulty": "Advanced",
                "points": 300,
                "target_url": "https://finsecure.blitzlab.internal",
                "questions": [
                    {
                        "title": "Crack weak HMAC secret",
                        "description": "Recover the secret passphrase used to sign user JWTs.",
                        "flag": "BLITZ{jwt_secret_cracked}",
                        "points": 150,
                        "hints": [
                            {"hint_text": "Run hashcat or jwt-tool against the token with rockyou list.", "cost": 15},
                        ],
                    },
                    {
                        "title": "Forge valid administrative claim",
                        "description": "Sign a new token with admin: true and sub: 1.",
                        "flag": "BLITZ{jwt_token_forgery_success}",
                        "points": 150,
                        "hints": [
                            {"hint_text": "Ensure expiration exp is set in the future.", "cost": 10},
                        ],
                    },
                ],
            },
            {
                "name": "IDOR in Patient Records",
                "description": "Enumerate patient record IDs to access confidential clinical data belonging to other Medix users.",
                "org": "Medix",
                "category": "API Security",
                "difficulty": "Intermediate",
                "points": 220,
                "target_url": "https://medix.blitzlab.internal",
                "questions": [
                    {
                        "title": "Enumerate foreign medical chart",
                        "description": "Iterate record UUID/IDs to access patient #1042 chart.",
                        "flag": "BLITZ{idor_patient_record_unlocked}",
                        "points": 220,
                        "hints": [
                            {"hint_text": "Examine the REST route /api/patients/{id}/records.", "cost": 10},
                        ],
                    },
                ],
            },
        ]

        created_count = 0
        for lab_data in SAMPLE_LABS:
            if not Lab.objects.filter(name=lab_data["name"]).exists():
                serializer = LabSerializer(data=lab_data)
                if serializer.is_valid():
                    serializer.save()
                    created_count += 1

        return Response({
            "message": f"Successfully seeded {created_count} sample labs into the database.",
            "created_count": created_count,
            "total_labs": Lab.objects.filter(is_active=True).count(),
        })


def get_current_student(request):
    """Resolve student user from request or fallback to primary student for seamless dev flow."""
    if request.user and request.user.is_authenticated:
        return request.user
    student_id = request.query_params.get('student_id') or request.data.get('student_id') if hasattr(request, 'data') else None
    if student_id:
        u = User.objects.filter(id=student_id).first()
        if u:
            return u
    return User.objects.filter(user_type='student').first() or User.objects.first()


def get_lab_effective_course(lab):
    """Resolve the Course this lab belongs to (directly or through subject)."""
    if lab.course:
        return lab.course
    if lab.subject and lab.subject.course:
        return lab.subject.course
    return None


def can_student_attend_lab(student, lab):
    """
    Check if a student can attend a lab.
    Rules:
      - Admin / Staff can always attend.
      - A student must be actively assigned/enrolled in the lab's Subject.
      - If the lab has no assigned subject, or student is not assigned to that subject, attending is NOT possible.
    Returns: (can_attend: bool, lock_reason: str or None, effective_subject: Subject or None)
    """
    if not student:
        return False, "Authentication required to attend this lab.", None

    # Admins and staff have unrestricted lab access
    if student.is_staff or student.is_superuser or getattr(student, 'user_type', None) == 'admin':
        return True, None, lab.subject

    if not lab.subject:
        return False, "This lab has not been assigned to any subject yet. Attendance is not available.", None

    # Check student active subject enrollments
    is_enrolled = SubjectEnrollment.objects.filter(
        student=student,
        subject=lab.subject,
        is_active=True
    ).exists()

    if not is_enrolled:
        subj_name = lab.subject.name
        subj_code = f" ({lab.subject.code})" if lab.subject.code else ""
        return False, f"Access restricted. You must be assigned to subject '{subj_name}{subj_code}' to attend this lab.", lab.subject

    return True, None, lab.subject


class StudentLabListView(APIView):
    """
    GET /api/student/labs/
    Returns active labs enriched with subject-based access locking,
    the current student's lab score (ForeignKey based), attend count, and submission status.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        student = get_current_student(request)
        labs = Lab.objects.select_related('course', 'subject', 'subject__course').prefetch_related('questions__hints').filter(is_active=True).order_by('-created_at')

        lab_scores_by_lab = {}
        if student:
            for ls in LabScore.objects.filter(student=student).select_related('lab', 'lab__subject'):
                lab_scores_by_lab[ls.lab_id] = ls

        submissions = {}
        if student:
            for sub in LabSubmission.objects.filter(student=student):
                submissions[sub.lab_id] = sub

        enriched_labs = []
        total_points_earned = 0
        total_possible_points = 0
        labs_completed_count = 0
        labs_in_progress_count = 0
        total_attendances = 0
        enrolled_labs_count = 0

        for lab in labs:
            can_attend, lock_reason, lab_subject = can_student_attend_lab(student, lab)
            if can_attend:
                enrolled_labs_count += 1

            ls = lab_scores_by_lab.get(lab.id)
            sub = submissions.get(lab.id)

            total_possible_points += lab.points
            # Score is uniquely bound to the lab (capped at lab.points)
            score = ls.score if ls else (sub.score if sub else 0)
            score = min(lab.points, max(0, score))
            total_points_earned += score

            attend_count = ls.attend_count if ls else (1 if sub else 0)
            total_attendances += attend_count

            sub_status = 'NOT_STARTED'
            if ls and ls.is_completed:
                sub_status = 'COMPLETED'
                labs_completed_count += 1
            elif sub and sub.status == 'COMPLETED':
                sub_status = 'COMPLETED'
                labs_completed_count += 1
            elif (ls and ls.attend_count > 0) or (sub and sub.status == 'IN_PROGRESS'):
                sub_status = 'IN_PROGRESS'
                labs_in_progress_count += 1

            q_count = lab.questions.count()
            solved_questions = ls.solved_questions_count if ls else 0
            if not solved_questions and sub and isinstance(sub.answers, dict):
                solved_questions = sum(1 for a in sub.answers.values() if isinstance(a, dict) and a.get('is_correct'))

            progress_pct = 0
            if q_count > 0:
                progress_pct = round((solved_questions / q_count) * 100)
            elif sub_status == 'COMPLETED':
                progress_pct = 100

            resolved_course_name = lab.course.name if lab.course else (lab.subject.course.name if lab.subject and lab.subject.course else None)
            resolved_course_id = lab.course_id or (lab.subject.course_id if lab.subject else None)

            video_file_url = None
            if lab.video_file:
                try:
                    video_file_url = request.build_absolute_uri(lab.video_file.url)
                except Exception:
                    video_file_url = lab.video_file.url

            enriched_labs.append({
                'id': lab.id,
                'name': lab.name,
                'description': lab.description,
                'org': lab.org,
                'category': lab.category,
                'difficulty': lab.difficulty,
                'points': lab.points,
                'target_url': lab.target_url,
                'video_url': lab.video_url,
                'video_file': video_file_url,
                'subject_id': lab.subject_id,
                'subject_name': lab.subject.name if lab.subject else None,
                'subject_code': lab.subject.code if lab.subject else None,
                'course_id': resolved_course_id,
                'course_name': resolved_course_name,
                'is_locked': not can_attend,
                'can_attend': can_attend,
                'lock_reason': lock_reason,
                'is_enrolled': can_attend,
                'question_count': q_count,
                'submission_status': sub_status,
                'score': score,
                'max_score': lab.points,
                'attend_count': attend_count,
                'is_completed': sub_status == 'COMPLETED',
                'solved_questions_count': solved_questions,
                'progress_pct': progress_pct,
                'started_at': ls.first_attended_at if ls else (sub.started_at if sub else None),
                'last_activity_at': ls.last_attended_at if ls else (sub.last_activity_at if sub else None),
                'submitted_at': ls.completed_at if ls else (sub.submitted_at if sub else None),
            })

        overall_pct = round((total_points_earned / total_possible_points) * 100) if total_possible_points > 0 else 0

        # Dedicated foreign key lab score list
        lab_score_list = []
        if student:
            scores_qs = LabScore.objects.filter(student=student).select_related('lab', 'lab__subject').order_by('-last_attended_at')
            lab_score_list = LabScoreSerializer(scores_qs, many=True).data

        student_name = "Student"
        if student:
            full = f"{student.first_name} {student.last_name}".strip()
            student_name = full or student.username

        stats = {
            'student_id': student.id if student else None,
            'student_name': student_name,
            'student_username': student.username if student else 'student',
            'labs_completed': labs_completed_count,
            'labs_in_progress': labs_in_progress_count,
            'labs_available': labs.count(),
            'total_points_earned': total_points_earned,
            'max_total_points': total_possible_points,
            'overall_progress_pct': overall_pct,
            'total_attendances': total_attendances,
        }

        return Response({
            'labs': enriched_labs,
            'lab_scores': lab_score_list,
            'stats': stats,
        })


class StudentLabAttendView(APIView):
    """
    GET  /api/student/labs/<id>/attend/ — fetch lab attendee workspace details
    POST /api/student/labs/<id>/attend/ — attend/resume lab session
    Tracks attendance count via LabScore foreign key. Attending one or multiple times
    NEVER increases the score.
    """
    permission_classes = [AllowAny]

    def get_lab(self, pk):
        return get_object_or_404(Lab.objects.prefetch_related('questions__hints'), pk=pk)

    def get(self, request, pk):
        student = get_current_student(request)
        lab = self.get_lab(pk)
        can_attend, lock_reason, _ = can_student_attend_lab(student, lab)
        if not can_attend:
            return Response({'detail': lock_reason, 'is_locked': True, 'lock_reason': lock_reason}, status=status.HTTP_403_FORBIDDEN)
        return self._render_attend_workspace(request, pk)

    def post(self, request, pk):
        student = get_current_student(request)
        lab = self.get_lab(pk)
        can_attend, lock_reason, _ = can_student_attend_lab(student, lab)
        if not can_attend:
            return Response({'detail': lock_reason, 'is_locked': True, 'lock_reason': lock_reason}, status=status.HTTP_403_FORBIDDEN)

        if student:
            # 1. Update or create LabScore (ForeignKey)
            lab_score, score_created = LabScore.objects.get_or_create(
                student=student,
                lab=lab,
                defaults={
                    'score': 0,
                    'max_score': lab.points,
                    'attend_count': 1,
                    'total_questions_count': lab.questions.count(),
                    'solved_questions_count': 0,
                }
            )
            if not score_created:
                # Increment attendance count, but DO NOT increase score!
                lab_score.attend_count += 1
                lab_score.save(update_fields=['attend_count', 'last_attended_at'])

            # 2. Update or create LabSubmission
            sub, created = LabSubmission.objects.get_or_create(
                student=student,
                lab=lab,
                defaults={
                    'status': 'IN_PROGRESS',
                    'max_score': lab.points,
                    'answers': {},
                }
            )
            if sub.status == 'NOT_STARTED':
                sub.status = 'IN_PROGRESS'
                sub.save()

        return self._render_attend_workspace(request, pk)

    def _render_attend_workspace(self, request, pk):
        student = get_current_student(request)
        lab = self.get_lab(pk)

        submission = None
        lab_score = None
        if student:
            submission = LabSubmission.objects.filter(student=student, lab=lab).first()
            lab_score = LabScore.objects.filter(student=student, lab=lab).first()

        answers = submission.answers if submission and isinstance(submission.answers, dict) else {}

        questions_payload = []
        for q in lab.questions.all():
            ans = answers.get(str(q.id), {})
            unlocked_hints = ans.get('hints_unlocked', [])

            hints_payload = []
            for h in q.hints.all():
                is_unlocked = (h.id in unlocked_hints) or (h.cost == 0)
                hints_payload.append({
                    'id': h.id,
                    'order': h.order,
                    'cost': h.cost,
                    'is_unlocked': is_unlocked,
                    'hint_text': h.hint_text if is_unlocked else None,
                })

            questions_payload.append({
                'id': q.id,
                'title': q.title,
                'description': q.description,
                'points': q.points,
                'order': q.order,
                'is_solved': bool(ans.get('is_correct')),
                'points_awarded': ans.get('points_awarded', 0),
                'submitted_flag': ans.get('submitted_flag', ''),
                'hints': hints_payload,
            })

        current_score = lab_score.score if lab_score else (submission.score if submission else 0)
        current_score = min(lab.points, max(0, current_score))

        effective_course = get_lab_effective_course(lab)

        return Response({
            'lab': {
                'id': lab.id,
                'name': lab.name,
                'description': lab.description,
                'org': lab.org,
                'category': lab.category,
                'difficulty': lab.difficulty,
                'points': lab.points,
                'target_url': lab.target_url,
                'video_url': lab.video_url,
                'video_file': request.build_absolute_uri(lab.video_file.url) if lab.video_file else None,
                'subject_name': lab.subject.name if lab.subject else None,
                'course_id': effective_course.id if effective_course else None,
                'course_name': effective_course.name if effective_course else None,
            },
            'questions': questions_payload,
            'lab_score': {
                'score': current_score,
                'max_score': lab.points,
                'attend_count': lab_score.attend_count if lab_score else 1,
                'is_completed': lab_score.is_completed if lab_score else (submission.status == 'COMPLETED' if submission else False),
            },
            'submission': {
                'id': submission.id if submission else None,
                'status': submission.status if submission else 'NOT_STARTED',
                'score': current_score,
                'max_score': submission.max_score if submission else lab.points,
                'started_at': submission.started_at if submission else None,
                'submitted_at': submission.submitted_at if submission else None,
            } if submission else None,
        })


class StudentLabSubmitMarkView(APIView):
    """
    POST /api/student/labs/<id>/submit/
    Actions:
      - 'submit_flag': evaluate submitted flag for a question.
        Guarantees that a question's marks are awarded at most ONCE,
        and total score for the lab is capped strictly at lab.points.
        Repeated submissions of the same question or re-attending do NOT inflate score.
      - 'unlock_hint': unlock hint with mark penalty deduction
      - 'finalize_submission': lock in final lab marks
    """
    permission_classes = [AllowAny]

    def post(self, request, pk):
        student = get_current_student(request)
        if not student:
            return Response({'detail': 'No active student found.'}, status=status.HTTP_400_BAD_REQUEST)

        lab = get_object_or_404(Lab.objects.prefetch_related('questions__hints'), pk=pk)
        can_attend, lock_reason, _ = can_student_attend_lab(student, lab)
        if not can_attend:
            return Response({'detail': lock_reason, 'is_locked': True, 'lock_reason': lock_reason}, status=status.HTTP_403_FORBIDDEN)
        submission, _ = LabSubmission.objects.get_or_create(
            student=student,
            lab=lab,
            defaults={
                'status': 'IN_PROGRESS',
                'max_score': lab.points,
                'answers': {},
            }
        )

        lab_score, _ = LabScore.objects.get_or_create(
            student=student,
            lab=lab,
            defaults={
                'score': 0,
                'max_score': lab.points,
                'attend_count': 1,
                'total_questions_count': lab.questions.count(),
                'solved_questions_count': 0,
            }
        )

        action = request.data.get('action', 'submit_flag')
        answers = dict(submission.answers) if isinstance(submission.answers, dict) else {}

        # 1. Unlock Hint Action
        if action == 'unlock_hint':
            hint_id = request.data.get('hint_id')
            question_id = request.data.get('question_id')
            hint = get_object_or_404(QuestionHint, pk=hint_id)

            q_key = str(question_id or hint.question_id)
            q_ans = answers.get(q_key, {})
            unlocked = q_ans.get('hints_unlocked', [])
            if hint.id not in unlocked:
                unlocked.append(hint.id)
            q_ans['hints_unlocked'] = unlocked
            answers[q_key] = q_ans
            submission.answers = answers
            submission.save()

            return Response({
                'success': True,
                'hint_id': hint.id,
                'hint_text': hint.hint_text,
                'cost': hint.cost,
                'message': f"Hint unlocked! {hint.cost} points deduction applied.",
            })

        # 2. Submit Flag Action
        if action == 'submit_flag':
            question_id = request.data.get('question_id')
            submitted_flag = str(request.data.get('flag', '')).strip()

            if not question_id:
                return Response({'detail': 'question_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

            question = get_object_or_404(LabQuestion.objects.prefetch_related('hints'), pk=question_id, lab=lab)

            q_key = str(question.id)
            q_ans = answers.get(q_key, {})
            already_solved = bool(q_ans.get('is_correct'))
            unlocked_hints = q_ans.get('hints_unlocked', [])

            expected_flag = question.flag.strip()
            # Flag match check (case-insensitive strip)
            is_correct = (submitted_flag.lower() == expected_flag.lower()) if expected_flag else (len(submitted_flag) > 0)

            if is_correct:
                if already_solved:
                    # Question is ALREADY SOLVED! Do NOT add points again!
                    return Response({
                        'success': True,
                        'is_correct': True,
                        'already_solved': True,
                        'points_awarded': 0,
                        'total_score': lab_score.score,
                        'status': submission.status,
                        'solved_count': lab_score.solved_questions_count,
                        'total_questions': lab.questions.count(),
                        'message': "Question already solved previously! Marks are locked and not re-added.",
                    })

                # Calculate hint deductions
                deductions = sum(h.cost for h in question.hints.filter(id__in=unlocked_hints))
                points_awarded = max(5, question.points - deductions)

                q_ans.update({
                    'submitted_flag': submitted_flag,
                    'is_correct': True,
                    'points_awarded': points_awarded,
                    'deductions': deductions,
                    'hints_unlocked': unlocked_hints,
                    'solved_at': timezone.now().isoformat(),
                })
                answers[q_key] = q_ans
                submission.answers = answers

                # Recalculate total score — strictly capped at lab.points
                raw_total = sum(
                    item.get('points_awarded', 0)
                    for item in answers.values()
                    if isinstance(item, dict) and item.get('is_correct')
                )
                final_lab_score = min(lab.points, raw_total)
                submission.score = final_lab_score

                # Count solved questions
                total_questions = lab.questions.count()
                solved_count = sum(
                    1 for item in answers.values()
                    if isinstance(item, dict) and item.get('is_correct')
                )

                if solved_count >= total_questions and total_questions > 0:
                    submission.status = 'COMPLETED'
                    submission.submitted_at = timezone.now()

                submission.save()

                # Sync with ForeignKey LabScore
                lab_score.score = final_lab_score
                lab_score.solved_questions_count = solved_count
                lab_score.total_questions_count = total_questions
                if submission.status == 'COMPLETED':
                    lab_score.is_completed = True
                    lab_score.completed_at = timezone.now()
                lab_score.save()

                return Response({
                    'success': True,
                    'is_correct': True,
                    'points_awarded': points_awarded,
                    'total_score': lab_score.score,
                    'status': submission.status,
                    'solved_count': solved_count,
                    'total_questions': total_questions,
                    'message': f"Correct Flag! +{points_awarded} marks awarded.",
                })
            else:
                q_ans['submitted_flag'] = submitted_flag
                q_ans['is_correct'] = False
                answers[q_key] = q_ans
                submission.answers = answers
                submission.save()

                return Response({
                    'success': False,
                    'is_correct': False,
                    'points_awarded': 0,
                    'total_score': lab_score.score,
                    'status': submission.status,
                    'message': "Incorrect flag. Review target output and try again!",
                })

        # 3. Finalize Lab Submission & Marks
        if action == 'finalize_submission':
            submission.status = 'COMPLETED'
            submission.submitted_at = timezone.now()
            submission.save()

            lab_score.is_completed = True
            lab_score.completed_at = timezone.now()
            lab_score.save()

            return Response({
                'success': True,
                'status': 'COMPLETED',
                'final_score': lab_score.score,
                'max_score': lab_score.max_score,
                'attend_count': lab_score.attend_count,
                'submitted_at': submission.submitted_at,
                'message': f"Lab officially submitted! Marks recorded: {lab_score.score} / {lab_score.max_score} points (Attended {lab_score.attend_count}x).",
            })

        return Response({'detail': f'Unknown action "{action}".'}, status=status.HTTP_400_BAD_REQUEST)


class StudentLabScoreListView(APIView):
    """
    GET /api/student/lab-scores/
    Returns the lab-based score list for the student using ForeignKey to Lab.
    Each lab has its own score. Attending multiple times does not increase score.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        student = get_current_student(request)
        if not student:
            return Response({'count': 0, 'results': []})

        scores = LabScore.objects.filter(student=student).select_related('lab', 'lab__subject').order_by('-last_attended_at')
        serializer = LabScoreSerializer(scores, many=True)
        return Response({'count': scores.count(), 'results': serializer.data})


class LabSubmissionListView(APIView):
    """
    GET /api/lab-submissions/
    Returns list of all student lab submissions (for instructor / admin view or audit).
    """
    def get_permissions(self):
        return [IsAdminOrStaff()]

    def get(self, request):
        submissions = LabSubmission.objects.select_related('student', 'lab').all()
        serializer = LabSubmissionSerializer(submissions, many=True)
        return Response({'count': submissions.count(), 'results': serializer.data})


# ─── STUDY MATERIALS ──────────────────────────────────────────
class StudyMaterialListCreateView(APIView):
    """
    GET  /api/materials/  — list study materials with filters:
         ?subject_id=<id>  Filter by Subject
         ?lab_id=<id>      Filter by optional linked Lab
         ?file_type=<type> Filter by file type (PDF, WORD, PPTX)
         ?q=<search>       Search in title/description
    POST /api/materials/  — upload a new study material (Admin only, multipart/form-data)
    """
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdminOrStaff()]

    def get(self, request):
        qs = StudyMaterial.objects.select_related('subject', 'subject__course', 'lab', 'uploaded_by').filter(is_active=True)
        
        subject_id = request.query_params.get('subject_id')
        if subject_id:
            qs = qs.filter(subject_id=subject_id)

        lab_id = request.query_params.get('lab_id')
        if lab_id:
            qs = qs.filter(lab_id=lab_id)

        file_type = request.query_params.get('file_type')
        if file_type:
            qs = qs.filter(file_type__iexact=file_type.strip())

        q = request.query_params.get('q')
        if q:
            qs = qs.filter(title__icontains=q) | qs.filter(description__icontains=q)

        serializer = StudyMaterialSerializer(qs, many=True, context={'request': request})
        return Response({'count': qs.count(), 'results': serializer.data})

    def post(self, request):
        serializer = CreateStudyMaterialSerializer(
            data=request.data,
            context={'request': request, 'user': request.user}
        )
        if serializer.is_valid():
            material = serializer.save()
            return Response({
                'message': f'Study material "{material.title}" uploaded successfully.',
                'material': StudyMaterialSerializer(material, context={'request': request}).data,
            }, status=status.HTTP_201_CREATED)

        errors = serializer.errors
        first_key = next(iter(errors))
        first_msg = errors[first_key]
        if isinstance(first_msg, list):
            first_msg = first_msg[0]
        return Response({'detail': str(first_msg), 'errors': errors}, status=status.HTTP_400_BAD_REQUEST)


class StudyMaterialDetailView(APIView):
    """
    GET    /api/materials/<id>/ — retrieve material
    PATCH  /api/materials/<id>/ — update material details (Admin only)
    DELETE /api/materials/<id>/ — delete material (Admin only)
    """
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdminOrStaff()]

    def get_material(self, pk):
        return get_object_or_404(StudyMaterial, pk=pk)

    def get(self, request, pk):
        material = self.get_material(pk)
        return Response(StudyMaterialSerializer(material, context={'request': request}).data)

    def patch(self, request, pk):
        material = self.get_material(pk)
        title = request.data.get('title')
        description = request.data.get('description')
        subject_id = request.data.get('subject_id')
        lab_id = request.data.get('lab_id')

        if title is not None:
            material.title = title.strip()
        if description is not None:
            material.description = description.strip()
        if subject_id is not None:
            material.subject = get_object_or_404(Subject, pk=subject_id)
        if lab_id is not None:
            material.lab = get_object_or_404(Lab, pk=lab_id) if lab_id else None

        if 'file' in request.FILES:
            file_obj = request.FILES['file']
            fname = file_obj.name.lower()
            allowed = ('.pdf', '.doc', '.docx', '.ppt', '.pptx')
            if not any(fname.endswith(ext) for ext in allowed):
                return Response({'detail': 'Unsupported file format.'}, status=status.HTTP_400_BAD_REQUEST)
            
            file_type = 'OTHER'
            if fname.endswith('.pdf'):
                file_type = 'PDF'
            elif fname.endswith(('.doc', '.docx')):
                file_type = 'WORD'
            elif fname.endswith(('.ppt', '.pptx')):
                file_type = 'PPTX'
            
            material.file = file_obj
            material.file_type = file_type
            material.file_size_bytes = file_obj.size

        material.save()
        return Response({
            'message': 'Study material updated successfully.',
            'material': StudyMaterialSerializer(material, context={'request': request}).data
        })

    def delete(self, request, pk):
        material = self.get_material(pk)
        title = material.title
        material.delete()
        return Response({'message': f'Study material "{title}" deleted successfully.'})


class StudentMaterialsView(APIView):
    """
    GET /api/student/materials/
    Returns active study materials accessible to the student.
    Enforces that the student is actively enrolled in the subject.
    Admins/staff see all active materials.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        student = get_current_student(request)
        qs = StudyMaterial.objects.select_related('subject', 'subject__course', 'lab', 'uploaded_by').filter(is_active=True)

        if student and not (student.is_staff or student.is_superuser or getattr(student, 'user_type', None) == 'admin'):
            # Filter by subjects the student is actively enrolled in
            enrolled_subject_ids = SubjectEnrollment.objects.filter(
                student=student, is_active=True
            ).values_list('subject_id', flat=True)
            qs = qs.filter(subject_id__in=enrolled_subject_ids)

        subject_id = request.query_params.get('subject_id')
        if subject_id:
            qs = qs.filter(subject_id=subject_id)

        lab_id = request.query_params.get('lab_id')
        if lab_id:
            qs = qs.filter(lab_id=lab_id)

        file_type = request.query_params.get('file_type')
        if file_type:
            qs = qs.filter(file_type__iexact=file_type.strip())

        q = request.query_params.get('q')
        if q:
            qs = qs.filter(title__icontains=q) | qs.filter(description__icontains=q)

        serializer = StudyMaterialSerializer(qs, many=True, context={'request': request})
        return Response({'count': qs.count(), 'results': serializer.data})



