from django.urls import path
from .views import (
    LoginView,
    CurrentUserView,
    LogoutView,
    StudentListCreateView,
    StudentDetailView,
)

urlpatterns = [
    path('login/', LoginView.as_view(), name='api_login'),
    path('me/', CurrentUserView.as_view(), name='api_current_user'),
    path('logout/', LogoutView.as_view(), name='api_logout'),
    path('students/', StudentListCreateView.as_view(), name='api_students'),
    path('students/<int:pk>/', StudentDetailView.as_view(), name='api_student_detail'),
]
