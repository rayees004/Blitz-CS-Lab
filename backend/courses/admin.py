from django.contrib import admin
from .models import Course, Enrollment, Lab, LabQuestion, QuestionHint


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


class QuestionHintInline(admin.TabularInline):
    model = QuestionHint
    extra = 1


@admin.register(LabQuestion)
class LabQuestionAdmin(admin.ModelAdmin):
    list_display = ('title', 'lab', 'points', 'order', 'hint_count', 'created_at')
    list_filter = ('lab',)
    search_fields = ('title', 'lab__name')
    inlines = [QuestionHintInline]


class LabQuestionInline(admin.StackedInline):
    model = LabQuestion
    extra = 1


@admin.register(Lab)
class LabAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'difficulty', 'points', 'org', 'question_count', 'is_active', 'created_at')
    list_filter = ('category', 'difficulty', 'is_active')
    search_fields = ('name', 'description', 'org')
    inlines = [LabQuestionInline]

