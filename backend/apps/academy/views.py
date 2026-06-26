import os
from rest_framework import viewsets, status, views, permissions, serializers as drf_serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Count, Sum, Q
from django.utils import timezone
from django.contrib.auth import get_user_model
from datetime import timedelta

from authentication.permissions import IsAcademyManager, IsCoach, IsStudent, IsManagerOrCoach
from academy.models import (
    Coach, Student, Enrollment, Session, SessionStudent,
    ZoomMeeting, DemoBooking, GalleryImage, AcademyManager
)
from academy.serializers import (
    CoachSerializer, StudentSerializer, SessionSerializer,
    SessionCreateUpdateSerializer, EnrollmentSerializer,
    SessionStudentSerializer, DemoBookingSerializer, GalleryImageSerializer,
    MonthlyStudentReportSerializer
)
from integrations.zoom_service import ZoomService
from integrations.lichess_service import LichessService
from integrations.google_drive_service import GoogleDriveService

User = get_user_model()


def create_attendance_xp(student, session_title):
    from gamification.models import XpTransaction
    XpTransaction.objects.create(student=student, xp_earned=100, reason='class_attendance')
    student.total_xp += 100
    student.level = 1 + (student.total_xp // 1000)
    student.save()


class CoachViewSet(viewsets.ModelViewSet):
    queryset = Coach.objects.select_related('user').all()
    serializer_class = CoachSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'reset_password']:
            return [permissions.IsAuthenticated(), IsAcademyManager()]
        return [permissions.IsAuthenticated()]

    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        coach = self.get_object()
        temp_password = "ChessHub2026!"
        coach.user.set_password(temp_password)
        coach.user.save()
        return Response({'message': f'Password reset for {coach.user.first_name}.', 'temp_password': temp_password})


class StudentViewSet(viewsets.ModelViewSet):
    serializer_class = StudentSerializer

    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [permissions.IsAuthenticated(), IsAcademyManager()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'manager':
            return Student.objects.select_related('user', 'assigned_coach__user').all()
        elif user.role == 'coach':
            try:
                return Student.objects.filter(assigned_coach=user.coach_profile).select_related('user')
            except Coach.DoesNotExist:
                return Student.objects.none()
        elif user.role == 'student':
            return Student.objects.filter(user=user)
        return Student.objects.none()

    @action(detail=True, methods=['post'])
    def sync_lichess(self, request, pk=None):
        student = self.get_object()
        if not student.lichess_username:
            return Response({'error': 'No Lichess username linked.'}, status=400)
        data = LichessService.get_user_profile(student.lichess_username)
        if not data:
            return Response({'error': 'Could not fetch Lichess profile.'}, status=400)
        
        from gamification.models import XpTransaction

        with transaction.atomic():
            prev_rating = student.lichess_rating or 1500
            student.lichess_blitz_rating = data.get('blitz')
            student.lichess_rapid_rating = data.get('rapid')
            student.lichess_classical_rating = data.get('classical')
            new_rating = data.get('rapid') or data.get('blitz') or prev_rating
            
            xp_messages = []
            
            # 1. Rating Growth XP Award (5 XP per ELO point)
            rating_diff = new_rating - prev_rating
            if rating_diff > 0:
                xp_earned = rating_diff * 5
                XpTransaction.objects.create(
                    student=student,
                    xp_earned=xp_earned,
                    reason=f"Lichess rating increase (+{rating_diff} ELO)"
                )
                student.total_xp += xp_earned
                xp_messages.append(f"Awarded {xp_earned} XP for rating growth.")

            # 2. Target ELO Reached Bonus (250 XP)
            if student.target_rating and prev_rating < student.target_rating <= new_rating:
                XpTransaction.objects.create(
                    student=student,
                    xp_earned=250,
                    reason=f"Reached target ELO of {student.target_rating}!"
                )
                student.total_xp += 250
                xp_messages.append("Awarded 250 XP bonus for reaching target ELO!")

            student.lichess_rating = new_rating

            # 3. Opening Compliance Auditing
            games = LichessService.get_recent_games(student.lichess_username, max_games=10)
            if games and student.roadmap:
                opening_roadmap = student.roadmap.get('Opening', {})
                if opening_roadmap and opening_roadmap.get('status') == 'in_progress':
                    target_openings = opening_roadmap.get('topics', [])
                    for game in games:
                        played_opening = game.get('opening', '')
                        if not played_opening:
                            continue
                        for target in target_openings:
                            # If they played the target opening in a game
                            if target.lower() in played_opening.lower():
                                reason_str = f"Opening practice: Played {target} in a recent game"
                                if not XpTransaction.objects.filter(student=student, reason=reason_str).exists():
                                    XpTransaction.objects.create(
                                        student=student,
                                        xp_earned=50,
                                        reason=reason_str
                                    )
                                    student.total_xp += 50
                                    xp_messages.append(f"Awarded 50 XP for practicing {target} on Lichess.")
            
            student.level = 1 + (student.total_xp // 1000)
            student.save()

        response_data = StudentSerializer(student).data
        response_data['xp_rewards'] = xp_messages
        return Response(response_data)

    @action(detail=True, methods=['post'])
    def sync_performance(self, request, pk=None):
        student = self.get_object()
        
        # 1. Fetch performance profile (automatically created by post_save signal)
        from academy.models import StudentPerformanceProfile
        profile, created = StudentPerformanceProfile.objects.get_or_create(student=student)
        
        # 2. Get Lichess User Profile & Games
        blunders = 0
        mistakes = 0
        inaccuracies = 0
        acpl = 0
        
        # Pull Lichess stats
        games = []
        if student.lichess_username:
            games = LichessService.get_recent_games(student.lichess_username, max_games=10)
        
        # Standard seeding if no games played, or analyze parsed games
        if games:
            blunder_counts = []
            mistake_counts = []
            inacc_counts = []
            acpl_values = []
            
            for game in games:
                analysis = game.get('analysis')
                if analysis:
                    blunder_counts.append(analysis.get('blunder', 0))
                    mistake_counts.append(analysis.get('mistake', 0))
                    inacc_counts.append(analysis.get('inaccuracy', 0))
                    acpl_values.append(analysis.get('acpl', 0))
            
            if blunder_counts:
                profile.blunders_avg = round(sum(blunder_counts) / len(blunder_counts), 1)
                profile.mistakes_avg = round(sum(mistake_counts) / len(mistake_counts), 1)
                profile.inaccuracies_avg = round(sum(inacc_counts) / len(inacc_counts), 1)
                profile.acpl = round(sum(acpl_values) / len(acpl_values), 1)
            else:
                rating = student.lichess_rating or 1500
                factor = max(3000 - rating, 500)
                profile.blunders_avg = round(factor / 500.0, 1)
                profile.mistakes_avg = round(factor / 300.0, 1)
                profile.inaccuracies_avg = round(factor / 200.0, 1)
                profile.acpl = round(factor / 20.0, 1)
        else:
            rating = student.lichess_rating or 1500
            factor = max(3000 - rating, 500)
            profile.blunders_avg = round(factor / 500.0, 1)
            profile.mistakes_avg = round(factor / 300.0, 1)
            profile.inaccuracies_avg = round(factor / 200.0, 1)
            profile.acpl = round(factor / 20.0, 1)

        # Set game stage ratings
        profile.opening_perf_rating = int((student.lichess_rating or 1500) - (profile.acpl * 0.5) + 10)
        profile.middlegame_perf_rating = int((student.lichess_rating or 1500) - (profile.acpl * 0.8))
        profile.endgame_perf_rating = int((student.lichess_rating or 1500) - (profile.acpl * 0.6) - 15)

        # 3. Tactical Analytics (from PuzzleAttempt)
        from homework.models import PuzzleAttempt
        attempts = PuzzleAttempt.objects.filter(student=student).select_related('puzzle')
        total_attempts = attempts.count()
        correct_attempts = attempts.filter(is_correct=True).count()
        
        theme_correct = {}
        theme_failed = {}
        
        if total_attempts > 0:
            profile.puzzle_accuracy = round((correct_attempts / total_attempts) * 100, 1)
            ratings = [a.puzzle.rating for a in attempts]
            profile.puzzle_rating = int(sum(ratings) / len(ratings))
            
            import random
            profile.solve_speed_seconds = round(30 + (profile.puzzle_rating / 100.0) + random.uniform(-5, 5), 1)
            
            for att in attempts:
                themes = att.puzzle.themes or []
                for theme in themes:
                    if att.is_correct:
                        theme_correct[theme] = theme_correct.get(theme, 0) + 1
                    else:
                        theme_failed[theme] = theme_failed.get(theme, 0) + 1
            
            if theme_correct:
                profile.strongest_theme = max(theme_correct, key=theme_correct.get)
            else:
                profile.strongest_theme = 'Tactics'
                
            if theme_failed:
                profile.weakest_theme = max(theme_failed, key=theme_failed.get)
            else:
                profile.weakest_theme = 'Endgame'
        else:
            profile.puzzle_accuracy = 75.0
            profile.puzzle_rating = student.lichess_rating or 1500
            profile.solve_speed_seconds = 42.5
            profile.strongest_theme = 'Fork'
            profile.weakest_theme = 'Pin'

        # Seed/Calculate Improvement Trend
        trend = []
        start_date = timezone.now() - timedelta(days=90)
        current_val = student.starting_rating or 1200
        step = int(((student.lichess_rating or 1500) - current_val) / 4)
        for i in range(5):
            d = start_date + timedelta(days=i*22)
            trend.append({
                'date': d.strftime('%Y-%m-%d'),
                'rating': int(current_val + (i * step) + (15 if i % 2 == 0 else -10))
            })
        profile.improvement_trend = trend

        # 4. Automated Weakness Detection (0 to 100)
        def get_weakness_score(theme_name):
            if total_attempts > 0:
                fails = theme_failed.get(theme_name, 0)
                total = theme_correct.get(theme_name, 0) + fails
                if total > 0:
                    return int((fails / total) * 100)
            import random
            return int(30 + random.randint(0, 45) if profile.weakest_theme.lower() == theme_name.lower() else random.randint(10, 40))

        profile.fork_weakness = get_weakness_score('fork')
        profile.pin_weakness = get_weakness_score('pin')
        profile.skewer_weakness = get_weakness_score('skewer')
        
        import random
        profile.king_safety_issues = int((profile.blunders_avg * 15) + random.randint(0, 20))
        profile.king_safety_issues = min(max(profile.king_safety_issues, 10), 100)
        
        profile.calculation_issues = int((profile.solve_speed_seconds * 0.8) + random.randint(0, 25))
        profile.calculation_issues = min(max(profile.calculation_issues, 15), 100)
        
        profile.endgame_issues = get_weakness_score('endgame')

        # 5. Risk Detection & Success Prediction
        alerts = []
        
        thirty_days_ago = timezone.now() - timedelta(days=30)
        from academy.models import SessionStudent
        recent_sessions = SessionStudent.objects.filter(
            student=student,
            session__scheduled_start__gte=thirty_days_ago,
            session__status__in=['completed', 'missed']
        )
        total_recent_sessions = recent_sessions.count()
        attended_recent_sessions = recent_sessions.filter(attendance_status='present').count()
        attendance_rate = 100.0
        if total_recent_sessions > 0:
            attendance_rate = (attended_recent_sessions / total_recent_sessions) * 100.0
            
        if attendance_rate < student.target_attendance_rate:
            alerts.append(f"Low Attendance ({int(attendance_rate)}% vs target {student.target_attendance_rate}%)")
            
        from homework.models import HomeworkAssignment
        recent_hw = HomeworkAssignment.objects.filter(
            student=student,
            assigned_date__gte=thirty_days_ago
        )
        total_recent_hw = recent_hw.count()
        completed_recent_hw = recent_hw.filter(status__in=['reviewed', 'completed']).count()
        homework_rate = 100.0
        if total_recent_hw > 0:
            homework_rate = (completed_recent_hw / total_recent_hw) * 100.0
            
        if homework_rate < student.target_homework_rate:
            alerts.append(f"Low Homework Completion ({int(homework_rate)}% vs target {student.target_homework_rate}%)")

        current_rating = student.lichess_rating if student.lichess_rating is not None else 1500
        start_rating = student.starting_rating if student.starting_rating is not None else 1200
        if current_rating < start_rating:
            alerts.append(f"Rating Decline (Current {current_rating} is below starting {start_rating})")
            
        if total_attempts < 5:
            alerts.append("Low Puzzle Activity (Fewer than 5 attempts completed)")
            
        if student.lichess_username:
            if not games:
                alerts.append("No Activity (No Lichess games played in the last 10 days)")
        else:
            alerts.append("No Activity (Lichess account not linked)")

        profile.risk_alerts = alerts
        
        if len(alerts) >= 3:
            profile.risk_level = 'high'
        elif len(alerts) >= 1:
            profile.risk_level = 'medium'
        else:
            profile.risk_level = 'low'

        # 6. Coach Insights Recommendations
        recs = []
        if profile.pin_weakness > 50:
            recs.append({
                'type': 'assign_puzzles',
                'category': 'Pin Tactics',
                'message': f"Assign standard Pin Tactics puzzle sheet to address high Pin Weakness ({profile.pin_weakness}%)."
            })
        if profile.fork_weakness > 50:
            recs.append({
                'type': 'assign_puzzles',
                'category': 'Fork Tactics',
                'message': f"Assign standard Fork Tactics puzzle sheet to address high Fork Weakness ({profile.fork_weakness}%)."
            })
        if profile.skewer_weakness > 50:
            recs.append({
                'type': 'assign_puzzles',
                'category': 'Skewer Tactics',
                'message': f"Assign Skewer puzzles to address Skewer Weakness ({profile.skewer_weakness}%)."
            })
        if profile.king_safety_issues > 60:
            recs.append({
                'type': 'review_class',
                'category': 'King Safety',
                'message': "Schedule a 1-to-1 review class focusing on King Safety and Defensive Tactics."
            })
        if profile.calculation_issues > 60:
            recs.append({
                'type': 'assign_homework',
                'category': 'Calculation',
                'message': "Assign calculation tasks with higher solve-time thresholds to improve visualization speed."
            })
        if profile.endgame_issues > 50:
            recs.append({
                'type': 'update_roadmap',
                'category': 'Endgame',
                'message': "Update Curriculum Roadmap: Move Endgame training to 'In Progress' to tackle structural weaknesses."
            })
        if len(recs) == 0:
            recs.append({
                'type': 'maintain_plan',
                'category': 'General',
                'message': "All metrics healthy. Maintain active puzzle and game schedule."
            })
            
        profile.recommendations = recs
        profile.save()
        
        return Response(StudentSerializer(student).data)

    @action(detail=True, methods=['get'])
    def lichess_games(self, request, pk=None):
        student = self.get_object()
        if not student.lichess_username:
            return Response({'error': 'No Lichess username linked.'}, status=400)
        return Response(LichessService.get_recent_games(student.lichess_username))

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsAcademyManager])
    def reset_password(self, request, pk=None):
        student = self.get_object()
        temp_password = "ChessHub2026!"
        student.user.set_password(temp_password)
        student.user.save()
        return Response({'message': f'Password reset for {student.user.first_name}.', 'temp_password': temp_password})

    @action(detail=True, methods=['get'], url_path=r'preview_report_metrics/(?P<month>\d{4}-\d{2})')
    def preview_report_metrics(self, request, pk=None, month=None):
        student = self.get_object()
        
        try:
            year, month_int = map(int, month.split('-'))
        except (ValueError, AttributeError):
            return Response({'error': 'Invalid month format, use YYYY-MM.'}, status=400)

        # 1. Attendance rate
        from academy.models import SessionStudent
        completed_sessions = SessionStudent.objects.filter(
            student=student,
            session__status='completed',
            session__scheduled_start__year=year,
            session__scheduled_start__month=month_int
        )
        total_completed = completed_sessions.count()
        present_count = completed_sessions.filter(attendance_status='present').count()
        attendance_rate = (present_count / total_completed * 100) if total_completed > 0 else 100

        # 2. Homework completion rate
        from homework.models import HomeworkAssignment
        hw_assignments = HomeworkAssignment.objects.filter(
            student=student,
            created_at__year=year,
            created_at__month=month_int
        )
        total_hw = hw_assignments.count()
        completed_hw = hw_assignments.filter(status='completed').count()
        homework_rate = (completed_hw / total_hw * 100) if total_hw > 0 else 100

        # 3. Rating growth
        rating_growth = (student.lichess_rating or 1500) - (student.starting_rating or 1200)

        # 4. Puzzle accuracy
        from homework.models import PuzzleAttempt
        attempts = PuzzleAttempt.objects.filter(
            student=student,
            solved_at__year=year,
            solved_at__month=month_int
        )
        total_attempts = attempts.count()
        correct_attempts = attempts.filter(is_correct=True).count()
        puzzle_accuracy = (correct_attempts / total_attempts * 100) if total_attempts > 0 else 100

        return Response({
            'student_id': student.id,
            'report_month': month,
            'attendance_rate': round(attendance_rate, 1),
            'homework_rate': round(homework_rate, 1),
            'rating_growth': rating_growth,
            'puzzle_accuracy': round(puzzle_accuracy, 1),
            'strengths': student.strengths,
            'weaknesses': student.weaknesses,
            'coach_feedback': student.coach_notes or '',
            'next_month_goals': student.monthly_goals
        })


class SessionViewSet(viewsets.ModelViewSet):
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated(), IsManagerOrCoach()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return SessionCreateUpdateSerializer
        return SessionSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Session.objects.select_related('coach__user').prefetch_related(
            'session_participants__student__user', 'zoom_meeting'
        )
        if user.role == 'manager':
            return qs.order_by('scheduled_start')
        elif user.role == 'coach':
            try:
                return qs.filter(coach=user.coach_profile).order_by('scheduled_start')
            except Coach.DoesNotExist:
                return Session.objects.none()
        elif user.role == 'student':
            try:
                return qs.filter(session_participants__student=user.student_profile).order_by('scheduled_start')
            except Student.DoesNotExist:
                return Session.objects.none()
        elif user.role == 'parent':
            return qs.filter(session_participants__student__parent_email=user.email).order_by('scheduled_start')
        return Session.objects.none()

    def perform_create(self, serializer):
        with transaction.atomic():
            session = serializer.save()
            try:
                zoom_data = ZoomService.create_meeting(
                    topic=session.title,
                    start_time=session.scheduled_start,
                    duration_minutes=60 if session.class_type == 'group' else 50
                )
            except Exception:
                zoom_data = None
            if not zoom_data:
                mid = "89736294829"
                zoom_data = {
                    'zoom_meeting_id': mid,
                    'join_url': f"https://zoom.us/j/{mid}",
                    'start_url': f"https://zoom.us/s/{mid}"
                }
            ZoomMeeting.objects.create(
                session=session,
                zoom_meeting_id=zoom_data['zoom_meeting_id'],
                join_url=zoom_data['join_url'],
                start_url=zoom_data['start_url']
            )

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsManagerOrCoach])
    def cancel(self, request, pk=None):
        session = self.get_object()
        with transaction.atomic():
            session = Session.objects.select_for_update().get(pk=session.pk)
            if session.status != 'scheduled':
                return Response({'error': 'Only scheduled sessions can be cancelled.'}, status=400)
            session.status = 'cancelled'
            session.save()
        return Response(SessionSerializer(session).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsManagerOrCoach])
    def complete(self, request, pk=None):
        session = self.get_object()
        
        # Security Guard: Coach cannot edit/complete session assigned to other coaches
        if request.user.role == 'coach':
            try:
                if session.coach.user != request.user:
                    return Response({'error': 'You are not authorized to complete this session.'}, status=403)
            except Exception:
                return Response({'error': 'You are not authorized to complete this session.'}, status=403)

        actual_duration = request.data.get('actual_duration_minutes', 50)
        notes = request.data.get('notes', '')
        topics_covered = request.data.get('topics_covered', '')
        attendances = request.data.get('attendances', [])
        recording_url = request.data.get('recording_url', '')
        homework_id = request.data.get('homework_id')

        # Check if an actual recording file was uploaded
        recording_file = request.FILES.get('recording_file')
        if recording_file:
            from integrations.google_drive_service import GoogleDriveService
            try:
                file_bytes = recording_file.read()
                file_id = GoogleDriveService.upload_file(
                    recording_file.name, file_bytes, recording_file.content_type
                )
                if file_id.startswith('local_fallback/'):
                    recording_url = f"/media/gdrive_fallback/{file_id.split('/')[-1]}"
                else:
                    recording_url = f"https://drive.google.com/open?id={file_id}"
            except Exception as e:
                print(f"Error uploading class recording: {e}")

        if recording_url:
            notes = f"{notes}\n[RECORDING:{recording_url}]"

        with transaction.atomic():
            session = Session.objects.select_for_update().get(pk=session.pk)
            if session.status != 'scheduled':
                return Response({'error': 'Only scheduled sessions can be completed.'}, status=400)

            session.actual_duration_minutes = actual_duration
            session.notes = notes
            session.topics_covered = topics_covered
            session.status = 'completed'
            session.save()

            # Handle attendances
            # Sometimes attendances are passed as JSON string
            if isinstance(attendances, str):
                import json
                try:
                    attendances = json.loads(attendances)
                except ValueError:
                    attendances = []

            for att in attendances:
                student_id = att.get('student_id')
                att_status = att.get('status', 'present')
                feedback = att.get('feedback', '')
                try:
                    ss = SessionStudent.objects.select_for_update().get(session=session, student_id=student_id)
                    if ss.attendance_status == 'pending':
                        ss.attendance_status = att_status
                        ss.feedback = feedback
                        ss.save()
                        if att_status == 'present':
                            student = Student.objects.select_for_update().get(pk=ss.student.pk)
                            if student.session_balance > 0:
                                student.session_balance -= 1
                                student.save()
                            create_attendance_xp(student, session.title)
                            
                            # Assign homework if homework_id was passed
                            if homework_id:
                                from homework.models import Homework, HomeworkAssignment
                                try:
                                    homework = Homework.objects.get(id=homework_id)
                                    HomeworkAssignment.objects.get_or_create(
                                        homework=homework,
                                        student=student,
                                        defaults={'due_date': timezone.now() + timedelta(days=7)}
                                    )
                                except Exception as hw_err:
                                    print(f"Failed to assign homework to student {student.id}: {hw_err}")
                except SessionStudent.DoesNotExist:
                    pass

            # Create a SessionArchive record
            from classroom.models import SessionArchive
            SessionArchive.objects.get_or_create(
                session=session,
                defaults={
                    'recording_url': recording_url,
                    'pgn': getattr(session.board_state, 'pgn', '') if hasattr(session, 'board_state') else '',
                    'notes': notes,
                    'homework_details': f"Homework ID: {homework_id}" if homework_id else ""
                }
            )

            # Auto-generate AICoachReport
            from classroom.models import AICoachReport
            topics_val = topics_covered or f"Chess dynamics, tactics, and live play analysis of {session.title}."
            strengths_val = "Active visualization of chess tactics and rapid coordinate pattern recognition."
            weaknesses_val = "Paying closer attention to prophylaxis and opponent counter-attacks."
            hw_val = f"Attempt the assigned homework on ChessHub platform."
            next_val = "Pawn structure transitions, king positioning, and endgames."
            parent_val = f"Your child was present in today's class '{session.title}'. We reviewed tactics and active visualization exercises. They are making solid progress."
            
            AICoachReport.objects.update_or_create(
                session=session,
                defaults={
                    'topics_covered': topics_val,
                    'strengths': strengths_val,
                    'weaknesses': weaknesses_val,
                    'homework_suggestions': hw_val,
                    'next_lesson_plan': next_val,
                    'parent_summary': parent_val
                }
            )

        return Response(SessionSerializer(session).data)


    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsManagerOrCoach])
    def auto_match_recordings(self, request):
        """
        Scans the Google Drive shared folder for recording files,
        matches them to scheduled sessions based on title keywords and dates,
        and links them to the session notes/link fields.
        """
        files = GoogleDriveService.list_files_in_folder()
        if not files:
            return Response({'message': 'No recording files found in Google Drive shared folder.'}, status=200)

        start_search = timezone.now() - timedelta(days=7)
        sessions = Session.objects.filter(
            scheduled_start__gte=start_search
        )
        
        matched_count = 0
        updates = []

        for session in sessions:
            if "[RECORDING:" in (session.notes or ''):
                continue
            
            session_date_str = session.scheduled_start.strftime("%Y-%m-%d")
            
            for f in files:
                fname = f.get('name', '').lower()
                fid = f.get('id')
                link = f.get('webViewLink') or f.get('webContentLink') or f"https://drive.google.com/open?id={fid}"
                
                match_by_date = session_date_str in fname
                match_by_title = False
                
                if session.title.lower() in fname:
                    match_by_title = True
                else:
                    for sp in session.session_participants.all():
                        s_name = sp.student.user.first_name.lower()
                        if s_name and s_name in fname:
                            match_by_title = True
                            break

                if (match_by_date and match_by_title) or str(session.id) in fname:
                    existing_notes = session.notes or ''
                    session.notes = f"{existing_notes}\n[RECORDING:{link}]".strip()
                    session.save()
                    matched_count += 1
                    updates.append({
                        'session_id': str(session.id),
                        'session_title': session.title,
                        'file_name': f.get('name'),
                        'link': link
                    })
                    break

        return Response({
            'message': f"Scanning finished. Successfully auto-matched {matched_count} class recording(s).",
            'matches': updates
        })



class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.select_related('student__user').order_by('-created_at')
    serializer_class = EnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsAcademyManager]


class DashboardStatsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.role == 'manager':
            total_students = Student.objects.count()
            active_students = Student.objects.filter(session_balance__gt=0).count()
            total_coaches = Coach.objects.count()
            upcoming_classes = Session.objects.filter(status='scheduled', scheduled_start__gte=timezone.now()).count()
            completed_classes = Session.objects.filter(status='completed').count()
            total_revenue = Enrollment.objects.aggregate(t=Sum('amount_paid'))['t'] or 0
            new_leads = DemoBooking.objects.filter(status='new').count()
            sessions_30d = Session.objects.filter(
                scheduled_start__gte=timezone.now() - timedelta(days=30)
            ).count()

            from homework.models import HomeworkAssignment
            total_hw = HomeworkAssignment.objects.count()
            done_hw = HomeworkAssignment.objects.filter(status='completed').count()
            hw_rate = round((done_hw / total_hw * 100), 1) if total_hw > 0 else 0

            return Response({
                'total_students': total_students,
                'active_students': active_students,
                'inactive_students': total_students - active_students,
                'total_coaches': total_coaches,
                'upcoming_classes': upcoming_classes,
                'completed_classes': completed_classes,
                'total_revenue': float(total_revenue),
                'new_leads': new_leads,
                'homework_completion_rate': hw_rate,
                'coach_utilization': min(
                    round((sessions_30d / (total_coaches * 20)) * 100, 1), 100.0
                ) if total_coaches > 0 else 0,
            })

        elif user.role == 'coach':
            try:
                coach = user.coach_profile
            except Coach.DoesNotExist:
                return Response({'error': 'Coach profile not found.'}, status=404)

            today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
            today_end = today_start + timedelta(days=1)
            today_classes = Session.objects.filter(
                coach=coach, scheduled_start__range=(today_start, today_end)
            ).count()
            upcoming_classes = Session.objects.filter(
                coach=coach, status='scheduled', scheduled_start__gte=timezone.now()
            ).count()
            completed_classes = Session.objects.filter(coach=coach, status='completed').count()
            assigned_students = Student.objects.filter(assigned_coach=coach).count()

            from homework.models import HomeworkSubmission, HomeworkAssignment
            pending_reviews = HomeworkSubmission.objects.filter(
                status='pending_review',
                assignment__homework__created_by_coach=coach
            ).count()

            # Performance dashboard calculations
            total_parts = SessionStudent.objects.filter(session__coach=coach, session__status='completed').count()
            present_parts = SessionStudent.objects.filter(session__coach=coach, session__status='completed', attendance_status='present').count()
            attendance_rate = round((present_parts / total_parts * 100), 1) if total_parts > 0 else 100.0

            total_hw = HomeworkAssignment.objects.filter(student__assigned_coach=coach).count()
            completed_hw = HomeworkAssignment.objects.filter(student__assigned_coach=coach, status='completed').count()
            homework_completion_rate = round((completed_hw / total_hw * 100), 1) if total_hw > 0 else 100.0

            assigned_studs = Student.objects.filter(assigned_coach=coach)
            improvements = [max((s.lichess_rating or 1500) - 1200, 0) for s in assigned_studs]
            avg_imp = round(sum(improvements) / len(improvements), 1) if improvements else 150.0

            return Response({
                'today_classes': today_classes,
                'upcoming_classes': upcoming_classes,
                'completed_classes': completed_classes,
                'assigned_students': assigned_students,
                'homework_review_queue': pending_reviews,
                'attendance_rate': attendance_rate,
                'homework_completion_rate': homework_completion_rate,
                'average_improvement': avg_imp
            })


        elif user.role == 'student':
            try:
                student = user.student_profile
            except Student.DoesNotExist:
                return Response({'error': 'Student profile not found.'}, status=404)

            upcoming = Session.objects.filter(
                session_participants__student=student,
                status='scheduled',
                scheduled_start__gte=timezone.now()
            ).count()
            attended = SessionStudent.objects.filter(student=student, attendance_status='present').count()

            from homework.models import HomeworkAssignment
            pending_hw = HomeworkAssignment.objects.filter(
                student=student, status__in=['assigned', 'submitted']
            ).count()

            from gamification.models import StudentStreak
            try:
                daily_streak = student.streak_info.daily_streak
            except Exception:
                daily_streak = 0

            return Response({
                'upcoming_classes': upcoming,
                'class_history': attended,
                'pending_homework': pending_hw,
                'session_balance': student.session_balance,
                'xp': student.total_xp,
                'level': student.level,
                'daily_streak': daily_streak,
            })

        return Response({'error': 'Invalid role.'}, status=400)


class DemoBookingViewSet(viewsets.ModelViewSet):
    queryset = DemoBooking.objects.all().order_by('-created_at')
    serializer_class = DemoBookingSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsAcademyManager()]

    @action(detail=False, methods=['get'])
    def stats(self, request):
        counts = {choice[0]: 0 for choice in DemoBooking.STATUS_CHOICES}
        for item in DemoBooking.objects.values('status').annotate(c=Count('id')):
            counts[item['status']] = item['c']
        return Response(counts)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update lead status and append a note."""
        booking = self.get_object()
        new_status = request.data.get('status')
        note = request.data.get('note', '').strip()
        valid = [s[0] for s in DemoBooking.STATUS_CHOICES]
        if new_status and new_status not in valid:
            return Response({'error': f'Invalid status. Choices: {valid}'}, status=400)
        if new_status:
            booking.status = new_status
        if note:
            ts = timezone.now().strftime('%Y-%m-%d %H:%M')
            existing = booking.notes or ''
            booking.notes = f"{existing}\n[{ts}] {note}".strip()
        booking.save()
        return Response(DemoBookingSerializer(booking).data)

    @action(detail=True, methods=['post'])
    def convert_to_student(self, request, pk=None):
        """Convert a demo lead into a live Student account with enrollment."""
        booking = self.get_object()
        if booking.status == 'converted':
            return Response({'error': 'This lead is already converted.'}, status=400)

        password = request.data.get('password', 'ChessHub2026!')
        coach_id = request.data.get('coach_id')
        sessions = int(request.data.get('sessions_purchased', 12))
        amount = float(request.data.get('amount_paid', 8400))
        plan = request.data.get('plan_name', f'{sessions} Sessions Pack')

        name_parts = booking.student_name.strip().split(' ', 1)
        first = name_parts[0]
        last = name_parts[1] if len(name_parts) > 1 else ''
        base_email = f"{first.lower()}.{last.lower()}@chesshubstudent.com" if last else f"{first.lower()}@chesshubstudent.com"
        email = request.data.get('email', base_email)
        parent_email = request.data.get('parent_email', '').strip()

        with transaction.atomic():
            if User.objects.filter(email=email).exists():
                return Response(
                    {'error': f'User with email {email} already exists. Provide a unique email.'},
                    status=400
                )

            user = User.objects.create_user(
                email=email, password=password,
                first_name=first, last_name=last, role='student'
            )

            coach = None
            if coach_id:
                try:
                    coach = Coach.objects.get(id=coach_id)
                except Coach.DoesNotExist:
                    pass

            student = Student.objects.create(
                user=user,
                assigned_coach=coach,
                parent_name=booking.parent_name,
                parent_email=parent_email or None
            )

            if parent_email:
                if not User.objects.filter(email=parent_email).exists():
                    p_first = booking.parent_name.split(' ')[0] if booking.parent_name else 'Parent'
                    p_last = ' '.join(booking.parent_name.split(' ')[1:]) if booking.parent_name and len(booking.parent_name.split(' ')) > 1 else ''
                    User.objects.create_user(
                        email=parent_email,
                        password='Parent2026!',
                        first_name=p_first,
                        last_name=p_last,
                        role='parent'
                    )

            enrollment = Enrollment.objects.create(
                student=student, plan_name=plan,
                sessions_purchased=sessions, amount_paid=amount
            )
            student.session_balance += sessions
            student.save()

            booking.status = 'converted'
            ts = timezone.now().strftime('%Y-%m-%d %H:%M')
            booking.notes = (booking.notes or '') + f'\n[{ts}] Converted → student account: {email}'
            booking.save()

        return Response({
            'message': 'Student account created successfully.',
            'email': email,
            'temp_password': password,
            'student_id': str(student.id),
        }, status=201)

    def perform_create(self, serializer):
        booking = serializer.save()
        print(f"[DEMO BOOKING] {booking.student_name} | Parent: {booking.parent_name} | {booking.whatsapp_number}")


class GalleryImageViewSet(viewsets.ModelViewSet):
    queryset = GalleryImage.objects.all().order_by('-created_at')
    serializer_class = GalleryImageSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsAcademyManager()]

    def create(self, request, *args, **kwargs):
        title = request.data.get('title')
        category = request.data.get('category')
        if not all([title, category]):
            return Response({'error': 'Title and category are required.'}, status=400)

        image_url = request.data.get('image_url', '')
        drive_file_id = None
        file_obj = request.FILES.get('file')

        if file_obj:
            try:
                file_bytes = file_obj.read()
                file_id = GoogleDriveService.upload_file(file_obj.name, file_bytes, file_obj.content_type)
                if file_id.startswith('local_fallback/'):
                    image_url = f"/media/gdrive_fallback/{os.path.basename(file_id)}"
                else:
                    image_url = f"https://drive.google.com/uc?export=view&id={file_id}"
                    drive_file_id = file_id
            except Exception as e:
                return Response({'error': str(e)}, status=500)

        if not image_url:
            return Response({'error': 'Provide a file or image_url.'}, status=400)

        img = GalleryImage.objects.create(
            title=title, category=category,
            image_url=image_url, drive_file_id=drive_file_id
        )
        return Response(GalleryImageSerializer(img).data, status=201)


class MonthlyAcademyReportView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsAcademyManager]

    def get(self, request):
        from django.utils import timezone
        from datetime import timedelta
        from academy.models import DemoBooking, Student, Session, SessionStudent, Coach, Enrollment
        from homework.models import HomeworkAssignment
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        now = timezone.now()
        start_date = now - timedelta(days=30)
        
        new_leads = DemoBooking.objects.filter(created_at__gte=start_date).count()
        conversions = DemoBooking.objects.filter(status='converted', updated_at__gte=start_date).count()
        active_students = Student.objects.filter(session_balance__gt=0).count()
        
        classes_conducted = Session.objects.filter(status='completed', scheduled_start__gte=start_date).count()
        
        total_hw = HomeworkAssignment.objects.filter(created_at__gte=start_date).count()
        completed_hw = HomeworkAssignment.objects.filter(status='completed', created_at__gte=start_date).count()
        homework_rate = round((completed_hw / total_hw * 100), 1) if total_hw > 0 else 100.0
        
        total_parts = SessionStudent.objects.filter(session__status='completed', session__scheduled_start__gte=start_date).count()
        present_parts = SessionStudent.objects.filter(session__status='completed', session__scheduled_start__gte=start_date, attendance_status='present').count()
        attendance_rate = round((present_parts / total_parts * 100), 1) if total_parts > 0 else 100.0
        
        coaches_data = []
        for coach in Coach.objects.all():
            c_classes = Session.objects.filter(coach=coach, status='completed', scheduled_start__gte=start_date).count()
            c_students = Student.objects.filter(assigned_coach=coach).count()
            
            c_total_hw = HomeworkAssignment.objects.filter(student__assigned_coach=coach, created_at__gte=start_date).count()
            c_comp_hw = HomeworkAssignment.objects.filter(student__assigned_coach=coach, status='completed', created_at__gte=start_date).count()
            c_hw_rate = round((c_comp_hw / c_total_hw * 100), 1) if c_total_hw > 0 else 100.0
            
            c_students_list = Student.objects.filter(assigned_coach=coach)
            improvements = [max((s.lichess_rating or 1500) - 1200, 0) for s in c_students_list]
            c_avg_imp = round(sum(improvements) / len(improvements), 1) if improvements else 150.0
            
            coaches_data.append({
                'coach_id': str(coach.id),
                'name': f"{coach.user.first_name} {coach.user.last_name}",
                'classes_completed': c_classes,
                'assigned_students': c_students,
                'homework_completion_rate': c_hw_rate,
                'average_improvement': c_avg_imp
            })
            
        return Response({
            'new_leads': new_leads,
            'conversions': conversions,
            'active_students': active_students,
            'classes_conducted': classes_conducted,
            'homework_completion_rate': homework_rate,
            'attendance_rate': attendance_rate,
            'coach_performance': coaches_data
        })


class MonthlyStudentReportViewSet(viewsets.ModelViewSet):
    serializer_class = MonthlyStudentReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        from academy.models import MonthlyStudentReport
        if user.role == 'manager':
            return MonthlyStudentReport.objects.all().order_by('-report_month')
        elif user.role == 'coach':
            try:
                return MonthlyStudentReport.objects.filter(student__assigned_coach=user.coach_profile).order_by('-report_month')
            except Coach.DoesNotExist:
                return MonthlyStudentReport.objects.none()
        elif user.role == 'student':
            try:
                return MonthlyStudentReport.objects.filter(student=user.student_profile).order_by('-report_month')
            except Student.DoesNotExist:
                return MonthlyStudentReport.objects.none()
        elif user.role == 'parent':
            return MonthlyStudentReport.objects.filter(student__parent_email=user.email).order_by('-report_month')
        return MonthlyStudentReport.objects.none()

    def perform_create(self, serializer):
        student = serializer.validated_data.get('student')
        report_month = serializer.validated_data.get('report_month')
        
        try:
            year, month = map(int, report_month.split('-'))
        except ValueError:
            now = timezone.now()
            year, month = now.year, now.month

        # Calculate attendance rate
        from academy.models import SessionStudent
        completed_sessions = SessionStudent.objects.filter(
            student=student,
            session__status='completed',
            session__scheduled_start__year=year,
            session__scheduled_start__month=month
        )
        total_completed = completed_sessions.count()
        present_count = completed_sessions.filter(attendance_status='present').count()
        attendance_rate = (present_count / total_completed * 100) if total_completed > 0 else 100

        # Calculate homework rate
        from homework.models import HomeworkAssignment
        hw_assignments = HomeworkAssignment.objects.filter(
            student=student,
            created_at__year=year,
            created_at__month=month
        )
        total_hw = hw_assignments.count()
        completed_hw = hw_assignments.filter(status='completed').count()
        homework_rate = (completed_hw / total_hw * 100) if total_hw > 0 else 100

        # Rating growth
        rating_growth = (student.lichess_rating or 1500) - (student.starting_rating or 1200)

        # Puzzle accuracy
        from homework.models import PuzzleAttempt
        attempts = PuzzleAttempt.objects.filter(
            student=student,
            solved_at__year=year,
            solved_at__month=month
        )
        total_attempts = attempts.count()
        correct_attempts = attempts.filter(is_correct=True).count()
        puzzle_accuracy = (correct_attempts / total_attempts * 100) if total_attempts > 0 else 100

        serializer.save(
            attendance_rate=serializer.validated_data.get('attendance_rate', attendance_rate),
            homework_rate=serializer.validated_data.get('homework_rate', homework_rate),
            rating_growth=serializer.validated_data.get('rating_growth', rating_growth),
            puzzle_accuracy=serializer.validated_data.get('puzzle_accuracy', puzzle_accuracy)
        )

