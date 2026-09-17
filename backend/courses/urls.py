from django.urls import path
from .views import (
    CourseListCreateView,
    CourseDetailView,
    CourseModulesView,
    ModuleDetailView,
    SubjectListCreateView,
    SubjectDetailView,
    SubjectModulesView,
    CourseSubjectsView,
    StudentEnrollmentsView,
    EnrollmentDetailView,
    LabListCreateView,
    LabDetailView,
)

urlpatterns = [
    # Labs, Questions & Hints
    path('labs/', LabListCreateView.as_view(), name='api_labs'),
    path('labs/<int:pk>/', LabDetailView.as_view(), name='api_lab_detail'),

    # Classes (Courses)
    path('courses/', CourseListCreateView.as_view(), name='api_courses'),
    path('courses/<int:pk>/', CourseDetailView.as_view(), name='api_course_detail'),
    path('courses/<int:pk>/modules/', CourseModulesView.as_view(), name='api_course_modules'),
    path('courses/<int:pk>/subjects/', CourseSubjectsView.as_view(), name='api_course_subjects'),

    # Modules
    path('modules/<int:pk>/', ModuleDetailView.as_view(), name='api_module_detail'),

    # Subjects
    path('subjects/', SubjectListCreateView.as_view(), name='api_subjects'),
    path('subjects/<int:pk>/', SubjectDetailView.as_view(), name='api_subject_detail'),
    path('subjects/<int:pk>/modules/', SubjectModulesView.as_view(), name='api_subject_modules'),

    # Student enrollments
    path('students/<int:pk>/enrollments/', StudentEnrollmentsView.as_view(), name='api_student_enrollments'),
    path('enrollments/<int:pk>/', EnrollmentDetailView.as_view(), name='api_enrollment_detail'),
]
