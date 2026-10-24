from django.db import migrations

DEFAULT_CATEGORIES = [
    'Web Security',
    'API Security',
    'Authentication',
    'Bug Bounty',
    'Network Security',
    'OSINT',
    'Cryptography',
    'Cloud Security',
    'Advanced Web Security',
]


def seed_categories(apps, schema_editor):
    """Create the default categories plus every category already used by existing labs."""
    Lab = apps.get_model('courses', 'Lab')
    LabCategory = apps.get_model('courses', 'LabCategory')

    names = set(DEFAULT_CATEGORIES)
    names.update(n.strip() for n in Lab.objects.values_list('category', flat=True) if n and n.strip())
    for name in names:
        LabCategory.objects.get_or_create(name=name)


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0017_labcategory'),
    ]

    operations = [
        migrations.RunPython(seed_categories, migrations.RunPython.noop),
    ]
