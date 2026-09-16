from django.core.management.base import BaseCommand
from accounts.models import User


class Command(BaseCommand):
    help = 'Seeds initial default admin and student users for Blitz Cyber Lab'

    def handle(self, *args, **options):
        # 1. Default Admin User
        admin_email = 'admin@blitzcyberlab.io'
        admin_username = 'admin'
        admin_pass = 'Admin@12345'

        admin_user, created = User.objects.get_or_create(
            username=admin_username,
            defaults={
                'email': admin_email,
                'first_name': 'Platform',
                'last_name': 'Admin',
                'user_type': 'admin',
                'is_staff': True,
                'is_superuser': True,
            }
        )

        if not created:
            admin_user.email = admin_email
            admin_user.user_type = 'admin'
            admin_user.is_staff = True
            admin_user.is_superuser = True

        admin_user.set_password(admin_pass)
        admin_user.save()

        action = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(
            f"[*] {action} Admin user: {admin_email} / {admin_pass} (user_type: admin)"
        ))

        # 2. Default Student User (Matching frontend mock email)
        student_email = 'rohith@blitzcyberlab.io'
        student_username = 'rohith'
        student_pass = 'Student@12345'

        student_user, s_created = User.objects.get_or_create(
            username=student_username,
            defaults={
                'email': student_email,
                'first_name': 'Rohith',
                'last_name': 'K',
                'user_type': 'student',
                'is_staff': False,
                'is_superuser': False,
            }
        )

        if not s_created:
            student_user.email = student_email
            student_user.user_type = 'student'

        student_user.set_password(student_pass)
        student_user.save()

        s_action = "Created" if s_created else "Updated"
        self.stdout.write(self.style.SUCCESS(
            f"[*] {s_action} Student user: {student_email} / {student_pass} (user_type: student)"
        ))
