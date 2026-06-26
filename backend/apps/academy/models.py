import uuid
from django.db import models
from django.conf import settings

# Since authentication is in the same app structure, we refer to AUTH_USER_MODEL for User references.

class AcademyManager(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='manager_profile')
    zoom_access_token = models.TextField(blank=True, null=True)
    zoom_refresh_token = models.TextField(blank=True, null=True)
    zoom_token_expires_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Manager: {self.user.first_name} {self.user.last_name}"


class Coach(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='coach_profile')
    bio = models.TextField(blank=True, null=True)
    lichess_username = models.CharField(max_length=100, blank=True, null=True)
    zoom_personal_link = models.CharField(max_length=255, blank=True, null=True)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Coach: {self.user.first_name} {self.user.last_name}"


def default_roadmap():
    return {
        "Tactics": {"status": "not_started", "topics": []},
        "Opening": {"status": "not_started", "topics": []},
        "Middlegame": {"status": "not_started", "topics": []},
        "Endgame": {"status": "not_started", "topics": []},
        "Calculation": {"status": "not_started", "topics": []},
        "Strategy": {"status": "not_started", "topics": []},
        "Visualization": {"status": "not_started", "topics": []}
    }


class Student(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='student_profile')
    assigned_coach = models.ForeignKey(Coach, on_delete=models.SET_NULL, null=True, blank=True, related_name='students')
    parent_name = models.CharField(max_length=200, blank=True, null=True)
    parent_email = models.EmailField(blank=True, null=True)
    lichess_username = models.CharField(max_length=100, blank=True, null=True)
    lichess_rating = models.IntegerField(default=1500)
    lichess_blitz_rating = models.IntegerField(blank=True, null=True)
    lichess_rapid_rating = models.IntegerField(blank=True, null=True)
    lichess_classical_rating = models.IntegerField(blank=True, null=True)
    session_balance = models.IntegerField(default=0)
    total_xp = models.IntegerField(default=0)
    level = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    # Student Development Engine fields
    starting_rating = models.IntegerField(default=1200)
    target_rating = models.IntegerField(default=1500)
    strengths = models.JSONField(default=list, blank=True)
    weaknesses = models.JSONField(default=list, blank=True)
    coach_notes = models.TextField(blank=True, null=True)
    weekly_goals = models.JSONField(default=list, blank=True)
    monthly_goals = models.JSONField(default=list, blank=True)
    target_attendance_rate = models.IntegerField(default=90)
    target_homework_rate = models.IntegerField(default=90)
    roadmap = models.JSONField(default=default_roadmap, blank=True)

    def __str__(self):
        return f"Student: {self.user.first_name} {self.user.last_name}"


class Enrollment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='enrollments')
    plan_name = models.CharField(max_length=100)  # e.g., '12 Sessions', '24 Sessions', '48 Sessions'
    sessions_purchased = models.IntegerField()
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='INR')
    payment_status = models.CharField(max_length=50, default='completed')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Enrollment: {self.student.user.email} - {self.plan_name}"


class Session(models.Model):
    CLASS_TYPE_CHOICES = (
        ('1-to-1', '1-to-1 Coaching'),
        ('group', 'Group Class'),
    )
    STATUS_CHOICES = (
        ('scheduled', 'Scheduled'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('missed', 'Missed'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    class_type = models.CharField(max_length=20, choices=CLASS_TYPE_CHOICES, default='1-to-1')
    coach = models.ForeignKey(Coach, on_delete=models.RESTRICT, related_name='sessions')
    scheduled_start = models.DateTimeField(db_index=True)
    scheduled_end = models.DateTimeField()
    actual_duration_minutes = models.IntegerField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    notes = models.TextField(blank=True, null=True)
    topics_covered = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.scheduled_start.strftime('%Y-%m-%d %H:%M')})"


class SessionStudent(models.Model):
    ATTENDANCE_CHOICES = (
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('excused', 'Excused'),
        ('pending', 'Pending'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='session_participants')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='session_attendances')
    attendance_status = models.CharField(max_length=20, choices=ATTENDANCE_CHOICES, default='pending')
    feedback = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ('session', 'student')

    def __str__(self):
        return f"{self.student.user.email} in {self.session.title}"


class ZoomMeeting(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.OneToOneField(Session, on_delete=models.CASCADE, related_name='zoom_meeting')
    zoom_meeting_id = models.CharField(max_length=100)
    join_url = models.TextField()
    start_url = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Zoom Meeting for {self.session.title}"


class DemoBooking(models.Model):
    STATUS_CHOICES = (
        ('new', 'New Lead'),
        ('contacted', 'Contact Established'),
        ('demo_scheduled', 'Demo Scheduled'),
        ('demo_completed', 'Demo Completed'),
        ('converted', 'Converted to Active Student'),
        ('lost', 'Lost Lead'),
    )

    LEVEL_CHOICES = (
        ('beginner', 'Beginner Foundations'),
        ('intermediate', 'Intermediate Development'),
        ('advanced', 'Advanced Training'),
        ('tournament', 'Tournament Excellence'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    parent_name = models.CharField(max_length=200)
    student_name = models.CharField(max_length=200)
    age = models.IntegerField()
    country = models.CharField(max_length=100)
    whatsapp_number = models.CharField(max_length=20)
    chess_level = models.CharField(max_length=50, choices=LEVEL_CHOICES, default='beginner')
    preferred_time = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new', db_index=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Demo Booking: {self.student_name} ({self.parent_name})"


class GalleryImage(models.Model):
    CATEGORY_CHOICES = (
        ('classes', 'Live Classes'),
        ('achievements', 'Student Achievements'),
        ('tournaments', 'Tournaments'),
        ('certificates', 'Certificates'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    image_url = models.CharField(max_length=255)
    drive_file_id = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.get_category_display()}"


class MonthlyStudentReport(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='monthly_reports')
    report_month = models.CharField(max_length=7)  # e.g. "2026-06"
    attendance_rate = models.FloatField()
    homework_rate = models.FloatField()
    rating_growth = models.IntegerField()
    puzzle_accuracy = models.FloatField()
    strengths = models.JSONField(default=list, blank=True)
    weaknesses = models.JSONField(default=list, blank=True)
    coach_feedback = models.TextField(blank=True, null=True)
    next_month_goals = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student', 'report_month')

    def __str__(self):
        return f"Report {self.report_month} for {self.student.user.email}"


class StudentPerformanceProfile(models.Model):
    RISK_CHOICES = (
        ('low', 'Low Risk'),
        ('medium', 'Medium Risk'),
        ('high', 'High Risk'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.OneToOneField(Student, on_delete=models.CASCADE, related_name='performance_profile')
    
    # Game Analysis Engine
    blunders_avg = models.FloatField(default=0.0)
    mistakes_avg = models.FloatField(default=0.0)
    inaccuracies_avg = models.FloatField(default=0.0)
    acpl = models.FloatField(default=0.0)  # Average Centipawn Loss
    opening_perf_rating = models.IntegerField(default=1500)
    middlegame_perf_rating = models.IntegerField(default=1500)
    endgame_perf_rating = models.IntegerField(default=1500)
    
    # Tactical Analytics
    puzzle_accuracy = models.FloatField(default=100.0)
    puzzle_rating = models.IntegerField(default=1500)
    solve_speed_seconds = models.FloatField(default=0.0)
    strongest_theme = models.CharField(max_length=100, default='Tactics')
    weakest_theme = models.CharField(max_length=100, default='None')
    improvement_trend = models.JSONField(default=list, blank=True)
    
    # Automated Weakness Detection (0 to 100)
    fork_weakness = models.IntegerField(default=0)
    pin_weakness = models.IntegerField(default=0)
    skewer_weakness = models.IntegerField(default=0)
    king_safety_issues = models.IntegerField(default=0)
    calculation_issues = models.IntegerField(default=0)
    endgame_issues = models.IntegerField(default=0)
    
    # Success Prediction & Risk Detection
    risk_level = models.CharField(max_length=10, choices=RISK_CHOICES, default='low')
    risk_alerts = models.JSONField(default=list, blank=True)
    
    # Coach Insights / Auto-Recommendations
    recommendations = models.JSONField(default=list, blank=True)
    
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Performance: {self.student.user.email}"


from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=Student)
def create_student_performance_profile(sender, instance, created, **kwargs):
    if created:
        StudentPerformanceProfile.objects.get_or_create(student=instance)


class SystemAuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    action_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    action_type = models.CharField(max_length=50)  # e.g., 'balance_update', 'role_change', 'session_booking'
    target_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_targets')
    description = models.TextField()
    previous_value = models.JSONField(blank=True, null=True)
    new_value = models.JSONField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.action_type} by {self.action_by} at {self.timestamp}"


