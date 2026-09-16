from rest_framework import serializers
from .models import Course, Enrollment


class CourseSerializer(serializers.ModelSerializer):
    enrolled_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Course
        fields = ['id', 'name', 'description', 'price', 'duration_weeks', 'is_active', 'enrolled_count', 'created_at']
        read_only_fields = ['id', 'enrolled_count', 'created_at']


class EnrollmentCourseSerializer(serializers.ModelSerializer):
    """Minimal course info embedded in enrollment responses."""
    class Meta:
        model = Course
        fields = ['id', 'name', 'price', 'duration_weeks']


class EnrollmentSerializer(serializers.ModelSerializer):
    course = EnrollmentCourseSerializer(read_only=True)
    course_id = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.filter(is_active=True),
        source='course',
        write_only=True,
    )
    student_name = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = [
            'id',
            'student_name',
            'course',
            'course_id',
            'fee_status',
            'is_on_hold',
            'hold_reason',
            'is_active',
            'enrolled_at',
            'updated_at',
            'notes',
        ]
        read_only_fields = ['id', 'student_name', 'enrolled_at', 'updated_at']

    def get_student_name(self, obj):
        name = f"{obj.student.first_name} {obj.student.last_name}".strip()
        return name or obj.student.username


class EnrollCreateSerializer(serializers.Serializer):
    course_id = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.filter(is_active=True),
    )
    fee_status = serializers.ChoiceField(
        choices=Enrollment.FEE_STATUS_CHOICES,
        default='DUE',
    )
    notes = serializers.CharField(required=False, allow_blank=True, default='')

    def validate(self, attrs):
        student = self.context.get('student')
        course = attrs['course_id']
        if Enrollment.objects.filter(student=student, course=course).exists():
            raise serializers.ValidationError(
                f'Student is already enrolled in "{course.name}".'
            )
        return attrs

    def create(self, validated_data):
        student = self.context['student']
        course = validated_data['course_id']
        return Enrollment.objects.create(
            student=student,
            course=course,
            fee_status=validated_data.get('fee_status', 'DUE'),
            notes=validated_data.get('notes', ''),
        )


class EnrollmentUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Enrollment
        fields = ['fee_status', 'is_on_hold', 'hold_reason', 'notes', 'is_active']
