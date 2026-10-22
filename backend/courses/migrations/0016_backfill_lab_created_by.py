from django.db import migrations


def backfill_lab_creators(apps, schema_editor):
    """Fill Lab.created_by for labs created before creator tracking, using LAB_CREATE audit logs."""
    Lab = apps.get_model('courses', 'Lab')
    AuditLog = apps.get_model('accounts', 'AuditLog')

    for lab in Lab.objects.filter(created_by__isnull=True):
        log = (
            AuditLog.objects
            .filter(action_type='LAB_CREATE', target_entity='Lab', target_id=str(lab.id), actor__isnull=False)
            .order_by('timestamp')
            .first()
        )
        if log:
            lab.created_by_id = log.actor_id
            lab.save(update_fields=['created_by'])


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0015_lab_created_by'),
        ('accounts', '0004_user_assigned_class_user_lab_access_mode'),
    ]

    operations = [
        migrations.RunPython(backfill_lab_creators, migrations.RunPython.noop),
    ]
