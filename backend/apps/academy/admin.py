from django.contrib import admin
from academy.models import Coach, Student, Enrollment, Session, SessionStudent, ZoomMeeting, DemoBooking, GalleryImage, AcademyManager

@admin.register(Coach)
class CoachAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'lichess_username', 'hourly_rate')

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'assigned_coach', 'session_balance', 'total_xp', 'level')

@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'student', 'plan_name', 'sessions_purchased', 'amount_paid', 'payment_status', 'created_at')

@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'class_type', 'coach', 'scheduled_start', 'status')
    list_filter = ('class_type', 'status', 'coach')

@admin.register(SessionStudent)
class SessionStudentAdmin(admin.ModelAdmin):
    list_display = ('id', 'session', 'student', 'attendance_status')

@admin.register(ZoomMeeting)
class ZoomMeetingAdmin(admin.ModelAdmin):
    list_display = ('id', 'session', 'zoom_meeting_id')

@admin.register(DemoBooking)
class DemoBookingAdmin(admin.ModelAdmin):
    list_display = ('id', 'parent_name', 'student_name', 'age', 'country', 'chess_level', 'status', 'created_at')
    list_filter = ('status', 'chess_level', 'country')

@admin.register(GalleryImage)
class GalleryImageAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'category', 'created_at')
    list_filter = ('category',)

@admin.register(AcademyManager)
class AcademyManagerAdmin(admin.ModelAdmin):
    list_display = ('id', 'user')
