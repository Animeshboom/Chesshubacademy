from django.urls import path, include
from rest_framework.routers import DefaultRouter
from homework.views import (
    PuzzleViewSet,
    HomeworkViewSet,
    HomeworkAssignmentViewSet,
    HomeworkSubmissionViewSet
)

router = DefaultRouter()
router.register('puzzles', PuzzleViewSet, basename='puzzle')
router.register('templates', HomeworkViewSet, basename='homework_template')
router.register('assignments', HomeworkAssignmentViewSet, basename='homework_assignment')
router.register('submissions', HomeworkSubmissionViewSet, basename='homework_submission')

urlpatterns = [
    path('', include(router.urls)),
]
