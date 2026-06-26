from rest_framework import viewsets, status, permissions, views
from rest_framework.response import Response
from django.db import transaction
from gamification.models import Badge, StudentBadge, XpTransaction, StudentStreak
from gamification.serializers import (
    BadgeSerializer,
    StudentBadgeSerializer,
    XpTransactionSerializer,
    StudentStreakSerializer
)
from academy.models import Student
from authentication.permissions import IsAcademyManager, IsCoach, IsStudent, IsManagerOrCoach


class BadgeViewSet(viewsets.ModelViewSet):
    queryset = Badge.objects.all().order_by('name')
    serializer_class = BadgeSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsAcademyManager()]
        return [permissions.IsAuthenticated()]


class StudentBadgeAwardView(views.APIView):
    permission_classes = [permissions.IsAuthenticated, IsManagerOrCoach]


    def post(self, request):
        student_id = request.data.get('student_id')
        badge_id = request.data.get('badge_id')

        if not student_id or not badge_id:
            return Response({'error': 'student_id and badge_id are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            student = Student.objects.get(id=student_id)
            badge = Badge.objects.get(id=badge_id)
        except (Student.DoesNotExist, Badge.DoesNotExist):
            return Response({'error': 'Student or Badge not found.'}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            student_badge, created = StudentBadge.objects.get_or_create(
                student=student,
                badge=badge
            )
            if created:
                # Add XP bonus for the badge!
                if badge.xp_bonus > 0:
                    XpTransaction.objects.create(
                        student=student,
                        xp_earned=badge.xp_bonus,
                        reason='badge_award'
                    )
                    student.total_xp += badge.xp_bonus
                    student.level = 1 + (student.total_xp // 1000)
                    student.save()
            else:
                return Response({'message': 'Student already has this badge.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response(StudentBadgeSerializer(student_badge).data, status=status.HTTP_201_CREATED)


class XpTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = XpTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'manager':
            return XpTransaction.objects.all().order_by('-created_at')
        elif user.role == 'student':
            try:
                student = user.student_profile
                return XpTransaction.objects.filter(student=student).order_by('-created_at')
            except Student.DoesNotExist:
                return XpTransaction.objects.none()
        elif user.role == 'coach':
            # Coaches can see transactions for their assigned students
            try:
                coach = user.coach_profile
                return XpTransaction.objects.filter(student__assigned_coach=coach).order_by('-created_at')
            except Coach.DoesNotExist:
                return XpTransaction.objects.none()
        return XpTransaction.objects.none()


class LeaderboardView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Fetch students sorted by total_xp
        students = Student.objects.select_related('user').order_by('-total_xp')
        
        leaderboard = []
        for index, student in enumerate(students, start=1):
            leaderboard.append({
                'rank': index,
                'student_id': student.id,
                'name': f"{student.user.first_name} {student.user.last_name}",
                'email': student.user.email,
                'lichess_username': student.lichess_username,
                'total_xp': student.total_xp,
                'level': student.level,
                'badges_count': student.badges_earned.count()
            })
            
        return Response(leaderboard, status=status.HTTP_200_OK)
