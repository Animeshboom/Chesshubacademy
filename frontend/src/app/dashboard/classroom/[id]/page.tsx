'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/utils/api';
import { useParams, useRouter } from 'next/navigation';
import ChessBoard, { validateFen } from '@/components/chess/ChessBoard';
import { useStockfish } from '@/hooks/useStockfish';
import {
  Video, ClipboardList, ArrowLeft, Activity, Loader2,
  CheckCircle, Clock, Users, MessageSquare, Hand, Sparkles, RefreshCw,
  Lock, Unlock, Eye, EyeOff, FlipHorizontal, Trash2, Send, Plus, BookOpen, ChevronRight, ChevronLeft
} from 'lucide-react';
import dynamic from 'next/dynamic';

const ZoomPanel = dynamic(() => import('@/components/zoom/ZoomPanel'), { ssr: false });

interface SessionDetail {
  id: string; title: string; class_type: string;
  scheduled_start: string; status: string;
  notes?: string; topics_covered?: string;
  coach: { user: { first_name: string; last_name: string } };
  students: { student: { id: string; user: { first_name: string; last_name: string } }; attendance_status: string }[];
  zoom_meeting?: { join_url: string; start_url: string };
}

interface Chapter {
  title: string;
  fen: string;
  pgn: string;
}

export default function ClassroomPage() {
  const { id } = useParams() as { id: string };
  const { user } = useAuth();
  const router = useRouter();
  const isCoach = user?.role === 'coach' || user?.role === 'manager';

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Stockfish hook
  const { evaluation, bestMove, isAnalyzing, analyzePosition } = useStockfish();

  // Classroom modes and permissions
  const [boardFen, setBoardFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [boardPgn, setBoardPgn] = useState('');
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  const [studentMovesEnabled, setStudentMovesEnabled] = useState(false);
  const [boardMode, setBoardMode] = useState('teaching'); // teaching, analysis, puzzle, practice
  const [boardAnnotations, setBoardAnnotations] = useState<any[]>([]);
  const [shareEval, setShareEval] = useState(false);

  // Active items
  const [studies, setStudies] = useState<any[]>([]);
  const [lessonPlans, setLessonPlans] = useState<any[]>([]);
  const [studiesMode, setStudiesMode] = useState<'studies' | 'lessons'>('lessons');
  const [puzzles, setPuzzles] = useState<any[]>([]);
  const [homeworkTemplates, setHomeworkTemplates] = useState<any[]>([]);
  const [selectedStudy, setSelectedStudy] = useState<any | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(-1);

  const [activeLessonPlanId, setActiveLessonPlanId] = useState<string | null>(null);
  const [activeLessonStep, setActiveLessonStep] = useState<any | null>(null);
  const [studentWithMoveRights, setStudentWithMoveRights] = useState<string | null>(null);

  // Classroom control states
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [chatMessages, setChatMessages] = useState<{ name: string; role: string; message: string; timestamp: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [activeParticipants, setActiveParticipants] = useState<{ id: string; name: string; role: string }[]>([]);
  const [handRaises, setHandRaises] = useState<string[]>([]);
  const [zoomData, setZoomData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'moves' | 'users' | 'studies' | 'homework' | 'notes'>('chat');
  const [elapsed, setElapsed] = useState(0);

  // Simul Grid & Coach Drop-In states
  const [studentBoards, setStudentBoards] = useState<Record<string, { name: string; fen: string }>>({});
  const [guidingStudentId, setGuidingStudentId] = useState<string | null>(null);
  const [showSimulGrid, setShowSimulGrid] = useState(false);

  // Study Import input
  const [studyUrlInput, setStudyUrlInput] = useState('');
  const [importingStudy, setImportingStudy] = useState(false);

  // Custom Position setup
  const [customFenInput, setCustomFenInput] = useState('');
  const [showBoardEditor, setShowBoardEditor] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState<string | 'move' | null>('move');
  const [editorActiveColor, setEditorActiveColor] = useState<'w' | 'b'>('w');

  // Wrap-up Complete Class modal
  const [showWrap, setShowWrap] = useState(false);
  const [wrapStep, setWrapStep] = useState(1);
  const [wrapData, setWrapData] = useState({ duration: 50, topics: '', notes: '', homeworkId: '' });
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent'>>({});
  const [wrapMsg, setWrapMsg] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const myStudentIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (session) {
      const myStudentProfile = session.students.find((s: any) => s.student.user.id === user?.id || (s.student as any).user_id === user?.id);
      myStudentIdRef.current = myStudentProfile?.student?.id || null;
    }
  }, [session, user]);

  // Load classroom and metadata
  const loadData = useCallback(async () => {
    try {
      const [sessRes, zoomRes, studiesRes, puzzlesRes, hwRes, lessonsRes] = await Promise.all([
        api.get(`/academy/sessions/${id}/`),
        api.get(`/classroom/sessions/${id}/zoom/`).catch(() => null),
        api.get('/classroom/studies/').catch(() => ({ data: [] })),
        api.get('/homework/puzzles/').catch(() => ({ data: [] })),
        api.get('/homework/templates/').catch(() => ({ data: [] })),
        api.get('/classroom/lesson-plans/').catch(() => ({ data: [] }))
      ]);

      setSession(sessRes.data);
      if (zoomRes) setZoomData(zoomRes.data);
      setStudies(studiesRes.data || []);
      setPuzzles(puzzlesRes.data || []);
      setHomeworkTemplates(hwRes.data || []);
      setLessonPlans(lessonsRes.data || []);

      const att: Record<string, 'present' | 'absent'> = {};
      sessRes.data.students.forEach((s: any) => {
        att[s.student.id] = s.attendance_status === 'absent' ? 'absent' : 'present';
      });
      setAttendance(att);
    } catch {
      setError('Failed to load classroom session.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Establish WebSocket Channel Connection
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
    const wsUrl = `${wsProtocol}//${wsHost}/ws/classroom/${id}/?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Classroom Operating System WebSocket Connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'board_sync':
          if (data.fen) {
            const safeFen = validateFen(data.fen, "websocket_board_sync");
            setBoardFen(safeFen);
            setBoardPgn(data.pgn || '');
            analyzePosition(safeFen);
          }
          setStudentMovesEnabled(data.student_moves_enabled);
          setBoardMode(data.board_mode || 'teaching');
          setBoardAnnotations(data.annotations || []);
          setActiveLessonPlanId(data.active_lesson_plan || null);
          setActiveLessonStep(data.active_lesson_step || null);
          setStudentWithMoveRights(data.student_with_move_rights || null);
          break;
        case 'board_sync_broadcast':
          if (data.fen) {
            const safeFen = validateFen(data.fen, "websocket_board_sync_broadcast");
            setBoardFen(safeFen);
            setBoardPgn(data.pgn || '');
            analyzePosition(safeFen);
            if (data.clear_annotations) {
              setBoardAnnotations([]);
            }
          }
          setActiveLessonPlanId(data.active_lesson_plan || null);
          setActiveLessonStep(data.active_lesson_step || null);
          setStudentMovesEnabled(data.student_moves_enabled);
          setStudentWithMoveRights(data.student_with_move_rights || null);
          break;
        case 'board_permissions_broadcast':
          setStudentMovesEnabled(data.student_moves_enabled);
          setStudentWithMoveRights(data.student_with_move_rights || null);
          break;
        case 'board_mode_broadcast':
          setBoardMode(data.board_mode);
          break;
        case 'board_annotations_broadcast':
          setBoardAnnotations(data.annotations || []);
          break;
        case 'board_clear_annotations_broadcast':
          setBoardAnnotations([]);
          break;
        case 'board_share_eval_broadcast':
          setShareEval(data.share);
          break;
        case 'chat_message_broadcast':
          setChatMessages(prev => [
            ...prev,
            {
              name: data.name,
              role: data.role,
              message: data.message,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
          break;
        case 'presence_join':
          setActiveParticipants(prev => {
            if (prev.some(p => p.id === data.user_id)) return prev;
            return [...prev, { id: data.user_id, name: data.name, role: data.role }];
          });
          break;
        case 'presence_leave':
          setActiveParticipants(prev => prev.filter(p => p.id !== data.user_id));
          break;
        case 'hand_raise_broadcast':
          setHandRaises(prev => {
            if (prev.includes(data.name)) return prev;
            return [...prev, data.name];
          });
          break;
        case 'student_board_update_broadcast':
          if (user?.role === 'coach' || user?.role === 'manager') {
            setStudentBoards(prev => ({
              ...prev,
              [data.student_id]: {
                name: data.name,
                fen: data.fen
              }
            }));
          }
          break;
        case 'coach_guide_move_broadcast':
          if (user?.role === 'student' && myStudentIdRef.current === data.student_id) {
            const safeFen = validateFen(data.fen, "coach_guided_move");
            setBoardFen(safeFen);
            analyzePosition(safeFen);
          }
          break;
        default:
          break;
      }
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [id, analyzePosition]);

  // Timer logic
  useEffect(() => {
    const timer = setInterval(() => setElapsed(e => e + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  // Scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Parse Chapter definitions from full Study PGN
  const parseChapters = (pgn: string): Chapter[] => {
    if (!pgn) return [];
    // Split by event tags
    const games = pgn.split(/\[Event\s+/).filter(Boolean);
    return games.map((game, index) => {
      const titleMatch = game.match(/\[Round\s+"([^"]+)"\]/) || game.match(/\[Annotator\s+"([^"]+)"\]/) || game.match(/\[White\s+"([^"]+)"\]/) || game.match(/\[Event\s+"([^"]+)"\]/);
      const title = titleMatch ? titleMatch[1] : `Chapter ${index + 1}`;
      const fenMatch = game.match(/\[FEN\s+"([^"]+)"\]/);
      const fen = validateFen(fenMatch ? fenMatch[1] : undefined, "parse_chapter");
      // extract actual PGN moves
      const pgnText = game.replace(/\[[^\]]+\]/g, '').trim();
      return { title, fen, pgn: pgnText };
    });
  };

  // Handle Study Selection
  useEffect(() => {
    if (selectedStudy?.pgn_data) {
      const parsed = parseChapters(selectedStudy.pgn_data);
      setChapters(parsed);
      setActiveChapterIndex(parsed.length > 0 ? 0 : -1);
    } else {
      setChapters([]);
      setActiveChapterIndex(-1);
    }
  }, [selectedStudy]);

  // Chapter Loader
  const loadChapter = (idx: number) => {
    if (idx < 0 || idx >= chapters.length) return;
    setActiveChapterIndex(idx);
    const chapter = chapters[idx];
    const safeFen = validateFen(chapter.fen, "study_chapter_load");
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'board_set_fen',
        fen: safeFen,
        pgn: chapter.pgn || ''
      }));
    }
  };

  // Lichess Study Import
  const handleImportStudy = async () => {
    if (!studyUrlInput.trim()) return;
    setImportingStudy(true);
    try {
      const res = await api.post('/classroom/studies/', { lichess_url: studyUrlInput.trim() });
      setStudies(prev => [res.data, ...prev]);
      setSelectedStudy(res.data);
      setStudyUrlInput('');
    } catch (err: any) {
      alert("Failed to import study: " + (err.response?.data?.error || err.message));
    } finally {
      setImportingStudy(false);
    }
  };

  // FEN setup loading
  const handleLoadCustomFen = () => {
    if (!customFenInput.trim() || !socket) return;
    const safeFen = validateFen(customFenInput.trim(), "manual_fen_load");
    socket.send(JSON.stringify({
      type: 'board_set_fen',
      fen: safeFen
    }));
    setCustomFenInput('');
  };

  const pieceSymbols: Record<string, string> = {
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
  };

  const fenToGrid = (fen: string): (string | null)[][] => {
    const grid: (string | null)[][] = Array.from({ length: 8 }, () => Array(8).fill(null));
    try {
      const parts = fen.split(' ');
      const boardPart = parts[0];
      const ranks = boardPart.split('/');
      for (let r = 0; r < 8; r++) {
        let c = 0;
        const rankStr = ranks[r];
        if (!rankStr) continue;
        for (let i = 0; i < rankStr.length; i++) {
          const char = rankStr[i];
          if (/\d/.test(char)) {
            c += parseInt(char);
          } else {
            grid[r][c] = char;
            c++;
          }
        }
      }
    } catch (e) {
      console.error("Error in fenToGrid:", e);
    }
    return grid;
  };

  const gridToFen = (grid: (string | null)[][], activeColor: 'w' | 'b'): string => {
    let boardPart = '';
    for (let r = 0; r < 8; r++) {
      let emptyCount = 0;
      for (let c = 0; c < 8; c++) {
        const piece = grid[r][c];
        if (piece === null) {
          emptyCount++;
        } else {
          if (emptyCount > 0) {
            boardPart += emptyCount;
            emptyCount = 0;
          }
          boardPart += piece;
        }
      }
      if (emptyCount > 0) {
        boardPart += emptyCount;
      }
      if (r < 7) {
        boardPart += '/';
      }
    }
    return `${boardPart} ${activeColor} KQkq - 0 1`;
  };

  const handleEditorSquareClick = (r: number, c: number) => {
    const grid = fenToGrid(boardFen);
    if (selectedPiece === null) {
      grid[r][c] = null;
    } else {
      grid[r][c] = selectedPiece;
    }
    const newFen = gridToFen(grid, editorActiveColor);
    setBoardFen(newFen);
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'board_set_fen',
        fen: newFen
      }));
    }
  };

  // Puzzle position loading
  const handleLoadPuzzle = (fen: string) => {
    if (!socket) return;
    const safeFen = validateFen(fen, "puzzle_load");
    socket.send(JSON.stringify({
      type: 'board_set_fen',
      fen: safeFen
    }));
  };

  // Move updates
  const handleBoardMove = (newFen: string, pgn: string, move?: { from: string; to: string }) => {
    const safeFen = validateFen(newFen, "board_move_callback");
    setBoardFen(safeFen);
    setBoardPgn(pgn);
    analyzePosition(safeFen);
    if (socket && socket.readyState === WebSocket.OPEN) {
      if (isCoach && guidingStudentId) {
        socket.send(JSON.stringify({
          type: 'coach_guide_move',
          student_id: guidingStudentId,
          fen: safeFen
        }));
      } else if (move) {
        socket.send(JSON.stringify({
          type: 'board_move',
          move: { from: move.from, to: move.to }
        }));
      }

      if (!isCoach) {
        socket.send(JSON.stringify({
          type: 'student_board_update',
          student_id: myStudentIdRef.current,
          name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Student',
          fen: safeFen
        }));
      }
    }
  };

  // Drawing updates
  const handleBoardDraw = (shapes: any[]) => {
    if (isCoach && socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'board_set_annotations',
        annotations: shapes
      }));
    }
  };

  // Reset
  const handleBoardReset = () => {
    if (!socket) return;
    socket.send(JSON.stringify({ type: 'board_reset' }));
  };

  // Clear drawings
  const handleClearDrawings = () => {
    if (!socket) return;
    socket.send(JSON.stringify({ type: 'board_clear_annotations' }));
  };

  // Student Moves Toggle
  const handleToggleStudentMoves = () => {
    if (!socket) return;
    socket.send(JSON.stringify({
      type: 'board_set_permissions',
      student_moves_enabled: !studentMovesEnabled
    }));
  };

  const getStudentIdFromUserId = (userId: string) => {
    const s = session?.students.find((s: any) => s.student.user.id === userId || (s.student as any).user_id === userId);
    return s?.student?.id;
  };

  const handleSetStudentMoveRights = (studentId: string | null) => {
    if (!socket) return;
    socket.send(JSON.stringify({
      type: 'board_set_permissions',
      student_moves_enabled: studentId !== null,
      student_id: studentId
    }));
  };

  // Share engine evaluation toggle
  const handleToggleShareEval = () => {
    if (!socket) return;
    const nextVal = !shareEval;
    setShareEval(nextVal);
    socket.send(JSON.stringify({
      type: 'board_share_eval',
      share: nextVal
    }));
  };

  // Chat message submission
  const sendChatMessage = () => {
    if (!socket || !chatInput.trim()) return;
    socket.send(JSON.stringify({
      type: 'chat_message',
      message: chatInput.trim()
    }));
    setChatInput('');
  };

  // Student raise hand
  const raiseHand = () => {
    if (!socket) return;
    socket.send(JSON.stringify({ type: 'hand_raise' }));
  };

  // Quick Assignment to all students present in the classroom
  const assignHomeworkToClass = async (hwId: string) => {
    const activeStudentIds = activeParticipants
      .filter(p => p.role === 'student')
      .map(p => p.id);

    if (activeStudentIds.length === 0) {
      alert("No active students connected to assign homework to.");
      return;
    }

    try {
      await api.post('/homework/assignments/assign/', {
        homework_id: hwId,
        student_ids: activeStudentIds
      });
      alert("Homework successfully assigned to all connected students!");
    } catch (err: any) {
      alert("Failed to assign homework: " + JSON.stringify(err.response?.data || err.message));
    }
  };

  // Complete Session Wrap-up
  const submitWrap = async () => {
    if (!session) return;
    try {
      await api.post(`/academy/sessions/${session.id}/complete/`, {
        actual_duration_minutes: wrapData.duration,
        topics_covered: wrapData.topics,
        notes: wrapData.notes,
        homework_id: wrapData.homeworkId || undefined,
        attendances: Object.entries(attendance).map(([sid, status]) => ({
          student_id: sid,
          status,
          feedback: wrapData.notes
        })),
      });
      setWrapMsg('✅ Session completed successfully!');
      setShowWrap(false);
      loadData();
    } catch (err: any) {
      setWrapMsg('Error: ' + JSON.stringify(err.response?.data));
    }
  };

  // Parse evaluation score to calculate height percentage
  const getEvalPercentage = () => {
    if (!evaluation) return 50;
    if (evaluation.includes('M')) {
      return evaluation.startsWith('-') ? 0 : 100;
    }
    const val = parseFloat(evaluation);
    if (isNaN(val)) return 50;
    // Map -8.0 to +8.0 range to 0-100%
    const score = Math.max(-8, Math.min(8, val));
    return ((score + 8) / 16) * 100;
  };

  // Parse PGN moves for display in Moves tab
  const getFormattedMovesList = () => {
    if (!boardPgn) return [];
    // remove headers, comments, and annotations
    const clean = boardPgn
      .replace(/\[[^\]]*\]/g, '')
      .replace(/\{[^}]*\}/g, '')
      .replace(/\d+\.+\s*/g, '')
      .trim();
    const tokens = clean.split(/\s+/).filter(Boolean);
    const moves = [];
    for (let i = 0; i < tokens.length; i += 2) {
      moves.push({
        num: Math.floor(i / 2) + 1,
        white: tokens[i],
        black: tokens[i + 1] || ''
      });
    }
    return moves;
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center flex-col gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-emerald-400" />
      <p className="text-sm text-emerald-400/80 animate-pulse font-medium tracking-wide">Loading Premium Classroom Environment...</p>
    </div>
  );

  if (error || !session) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <p className="text-sm text-slate-400 mb-4">{error || 'Session not found.'}</p>
      <button onClick={() => router.back()} className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition">
        <ArrowLeft className="w-4 h-4" /> Go Back
      </button>
    </div>
  );

  const displayEval = isCoach || shareEval;
  const myStudentProfile = session?.students.find((s: any) => s.student.user.id === user?.id || (s.student as any).user_id === user?.id);
  const myStudentId = myStudentProfile?.student?.id;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-16 shrink-0 bg-slate-900/60 border-b border-slate-800/80 backdrop-blur-md flex items-center justify-between px-6 z-10 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => router.back()} className="p-2 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/55 transition shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-extrabold text-white truncate leading-none mb-1">{session.title}</h1>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wide">
              Coach: {session.coach.user.first_name} {session.coach.user.last_name} · Type: {session.class_type}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/50 border border-slate-800 rounded-xl text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> {elapsed}m elapsed
          </div>

          <span className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase border tracking-wider ${
            session.status === 'scheduled' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
            session.status === 'completed' ? 'bg-slate-500/10 border-slate-500/30 text-slate-400' :
            'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}>{session.status}</span>

          {isCoach && (
            <button 
              onClick={() => setShowSimulGrid(prev => !prev)}
              className={`px-4 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wide transition flex items-center gap-1 border ${
                showSimulGrid 
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {showSimulGrid ? 'Hide Simul Grid' : 'Simul Grid'}
            </button>
          )}

          {isCoach && session.status === 'scheduled' && (
            <button onClick={() => setShowWrap(true)}
              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-wide transition shadow-lg shadow-emerald-500/20">
              Complete Class
            </button>
          )}

          {!isCoach && (
            <button onClick={raiseHand}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-wide transition flex items-center gap-1">
              <Hand className="w-3.5 h-3.5" /> Raise Hand
            </button>
          )}
        </div>
      </header>

      {/* Hand Raise Overlay alert */}
      {handRaises.length > 0 && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 py-2 px-6 text-xs text-amber-300 font-bold flex justify-between items-center shrink-0">
          <span className="flex items-center gap-2">
            <Hand className="w-4 h-4 animate-bounce" /> {handRaises[handRaises.length - 1]} raised their hand!
          </span>
          <button onClick={() => setHandRaises([])} className="text-[10px] bg-amber-500/20 hover:bg-amber-500/35 px-2.5 py-1 rounded-lg transition uppercase tracking-wide">Dismiss</button>
        </div>
      )}

      {/* Main Operating Workspace */}
      <main className="flex-1 flex flex-col lg:flex-row p-4 gap-4 min-h-0 overflow-auto">
        
        {/* Left column: Video Box */}
        <section className="w-full lg:w-[30%] xl:w-[25%] shrink-0 flex flex-col gap-4">
          <div className="flex-1 bg-slate-900/40 border border-slate-800/80 rounded-3xl overflow-hidden flex flex-col shadow-xl">
            <div className="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60 shrink-0">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold tracking-wider text-slate-300">Live Video Stream</span>
              </div>
              {session.zoom_meeting && (
                <a
                  href={isCoach ? session.zoom_meeting.start_url : session.zoom_meeting.join_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-450 text-[9px] text-white rounded-lg font-black uppercase transition flex items-center gap-1 shadow-md shadow-emerald-500/25 shrink-0"
                  title="Launch in Zoom Client or New Tab"
                >
                  <Video className="w-2.5 h-2.5" />
                  Launch Zoom
                </a>
              )}
            </div>
            
            <div className="flex-1 min-h-[300px] relative bg-slate-950">
              {zoomData ? (
                <ZoomPanel
                  meetingNumber={zoomData.meeting_number}
                  signature={zoomData.signature}
                  sdkKey={zoomData.sdk_key}
                  userName={zoomData.user_name}
                  userEmail={zoomData.user_email}
                  role={zoomData.role}
                  passWord={zoomData.password}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-500 bg-slate-950/80 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-400/80" />
                  <p className="text-xs font-semibold">Establishing encrypted media stream...</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Center column: Interactive Board Panel */}
        <section className="flex-1 flex flex-col items-center justify-start gap-4">
          {showSimulGrid && isCoach ? (
            <div className="w-full h-full flex flex-col">
              <div className="flex items-center justify-between mb-4 w-full">
                <div>
                  <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" /> Coach Simultaneous Grid
                  </h2>
                  <p className="text-[10px] text-slate-400 font-medium">Real-time view of student screens. Click drop-in to guide a specific board.</p>
                </div>
                {guidingStudentId && (
                  <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl">
                    <span className="text-[10px] font-bold text-amber-300">
                      Guiding: {studentBoards[guidingStudentId]?.name || 'Student'}
                    </span>
                    <button 
                      onClick={() => setGuidingStudentId(null)}
                      className="px-2 py-0.5 bg-rose-500 hover:bg-rose-600 text-white rounded text-[8px] font-black uppercase animate-pulse"
                    >
                      Exit Guide
                    </button>
                  </div>
                )}
              </div>

              {Object.keys(studentBoards).length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-3xl p-12 text-slate-500 gap-2">
                  <Users className="w-8 h-8 text-slate-655 animate-pulse" />
                  <p className="text-xs font-semibold">Waiting for student board updates...</p>
                  <p className="text-[10px]">Student board activity will stream here in real time as they move.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto max-h-[70vh] p-1 w-full">
                  {Object.entries(studentBoards).map(([studentId, board]) => {
                    const isGuidingThis = guidingStudentId === studentId;
                    return (
                      <div 
                        key={studentId} 
                        className={`bg-slate-900/40 border rounded-2xl p-4 flex flex-col gap-3 transition shadow-lg relative ${
                          isGuidingThis ? 'border-amber-500/70 ring-1 ring-amber-500/30' : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white truncate max-w-[150px]">{board.name}</span>
                          <button
                            onClick={() => {
                              if (isGuidingThis) {
                                setGuidingStudentId(null);
                              } else {
                                setGuidingStudentId(studentId);
                                const validated = validateFen(board.fen, "coach_drop_in");
                                setBoardFen(validated);
                                analyzePosition(validated);
                                setShowSimulGrid(false);
                                alert(`Dropped into ${board.name}'s board. Make moves on the main board to guide them!`);
                              }
                            }}
                            className={`px-3 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wide transition ${
                              isGuidingThis 
                                ? 'bg-rose-500 hover:bg-rose-600 text-white'
                                : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                            }`}
                          >
                            {isGuidingThis ? 'Exit Drop-in' : 'Drop In'}
                          </button>
                        </div>

                        {/* Read-only Chessboard view */}
                        <div className="aspect-square w-full max-w-[200px] mx-auto border border-slate-800 rounded-lg overflow-hidden pointer-events-none opacity-90 shadow-md">
                          <ChessBoard
                            initialFen={board.fen}
                            showControls={false}
                            interactive={false}
                          />
                        </div>

                        <div className="text-[9px] text-slate-400 font-mono truncate text-center bg-slate-950/60 p-1 rounded border border-slate-800/40">
                          {board.fen}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <>
              {isCoach && guidingStudentId && (
                <div className="w-full max-w-[500px] flex items-center justify-between bg-amber-500/10 border border-amber-500/35 p-3 rounded-2xl animate-pulse mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-xs font-bold text-amber-300">
                      Guided Mode Active: {studentBoards[guidingStudentId]?.name || 'Student'}
                    </span>
                  </div>
                  <button 
                    onClick={() => setGuidingStudentId(null)}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-[9px] font-black uppercase transition"
                  >
                    Exit Guided Mode
                  </button>
                </div>
              )}
          
          <div className="flex items-stretch gap-4 w-full justify-center">
            
            {/* Engine Evaluation Bar */}
            {displayEval && (
              <div className="w-6 bg-slate-900 border border-slate-800 rounded-full overflow-hidden flex flex-col relative py-1 shadow-2xl">
                <div 
                  className="bg-white transition-all duration-300 rounded-t-full" 
                  style={{ height: `${100 - getEvalPercentage()}%` }} 
                />
                <div 
                  className="bg-slate-950 transition-all duration-300 flex-1 rounded-b-full"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-[9px] font-black mix-blend-difference text-white rotate-90">
                    {evaluation}
                  </span>
                </div>
              </div>
            )}

            {/* Chessboard */}
            <div className="flex-1 max-w-[500px]">
              <ChessBoard
                initialFen={validateFen(
                  boardFen ||
                  (session as any)?.fen ||
                  selectedStudy?.starting_fen ||
                  undefined,
                  "classroom_page_fallback"
                )}
                onMove={handleBoardMove}
                interactive={showBoardEditor ? true : (isCoach || (session.status === 'scheduled' && studentMovesEnabled && (studentWithMoveRights === null || studentWithMoveRights === myStudentId)))}
                orientation={boardOrientation}
                annotations={boardAnnotations}
                onDraw={handleBoardDraw}
                drawableEnabled={isCoach && !showBoardEditor}
                showControls={false}
                editMode={showBoardEditor}
                selectedPiece={selectedPiece}
                onEditFen={(newFen) => {
                  setBoardFen(newFen);
                  if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({
                      type: 'board_set_fen',
                      fen: newFen
                    }));
                  }
                }}
              />
            </div>
          </div>

          {/* Quick Board Toolbar */}
          <div className="flex gap-2 justify-center flex-wrap max-w-[500px]">
            <button 
              onClick={() => setBoardOrientation(prev => prev === 'white' ? 'black' : 'white')}
              className="p-2 border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
              title="Flip Board"
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
              Flip Board
            </button>

            {isCoach && (
              <>
                <button 
                  onClick={handleToggleStudentMoves}
                  className={`p-2 border rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                    studentMovesEnabled 
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                      : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {studentMovesEnabled ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  {studentMovesEnabled ? 'Board Unlocked' : 'Lock Board'}
                </button>

                <button 
                  onClick={handleToggleShareEval}
                  className={`p-2 border rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                    shareEval 
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
                      : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {shareEval ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {shareEval ? 'Eval Shared' : 'Share Eval'}
                </button>

                <button 
                  onClick={handleClearDrawings}
                  className="p-2 border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Drawings
                </button>

                <button 
                  onClick={handleBoardReset}
                  className="p-2 border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset
                </button>
              </>
            )}
          </div>

          {/* Coach Board Setup & Curriculum position loading */}
          {isCoach && (
            <div className="w-full max-w-[500px] bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 space-y-3 shadow-lg">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste FEN position setup..."
                  value={customFenInput}
                  onChange={e => setCustomFenInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none text-slate-200"
                />
                <button 
                  onClick={handleLoadCustomFen}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition shrink-0"
                >
                  Load FEN
                </button>
                <button
                  onClick={() => setShowBoardEditor(prev => !prev)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1 ${
                    showBoardEditor
                      ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  🛠️ Board Editor
                </button>
              </div>

              {showBoardEditor && (
                <div className="border-t border-slate-800/80 pt-3 space-y-3">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block text-center">Visual Position Editor</span>
                  
                  {/* 8x8 Mini Grid */}
                  <div className="grid grid-cols-8 gap-0 border border-slate-850 max-w-[240px] mx-auto rounded-xl overflow-hidden shadow-inner">
                    {fenToGrid(boardFen).map((row, rIdx) => 
                      row.map((piece, cIdx) => {
                        const isDark = (rIdx + cIdx) % 2 === 1;
                        return (
                          <div
                            key={`${rIdx}-${cIdx}`}
                            onClick={() => handleEditorSquareClick(rIdx, cIdx)}
                            className={`aspect-square flex items-center justify-center cursor-pointer transition select-none text-xl ${
                              isDark ? 'bg-slate-800 hover:bg-slate-750' : 'bg-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            {piece && (
                              <span className={piece === piece.toUpperCase() ? 'text-white drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.9)]' : 'text-slate-950 font-black'}>
                                {pieceSymbols[piece] || piece}
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Active Color & Clear Presets */}
                  <div className="flex items-center justify-center gap-2 flex-wrap text-[10px]">
                    <span className="text-[9px] text-slate-400 font-bold uppercase">To Move:</span>
                    <button
                      onClick={() => {
                        setEditorActiveColor('w');
                        const grid = fenToGrid(boardFen);
                        const newFen = gridToFen(grid, 'w');
                        setBoardFen(newFen);
                        socket?.send(JSON.stringify({ type: 'board_set_fen', fen: newFen }));
                      }}
                      className={`px-2 py-0.5 rounded text-[8px] font-black uppercase transition ${
                        editorActiveColor === 'w' ? 'bg-emerald-500 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'
                      }`}
                    >
                      White
                    </button>
                    <button
                      onClick={() => {
                        setEditorActiveColor('b');
                        const grid = fenToGrid(boardFen);
                        const newFen = gridToFen(grid, 'b');
                        setBoardFen(newFen);
                        socket?.send(JSON.stringify({ type: 'board_set_fen', fen: newFen }));
                      }}
                      className={`px-2 py-0.5 rounded text-[8px] font-black uppercase transition ${
                        editorActiveColor === 'b' ? 'bg-emerald-500 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'
                      }`}
                    >
                      Black
                    </button>

                    <div className="w-px h-3 bg-slate-800 mx-1" />

                    <button
                      onClick={() => {
                        const emptyFen = '8/8/8/8/8/8/8/8 w KQkq - 0 1';
                        setBoardFen(emptyFen);
                        socket?.send(JSON.stringify({ type: 'board_set_fen', fen: emptyFen }));
                      }}
                      className="px-2 py-0.5 border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-455 rounded text-[8px] font-black uppercase transition"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => {
                        const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
                        setBoardFen(startFen);
                        socket?.send(JSON.stringify({ type: 'board_set_fen', fen: startFen }));
                      }}
                      className="px-2 py-0.5 border border-slate-800 bg-slate-950 hover:bg-slate-900 text-slate-350 rounded text-[8px] font-black uppercase transition"
                    >
                      Start Pos
                    </button>
                  </div>

                  {/* Palette */}
                  <div className="space-y-1.5 pt-1 text-center">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Palette (Select piece & click square)</span>
                    
                    {/* White pieces row */}
                    <div className="flex justify-center gap-1">
                      {['P', 'N', 'B', 'R', 'Q', 'K'].map(p => (
                        <button
                          key={p}
                          onClick={() => setSelectedPiece(p)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-lg transition border ${
                            selectedPiece === p 
                              ? 'bg-emerald-500/25 border-emerald-500 text-white shadow shadow-emerald-500/15' 
                              : 'bg-slate-950 border-slate-850 text-white hover:border-slate-700'
                          }`}
                          title={`White ${p}`}
                        >
                          {pieceSymbols[p]}
                        </button>
                      ))}
                    </div>

                    {/* Black pieces row */}
                    <div className="flex justify-center gap-1">
                      {['p', 'n', 'b', 'r', 'q', 'k'].map(p => (
                        <button
                          key={p}
                          onClick={() => setSelectedPiece(p)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-lg transition border ${
                            selectedPiece === p 
                              ? 'bg-emerald-500/25 border-emerald-500 text-white shadow shadow-emerald-500/15' 
                              : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'
                          }`}
                          title={`Black ${p}`}
                        >
                          {pieceSymbols[p]}
                        </button>
                      ))}

                      <div className="w-px h-7 bg-slate-800 mx-1" />

                      {/* Eraser */}
                      <button
                        onClick={() => setSelectedPiece(null)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition border ${
                          selectedPiece === null 
                            ? 'bg-rose-500/25 border-rose-500 text-rose-350 shadow shadow-rose-500/15' 
                            : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'
                        }`}
                        title="Eraser (Clear Square)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Pointer/Move tool */}
                      <button
                        onClick={() => setSelectedPiece('move')}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition border ${
                          selectedPiece === 'move'
                            ? 'bg-emerald-500/25 border-emerald-500 text-emerald-300 shadow shadow-emerald-500/15'
                            : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'
                        }`}
                        title="Move/Drag pieces"
                      >
                        <Hand className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
            </>
          )}
        </section>

        {/* Right column: Interactive Side Panel (Control Deck) */}
        <aside className="w-full lg:w-96 shrink-0 flex flex-col bg-slate-900/40 border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl min-h-[480px]">
          
          {/* Tab Selection */}
          <div className="flex bg-slate-900/80 border-b border-slate-800/80 overflow-x-auto shrink-0 scrollbar-none">
            {([
              { id: 'chat', label: 'Chat', icon: MessageSquare },
              { id: 'moves', label: 'Moves', icon: ClipboardList },
              { id: 'users', label: 'Students', icon: Users },
              { id: 'studies', label: 'Studies', icon: BookOpen },
              { id: 'homework', label: 'Homework', icon: ClipboardList },
            ] as const).map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 px-2 text-[10px] font-bold uppercase tracking-wider transition border-b-2 flex items-center justify-center gap-1 shrink-0 ${
                  activeTab === tab.id 
                    ? 'text-emerald-400 border-emerald-400 bg-emerald-500/5' 
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab contents */}
          <div className="flex-1 p-4 flex flex-col justify-between overflow-hidden">
            
            {/* 1. CHAT TAB */}
            {activeTab === 'chat' && (
              <div className="flex flex-col h-full justify-between overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
                  {chatMessages.length === 0 ? (
                    <p className="text-center text-slate-500 text-xs py-8 font-medium">Welcome to the classroom chat. Send a friendly message!</p>
                  ) : chatMessages.map((m, idx) => (
                    <div key={idx} className="text-xs bg-slate-950/30 p-2 border border-slate-800/40 rounded-xl">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-extrabold text-slate-200">{m.name}</span>
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ${
                          m.role === 'coach' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                        }`}>{m.role}</span>
                        <span className="ml-auto text-[8px] text-slate-500 font-medium">{m.timestamp}</span>
                      </div>
                      <p className="text-slate-350 font-medium whitespace-pre-wrap">{m.message}</p>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={chatInput} 
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500/60" 
                  />
                  <button 
                    onClick={sendChatMessage} 
                    className="px-3 py-2 bg-emerald-500 hover:bg-emerald-450 text-white rounded-xl text-xs font-bold transition flex items-center justify-center"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* 2. MOVES / PGN TAB */}
            {activeTab === 'moves' && (
              <div className="flex flex-col h-full justify-between overflow-hidden">
                <div className="flex-1 overflow-y-auto space-y-2 mb-3">
                  <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3">
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider mb-2">Moves notation (PGN)</p>
                    <div className="grid grid-cols-12 gap-1.5 text-xs text-slate-300 font-semibold font-mono">
                      {getFormattedMovesList().length === 0 ? (
                        <div className="col-span-12 text-center text-slate-500 py-4 font-normal font-sans">No moves played yet. Set up or start making moves.</div>
                      ) : getFormattedMovesList().map((mv, idx) => (
                        <React.Fragment key={idx}>
                          <span className="col-span-2 text-slate-500 text-right">{mv.num}.</span>
                          <span className="col-span-5 text-slate-200 font-bold bg-slate-900/30 px-1 py-0.5 rounded-md hover:bg-slate-800 transition cursor-pointer">{mv.white}</span>
                          <span className="col-span-5 text-slate-200 font-bold bg-slate-900/30 px-1 py-0.5 rounded-md hover:bg-slate-800 transition cursor-pointer">{mv.black}</span>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-2xl flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">Live Stockfish Engine</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-950 p-2 border border-slate-800/60 rounded-xl">
                      <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wide">Evaluation</span>
                      <span className="font-extrabold text-emerald-400">{evaluation || '—'}</span>
                    </div>
                    <div className="bg-slate-950 p-2 border border-slate-800/60 rounded-xl">
                      <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wide">Best Move</span>
                      <span className="font-bold text-slate-200 font-mono">{isAnalyzing ? '...' : bestMove || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. STUDENTS / PARTICIPANTS TAB */}
            {activeTab === 'users' && (
              <div className="flex flex-col h-full overflow-hidden">
                <h3 className="text-xs font-extrabold text-white flex items-center gap-1.5 mb-3">
                  <Users className="w-4 h-4 text-emerald-400" /> Connected Users ({activeParticipants.length})
                </h3>
                <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                  {activeParticipants.length === 0 ? (
                    <p className="text-center text-slate-500 text-xs py-8">Waiting for students to join...</p>
                  ) : activeParticipants.map(p => {
                    const studentId = getStudentIdFromUserId(p.id);
                    const hasMoveRights = studentId && studentWithMoveRights === studentId;
                    return (
                      <div key={p.id} className="flex items-center justify-between px-3.5 py-2.5 bg-slate-950/50 border border-slate-800/60 rounded-xl text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 bg-emerald-450 rounded-full animate-pulse" />
                          <span className="text-slate-100 font-bold">{p.name}</span>
                          {hasMoveRights && (
                            <span className="text-[8px] bg-amber-500/20 text-amber-400 font-extrabold uppercase px-1.5 py-0.5 rounded-md animate-pulse">
                              Moves
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isCoach && p.role === 'student' && (
                            <button
                              onClick={() => {
                                if (!studentId) return;
                                handleSetStudentMoveRights(hasMoveRights ? null : studentId);
                              }}
                              className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider transition ${
                                hasMoveRights
                                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                                  : 'bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {hasMoveRights ? 'Revoke Moves' : 'Grant Moves'}
                            </button>
                          )}
                          <span className="text-[8px] font-black bg-slate-800 px-2 py-0.5 rounded-md uppercase tracking-wider text-slate-400">{p.role}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. STUDIES TAB */}
            {activeTab === 'studies' && (
              <div className="flex flex-col h-full overflow-hidden space-y-3">
                <div className="flex bg-slate-950/50 p-1 border border-slate-805 rounded-xl shrink-0 gap-1.5">
                  <button
                    onClick={() => setStudiesMode('lessons')}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wide transition ${
                      studiesMode === 'lessons'
                        ? 'bg-emerald-500/10 text-emerald-400 font-black'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Lesson Plans
                  </button>
                  <button
                    onClick={() => setStudiesMode('studies')}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wide transition ${
                      studiesMode === 'studies'
                        ? 'bg-emerald-500/10 text-emerald-400 font-black'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Lichess Studies
                  </button>
                </div>

                {studiesMode === 'lessons' ? (
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Available Lesson Plans</span>
                    {lessonPlans.length === 0 ? (
                      <p className="text-center text-slate-500 text-xs py-4">No lesson plans created yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {lessonPlans.map(lp => (
                          <div key={lp.id} className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-2xl flex flex-col justify-between gap-2.5">
                            <div>
                              <p className="text-xs font-bold text-slate-200 truncate">{lp.title}</p>
                              <p className="text-[10px] text-slate-450 line-clamp-2 mt-0.5">{lp.description || 'No description.'}</p>
                              <span className="text-[8px] bg-slate-900 px-2 py-0.5 rounded text-slate-400 font-bold tracking-wide mt-1.5 inline-block">
                                {lp.steps_count || lp.steps?.length || 0} Steps
                              </span>
                            </div>
                            {isCoach && (
                              <button
                                onClick={() => socket?.send(JSON.stringify({ type: 'board_load_lesson', lesson_plan_id: lp.id }))}
                                className={`w-full py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition ${
                                  activeLessonPlanId === lp.id
                                    ? 'bg-emerald-500/25 border border-emerald-500/40 text-emerald-300'
                                    : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/10'
                                }`}
                              >
                                {activeLessonPlanId === lp.id ? 'Active Lesson' : 'Load Lesson Plan'}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-grow flex flex-col overflow-hidden space-y-3">
                    {isCoach && (
                      <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-3.5 space-y-2 shrink-0">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Import Lichess Study URL</span>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="https://lichess.org/study/..." 
                            value={studyUrlInput}
                            onChange={e => setStudyUrlInput(e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-emerald-500/50 text-slate-200" 
                          />
                          <button 
                            onClick={handleImportStudy}
                            disabled={importingStudy}
                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-450 text-white rounded-xl text-xs font-bold transition flex items-center justify-center shrink-0 disabled:opacity-50"
                          >
                            {importingStudy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                      <div className="space-y-1.5">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Available Studies</span>
                        {studies.length === 0 ? (
                          <p className="text-center text-slate-500 text-xs py-4">No studies imported yet.</p>
                        ) : (
                          <div className="space-y-1">
                            {studies.map(s => (
                              <button
                                key={s.id}
                                onClick={() => setSelectedStudy(s)}
                                className={`w-full text-left px-3 py-2 border rounded-xl text-xs font-bold transition truncate flex items-center justify-between ${
                                  selectedStudy?.id === s.id 
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                                    : 'border-slate-800 hover:bg-slate-850 text-slate-300'
                                }`}
                              >
                                <span>{s.title}</span>
                                <ChevronRight className="w-3.5 h-3.5 shrink-0 ml-1.5" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {selectedStudy && chapters.length > 0 && (
                        <div className="space-y-1.5 pt-3 border-t border-slate-800/80">
                          <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider block">Chapters inside {selectedStudy.title}</span>
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {chapters.map((ch, idx) => (
                              <button
                                key={idx}
                                onClick={() => loadChapter(idx)}
                                className={`w-full text-left px-3 py-1.5 border rounded-lg text-xs transition truncate flex items-center justify-between ${
                                  activeChapterIndex === idx 
                                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold' 
                                    : 'border-slate-800/50 hover:bg-slate-850/60 text-slate-400 font-medium'
                                }`}
                              >
                                <span>{ch.title}</span>
                                <span className="text-[8px] bg-slate-950 px-1.5 py-0.5 rounded text-slate-500 uppercase tracking-wide">FEN</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 5. HOMEWORK TAB */}
            {activeTab === 'homework' && (
              <div className="flex flex-col h-full overflow-hidden space-y-3">
                <h3 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4 text-emerald-450" /> Assign Homework to Class
                </h3>
                
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {homeworkTemplates.length === 0 ? (
                    <p className="text-center text-slate-500 text-xs py-8">No homework templates found.</p>
                  ) : homeworkTemplates.map(hw => (
                    <div key={hw.id} className="p-3 bg-slate-950/40 border border-slate-800/60 rounded-2xl flex flex-col justify-between gap-2.5">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-200 truncate">{hw.title}</p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{hw.description || 'No description provided.'}</p>
                      </div>
                      {isCoach && (
                        <button 
                          onClick={() => assignHomeworkToClass(hw.id)}
                          className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition"
                        >
                          Assign to Connected Class
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* Bottom Lesson Navigator bar */}
      {(isCoach || activeLessonPlanId) && activeLessonStep && (
        <footer className="h-16 shrink-0 bg-slate-900/60 border-t border-slate-800/80 backdrop-blur-md flex items-center justify-between px-6 z-10 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <BookOpen className="w-4 h-4 text-emerald-450 shrink-0" />
            <div className="min-w-0">
              <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider block">Active Lesson Step</span>
              <p className="text-xs font-bold text-white truncate">{activeLessonStep.title || 'Untitled Step'} ({activeLessonStep.step_type})</p>
            </div>
          </div>

          {(() => {
            const currentPlan = lessonPlans.find(lp => lp.id === activeLessonPlanId);
            const steps = currentPlan?.steps || [];
            if (steps.length === 0) return null;
            return (
              <div className="hidden md:flex items-center gap-1.5 max-w-md overflow-x-auto scrollbar-none py-1">
                {steps.map((st: any, idx: number) => {
                  const isCurrent = activeLessonStep && activeLessonStep.id === st.id;
                  return (
                    <button
                      key={st.id}
                      disabled={!isCoach}
                      onClick={() => {
                        if (socket) {
                          socket.send(JSON.stringify({
                            type: 'board_set_fen',
                            fen: st.fen,
                            pgn: st.pgn || ''
                          }));
                        }
                      }}
                      className={`h-6 px-2.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition ${
                        isCurrent
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10'
                          : 'bg-slate-950/60 border border-slate-850 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            );
          })()}
          
          <div className="flex items-center gap-4">
            {isCoach && (
              <div className="flex gap-2">
                <button 
                  onClick={() => socket?.send(JSON.stringify({ type: 'board_prev_step' }))}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider border border-slate-700/50"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>
                <button 
                  onClick={() => socket?.send(JSON.stringify({ type: 'board_next_step' }))}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-450 text-white rounded-xl transition flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider shadow-lg shadow-emerald-500/20"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {!isCoach && (
              <span className="text-[10px] bg-slate-950/80 border border-slate-850 px-3 py-1.5 rounded-xl text-slate-400 font-extrabold uppercase tracking-wider animate-pulse">
                Syncing with Coach...
              </span>
            )}
          </div>
        </footer>
      )}

      {/* Complete Session Wrap-up Modal */}
      {showWrap && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 w-full max-w-lg space-y-5 shadow-2xl">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Complete Classroom Session</h3>
            {wrapMsg && <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl">{wrapMsg}</div>}

            <div className="flex gap-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              {['Attendance', 'Summary', 'Confirmation'].map((s, i) => (
                <React.Fragment key={s}>
                  <span className={wrapStep === i + 1 ? 'text-emerald-400' : wrapStep > i + 1 ? 'text-emerald-500' : ''}>
                    {wrapStep > i + 1 ? '✓ ' : ''}{s}
                  </span>
                  {i < 2 && <span className="text-slate-700">→</span>}
                </React.Fragment>
              ))}
            </div>

            {wrapStep === 1 && (
              <div className="space-y-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Set Attendance Records</span>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {session.students.map(({ student }) => (
                    <div key={student.id} className="flex items-center justify-between px-3 py-2 bg-slate-950/40 border border-slate-850 rounded-xl">
                      <span className="text-xs text-slate-200 font-semibold">{student.user.first_name} {student.user.last_name}</span>
                      <div className="flex gap-1.5">
                        <button onClick={() => setAttendance({ ...attendance, [student.id]: 'present' })}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition ${attendance[student.id] === 'present' ? 'bg-emerald-550/20 border-emerald-550/40 text-emerald-455 font-black' : 'border-slate-800 text-slate-400'}`}>Present</button>
                        <button onClick={() => setAttendance({ ...attendance, [student.id]: 'absent' })}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition ${attendance[student.id] === 'absent' ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 font-black' : 'border-slate-800 text-slate-400'}`}>Absent</button>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setWrapStep(2)} className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold mt-2">Next Step →</button>
              </div>
            )}

            {wrapStep === 2 && (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Actual Duration (minutes)</label>
                  <input type="number" value={wrapData.duration} onChange={e => setWrapData({ ...wrapData, duration: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs focus:outline-none focus:border-emerald-500/50 text-slate-200" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Curriculum & Topics Covered</label>
                  <textarea rows={2.5} value={wrapData.topics} onChange={e => setWrapData({ ...wrapData, topics: e.target.value })}
                    placeholder="e.g. Sicilian defense structures, tactical puzzle solving..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs resize-none focus:outline-none focus:border-emerald-500/50 text-slate-200" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Session Feedback Notes</label>
                  <textarea rows={2.5} value={wrapData.notes} onChange={e => setWrapData({ ...wrapData, notes: e.target.value })}
                    placeholder="Focus areas, areas for improvement..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs resize-none focus:outline-none focus:border-emerald-500/50 text-slate-200" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Assign Homework Template</label>
                  <select
                    value={wrapData.homeworkId}
                    onChange={e => setWrapData({ ...wrapData, homeworkId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs focus:outline-none focus:border-emerald-500/50 text-slate-200"
                  >
                    <option value="">-- Select Homework (Optional) --</option>
                    {homeworkTemplates.map(hw => (
                      <option key={hw.id} value={hw.id}>{hw.title}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setWrapStep(1)} className="px-4 py-1.5 border border-slate-800 rounded-xl text-xs text-slate-400 font-bold">← Back</button>
                  <button onClick={() => setWrapStep(3)} className="px-5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold">Next Step →</button>
                </div>
              </div>
            )}

            {wrapStep === 3 && (
              <div className="space-y-4">
                <div className="bg-slate-950/50 border border-slate-850 rounded-2xl p-4 text-xs text-slate-400 space-y-2">
                  <p>Class duration: <span className="text-white font-bold">{wrapData.duration} mins</span></p>
                  <p>Topics taught: <span className="text-white font-bold">{wrapData.topics || '—'}</span></p>
                  <p>Active attendees: <span className="text-emerald-400 font-bold">{Object.values(attendance).filter(v => v === 'present').length}</span> / {session.students.length}</p>
                  {wrapData.homeworkId && (
                    <p>Assigned homework: <span className="text-white font-bold">{homeworkTemplates.find(hw => hw.id === wrapData.homeworkId)?.title || '—'}</span></p>
                  )}
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setWrapStep(2)} className="px-4 py-1.5 border border-slate-800 rounded-xl text-xs text-slate-400 font-bold">← Back</button>
                  <button onClick={() => setShowWrap(false)} className="px-4 py-1.5 border border-slate-800 rounded-xl text-xs text-slate-400 font-bold">Cancel</button>
                  <button onClick={submitWrap} className="px-5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-extrabold uppercase tracking-wide">Submit Completion ✓</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
