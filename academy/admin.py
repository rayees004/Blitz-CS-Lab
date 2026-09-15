from django.contrib import admin

from .models import (
    AcademyClass,
    AuditLog,
    Badge,
    Certificate,
    Course,
    Lab,
    LabAssignment,
    LabAttempt,
    LabSession,
    Student,
    StudentBadge,
    StudentProgress,
    StudyMaterial,
    User,
)


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'role', 'is_staff', 'is_active')
    list_filter = ('role', 'is_staff', 'is_active')


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')


@admin.register(AcademyClass)
class AcademyClassAdmin(admin.ModelAdmin):
    list_display = ('class_id', 'name', 'batch_name', 'course', 'status')
    list_filter = ('status', 'course')


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('student_id', 'full_name', 'academy_class', 'fee_status', 'lab_access', 'account_status')
    list_filter = ('fee_status', 'lab_access', 'account_status', 'academy_class')


@admin.register(Lab)
class LabAdmin(admin.ModelAdmin):
    list_display = ('lab_id', 'name', 'difficulty', 'category', 'points', 'status', 'is_active')
    list_filter = ('difficulty', 'category', 'status', 'is_active')


@admin.register(LabAssignment)
class LabAssignmentAdmin(admin.ModelAdmin):
    list_display = ('student', 'lab', 'academy_class', 'enabled', 'access_expires')


@admin.register(StudyMaterial)
class StudyMaterialAdmin(admin.ModelAdmin):
    list_display = ('title', 'academy_class', 'course', 'category', 'visibility', 'is_published')
    list_filter = ('course', 'academy_class', 'category', 'visibility', 'is_published')


@admin.register(LabSession)
class LabSessionAdmin(admin.ModelAdmin):
    list_display = ('student', 'lab', 'started_at', 'expired_at', 'is_active')


@admin.register(LabAttempt)
class LabAttemptAdmin(admin.ModelAdmin):
    list_display = ('student', 'lab', 'status', 'submitted_at')


@admin.register(StudentProgress)
class StudentProgressAdmin(admin.ModelAdmin):
    list_display = ('student', 'lab', 'completed', 'points_earned', 'attempts')


@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'points_required')


@admin.register(StudentBadge)
class StudentBadgeAdmin(admin.ModelAdmin):
    list_display = ('student', 'badge', 'awarded_at')


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ('student', 'course', 'issued_at', 'is_active')


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'actor', 'action', 'target', 'result')
    list_filter = ('action', 'result')
