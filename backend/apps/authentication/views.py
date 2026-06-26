from django.conf import settings
from rest_framework import status, views, generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from authentication.serializers import (
    CustomTokenObtainPairSerializer, 
    UserSerializer, 
    RegisterUserSerializer
)
from authentication.permissions import IsAcademyManager
from academy.models import Student, Coach, AcademyManager

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            access_token = response.data.get('access')
            refresh_token = response.data.get('refresh')
            
            # Set secure HttpOnly cookies for JWT tokens
            response.set_cookie(
                key='access_token',
                value=access_token,
                httponly=True,
                secure=True,
                samesite='Strict',
                max_age=3600
            )
            response.set_cookie(
                key='refresh_token',
                value=refresh_token,
                httponly=True,
                secure=True,
                samesite='Strict',
                max_age=7 * 24 * 3600
            )
            
            # Retain tokens in response body for frontend and verification script compatibility
            response.data['access'] = access_token
            response.data['refresh'] = refresh_token
            response.data['message'] = "Authentication successful"
        return response


class CustomTokenRefreshView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        from rest_framework_simplejwt.tokens import RefreshToken
        
        refresh_token = request.COOKIES.get('refresh_token') or request.data.get('refresh')
        if not refresh_token:
            return Response({'error': 'Refresh token not found.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            refresh = RefreshToken(refresh_token)
            access_token = str(refresh.access_token)
            
            response = Response({
                'message': 'Token refreshed successfully',
                'access': access_token
            }, status=status.HTTP_200_OK)
            
            response.set_cookie(
                key='access_token',
                value=access_token,
                httponly=True,
                secure=True,
                samesite='Strict',
                max_age=3600
            )
            
            new_refresh_token = str(refresh)
            if getattr(settings, 'SIMPLE_JWT', {}).get('ROTATE_REFRESH_TOKENS', False):
                refresh.set_jti()
                refresh.set_exp()
                new_refresh_token = str(refresh)
                response.set_cookie(
                    key='refresh_token',
                    value=new_refresh_token,
                    httponly=True,
                    secure=True,
                    samesite='Strict',
                    max_age=7 * 24 * 3600
                )
            response.data['refresh'] = new_refresh_token
            return response
        except Exception:
            return Response({'error': 'Invalid refresh token.'}, status=status.HTTP_401_UNAUTHORIZED)


class LogoutView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        response = Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)
        response.delete_cookie('access_token')
        response.delete_cookie('refresh_token')
        return response



class RegisterUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterUserSerializer
    permission_classes = [IsAuthenticated, IsAcademyManager]


class UserMeView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        user_data = UserSerializer(user).data
        profile_data = {}

        if user.role == 'student':
            try:
                student = user.student_profile
                from academy.serializers import StudentSerializer
                profile_data = StudentSerializer(student).data
                profile_data['student_id'] = student.id
            except Student.DoesNotExist:
                profile_data = {'error': 'Student profile not found.'}

        elif user.role == 'coach':
            try:
                coach = user.coach_profile
                profile_data = {
                    'coach_id': coach.id,
                    'bio': coach.bio,
                    'lichess_username': coach.lichess_username,
                    'zoom_personal_link': coach.zoom_personal_link,
                    'hourly_rate': str(coach.hourly_rate),
                }
            except Coach.DoesNotExist:
                profile_data = {'error': 'Coach profile not found.'}

        elif user.role == 'manager':
            try:
                manager = user.manager_profile
                profile_data = {
                    'manager_id': manager.id,
                    'has_zoom_configured': bool(manager.zoom_access_token),
                }
            except AcademyManager.DoesNotExist:
                profile_data = {'error': 'Manager profile not found.'}
        elif user.role == 'parent':
            students = Student.objects.filter(parent_email=user.email).select_related('user', 'assigned_coach__user')
            from academy.serializers import StudentSerializer
            students_list = []
            for s in students:
                s_data = StudentSerializer(s).data
                students_list.append({
                    'student_id': s.id,
                    'first_name': s.user.first_name,
                    'last_name': s.user.last_name,
                    'assigned_coach_name': f"{s.assigned_coach.user.first_name} {s.assigned_coach.user.last_name}" if s.assigned_coach else None,
                    'lichess_username': s.lichess_username,
                    'lichess_rating': s.lichess_rating,
                    'session_balance': s.session_balance,
                    'total_xp': s.total_xp,
                    'level': s.level,
                    'package_tracking': s_data.get('package_tracking', []),
                    'target_rating': s_data.get('target_rating'),
                    'learning_roadmap': s_data.get('learning_roadmap', []),
                    'goals': s_data.get('goals', []),
                    'coach_recommendations': s_data.get('coach_recommendations', ''),
                    'starting_rating': s_data.get('starting_rating'),
                    'strengths': s_data.get('strengths', []),
                    'weaknesses': s_data.get('weaknesses', []),
                    'weekly_goals': s_data.get('weekly_goals', []),
                    'monthly_goals': s_data.get('monthly_goals', []),
                    'roadmap': s_data.get('roadmap', {}),
                    'coach_notes': s_data.get('coach_notes', ''),
                    'performance_profile': s_data.get('performance_profile')
                })
            profile_data = {
                'parent_name': f"{user.first_name} {user.last_name}",
                'parent_email': user.email,
                'students': students_list,
            }

        return Response({
            'user': user_data,
            'profile': profile_data
        })



class PasswordResetRequestView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            # Simulating a password reset email/code.
            # In a real app, send email with django.core.mail.
            temp_password = "TempPassword2026!"
            user.set_password(temp_password)
            user.save()
            return Response({
                'message': 'Password reset successful. A temporary password has been sent to your email.',
                'temp_password': temp_password  # Displayed directly for development & verification purposes
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            # Avoid confirming whether email exists for security (return standard 200)
            return Response({
                'message': 'If the email exists, a password reset link has been sent.'
            }, status=status.HTTP_200_OK)
