from rest_framework import viewsets, status, permissions, views, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from django.core.files.uploadedfile import UploadedFile

from authentication.permissions import IsAcademyManager, IsCoach, IsStudent, IsManagerOrCoach
from academy.models import Coach, Student
from homework.models import Homework, HomeworkAssignment, HomeworkSubmission, Puzzle
from homework.serializers import (
    HomeworkSerializer,
    HomeworkAssignmentSerializer,
    HomeworkSubmissionSerializer,
    PuzzleSerializer
)
from integrations.google_drive_service import GoogleDriveService


class PuzzleViewSet(viewsets.ModelViewSet):
    queryset = Puzzle.objects.all().order_by('rating')
    serializer_class = PuzzleSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['post'])
    def submit_attempt(self, request, pk=None):
        puzzle = self.get_object()
        user = request.user
        
        if user.role != 'student':
            return Response({'error': 'Only students can submit puzzle attempts.'}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            student = user.student_profile
        except Student.DoesNotExist:
            return Response({'error': 'Student profile not found.'}, status=status.HTTP_404_NOT_FOUND)
            
        is_correct = request.data.get('is_correct')
        if is_correct is None:
            return Response({'error': 'is_correct (boolean) is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Log the attempt
        from homework.models import PuzzleAttempt
        attempt = PuzzleAttempt.objects.create(
            student=student,
            puzzle=puzzle,
            is_correct=bool(is_correct)
        )
        
        # Reward XP if correct!
        xp_earned = 0
        if attempt.is_correct:
            xp_earned = 25
            from gamification.models import XpTransaction
            XpTransaction.objects.create(
                student=student,
                xp_earned=xp_earned,
                reason='puzzle_solve'
            )
            student.total_xp += xp_earned
            student.level = 1 + (student.total_xp // 1000)
            student.save()
            
        return Response({
            'message': 'Attempt recorded.',
            'is_correct': attempt.is_correct,
            'xp_earned': xp_earned,
            'level': student.level,
            'total_xp': student.total_xp
        }, status=status.HTTP_201_CREATED)


class HomeworkViewSet(viewsets.ModelViewSet):
    serializer_class = HomeworkSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsManagerOrCoach()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        return Homework.objects.all().order_by('-created_at')

    def perform_create(self, serializer):
        # Attach the coach profile to the created homework
        user = self.request.user
        try:
            coach = user.coach_profile
            serializer.save(created_by_coach=coach)
        except Coach.DoesNotExist:
            # Fallback for managers who might create templates
            # Fetch a default or raise validation error
            coach = Coach.objects.first()
            if not coach:
                raise serializers.ValidationError("A coach profile must exist before creating homework.")
            serializer.save(created_by_coach=coach)


class HomeworkAssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = HomeworkAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'manager':
            return HomeworkAssignment.objects.all().order_by('-assigned_date')
        elif user.role == 'coach':
            try:
                coach = user.coach_profile
                return HomeworkAssignment.objects.filter(homework__created_by_coach=coach).order_by('-assigned_date')
            except Coach.DoesNotExist:
                return HomeworkAssignment.objects.none()
        elif user.role == 'student':
            try:
                student = user.student_profile
                return HomeworkAssignment.objects.filter(student=student).order_by('-assigned_date')
            except Student.DoesNotExist:
                return HomeworkAssignment.objects.none()
        elif user.role == 'parent':
            return HomeworkAssignment.objects.filter(student__parent_email=user.email).order_by('-assigned_date')
        return HomeworkAssignment.objects.none()

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsManagerOrCoach])
    def assign(self, request):
        homework_id = request.data.get('homework_id')
        student_ids = request.data.get('student_ids', []) # List of UUIDs
        due_date = request.data.get('due_date')

        if not homework_id or not student_ids:
            return Response({'error': 'homework_id and student_ids are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            homework = Homework.objects.get(id=homework_id)
        except Homework.DoesNotExist:
            return Response({'error': 'Homework template not found.'}, status=status.HTTP_404_NOT_FOUND)

        assignments = []
        with transaction.atomic():
            for s_id in student_ids:
                try:
                    student = Student.objects.get(id=s_id)
                    assignment, created = HomeworkAssignment.objects.get_or_create(
                        homework=homework,
                        student=student,
                        defaults={'due_date': due_date}
                    )
                    assignments.append(assignment)
                except Student.DoesNotExist:
                    pass

        return Response(
            HomeworkAssignmentSerializer(assignments, many=True).data,
            status=status.HTTP_201_CREATED
        )


class HomeworkSubmissionViewSet(viewsets.ModelViewSet):
    serializer_class = HomeworkSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'manager':
            return HomeworkSubmission.objects.all().order_by('-submitted_at')
        elif user.role == 'coach':
            try:
                coach = user.coach_profile
                return HomeworkSubmission.objects.filter(assignment__homework__created_by_coach=coach).order_by('-submitted_at')
            except Coach.DoesNotExist:
                return HomeworkSubmission.objects.none()
        elif user.role == 'student':
            try:
                student = user.student_profile
                return HomeworkSubmission.objects.filter(assignment__student=student).order_by('-submitted_at')
            except Student.DoesNotExist:
                return HomeworkSubmission.objects.none()
        elif user.role == 'parent':
            return HomeworkSubmission.objects.filter(assignment__student__parent_email=user.email).order_by('-submitted_at')
        return HomeworkSubmission.objects.none()

    def create(self, request, *args, **kwargs):
        # We handle file upload mapping here
        assignment_id = request.data.get('assignment')
        notes = request.data.get('submission_notes', '')
        submitted_pgn = request.data.get('submitted_pgn', '')
        file_obj = request.FILES.get('uploaded_file')

        if not assignment_id:
            return Response({'error': 'Assignment ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            assignment = HomeworkAssignment.objects.get(id=assignment_id)
        except HomeworkAssignment.DoesNotExist:
            return Response({'error': 'Homework assignment not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Enforce that only the assigned student can submit
        if request.user.role == 'student' and assignment.student.user != request.user:
            return Response({'error': 'Access Denied: You cannot submit homework for another student.'}, status=status.HTTP_403_FORBIDDEN)

        drive_id = None
        if file_obj and isinstance(file_obj, UploadedFile):
            # Enforce 10MB limit
            if file_obj.size > 10 * 1024 * 1024:
                return Response({'error': 'File size exceeds maximum allowed size of 10MB.'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Whitelist formats
            import os
            ext = os.path.splitext(file_obj.name)[1].lower()
            if ext not in ['.pdf', '.png', '.jpg', '.jpeg', '.pgn']:
                return Response({'error': 'Unsupported file extension. Only PDF, PNG, JPG, and PGN files are allowed.'}, status=status.HTTP_400_BAD_REQUEST)

            import tempfile
            from django.conf import settings

            try:
                # 1. Verify request.FILES handling and read bytes
                file_bytes = file_obj.read()

                # 2. Verify uploaded file is saved to temporary path before Drive upload
                temp_dir = os.path.join(settings.BASE_DIR, 'tmp')
                os.makedirs(temp_dir, exist_ok=True)
                
                with tempfile.NamedTemporaryFile(dir=temp_dir, delete=False) as temp_file:
                    temp_file.write(file_bytes)
                    temp_path = temp_file.name

                # 3. Verify temporary file path exists
                if not os.path.exists(temp_path):
                    raise FileNotFoundError(f"Temporary file was not created at {temp_path}")

                try:
                    # Attempt upload to Google Drive
                    drive_id = GoogleDriveService.upload_file(
                        file_name=f"hw_{assignment.student.id}_{file_obj.name}",
                        file_content_bytes=file_bytes,
                        mime_type=file_obj.content_type
                    )
                    # If the service itself returned None, trigger the fallback
                    if not drive_id:
                        raise ValueError("Drive service returned empty file ID")
                finally:
                    # Clean up temp file
                    if os.path.exists(temp_path):
                        os.remove(temp_path)

            except Exception as e:
                # 4. Fallback: If Google Drive upload fails:
                # * save locally
                # * create submission record
                # * return 201 instead of 500
                # 5. Never lose student submission because Drive upload failed.
                print(f"Google Drive upload failed, falling back to local storage. Error: {e}")
                
                fallback_dir = os.path.join(settings.MEDIA_ROOT, 'gdrive_fallback')
                os.makedirs(fallback_dir, exist_ok=True)
                safe_name = os.path.basename(f"hw_{assignment.student.id}_{file_obj.name}")
                local_path = os.path.join(fallback_dir, safe_name)
                
                try:
                    with open(local_path, 'wb') as f:
                        f.write(file_bytes)
                    drive_id = f"local_fallback/{safe_name}"
                except Exception as local_save_err:
                    print(f"Failed to save fallback file locally: {local_save_err}")
                    drive_id = None

        # Delete previous file if replacing submission to avoid file bloat
        try:
            old_submission = HomeworkSubmission.objects.filter(assignment=assignment).first()
            if old_submission and old_submission.drive_file_id and old_submission.drive_file_id != drive_id:
                GoogleDriveService.delete_file(old_submission.drive_file_id)
        except Exception as delete_err:
            print(f"Failed to delete old homework file: {delete_err}")

        with transaction.atomic():
            submission, created = HomeworkSubmission.objects.update_or_create(
                assignment=assignment,
                defaults={
                    'submission_notes': notes,
                    'submitted_pgn': submitted_pgn,
                    'drive_file_id': drive_id,
                    'status': 'pending_review'
                }
            )
            
            assignment.status = 'submitted'
            assignment.save()

        return Response(HomeworkSubmissionSerializer(submission).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsManagerOrCoach])
    def review(self, request, pk=None):
        submission = self.get_object()
        review_status = request.data.get('status') # 'approved' or 'rejected'
        feedback = request.data.get('coach_feedback', '')
        score = request.data.get('coach_score')

        if review_status not in ['approved', 'rejected']:
            return Response({'error': "Status must be 'approved' or 'rejected'."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            submission.status = review_status
            submission.coach_feedback = feedback
            submission.coach_score = score
            submission.save()

            assignment = submission.assignment
            if review_status == 'approved':
                assignment.status = 'completed'
                assignment.save()

                # Reward student XP!
                from gamification.models import XpTransaction
                student = assignment.student
                
                # Check duplicate rewards for safety
                already_rewarded = XpTransaction.objects.filter(
                    student=student, 
                    reason='homework_completion', 
                    created_at__gte=timezone.now() - timezone.timedelta(seconds=5)
                ).exists()

                if not already_rewarded:
                    XpTransaction.objects.create(
                        student=student,
                        xp_earned=200,
                        reason='homework_completion'
                    )
                    student.total_xp += 200
                    student.level = 1 + (student.total_xp // 1000)
                    student.save()

            else:
                assignment.status = 'assigned' # Send back to assigned on reject
                assignment.save()

        return Response(HomeworkSubmissionSerializer(submission).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def download(self, request, pk=None):
        submission = self.get_object()
        file_id = submission.drive_file_id

        if not file_id:
            return Response({'error': 'No file attachment exists for this submission.'}, status=status.HTTP_404_NOT_FOUND)

        file_bytes, file_name = GoogleDriveService.download_file(file_id)
        if not file_bytes:
            return Response({'error': 'Failed to retrieve file from storage.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        import mimetypes
        from django.http import HttpResponse
        content_type, _ = mimetypes.guess_type(file_name)
        if not content_type:
            content_type = 'application/octet-stream'
            
        response = HttpResponse(file_bytes, content_type=content_type)
        response['Content-Disposition'] = f'attachment; filename="{file_name}"'
        return response
