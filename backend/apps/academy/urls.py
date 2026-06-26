from django.urls import path, include
from rest_framework.routers import DefaultRouter
from academy.views import (
    CoachViewSet, StudentViewSet, SessionViewSet, EnrollmentViewSet,
    DashboardStatsView, DemoBookingViewSet, GalleryImageViewSet,
    MonthlyAcademyReportView, MonthlyStudentReportViewSet
)

router = DefaultRouter()
router.register('coaches', CoachViewSet, basename='coach')
router.register('students', StudentViewSet, basename='student')
router.register('sessions', SessionViewSet, basename='session')
router.register('enrollments', EnrollmentViewSet, basename='enrollment')
router.register('demo-bookings', DemoBookingViewSet, basename='demo-booking')
router.register('gallery', GalleryImageViewSet, basename='gallery')
router.register('monthly-reports', MonthlyStudentReportViewSet, basename='monthly-report')

urlpatterns = [
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard_stats'),
    path('reports/monthly/', MonthlyAcademyReportView.as_view(), name='monthly_report'),
    path('', include(router.urls)),
]

