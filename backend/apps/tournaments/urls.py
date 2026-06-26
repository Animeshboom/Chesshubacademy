from django.urls import path, include
from rest_framework.routers import DefaultRouter
from tournaments.views import TournamentViewSet

router = DefaultRouter()
router.register('', TournamentViewSet, basename='tournament')

urlpatterns = [
    path('', include(router.urls)),
]
