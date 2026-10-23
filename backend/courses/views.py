from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
import json
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction
import random
from accounts.models import User
from accounts.serializers import UserSerializer, CreateStudentSerializer
from accounts.views import IsAdminOrStaff
from accounts.audit import record_audit_log
from .models import (
    Course, Enrollment, Module, Subject, SubjectEnrollment,
    Lab, LabQuestion, QuestionHint, LabSubmission, LabScore,
    StudyMaterial, StudentAssignedBatch, LabRetakeRequest, StudentClass
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
    StudentClassListSerializer,
    StudentClassDetailSerializer,
    CreateStudentClassSerializer,
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

            record_audit_log(
                action_type='COURSE_CREATE',
                description=f"Created course/class '{course.name}' ({course.duration_weeks} weeks, ₹{course.price}).",
                request=request,
                actor=request.user,
                target_entity='Course',
                target_id=course.id,
                target_name=course.name,
                severity='NOTICE',
                details={'name': course.name, 'price': float(course.price), 'duration_weeks': course.duration_weeks}
            )

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
            updated = serializer.save()

            record_audit_log(
                action_type='COURSE_UPDATE',
                description=f"Updated course/class settings for '{updated.name}'.",
                request=request,
                actor=request.user,
                target_entity='Course',
                target_id=updated.id,
                target_name=updated.name,
                severity='INFO',
                details={'updated_fields': list(request.data.keys())}
            )

            return Response({
                'message': 'Class updated.',
                'course': CourseSerializer(updated).data,
            })
        return Response({'detail': 'Update failed.', 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        course = self.get_course(pk)
        name = course.name
        course.is_active = False
        course.save()

        record_audit_log(
            action_type='COURSE_DELETE',
            description=f"Deactivated course/class '{name}'.",
            request=request,
            actor=request.user,
            target_entity='Course',
            target_id=course.id,
            target_name=name,
            severity='WARNING'
        )

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

            record_audit_log(
                action_type='SUBJECT_CREATE',
                description=f"Created course subject '{subject.name}' ({subject.code or 'No code'}).",
                request=request,
                actor=request.user,
                target_entity='Subject',
                target_id=subject.id,
                target_name=subject.name,
                severity='NOTICE',
                details={'name': subject.name, 'code': subject.code, 'course_id': subject.course_id}
            )

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
            updated = serializer.save()

            record_audit_log(
                action_type='SUBJECT_UPDATE',
                description=f"Updated details for subject '{updated.name}'.",
                request=request,
                actor=request.user,
                target_entity='Subject',
                target_id=updated.id,
                target_name=updated.name,
                severity='INFO',
                details={'updated_fields': list(request.data.keys())}
            )

            return Response({
                'message': 'Subject updated successfully.',
                'subject': SubjectSerializer(updated).data,
            })
        return Response({'detail': 'Update failed.', 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        subject = self.get_subject(pk)
        name = subject.name
        subject.is_active = False
        subject.save()

        record_audit_log(
            action_type='SUBJECT_DELETE',
            description=f"Deactivated subject '{name}'.",
            request=request,
            actor=request.user,
            target_entity='Subject',
            target_id=subject.id,
            target_name=name,
            severity='WARNING'
        )

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
        return get_object_or_404(User, pk=pk, user_type__in=['student', 'instructor'])

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
        student = get_object_or_404(User, pk=pk, user_type__in=['student', 'instructor'])
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

        record_audit_log(
            action_type='ENROLLMENT_ASSIGN',
            description=f"Assigned {enrollments.count()} course(s) to '{student.get_full_name() or student.username}'.",
            request=request,
            actor=request.user,
            target_entity='Enrollment',
            target_id=student.id,
            target_name=student.get_full_name() or student.username,
            severity='NOTICE',
            details={'course_ids': course_ids, 'total_enrolled': enrollments.count()}
        )

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
        student = get_object_or_404(User, pk=pk, user_type__in=['student', 'instructor'])
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

        record_audit_log(
            action_type='SUBJECT_ASSIGN',
            description=f"Assigned {enrollments.count()} subject(s) to '{student.get_full_name() or student.username}'.",
            request=request,
            actor=request.user,
            target_entity='SubjectEnrollment',
            target_id=student.id,
            target_name=student.get_full_name() or student.username,
            severity='NOTICE',
            details={'subject_ids': subject_ids, 'total_assigned': enrollments.count()}
        )

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
        student = get_object_or_404(User, pk=pk, user_type__in=['student', 'instructor'])
        enrollments = student.subject_enrollments.select_related('subject', 'subject__course').filter(is_active=True)
        return Response({
            'student_id': student.id,
            'student_name': f"{student.first_name} {student.last_name}".strip() or student.username,
            'count': enrollments.count(),
            'results': SubjectEnrollmentSerializer(enrollments, many=True).data,
        })

    def post(self, request, pk):
        student = get_object_or_404(User, pk=pk, user_type__in=['student', 'instructor'])
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

        serializer = LabSerializer(labs, many=True, context={'request': request})
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
            if request.user and request.user.is_authenticated:
                lab.created_by = request.user
                lab.save(update_fields=['created_by'])

            record_audit_log(
                action_type='LAB_CREATE',
                description=f"Created practical cybersecurity lab '{lab.name}' ({lab.category}, {lab.difficulty}, {lab.points} pts).",
                request=request,
                actor=request.user,
                target_entity='Lab',
                target_id=lab.id,
                target_name=lab.name,
                severity='NOTICE',
                details={'category': lab.category, 'difficulty': lab.difficulty, 'points': lab.points}
            )

            return Response({
                'message': f'Lab "{lab.name}" created successfully.',
                'lab': LabSerializer(lab, context={'request': request}).data,
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
        serializer = LabSerializer(lab, context={'request': request})
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

            record_audit_log(
                action_type='LAB_UPDATE',
                description=f"Updated lab configurations for '{updated_lab.name}'.",
                request=request,
                actor=request.user,
                target_entity='Lab',
                target_id=updated_lab.id,
                target_name=updated_lab.name,
                severity='INFO',
                details={'updated_fields': list(data.keys())}
            )

            return Response({
                'message': f'Lab "{updated_lab.name}" updated successfully.',
                'lab': LabSerializer(updated_lab, context={'request': request}).data,
            })
        return Response({'detail': 'Update failed.', 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        lab = self.get_object(pk)
        name = lab.name
        lab.is_active = False
        lab.save()

        record_audit_log(
            action_type='LAB_DELETE',
            description=f"Archived / deactivated cybersecurity lab '{name}'.",
            request=request,
            actor=request.user,
            target_entity='Lab',
            target_id=lab.id,
            target_name=name,
            severity='WARNING'
        )

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
            'results': LabSerializer(labs, many=True, context={'request': request}).data,
        })

    def post(self, request, pk):
        subject = get_object_or_404(Subject, pk=pk)
        data = request.data.copy()
        data['subject_id'] = subject.id
        if subject.course_id and not data.get('course_id'):
            data['course_id'] = subject.course_id
        serializer = LabSerializer(data=data)
        if serializer.is_valid():
            lab = serializer.save(created_by=request.user)
            return Response({
                'message': f'Lab "{lab.name}" added to course "{subject.name}".',
                'lab': LabSerializer(lab, context={'request': request}).data,
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
    """Resolve the student strictly from the authenticated user (never from request parameters)."""
    if request.user and request.user.is_authenticated:
        return request.user
    return None


def lab_creator_fields(lab, viewer):
    """Lab creator details for instructors/platform admins only; empty for students."""
    if not (viewer and viewer.is_authenticated and viewer.can_access_admin_dashboard):
        return {}
    creator = lab.created_by
    return {
        'created_by_name': (creator.get_full_name() or creator.username) if creator else None,
        'created_by_username': creator.username if creator else None,
        'created_by_role': creator.user_type if creator else None,
    }


def get_lab_effective_course(lab):
    """Resolve the Course this lab belongs to (directly or through subject)."""
    if lab.course:
        return lab.course
    if lab.subject and lab.subject.course:
        return lab.subject.course
    return None


def get_or_create_student_lab_batch(student):
    """
    Retrieves or generates a persistent 5-lab batch for the student.
    - If the student is admin/staff, return None (unrestricted view).
    - If student has an active batch:
        Check if all labs in the batch are attended/completed (or in progress).
        If all labs are attended/completed, complete this batch and generate the next batch of 5 labs!
        Otherwise, keep the exact same 5 labs (stable across refreshes).
    - If no active batch exists:
        Pick 5 random labs from eligible labs (or from all active labs not yet completed).
    """
    if not student or student.is_staff or student.is_superuser or getattr(student, 'user_type', None) in ('admin', 'instructor'):
        return None

    # Check for current active batch
    active_batch = StudentAssignedBatch.objects.filter(student=student, is_active=True).first()

    if active_batch:
        batch_labs = list(active_batch.labs.all())
        if batch_labs:
            # Check attendance/completion status for all labs in this batch
            attended_lab_ids = set(LabScore.objects.filter(
                student=student,
                lab__in=batch_labs,
                attend_count__gt=0
            ).values_list('lab_id', flat=True))

            all_attended = all(l.id in attended_lab_ids for l in batch_labs)
            if all_attended:
                # Mark current batch as completed
                active_batch.is_active = False
                active_batch.completed_at = timezone.now()
                active_batch.save()
                active_batch = None
            else:
                return active_batch

    # Generate new batch of 5 labs
    if not active_batch:
        # Determine which labs the student has already completed across all past batches
        previously_attended_ids = set(LabScore.objects.filter(
            student=student,
            attend_count__gt=0
        ).values_list('lab_id', flat=True))

        # Eligible candidate pool: active labs not yet attended
        eligible_qs = Lab.objects.filter(is_active=True).exclude(id__in=previously_attended_ids)
        available_count = eligible_qs.count()

        candidate_ids = list(eligible_qs.values_list('id', flat=True))
        if available_count < 5:
            # If fewer than 5 un-attended labs remain, include any remaining active labs to make up to 5
            all_active_ids = list(Lab.objects.filter(is_active=True).values_list('id', flat=True))
            remaining_needed = min(5, len(all_active_ids))
            # Keep un-attended first, then fill
            chosen_ids = list(candidate_ids)
            for lid in all_active_ids:
                if len(chosen_ids) >= remaining_needed:
                    break
                if lid not in chosen_ids:
                    chosen_ids.append(lid)
        else:
            # Pick 5 randomly without changing on refresh
            chosen_ids = random.sample(candidate_ids, 5)

        next_idx = StudentAssignedBatch.objects.filter(student=student).count() + 1
        new_batch = StudentAssignedBatch.objects.create(
            student=student,
            batch_index=next_idx,
            is_active=True
        )
        new_batch.labs.set(chosen_ids)
        return new_batch

    return active_batch


def can_student_attend_lab(student, lab):
    """
    Check if a student can attend a lab.
    Rules:
      - Admin / Staff can always attend.
      - If the lab has already been attended (attend_count > 0 or completed), re-attending / reopening is strictly BLOCKED.
      - A student must be actively assigned/enrolled in the lab's Subject.
      - If the lab has no assigned subject, or student is not assigned to that subject, attending is NOT possible.
    Returns: (can_attend: bool, lock_reason: str or None, effective_subject: Subject or None)
    """
    if not student:
        return False, "Authentication required to attend this lab.", None

    # Admins, instructors and staff have unrestricted lab access
    if student.is_staff or student.is_superuser or getattr(student, 'user_type', None) in ('admin', 'instructor'):
        return True, None, lab.subject

    # Administrative Lab Access Block check
    if getattr(student, 'is_lab_access_blocked', False):
        reason = getattr(student, 'lab_access_block_reason', '')
        detail_msg = f"Practical lab access has been blocked by administrator. Reason: {reason}" if reason else "Practical lab access has been blocked by administrator. Please contact support."
        return False, detail_msg, lab.subject

    # Check if student has completed this lab (all questions submitted / completed)
    prior_score = LabScore.objects.filter(student=student, lab=lab).first()
    prior_sub = LabSubmission.objects.filter(student=student, lab=lab).first()
    is_completed = (prior_score and prior_score.is_completed) or (prior_sub and prior_sub.status == 'COMPLETED')
    if is_completed:
        pending_retake = LabRetakeRequest.objects.filter(student=student, lab=lab, status='PENDING').exists()
        msg = "Lab completed (All questions submitted). Retake request is pending administrator approval." if pending_retake else "Lab completed (All questions submitted). You can request a retake to attend again."
        return False, msg, lab.subject

    # Class-Based mode: the lab must also be assigned to the student's class
    access_mode = getattr(student, 'lab_access_mode', 'unrestricted')
    if access_mode == 'class_based':
        if not student.assigned_class:
            return False, "Access restricted. You are in Class-Based access mode but have not been assigned to a class.", lab.subject
        if not student.assigned_class.labs.filter(id=lab.id).exists():
            return False, f"Access restricted. This lab is not assigned to your class '{student.assigned_class.name}'.", lab.subject

    # Both modes: students can ONLY attend labs of subjects they are assigned to
    if not lab.subject:
        return False, "Access restricted. This lab is not linked to a subject. You can only attend labs of your assigned subjects.", None

    if not SubjectEnrollment.objects.filter(student=student, subject=lab.subject, is_active=True).exists():
        subj_name = lab.subject.name
        subj_code = f" ({lab.subject.code})" if lab.subject.code else ""
        return False, f"Access restricted. You are not assigned to subject '{subj_name}{subj_code}'. You can only attend labs of your assigned subjects.", lab.subject

    return True, None, lab.subject


class StudentLabListView(APIView):
    """
    GET /api/student/labs/
    Returns active labs enriched with subject-based or class-based access locking,
    the current student's lab score (ForeignKey based), attend count, and submission status.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        student = get_current_student(request)
        is_admin_or_staff = bool(student and (student.is_staff or student.is_superuser or getattr(student, 'user_type', None) in ('admin', 'instructor')))

        student_name = "Student"
        if student:
            full = f"{student.first_name} {student.last_name}".strip()
            student_name = full or student.username

        assigned_batch = None
        if student and not is_admin_or_staff:
            # Students only see labs of their assigned subjects (class-based: also limited to their class)
            access_mode = getattr(student, 'lab_access_mode', 'unrestricted')
            if access_mode == 'class_based':
                base_labs = student.assigned_class.labs.all() if student.assigned_class else Lab.objects.none()
            else:
                base_labs = Lab.objects.all()
            enrolled_subject_ids = SubjectEnrollment.objects.filter(
                student=student, is_active=True
            ).values_list('subject_id', flat=True)
            labs = base_labs.select_related('course', 'subject', 'subject__course').prefetch_related('questions__hints').filter(
                is_active=True, subject_id__in=enrolled_subject_ids
            ).order_by('-created_at')
        else:
            labs = Lab.objects.select_related('course', 'subject', 'subject__course').prefetch_related('questions__hints').filter(is_active=True).order_by('-created_at')

        lab_scores_by_lab = {}
        if student:
            for ls in LabScore.objects.filter(student=student).select_related('lab', 'lab__subject'):
                lab_scores_by_lab[ls.lab_id] = ls

        submissions = {}
        if student:
            for sub in LabSubmission.objects.filter(student=student):
                submissions[sub.lab_id] = sub

        retake_requests_by_lab = {}
        if student:
            for rr in LabRetakeRequest.objects.filter(student=student).order_by('created_at'):
                retake_requests_by_lab[rr.lab_id] = rr

        enriched_labs = []
        total_points_earned = 0
        total_possible_points = 0
        labs_completed_count = 0
        labs_in_progress_count = 0
        total_attendances = 0
        assigned_labs_count = 0
        total_questions_completed = 0

        for lab in labs:
            can_attend, lock_reason, lab_subject = can_student_attend_lab(student, lab)

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

            # Assigned = attendable now, or already started/completed (completed labs get locked)
            if can_attend or sub_status != 'NOT_STARTED':
                assigned_labs_count += 1

            q_count = lab.questions.count()
            solved_questions = ls.solved_questions_count if ls else 0
            if not solved_questions and sub and isinstance(sub.answers, dict):
                solved_questions = sum(1 for a in sub.answers.values() if isinstance(a, dict) and a.get('is_correct'))
            total_questions_completed += solved_questions

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

            source_file_url = None
            if lab.source_file:
                try:
                    source_file_url = request.build_absolute_uri(lab.source_file.url)
                except Exception:
                    source_file_url = lab.source_file.url

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
                'source_link': lab.source_link,
                'source_file': source_file_url,
                'source_file_size': lab.source_file_size,
                'setup_guide': lab.setup_guide,
                'setup_commands': lab.setup_commands,
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
                'student_name': student_name,
                **lab_creator_fields(lab, student),
                'started_at': ls.first_attended_at if ls else (sub.started_at if sub else None),
                'last_activity_at': ls.last_attended_at if ls else (sub.last_activity_at if sub else None),
                'submitted_at': ls.completed_at if ls else (sub.submitted_at if sub else None),
                'retake_request_status': retake_requests_by_lab.get(lab.id).status if retake_requests_by_lab.get(lab.id) else None,
                'retake_request_id': retake_requests_by_lab.get(lab.id).id if retake_requests_by_lab.get(lab.id) else None,
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
            'labs_assigned': assigned_labs_count,
            'total_questions_completed': total_questions_completed,
            'total_points_earned': total_points_earned,
            'max_total_points': total_possible_points,
            'overall_progress_pct': overall_pct,
            'total_attendances': total_attendances,
            'batch_index': assigned_batch.batch_index if assigned_batch else 1,
            'is_batch_active': bool(assigned_batch),
            'is_lab_access_blocked': getattr(student, 'is_lab_access_blocked', False) if student else False,
            'lab_access_block_reason': getattr(student, 'lab_access_block_reason', '') if student else '',
            'lab_access_mode': getattr(student, 'lab_access_mode', 'unrestricted') if student else 'unrestricted',
            'assigned_class_id': student.assigned_class_id if student else None,
            'assigned_class_name': student.assigned_class.name if student and student.assigned_class else None,
            'assigned_class_code': student.assigned_class.code if student and student.assigned_class else None,
            'is_class_restricted': getattr(student, 'is_class_restricted', False) if student else False,
        }

        return Response({
            'labs': enriched_labs,
            'lab_scores': lab_score_list,
            'stats': stats,
            'batch': {
                'batch_index': assigned_batch.batch_index if assigned_batch else 1,
                'total_in_batch': labs.count(),
                'completed_in_batch': labs_completed_count,
            } if assigned_batch else None,
        })


class StudentLabAttendView(APIView):
    """
    GET  /api/student/labs/<id>/attend/ — fetch lab attendee workspace details
    POST /api/student/labs/<id>/attend/ — attend/resume lab session
    Tracks attendance count via LabScore foreign key. Attending one or multiple times
    NEVER increases the score.
    """
    permission_classes = [IsAuthenticated]

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
        student_display_name = (student.get_full_name() or student.username) if student else "Student"

        return Response({
            'student_name': student_display_name,
            'student_id': student.id if student else None,
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
                'source_link': lab.source_link,
                'source_file': request.build_absolute_uri(lab.source_file.url) if lab.source_file else None,
                'source_file_size': lab.source_file_size,
                'setup_guide': lab.setup_guide,
                'setup_commands': lab.setup_commands,
                'subject_name': lab.subject.name if lab.subject else None,
                'course_id': effective_course.id if effective_course else None,
                'course_name': effective_course.name if effective_course else None,
                'student_name': student_display_name,
                **lab_creator_fields(lab, student),
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
    permission_classes = [IsAuthenticated]

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

                # When all questions in the lab are solved, complete and block the lab!
                all_solved = (total_questions > 0 and solved_count >= total_questions)
                if all_solved:
                    submission.status = 'COMPLETED'
                    submission.submitted_at = timezone.now()
                    lab_score.is_completed = True
                    lab_score.completed_at = timezone.now()

                submission.save()

                # Sync with ForeignKey LabScore
                lab_score.score = final_lab_score
                lab_score.solved_questions_count = solved_count
                lab_score.total_questions_count = total_questions
                lab_score.save()

                return Response({
                    'success': True,
                    'is_correct': True,
                    'points_awarded': points_awarded,
                    'total_score': lab_score.score,
                    'status': submission.status,
                    'is_completed': lab_score.is_completed,
                    'all_solved': all_solved,
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
            answers = submission.answers if isinstance(submission.answers, dict) else {}
            solved_count = sum(1 for a in answers.values() if isinstance(a, dict) and a.get('is_correct'))
            total_questions = lab.questions.count()

            # Requirement 4: Lab only locks on after all questions complete
            if total_questions > 0 and solved_count < total_questions:
                return Response({
                    'detail': f'Lab cannot be finalized or locked until all questions are completed. ({solved_count} of {total_questions} questions solved).',
                    'solved_count': solved_count,
                    'total_questions': total_questions,
                    'is_completed': False,
                }, status=status.HTTP_400_BAD_REQUEST)

            raw_total = sum(
                item.get('points_awarded', 0)
                for item in answers.values()
                if isinstance(item, dict) and item.get('is_correct')
            )
            final_lab_score = min(lab.points, max(0, raw_total))

            submission.score = final_lab_score
            submission.status = 'COMPLETED'
            submission.submitted_at = timezone.now()
            submission.save()

            lab_score.score = final_lab_score
            lab_score.solved_questions_count = solved_count
            lab_score.total_questions_count = total_questions
            lab_score.is_completed = True
            lab_score.completed_at = timezone.now()
            lab_score.save()

            try:
                record_audit_log(
                    action_type='lab_finalized',
                    description=f"Student {student.username} finalized lab '{lab.name}' with score {lab_score.score}/{lab.points} ({solved_count}/{total_questions} solved)",
                    actor=student,
                    target_entity='Lab',
                    target_id=str(lab.id),
                    target_name=lab.name,
                    request=request
                )
            except Exception:
                pass

            return Response({
                'success': True,
                'status': 'COMPLETED',
                'final_score': lab_score.score,
                'max_score': lab_score.max_score,
                'solved_questions_count': solved_count,
                'total_questions': total_questions,
                'attend_count': lab_score.attend_count,
                'submitted_at': submission.submitted_at,
                'message': f"Lab officially submitted! Marks recorded: {lab_score.score} / {lab_score.max_score} points ({solved_count} of {total_questions} questions solved).",
            })

        return Response({'detail': f'Unknown action "{action}".'}, status=status.HTTP_400_BAD_REQUEST)


class AdminStudentLabRetakePermissionView(APIView):
    """
    POST /api/admin/labs/retake-permission/
    Grants retake permission for a student on a completed/blocked practical lab.
    Unlocks the lab, resets completion status to IN_PROGRESS so the student can
    attend and submit flags again. Optionally resets score/answers to 0 for a clean retake.
    """
    permission_classes = [IsAdminOrStaff]

    def post(self, request):
        student_id = request.data.get('student_id')
        lab_id = request.data.get('lab_id')
        reset_score = request.data.get('reset_score', True)

        if not student_id or not lab_id:
            return Response(
                {'detail': 'student_id and lab_id are required fields.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        student = get_object_or_404(User, pk=student_id)
        lab = get_object_or_404(Lab, pk=lab_id)

        lab_score = LabScore.objects.filter(student=student, lab=lab).first()
        submission = LabSubmission.objects.filter(student=student, lab=lab).first()

        # Unlock submission
        if submission:
            submission.status = 'IN_PROGRESS'
            submission.submitted_at = None
            if reset_score:
                submission.score = 0
                submission.answers = {}
            submission.save()
        else:
            submission = LabSubmission.objects.create(
                student=student,
                lab=lab,
                status='IN_PROGRESS',
                score=0,
                max_score=lab.points,
                answers={}
            )

        # Unlock lab score
        if lab_score:
            lab_score.is_completed = False
            lab_score.completed_at = None
            if reset_score:
                lab_score.score = 0
                lab_score.solved_questions_count = 0
            lab_score.save()
        else:
            lab_score = LabScore.objects.create(
                student=student,
                lab=lab,
                score=0,
                max_score=lab.points,
                attend_count=1,
                is_completed=False,
                total_questions_count=lab.questions.count(),
                solved_questions_count=0
            )

        # Resolve any pending retake request for this student and lab
        try:
            pending_reqs = LabRetakeRequest.objects.filter(student=student, lab=lab, status='PENDING')
            for pr in pending_reqs:
                pr.status = 'APPROVED'
                pr.reviewed_by = request.user if request.user.is_authenticated else None
                pr.reviewed_at = timezone.now()
                pr.admin_response_note = "Retake permission granted directly by administrator."
                pr.save()
        except Exception:
            pass

        try:
            record_audit_log(
                action_type='lab_retake_permission_granted',
                description=f"Retake permission granted to {student.username} for lab '{lab.name}' (Reset score: {reset_score})",
                actor=request.user if request.user.is_authenticated else None,
                target_entity='Lab',
                target_id=str(lab.id),
                target_name=lab.name,
                request=request
            )
        except Exception:
            pass

        return Response({
            'success': True,
            'message': f"Retake permission granted for student '{student.username}' on lab '{lab.name}'. Student can now reopen and retake this lab.",
            'student_id': student.id,
            'student_username': student.username,
            'lab_id': lab.id,
            'lab_name': lab.name,
            'status': submission.status,
            'is_completed': lab_score.is_completed,
            'score': lab_score.score,
        })


class StudentLabRetakeRequestView(APIView):
    """
    POST /api/student/labs/<id>/retake-request/
    Allows a student to submit a retake request for a completed or locked lab.
    GET  /api/student/labs/<id>/retake-request/
    Retrieves the status of the retake request for this lab.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        student = get_current_student(request)
        if not student:
            return Response({'detail': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)
        lab = get_object_or_404(Lab, pk=pk)
        req = LabRetakeRequest.objects.filter(student=student, lab=lab).order_by('-created_at').first()
        if not req:
            return Response({'has_request': False, 'status': None})
        return Response({
            'has_request': True,
            'id': req.id,
            'status': req.status,
            'reason': req.reason,
            'created_at': req.created_at,
            'reviewed_at': req.reviewed_at,
        })

    def post(self, request, pk):
        student = get_current_student(request)
        if not student:
            return Response({'detail': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)
        lab = get_object_or_404(Lab, pk=pk)

        # Retakes can only be requested for labs the student has completed
        is_completed = (
            LabScore.objects.filter(student=student, lab=lab, is_completed=True).exists()
            or LabSubmission.objects.filter(student=student, lab=lab, status='COMPLETED').exists()
        )
        if not is_completed:
            return Response({
                'detail': 'You can only request a retake for a lab you have completed.',
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check if there is already a PENDING request
        existing = LabRetakeRequest.objects.filter(student=student, lab=lab, status='PENDING').first()
        if existing:
            return Response({
                'detail': 'A retake request for this lab is already pending administrator approval.',
                'request_id': existing.id,
                'status': existing.status,
            }, status=status.HTTP_400_BAD_REQUEST)

        reason = request.data.get('reason', '').strip()
        new_req = LabRetakeRequest.objects.create(
            student=student,
            lab=lab,
            status='PENDING',
            reason=reason
        )

        try:
            record_audit_log(
                action_type='lab_retake_requested',
                description=f"Student '{student.username}' requested retake for lab '{lab.name}'. Reason: {reason or 'None'}",
                actor=student,
                target_entity='Lab',
                target_id=str(lab.id),
                target_name=lab.name,
                request=request
            )
        except Exception:
            pass

        return Response({
            'success': True,
            'message': f"Retake request for '{lab.name}' sent successfully! An instructor or admin will review it.",
            'request_id': new_req.id,
            'status': new_req.status,
        }, status=status.HTTP_201_CREATED)


class AdminLabRetakeRequestListView(APIView):
    """
    GET /api/admin/labs/retake-requests/
    Lists retake requests with optional status filter (e.g. ?status=PENDING).
    """
    permission_classes = [IsAdminOrStaff]

    def get(self, request):
        req_status = request.query_params.get('status')
        qs = LabRetakeRequest.objects.select_related('student', 'lab', 'lab__subject', 'reviewed_by').all()
        if req_status:
            qs = qs.filter(status=req_status)

        results = []
        for r in qs[:100]:
            results.append({
                'id': r.id,
                'student_id': r.student.id,
                'student_username': r.student.username,
                'student_name': getattr(r.student, 'full_name', '') or r.student.get_full_name() or r.student.username,
                'student_email': r.student.email,
                'lab_id': r.lab.id,
                'lab_name': r.lab.name,
                'lab_difficulty': r.lab.difficulty,
                'subject_name': r.lab.subject.name if r.lab.subject else None,
                'status': r.status,
                'reason': r.reason,
                'admin_response_note': r.admin_response_note,
                'created_at': r.created_at,
                'reviewed_at': r.reviewed_at,
                'reviewed_by_username': r.reviewed_by.username if r.reviewed_by else None,
            })
        return Response({'count': len(results), 'results': results})


class AdminLabRetakeRequestActionView(APIView):
    """
    POST /api/admin/labs/retake-requests/<id>/action/
    Action: 'approve'/'accept' or 'reject'/'decline'
    """
    permission_classes = [IsAdminOrStaff]

    def post(self, request, pk):
        req_obj = get_object_or_404(LabRetakeRequest.objects.select_related('student', 'lab'), pk=pk)
        raw_action = request.data.get('action', '').strip().lower()
        note = request.data.get('note', '').strip()
        reset_score = request.data.get('reset_score', False)

        if raw_action in ('approve', 'accept'):
            action = 'approve'
        elif raw_action in ('reject', 'decline'):
            action = 'reject'
        else:
            return Response({'detail': "Action must be either 'accept'/'approve' or 'reject'."}, status=status.HTTP_400_BAD_REQUEST)

        if action == 'approve':
            req_obj.status = 'APPROVED'
            req_obj.admin_response_note = note
            req_obj.reviewed_by = request.user if request.user.is_authenticated else None
            req_obj.reviewed_at = timezone.now()
            req_obj.save()

            # Unlock the lab for the student so they can attend again
            student = req_obj.student
            lab = req_obj.lab

            lab_score = LabScore.objects.filter(student=student, lab=lab).first()
            submission = LabSubmission.objects.filter(student=student, lab=lab).first()

            if submission:
                submission.status = 'IN_PROGRESS'
                submission.submitted_at = None
                if reset_score:
                    submission.score = 0
                    submission.answers = {}
                submission.save()
            else:
                submission = LabSubmission.objects.create(
                    student=student,
                    lab=lab,
                    status='IN_PROGRESS',
                    score=0,
                    max_score=lab.points,
                    answers={}
                )

            if lab_score:
                lab_score.is_completed = False
                lab_score.completed_at = None
                if reset_score:
                    lab_score.score = 0
                    lab_score.solved_questions_count = 0
                lab_score.save()
            else:
                lab_score = LabScore.objects.create(
                    student=student,
                    lab=lab,
                    score=0,
                    max_score=lab.points,
                    attend_count=1,
                    is_completed=False,
                    total_questions_count=lab.questions.count(),
                    solved_questions_count=0
                )

            try:
                record_audit_log(
                    action_type='lab_retake_approved',
                    description=f"Retake request accepted for {student.username} on '{lab.name}'. Lab is now unlocked (Reset score: {reset_score}). Note: {note or 'None'}",
                    actor=request.user if request.user.is_authenticated else None,
                    target_entity='Lab',
                    target_id=str(lab.id),
                    target_name=lab.name,
                    request=request
                )
            except Exception:
                pass

            return Response({
                'success': True,
                'message': f"Retake request accepted for student '{student.username}' on lab '{lab.name}'. Lab is now unlocked for student!",
                'request_id': req_obj.id,
                'status': req_obj.status,
                'student_username': student.username,
                'lab_name': lab.name,
            })

        elif action == 'reject':
            req_obj.status = 'REJECTED'
            req_obj.admin_response_note = note
            req_obj.reviewed_by = request.user if request.user.is_authenticated else None
            req_obj.reviewed_at = timezone.now()
            req_obj.save()

            try:
                record_audit_log(
                    action_type='lab_retake_rejected',
                    description=f"Retake request rejected for {req_obj.student.username} on '{req_obj.lab.name}'. Note: {note or 'None'}",
                    actor=request.user if request.user.is_authenticated else None,
                    target_entity='Lab',
                    target_id=str(req_obj.lab.id),
                    target_name=req_obj.lab.name,
                    request=request
                )
            except Exception:
                pass

            return Response({
                'success': True,
                'message': f"Retake request for '{req_obj.student.username}' on '{req_obj.lab.name}' has been rejected.",
                'request_id': req_obj.id,
                'status': req_obj.status,
                'student_username': req_obj.student.username,
                'lab_name': req_obj.lab.name,
            })


class StudentLabScoreListView(APIView):
    """
    GET /api/student/lab-scores/
    Returns the lab-based score list for the student using ForeignKey to Lab.
    Each lab has its own score. Attending multiple times does not increase score.
    """
    permission_classes = [IsAuthenticated]

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
    Supports optional ?student_id=<id> filter.
    """
    def get_permissions(self):
        return [IsAdminOrStaff()]

    def get(self, request):
        submissions = LabSubmission.objects.select_related('student', 'lab', 'lab__subject', 'lab__course').all()
        student_id = request.query_params.get('student_id')
        if student_id:
            submissions = submissions.filter(student_id=student_id)
        serializer = LabSubmissionSerializer(submissions, many=True)
        return Response({'count': submissions.count(), 'results': serializer.data})


class StudentActivityFeedView(APIView):
    """
    GET /api/student-activity/
    Returns unified live activity feed across students:
    - Lab attendances / attempts
    - Flag submissions & completions
    - Hint unlocks
    - Enrollment events
    Supports filter by ?student_id=<id>, ?type=<type>, and ?q=<search>.
    """
    def get_permissions(self):
        return [IsAdminOrStaff()]

    def get(self, request):
        student_id = request.query_params.get('student_id')
        q = request.query_params.get('q', '').strip().lower()

        # 1. Fetch Lab Submissions / Attempts
        subs_qs = LabSubmission.objects.select_related('student', 'lab', 'lab__subject', 'lab__course').all().order_by('-last_activity_at')
        if student_id:
            subs_qs = subs_qs.filter(student_id=student_id)

        # 2. Fetch Lab Scores (attendance records)
        scores_qs = LabScore.objects.select_related('student', 'lab', 'lab__subject').all().order_by('-last_attended_at')
        if student_id:
            scores_qs = scores_qs.filter(student_id=student_id)

        # 3. Fetch Subject Enrollments
        subj_enr_qs = SubjectEnrollment.objects.select_related('student', 'subject', 'subject__course').all().order_by('-enrolled_at')
        if student_id:
            subj_enr_qs = subj_enr_qs.filter(student_id=student_id)

        activities = []

        # Build activities from Submissions
        for sub in subs_qs[:150]:
            student_name = sub.student.get_full_name() or sub.student.username
            answers = sub.answers if isinstance(sub.answers, dict) else {}

            # Question / flag events inside submission
            for q_id, ans in answers.items():
                if isinstance(ans, dict) and ans.get('is_correct'):
                    activities.append({
                        'id': f"flag-{sub.id}-{q_id}",
                        'type': 'flag_solve',
                        'student_id': sub.student_id,
                        'student_name': student_name,
                        'student_username': sub.student.username,
                        'lab_id': sub.lab_id,
                        'lab_name': sub.lab.name,
                        'subject_name': sub.lab.subject.name if sub.lab.subject else None,
                        'title': f"Solved Question in {sub.lab.name}",
                        'description': f"Successfully cracked and submitted flag for question #{q_id}",
                        'points': ans.get('points_awarded', 0),
                        'timestamp': ans.get('solved_at') or sub.last_activity_at,
                        'status': 'SUCCESS',
                    })

                # Hints unlocked
                for hint_id in (ans.get('hints_unlocked') or []):
                    activities.append({
                        'id': f"hint-{sub.id}-{hint_id}",
                        'type': 'hint_unlock',
                        'student_id': sub.student_id,
                        'student_name': student_name,
                        'student_username': sub.student.username,
                        'lab_id': sub.lab_id,
                        'lab_name': sub.lab.name,
                        'subject_name': sub.lab.subject.name if sub.lab.subject else None,
                        'title': f"Unlocked Hint in {sub.lab.name}",
                        'description': f"Unlocked hint #{hint_id} (-{ans.get('deductions', 10)} pts deduction)",
                        'points': -(ans.get('deductions', 10)),
                        'timestamp': sub.last_activity_at,
                        'status': 'WARNING',
                    })

            # Overall Completion event
            if sub.status == 'COMPLETED':
                activities.append({
                    'id': f"sub-complete-{sub.id}",
                    'type': 'lab_completed',
                    'student_id': sub.student_id,
                    'student_name': student_name,
                    'student_username': sub.student.username,
                    'lab_id': sub.lab_id,
                    'lab_name': sub.lab.name,
                    'subject_name': sub.lab.subject.name if sub.lab.subject else None,
                    'title': f"Completed Lab: {sub.lab.name}",
                    'description': f"Scored {sub.score} / {sub.max_score} points ({round((sub.score/sub.max_score)*100) if sub.max_score else 100}%)",
                    'points': sub.score,
                    'timestamp': sub.submitted_at or sub.last_activity_at,
                    'status': 'COMPLETED',
                })
            else:
                activities.append({
                    'id': f"sub-progress-{sub.id}",
                    'type': 'lab_in_progress',
                    'student_id': sub.student_id,
                    'student_name': student_name,
                    'student_username': sub.student.username,
                    'lab_id': sub.lab_id,
                    'lab_name': sub.lab.name,
                    'subject_name': sub.lab.subject.name if sub.lab.subject else None,
                    'title': f"In-Progress Lab: {sub.lab.name}",
                    'description': f"Current score {sub.score} / {sub.max_score} pts",
                    'points': sub.score,
                    'timestamp': sub.last_activity_at,
                    'status': 'IN_PROGRESS',
                })

        # Build activities from Lab Scores (attendances)
        for ls in scores_qs[:100]:
            student_name = ls.student.get_full_name() or ls.student.username
            activities.append({
                'id': f"attend-{ls.id}",
                'type': 'lab_attended',
                'student_id': ls.student_id,
                'student_name': student_name,
                'student_username': ls.student.username,
                'lab_id': ls.lab_id,
                'lab_name': ls.lab.name,
                'subject_name': ls.lab.subject.name if ls.lab.subject else None,
                'title': f"Attended Lab: {ls.lab.name}",
                'description': f"Attended {ls.attend_count} time(s) • Current marks: {ls.score}/{ls.max_score} pts",
                'points': ls.score,
                'timestamp': ls.last_attended_at,
                'status': 'ATTENDED',
            })

        # Build activities from Subject Enrollments
        for se in subj_enr_qs[:50]:
            student_name = se.student.get_full_name() or se.student.username
            activities.append({
                'id': f"enroll-subj-{se.id}",
                'type': 'subject_assigned',
                'student_id': se.student_id,
                'student_name': student_name,
                'student_username': se.student.username,
                'lab_id': None,
                'lab_name': None,
                'subject_name': se.subject.name,
                'title': f"Assigned to Subject: {se.subject.name}",
                'description': f"Granted practical lab access for {se.subject.name} ({se.subject.code})",
                'points': 0,
                'timestamp': se.enrolled_at,
                'status': 'INFO',
            })

        # Deduplicate by id and sort descending by timestamp
        seen = set()
        unique_acts = []
        for a in activities:
            if a['id'] not in seen:
                seen.add(a['id'])
                unique_acts.append(a)

        unique_acts.sort(key=lambda x: str(x.get('timestamp') or ''), reverse=True)

        if q:
            unique_acts = [
                a for a in unique_acts
                if q in a['student_name'].lower()
                or q in a['student_username'].lower()
                or (a['lab_name'] and q in a['lab_name'].lower())
                or (a['subject_name'] and q in a['subject_name'].lower())
                or q in a['title'].lower()
            ]

        return Response({
            'count': len(unique_acts),
            'results': unique_acts[:100],
        })


class StudentProgressReportView(APIView):
    """
    GET /api/student-progress/
    Returns comprehensive progress listing for all students or a specific student:
    - Overall score / total achievable marks
    - Completion percentage
    - Labs attended, completed, in-progress
    - Breakdown of scores per attended lab
    - Subject enrollment status
    Supports optional ?student_id=<id> filter.
    """
    def get_permissions(self):
        return [IsAdminOrStaff()]

    def get(self, request):
        student_id = request.query_params.get('student_id')
        students_qs = User.objects.filter(user_type='student', is_active=True).order_by('first_name', 'last_name')
        if student_id:
            students_qs = students_qs.filter(id=student_id)

        all_labs = Lab.objects.filter(is_active=True)
        total_platform_labs = all_labs.count()
        total_platform_possible_points = sum(l.points for l in all_labs)

        # Batch load scores and submissions
        all_scores = LabScore.objects.select_related('lab', 'lab__subject').all()
        scores_by_student = {}
        for sc in all_scores:
            scores_by_student.setdefault(sc.student_id, []).append(sc)

        all_subs = LabSubmission.objects.select_related('lab', 'lab__subject').all()
        subs_by_student = {}
        for sb in all_subs:
            subs_by_student.setdefault(sb.student_id, []).append(sb)

        all_subj_enr = SubjectEnrollment.objects.select_related('subject').filter(is_active=True)
        subj_by_student = {}
        for se in all_subj_enr:
            subj_by_student.setdefault(se.student_id, []).append(se)

        results = []
        platform_stats = {
            'total_students': students_qs.count(),
            'total_labs': total_platform_labs,
            'total_platform_points': total_platform_possible_points,
            'total_completions': 0,
            'total_attendances': 0,
            'average_progress_pct': 0,
        }

        total_progress_pct_sum = 0

        for student in students_qs:
            sc_list = scores_by_student.get(student.id, [])
            sb_list = subs_by_student.get(student.id, [])
            se_list = subj_by_student.get(student.id, [])

            labs_attended_count = len(sc_list)
            total_attend_times = sum(sc.attend_count for sc in sc_list)
            platform_stats['total_attendances'] += total_attend_times

            completed_labs = [sc for sc in sc_list if sc.is_completed]
            labs_completed_count = len(completed_labs)
            platform_stats['total_completions'] += labs_completed_count

            in_progress_labs = [sc for sc in sc_list if not sc.is_completed and sc.attend_count > 0]
            labs_in_progress_count = len(in_progress_labs)

            total_earned_score = sum(sc.score for sc in sc_list)
            total_assigned_max_score = sum(sc.max_score for sc in sc_list) if sc_list else total_platform_possible_points

            progress_pct = round((total_earned_score / total_platform_possible_points) * 100) if total_platform_possible_points > 0 else 0
            completion_rate = round((labs_completed_count / total_platform_labs) * 100) if total_platform_labs > 0 else 0

            total_progress_pct_sum += progress_pct

            # Lab detail items for this student
            lab_details = []
            for sc in sc_list:
                lab_details.append({
                    'lab_id': sc.lab_id,
                    'lab_name': sc.lab.name,
                    'category': sc.lab.category,
                    'difficulty': sc.lab.difficulty,
                    'subject_name': sc.lab.subject.name if sc.lab.subject else None,
                    'score': sc.score,
                    'max_score': sc.max_score,
                    'score_pct': round((sc.score / sc.max_score) * 100) if sc.max_score > 0 else 0,
                    'attend_count': sc.attend_count,
                    'is_completed': sc.is_completed,
                    'solved_questions': sc.solved_questions_count,
                    'total_questions': sc.total_questions_count,
                    'first_attended_at': sc.first_attended_at,
                    'last_attended_at': sc.last_attended_at,
                    'completed_at': sc.completed_at,
                })

            # Sort student's lab scores by latest attended
            lab_details.sort(key=lambda x: str(x.get('last_attended_at') or ''), reverse=True)

            student_name = student.get_full_name() or student.username
            results.append({
                'student_id': student.id,
                'name': student_name,
                'username': student.username,
                'email': student.email,
                'organization': student.organization,
                'date_joined': student.date_joined,
                'assigned_subjects_count': len(se_list),
                'assigned_subjects': [{'id': se.subject_id, 'name': se.subject.name, 'code': se.subject.code} for se in se_list],
                'labs_attended_count': labs_attended_count,
                'total_attend_times': total_attend_times,
                'labs_completed_count': labs_completed_count,
                'labs_in_progress_count': labs_in_progress_count,
                'total_earned_score': total_earned_score,
                'total_possible_score': total_platform_possible_points,
                'progress_pct': progress_pct,
                'completion_rate': completion_rate,
                'last_active_at': sc_list[0].last_attended_at if sc_list else student.date_joined,
                'lab_scores': lab_details,
            })

        if results:
            platform_stats['average_progress_pct'] = round(total_progress_pct_sum / len(results))

        return Response({
            'stats': platform_stats,
            'count': len(results),
            'results': results,
        })


class AdminDashboardStatsView(APIView):
    """
    GET /api/admin/dashboard-stats/
    Calculates accurate live database statistics for the Admin Dashboard:
    - total_students: Count of User(user_type='student')
    - active_students: Count of active students (is_active=True)
    - active_students_pct: (active_students / total_students) * 100
    - fee_due: Sum of course prices where student enrollment fee_status in ('DUE', 'PARTIAL')
    - fee_due_formatted: Formatted in INR (e.g. ₹0 or ₹1.4L)
    - avg_progress: Average platform completion % across all students
    - completions_chart: Grouped completions counts for 7D, 30D, and 90D intervals
    - recent_active_labs: Top active labs with live question & hint counts from DB
    """
    def get_permissions(self):
        return [IsAdminOrStaff()]

    def get(self, request):
        now = timezone.now()

        # 1. Student counts
        all_students = User.objects.filter(user_type='student')
        total_students = all_students.count()
        active_students = all_students.filter(is_active=True).count()
        active_pct = round((active_students / total_students) * 100) if total_students > 0 else 0

        # 2. Fee Due calculation from database enrollments
        # Find enrollments with fee_status in DUE or PARTIAL
        due_enrollments = Enrollment.objects.filter(
            is_active=True,
            fee_status__in=['DUE', 'PARTIAL']
        ).select_related('course')

        total_fee_due = 0.0
        for enr in due_enrollments:
            price = float(enr.course.price) if enr.course and enr.course.price else 0.0
            if enr.fee_status == 'PARTIAL':
                total_fee_due += price * 0.5  # 50% remainder for partial
            else:
                total_fee_due += price

        # Format Fee Due nicely
        if total_fee_due >= 100000:
            fee_due_str = f"₹{round(total_fee_due / 100000, 1)}L"
        elif total_fee_due >= 1000:
            fee_due_str = f"₹{round(total_fee_due / 1000, 1)}k"
        else:
            fee_due_str = f"₹{int(total_fee_due)}"

        # 3. Overall Average Progress calculation
        all_labs = Lab.objects.filter(is_active=True)
        total_platform_points = sum(l.points for l in all_labs)

        avg_progress = 0
        if total_students > 0 and total_platform_points > 0:
            # Sum up all scores achieved by all students
            all_scores = LabScore.objects.all()
            total_earned_sum = sum(s.score for s in all_scores)
            avg_progress = round((total_earned_sum / (total_students * total_platform_points)) * 100)
            avg_progress = min(100, max(0, avg_progress))

        # 4. Lab completions histogram chart (7D, 30D, 90D buckets)
        completed_scores = LabScore.objects.filter(is_completed=True)

        def get_bucket_chart(days, buckets=12):
            cutoff = now - timezone.timedelta(days=days)
            bucket_delta = timezone.timedelta(days=days / buckets)
            chart = []
            max_in_bucket = 1

            for b in range(buckets):
                bucket_start = cutoff + (bucket_delta * b)
                bucket_end = bucket_start + bucket_delta
                # Count completions in this window
                c_count = completed_scores.filter(
                    completed_at__gte=bucket_start,
                    completed_at__lt=bucket_end
                ).count()
                chart.append(c_count)
                if c_count > max_in_bucket:
                    max_in_bucket = c_count

            # Normalize heights to percentages 15% - 100% for sleek chart display
            pct_bars = []
            for count in chart:
                pct = round((count / max_in_bucket) * 100) if max_in_bucket > 0 else 0
                pct_bars.append(max(18, pct) if count > 0 else 12)
            return pct_bars

        chart_7d = get_bucket_chart(7)
        chart_30d = get_bucket_chart(30)
        chart_90d = get_bucket_chart(90)

        # 5. Top active labs list from database
        active_labs_qs = Lab.objects.filter(is_active=True).select_related('subject', 'course').prefetch_related('questions__hints')[:5]
        active_labs = []
        for lab in active_labs_qs:
            q_count = lab.questions.count()
            h_count = sum(q.hints.count() for q in lab.questions.all())
            active_labs.append({
                'id': lab.id,
                'name': lab.name,
                'org': lab.org or 'BlitzLab',
                'category': lab.category,
                'difficulty': lab.difficulty,
                'points': lab.points,
                'question_count': q_count,
                'hint_count': h_count,
                'subject_name': lab.subject.name if lab.subject else None,
            })

        # 5. Pending Retake Requests
        pending_retake_requests_qs = LabRetakeRequest.objects.filter(status='PENDING').select_related('student', 'lab', 'lab__subject')
        pending_retake_requests = [
            {
                'id': r.id,
                'student_id': r.student.id,
                'student_username': r.student.username,
                'student_name': getattr(r.student, 'full_name', '') or r.student.get_full_name() or r.student.username,
                'student_email': r.student.email,
                'lab_id': r.lab.id,
                'lab_name': r.lab.name,
                'lab_difficulty': r.lab.difficulty,
                'subject_name': r.lab.subject.name if r.lab.subject else None,
                'reason': r.reason,
                'created_at': r.created_at.isoformat() if r.created_at else None,
            }
            for r in pending_retake_requests_qs[:20]
        ]

        return Response({
            'total_students': total_students,
            'active_students': active_students,
            'active_students_pct': active_pct,
            'fee_due_raw': total_fee_due,
            'fee_due_formatted': fee_due_str,
            'avg_progress': avg_progress,
            'total_labs': all_labs.count(),
            'total_completions': completed_scores.count(),
            'completions_chart': {
                '7D': chart_7d,
                '30D': chart_30d,
                '90D': chart_90d,
            },
            'active_labs': active_labs,
            'pending_retake_requests_count': pending_retake_requests_qs.count(),
            'pending_retake_requests': pending_retake_requests,
        })




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
            return [IsAuthenticated()]
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

            record_audit_log(
                action_type='MATERIAL_UPLOAD',
                description=f"Uploaded study material '{material.title}' ({material.file_type}) for subject '{material.subject.name}'.",
                request=request,
                actor=request.user,
                target_entity='StudyMaterial',
                target_id=material.id,
                target_name=material.title,
                severity='NOTICE',
                details={'subject': material.subject.name, 'file_type': material.file_type}
            )

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
            return [IsAuthenticated()]
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

        record_audit_log(
            action_type='MATERIAL_UPDATE',
            description=f"Updated study material details for '{material.title}'.",
            request=request,
            actor=request.user,
            target_entity='StudyMaterial',
            target_id=material.id,
            target_name=material.title,
            severity='INFO'
        )

        return Response({
            'message': 'Study material updated successfully.',
            'material': StudyMaterialSerializer(material, context={'request': request}).data
        })

    def delete(self, request, pk):
        material = self.get_material(pk)
        title = material.title
        material.delete()

        record_audit_log(
            action_type='MATERIAL_DELETE',
            description=f"Deleted study material '{title}'.",
            request=request,
            actor=request.user,
            target_entity='StudyMaterial',
            target_id=pk,
            target_name=title,
            severity='WARNING'
        )

        return Response({'message': f'Study material "{title}" deleted successfully.'})



class StudentMaterialsView(APIView):
    """
    GET /api/student/materials/
    Returns active study materials accessible to the student.
    Enforces that the student is actively enrolled in the subject.
    Admins/staff see all active materials.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        student = get_current_student(request)
        qs = StudyMaterial.objects.select_related('subject', 'subject__course', 'lab', 'uploaded_by').filter(is_active=True)

        if student and not (student.is_staff or student.is_superuser or getattr(student, 'user_type', None) in ('admin', 'instructor')):
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


# ============================================================================
# CLASS MANAGEMENT (StudentClass)
# ============================================================================

class StudentClassListCreateView(APIView):
    """
    GET  /api/classes/  — List all classes (with lab and student counts)
    POST /api/classes/  — Create a new class
    """
    permission_classes = [IsAdminOrStaff]

    def get(self, request):
        qs = StudentClass.objects.all().prefetch_related('labs', 'students')
        search = request.query_params.get('search') or request.query_params.get('q')
        if search:
            from django.db.models import Q
            qs = qs.filter(Q(name__icontains=search) | Q(code__icontains=search) | Q(description__icontains=search))

        is_active = request.query_params.get('is_active')
        if is_active is not None and is_active != '':
            qs = qs.filter(is_active=is_active.lower() in ('true', '1'))

        serializer = StudentClassListSerializer(qs.order_by('-created_at'), many=True)
        return Response({'count': qs.count(), 'results': serializer.data})

    def post(self, request):
        serializer = CreateStudentClassSerializer(data=request.data)
        if serializer.is_valid():
            class_obj = serializer.save()

            record_audit_log(
                action_type='CLASS_CREATE',
                description=f"Created class '{class_obj.name}' ({class_obj.code}) with {class_obj.labs.count()} labs.",
                request=request,
                actor=request.user,
                target_entity='StudentClass',
                target_id=class_obj.id,
                target_name=class_obj.name,
                severity='NOTICE',
                details={'code': class_obj.code, 'lab_count': class_obj.labs.count()}
            )
            return Response(StudentClassDetailSerializer(class_obj).data, status=status.HTTP_201_CREATED)

        errors = serializer.errors
        first_field = next(iter(errors))
        first_msg = errors[first_field]
        if isinstance(first_msg, list):
            first_msg = first_msg[0]
        return Response({'detail': str(first_msg), 'errors': errors}, status=status.HTTP_400_BAD_REQUEST)


class StudentClassDetailView(APIView):
    """
    GET    /api/classes/<pk>/  — Get class details (with assigned labs & students)
    PATCH  /api/classes/<pk>/  — Update class details
    DELETE /api/classes/<pk>/  — Delete class (unassigns students and sets their mode to unrestricted)
    """
    permission_classes = [IsAdminOrStaff]

    def get(self, request, pk):
        class_obj = get_object_or_404(StudentClass.objects.prefetch_related('labs', 'students'), pk=pk)
        return Response(StudentClassDetailSerializer(class_obj).data)

    def patch(self, request, pk):
        class_obj = get_object_or_404(StudentClass, pk=pk)
        name = request.data.get('name')
        if name is not None:
            clean_name = name.strip()
            if not clean_name:
                return Response({'detail': 'Class name cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)
            if StudentClass.objects.filter(name__iexact=clean_name).exclude(pk=pk).exists():
                return Response({'detail': f"A class named '{clean_name}' already exists."}, status=status.HTTP_400_BAD_REQUEST)
            class_obj.name = clean_name
        code = request.data.get('code')
        if code is not None:
            class_obj.code = code.strip()
        description = request.data.get('description')
        if description is not None:
            class_obj.description = description.strip()
        is_active = request.data.get('is_active')
        if is_active is not None:
            class_obj.is_active = bool(is_active)

        lab_ids = request.data.get('lab_ids')
        if lab_ids is not None:
            class_obj.labs.set(lab_ids)

        class_obj.save()

        record_audit_log(
            action_type='CLASS_UPDATE',
            description=f"Updated class '{class_obj.name}' ({class_obj.code}).",
            request=request,
            actor=request.user,
            target_entity='StudentClass',
            target_id=class_obj.id,
            target_name=class_obj.name,
            severity='NOTICE',
            details={'code': class_obj.code}
        )
        return Response(StudentClassDetailSerializer(class_obj).data)

    def delete(self, request, pk):
        class_obj = get_object_or_404(StudentClass, pk=pk)
        name = class_obj.name
        # Unassign students and return them to unrestricted access
        User.objects.filter(assigned_class=class_obj).update(assigned_class=None, lab_access_mode='unrestricted')
        class_obj.delete()

        record_audit_log(
            action_type='CLASS_DELETE',
            description=f"Deleted class '{name}'.",
            request=request,
            actor=request.user,
            target_entity='StudentClass',
            target_id=pk,
            target_name=name,
            severity='WARNING'
        )
        return Response({'message': f"Class '{name}' deleted successfully."}, status=status.HTTP_200_OK)


class StudentClassAssignLabsView(APIView):
    """
    POST /api/classes/<pk>/assign-labs/
    Assign or remove specific labs for a class.
    Body:
      - lab_ids: list of int IDs to replace all assigned labs
      - add_lab_ids: list of int IDs to append
      - remove_lab_ids: list of int IDs to remove
    """
    permission_classes = [IsAdminOrStaff]

    def post(self, request, pk):
        class_obj = get_object_or_404(StudentClass, pk=pk)
        lab_ids = request.data.get('lab_ids')
        add_lab_ids = request.data.get('add_lab_ids')
        remove_lab_ids = request.data.get('remove_lab_ids')

        if lab_ids is not None:
            class_obj.labs.set(lab_ids)
        if add_lab_ids:
            class_obj.labs.add(*add_lab_ids)
        if remove_lab_ids:
            class_obj.labs.remove(*remove_lab_ids)

        record_audit_log(
            action_type='CLASS_ASSIGN_LABS',
            description=f"Updated assigned labs for class '{class_obj.name}'. Total labs now: {class_obj.labs.count()}.",
            request=request,
            actor=request.user,
            target_entity='StudentClass',
            target_id=class_obj.id,
            target_name=class_obj.name,
            severity='NOTICE',
            details={'lab_count': class_obj.labs.count()}
        )
        return Response({
            'message': f"Labs updated for class '{class_obj.name}'.",
            'class': StudentClassDetailSerializer(class_obj).data
        })


class StudentClassAssignStudentsView(APIView):
    """
    POST /api/classes/<pk>/assign-students/
    Assign or remove students to/from a class.
    Body:
      - student_ids: list of student IDs
      - action: 'assign' | 'add' | 'remove' | 'set' (default 'assign')
      - access_mode: 'class_based' | 'unrestricted' (default 'class_based')
    """
    permission_classes = [IsAdminOrStaff]

    def post(self, request, pk):
        class_obj = get_object_or_404(StudentClass, pk=pk)
        student_ids = request.data.get('student_ids', [])
        action = request.data.get('action', 'assign')
        access_mode = request.data.get('access_mode', 'class_based')
        if access_mode not in ('class_based', 'unrestricted'):
            access_mode = 'class_based'

        if not isinstance(student_ids, list):
            return Response({'detail': 'student_ids must be a list of IDs.'}, status=status.HTTP_400_BAD_REQUEST)

        if action in ('assign', 'add'):
            updated_count = User.objects.filter(id__in=student_ids).update(
                assigned_class=class_obj,
                lab_access_mode=access_mode
            )
            msg = f"Assigned {updated_count} student(s) to class '{class_obj.name}' with access mode '{access_mode}'."
        elif action == 'remove':
            updated_count = User.objects.filter(id__in=student_ids, assigned_class=class_obj).update(
                assigned_class=None,
                lab_access_mode='unrestricted'
            )
            msg = f"Removed {updated_count} student(s) from class '{class_obj.name}'."
        elif action == 'set':
            # Unassign students not in list
            User.objects.filter(assigned_class=class_obj).exclude(id__in=student_ids).update(
                assigned_class=None,
                lab_access_mode='unrestricted'
            )
            # Assign students in list
            updated_count = User.objects.filter(id__in=student_ids).update(
                assigned_class=class_obj,
                lab_access_mode=access_mode
            )
            msg = f"Updated enrolled students for class '{class_obj.name}' ({updated_count} students)."
        else:
            return Response({'detail': f"Unsupported action '{action}'."}, status=status.HTTP_400_BAD_REQUEST)

        record_audit_log(
            action_type='CLASS_ASSIGN_STUDENTS',
            description=msg,
            request=request,
            actor=request.user,
            target_entity='StudentClass',
            target_id=class_obj.id,
            target_name=class_obj.name,
            severity='NOTICE',
            details={'action': action, 'student_count': class_obj.students.count()}
        )

        return Response({
            'message': msg,
            'class': StudentClassDetailSerializer(class_obj).data
        })


class StudentClassStudentsView(APIView):
    """
    GET  /api/classes/<pk>/students/ — List students enrolled in this class
    POST /api/classes/<pk>/students/ — Create a new student directly in this class
    """
    permission_classes = [IsAdminOrStaff]

    def get(self, request, pk):
        class_obj = get_object_or_404(StudentClass, pk=pk)
        students = class_obj.students.all().order_by('date_joined')
        return Response({
            'class_id': class_obj.id,
            'class_name': class_obj.name,
            'count': students.count(),
            'results': UserSerializer(students, many=True).data
        })

    def post(self, request, pk):
        class_obj = get_object_or_404(StudentClass, pk=pk)
        data = request.data.copy()
        data['assigned_class_id'] = class_obj.id
        if 'lab_access_mode' not in data:
            data['lab_access_mode'] = 'class_based'

        serializer = CreateStudentSerializer(data=data)
        if serializer.is_valid():
            student = serializer.save()
            name = student.get_full_name() or student.username
            record_audit_log(
                action_type='USER_CREATE',
                description=f"Created student '{name}' in class '{class_obj.name}'.",
                request=request,
                actor=request.user,
                target_entity='User',
                target_id=student.id,
                target_name=name,
                severity='NOTICE',
                details={'class': class_obj.name, 'username': student.username}
            )
            return Response({
                'message': f"Student '{name}' created and assigned to class '{class_obj.name}'.",
                'student': UserSerializer(student).data,
                'class': StudentClassDetailSerializer(class_obj).data
            }, status=status.HTTP_201_CREATED)

        errors = serializer.errors
        first_field = next(iter(errors))
        first_msg = errors[first_field]
        if isinstance(first_msg, list):
            first_msg = first_msg[0]
        return Response({'detail': str(first_msg), 'errors': errors}, status=status.HTTP_400_BAD_REQUEST)


class AdminSubjectLabAnalysisView(APIView):
    """
    GET /api/admin/subject-lab-analysis/
    Subject-based analysis view for Platform Admins and Instructors.
    Provides deep analysis of each instructor's added practical labs and questions,
    structured and aggregated by subject as well as by instructor.
    """
    permission_classes = [IsAdminOrStaff]

    def get(self, request):
        search = request.query_params.get('search', '').strip().lower()
        instructor_id = request.query_params.get('instructor_id')
        subject_id = request.query_params.get('subject_id')

        # 1. Fetch subjects
        subjects_qs = Subject.objects.prefetch_related(
            'labs__questions__hints',
            'labs__created_by'
        ).select_related('course').filter(is_active=True).order_by('name')

        # 2. Fetch instructors & admins who can create labs
        instructors_qs = User.objects.filter(user_type__in=['instructor', 'admin']).order_by('date_joined')

        # 3. Labs with questions & hints
        labs_qs = Lab.objects.prefetch_related(
            'questions__hints'
        ).select_related('subject', 'course', 'created_by').filter(is_active=True).order_by('-created_at')

        if instructor_id:
            labs_qs = labs_qs.filter(created_by_id=instructor_id)
        if subject_id:
            labs_qs = labs_qs.filter(subject_id=subject_id)

        # Subject-based Analysis Breakdown
        subject_analysis = []
        for subj in subjects_qs:
            if subject_id and str(subj.id) != str(subject_id):
                continue

            subj_labs = [l for l in labs_qs if l.subject_id == subj.id]
            if search:
                subj_labs = [
                    l for l in subj_labs
                    if search in l.name.lower()
                    or search in (l.description or '').lower()
                    or search in subj.name.lower()
                    or (l.created_by and search in (l.created_by.get_full_name() or l.created_by.username).lower())
                ]

            total_questions = sum(l.questions.count() for l in subj_labs)
            total_points = sum(l.points for l in subj_labs)

            # Aggregate by instructor within this subject
            instructor_groups = {}
            for lab in subj_labs:
                creator = lab.created_by
                c_id = creator.id if creator else 0
                c_name = (creator.get_full_name() or creator.username) if creator else (lab.org or "Platform Admin")
                c_role = getattr(creator, 'user_type', 'admin') if creator else 'admin'
                c_email = creator.email if creator else ''

                if c_id not in instructor_groups:
                    instructor_groups[c_id] = {
                        'instructor_id': c_id,
                        'instructor_name': c_name,
                        'instructor_email': c_email,
                        'instructor_role': c_role,
                        'labs_count': 0,
                        'questions_count': 0,
                        'points': 0,
                        'labs': []
                    }

                q_items = [
                    {
                        'id': q.id,
                        'title': q.title,
                        'description': q.description,
                        'points': q.points,
                        'has_flag': bool(q.flag),
                        'hints_count': q.hints.count()
                    }
                    for q in lab.questions.all()
                ]

                instructor_groups[c_id]['labs_count'] += 1
                instructor_groups[c_id]['questions_count'] += len(q_items)
                instructor_groups[c_id]['points'] += lab.points
                instructor_groups[c_id]['labs'].append({
                    'id': lab.id,
                    'name': lab.name,
                    'category': lab.category,
                    'difficulty': lab.difficulty,
                    'points': lab.points,
                    'created_at': lab.created_at,
                    'questions_count': len(q_items),
                    'questions': q_items
                })

            subject_analysis.append({
                'id': subj.id,
                'name': subj.name,
                'code': subj.code,
                'course_name': subj.course.name if subj.course else 'Standalone',
                'description': subj.description,
                'total_labs': len(subj_labs),
                'total_questions': total_questions,
                'total_points': total_points,
                'instructors': list(instructor_groups.values()),
            })

        # Instructor-based Analysis Breakdown
        instructor_analysis = []
        for inst in instructors_qs:
            if instructor_id and str(inst.id) != str(instructor_id):
                continue

            inst_labs = [l for l in labs_qs if l.created_by_id == inst.id]
            if search:
                inst_labs = [
                    l for l in inst_labs
                    if search in l.name.lower()
                    or search in (l.description or '').lower()
                    or (l.subject and search in l.subject.name.lower())
                ]

            total_inst_questions = sum(l.questions.count() for l in inst_labs)
            total_inst_points = sum(l.points for l in inst_labs)

            # Group instructor's labs by subject
            by_subj = {}
            for lab in inst_labs:
                s_id = lab.subject_id or 0
                s_name = lab.subject.name if lab.subject else 'Standalone / General Security'
                s_code = lab.subject.code if lab.subject else ''
                c_name = (lab.subject.course.name if lab.subject and lab.subject.course else (lab.course.name if lab.course else ''))

                if s_id not in by_subj:
                    by_subj[s_id] = {
                        'subject_id': s_id,
                        'subject_name': s_name,
                        'subject_code': s_code,
                        'course_name': c_name,
                        'labs_count': 0,
                        'questions_count': 0,
                        'points': 0,
                        'labs': []
                    }

                q_items = [
                    {
                        'id': q.id,
                        'title': q.title,
                        'points': q.points,
                        'has_flag': bool(q.flag),
                        'hints_count': q.hints.count()
                    }
                    for q in lab.questions.all()
                ]

                by_subj[s_id]['labs_count'] += 1
                by_subj[s_id]['questions_count'] += len(q_items)
                by_subj[s_id]['points'] += lab.points
                by_subj[s_id]['labs'].append({
                    'id': lab.id,
                    'name': lab.name,
                    'category': lab.category,
                    'difficulty': lab.difficulty,
                    'points': lab.points,
                    'questions_count': len(q_items),
                    'questions': q_items,
                    'created_at': lab.created_at
                })

            instructor_analysis.append({
                'id': inst.id,
                'name': inst.get_full_name() or inst.username,
                'username': inst.username,
                'email': inst.email,
                'role': inst.user_type,
                'date_joined': inst.date_joined,
                'total_labs': len(inst_labs),
                'total_questions': total_inst_questions,
                'total_points': total_inst_points,
                'subjects_count': len(by_subj),
                'subjects': list(by_subj.values()),
            })

        # Summary KPIs
        return Response({
            'summary': {
                'total_instructors': instructors_qs.filter(user_type='instructor').count(),
                'total_admins': instructors_qs.filter(user_type='admin').count(),
                'total_subjects': subjects_qs.count(),
                'total_labs': Lab.objects.filter(is_active=True).count(),
                'total_questions': LabQuestion.objects.filter(lab__is_active=True).count(),
            },
            'subject_analysis': subject_analysis,
            'instructor_analysis': instructor_analysis,
        })




