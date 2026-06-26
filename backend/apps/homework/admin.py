from django.contrib import admin
from homework.models import Homework, HomeworkAssignment, HomeworkSubmission, Puzzle

@admin.register(Homework)
class HomeworkAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'homework_type', 'created_by_coach', 'created_at')
    list_filter = ('homework_type', 'created_by_coach')

@admin.register(HomeworkAssignment)
class HomeworkAssignmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'homework', 'student', 'assigned_date', 'due_date', 'status')
    list_filter = ('status', 'homework', 'student')

@admin.register(HomeworkSubmission)
class HomeworkSubmissionAdmin(admin.ModelAdmin):
    list_display = ('id', 'assignment', 'submitted_at', 'coach_score', 'status')
    list_filter = ('status',)

@admin.register(Puzzle)
class PuzzleAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'rating', 'created_at')
    list_filter = ('rating',)
