import uuid
from django.db import models
from academy.models import Coach, Student


class Homework(models.Model):
    HOMEWORK_TYPE_CHOICES = (
        ('pdf', 'PDF Assignment'),
        ('lichess_study', 'Lichess Study Link'),
        ('pgn_analysis', 'PGN Analysis Task'),
        ('quiz', 'Chess Quiz'),
        ('puzzles', 'Tactical Puzzles'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    homework_type = models.CharField(max_length=20, choices=HOMEWORK_TYPE_CHOICES)
    created_by_coach = models.ForeignKey(Coach, on_delete=models.CASCADE, related_name='created_homeworks')
    drive_file_id = models.CharField(max_length=100, blank=True, null=True)  # Google Drive File ID for templates
    lichess_study_url = models.CharField(max_length=255, blank=True, null=True)
    pgn_data = models.TextField(blank=True, null=True)  # FEN/PGN string for analysis tasks
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.get_homework_type_display()})"


class HomeworkAssignment(models.Model):
    STATUS_CHOICES = (
        ('assigned', 'Assigned'),
        ('submitted', 'Submitted'),
        ('reviewed', 'Reviewed'),
        ('completed', 'Completed'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    homework = models.ForeignKey(Homework, on_delete=models.CASCADE, related_name='assignments')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='assignments')
    assigned_date = models.DateTimeField(auto_now_add=True)
    due_date = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='assigned')

    class Meta:
        unique_together = ('homework', 'student')

    def __str__(self):
        return f"HW: {self.homework.title} -> {self.student.user.email}"


class HomeworkSubmission(models.Model):
    STATUS_CHOICES = (
        ('pending_review', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    assignment = models.OneToOneField(HomeworkAssignment, on_delete=models.CASCADE, related_name='submission')
    submission_notes = models.TextField(blank=True, null=True)
    drive_file_id = models.CharField(max_length=100, blank=True, null=True)  # Student's submitted PDF file ID in GDrive
    submitted_pgn = models.TextField(blank=True, null=True)  # Student's custom moves PGN/FEN
    submitted_at = models.DateTimeField(auto_now_add=True)
    coach_feedback = models.TextField(blank=True, null=True)
    coach_score = models.IntegerField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending_review')

    def __str__(self):
        return f"Submission: {self.assignment.homework.title} by {self.assignment.student.user.email}"


class Puzzle(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    fen = models.CharField(max_length=255)
    moves = models.CharField(max_length=255)  # format: 'e2e4 e7e5'
    rating = models.IntegerField(default=1500)
    themes = models.JSONField(default=list)  # using JSONField to store array of tags: ['mateIn2', 'pin']
    title = models.CharField(max_length=150, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title or f"Puzzle {self.id} (Rating: {self.rating})"


class PuzzleAttempt(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='puzzle_attempts')
    puzzle = models.ForeignKey(Puzzle, on_delete=models.CASCADE, related_name='attempts')
    is_correct = models.BooleanField()
    solved_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.user.email} - Puzzle {self.puzzle.id} - Correct: {self.is_correct}"
