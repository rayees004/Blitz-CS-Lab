# BLITZ ACADEMY

Blitz Academy is a secure Django-based cyber training platform for student onboarding, class management, progress tracking, and lab-based learning. The academy itself is protected by secure authentication and authorization patterns, while intentionally vulnerable lab targets are kept isolated in training-only environments.

## Run locally

1. Activate the project virtual environment.
2. Install dependencies if needed.
3. Run:

```bash
python manage.py migrate
python manage.py seed_blitz_academy
python manage.py runserver
```

## Default sample accounts

- Admin: admin / AdminPass!123
- Instructor: instructor1 / InstructorPass!123
- Student: student01 / StudentPass!123

These are for local training only and should be replaced in production.

## Security notes

- The main platform uses Django auth and a custom user model.
- Students are blocked from admin access.
- Fee status and lab access checks prevent unauthorized lab entry.
- Lab challenges are isolated from the production platform by design.
