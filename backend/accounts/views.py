from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.authtoken.models import Token
from django.shortcuts import get_object_or_404
from .models import User, AuditLog
from .serializers import (
    LoginSerializer,
    UserSerializer,
    CreateStudentSerializer,
    UpdateStudentSerializer,
    AuditLogSerializer,
)
from .audit import record_audit_log
from django.db.models import Q


class IsAdminOrStaff(IsAuthenticated):
    """Custom permission: user must be authenticated and have admin/staff user_type."""
    def has_permission(self, request, view):
        return (
            super().has_permission(request, view)
            and (request.user.is_staff or request.user.is_superuser or request.user.user_type == 'admin')
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            token = serializer.validated_data['token']
            user_data = UserSerializer(user).data

            record_audit_log(
                action_type='AUTH_LOGIN',
                description=f"User '{user.username}' logged in.",
                request=request,
                actor=user,
                target_entity='User',
                target_id=user.id,
                target_name=user.username,
                severity='INFO'
            )

            return Response({
                'token': token,
                'user': user_data,
                'user_type': user_data['user_type'],
                'message': 'Login successful'
            }, status=status.HTTP_200_OK)

        # Flatten errors for user-friendly display
        errors = serializer.errors
        error_msg = 'Authentication failed.'
        if 'non_field_errors' in errors and errors['non_field_errors']:
            error_msg = errors['non_field_errors'][0]
        elif 'detail' in errors:
            error_msg = errors['detail']

        return Response({
            'detail': error_msg,
            'errors': errors
        }, status=status.HTTP_400_BAD_REQUEST)


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response({
            'user': serializer.data,
            'user_type': serializer.data['user_type']
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        record_audit_log(
            action_type='AUTH_LOGOUT',
            description=f"User '{request.user.username}' logged out.",
            request=request,
            actor=request.user,
            target_entity='User',
            target_id=request.user.id,
            target_name=request.user.username,
            severity='INFO'
        )

        try:
            token = Token.objects.get(user=request.user)
            token.delete()
        except Token.DoesNotExist:
            pass

        return Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)



class StudentListCreateView(APIView):
    """
    GET  /api/students/      - List all students (admin only)
    POST /api/students/      - Create a new student (admin only)
    """
    permission_classes = [IsAdminOrStaff]

    def get(self, request):
        search = request.query_params.get('search', '').strip()
        students = User.objects.filter(user_type='student').order_by('date_joined')

        if search:
            from django.db.models import Q
            students = students.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(username__icontains=search)
            )

        serializer = UserSerializer(students, many=True)
        return Response({
            'count': students.count(),
            'results': serializer.data,
        }, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = CreateStudentSerializer(data=request.data)
        if serializer.is_valid():
            student = serializer.save()
            name = student.get_full_name() or student.username

            record_audit_log(
                action_type='USER_CREATE',
                description=f"Created student account '{name}' (@{student.username}).",
                request=request,
                actor=request.user,
                target_entity='User',
                target_id=student.id,
                target_name=name,
                severity='NOTICE',
                details={'username': student.username, 'email': student.email}
            )

            return Response({
                'message': f'Student "{name}" created successfully.',
                'student': UserSerializer(student).data,
            }, status=status.HTTP_201_CREATED)

        # Flatten first error for UI display
        errors = serializer.errors
        first_field = next(iter(errors))
        first_msg = errors[first_field]
        if isinstance(first_msg, list):
            first_msg = first_msg[0]
        if isinstance(first_msg, dict):
            sub_field = next(iter(first_msg))
            first_msg = first_msg[sub_field]
            if isinstance(first_msg, list):
                first_msg = first_msg[0]

        return Response({
            'detail': str(first_msg),
            'errors': errors,
        }, status=status.HTTP_400_BAD_REQUEST)


class StudentDetailView(APIView):
    """
    GET    /api/students/<id>/  - Get a single student
    PATCH  /api/students/<id>/  - Update a student
    DELETE /api/students/<id>/  - Delete (deactivate) a student
    """
    permission_classes = [IsAdminOrStaff]

    def get_student(self, pk):
        return get_object_or_404(User, pk=pk, user_type='student')

    def get(self, request, pk):
        student = self.get_student(pk)
        return Response(UserSerializer(student).data)

    def patch(self, request, pk):
        student = self.get_student(pk)
        serializer = UpdateStudentSerializer(student, data=request.data, partial=True)
        if serializer.is_valid():
            updated = serializer.save()
            name = updated.get_full_name() or updated.username

            record_audit_log(
                action_type='USER_UPDATE',
                description=f"Updated profile details for '{name}' (@{updated.username}).",
                request=request,
                actor=request.user,
                target_entity='User',
                target_id=updated.id,
                target_name=name,
                severity='INFO',
                details={'fields_changed': list(request.data.keys())}
            )

            return Response({
                'message': 'Student updated successfully.',
                'student': UserSerializer(student).data,
            })
        return Response({
            'detail': 'Failed to update student.',
            'errors': serializer.errors,
        }, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        student = self.get_student(pk)
        name = student.get_full_name() or student.username
        # Soft delete: deactivate instead of hard-deleting
        student.is_active = False
        student.save()

        record_audit_log(
            action_type='USER_DELETE',
            description=f"Deactivated student account '{name}' (@{student.username}).",
            request=request,
            actor=request.user,
            target_entity='User',
            target_id=student.id,
            target_name=name,
            severity='WARNING',
            details={'username': student.username, 'email': student.email}
        )

        return Response({
            'message': f'Student "{name}" has been deactivated.'
        }, status=status.HTTP_200_OK)


class AuditLogListView(APIView):
    """
    GET /api/audit-logs/ - Query immutable audit logs (Admin only)
    Query params:
      - q: search term across actor, description, target_name
      - action: filter by action_type (e.g. USER_CREATE, LAB_CREATE)
      - severity: filter by severity (INFO, NOTICE, WARNING, DANGER)
      - entity: filter by target_entity (User, Lab, Course, Subject, StudyMaterial)
    """
    permission_classes = [IsAdminOrStaff]

    def get(self, request):
        qs = AuditLog.objects.select_related('actor').all()

        q = request.query_params.get('q', '').strip()
        if q:
            qs = qs.filter(
                Q(actor_username__icontains=q) |
                Q(description__icontains=q) |
                Q(target_name__icontains=q) |
                Q(ip_address__icontains=q)
            )

        action = request.query_params.get('action', '').strip()
        if action and action != 'ALL':
            qs = qs.filter(action_type=action)

        severity = request.query_params.get('severity', '').strip()
        if severity and severity != 'ALL':
            qs = qs.filter(severity=severity)

        entity = request.query_params.get('entity', '').strip()
        if entity and entity != 'ALL':
            qs = qs.filter(target_entity=entity)

        # Summary statistics for stats cards
        all_logs = AuditLog.objects.all()
        info_count = all_logs.filter(severity='INFO').count()
        notice_count = all_logs.filter(severity='NOTICE').count()
        warning_count = all_logs.filter(severity='WARNING').count()
        danger_count = all_logs.filter(severity='DANGER').count()

        # Slice limit for fast snappy loading
        limit = min(int(request.query_params.get('limit', 200)), 500)
        logs = qs[:limit]

        serializer = AuditLogSerializer(logs, many=True)
        return Response({
            'count': qs.count(),
            'stats': {
                'total': all_logs.count(),
                'info': info_count,
                'notice': notice_count,
                'warning': warning_count,
                'danger': danger_count,
            },
            'results': serializer.data,
        })

