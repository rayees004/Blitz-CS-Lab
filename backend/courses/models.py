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


class Subject(models.Model):
    """Academic / curriculum subject belonging to a Course/Class (or standalone)."""
    course = models.ForeignKey(
        Course,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='subjects',
    )
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=50, blank=True, default='')  # e.g. "SEC-101"
    description = models.TextField(blank=True, default='')
    credits_or_hours = models.PositiveIntegerField(default=30)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})" if self.code else self.name

    @property
    def enrolled_count(self):
        return self.enrollments.filter(is_active=True).count()


class SubjectEnrollment(models.Model):
    """Enrollment / assignment linking a student to a specific Subject."""
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='subject_enrollments',
        limit_choices_to={'user_type': 'student'},
    )
    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        related_name='enrollments',
    )
    is_active = models.BooleanField(default=True)
    enrolled_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-enrolled_at']
        constraints = [
            models.UniqueConstraint(
                fields=['student', 'subject'],
                name='unique_student_subject_enrollment'
            )
        ]

    def __str__(self):
        return f"{self.student.username} → {self.subject.name} (active={self.is_active})"


class Module(models.Model):
    """Curriculum module (chapter/section) belonging to a Course/Class or standalone Subject/Course."""
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='modules',
    )
    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='modules',
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    order = models.PositiveIntegerField(default=0)
    duration_hours = models.DecimalField(max_digits=5, decimal_places=1, default=1.0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"[{self.course.name}] #{self.order} {self.title}"


class Lab(models.Model):
    DIFFICULTY_CHOICES = [
        ('Beginner', 'Beginner'),
        ('Intermediate', 'Intermediate'),
        ('Advanced', 'Advanced'),
    ]

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    org = models.CharField(max_length=150, blank=True, default='BlitzLab')
    category = models.CharField(max_length=100, default='Web Security')
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='Beginner')
    points = models.PositiveIntegerField(default=100)
    target_url = models.CharField(max_length=300, blank=True, default='')
    video_url = models.URLField(max_length=500, blank=True, default='', help_text='External teaching video URL (e.g. YouTube, Vimeo, MP4 stream)')
    video_file = models.FileField(upload_to='lab_videos/', blank=True, null=True, help_text='Uploaded lab teaching video file')
    course = models.ForeignKey(
        Course,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='labs',
    )
    subject = models.ForeignKey(
        Subject,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='labs',
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    @property
    def question_count(self):
        return self.questions.count()


class LabQuestion(models.Model):
    lab = models.ForeignKey(
        Lab,
        on_delete=models.CASCADE,
        related_name='questions',
    )
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True, default='')
    flag = models.CharField(max_length=200, blank=True, default='')
    points = models.PositiveIntegerField(default=50)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"[{self.lab.name}] Q: {self.title}"

    @property
    def hint_count(self):
        return self.hints.count()


class QuestionHint(models.Model):
    question = models.ForeignKey(
        LabQuestion,
        on_delete=models.CASCADE,
        related_name='hints',
    )
    hint_text = models.TextField()
    cost = models.PositiveIntegerField(default=10)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"Hint #{self.order + 1} for {self.question.title}"


class LabSubmission(models.Model):
    STATUS_CHOICES = [
        ('NOT_STARTED', 'Not Started'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
    ]

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='lab_submissions',
    )
    lab = models.ForeignKey(
        Lab,
        on_delete=models.CASCADE,
        related_name='submissions',
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='IN_PROGRESS')
    score = models.IntegerField(default=0)  # marks awarded
    max_score = models.IntegerField(default=100)  # total possible marks
    answers = models.JSONField(default=dict, blank=True)
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    last_activity_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-last_activity_at']
        constraints = [
            models.UniqueConstraint(
                fields=['student', 'lab'],
                name='unique_student_lab_submission'
            )
        ]

    def __str__(self):
        return f"{self.student.username} → {self.lab.name} ({self.status}: {self.score}/{self.max_score})"


class LabScore(models.Model):
    """
    Lab-based score tracking record using Foreign Key to Lab.
    Ensures that attending the same lab 1 or multiple times will NEVER increase
    the score artificially. The score is uniquely bound to the specific lab.
    """
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='lab_scores',
    )
    lab = models.ForeignKey(
        Lab,
        on_delete=models.CASCADE,
        related_name='scores',
    )
    score = models.PositiveIntegerField(default=0)  # marks earned for this lab
    max_score = models.PositiveIntegerField(default=100)
    attend_count = models.PositiveIntegerField(default=1)  # number of times attended
    is_completed = models.BooleanField(default=False)
    solved_questions_count = models.PositiveIntegerField(default=0)
    total_questions_count = models.PositiveIntegerField(default=0)
    first_attended_at = models.DateTimeField(auto_now_add=True)
    last_attended_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-last_attended_at']
        constraints = [
            models.UniqueConstraint(
                fields=['student', 'lab'],
                name='unique_student_lab_score'
            )
        ]

    def __str__(self):
        return f"LabScore: {self.student.username} → {self.lab.name}: {self.score}/{self.max_score} pts (Attended {self.attend_count}x)"


class StudyMaterial(models.Model):
    """
    Study materials / reference documents linked to a Subject (mandatory),
    with an optional linkage to a specific Lab.
    Supports PDF, Word (.doc, .docx), and PowerPoint (.ppt, .pptx).
    """
    FILE_TYPE_CHOICES = [
        ('PDF', 'PDF Document'),
        ('WORD', 'Word Document'),
        ('PPTX', 'PowerPoint Presentation'),
        ('OTHER', 'Other Document'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        related_name='materials',
        help_text='The subject this material belongs to (mandatory).'
    )
    lab = models.ForeignKey(
        Lab,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='materials',
        help_text='Optional related lab for this material.'
    )
    file = models.FileField(
        upload_to='study_materials/',
        help_text='Uploaded study material file (PDF, Word, or PPTX).'
    )
    file_type = models.CharField(
        max_length=10,
        choices=FILE_TYPE_CHOICES,
        default='PDF'
    )
    file_size_bytes = models.PositiveIntegerField(default=0)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='uploaded_materials'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.subject.name}] {self.title} ({self.file_type})"


