from django.core.management.base import BaseCommand

from academy.models import AcademyClass, Badge, Course, Lab, Student, StudyMaterial, User


class Command(BaseCommand):
    help = 'Seed the Blitz Academy platform with sample data and 50 lab records.'

    def handle(self, *args, **options):
        course, _ = Course.objects.get_or_create(name='Bug Bounty & Web App Security', slug='bug-bounty-web-app-security')

        admin_user, _ = User.objects.get_or_create(
            username='admin',
            defaults={'email': 'admin@blitzacademy.local', 'role': 'SUPER_ADMIN', 'is_staff': True, 'is_superuser': True}
        )
        if not admin_user.check_password('AdminPass!123'):
            admin_user.set_password('AdminPass!123')
            admin_user.save()

        instructor_user, _ = User.objects.get_or_create(
            username='instructor1',
            defaults={'email': 'instructor@blitzacademy.local', 'role': 'INSTRUCTOR'}
        )
        if not instructor_user.check_password('InstructorPass!123'):
            instructor_user.set_password('InstructorPass!123')
            instructor_user.save()

        academy_class, _ = AcademyClass.objects.get_or_create(
            class_id='BA-101',
            defaults={
                'name': 'CEH Batch 01',
                'batch_name': 'Batch 01',
                'course': course,
                'instructor': instructor_user,
                'status': 'ACTIVE',
            }
        )

        student_user, _ = User.objects.get_or_create(
            username='student01',
            defaults={'email': 'student01@blitzacademy.local', 'role': 'STUDENT'}
        )
        if not student_user.check_password('StudentPass!123'):
            student_user.set_password('StudentPass!123')
            student_user.save()

        student, _ = Student.objects.get_or_create(
            student_id='STU-001',
            defaults={
                'user': student_user,
                'full_name': 'Student One',
                'phone': '1234567890',
                'academy_class': academy_class,
                'fee_status': 'PAID',
                'lab_access': 'ENABLED',
                'account_status': 'ACTIVE',
            }
        )

        StudyMaterial.objects.get_or_create(
            title='Web Application Security Primer',
            defaults={
                'description': 'Essential overview of modern web app exploitation patterns.',
                'course': course,
                'academy_class': academy_class,
                'category': 'Web Security',
                'file_name': 'web_security_primer.pdf',
                'file_type': 'pdf',
                'visibility': 'CLASS',
                'student': student,
            }
        )

        for index in range(1, 51):
            lab_id = f'LAB-{index:03d}'
            name = {
                1: 'Recon & Information Disclosure',
                2: 'Authentication Basics',
                3: 'SQL Injection',
                4: 'Reflected XSS',
                5: 'Path Traversal',
                6: 'IDOR',
                7: 'Security Misconfiguration',
                8: 'File Upload',
                9: 'Session Security',
                10: 'Open Redirect',
                11: 'Stored XSS',
                12: 'CSRF',
                13: 'Command Injection',
                14: 'JWT Security',
                15: 'API Authentication',
                16: 'API Authorization',
                17: 'SSRF',
                18: 'XXE',
                19: 'NoSQL Injection',
                20: 'SSTI',
                21: 'CORS',
                22: 'OAuth Security',
                23: 'GraphQL Security',
                24: 'Business Logic',
                25: 'Race Conditions',
                26: 'File Inclusion',
                27: 'Advanced IDOR',
                28: 'Privilege Escalation',
                29: 'Webhook Security',
                30: 'Multi-Step Business Logic',
                31: 'Advanced SQL Injection',
                32: 'Blind SQL Injection',
                33: 'Advanced XSS',
                34: 'Advanced Authentication',
                35: 'JWT Attack Scenarios',
                36: 'API Security Chain',
                37: 'SSRF Chain',
                38: 'Upload + Path Traversal Chain',
                39: 'Prototype Pollution',
                40: 'Cache Poisoning Concepts',
                41: 'Request Smuggling Concepts',
                42: 'Advanced Access Control',
                43: 'OAuth Misconfiguration',
                44: 'GraphQL Authorization',
                45: 'Cloud Metadata Simulation',
                46: 'Multi-Tenant Security',
                47: 'Chained Web Vulnerabilities',
                48: 'Bug Bounty Recon Simulation',
                49: 'Full Web Application Assessment',
                50: 'Final Bug Bounty Challenge',
            }.get(index, f'Cyber Lab {index}')
            difficulty = 'BEGINNER' if index <= 10 else 'INTERMEDIATE' if index <= 30 else 'ADVANCED'
            category = 'Recon' if index <= 10 else 'Web Exploitation' if index <= 30 else 'Advanced Security'
            points = 100 + ((index % 10) * 25)
            Lab.objects.get_or_create(
                lab_id=lab_id,
                defaults={
                    'name': name,
                    'category': category,
                    'difficulty': difficulty,
                    'points': points,
                    'objective': 'Identify the training vulnerability and obtain the lab flag.',
                    'description': 'A fictional target application containing an intentionally vulnerable training flow.',
                    'instructions': 'Analyze the application, test for the intended weakness, and submit the flag to complete the challenge.',
                    'hints': 'Inspect app behavior, authentication, and black-box input handling carefully.',
                    'flag': f'FLAG{{training_lab_{index:03d}}}',
                    'completion_condition': 'Submit the correct flag after investigation.',
                    'status': 'ACTIVE',
                    'is_active': True,
                }
            )

        Badge.objects.get_or_create(name='First Lab Completed', defaults={'category': 'Completion', 'points_required': 100})
        Badge.objects.get_or_create(name='10 Labs Completed', defaults={'category': 'Completion', 'points_required': 1000})
        Badge.objects.get_or_create(name='50 Labs Completed', defaults={'category': 'Completion', 'points_required': 5000})
        Badge.objects.get_or_create(name='Web Security Beginner', defaults={'category': 'Progress', 'points_required': 500})
        Badge.objects.get_or_create(name='Bug Bounty Expert', defaults={'category': 'Progress', 'points_required': 3500})

        self.stdout.write(self.style.SUCCESS('Blitz Academy seed data loaded successfully.'))
