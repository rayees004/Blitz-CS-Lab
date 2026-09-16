from django.core.management.base import BaseCommand
from courses.models import Course


COURSES = [
    {
        'name': 'Bug Bounty Batch 01',
        'description': 'Hands-on bug bounty hunting covering recon, web vulnerabilities, reporting, and platform workflows.',
        'price': 4999.00,
        'duration_weeks': 12,
    },
    {
        'name': 'Web Security — Evening',
        'description': 'Evening batch covering OWASP Top 10, XSS, SQLi, CSRF, and modern web security practices.',
        'price': 3999.00,
        'duration_weeks': 8,
    },
    {
        'name': 'API Security Intensive',
        'description': 'Deep-dive into REST and GraphQL API security, authentication flaws, IDOR, rate limiting bypass.',
        'price': 5499.00,
        'duration_weeks': 6,
    },
    {
        'name': 'OSINT Fundamentals',
        'description': 'Open-source intelligence gathering, footprinting, subdomain enumeration, and threat profiling.',
        'price': 2999.00,
        'duration_weeks': 4,
    },
    {
        'name': 'Network Security Essentials',
        'description': 'Network protocol analysis, packet inspection, firewall evasion, and intrusion detection.',
        'price': 4499.00,
        'duration_weeks': 8,
    },
    {
        'name': 'Advanced Web Exploitation',
        'description': 'Advanced deserialization, prototype pollution, SSRF chains, and cache poisoning techniques.',
        'price': 6999.00,
        'duration_weeks': 10,
    },
]


class Command(BaseCommand):
    help = 'Seed default courses for Blitz Cyber Lab'

    def handle(self, *args, **options):
        created_count = 0
        for data in COURSES:
            course, created = Course.objects.get_or_create(
                name=data['name'],
                defaults={
                    'description': data['description'],
                    'price': data['price'],
                    'duration_weeks': data['duration_weeks'],
                    'is_active': True,
                }
            )
            action = 'Created' if created else 'Already exists'
            if created:
                created_count += 1
            self.stdout.write(f'  [{action}] {course.name}')

        self.stdout.write(self.style.SUCCESS(
            f'\n[*] Done — {created_count} new course(s) seeded, {len(COURSES) - created_count} already existed.'
        ))
