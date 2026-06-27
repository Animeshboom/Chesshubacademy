import json
import chess
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from academy.models import Session, Student, Coach
from classroom.models import BoardState, SessionEvent

User = get_user_model()

class ClassroomConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.session_id = self.scope['url_route']['kwargs']['session_id']
        self.room_group_name = f'classroom_{self.session_id}'

        # Get token from query string
        from urllib.parse import parse_qs
        query_params = parse_qs(self.scope.get('query_string', b'').decode())
        token = query_params.get('token', [None])[0]

        if not token:
            await self.close(code=4001)
            return

        try:
            # Parse JWT token
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            self.user = await self.get_user(user_id)
        except Exception:
            await self.close(code=4002)
            return

        # Check if session exists
        self.session = await self.get_session(self.session_id)
        if not self.session:
            await self.close(code=4003)
            return

        # Check authorization: user must be the manager, the assigned coach, or an enrolled student participant
        authorized = await self.check_session_authorization(self.session, self.user)
        if not authorized:
            await self.close(code=4004)
            return

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        # Get or create current board state
        board_state = await self.get_or_create_board_state(self.session)
        
        # Add user to presence list in group state
        # In a production environment with Redis, we could use Redis to store presence.
        # For simplicity and robustness, we broadcast a join event.
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'presence_join',
                'user_id': str(self.user.id),
                'name': f"{self.user.first_name} {self.user.last_name}",
                'role': self.user.role
            }
        )

        # Send current board state to the newly connected user
        await self.send_json({
            'type': 'board_sync',
            'fen': board_state.current_fen,
            'pgn': board_state.pgn,
            'board_mode': board_state.board_mode,
            'student_moves_enabled': board_state.student_moves_enabled,
            'student_with_move_rights': str(board_state.student_with_move_rights.id) if board_state.student_with_move_rights else None,
            'active_lesson_plan': str(board_state.active_lesson_plan.id) if board_state.active_lesson_plan else None,
            'active_lesson_step': {
                'id': str(board_state.active_lesson_step.id),
                'title': board_state.active_lesson_step.title,
                'step_type': board_state.active_lesson_step.step_type,
                'description': board_state.active_lesson_step.description,
                'order': board_state.active_lesson_step.order,
            } if board_state.active_lesson_step else None,
            'white_control': board_state.white_control,
            'black_control': board_state.black_control,
            'is_locked': board_state.is_locked,
            'annotations': board_state.annotations,
        })


    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            # Leave room group
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )
            # Broadcast leave event
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'presence_leave',
                    'user_id': str(self.user.id),
                    'name': f"{self.user.first_name} {self.user.last_name}",
                }
            )

    async def receive_json(self, content):
        event_type = content.get('type')

        # Role-based action validation
        is_coach_or_manager = self.user.role in ['coach', 'manager']

        if event_type == 'board_move':
            # Handle move from client
            move_data = content.get('move') # e.g. {from: 'e2', to: 'e4', promotion: 'q'}
            # Fetch current board state
            board_state = await self.get_or_create_board_state(self.session)
            
            # Check permissions: if student, check if moves are enabled
            if not is_coach_or_manager:
                if not board_state.student_moves_enabled:
                    await self.send_json({'type': 'error', 'message': 'Student moves are disabled.'})
                    return
                # Check if this student is selected to make moves
                if board_state.student_with_move_rights:
                    try:
                        student_profile = await self.get_student_profile(self.user)
                        if not student_profile or board_state.student_with_move_rights_id != student_profile.id:
                            await self.send_json({'type': 'error', 'message': 'You do not have move permission right now.'})
                            return
                    except Exception as e:
                        await self.send_json({'type': 'error', 'message': 'Failed to verify move permission.'})
                        return

            # Validate move server-side using python-chess
            try:
                board = chess.Board(board_state.current_fen)
                # parse move
                move_str = f"{move_data['from']}{move_data['to']}"
                if move_data.get('promotion'):
                    move_str += move_data['promotion'].lower()
                move = chess.Move.from_uci(move_str)
                
                if move in board.legal_moves:
                    new_pgn = await self.append_move_to_pgn(board_state, move)
                    board.push(move)
                    new_fen = board.fen()
                    # Save to DB
                    await self.save_board_fen(board_state, new_fen)
                    # Log event
                    await self.log_session_event(self.session, 'move', {'move': move_data, 'fen': new_fen}, self.user)
                    # Broadcast to room
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'board_sync_broadcast',
                            'fen': new_fen,
                            'pgn': new_pgn,
                            'last_move': move_data,
                            'active_lesson_plan': str(board_state.active_lesson_plan.id) if board_state.active_lesson_plan else None,
                            'active_lesson_step': {
                                'id': str(board_state.active_lesson_step.id),
                                'title': board_state.active_lesson_step.title,
                                'step_type': board_state.active_lesson_step.step_type,
                                'description': board_state.active_lesson_step.description,
                                'order': board_state.active_lesson_step.order,
                            } if board_state.active_lesson_step else None,
                            'student_with_move_rights': str(board_state.student_with_move_rights.id) if board_state.student_with_move_rights else None,
                            'student_moves_enabled': board_state.student_moves_enabled,
                        }
                    )
                else:
                    await self.send_json({'type': 'error', 'message': 'Illegal move.'})
            except Exception as e:
                await self.send_json({'type': 'error', 'message': f'Invalid move payload: {str(e)}'})

        elif event_type == 'board_draw_annotation':
            # Coach only arrows/highlights
            if not is_coach_or_manager:
                return
            annotation = content.get('annotation') # {type: 'arrow'|'highlight', from: 'e2', to: 'e4', color: 'red'}
            board_state = await self.get_or_create_board_state(self.session)
            await self.add_board_annotation(board_state, annotation)
            
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'board_annotation_broadcast',
                    'annotation': annotation,
                }
            )

        elif event_type == 'board_clear_annotations':
            if not is_coach_or_manager:
                return
            board_state = await self.get_or_create_board_state(self.session)
            await self.clear_board_annotations(board_state)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'board_clear_annotations_broadcast'
                }
            )

        elif event_type == 'board_set_annotations':
            if not is_coach_or_manager:
                return
            annotations = content.get('annotations', [])
            board_state = await self.get_or_create_board_state(self.session)
            await self.save_board_annotations(board_state, annotations)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'board_annotations_broadcast',
                    'annotations': annotations,
                }
            )

        elif event_type == 'board_set_mode':
            if not is_coach_or_manager:
                return
            mode = content.get('mode', 'teaching')
            board_state = await self.get_or_create_board_state(self.session)
            await self.save_board_mode(board_state, mode)
            
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'board_mode_broadcast',
                    'board_mode': mode,
                }
            )

        elif event_type == 'board_set_permissions':
            if not is_coach_or_manager:
                return
            student_moves = content.get('student_moves_enabled', False)
            student_id = content.get('student_id')
            board_state = await self.get_or_create_board_state(self.session)
            await self.save_board_permissions_new(board_state, student_moves, student_id)
            
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'board_permissions_broadcast',
                    'student_moves_enabled': student_moves,
                    'student_with_move_rights': student_id,
                }
            )

        elif event_type == 'board_reset':
            if not is_coach_or_manager:
                return
            board_state = await self.get_or_create_board_state(self.session)
            start_fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
            await self.save_board_fen(board_state, start_fen)
            await self.save_board_pgn(board_state, "")
            await self.clear_board_annotations(board_state)
            
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'board_sync_broadcast',
                    'fen': start_fen,
                    'pgn': "",
                    'last_move': None,
                    'clear_annotations': True,
                    'active_lesson_plan': str(board_state.active_lesson_plan.id) if board_state.active_lesson_plan else None,
                    'active_lesson_step': {
                        'id': str(board_state.active_lesson_step.id),
                        'title': board_state.active_lesson_step.title,
                        'step_type': board_state.active_lesson_step.step_type,
                        'description': board_state.active_lesson_step.description,
                        'order': board_state.active_lesson_step.order,
                    } if board_state.active_lesson_step else None,
                    'student_with_move_rights': str(board_state.student_with_move_rights.id) if board_state.student_with_move_rights else None,
                    'student_moves_enabled': board_state.student_moves_enabled,
                }
            )

        elif event_type == 'board_share_eval':
            if not is_coach_or_manager:
                return
            share = content.get('share', False)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'board_share_eval_broadcast',
                    'share': share,
                }
            )

        elif event_type == 'board_set_fen':
            if not is_coach_or_manager:
                return
            new_fen = content.get('fen')
            new_pgn = content.get('pgn', '')
            if new_fen:
                board_state = await self.get_or_create_board_state(self.session)
                await self.save_board_fen(board_state, new_fen)
                await self.save_board_pgn(board_state, new_pgn)
                await self.clear_board_annotations(board_state)
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'board_sync_broadcast',
                        'fen': new_fen,
                        'pgn': new_pgn,
                        'last_move': None,
                        'clear_annotations': True,
                        'active_lesson_plan': str(board_state.active_lesson_plan.id) if board_state.active_lesson_plan else None,
                        'active_lesson_step': {
                            'id': str(board_state.active_lesson_step.id),
                            'title': board_state.active_lesson_step.title,
                            'step_type': board_state.active_lesson_step.step_type,
                            'description': board_state.active_lesson_step.description,
                            'order': board_state.active_lesson_step.order,
                        } if board_state.active_lesson_step else None,
                        'student_with_move_rights': str(board_state.student_with_move_rights.id) if board_state.student_with_move_rights else None,
                        'student_moves_enabled': board_state.student_moves_enabled,
                    }
                )

        elif event_type == 'board_load_lesson':
            if not is_coach_or_manager:
                return
            lesson_plan_id = content.get('lesson_plan_id')
            board_state = await self.get_or_create_board_state(self.session)
            lesson_plan, first_step = await self.load_lesson_plan(board_state, lesson_plan_id)
            if lesson_plan:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'board_sync_broadcast',
                        'fen': board_state.current_fen,
                        'pgn': board_state.pgn,
                        'last_move': None,
                        'clear_annotations': True,
                        'active_lesson_plan': str(lesson_plan.id),
                        'active_lesson_step': {
                            'id': str(first_step.id),
                            'title': first_step.title,
                            'step_type': first_step.step_type,
                            'description': first_step.description,
                            'order': first_step.order,
                        } if first_step else None,
                        'student_with_move_rights': str(board_state.student_with_move_rights.id) if board_state.student_with_move_rights else None,
                        'student_moves_enabled': board_state.student_moves_enabled,
                    }
                )

        elif event_type == 'board_next_step' or event_type == 'board_prev_step':
            if not is_coach_or_manager:
                return
            direction = 'next' if event_type == 'board_next_step' else 'prev'
            board_state = await self.get_or_create_board_state(self.session)
            step = await self.load_next_or_prev_step(board_state, direction)
            if step:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'board_sync_broadcast',
                        'fen': board_state.current_fen,
                        'pgn': board_state.pgn,
                        'last_move': None,
                        'clear_annotations': True,
                        'active_lesson_plan': str(board_state.active_lesson_plan.id),
                        'active_lesson_step': {
                            'id': str(step.id),
                            'title': step.title,
                            'step_type': step.step_type,
                            'description': step.description,
                            'order': step.order,
                        },
                        'student_with_move_rights': str(board_state.student_with_move_rights.id) if board_state.student_with_move_rights else None,
                        'student_moves_enabled': board_state.student_moves_enabled,
                    }
                )

        elif event_type == 'chat_message':
            text = content.get('message', '').strip()
            if text:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message_broadcast',
                        'user_id': str(self.user.id),
                        'name': f"{self.user.first_name} {self.user.last_name}",
                        'role': self.user.role,
                        'message': text,
                    }
                )

        elif event_type == 'hand_raise':
            # Student raising hand
            if self.user.role == 'student':
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'hand_raise_broadcast',
                        'user_id': str(self.user.id),
                        'name': f"{self.user.first_name} {self.user.last_name}",
                    }
                )

        elif event_type == 'student_board_update':
            fen = content.get('fen')
            student_id = content.get('student_id')
            name = content.get('name')
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'student_board_update_broadcast',
                    'student_id': student_id,
                    'name': name,
                    'fen': fen,
                }
            )

        elif event_type == 'coach_guide_move':
            if is_coach_or_manager:
                student_id = content.get('student_id')
                fen = content.get('fen')
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'coach_guide_move_broadcast',
                        'student_id': student_id,
                        'fen': fen,
                    }
                )


    # Event handlers for group broadcasts
    async def presence_join(self, event):
        await self.send_json(event)

    async def presence_leave(self, event):
        await self.send_json(event)

    async def board_sync_broadcast(self, event):
        await self.send_json(event)

    async def board_annotation_broadcast(self, event):
        await self.send_json(event)

    async def board_clear_annotations_broadcast(self, event):
        await self.send_json(event)

    async def board_mode_broadcast(self, event):
        await self.send_json(event)

    async def board_permissions_broadcast(self, event):
        await self.send_json(event)

    async def chat_message_broadcast(self, event):
        await self.send_json(event)

    async def hand_raise_broadcast(self, event):
        await self.send_json(event)

    async def board_annotations_broadcast(self, event):
        await self.send_json(event)

    async def board_share_eval_broadcast(self, event):
        await self.send_json(event)

    async def student_board_update_broadcast(self, event):
        await self.send_json(event)

    async def coach_guide_move_broadcast(self, event):
        await self.send_json(event)

    # Database Helpers
    @database_sync_to_async
    def get_user(self, user_id):
        return User.objects.get(id=user_id)

    @database_sync_to_async
    def get_session(self, session_id):
        try:
            return Session.objects.get(id=session_id)
        except Session.DoesNotExist:
            return None

    @database_sync_to_async
    def get_or_create_board_state(self, session):
        obj, created = BoardState.objects.get_or_create(session=session)
        from classroom.utils import validate_fen
        fen = validate_fen(obj.current_fen)
        if obj.current_fen != fen:
            obj.current_fen = fen
            obj.save()
        return obj

    @database_sync_to_async
    def save_board_fen(self, board_state, fen):
        from classroom.utils import validate_fen
        board_state.current_fen = validate_fen(fen)
        board_state.save()

    @database_sync_to_async
    def save_board_mode(self, board_state, mode):
        board_state.board_mode = mode
        board_state.save()

    @database_sync_to_async
    def save_board_permissions(self, board_state, student_moves):
        board_state.student_moves_enabled = student_moves
        board_state.save()

    @database_sync_to_async
    def save_board_annotations(self, board_state, annotations):
        board_state.annotations = annotations
        board_state.save()

    @database_sync_to_async
    def add_board_annotation(self, board_state, annotation):
        ann = list(board_state.annotations)
        ann.append(annotation)
        board_state.annotations = ann
        board_state.save()

    @database_sync_to_async
    def clear_board_annotations(self, board_state):
        board_state.annotations = []
        board_state.save()

    @database_sync_to_async
    def log_session_event(self, session, event_type, data, actor):
        SessionEvent.objects.create(
            session=session,
            event_type=event_type,
            event_data=data,
            actor=actor
        )

    @database_sync_to_async
    def save_board_pgn(self, board_state, pgn):
        board_state.pgn = pgn or ""
        board_state.save()

    @database_sync_to_async
    def append_move_to_pgn(self, board_state, move):
        import chess
        import chess.pgn
        import io
        pgn_str = board_state.pgn or ""
        try:
            if pgn_str.strip():
                # Parse existing PGN
                game = chess.pgn.read_game(io.StringIO(pgn_str))
            else:
                game = chess.pgn.Game()
                # If starting from custom position, set it up
                if board_state.current_fen != "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1":
                    game.setup(chess.Board(board_state.current_fen))
            
            if not game:
                game = chess.pgn.Game()
            
            # Find the leaf node of main line
            node = game
            while node.variations:
                node = node.variation(0)
            
            node.add_main_line(move)
            
            # Export to string without headers
            exporter = chess.pgn.StringExporter(headers=False, variations=False, comments=False)
            new_pgn = game.accept(exporter).strip()
            
            board_state.pgn = new_pgn
            board_state.save()
            return new_pgn
        except Exception as e:
            print("Error appending move to PGN:", e)
            return pgn_str

    @database_sync_to_async
    def get_student_profile(self, user):
        try:
            return user.student_profile
        except Student.DoesNotExist:
            return None

    @database_sync_to_async
    def check_session_authorization(self, session, user):
        if user.role == 'manager':
            return True
        if user.role == 'coach':
            try:
                return session.coach.user == user
            except Exception:
                return False
        if user.role == 'student':
            return session.session_participants.filter(student__user=user).exists()
        if user.role == 'parent':
            return session.session_participants.filter(student__parent_email=user.email).exists()
        return False

    @database_sync_to_async
    def save_board_permissions_new(self, board_state, student_moves_enabled, student_id):
        from academy.models import Student
        board_state.student_moves_enabled = student_moves_enabled
        if student_id:
            try:
                board_state.student_with_move_rights = Student.objects.get(id=student_id)
            except Student.DoesNotExist:
                board_state.student_with_move_rights = None
        else:
            board_state.student_with_move_rights = None
        board_state.save()

    @database_sync_to_async
    def load_lesson_plan(self, board_state, lesson_plan_id):
        from classroom.models import LessonPlan, LessonStep
        from classroom.utils import validate_fen
        try:
            lesson_plan = LessonPlan.objects.get(id=lesson_plan_id)
            first_step = lesson_plan.steps.order_by('order').first()
            board_state.active_lesson_plan = lesson_plan
            board_state.active_lesson_step = first_step
            board_state.current_fen = validate_fen(first_step.fen if first_step else None)
            board_state.pgn = (first_step.pgn if first_step else "") or ""
            board_state.annotations = []
            board_state.save()
            return lesson_plan, first_step
        except LessonPlan.DoesNotExist:
            return None, None

    @database_sync_to_async
    def load_next_or_prev_step(self, board_state, direction):
        from classroom.models import LessonStep
        from classroom.utils import validate_fen
        if not board_state.active_lesson_plan or not board_state.active_lesson_step:
            return None
        current_step = board_state.active_lesson_step
        steps = board_state.active_lesson_plan.steps.order_by('order')
        
        target_step = None
        if direction == 'next':
            target_step = steps.filter(order__gt=current_step.order).first()
        elif direction == 'prev':
            target_step = steps.filter(order__lt=current_step.order).last()
            
        if target_step:
            board_state.active_lesson_step = target_step
            board_state.current_fen = validate_fen(target_step.fen)
            board_state.pgn = target_step.pgn or ""
            board_state.annotations = []
            board_state.save()
            return target_step
        return None

