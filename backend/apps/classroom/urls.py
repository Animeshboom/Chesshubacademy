from django.urls import path, include
from rest_framework.routers import DefaultRouter
from classroom.views import (
    ZoomSDKSignatureView, SessionReplayView, ChessStudyViewSet,
    SystemMigrateView, CurriculumViewSet, StudyVaultViewSet,
    SessionArchiveViewSet, AICoachReportViewSet, LessonPlanViewSet, LessonStepViewSet
)

router = DefaultRouter()
router.register('studies', ChessStudyViewSet, basename='studies')
router.register('curriculum', CurriculumViewSet, basename='curriculum')
router.register('vault', StudyVaultViewSet, basename='vault')
router.register('archives', SessionArchiveViewSet, basename='archives')
router.register('reports', AICoachReportViewSet, basename='reports')
router.register('lesson-plans', LessonPlanViewSet, basename='lesson-plans')
router.register('lesson-steps', LessonStepViewSet, basename='lesson-steps')

urlpatterns = [
    path('sessions/<uuid:session_id>/zoom/', ZoomSDKSignatureView.as_view(), name='zoom_sdk_signature'),
    path('sessions/<uuid:session_id>/replay/', SessionReplayView.as_view(), name='session_replay'),
    path('system/migrate/', SystemMigrateView.as_view(), name='system_migrate'),
    path('', include(router.urls)),
]
