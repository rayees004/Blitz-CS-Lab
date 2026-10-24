from django.db import migrations


def backfill_class_creators(apps, schema_editor):
    """Fill StudentClass.created_by for classes created before creator tracking, using CLASS_CREATE audit logs."""
    StudentClass = apps.get_model('courses', 'StudentClass')
    AuditLog = apps.get_model('accounts', 'AuditLog')

    for class_obj in StudentClass.objects.filter(created_by__isnull=True):
        log = (
            AuditLog.objects
            .filter(action_type='CLASS_CREATE', target_entity='StudentClass', target_id=str(class_obj.id), actor__isnull=False)
            .order_by('timestamp')
            .first()
        )
        if log:
            class_obj.created_by_id = log.actor_id
            class_obj.save(update_fields=['created_by'])


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0020_class_creator_and_managers'),
        ('accounts', '0004_user_assigned_class_user_lab_access_mode'),
    ]

    operations = [
        migrations.RunPython(backfill_class_creators, migrations.RunPython.noop),
    ]
