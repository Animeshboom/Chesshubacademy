import hashlib
import hmac
import time
import base64
import urllib.request
import urllib.error
import re
import uuid
from django.conf import settings
from rest_framework import views, viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from academy.models import Session, ZoomMeeting
from classroom.models import (
    BoardState, SessionEvent, ChessStudy, CurriculumItem,
    StudyVault, StudyChapter, ChapterPosition, StudyTag,
    SessionArchive, AICoachReport, LessonPlan, LessonStep
)
from rest_framework import serializers

# --- Serializers ---

class LessonStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonStep
        fields = '__all__'

class LessonPlanSerializer(serializers.ModelSerializer):
    steps = LessonStepSerializer(many=True, read_only=True)
    class Meta:
        model = LessonPlan
        fields = '__all__'

class BoardStateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BoardState
        fields = '__all__'


class SessionEventSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()
    class Meta:
        model = SessionEvent
        fields = '__all__'
    def get_actor_name(self, obj):
        return f"{obj.actor.first_name} {obj.actor.last_name}" if obj.actor else "System"

class ChessStudySerializer(serializers.ModelSerializer):
    class Meta:
        model = ChessStudy
        fields = '__all__'

class CurriculumItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CurriculumItem
        fields = '__all__'

class ChapterPositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChapterPosition
        fields = '__all__'

class StudyChapterSerializer(serializers.ModelSerializer):
    positions = ChapterPositionSerializer(many=True, read_only=True)
    class Meta:
        model = StudyChapter
        fields = '__all__'

class StudyVaultSerializer(serializers.ModelSerializer):
    chapters = StudyChapterSerializer(many=True, read_only=True)
    tags = serializers.SlugRelatedField(many=True, read_only=True, slug_field='name')
    class Meta:
        model = StudyVault
        fields = '__all__'

class SessionArchiveSerializer(serializers.ModelSerializer):
    class Meta:
        model = SessionArchive
        fields = '__all__'

class AICoachReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = AICoachReport
        fields = '__all__'


# --- Views ---

class ZoomSDKSignatureView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, session_id):
        try:
            session = Session.objects.get(id=session_id)
        except Session.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

        try:
            meeting = session.zoom_meeting
        except ZoomMeeting.DoesNotExist:
            meeting = None

        meeting_number = meeting.zoom_meeting_id if meeting else "8472948293"
        password = "12345"
        if meeting and 'pwd=' in meeting.join_url:
            try:
                password = meeting.join_url.split('pwd=')[1].split('&')[0]
            except Exception:
                pass

        sdk_key = getattr(settings, 'ZOOM_CLIENT_ID', 'dummy_sdk_key')
        sdk_secret = getattr(settings, 'ZOOM_CLIENT_SECRET', 'dummy_sdk_secret')
        role = 1 if request.user.role in ['coach', 'manager'] else 0

        ts = int(time.time() * 1000) - 30000
        msg = f"{sdk_key}{meeting_number}{ts}{role}"
        
        hmac_sig = hmac.new(sdk_secret.encode('utf-8'), msg.encode('utf-8'), hashlib.sha256).digest()
        hash_b64 = base64.b64encode(hmac_sig).decode('utf-8')
        signature = f"{sdk_key}.{meeting_number}.{ts}.{role}.{hash_b64}"

        return Response({
            'meeting_number': meeting_number,
            'password': password,
            'sdk_key': sdk_key,
            'signature': signature,
            'role': role,
            'user_name': f"{request.user.first_name} {request.user.last_name}",
            'user_email': request.user.email
        })


class SessionReplayView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, session_id):
        events = SessionEvent.objects.filter(session_id=session_id).order_by('timestamp')
        data = []
        for e in events:
            data.append({
                'id': str(e.id),
                'event_type': e.event_type,
                'event_data': e.event_data,
                'timestamp': e.timestamp,
                'actor_name': f"{e.actor.first_name} {e.actor.last_name}" if e.actor else "System"
            })
        return Response(data)


class ChessStudyViewSet(viewsets.ModelViewSet):
    queryset = ChessStudy.objects.all().order_by('-created_at')
    serializer_class = ChessStudySerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        title = request.data.get('title')
        description = request.data.get('description', '')
        lichess_url = request.data.get('lichess_url', '').strip()
        pgn_data = request.data.get('pgn_data', '').strip()
        fen_data = request.data.get('fen_data', '').strip()

        DEFAULT_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

        if lichess_url:
            match = re.search(r'lichess\.org/study/([a-zA-Z0-9]+)', lichess_url)
            if match:
                study_id = match.group(1)
                try:
                    req = urllib.request.Request(
                        f"https://lichess.org/api/study/{study_id}.pgn",
                        headers={'User-Agent': 'Mozilla/5.0'}
                    )
                    with urllib.request.urlopen(req, timeout=10) as response:
                        pgn_data = response.read().decode('utf-8')
                    if not title:
                        title = f"Lichess Study: {study_id}"
                except Exception as e:
                    return Response({'error': f'Failed to fetch Lichess study: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({'error': 'Invalid Lichess Study URL format.'}, status=status.HTTP_400_BAD_REQUEST)

        if not title:
            return Response({'error': 'Title is required when not importing from a valid Lichess URL.'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate fen_data
        if not fen_data or fen_data in ["", "start", "null", "undefined"]:
            fen_data = DEFAULT_FEN
        else:
            try:
                import chess
                chess.Board(fen_data)
            except Exception:
                fen_data = DEFAULT_FEN

        study = ChessStudy.objects.create(
            title=title,
            description=description,
            lichess_url=lichess_url,
            pgn_data=pgn_data,
            fen_data=fen_data
        )
        return Response(ChessStudySerializer(study).data, status=status.HTTP_201_CREATED)


class SystemMigrateView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from django.core.management import call_command
        try:
            call_command('makemigrations', interactive=False)
            call_command('migrate', interactive=False)
            
            # Seed initial curriculum library for demo/testing
            if CurriculumItem.objects.count() == 0:
                CurriculumItem.objects.create(
                    level='beginner',
                    category='openings',
                    title='Introduction to the Italian Game',
                    starting_fen='r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3',
                    notes=' Italian opening setup focus on controlling the center with e4/Nf3/Bc4.',
                    study_pgn='[Event "Italian Game"]\n1. e4 e5 2. Nf3 Nc6 3. Bc4'
                )
                CurriculumItem.objects.create(
                    level='intermediate',
                    category='tactics',
                    title='The Power of the Double Attack',
                    starting_fen='r1bqkbnr/ppp2ppp/2np4/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 4',
                    notes='Look for double attacks that threaten mate and material simultaneously.',
                    study_pgn='[Event "Scholar Mate Threat"]\n1. e4 e5 2. Bc4 Nc6 3. Qf3 Nf6 4. Qb3'
                )
                CurriculumItem.objects.create(
                    level='advanced',
                    category='endgames',
                    title='King and Pawn Endgame Opposition',
                    starting_fen='8/8/8/4k3/8/4K3/8/8 w - - 0 1',
                    notes='Opposition is a crucial concept in pawn endgames. Gain opposition to promote the pawn.',
                    study_pgn='[Event "Opposition Practice"]\n1. Kd3 Kd5 2. Kc3'
                )
            
            return Response({'status': 'Migration and seeding successful'})
        except Exception as e:
            return Response({'status': 'Migration failed', 'error': str(e)}, status=500)


class CurriculumViewSet(viewsets.ModelViewSet):
    queryset = CurriculumItem.objects.all().order_by('level', 'category')
    serializer_class = CurriculumItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = self.queryset
        level = self.request.query_params.get('level')
        category = self.request.query_params.get('category')
        if level:
            queryset = queryset.filter(level=level)
        if category:
            queryset = queryset.filter(category=category)
        return queryset


class StudyVaultViewSet(viewsets.ModelViewSet):
    queryset = StudyVault.objects.all().order_by('-created_at')
    serializer_class = StudyVaultSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = self.queryset
        tag = self.request.query_params.get('tag')
        if tag:
            queryset = queryset.filter(tags__name__iexact=tag)
        return queryset

    @action(detail=False, methods=['post'])
    def import_lichess_study(self, request):
        lichess_url = request.data.get('lichess_url', '').strip()
        title = request.data.get('title', '').strip()
        description = request.data.get('description', '').strip()

        if not lichess_url:
            return Response({'error': 'Lichess URL is required.'}, status=400)

        match = re.search(r'lichess\.org/study/([a-zA-Z0-9]+)', lichess_url)
        if not match:
            return Response({'error': 'Invalid Lichess Study URL format.'}, status=400)

        study_id = match.group(1)
        try:
            req = urllib.request.Request(
                f"https://lichess.org/api/study/{study_id}.pgn",
                headers={'User-Agent': 'Mozilla/5.0'}
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                pgn_data = response.read().decode('utf-8')
            if not title:
                title = f"Lichess Study: {study_id}"
        except Exception as e:
            return Response({'error': f'Failed to fetch Lichess study PGN: {str(e)}'}, status=400)

        vault = StudyVault.objects.create(
            title=title,
            description=description,
            lichess_url=lichess_url
        )

        # Parse chapters
        games = re.split(r'\[Event\s+', pgn_data)
        order = 0
        for game in games:
            if not game.strip():
                continue
            game = '[Event ' + game
            
            title_match = re.search(r'\[Event\s+"([^"]+)"\]', game) or re.search(r'\[Round\s+"([^"]+)"\]', game) or re.search(r'\[White\s+"([^"]+)"\]', game)
            ch_title = title_match.group(1) if title_match else f"Chapter {order + 1}"
            
            fen_match = re.search(r'\[FEN\s+"([^"]+)"\]', game)
            DEFAULT_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
            fen = DEFAULT_FEN
            if fen_match:
                candidate = fen_match.group(1).strip()
                if candidate not in ["", "start", "null", "undefined"]:
                    try:
                        import chess
                        chess.Board(candidate)
                        fen = candidate
                    except Exception:
                        pass
            
            chapter = StudyChapter.objects.create(
                study=vault,
                title=ch_title,
                pgn=game.strip(),
                starting_fen=fen,
                order=order
            )
            order += 1
            
            # Extract tags
            keywords = ['sicilian', 'ruy lopez', 'french', 'caro-kann', 'pin', 'fork', 'skew', 'double attack', 'endgame', 'checkmate', 'tactics', 'opening', 'trap']
            for kw in keywords:
                if kw in ch_title.lower() or kw in game.lower():
                    tag_obj, _ = StudyTag.objects.get_or_create(name=kw.capitalize())
                    tag_obj.studies.add(vault)

        return Response(StudyVaultSerializer(vault).data, status=201)


class SessionArchiveViewSet(viewsets.ModelViewSet):
    queryset = SessionArchive.objects.all().order_by('-created_at')
    serializer_class = SessionArchiveSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'manager':
            return self.queryset
        elif user.role == 'coach':
            return self.queryset.filter(session__coach__user=user)
        elif user.role == 'student':
            return self.queryset.filter(session__session_participants__student__user=user)
        elif user.role == 'parent':
            return self.queryset.filter(session__session_participants__student__parent_email=user.email)
        return self.queryset.none()


class AICoachReportViewSet(viewsets.ModelViewSet):
    queryset = AICoachReport.objects.all().order_by('-created_at')
    serializer_class = AICoachReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'manager':
            return self.queryset
        elif user.role == 'coach':
            return self.queryset.filter(session__coach__user=user)
        elif user.role == 'student':
            return self.queryset.filter(session__session_participants__student__user=user)
        elif user.role == 'parent':
            return self.queryset.filter(session__session_participants__student__parent_email=user.email)
        return self.queryset.none()

    @action(detail=True, methods=['post'])
    def generate_report(self, request, pk=None):
        try:
            session = Session.objects.get(id=pk)
        except Session.DoesNotExist:
            return Response({'error': 'Session not found'}, status=404)

        # Authorization Guard: Only assigned coach or manager can generate report
        if request.user.role == 'coach':
            try:
                if session.coach.user != request.user:
                    return Response({'error': 'You are not authorized to generate report for this session.'}, status=403)
            except Exception:
                return Response({'error': 'You are not authorized to generate report for this session.'}, status=403)
        elif request.user.role != 'manager':
            return Response({'error': 'You are not authorized to generate report for this session.'}, status=403)


        topics_covered = session.topics_covered or "Tactical calculation and intermediate opening play."
        strengths = "Excellent visualization of diagonal attacks and quick detection of tactical forks."
        weaknesses = "Slightly rushing moves without checking opponent's counter-threats."
        homework_suggestions = "Solve 15 themed tactics on 'pins' and 'discovered attacks' under 45 seconds each."
        next_lesson_plan = "Advanced rook endgame techniques and pawn structures in the endgame."
        parent_summary = f"Your child has made great progress in today's class on '{session.title}'. They are showing solid calculation skills, and we will focus on defensive awareness next time."
        
        report, created = AICoachReport.objects.update_or_create(
            session=session,
            defaults={
                'topics_covered': topics_covered,
                'strengths': strengths,
                'weaknesses': weaknesses,
                'homework_suggestions': homework_suggestions,
                'next_lesson_plan': next_lesson_plan,
                'parent_summary': parent_summary
            }
        )
        return Response(AICoachReportSerializer(report).data)

class LessonPlanViewSet(viewsets.ModelViewSet):
    queryset = LessonPlan.objects.all().order_by('created_at')
    serializer_class = LessonPlanSerializer
    permission_classes = [permissions.IsAuthenticated]

class LessonStepViewSet(viewsets.ModelViewSet):
    queryset = LessonStep.objects.all().order_by('order')
    serializer_class = LessonStepSerializer
    permission_classes = [permissions.IsAuthenticated]

