from django.contrib import admin
from .models import (
    Course, Enrollment, Lab, LabQuestion, QuestionHint,
    LabSubmission, LabScore, StudyMaterial
)


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
    list_display = ('name', 'category', 'difficulty', 'points', 'org', 'has_video', 'question_count', 'is_active', 'created_at')
    list_filter = ('category', 'difficulty', 'is_active')
    search_fields = ('name', 'description', 'org', 'video_url')
    inlines = [LabQuestionInline]

    @admin.display(boolean=True, description='Video')
    def has_video(self, obj):
        return bool(obj.video_url or obj.video_file)


@admin.register(LabSubmission)
class LabSubmissionAdmin(admin.ModelAdmin):
    list_display = ('student', 'lab', 'status', 'score', 'max_score', 'started_at', 'submitted_at', 'last_activity_at')
    list_filter = ('status', 'lab')
    search_fields = ('student__username', 'student__email', 'lab__name')
    raw_id_fields = ('student', 'lab')


@admin.register(LabScore)
class LabScoreAdmin(admin.ModelAdmin):
    list_display = ('student', 'lab', 'score', 'max_score', 'attend_count', 'is_completed', 'solved_questions_count', 'last_attended_at')
    list_filter = ('is_completed', 'lab')
    search_fields = ('student__username', 'student__email', 'lab__name')
    raw_id_fields = ('student', 'lab')


@admin.register(StudyMaterial)
class StudyMaterialAdmin(admin.ModelAdmin):
    list_display = ('title', 'subject', 'lab', 'file_type', 'file_size_bytes', 'is_active', 'created_at')
    list_filter = ('file_type', 'is_active', 'subject')
    search_fields = ('title', 'description', 'subject__name', 'lab__name')
    raw_id_fields = ('subject', 'lab', 'uploaded_by')

