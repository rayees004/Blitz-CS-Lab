from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from accounts.models import User
from accounts.views import IsAdminOrStaff
from .models import Course, Enrollment
from .serializers import (
    CourseSerializer,
    EnrollmentSerializer,
    EnrollCreateSerializer,
    EnrollmentUpdateSerializer,
)


class CourseListCreateView(APIView):
    """GET /api/courses/  POST /api/courses/"""
    permission_classes = [IsAdminOrStaff]

    def get(self, request):
        courses = Course.objects.filter(is_active=True)
        serializer = CourseSerializer(courses, many=True)
        return Response({'count': courses.count(), 'results': serializer.data})

    def post(self, request):
        serializer = CourseSerializer(data=request.data)
        if serializer.is_valid():
            course = serializer.save()
            return Response(CourseSerializer(course).data, status=status.HTTP_201_CREATED)
        return Response({'detail': 'Invalid data.', 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class StudentEnrollmentsView(APIView):
    """
    GET  /api/students/<id>/enrollments/   – list enrollments for a student
    POST /api/students/<id>/enrollments/   – enroll student in a course
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
    """PATCH /api/enrollments/<id>/   – update fee_status, hold, notes"""
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
