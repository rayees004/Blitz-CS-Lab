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
    StudentBulkEnrollView,
    StudentBulkAssignSubjectsView,
    StudentSubjectEnrollmentsView,
    EnrollmentDetailView,
    LabListCreateView,
    LabDetailView,
    SubjectLabsView,
    SeedLabsView,
    StudentLabListView,
    StudentLabAttendView,
    StudentLabSubmitMarkView,
    StudentLabScoreListView,
    LabSubmissionListView,
    StudyMaterialListCreateView,
    StudyMaterialDetailView,
    StudentMaterialsView,
)

urlpatterns = [
    # Student Labs & Attend / Submit Marks
    path('student/labs/', StudentLabListView.as_view(), name='api_student_labs'),
    path('student/lab-scores/', StudentLabScoreListView.as_view(), name='api_student_lab_scores'),
    path('student/labs/<int:pk>/attend/', StudentLabAttendView.as_view(), name='api_student_lab_attend'),
    path('student/labs/<int:pk>/submit/', StudentLabSubmitMarkView.as_view(), name='api_student_lab_submit'),
    path('lab-submissions/', LabSubmissionListView.as_view(), name='api_lab_submissions'),

    # Labs, Questions & Hints
    path('labs/', LabListCreateView.as_view(), name='api_labs'),
    path('labs/seed/', SeedLabsView.as_view(), name='api_labs_seed'),
    path('labs/<int:pk>/', LabDetailView.as_view(), name='api_lab_detail'),
    path('subjects/<int:pk>/labs/', SubjectLabsView.as_view(), name='api_subject_labs'),

    # Study Materials (Subject-based with optional Lab)
    path('materials/', StudyMaterialListCreateView.as_view(), name='api_materials'),
    path('materials/<int:pk>/', StudyMaterialDetailView.as_view(), name='api_material_detail'),
    path('student/materials/', StudentMaterialsView.as_view(), name='api_student_materials'),



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

    # Student enrollments & Subject assignments
    path('students/<int:pk>/enrollments/', StudentEnrollmentsView.as_view(), name='api_student_enrollments'),
    path('students/<int:pk>/assign-courses/', StudentBulkEnrollView.as_view(), name='api_student_bulk_enroll'),
    path('students/<int:pk>/assign-subjects/', StudentBulkAssignSubjectsView.as_view(), name='api_student_bulk_assign_subjects'),
    path('students/<int:pk>/subjects/', StudentSubjectEnrollmentsView.as_view(), name='api_student_subjects'),
    path('enrollments/<int:pk>/', EnrollmentDetailView.as_view(), name='api_enrollment_detail'),
]
