# Generated by Django 4.2.13 on 2024-07-18 06:10

from django.conf import settings
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('social', '0013_userprofile_first_name_userprofile_last_name'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='like',
            unique_together={('user', 'post')},
        ),
    ]
