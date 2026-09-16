from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from accounts.models import User
from accounts.views import IsAdminOrStaff
from .models import Course, Enrollment, Module
from .serializers import (
    CourseSerializer,
    CourseListSerializer,
    CreateCourseSerializer,
    ModuleSerializer,
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
        courses = Course.objects.prefetch_related('modules', 'enrollments').filter(is_active=True)
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

        # Auto-assign order as next available
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        if 'order' not in data or not data.get('order'):
            last = course.modules.order_by('-order').first()
            data['order'] = (last.order + 1) if last else 1

        serializer = ModuleSerializer(data=data)
        if serializer.is_valid():
            module = serializer.save(course=course)
            return Response({
                'message': f'Module "{module.title}" added to "{course.name}".',
                'module': ModuleSerializer(module).data,
            }, status=status.HTTP_201_CREATED)

        errors = serializer.errors
        first_key = next(iter(errors))
        first_msg = errors[first_key]
        if isinstance(first_msg, list):
            first_msg = first_msg[0]
        return Response({'detail': str(first_msg), 'errors': errors}, status=status.HTTP_400_BAD_REQUEST)


class ModuleDetailView(APIView):
    """
    PATCH  /api/modules/<id>/  — update a module
    DELETE /api/modules/<id>/  — delete a module
    """
    permission_classes = [IsAdminOrStaff]

    def patch(self, request, pk):
        module = get_object_or_404(Module, pk=pk)
        serializer = ModuleSerializer(module, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Module updated.',
                'module': ModuleSerializer(module).data,
            })
        return Response({'detail': 'Update failed.', 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        module = get_object_or_404(Module, pk=pk)
        title = module.title
        module.delete()
        return Response({'message': f'Module "{title}" deleted.'})


class StudentEnrollmentsView(APIView):
    """
    GET  /api/students/<id>/enrollments/  — list enrollments for a student
    POST /api/students/<id>/enrollments/  — enroll student in a course
    """
    permission_classes = [IsAdminOrStaff]

    def get_student(self, pk):
        return get_object_or_404(User, pk=pk, user_type='student')

    def get(self, request, pk):
        student = self.get_student(pk)
        enrollments = Enrollment.objects.filter(student=student).select_related('course')
        serializer = EnrollmentSerializer(enrollments, many=True)
        return Response({
            'student_id': student.id,
            'student_name': student.get_full_name() or student.username,
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
