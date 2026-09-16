from django.db import models
from django.conf import settings


class Course(models.Model):
    name = models.CharField(max_length=200, unique=True)
    description = models.TextField(blank=True, default='')
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    duration_weeks = models.PositiveIntegerField(default=8)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

    @property
    def enrolled_count(self):
        return self.enrollments.filter(is_active=True).count()


class Enrollment(models.Model):
    FEE_STATUS_CHOICES = [
        ('PAID', 'Paid'),
        ('DUE', 'Due'),
        ('PARTIAL', 'Partial'),
    ]

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='enrollments',
        limit_choices_to={'user_type': 'student'},
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='enrollments',
    )
    fee_status = models.CharField(
        max_length=10,
        choices=FEE_STATUS_CHOICES,
        default='DUE',
    )
    is_on_hold = models.BooleanField(default=False)
    hold_reason = models.CharField(max_length=300, blank=True, default='')
    is_active = models.BooleanField(default=True)
    enrolled_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    notes = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-enrolled_at']
        constraints = [
            models.UniqueConstraint(
                fields=['student', 'course'],
                name='unique_student_course_enrollment'
            )
        ]

    def __str__(self):
        return f"{self.student.username} → {self.course.name} [{self.fee_status}]"
