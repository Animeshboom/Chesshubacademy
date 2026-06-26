import uuid
from django.db import models
from academy.models import Student


class Badge(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField()
    image_url = models.CharField(max_length=255)
    xp_bonus = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class StudentBadge(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='badges_earned')
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE, related_name='awarded_students')
    awarded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'badge')

    def __str__(self):
        return f"{self.student.user.email} - Badge: {self.badge.name}"


class XpTransaction(models.Model):
    REASON_CHOICES = (
        ('puzzle_solve', 'Solved Chess Puzzle'),
        ('homework_completion', 'Completed Homework'),
        ('badge_award', 'Earned Achievement Badge'),
        ('streak_bonus', 'Streak Active Bonus'),
        ('class_attendance', 'Attended Class Session'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='xp_history')
    xp_earned = models.IntegerField()
    reason = models.CharField(max_length=50, choices=REASON_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.user.email} +{self.xp_earned} XP ({self.get_reason_display()})"


class StudentStreak(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.OneToOneField(Student, on_delete=models.CASCADE, related_name='streak_info')
    daily_streak = models.IntegerField(default=0)
    weekly_streak = models.IntegerField(default=0)
    last_active_date = models.DateField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.student.user.email} - Daily Streak: {self.daily_streak} days"
