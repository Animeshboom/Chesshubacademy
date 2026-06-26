from rest_framework import serializers
from django.contrib.auth import get_user_model
from academy.models import (
    Coach, Student, Enrollment, Session, SessionStudent,
    ZoomMeeting, DemoBooking, GalleryImage, MonthlyStudentReport,
    StudentPerformanceProfile
)
from authentication.serializers import UserSerializer

User = get_user_model()


class CoachSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Coach
        fields = ('id', 'user', 'bio', 'lichess_username', 'zoom_personal_link', 'hourly_rate', 'created_at')

class StudentPerformanceProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentPerformanceProfile
        fields = '__all__'


class StudentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    assigned_coach = CoachSerializer(read_only=True)
    assigned_coach_id = serializers.PrimaryKeyRelatedField(
        queryset=Coach.objects.all(), source='assigned_coach', write_only=True, required=False, allow_null=True
    )

    target_rating_display = serializers.SerializerMethodField()
    learning_roadmap = serializers.SerializerMethodField()
    goals = serializers.SerializerMethodField()
    coach_recommendations = serializers.SerializerMethodField()
    progress_percent = serializers.SerializerMethodField()
    package_tracking = serializers.SerializerMethodField()
    performance_profile = StudentPerformanceProfileSerializer(read_only=True)

    class Meta:
        model = Student
        fields = (
            'id', 'user', 'assigned_coach', 'assigned_coach_id', 'parent_name', 'parent_email',
            'lichess_username', 'lichess_rating', 'lichess_blitz_rating', 'lichess_rapid_rating',
            'lichess_classical_rating', 'session_balance', 'total_xp', 'level', 'created_at',
            'target_rating_display', 'learning_roadmap', 'goals', 'coach_recommendations', 'progress_percent',
            'package_tracking', 'starting_rating', 'target_rating', 'strengths', 'weaknesses', 'coach_notes',
            'weekly_goals', 'monthly_goals', 'target_attendance_rate', 'target_homework_rate', 'roadmap',
            'performance_profile'
        )
        read_only_fields = (
            'session_balance', 'total_xp', 'level', 
            'lichess_rating', 'lichess_blitz_rating', 
            'lichess_rapid_rating', 'lichess_classical_rating'
        )

    def get_target_rating_display(self, obj):
        return obj.target_rating

    def get_learning_roadmap(self, obj):
        if obj.roadmap:
            roadmap_list = []
            for cat, details in obj.roadmap.items():
                status_label = details.get('status', 'not_started').replace('_', ' ').title()
                topics = details.get('topics', [])
                topics_str = ", ".join(topics) if isinstance(topics, list) else str(topics)
                if topics_str:
                    roadmap_list.append(f"{cat}: {topics_str} ({status_label})")
                else:
                    roadmap_list.append(f"{cat}: {status_label}")
            return roadmap_list
        return []

    def get_goals(self, obj):
        goals_list = []
        if isinstance(obj.weekly_goals, list):
            for g in obj.weekly_goals:
                if isinstance(g, dict):
                    status = "Completed" if g.get('completed') else "In Progress"
                    goals_list.append(f"Weekly: {g.get('text')} ({status})")
        if isinstance(obj.monthly_goals, list):
            for g in obj.monthly_goals:
                if isinstance(g, dict):
                    status = "Completed" if g.get('completed') else "In Progress"
                    goals_list.append(f"Monthly: {g.get('text')} ({status})")
        
        if not goals_list:
            goals_list = [
                f"Achieve target ELO of {obj.target_rating}",
                f"Maintain {obj.target_attendance_rate}%+ lesson attendance rate",
                f"Maintain {obj.target_homework_rate}%+ homework completion rate"
            ]
        return goals_list

    def get_coach_recommendations(self, obj):
        return obj.coach_notes or "Focus on analyzing your games and solving puzzles daily."

    def get_progress_percent(self, obj):
        from academy.models import SessionStudent, Enrollment
        completed = SessionStudent.objects.filter(student=obj, session__status='completed', attendance_status='present').count()
        enrolls = Enrollment.objects.filter(student=obj)
        purchased = sum(e.sessions_purchased for e in enrolls)
        if purchased > 0:
            return min(round((completed / purchased) * 100), 100)
        return 0

    def get_package_tracking(self, obj):
        from datetime import timedelta
        from django.utils import timezone
        from academy.models import SessionStudent, Enrollment
        enrollments = Enrollment.objects.filter(student=obj).order_by('created_at')
        completed_count = SessionStudent.objects.filter(student=obj, session__status='completed', attendance_status='present').count()
        
        tracking_list = []
        remaining_completed = completed_count
        for enroll in enrollments:
            purchased = enroll.sessions_purchased
            consumed = min(remaining_completed, purchased)
            remaining_completed -= consumed
            remaining = purchased - consumed
            
            expiry_date = enroll.created_at + timedelta(days=180)
            
            tracking_list.append({
                'id': str(enroll.id),
                'plan_name': enroll.plan_name,
                'purchased': purchased,
                'consumed': consumed,
                'remaining': remaining,
                'expiry_date': expiry_date.strftime('%Y-%m-%d'),
                'status': 'expired' if timezone.now() > expiry_date else ('active' if remaining > 0 else 'completed')
            })
        return tracking_list


    def update(self, instance, validated_data):
        parent_name = validated_data.get('parent_name', instance.parent_name)
        parent_email = validated_data.get('parent_email', instance.parent_email)
        
        instance = super().update(instance, validated_data)

        if parent_email:
            if not User.objects.filter(email=parent_email).exists():
                p_first = parent_name.split(' ')[0] if parent_name else 'Parent'
                p_last = ' '.join(parent_name.split(' ')[1:]) if parent_name and len(parent_name.split(' ')) > 1 else ''
                User.objects.create_user(
                    email=parent_email,
                    password='Parent2026!',
                    first_name=p_first,
                    last_name=p_last,
                    role='parent'
                )
        return instance


class SessionStudentSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)
    student_id = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(), source='student', write_only=True
    )

    class Meta:
        model = SessionStudent
        fields = ('id', 'student', 'student_id', 'attendance_status', 'feedback')


class ZoomMeetingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ZoomMeeting
        fields = ('zoom_meeting_id', 'join_url', 'start_url')


class SessionSerializer(serializers.ModelSerializer):
    coach = CoachSerializer(read_only=True)
    coach_id = serializers.PrimaryKeyRelatedField(
        queryset=Coach.objects.all(), source='coach', write_only=True
    )
    students = SessionStudentSerializer(source='session_participants', many=True, read_only=True)
    zoom_meeting = ZoomMeetingSerializer(read_only=True)
    recording_drive_link = serializers.SerializerMethodField()

    class Meta:
        model = Session
        fields = (
            'id', 'title', 'class_type', 'coach', 'coach_id', 'scheduled_start', 'scheduled_end',
            'actual_duration_minutes', 'status', 'notes', 'topics_covered', 'students', 'zoom_meeting',
            'recording_drive_link', 'created_at'
        )

    def get_recording_drive_link(self, obj):
        if not obj.notes:
            return None
        import re
        match = re.search(r'\[RECORDING:(.*?)\]', obj.notes)
        if match:
            return match.group(1)
        return None



class SessionCreateUpdateSerializer(serializers.ModelSerializer):
    coach_id = serializers.PrimaryKeyRelatedField(
        queryset=Coach.objects.all(), source='coach'
    )
    student_ids = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=Student.objects.all()),
        write_only=True,
        required=False
    )

    class Meta:
        model = Session
        fields = ('id', 'title', 'class_type', 'coach_id', 'scheduled_start', 'scheduled_end', 'student_ids')

    def validate(self, attrs):
        scheduled_start = attrs.get('scheduled_start')
        scheduled_end = attrs.get('scheduled_end')
        coach = attrs.get('coach')
        student_ids = attrs.get('student_ids', [])

        if scheduled_start and scheduled_end:
            if scheduled_start >= scheduled_end:
                raise serializers.ValidationError("Scheduled start time must be before scheduled end time.")

            from django.utils import timezone
            if timezone.is_naive(scheduled_start):
                scheduled_start = timezone.make_aware(scheduled_start)
            if timezone.is_naive(scheduled_end):
                scheduled_end = timezone.make_aware(scheduled_end)

            # Prevent coach double booking
            overlapping_coach = Session.objects.filter(
                coach=coach,
                status='scheduled',
                scheduled_start__lt=scheduled_end,
                scheduled_end__gt=scheduled_start
            )
            if self.instance:
                overlapping_coach = overlapping_coach.exclude(id=self.instance.id)

            if overlapping_coach.exists():
                raise serializers.ValidationError(
                    f"Coach {coach.user.first_name} {coach.user.last_name} is already booked for another session during this time."
                )

            # Prevent student double booking
            for student in student_ids:
                overlapping_student = Session.objects.filter(
                    session_participants__student=student,
                    status='scheduled',
                    scheduled_start__lt=scheduled_end,
                    scheduled_end__gt=scheduled_start
                )
                if self.instance:
                    overlapping_student = overlapping_student.exclude(id=self.instance.id)

                if overlapping_student.exists():
                    raise serializers.ValidationError(
                        f"Student {student.user.first_name} {student.user.last_name} is already booked for another session during this time."
                    )

        return attrs

    def create(self, validated_data):
        student_ids = validated_data.pop('student_ids', [])
        session = Session.objects.create(**validated_data)
        
        # Add students to session
        for student in student_ids:
            SessionStudent.objects.create(session=session, student=student)
            
        return session

    def update(self, instance, validated_data):
        student_ids = validated_data.pop('student_ids', None)
        instance = super().update(instance, validated_data)

        if student_ids is not None:
            current_student_ids = set(instance.session_participants.values_list('student_id', flat=True))
            new_student_ids = set([s.id for s in student_ids])

            # Delete removed ones
            SessionStudent.objects.filter(session=instance, student_id__in=current_student_ids - new_student_ids).delete()

            # Add new ones
            for student in student_ids:
                if student.id not in current_student_ids:
                    SessionStudent.objects.create(session=instance, student=student)

        return instance


class EnrollmentSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)
    student_id = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(), source='student', write_only=True
    )

    class Meta:
        model = Enrollment
        fields = ('id', 'student', 'student_id', 'plan_name', 'sessions_purchased', 'amount_paid', 'currency', 'payment_status', 'created_at')

    def create(self, validated_data):
        enrollment = super().create(validated_data)
        # Update student's session balance
        student = enrollment.student
        student.session_balance += enrollment.sessions_purchased
        student.save()
        return enrollment


class DemoBookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = DemoBooking
        fields = '__all__'


class GalleryImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = GalleryImage
        fields = '__all__'


class MonthlyStudentReportSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='student.user.get_full_name')

    class Meta:
        model = MonthlyStudentReport
        fields = '__all__'

