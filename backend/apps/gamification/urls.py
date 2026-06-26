from django.urls import path, include
from rest_framework.routers import DefaultRouter
from gamification.views import (
    BadgeViewSet,
    StudentBadgeAwardView,
    XpTransactionViewSet,
    LeaderboardView
)

router = DefaultRouter()
router.register('badges', BadgeViewSet, basename='badge')
router.register('xp-history', XpTransactionViewSet, basename='xp_history')

urlpatterns = [
    path('award-badge/', StudentBadgeAwardView.as_view(), name='award_badge'),
    path('leaderboard/', LeaderboardView.as_view(), name='leaderboard'),
    path('', include(router.urls)),
]
