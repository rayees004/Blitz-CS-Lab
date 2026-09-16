from rest_framework import serializers
from .models import Course, Enrollment, Module, Subject


class ModuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Module
        fields = ['id', 'title', 'description', 'order', 'duration_hours', 'subject', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class SubjectSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True, default=None)
    module_count = serializers.SerializerMethodField()

    class Meta:
        model = Subject
        fields = [
            'id', 'name', 'code', 'description', 'course', 'course_name',
            'credits_or_hours', 'module_count', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_module_count(self, obj):
        return obj.modules.filter(is_active=True).count()


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
