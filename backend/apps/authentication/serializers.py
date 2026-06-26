from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from academy.models import Coach, Student, AcademyManager

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['email'] = user.email
        token['role'] = user.role
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'role': self.user.role,
            'phone': self.user.phone,
        }
        return data


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'role', 'phone', 'created_at')
        read_only_fields = ('id', 'created_at')


class RegisterUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    parent_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    parent_email = serializers.EmailField(write_only=True, required=False, allow_blank=True)
    assigned_coach_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'role', 'phone', 'password', 'parent_name', 'parent_email', 'assigned_coach_id')

    def create(self, validated_data):
        password = validated_data.pop('password', 'ChessHub2026!')  # Default password if none provided
        parent_name = validated_data.pop('parent_name', '')
        parent_email = validated_data.pop('parent_email', '')
        assigned_coach_id = validated_data.pop('assigned_coach_id', None)

        user = User.objects.create_user(
            email=validated_data['email'],
            password=password,
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            role=validated_data['role'],
            phone=validated_data.get('phone', '')
        )

        # Create corresponding profile
        if user.role == 'manager':
            AcademyManager.objects.create(user=user)
        elif user.role == 'coach':
            Coach.objects.create(user=user)
        elif user.role == 'student':
            coach = None
            if assigned_coach_id:
                try:
                    coach = Coach.objects.get(id=assigned_coach_id)
                except Coach.DoesNotExist:
                    pass
            Student.objects.create(
                user=user,
                assigned_coach=coach,
                parent_name=parent_name,
                parent_email=parent_email
            )
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

        return user
