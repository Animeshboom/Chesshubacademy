# Generated manually
import uuid
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):

    dependencies = [
        ('classroom', '0002_chessstudy'),
        ('academy', '0001_initial'), # assuming academy's first migration is 0001_initial
    ]

    operations = [
        migrations.CreateModel(
            name='CurriculumItem',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('level', models.CharField(choices=[('beginner', 'Beginner'), ('intermediate', 'Intermediate'), ('advanced', 'Advanced'), ('tournament', 'Tournament')], max_length=20)),
                ('category', models.CharField(choices=[('openings', 'Openings'), ('tactics', 'Tactics'), ('strategy', 'Strategy'), ('calculation', 'Calculation'), ('visualization', 'Visualization'), ('endgames', 'Endgames')], max_length=20)),
                ('title', models.CharField(max_length=255)),
                ('study_pgn', models.TextField(blank=True, default='')),
                ('starting_fen', models.TextField(default='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')),
                ('puzzle_fens', models.JSONField(blank=True, default=list)),
                ('notes', models.TextField(blank=True, default='')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name='StudyVault',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True, default='')),
                ('lichess_url', models.CharField(blank=True, max_length=255, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name='StudyChapter',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=255)),
                ('pgn', models.TextField(blank=True, default='')),
                ('starting_fen', models.TextField(default='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')),
                ('order', models.IntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('study', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='chapters', to='classroom.studyvault')),
            ],
        ),
        migrations.CreateModel(
            name='ChapterPosition',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('fen', models.TextField()),
                ('move_number', models.IntegerField(default=1)),
                ('san', models.CharField(blank=True, default='', max_length=50)),
                ('comment', models.TextField(blank=True, default='')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('chapter', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='positions', to='classroom.studychapter')),
            ],
        ),
        migrations.CreateModel(
            name='StudyTag',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=100, unique=True)),
                ('studies', models.ManyToManyField(related_name='tags', to='classroom.studyvault')),
            ],
        ),
        migrations.CreateModel(
            name='SessionArchive',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('recording_url', models.TextField(blank=True, default='')),
                ('pgn', models.TextField(blank=True, default='')),
                ('board_annotations', models.JSONField(blank=True, default=list)),
                ('chat_log', models.JSONField(blank=True, default=list)),
                ('notes', models.TextField(blank=True, default='')),
                ('homework_details', models.JSONField(blank=True, default=list)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('session', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='archive', to='academy.session')),
            ],
        ),
        migrations.CreateModel(
            name='AICoachReport',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('topics_covered', models.TextField(blank=True, default='')),
                ('strengths', models.TextField(blank=True, default='')),
                ('weaknesses', models.TextField(blank=True, default='')),
                ('homework_suggestions', models.TextField(blank=True, default='')),
                ('next_lesson_plan', models.TextField(blank=True, default='')),
                ('parent_summary', models.TextField(blank=True, default='')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('session', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='ai_report', to='academy.session')),
            ],
        ),
    ]
