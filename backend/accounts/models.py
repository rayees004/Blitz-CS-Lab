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
