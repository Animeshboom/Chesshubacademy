from rest_framework import serializers
from homework.models import Homework, HomeworkAssignment, HomeworkSubmission, Puzzle
from academy.serializers import CoachSerializer, StudentSerializer


class HomeworkSerializer(serializers.ModelSerializer):
    created_by_coach = CoachSerializer(read_only=True)

    class Meta:
        model = Homework
        fields = ('id', 'title', 'description', 'homework_type', 'created_by_coach', 'drive_file_id', 'lichess_study_url', 'pgn_data', 'created_at')


class HomeworkSubmissionSerializer(serializers.ModelSerializer):
    uploaded_file = serializers.FileField(write_only=True, required=False)

    class Meta:
        model = HomeworkSubmission
        fields = ('id', 'assignment', 'submission_notes', 'drive_file_id', 'uploaded_file', 'submitted_pgn', 'submitted_at', 'coach_feedback', 'coach_score', 'status')
        read_only_fields = ('drive_file_id', 'submitted_at')


class HomeworkAssignmentSerializer(serializers.ModelSerializer):
    homework = HomeworkSerializer(read_only=True)
    student = StudentSerializer(read_only=True)
    submission = HomeworkSubmissionSerializer(read_only=True)

    class Meta:
        model = HomeworkAssignment
        fields = ('id', 'homework', 'student', 'assigned_date', 'due_date', 'status', 'submission')


class PuzzleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Puzzle
        fields = ('id', 'fen', 'moves', 'rating', 'themes', 'title', 'description', 'created_at')
