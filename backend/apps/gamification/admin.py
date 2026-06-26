from django.contrib import admin
from gamification.models import Badge, StudentBadge, XpTransaction, StudentStreak

@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'xp_bonus', 'created_at')

@admin.register(StudentBadge)
class StudentBadgeAdmin(admin.ModelAdmin):
    list_display = ('id', 'student', 'badge', 'awarded_at')
    list_filter = ('badge',)

@admin.register(XpTransaction)
class XpTransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'student', 'xp_earned', 'reason', 'created_at')
    list_filter = ('reason',)

@admin.register(StudentStreak)
class StudentStreakAdmin(admin.ModelAdmin):
    list_display = ('id', 'student', 'daily_streak', 'weekly_streak', 'last_active_date')
