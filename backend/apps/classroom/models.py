import uuid
from django.db import models
from django.conf import settings
from academy.models import Session

class LessonPlan(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class LessonStep(models.Model):
    STEP_TYPE_CHOICES = (
        ('explanation', 'Explanation'),
        ('puzzle', 'Puzzle Solving'),
        ('game_example', 'Master Game Example'),
        ('homework', 'Homework Assignment'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lesson_plan = models.ForeignKey(LessonPlan, on_delete=models.CASCADE, related_name='steps')
    title = models.CharField(max_length=255)
    step_type = models.CharField(max_length=30, choices=STEP_TYPE_CHOICES)
    fen = models.TextField(default="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
    pgn = models.TextField(blank=True, default="")
    description = models.TextField(blank=True, default="")
    order = models.IntegerField(default=0)
    associated_puzzle = models.ForeignKey('homework.Puzzle', on_delete=models.SET_NULL, null=True, blank=True)
    associated_homework = models.ForeignKey('homework.Homework', on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.lesson_plan.title} - Step {self.order + 1}: {self.title}"


class BoardState(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.OneToOneField(Session, on_delete=models.CASCADE, related_name='board_state')
    current_fen = models.TextField(default="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
    pgn = models.TextField(blank=True, default="")
    board_mode = models.CharField(max_length=30, default="teaching") # teaching, practice, puzzle, analysis
    student_moves_enabled = models.BooleanField(default=False)
    white_control = models.CharField(max_length=100, blank=True, null=True)
    black_control = models.CharField(max_length=100, blank=True, null=True)
    is_locked = models.BooleanField(default=False)
    annotations = models.JSONField(default=list, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Coach-led fields
    active_lesson_plan = models.ForeignKey(LessonPlan, on_delete=models.SET_NULL, null=True, blank=True)
    active_lesson_step = models.ForeignKey(LessonStep, on_delete=models.SET_NULL, null=True, blank=True)
    student_with_move_rights = models.ForeignKey('academy.Student', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"BoardState for {self.session.title}"



class SessionEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='events')
    event_type = models.CharField(max_length=50) # move, arrow, highlight, mode_change, puzzle_load, comment
    event_data = models.JSONField(default=dict)
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Event {self.event_type} in {self.session.title} at {self.timestamp}"


class ChessStudy(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    lichess_url = models.CharField(max_length=255, blank=True, null=True)
    pgn_data = models.TextField(blank=True, null=True)
    fen_data = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class CurriculumItem(models.Model):
    LEVEL_CHOICES = (
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
        ('tournament', 'Tournament'),
    )
    CATEGORY_CHOICES = (
        ('openings', 'Openings'),
        ('tactics', 'Tactics'),
        ('strategy', 'Strategy'),
        ('calculation', 'Calculation'),
        ('visualization', 'Visualization'),
        ('endgames', 'Endgames'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    title = models.CharField(max_length=255)
    study_pgn = models.TextField(blank=True, default="")
    starting_fen = models.TextField(default="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
    puzzle_fens = models.JSONField(default=list, blank=True)
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.get_level_display()} - {self.get_category_display()}] {self.title}"


class StudyVault(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    lichess_url = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class StudyChapter(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    study = models.ForeignKey(StudyVault, on_delete=models.CASCADE, related_name='chapters')
    title = models.CharField(max_length=255)
    pgn = models.TextField(blank=True, default="")
    starting_fen = models.TextField(default="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.study.title} - {self.title}"


class ChapterPosition(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    chapter = models.ForeignKey(StudyChapter, on_delete=models.CASCADE, related_name='positions')
    fen = models.TextField()
    move_number = models.IntegerField(default=1)
    san = models.CharField(max_length=50, blank=True, default="")
    comment = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)


class StudyTag(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    studies = models.ManyToManyField(StudyVault, related_name='tags')
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class SessionArchive(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.OneToOneField(Session, on_delete=models.CASCADE, related_name='archive')
    recording_url = models.TextField(blank=True, default="")
    pgn = models.TextField(blank=True, default="")
    board_annotations = models.JSONField(default=list, blank=True)
    chat_log = models.JSONField(default=list, blank=True)
    notes = models.TextField(blank=True, default="")
    homework_details = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Archive for {self.session.title}"


class AICoachReport(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.OneToOneField(Session, on_delete=models.CASCADE, related_name='ai_report')
    topics_covered = models.TextField(blank=True, default="")
    strengths = models.TextField(blank=True, default="")
    weaknesses = models.TextField(blank=True, default="")
    homework_suggestions = models.TextField(blank=True, default="")
    next_lesson_plan = models.TextField(blank=True, default="")
    parent_summary = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"AI Report for {self.session.title}"
