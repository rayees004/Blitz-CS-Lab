from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    USER_TYPE_CHOICES = (
        ('admin', 'Admin'),
        ('student', 'Student'),
        ('instructor', 'Instructor'),
    )

    user_type = models.CharField(
        max_length=20,
        choices=USER_TYPE_CHOICES,
        default='student',
        help_text='Role/Type of user in the platform'
    )
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    organization = models.CharField(max_length=150, blank=True, default='Blitz Cyber Lab')

    def save(self, *args, **kwargs):
        # Automatically make superusers/staff default to admin role if still student
        if (self.is_superuser or self.is_staff) and self.user_type == 'student':
            self.user_type = 'admin'
        super().save(*args, **kwargs)

    @property
    def is_admin(self):
        return self.user_type == 'admin' or self.is_superuser or self.is_staff

    def __str__(self):
        return f"{self.username} ({self.user_type})"


class AuditLog(models.Model):
    """
    Immutable audit trail recording administrative and critical system actions.
    """
    ACTION_TYPES = (
        ('USER_CREATE', 'User Created'),
        ('USER_UPDATE', 'User Updated'),
        ('USER_DELETE', 'User Deactivated'),
        ('AUTH_LOGIN', 'User Logged In'),
        ('AUTH_LOGOUT', 'User Logged Out'),
        ('COURSE_CREATE', 'Course Created'),
        ('COURSE_UPDATE', 'Course Updated'),
        ('COURSE_DELETE', 'Course Deactivated'),
        ('SUBJECT_CREATE', 'Subject Created'),
        ('SUBJECT_UPDATE', 'Subject Updated'),
        ('SUBJECT_DELETE', 'Subject Deactivated'),
        ('LAB_CREATE', 'Lab Created'),
        ('LAB_UPDATE', 'Lab Updated'),
        ('LAB_DELETE', 'Lab Archived'),
        ('MATERIAL_UPLOAD', 'Material Uploaded'),
        ('MATERIAL_UPDATE', 'Material Updated'),
        ('MATERIAL_DELETE', 'Material Deleted'),
        ('ENROLLMENT_ASSIGN', 'Course Assigned'),
        ('SUBJECT_ASSIGN', 'Subject Assigned'),
        ('SETTINGS_UPDATE', 'Settings Updated'),
        ('OTHER', 'Other Action'),
    )

    SEVERITY_LEVELS = (
        ('INFO', 'Info'),
        ('NOTICE', 'Notice'),
        ('WARNING', 'Warning'),
        ('DANGER', 'Danger'),
    )

    actor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_actions',
        help_text='Admin or user who performed the action'
    )
    actor_username = models.CharField(max_length=150, blank=True, default='')
    actor_email = models.CharField(max_length=254, blank=True, default='')
    actor_role = models.CharField(max_length=50, blank=True, default='')
    
    action_type = models.CharField(max_length=50, choices=ACTION_TYPES, default='OTHER')
    severity = models.CharField(max_length=20, choices=SEVERITY_LEVELS, default='INFO')
    
    target_entity = models.CharField(max_length=100, blank=True, default='', help_text='Entity type, e.g. User, Lab, Course, Subject, StudyMaterial')
    target_id = models.CharField(max_length=100, blank=True, default='', help_text='ID or primary key of the modified object')
    target_name = models.CharField(max_length=255, blank=True, default='', help_text='Human readable target descriptor')
    
    description = models.TextField(blank=True, default='')
    details = models.JSONField(blank=True, default=dict)
    
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.CharField(max_length=500, blank=True, default='')
    
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'

    def __str__(self):
        return f"[{self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}] {self.actor_username or 'System'}: {self.action_type} ({self.target_name})"

