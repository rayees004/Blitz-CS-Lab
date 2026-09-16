from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from accounts.models import User
from accounts.views import IsAdminOrStaff
from .models import Course, Enrollment, Module, Subject
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
