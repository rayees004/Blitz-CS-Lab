from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework.authtoken.models import Token
from .models import User


class UserSerializer(serializers.ModelSerializer):
    is_admin = serializers.BooleanField(read_only=True)
    full_name = serializers.SerializerMethodField()

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
        ]
        read_only_fields = ['id', 'is_admin', 'full_name', 'date_joined']

    def get_full_name(self, obj):
        name = f"{obj.first_name} {obj.last_name}".strip()
        return name or obj.username


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
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.user_type = 'student'
        user.set_password(password)
        user.save()
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
