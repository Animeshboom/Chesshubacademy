from rest_framework import serializers
from gamification.models import Badge, StudentBadge, XpTransaction, StudentStreak
from academy.serializers import StudentSerializer


class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = ('id', 'name', 'description', 'image_url', 'xp_bonus', 'created_at')


class StudentBadgeSerializer(serializers.ModelSerializer):
    badge = BadgeSerializer(read_only=True)
    badge_id = serializers.PrimaryKeyRelatedField(
        queryset=Badge.objects.all(), source='badge', write_only=True
    )

    class Meta:
        model = StudentBadge
        fields = ('id', 'badge', 'badge_id', 'awarded_at')


class XpTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = XpTransaction
        fields = ('id', 'student', 'xp_earned', 'reason', 'created_at')


class StudentStreakSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentStreak
        fields = ('id', 'daily_streak', 'weekly_streak', 'last_active_date', 'updated_at')
