"""
Reopen labs that were locked as "completed" before the student solved every CURRENT question.

Cause: editing a lab recreates its questions with new IDs, and answers saved for the old
IDs were still counted as solved, so a lab could auto-complete early and then reject the
student's remaining answers with "Lab completed (All questions submitted)".

Labs the student finalized themselves (a 'lab_finalized' audit entry exists) are left alone.
Scores are recomputed from the current questions only.

Usage:
    python manage.py repair_lab_completions          # dry run: list what would change
    python manage.py repair_lab_completions --apply  # write the changes
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import AuditLog
from courses.models import LabScore, LabSubmission
from courses.views import tally_lab_answers


class Command(BaseCommand):
    help = "Reopen labs auto-completed before every current question was solved (stale answers after lab edits)."

    def add_arguments(self, parser):
        parser.add_argument('--apply', action='store_true', help='Write changes (default is a dry run).')

    def handle(self, *args, **options):
        apply = options['apply']
        affected = 0

        scores = LabScore.objects.filter(is_completed=True).select_related('student', 'lab')
        for ls in scores:
            lab, student = ls.lab, ls.student
            total = lab.questions.count()
            sub = LabSubmission.objects.filter(student=student, lab=lab).first()
            solved, raw_total = tally_lab_answers(lab, sub.answers if sub else {})
            if total == 0 or solved >= total:
                continue

            finalized_manually = AuditLog.objects.filter(
                action_type='lab_finalized', actor=student, target_entity='Lab', target_id=str(lab.id),
            ).exists()
            if finalized_manually:
                continue

            affected += 1
            new_score = min(lab.points, max(0, raw_total))
            self.stdout.write(
                f"{'REOPEN' if apply else 'would reopen'}: student={student.username} lab=#{lab.id} '{lab.name}' "
                f"solved {solved}/{total}, score {ls.score} -> {new_score}"
            )
            if not apply:
                continue

            with transaction.atomic():
                ls.is_completed = False
                ls.completed_at = None
                ls.score = new_score
                ls.solved_questions_count = solved
                ls.total_questions_count = total
                if ls.is_attempt_expired():
                    # The student lost their window to this bug: next open starts a fresh 24 hours
                    ls.attempt_started_at = None
                ls.save()
                if sub:
                    sub.status = 'IN_PROGRESS'
                    sub.submitted_at = None
                    sub.score = new_score
                    sub.save()

        if affected == 0:
            self.stdout.write(self.style.SUCCESS("No wrongly completed labs found."))
        elif apply:
            self.stdout.write(self.style.SUCCESS(f"Reopened {affected} lab attempt(s)."))
        else:
            self.stdout.write(self.style.WARNING(f"{affected} lab attempt(s) affected. Re-run with --apply to fix."))
