from django.urls import path

from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('admin-dashboard/', views.admin_dashboard, name='admin_dashboard'),
    path('materials/<int:pk>/', views.study_material_detail, name='study_material_detail'),
    path('labs/', views.lab_index, name='lab_index'),
    path('labs/<int:pk>/', views.lab_detail, name='lab_detail'),
    path('labs/<int:pk>/submit/', views.lab_submit, name='lab_submit'),
    path('labs/<int:pk>/reset/', views.lab_reset, name='lab_reset'),
]
