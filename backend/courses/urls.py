from django.urls import path
from .views import CourseListCreateView, StudentEnrollmentsView, EnrollmentDetailView

urlpatterns = [
    path('courses/', CourseListCreateView.as_view(), name='api_courses'),
    path('students/<int:pk>/enrollments/', StudentEnrollmentsView.as_view(), name='api_student_enrollments'),
    path('enrollments/<int:pk>/', EnrollmentDetailView.as_view(), name='api_enrollment_detail'),
]
