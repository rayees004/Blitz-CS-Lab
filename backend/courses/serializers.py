from django.db import transaction
from rest_framework import serializers
from .models import (
    Course, Enrollment, Module, Subject, SubjectEnrollment,
    Lab, LabQuestion, QuestionHint, LabSubmission, LabScore
)


class ModuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Module
        fields = ['id', 'title', 'description', 'order', 'duration_hours', 'subject', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class SubjectSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True, default=None)
    module_count = serializers.SerializerMethodField()
    lab_count = serializers.SerializerMethodField()
    modules = ModuleSerializer(many=True, read_only=True)

    class Meta:
        model = Subject
        fields = [
            'id', 'name', 'code', 'description', 'course', 'course_name',
            'credits_or_hours', 'module_count', 'lab_count', 'modules', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_module_count(self, obj):
        return obj.modules.filter(is_active=True).count()

    def get_lab_count(self, obj):
        return obj.labs.filter(is_active=True).count()



class CreateSubjectSerializer(serializers.ModelSerializer):
    course_id = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.filter(is_active=True),
        source='course',
        required=False,
        allow_null=True
    )

    class Meta:
        model = Subject
        fields = ['name', 'code', 'description', 'course_id', 'credits_or_hours']

    def validate_name(self, value):
        val = value.strip()
        if not val:
            raise serializers.ValidationError('Subject name is required.')
        return val


class CourseSerializer(serializers.ModelSerializer):
    enrolled_count = serializers.IntegerField(read_only=True)
    module_count = serializers.SerializerMethodField()
    subject_count = serializers.SerializerMethodField()
    modules = ModuleSerializer(many=True, read_only=True)
    subjects = SubjectSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = [
            'id', 'name', 'description', 'price', 'duration_weeks',
            'is_active', 'enrolled_count', 'module_count', 'subject_count',
            'modules', 'subjects', 'created_at',
        ]
        read_only_fields = ['id', 'enrolled_count', 'module_count', 'subject_count', 'modules', 'subjects', 'created_at']

    def get_module_count(self, obj):
        return obj.modules.filter(is_active=True).count()

    def get_subject_count(self, obj):
        return obj.subjects.filter(is_active=True).count()


class CourseListSerializer(serializers.ModelSerializer):
    """Lighter serializer for listing — no nested modules."""
    enrolled_count = serializers.IntegerField(read_only=True)
    module_count = serializers.SerializerMethodField()
    subject_count = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = ['id', 'name', 'description', 'price', 'duration_weeks', 'is_active', 'enrolled_count', 'module_count', 'subject_count', 'created_at']
        read_only_fields = ['id', 'enrolled_count', 'module_count', 'subject_count', 'created_at']

    def get_module_count(self, obj):
        return obj.modules.filter(is_active=True).count()

    def get_subject_count(self, obj):
        return obj.subjects.filter(is_active=True).count()


class CreateCourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ['name', 'description', 'price', 'duration_weeks']

    def validate_name(self, value):
        if Course.objects.filter(name__iexact=value.strip()).exists():
            raise serializers.ValidationError('A class with this name already exists.')
        return value.strip()


class EnrollmentCourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ['id', 'name', 'price', 'duration_weeks']


class EnrollmentSerializer(serializers.ModelSerializer):
    course = EnrollmentCourseSerializer(read_only=True)
    student_username = serializers.CharField(source='student.username', read_only=True)
    student_full_name = serializers.SerializerMethodField()
    fee_status_display = serializers.CharField(source='get_fee_status_display', read_only=True)

    class Meta:
        model = Enrollment
        fields = [
            'id', 'student', 'student_username', 'student_full_name',
            'course', 'fee_status', 'fee_status_display',
            'is_on_hold', 'hold_reason', 'is_active',
            'enrolled_at', 'updated_at', 'notes',
        ]
        read_only_fields = ['id', 'enrolled_at', 'updated_at']

    def get_student_full_name(self, obj):
        name = f"{obj.student.first_name} {obj.student.last_name}".strip()
        return name or obj.student.username


class EnrollCreateSerializer(serializers.Serializer):
    course_id = serializers.PrimaryKeyRelatedField(queryset=Course.objects.filter(is_active=True))
    fee_status = serializers.ChoiceField(choices=Enrollment.FEE_STATUS_CHOICES, default='DUE')
    notes = serializers.CharField(required=False, allow_blank=True, default='')

    def validate(self, attrs):
        student = self.context.get('student')
        course = attrs['course_id']
        if Enrollment.objects.filter(student=student, course=course).exists():
            raise serializers.ValidationError(f'Student is already enrolled in "{course.name}".')
        return attrs

    def create(self, validated_data):
        student = self.context['student']
        course = validated_data['course_id']
        return Enrollment.objects.create(
            student=student, course=course,
            fee_status=validated_data.get('fee_status', 'DUE'),
            notes=validated_data.get('notes', ''),
        )


class EnrollmentUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Enrollment
        fields = ['fee_status', 'is_on_hold', 'hold_reason', 'notes', 'is_active']


class SubjectEnrollmentSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(source='student.username', read_only=True)
    student_full_name = serializers.SerializerMethodField()
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    credits_or_hours = serializers.IntegerField(source='subject.credits_or_hours', read_only=True)
    course_name = serializers.CharField(source='subject.course.name', read_only=True, default=None)

    class Meta:
        model = SubjectEnrollment
        fields = [
            'id', 'student', 'student_username', 'student_full_name',
            'subject', 'subject_name', 'subject_code', 'credits_or_hours',
            'course_name', 'is_active', 'enrolled_at', 'updated_at',
        ]
        read_only_fields = ['id', 'enrolled_at', 'updated_at']

    def get_student_full_name(self, obj):
        name = f"{obj.student.first_name} {obj.student.last_name}".strip()
        return name or obj.student.username


class QuestionHintSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

    class Meta:
        model = QuestionHint
        fields = ['id', 'hint_text', 'cost', 'order']


class LabQuestionSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    hints = QuestionHintSerializer(many=True, required=False, default=list)

    class Meta:
        model = LabQuestion
        fields = ['id', 'title', 'description', 'flag', 'points', 'order', 'hints']


class LabSerializer(serializers.ModelSerializer):
    questions = LabQuestionSerializer(many=True, required=False, default=list)
    question_count = serializers.IntegerField(read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True, default=None)
    course_name = serializers.CharField(source='course.name', read_only=True, default=None)
    subject_id = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.all(), source='subject', required=False, allow_null=True
    )
    course_id = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.all(), source='course', required=False, allow_null=True
    )

    class Meta:
        model = Lab
        fields = [
            'id', 'name', 'description', 'org', 'category', 'difficulty',
            'points', 'target_url', 'video_url', 'video_file', 'course', 'course_name', 'course_id',
            'subject', 'subject_name', 'subject_id', 'is_active',
            'question_count', 'questions', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'question_count', 'course_name', 'subject_name']


    def validate_name(self, value):
        val = value.strip()
        if not val:
            raise serializers.ValidationError('Lab name is required.')
        return val

    def create(self, validated_data):
        questions_data = validated_data.pop('questions', [])
        with transaction.atomic():
            lab = Lab.objects.create(**validated_data)
            for q_idx, q_data in enumerate(questions_data):
                hints_data = q_data.pop('hints', [])
                q_data.pop('id', None)
                q_data['order'] = q_data.get('order', q_idx)
                question = LabQuestion.objects.create(lab=lab, **q_data)
                for h_idx, h_data in enumerate(hints_data):
                    h_data.pop('id', None)
                    h_data['order'] = h_data.get('order', h_idx)
                    QuestionHint.objects.create(question=question, **h_data)
            return lab

    def update(self, instance, validated_data):
        questions_data = validated_data.pop('questions', None)
        with transaction.atomic():
            for attr, val in validated_data.items():
                setattr(instance, attr, val)
            instance.save()

            if questions_data is not None:
                instance.questions.all().delete()
                for q_idx, q_data in enumerate(questions_data):
                    hints_data = q_data.pop('hints', [])
                    q_data.pop('id', None)
                    q_data['order'] = q_data.get('order', q_idx)
                    question = LabQuestion.objects.create(lab=instance, **q_data)
                    for h_idx, h_data in enumerate(hints_data):
                        h_data.pop('id', None)
                        h_data['order'] = h_data.get('order', h_idx)
                        QuestionHint.objects.create(question=question, **h_data)

            return instance


class LabSubmissionSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(source='student.username', read_only=True)
    student_name = serializers.SerializerMethodField()
    lab_name = serializers.CharField(source='lab.name', read_only=True)

    class Meta:
        model = LabSubmission
        fields = [
            'id', 'student', 'student_username', 'student_name', 'lab', 'lab_name',
            'status', 'score', 'max_score', 'answers',
            'started_at', 'submitted_at', 'last_activity_at'
        ]
        read_only_fields = ['id', 'started_at', 'last_activity_at']

    def get_student_name(self, obj):
        full = f"{obj.student.first_name} {obj.student.last_name}".strip()
        return full or obj.student.username


class LabScoreSerializer(serializers.ModelSerializer):
    lab_id = serializers.IntegerField(source='lab.id', read_only=True)
    lab_name = serializers.CharField(source='lab.name', read_only=True)
    lab_category = serializers.CharField(source='lab.category', read_only=True)
    lab_difficulty = serializers.CharField(source='lab.difficulty', read_only=True)
    subject_name = serializers.CharField(source='lab.subject.name', read_only=True, default=None)
    student_username = serializers.CharField(source='student.username', read_only=True)

    class Meta:
        model = LabScore
        fields = [
            'id', 'student', 'student_username', 'lab', 'lab_id', 'lab_name',
            'lab_category', 'lab_difficulty', 'subject_name',
            'score', 'max_score', 'attend_count', 'is_completed',
            'solved_questions_count', 'total_questions_count',
            'first_attended_at', 'last_attended_at', 'completed_at'
        ]
        read_only_fields = ['id', 'first_attended_at', 'last_attended_at']

