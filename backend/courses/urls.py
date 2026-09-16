from django.urls import path
from .views import (
    CourseListCreateView,
    CourseDetailView,
    CourseModulesView,
    ModuleDetailView,
    StudentEnrollmentsView,
    EnrollmentDetailView,
)

urlpatterns = [
    # Classes (Courses)
    path('courses/', CourseListCreateView.as_view(), name='api_courses'),
    path('courses/<int:pk>/', CourseDetailView.as_view(), name='api_course_detail'),
    path('courses/<int:pk>/modules/', CourseModulesView.as_view(), name='api_course_modules'),

    # Modules
    path('modules/<int:pk>/', ModuleDetailView.as_view(), name='api_module_detail'),

    # Student enrollments
    path('students/<int:pk>/enrollments/', StudentEnrollmentsView.as_view(), name='api_student_enrollments'),
    path('enrollments/<int:pk>/', EnrollmentDetailView.as_view(), name='api_enrollment_detail'),
]
