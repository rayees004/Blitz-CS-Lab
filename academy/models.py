from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    ROLE_CHOICES = [
        ('SUPER_ADMIN', 'Super Admin'),
        ('ADMIN', 'Admin'),
        ('INSTRUCTOR', 'Instructor'),
        ('STUDENT', 'Student'),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='STUDENT')
    phone = models.CharField(max_length=20, blank=True, null=True)
    is_verified = models.BooleanField(default=False)

    class Meta:
        db_table = 'users'

    def __str__(self):
        return self.username


class Course(models.Model):
    name = models.CharField(max_length=150)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'courses'

    def __str__(self):
        return self.name


class AcademyClass(models.Model):
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
        ('COMPLETED', 'Completed'),
    ]

    class_id = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=150)
    batch_name = models.CharField(max_length=100)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='classes')
    instructor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='classes_managed')
    start_date = models.DateField(default=timezone.now)
    end_date = models.DateField(default=timezone.now)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'classes'

    def __str__(self):
        return f'{self.name} ({self.batch_name})'


class Student(models.Model):
    FEE_STATUS_CHOICES = [
        ('PAID', 'Paid'),
        ('DUE', 'Due'),
        ('PARTIAL', 'Partial'),
    ]
    LAB_ACCESS_CHOICES = [
        ('ENABLED', 'Enabled'),
        ('DISABLED', 'Disabled'),
    ]
    ACCOUNT_STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('SUSPENDED', 'Suspended'),
        ('INACTIVE', 'Inactive'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    student_id = models.CharField(max_length=50, unique=True)
    full_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20, blank=True, null=True)
    academy_class = models.ForeignKey(AcademyClass, on_delete=models.SET_NULL, null=True, blank=True, related_name='students')
    fee_status = models.CharField(max_length=20, choices=FEE_STATUS_CHOICES, default='PAID')
    lab_access = models.CharField(max_length=20, choices=LAB_ACCESS_CHOICES, default='ENABLED')
    account_status = models.CharField(max_length=20, choices=ACCOUNT_STATUS_CHOICES, default='ACTIVE')
    course_start_date = models.DateField(default=timezone.now)
    course_expiry_date = models.DateField(default=timezone.now)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'students'

    def __str__(self):
        return self.full_name


class Lab(models.Model):
    DIFFICULTY_CHOICES = [
        ('BEGINNER', 'Beginner'),
        ('INTERMEDIATE', 'Intermediate'),
        ('ADVANCED', 'Advanced'),
    ]
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('ACTIVE', 'Active'),
        ('MAINTENANCE', 'Maintenance'),
        ('DISABLED', 'Disabled'),
    ]

    lab_id = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='BEGINNER')
    points = models.IntegerField(default=100)
    objective = models.TextField(blank=True)
    description = models.TextField(blank=True)
    instructions = models.TextField(blank=True)
    hints = models.TextField(blank=True)
    flag = models.CharField(max_length=200)
    completion_condition = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'labs'

    def __str__(self):
        return f'{self.lab_id} - {self.name}'


class LabAssignment(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='assigned_labs')
    lab = models.ForeignKey(Lab, on_delete=models.CASCADE, related_name='assignments')
    academy_class = models.ForeignKey(AcademyClass, on_delete=models.CASCADE, related_name='lab_assignments', null=True, blank=True)
    enabled = models.BooleanField(default=True)
    access_expires = models.DateTimeField(null=True, blank=True)
    assigned_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'lab_assignments'
        unique_together = ('student', 'lab')

    def __str__(self):
        return f'{self.student} -> {self.lab}'


class StudyMaterial(models.Model):
    VISIBILITY_CHOICES = [
        ('CLASS', 'Class'),
        ('GLOBAL', 'Global'),
        ('STUDENT', 'Student'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='materials')
    academy_class = models.ForeignKey(AcademyClass, on_delete=models.CASCADE, related_name='materials', null=True, blank=True)
    category = models.CharField(max_length=100, default='General')
    related_lab = models.ForeignKey(Lab, on_delete=models.SET_NULL, null=True, blank=True, related_name='study_materials')
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=50, default='pdf')
    visibility = models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default='CLASS')
    student = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True, blank=True, related_name='student_materials')
    publish_date = models.DateTimeField(default=timezone.now)
    is_published = models.BooleanField(default=True)
    version = models.CharField(max_length=20, default='1.0')
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'study_materials'

    def __str__(self):
        return self.title


class LabSession(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='lab_sessions')
    lab = models.ForeignKey(Lab, on_delete=models.CASCADE, related_name='lab_sessions')
    started_at = models.DateTimeField(default=timezone.now)
    expired_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = 'lab_sessions'

    def __str__(self):
        return f'{self.student} / {self.lab}'


class LabAttempt(models.Model):
    STATUS_CHOICES = [
        ('STARTED', 'Started'),
        ('FAIL', 'Fail'),
        ('SUCCESS', 'Success'),
    ]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='lab_attempts')
    lab = models.ForeignKey(Lab, on_delete=models.CASCADE, related_name='attempts')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='STARTED')
    submitted_flag = models.CharField(max_length=200, blank=True)
    submitted_at = models.DateTimeField(default=timezone.now)
    points_awarded = models.IntegerField(default=0)

    class Meta:
        db_table = 'lab_attempts'

    def __str__(self):
        return f'{self.student} - {self.lab} - {self.status}'


class StudentProgress(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='progress')
    lab = models.ForeignKey(Lab, on_delete=models.CASCADE, related_name='student_progress')
    completed = models.BooleanField(default=False)
    points_earned = models.IntegerField(default=0)
    attempts = models.IntegerField(default=0)
    last_updated = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'student_progress'
        unique_together = ('student', 'lab')

    def __str__(self):
        return f'{self.student} / {self.lab} / {self.completed}'


class Badge(models.Model):
    name = models.CharField(max_length=150)
    category = models.CharField(max_length=80, default='General')
    description = models.TextField(blank=True)
    points_required = models.IntegerField(default=0)
    icon = models.CharField(max_length=50, blank=True)

    class Meta:
        db_table = 'badges'

    def __str__(self):
        return self.name


class StudentBadge(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='badges')
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE, related_name='students')
    awarded_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'student_badges'
        unique_together = ('student', 'badge')


class Certificate(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='certificates')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='certificates')
    certificate_code = models.CharField(max_length=80, unique=True)
    issued_at = models.DateTimeField(default=timezone.now)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'certificates'

    def __str__(self):
        return f'{self.student} - {self.course}'


class AuditLog(models.Model):
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    action = models.CharField(max_length=100)
    target = models.CharField(max_length=200)
    result = models.CharField(max_length=50, default='SUCCESS')
    details = models.TextField(blank=True)
    timestamp = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'audit_logs'

    def __str__(self):
        return f'{self.action} @ {self.timestamp}'
