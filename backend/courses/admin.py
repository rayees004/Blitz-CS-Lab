from django.contrib import admin
from .models import Course, Enrollment


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'duration_weeks', 'is_active', 'enrolled_count', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name',)


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('student', 'course', 'fee_status', 'is_on_hold', 'is_active', 'enrolled_at')
    list_filter = ('fee_status', 'is_on_hold', 'is_active', 'course')
    search_fields = ('student__username', 'student__email', 'course__name')
    raw_id_fields = ('student', 'course')
