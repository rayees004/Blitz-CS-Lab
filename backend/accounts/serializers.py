from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework.authtoken.models import Token
from .models import User


class UserSerializer(serializers.ModelSerializer):
    is_admin = serializers.BooleanField(read_only=True)
    full_name = serializers.SerializerMethodField()
    enrolled_courses = serializers.SerializerMethodField()
    courses_count = serializers.SerializerMethodField()
    enrolled_subjects = serializers.SerializerMethodField()
    subjects_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'user_type',
            'is_admin',
            'organization',
            'phone_number',
            'is_active',
            'date_joined',
            'enrolled_courses',
            'courses_count',
            'enrolled_subjects',
            'subjects_count',
        ]
        read_only_fields = [
            'id', 'is_admin', 'full_name', 'date_joined',
            'enrolled_courses', 'courses_count',
            'enrolled_subjects', 'subjects_count'
        ]

    def get_full_name(self, obj):
        name = f"{obj.first_name} {obj.last_name}".strip()
        return name or obj.username

    def get_enrolled_courses(self, obj):
        if obj.user_type != 'student':
            return []
        from courses.models import Enrollment
        enrollments = Enrollment.objects.filter(student=obj, is_active=True).select_related('course')
        return [
            {
                'id': e.course.id,
                'enrollment_id': e.id,
                'name': e.course.name,
                'price': float(e.course.price),
                'duration_weeks': e.course.duration_weeks,
                'fee_status': e.fee_status,
                'fee_status_display': e.get_fee_status_display(),
                'is_on_hold': e.is_on_hold,
                'hold_reason': e.hold_reason,
                'enrolled_at': e.enrolled_at,
            }
            for e in enrollments
        ]

    def get_courses_count(self, obj):
        if obj.user_type != 'student':
            return 0
        from courses.models import Enrollment
        return Enrollment.objects.filter(student=obj, is_active=True).count()

    def get_enrolled_subjects(self, obj):
        if obj.user_type != 'student':
            return []
        from courses.models import SubjectEnrollment
        enrollments = SubjectEnrollment.objects.filter(student=obj, is_active=True).select_related('subject', 'subject__course')
        return [
            {
                'id': e.subject.id,
                'enrollment_id': e.id,
                'name': e.subject.name,
                'code': e.subject.code,
                'credits_or_hours': e.subject.credits_or_hours,
                'course_id': e.subject.course_id if e.subject else None,
                'course_name': e.subject.course.name if e.subject and e.subject.course else None,
                'enrolled_at': e.enrolled_at,
                'is_active': e.is_active,
            }
            for e in enrollments
        ]

    def get_subjects_count(self, obj):
        if obj.user_type != 'student':
            return 0
        from courses.models import SubjectEnrollment
        return SubjectEnrollment.objects.filter(student=obj, is_active=True).count()


class CreateStudentSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
    )
    confirm_password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
    )
    email = serializers.EmailField(required=True)
    first_name = serializers.CharField(required=True, max_length=50)
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=50)
    course_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        write_only=True,
        default=list
    )
    subject_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        write_only=True,
        default=list
    )

    class Meta:
        model = User
        fields = [
            'username',
            'email',
            'first_name',
            'last_name',
            'phone_number',
            'organization',
            'password',
            'confirm_password',
            'course_ids',
            'subject_ids',
        ]

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value.lower()

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError('This username is already taken.')
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        try:
            validate_password(attrs['password'])
        except Exception as e:
            raise serializers.ValidationError({'password': list(e.messages)})
        return attrs

    def create(self, validated_data):
        course_ids = validated_data.pop('course_ids', [])
        subject_ids = validated_data.pop('subject_ids', [])
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.user_type = 'student'
        user.set_password(password)
        user.save()

        if subject_ids:
            from courses.models import Subject, SubjectEnrollment
            valid_subjects = Subject.objects.filter(id__in=subject_ids, is_active=True)
            for sub in valid_subjects:
                SubjectEnrollment.objects.get_or_create(
                    student=user,
                    subject=sub,
                    defaults={'is_active': True}
                )

        if course_ids:
            from courses.models import Course, Enrollment
            valid_courses = Course.objects.filter(id__in=course_ids, is_active=True)
            for course in valid_courses:
                Enrollment.objects.get_or_create(
                    student=user,
                    course=course,
                    defaults={'fee_status': 'DUE', 'is_active': True}
                )
        return user


class UpdateStudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'phone_number', 'organization', 'is_active']


class LoginSerializer(serializers.Serializer):
    email = serializers.CharField(required=False, allow_blank=True)
    username = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    def validate(self, attrs):
        email_or_username = attrs.get('email') or attrs.get('username')
        password = attrs.get('password')

        if not email_or_username or not password:
            raise serializers.ValidationError('Both email/username and password are required.')

        user = None

        # Check if login with email
        if '@' in email_or_username:
            try:
                user_obj = User.objects.get(email__iexact=email_or_username.strip())
                user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                user = None
            except User.MultipleObjectsReturned:
                user_obj = User.objects.filter(email__iexact=email_or_username.strip()).first()
                if user_obj:
                    user = authenticate(username=user_obj.username, password=password)

        # If not matched or no '@', authenticate with username directly
        if user is None:
            user = authenticate(username=email_or_username.strip(), password=password)

        if not user:
            raise serializers.ValidationError('Invalid credentials. Please check your email/username and password.')

        if not user.is_active:
            raise serializers.ValidationError('This user account is inactive.')

        token, _ = Token.objects.get_or_create(user=user)

        return {
            'user': user,
            'token': token.key,
        }


class AuditLogSerializer(serializers.ModelSerializer):
    timestamp_formatted = serializers.SerializerMethodField()
    actor_display = serializers.SerializerMethodField()
    action_type_display = serializers.CharField(source='get_action_type_display', read_only=True)

    class Meta:
        from .models import AuditLog
        model = AuditLog
        fields = [
            'id',
            'actor',
            'actor_username',
            'actor_email',
            'actor_role',
            'actor_display',
            'action_type',
            'action_type_display',
            'severity',
            'target_entity',
            'target_id',
            'target_name',
            'description',
            'details',
            'ip_address',
            'user_agent',
            'timestamp',
            'timestamp_formatted',
        ]

    def get_timestamp_formatted(self, obj):
        return obj.timestamp.strftime('%b %d, %Y • %H:%M:%S')

    def get_actor_display(self, obj):
        if obj.actor:
            name = obj.actor.get_full_name()
            if name:
                return f"{name} (@{obj.actor.username})"
            return f"@{obj.actor.username}"
        return obj.actor_username or 'System'

