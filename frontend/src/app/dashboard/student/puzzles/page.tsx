'use client';
import React, { useState, useEffect } from 'react';
import ChessBoard from '@/components/chess/ChessBoard';
import { api } from '@/utils/api';
import { Chess } from 'chess.js';
import {
  Trophy, Gamepad2, Award, CheckCircle2, XCircle, Flame,
  Percent, Calendar, Compass, BookOpen,
  Clock, Lightbulb, Eye, FlipHorizontal, HelpCircle,
  Volume2, VolumeX, Sparkles, Filter, LayoutGrid, Search, ExternalLink
} from 'lucide-react';

interface ChessPuzzle {
  id: string;
  title: string;
  description: string;
  fen: string;
  moves: string;
  rating: number;
  themes: string[];
}

const LOCAL_PUZZLES: ChessPuzzle[] = [
  // --- EASIEST ---
  {
    id: 'lp_eas_1',
    title: 'Scholar\'s Mate (Mate in 1)',
    description: 'White to move. Deliver checkmate in a single move by capturing the weak f7 pawn.',
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1',
    moves: 'f3f7',
    rating: 800,
    themes: ['mateIn1', 'scholarsMate', 'easiest']
  },
  {
    id: 'lp_eas_2',
    title: 'Back-Rank Mate in One',
    description: 'White to move. Capitalize on Black\'s weak back rank to deliver an immediate checkmate.',
    fen: '6k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1',
    moves: 'd1d8',
    rating: 850,
    themes: ['mateIn1', 'backRank', 'easiest']
  },
  {
    id: 'lp_eas_3',
    title: 'Tactical Knight Fork',
    description: 'White to move. Move your knight to fork the black king and rook.',
    fen: 'r3kbnr/ppp2ppp/3p4/3Np3/4P1b1/3P1N2/PPPBQPPP/R3KB1R w KQkq - 0 1',
    moves: 'd5c7 e8d8 c7a8',
    rating: 900,
    themes: ['fork', 'tactics', 'easiest']
  },
  // --- EASY ---
  {
    id: 'lp3',
    title: 'Back-Rank Deflection',
    description: 'White to move. Deflect the black rook on the back rank to achieve checkmate.',
    fen: 'r5k1/5ppp/8/8/8/8/3R4/3R2K1 w - - 0 1',
    moves: 'd2d8 a8d8 d1d8',
    rating: 1100,
    themes: ['deflection', 'backRank', 'easy']
  },
  {
    id: 'lp4',
    title: 'Fried Liver Attack',
    description: 'White to move. Sacrifice your knight on f7 to draw out the black king and launch a double attack.',
    fen: 'r1bqkb1r/ppp2ppp/2n5/3np1N1/2B5/8/PPPP1PPP/RNBQK2R w KQkq - 0 1',
    moves: 'g5f7 e8f7 d1f3',
    rating: 1200,
    themes: ['friedLiver', 'sacrifice', 'easy']
  },
  // --- NORMAL ---
  {
    id: 'lp1',
    title: 'Smothered Mate in Two',
    description: 'White to move. Sacrifice your queen on g8 to force the black rook to capture, then deliver a classic smothered mate with your knight.',
    fen: '5r1k/5Qpp/7N/8/8/8/8/6K1 w - - 0 1',
    moves: 'f7g8 f8g8 h6f7',
    rating: 1400,
    themes: ['smotheredMate', 'mateIn2', 'normal']
  },
  {
    id: 'lp7',
    title: 'Hook Checkmate In Two',
    description: 'White to move. Coordinate your rook, knight, and pawn to deliver checkmate to the black king.',
    fen: '3r2k1/5R1p/6p1/8/4N3/8/8/6K1 w - - 0 1',
    moves: 'e4f6 g8h8 f7h7',
    rating: 1300,
    themes: ['mateIn2', 'hook', 'normal']
  },
  {
    id: 'lp8',
    title: 'Damiano\'s Deflection',
    description: 'White to move. Capture the black queen first, then handle the defensive rook threat on the back rank.',
    fen: 'r4rk1/ppp2ppp/2n5/8/8/8/q4PPP/R6K w - - 0 1',
    moves: 'a1a2 a8d8 a2a1',
    rating: 1350,
    themes: ['damianosMate', 'deflection', 'normal']
  },
  // --- HARD ---
  {
    id: 'lp2',
    title: 'Legal\'s Mate Trap',
    description: 'White to move. Sacrifice the queen to force a quick checkmate with your minor pieces.',
    fen: 'r2qkb1r/ppp2ppp/2np4/4N3/2B1P1b1/2N5/PPPP1PPP/R1BbK2R w KQkq - 0 6',
    moves: 'c4f7 e8e7 c3d5',
    rating: 1500,
    themes: ['legalsMate', 'mateIn2', 'hard']
  },
  {
    id: 'lp5',
    title: 'Anastasia\'s Mate Sequence',
    description: 'White to move. Open the h-file for your rook using a knight check followed by a queen sacrifice.',
    fen: 'r4rk1/1p3ppp/3p4/3N3Q/8/4R3/q4PPP/6K1 w - - 0 1',
    moves: 'd5e7 g8h8 h5h7 h8h7 e3h3',
    rating: 1600,
    themes: ['anastasia', 'mateIn3', 'hard']
  },
  {
    id: 'lp6',
    title: 'Greek Gift Sacrifice',
    description: 'White to move. Sacrifice your bishop on h7 to draw out the black king and launch a decisive attack.',
    fen: 'r1bq1rk1/pppnbppp/4p3/3p4/3P4/2PBPN2/PP3PPP/RNBQ1RK1 w - - 0 1',
    moves: 'd3h7 g8h7 f3g5 h7g8 d1h5',
    rating: 1700,
    themes: ['greekGift', 'sacrifice', 'hard']
  },
  {
    id: 'lp9',
    title: 'Underpromotion Triumph',
    description: 'White to move. Avoid stalemating the black king by promoting your pawn to a knight instead of a queen.',
    fen: '8/6P1/5K1k/8/8/8/8/8 w - - 0 1',
    moves: 'g7g8n h6h5 f6f5',
    rating: 1550,
    themes: ['underpromotion', 'hard']
  },
  {
    id: 'lp10',
    title: 'Boden\'s Diagonal Cross',
    description: 'White to move. Sacrifice your queen to open lines for a double bishop cross-mate.',
    fen: '2kr1b1r/pp1q1ppp/2p1n3/8/5B2/2Q5/PP3PPP/R3KBNR w KQ - 0 1',
    moves: 'c3c6 b7c6 f1a6',
    rating: 1650,
    themes: ['bodensMate', 'doubleBishop', 'hard']
  }
];

interface LichessChapter {
  id: string;
  title: string;
  themeKey: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: 'Basic Motifs' | 'Tactical Maneuvers' | 'Checkmates' | 'Special & Advanced';
  xpReward: number;
}

const LICHESS_CHAPTERS: LichessChapter[] = [
  {
    id: 'lc_fork',
    title: 'Tactical Fork',
    themeKey: 'fork',
    description: 'A double attack where a single piece threatens two or more opponent pieces at the same time.',
    difficulty: 'Beginner',
    category: 'Basic Motifs',
    xpReward: 30
  },
  {
    id: 'lc_pin',
    title: 'The Pin',
    themeKey: 'pin',
    description: 'Restricting an opponent piece from moving because doing so would expose a more valuable piece behind it.',
    difficulty: 'Beginner',
    category: 'Basic Motifs',
    xpReward: 30
  },
  {
    id: 'lc_skewer',
    title: 'The Skewer',
    themeKey: 'skewer',
    description: 'Attacking a valuable piece, forcing it to move and exposing a less valuable piece behind it.',
    difficulty: 'Beginner',
    category: 'Basic Motifs',
    xpReward: 35
  },
  {
    id: 'lc_hanging',
    title: 'Hanging Piece',
    themeKey: 'hangingPiece',
    description: 'Spotting and capturing loose, undefended opponent pieces that are left completely unprotected.',
    difficulty: 'Beginner',
    category: 'Basic Motifs',
    xpReward: 25
  },
  {
    id: 'lc_trapped',
    title: 'Trapped Piece',
    themeKey: 'trappedPiece',
    description: 'Surrounding and attacking an opponent piece that has zero safe escape squares left on the board.',
    difficulty: 'Intermediate',
    category: 'Basic Motifs',
    xpReward: 40
  },
  {
    id: 'lc_capturing_defender',
    title: 'Capturing Defender',
    themeKey: 'capturingDefender',
    description: 'Eliminate a key defending piece to win the target or square it was previously protecting.',
    difficulty: 'Intermediate',
    category: 'Tactical Maneuvers',
    xpReward: 40
  },
  {
    id: 'lc_deflection',
    title: 'Deflection',
    themeKey: 'deflection',
    description: 'Forcing an opponent\'s defending piece away from the square or line it needs to guard.',
    difficulty: 'Intermediate',
    category: 'Tactical Maneuvers',
    xpReward: 45
  },
  {
    id: 'lc_discovered',
    title: 'Discovered Attack',
    themeKey: 'discoveredAttack',
    description: 'Moving a blocking piece out of the way to unleash a hidden attack from a rook, bishop, or queen.',
    difficulty: 'Intermediate',
    category: 'Tactical Maneuvers',
    xpReward: 45
  },
  {
    id: 'lc_double_check',
    title: 'Double Check',
    themeKey: 'doubleCheck',
    description: 'Checking the king with two pieces at the same time. The king is forced to move, as blocking is impossible.',
    difficulty: 'Intermediate',
    category: 'Tactical Maneuvers',
    xpReward: 50
  },
  {
    id: 'lc_overload',
    title: 'Overloaded Piece',
    themeKey: 'overload',
    description: 'Targeting a defending piece that is overloaded with too many defensive duties at once.',
    difficulty: 'Intermediate',
    category: 'Tactical Maneuvers',
    xpReward: 40
  },
  {
    id: 'lc_decoy',
    title: 'Decoy / Attraction',
    themeKey: 'decoy',
    description: 'Luring an opponent\'s piece (often the king) onto a bad square using a sacrifice or threat.',
    difficulty: 'Advanced',
    category: 'Tactical Maneuvers',
    xpReward: 55
  },
  {
    id: 'lc_mate1',
    title: 'Mate in 1',
    themeKey: 'mateIn1',
    description: 'Deliver an immediate checkmate in a single, decisive move.',
    difficulty: 'Beginner',
    category: 'Checkmates',
    xpReward: 25
  },
  {
    id: 'lc_mate2',
    title: 'Mate in 2',
    themeKey: 'mateIn2',
    description: 'Deliver checkmate in a force sequence of two moves.',
    difficulty: 'Intermediate',
    category: 'Checkmates',
    xpReward: 35
  },
  {
    id: 'lc_mate3',
    title: 'Mate in 3',
    themeKey: 'mateIn3',
    description: 'Calculate and execute a checkmate sequence spanning three moves.',
    difficulty: 'Advanced',
    category: 'Checkmates',
    xpReward: 50
  },
  {
    id: 'lc_back_rank',
    title: 'Back-Rank Mate',
    themeKey: 'backRank',
    description: 'Mating the king on the back rank because it is trapped behind its own defensive pawns.',
    difficulty: 'Beginner',
    category: 'Checkmates',
    xpReward: 30
  },
  {
    id: 'lc_smothered',
    title: 'Smothered Mate',
    themeKey: 'smotheredMate',
    description: 'Delivering a beautiful checkmate with a knight to a king fully trapped by its own pieces.',
    difficulty: 'Advanced',
    category: 'Checkmates',
    xpReward: 55
  },
  {
    id: 'lc_sacrifice',
    title: 'Tactical Sacrifice',
    themeKey: 'sacrifice',
    description: 'Giving up material temporarily to force checkmate, win more material, or gain a positional advantage.',
    difficulty: 'Advanced',
    category: 'Special & Advanced',
    xpReward: 50
  },
  {
    id: 'lc_zugzwang',
    title: 'Zugzwang',
    themeKey: 'zugzwang',
    description: 'A state where any move the opponent is forced to make will severely damage their position.',
    difficulty: 'Advanced',
    category: 'Special & Advanced',
    xpReward: 60
  },
  {
    id: 'lc_underpromotion',
    title: 'Underpromotion',
    themeKey: 'underpromotion',
    description: 'Promoting a pawn to a knight, bishop, or rook to avoid a stalemate or to deliver a fork/tactic.',
    difficulty: 'Advanced',
    category: 'Special & Advanced',
    xpReward: 50
  },
  {
    id: 'lc_interference',
    title: 'Interference',
    themeKey: 'interference',
    description: 'Disrupting the defensive line between an opponent\'s defender and the piece it protects.',
    difficulty: 'Advanced',
    category: 'Special & Advanced',
    xpReward: 55
  },
  {
    id: 'lc_xray',
    title: 'X-Ray Attack',
    themeKey: 'xRayAttack',
    description: 'An attack that goes through an opponent\'s intermediate piece to strike a target behind it.',
    difficulty: 'Advanced',
    category: 'Special & Advanced',
    xpReward: 50
  }
];

export default function PuzzlesArena() {
  const [puzzles, setPuzzles] = useState<ChessPuzzle[]>(LOCAL_PUZZLES);
  const [activeIndex, setActiveIndex] = useState(0);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [pointsGained, setPointsGained] = useState(0);
  const [boardKey, setBoardKey] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const [muted, setMuted] = useState(false);
  
  // Game customization states
  const [boardTheme, setBoardTheme] = useState<'classic' | 'emerald' | 'ocean' | 'midnight'>('classic');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'easiest' | 'easy' | 'normal' | 'hard'>('all');
  const [selectedTheme, setSelectedTheme] = useState<string>('all');

  // Game states for multi-move sequence
  const [currentFen, setCurrentFen] = useState('');
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  
  // Game mode tabs
  const [arenaTab, setArenaTab] = useState<'daily' | 'weekly' | 'monthly' | 'assigned' | 'unlimited' | 'chapters'>('daily');

  // Lichess chapters filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChapterCategory, setSelectedChapterCategory] = useState<'all' | 'Basic Motifs' | 'Tactical Maneuvers' | 'Checkmates' | 'Special & Advanced'>('all');
  const [selectedChapterDifficulty, setSelectedChapterDifficulty] = useState<'all' | 'Beginner' | 'Intermediate' | 'Advanced'>('all');

  // Interactive statistics
  const [solveStats, setSolveStats] = useState({
    attempts: 0,
    solves: 0,
    streak: 0,
  });

  const [dbLeaderboard, setDbLeaderboard] = useState<any[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [isOffline, setIsOffline] = useState(false);

  // Sound Engine (Web Audio API)
  const playSound = (type: 'move' | 'check' | 'success' | 'error') => {
    if (muted || typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'move') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === 'check') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        osc.frequency.setValueAtTime(620, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else if (type === 'success') {
        const now = ctx.currentTime;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.4);
        osc.start();
        osc.stop(now + 0.4);
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(130, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.28);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.28);
        osc.start();
        osc.stop(ctx.currentTime + 0.28);
      }
    } catch (e) {
      console.error("Audio playback error:", e);
    }
  };

  // Load solve statistics and user cache on mount
  useEffect(() => {
    const saved = localStorage.getItem('chesshub_puzzle_stats');
    if (saved) {
      try { setSolveStats(JSON.parse(saved)); } catch {}
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      setIsOffline(!navigator.onLine);

      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed && parsed.email) {
            setCurrentUserEmail(parsed.email);
          }
        } catch {}
      }
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  // Fetch real-time leaderboard from backend
  useEffect(() => {
    api.get('/gamification/leaderboard/')
      .then(res => {
        if (res.data && Array.isArray(res.data)) {
          setDbLeaderboard(res.data);
        }
      })
      .catch(err => {
        console.error("Failed to load backend leaderboard:", err);
      });
  }, [solveStats]);

  // Filter local puzzles based on difficulty and theme
  const getFilteredLocalPuzzles = () => {
    return LOCAL_PUZZLES.filter(p => {
      const diffMatch = selectedDifficulty === 'all' || p.themes.includes(selectedDifficulty);
      const themeMatch = selectedTheme === 'all' || p.themes.includes(selectedTheme);
      return diffMatch && themeMatch;
    });
  };

  const filteredChapters = LICHESS_CHAPTERS.filter((chapter) => {
    const matchesSearch = 
      chapter.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      chapter.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chapter.themeKey.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedChapterCategory === 'all' || chapter.category === selectedChapterCategory;
    const matchesDifficulty = selectedChapterDifficulty === 'all' || chapter.difficulty === selectedChapterDifficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  // Load tab from URL query parameter if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'chapters') {
        setArenaTab('chapters');
      }
    }
  }, []);

  useEffect(() => {
    if (arenaTab === 'chapters') return;
    setSuccess(null);
    setPointsGained(0);
    setShowHint(false);
    
    if (isOffline) {
      const filtered = getFilteredLocalPuzzles();
      setPuzzles(filtered);
      setActiveIndex(0);
      return;
    }
    
    if (arenaTab === 'unlimited') {
      const filtered = getFilteredLocalPuzzles();
      setPuzzles(filtered);
      setActiveIndex(0);
    } else if (arenaTab === 'daily') {
      const fetchLichessDaily = async () => {
        try {
          const response = await fetch('https://lichess.org/api/puzzle/daily');
          if (response.ok) {
            const data = await response.json();
            const lichessPuzzle: ChessPuzzle = {
              id: `lichess-${data.puzzle.id}`,
              title: `Lichess Daily #${data.puzzle.id}`,
              description: `Play from ${data.puzzle.initialBg === 'white' ? 'White' : 'Black'}'s side. Find the best tactical sequence.`,
              fen: data.puzzle.fen,
              moves: data.puzzle.solution.join(' '),
              rating: data.puzzle.rating,
              themes: ['daily', 'lichess']
            };
            setPuzzles([lichessPuzzle]);
            setActiveIndex(0);
          } else {
            setPuzzles([LOCAL_PUZZLES[0]]);
            setActiveIndex(0);
          }
        } catch {
          setPuzzles([LOCAL_PUZZLES[0]]);
          setActiveIndex(0);
        }
      };
      fetchLichessDaily();
    } else {
      const fetchPuzzles = async () => {
        try {
          const response = await api.get('/homework/puzzles/');
          if (response.data && response.data.length > 0) {
            setPuzzles(response.data);
            setActiveIndex(0);
          } else {
            setPuzzles(LOCAL_PUZZLES);
            setActiveIndex(0);
          }
        } catch {
          setPuzzles(LOCAL_PUZZLES);
          setActiveIndex(0);
        }
      };
      fetchPuzzles();
    }
  }, [arenaTab, selectedDifficulty, selectedTheme, isOffline]);

  const activePuzzle = puzzles[activeIndex];
  const isLichess = activePuzzle?.id.startsWith('lichess');
  const isStudentTurn = isLichess 
    ? (currentMoveIndex % 2 === 1) 
    : (currentMoveIndex % 2 === 0);

  // Sync current FEN, move index, board orientation when active puzzle loads
  useEffect(() => {
    if (activePuzzle) {
      const solutionMoves = activePuzzle.moves.split(' ');
      
      if (activePuzzle.id.startsWith('lichess')) {
        // Lichess puzzle: play the opponent's first move automatically
        const firstMove = solutionMoves[0];
        const chess = new Chess(activePuzzle.fen);
        try {
          chess.move({
            from: firstMove.substring(0, 2),
            to: firstMove.substring(2, 4),
            promotion: firstMove.length > 4 ? firstMove.substring(4, 5) : 'q'
          });
          setCurrentFen(chess.fen());
          setCurrentMoveIndex(1); // Student's turn starts at index 1
          
          // Set orientation to the student's color (which is the side to move now)
          setOrientation(chess.turn() === 'w' ? 'white' : 'black');
        } catch (err) {
          console.error("Error playing opponent's first move:", err);
          setCurrentFen(activePuzzle.fen);
          setCurrentMoveIndex(0);
          setOrientation(activePuzzle.fen.split(' ')[1] === 'b' ? 'black' : 'white');
        }
      } else {
        // Local/DB puzzle: student plays the first move (index 0)
        setCurrentFen(activePuzzle.fen);
        setCurrentMoveIndex(0);
        const turn = activePuzzle.fen.split(' ')[1];
        setOrientation(turn === 'b' ? 'black' : 'white');
      }
    }
    setSeconds(0);
    setShowHint(false);
  }, [activeIndex, activePuzzle]);

  // Handle active countdown timer for unsolved puzzles
  useEffect(() => {
    if (success !== null || arenaTab === 'assigned' || !activePuzzle) return;
    const interval = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeIndex, success, arenaTab, activePuzzle]);

  // Solve step-by-step logic
  const handleMove = (fen: string, pgn: string, move?: { from: string; to: string }) => {
    if (!activePuzzle || !move || success !== null) return;

    const playedMove = (move.from + move.to).toLowerCase();
    const solutionMoves = activePuzzle.moves.split(' ');
    const correctMove = solutionMoves[currentMoveIndex].toLowerCase();

    if (playedMove === correctMove) {
      const nextIndex = currentMoveIndex + 1;
      
      // Check if puzzle is fully solved (no more moves left in solution)
      if (nextIndex >= solutionMoves.length) {
        setSuccess(true);
        playSound('success');
        const speedBonus = seconds <= 15 ? 10 : 0;
        const earned = 25 + speedBonus;
        setPointsGained(earned);
        
        // Update stats
        const newAttempts = solveStats.attempts + 1;
        const newSolves = solveStats.solves + 1;
        const newStreak = solveStats.streak + 1;
        const updatedStats = { attempts: newAttempts, solves: newSolves, streak: newStreak };
        setSolveStats(updatedStats);
        localStorage.setItem('chesshub_puzzle_stats', JSON.stringify(updatedStats));

        // Submit attempt to backend (only for standard database puzzles)
        if (!activePuzzle.id.startsWith('lp') && !activePuzzle.id.startsWith('lichess')) {
          api.post(`/homework/puzzles/${activePuzzle.id}/submit_attempt/`, { 
            is_correct: true 
          }).catch(() => {});
        }
        return;
      }

      // Play correct move sound
      try {
        const tempChess = new Chess(fen);
        if (tempChess.isCheck()) {
          playSound('check');
        } else {
          playSound('move');
        }
      } catch {
        playSound('move');
      }

      // Play computer response (move at nextIndex)
      const computerMove = solutionMoves[nextIndex];
      try {
        const chess = new Chess(fen);
        chess.move({
          from: computerMove.substring(0, 2),
          to: computerMove.substring(2, 4),
          promotion: computerMove.length > 4 ? computerMove.substring(4, 5) : 'q'
        });
        const nextFen = chess.fen();
        
        // Trigger computer move with a slight delay
        setTimeout(() => {
          setCurrentFen(nextFen);
          setCurrentMoveIndex(nextIndex + 1);
          
          // Sound for computer's move
          try {
            const nextChess = new Chess(nextFen);
            if (nextChess.isCheck()) {
              playSound('check');
            } else {
              playSound('move');
            }
          } catch {
            playSound('move');
          }
        }, 700);
      } catch (err) {
        console.error("Could not register computer move response:", err);
      }
    } else {
      // Wrong move
      setSuccess(false);
      playSound('error');
      setShakeTrigger(prev => prev + 1);
      const newAttempts = solveStats.attempts + 1;
      const newStreak = 0;
      const updatedStats = { attempts: newAttempts, solves: solveStats.solves, streak: newStreak };
      setSolveStats(updatedStats);
      localStorage.setItem('chesshub_puzzle_stats', JSON.stringify(updatedStats));

      if (!activePuzzle.id.startsWith('lp') && !activePuzzle.id.startsWith('lichess')) {
        api.post(`/homework/puzzles/${activePuzzle.id}/submit_attempt/`, { 
          is_correct: false 
        }).catch(() => {});
      }

      // Revert position and reset solving index
      setTimeout(() => {
        if (activePuzzle.id.startsWith('lichess')) {
          const firstMove = solutionMoves[0];
          try {
            const chess = new Chess(activePuzzle.fen);
            chess.move({
              from: firstMove.substring(0, 2),
              to: firstMove.substring(2, 4),
              promotion: firstMove.length > 4 ? firstMove.substring(4, 5) : 'q'
            });
            setCurrentFen(chess.fen());
            setCurrentMoveIndex(1);
          } catch {
            setCurrentFen(activePuzzle.fen);
            setCurrentMoveIndex(0);
          }
        } else {
          setCurrentFen(activePuzzle.fen);
          setCurrentMoveIndex(0);
        }
        setBoardKey(prev => prev + 1);
        setSuccess(null);
      }, 1400);
    }
  };

  const handleNext = () => {
    setSuccess(null);
    setPointsGained(0);
    setShowHint(false);
    
    if (arenaTab === 'unlimited') {
      const filtered = getFilteredLocalPuzzles();
      const pool = filtered;
      if (pool.length > 0) {
        let randIndex;
        do {
          randIndex = Math.floor(Math.random() * pool.length);
        } while (randIndex === activeIndex && pool.length > 1);
        setActiveIndex(randIndex);
      }
    } else {
      setActiveIndex((prev) => (prev + 1) % puzzles.length);
    }
    setBoardKey(prev => prev + 1);
  };

  const getPieceNameForHint = (move: string) => {
    if (!move) return "a piece";
    const fromSquare = move.substring(0, 2);
    return `the piece starting on ${fromSquare}`;
  };

  const accuracy = solveStats.attempts > 0 
    ? Math.round((solveStats.solves / solveStats.attempts) * 100) 
    : 100;

  // Real-time calculated leaderboard ranking
  const leaderboard = dbLeaderboard.length > 0
    ? dbLeaderboard.map((item, index) => ({
        rank: index + 1,
        name: item.name,
        solves: Math.round(item.total_xp / 25),
        xp: item.total_xp,
        streak: index === 0 ? 12 : index === 1 ? 8 : index === 2 ? 15 : 0,
        avatar: index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : '👤',
        isCurrentUser: item.email === currentUserEmail
      })).sort((a, b) => b.xp - a.xp)
    : [
        { rank: 1, name: 'Aarav Mehta', solves: 142, xp: 3550, streak: 12, avatar: '👑' },
        { rank: 2, name: 'Ananya Iyer', solves: 128, xp: 3200, streak: 8, avatar: '🥈' },
        { rank: 3, name: 'Vihaan Sharma', solves: 115, xp: 2875, streak: 15, avatar: '🥉' },
        {
          rank: 4,
          name: 'You (Student)',
          solves: solveStats.solves,
          xp: solveStats.solves * 25,
          streak: solveStats.streak,
          avatar: '♟️',
          isCurrentUser: true
        },
        { rank: 5, name: 'Prisha Patel', solves: 94, xp: 2350, streak: 4, avatar: '👤' },
        { rank: 6, name: 'Kabir Rao', solves: 87, xp: 2175, streak: 0, avatar: '👤' }
      ].sort((a, b) => b.xp - a.xp);

  return (
    <div className="space-y-6 text-left animate-fade-in">
      {isOffline && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl flex items-center justify-between text-amber-300 text-xs font-bold shrink-0">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            Offline Mode Active. Puzzles served from local offline database.
          </span>
        </div>
      )}
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Gamepad2 className="text-accent w-5 h-5 animate-bounce" /> Advanced Puzzle Arena
          </h2>
          <p className="text-xs text-muted mt-0.5">Solve interactive daily, weekly, or coach assigned puzzles to build tactical vision.</p>
        </div>

        {/* Board Settings Panel */}
        <div className="flex items-center gap-3 bg-background/40 border border-border p-2 rounded-2xl">
          {/* Mute Button */}
          <button
            onClick={() => setMuted(!muted)}
            className="p-1.5 hover:bg-background/80 rounded-xl text-muted hover:text-white transition"
            title={muted ? "Unmute sound effects" : "Mute sound effects"}
          >
            {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-green-400" />}
          </button>

          {/* Board Theme */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-muted">
            <LayoutGrid className="w-3.5 h-3.5" />
            <select
              value={boardTheme}
              onChange={(e) => setBoardTheme(e.target.value as any)}
              className="bg-transparent border-none text-white focus:outline-none cursor-pointer hover:text-primary transition"
            >
              <option className="bg-slate-900" value="classic">Classic Wood</option>
              <option className="bg-slate-900" value="emerald">Emerald Field</option>
              <option className="bg-slate-900" value="ocean">Ocean Navy</option>
              <option className="bg-slate-900" value="midnight">Midnight Black</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Accuracy %', val: `${accuracy}%`, icon: Percent, color: 'text-primary' },
          { label: 'Solve Streak', val: `${solveStats.streak} Solves`, icon: Flame, color: 'text-accent' },
          { label: 'Solves', val: solveStats.solves, icon: CheckCircle2, color: 'text-green-400' },
          { label: 'XP Claimed', val: solveStats.solves * 25, icon: Award, color: 'text-secondary' },
        ].map((s, idx) => (
          <div key={idx} className="glass p-4 rounded-2xl border-border flex items-center justify-between">
            <div>
              <p className="text-[9px] text-muted font-bold uppercase tracking-wider mb-1">{s.label}</p>
              <p className="text-xl font-extrabold text-white">{s.val}</p>
            </div>
            <div className={`p-2 bg-background/50 border border-border rounded-lg ${s.color}`}>
              <s.icon className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>

      {/* Arena tabs */}
      <div className="flex gap-2 border-b border-border pb-2 flex-wrap">
        {[
          { id: 'daily', label: 'Daily Puzzle', icon: Calendar },
          { id: 'weekly', label: 'Weekly Challenge', icon: Trophy },
          { id: 'monthly', label: 'Monthly Competition', icon: Compass },
          { id: 'assigned', label: 'Coach Assigned', icon: BookOpen },
          { id: 'unlimited', label: 'Unlimited Challenge', icon: Gamepad2 },
          { id: 'chapters', label: 'Lichess Chapters', icon: BookOpen }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setArenaTab(tab.id as any);
              setSuccess(null);
              setBoardKey(prev => prev + 1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              arenaTab === tab.id ? 'bg-primary text-white' : 'text-muted hover:text-foreground'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Unlimited Mode Interactive Filters (Difficulty & Theme Tags) */}
      {arenaTab === 'unlimited' && (
        <div className="glass p-4 rounded-2xl border-border flex flex-col md:flex-row gap-4 items-start md:items-center justify-between text-xs font-bold text-muted">
          {/* Difficulty select buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1"><Filter className="w-3.5 h-3.5" /> Difficulty:</span>
            {[
              { id: 'all', label: 'All Levels' },
              { id: 'easiest', label: 'Easiest (Mate in 1)' },
              { id: 'easy', label: 'Easy (Tactics)' },
              { id: 'normal', label: 'Normal (Mate in 2)' },
              { id: 'hard', label: 'Hard (Mates & Sacs)' }
            ].map(diff => (
              <button
                key={diff.id}
                onClick={() => setSelectedDifficulty(diff.id as any)}
                className={`px-2.5 py-1 rounded-lg border transition ${
                  selectedDifficulty === diff.id 
                    ? 'bg-primary/20 border-primary text-white' 
                    : 'border-border hover:border-border/80'
                }`}
              >
                {diff.label}
              </button>
            ))}
          </div>

          {/* Theme Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span>Tactical Theme:</span>
            {[
              { id: 'all', label: 'All Themes' },
              { id: 'mateIn1', label: 'Mate in 1' },
              { id: 'mateIn2', label: 'Mate in 2' },
              { id: 'fork', label: 'Forks' },
              { id: 'deflection', label: 'Deflection' },
              { id: 'sacrifice', label: 'Sacrifices' }
            ].map(theme => (
              <button
                key={theme.id}
                onClick={() => setSelectedTheme(theme.id)}
                className={`px-2.5 py-1 rounded-lg border transition ${
                  selectedTheme === theme.id 
                    ? 'bg-secondary/20 border-secondary text-white' 
                    : 'border-border hover:border-border/80'
                }`}
              >
                {theme.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Board & Panel */}
      {arenaTab === 'chapters' ? (
        <div className="space-y-6 animate-fade-in text-left">
          {/* Filters panel */}
          <div className="glass p-5 rounded-3xl border-border flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            {/* Search Bar */}
            <div className="relative w-full md:max-w-xs">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                <Search className="w-4 h-4 text-primary" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tactical themes..."
                className="w-full pl-9 pr-4 py-2.5 bg-background/50 border border-border rounded-2xl text-xs text-white placeholder:text-muted/60 focus:outline-none focus:border-primary transition"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center text-xs font-bold text-muted">
              {/* Category selector */}
              <div className="flex items-center gap-2">
                <span>Category:</span>
                <select
                  value={selectedChapterCategory}
                  onChange={(e) => setSelectedChapterCategory(e.target.value as any)}
                  className="bg-background/80 border border-border text-white px-3 py-2 rounded-xl focus:outline-none cursor-pointer hover:border-primary/50 transition font-bold"
                >
                  <option value="all">All Categories</option>
                  <option value="Basic Motifs">Basic Motifs</option>
                  <option value="Tactical Maneuvers">Tactical Maneuvers</option>
                  <option value="Checkmates">Checkmates</option>
                  <option value="Special & Advanced">Special & Advanced</option>
                </select>
              </div>

              {/* Difficulty selector */}
              <div className="flex items-center gap-2">
                <span>Difficulty:</span>
                <select
                  value={selectedChapterDifficulty}
                  onChange={(e) => setSelectedChapterDifficulty(e.target.value as any)}
                  className="bg-background/80 border border-border text-white px-3 py-2 rounded-xl focus:outline-none cursor-pointer hover:border-primary/50 transition font-bold"
                >
                  <option value="all">All Difficulties</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>
          </div>

          {/* Chapters Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChapters.map((chapter) => (
              <div
                key={chapter.id}
                className="glass p-6 rounded-3xl border-border/80 hover:border-primary/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)] flex flex-col justify-between h-full relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-2xl pointer-events-none group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-500" />
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wide border ${
                      chapter.difficulty === 'Beginner' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                      chapter.difficulty === 'Intermediate' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
                      'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                      {chapter.difficulty}
                    </span>
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted/70 bg-background/50 px-2 py-0.5 rounded border border-border">
                      {chapter.category}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-extrabold text-white group-hover:text-primary transition-colors flex items-center gap-2">
                      {chapter.title}
                    </h4>
                    <p className="text-xs text-muted leading-relaxed mt-2 font-medium">
                      {chapter.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-5 border-t border-border/40 flex justify-between items-center gap-2">
                  <span className="text-[10px] font-extrabold text-accent bg-accent/10 px-2.5 py-1 rounded-xl border border-accent/20 flex items-center gap-1.5 animate-pulse">
                    🏆 +{chapter.xpReward} XP
                  </span>

                  <a
                    href={`https://lichess.org/training/${chapter.themeKey}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-lg shadow-primary/20 group-hover:scale-[1.02]"
                  >
                    Train Lichess <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
            {filteredChapters.length === 0 && (
              <div className="col-span-full py-16 text-center text-xs text-muted border border-dashed border-border rounded-3xl">
                No chapters matches the search or filters. Try adjusting your terms!
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
        
        {/* Left & Middle Column (Puzzle Area): Spans 8 cols on desktop */}
        <div className="lg:col-span-8 grid md:grid-cols-12 gap-6 items-start">
          
          {/* Left board container */}
          <div className="md:col-span-7 flex justify-center">
            <div className="glass p-5 rounded-3xl border-border w-full max-w-md relative">
              {arenaTab === 'assigned' ? (
                <div className="py-24 text-center text-xs text-muted border border-dashed border-border rounded-2xl">
                  No custom puzzle sheets assigned by your coach currently.
                </div>
              ) : !activePuzzle ? (
                <div className="py-24 text-center text-xs text-muted border border-dashed border-border rounded-2xl">
                  No puzzles match the selected difficulty and tactical theme filters.
                </div>
              ) : (
                <>
                  {/* Dynamic Color Theme Filters applied to ChessBoard */}
                  <div className={`transition-all duration-300 ${
                    boardTheme === 'emerald' ? 'hue-rotate-[55deg] saturate-[1.2]' :
                    boardTheme === 'ocean' ? 'hue-rotate-[145deg] saturate-[1.1]' :
                    boardTheme === 'midnight' ? 'invert-[0.1] contrast-[1.2] grayscale' : ''
                  }`}>
                    <ChessBoard
                      key={`${activeIndex}-${boardKey}-${arenaTab}`}
                      initialFen={currentFen}
                      onMove={handleMove}
                      interactive={success === null && isStudentTurn}
                      showControls={false}
                      orientation={orientation}
                      shouldShakeTrigger={shakeTrigger}
                    />
                  </div>
                  <button
                    onClick={() => setOrientation(prev => prev === 'white' ? 'black' : 'white')}
                    className="absolute top-8 right-8 p-2 bg-background/80 hover:bg-background border border-border rounded-xl text-muted hover:text-white transition shadow-lg z-10"
                    title="Flip Board"
                  >
                    <FlipHorizontal className="w-4 h-4" />
                  </button>
                  <p className="text-[9px] text-muted text-center mt-3 font-semibold">
                    {isStudentTurn ? 'Make your move directly on the board. Validated instantly.' : 'Computer is playing response...'}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Right side info panel */}
          {arenaTab !== 'assigned' && activePuzzle && (
            <div className="md:col-span-5 space-y-4">
              <div className="glass p-5 rounded-3xl border-border space-y-4">
                <div>
                  <span className="text-[9px] text-accent font-bold uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-yellow-400 animate-spin" /> {arenaTab.toUpperCase()} CHALLENGE
                  </span>
                  <h3 className="text-md font-bold text-white mt-1 leading-snug">
                    {activePuzzle.title}
                  </h3>
                  <p className="text-xs text-muted mt-1.5 leading-relaxed">
                    {activePuzzle.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 items-center justify-between border-t border-b border-border/40 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[8px] font-extrabold uppercase tracking-wide bg-background/50 px-2 py-0.5 rounded border border-border text-primary">
                      Rating: {activePuzzle.rating} ELO
                    </span>
                    {activePuzzle.themes.map(theme => (
                      <span key={theme} className="text-[8px] font-extrabold uppercase tracking-wide bg-background/50 px-2 py-0.5 rounded border border-border text-muted">
                        #{theme}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-xs text-muted font-bold">
                    <Clock className="w-3.5 h-3.5 text-primary animate-pulse" /> Timer: <span className="text-white font-mono">{seconds}s</span>
                    {seconds <= 15 && success === null && (
                      <span className="text-green-400 text-[9px] font-extrabold animate-bounce tracking-wide bg-green-500/10 px-1.5 py-0.5 rounded">⚡ BONUS</span>
                    )}
                  </div>
                </div>

                {/* Feedbacks panel */}
                <div className="space-y-3">
                  {success === null && (
                    <>
                      {currentMoveIndex > (activePuzzle.id.startsWith('lichess') ? 1 : 0) ? (
                        <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-center text-primary text-xs font-bold animate-pulse">
                          ⭐ Correct move! Find the next move to complete the sequence...
                        </div>
                      ) : (
                        <div className="p-4 bg-background/30 border border-border rounded-xl text-center">
                          <p className="text-xs text-muted font-semibold">Find the correct move sequence to solve the puzzle.</p>
                        </div>
                      )}

                      <div className="flex gap-2 justify-stretch">
                        <button
                          onClick={() => setShowHint(true)}
                          className="flex-1 py-2 border border-border hover:border-primary/50 text-muted hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                        >
                          <Lightbulb className="w-3.5 h-3.5 text-yellow-400" /> Hint
                        </button>
                        <button
                          onClick={() => {
                            setSuccess(false);
                            playSound('error');
                            alert(`The correct moves are: ${activePuzzle.moves}`);
                          }}
                          className="flex-1 py-2 border border-border hover:border-red-500/50 text-muted hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-red-400" /> Give Up
                        </button>
                      </div>
                    </>
                  )}

                  {showHint && success === null && (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs rounded-xl flex items-start gap-2 animate-fade-in">
                      <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Tactical Hint:</p>
                        <p className="text-muted mt-0.5">Try moving {getPieceNameForHint(activePuzzle.moves.split(' ')[currentMoveIndex])}. Keep analyzing checks, captures, and threats.</p>
                      </div>
                    </div>
                  )}

                  {success === true && (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center space-y-2">
                      <div className="flex items-center justify-center gap-1.5 text-green-400 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4" /> Correct Solve!
                      </div>
                      <p className="text-xs text-muted">You earned +{pointsGained} XP rewards! {seconds <= 15 ? '⚡ Speed bonus applied!' : 'Outstanding tactics.'}</p>
                      <button
                        onClick={handleNext}
                        className="w-full py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-bold transition"
                      >
                        Next Challenge
                      </button>
                    </div>
                  )}

                  {success === false && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                      <div className="flex items-center justify-center gap-1.5 text-red-400 font-bold text-xs">
                        <XCircle className="w-4 h-4" /> Incorrect Move
                      </div>
                      <p className="text-xs text-muted mt-1">Try again! Resetting the board state...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (Leaderboard Sidebar): Spans 4 cols on desktop */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass p-5 rounded-3xl border-border space-y-4 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-secondary/15 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-yellow-400 animate-pulse" /> Academy Leaderboard
              </h4>
              <span className="text-[9px] text-muted font-bold uppercase bg-background/50 px-2 py-0.5 rounded border border-border">
                Monthly XP
              </span>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
              {leaderboard.map((student, index) => (
                <div
                  key={student.name}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all duration-300 ${
                    student.isCurrentUser
                      ? 'bg-gradient-to-r from-primary/20 to-secondary/10 border-primary/40 shadow-[0_0_12px_rgba(99,102,241,0.15)] scale-[1.02]'
                      : 'bg-background/25 border-border/50 hover:bg-background/40 hover:border-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted w-4 text-center font-mono">
                      #{index + 1}
                    </span>
                    <span className="text-base leading-none">
                      {student.avatar}
                    </span>
                    <div>
                      <p className={`text-xs font-bold ${student.isCurrentUser ? 'text-white' : 'text-foreground/95'}`}>
                        {student.name} {student.isCurrentUser && <span className="text-[9px] text-primary bg-primary/15 px-1.5 py-0.5 rounded font-extrabold ml-1">YOU</span>}
                      </p>
                      <p className="text-[8px] text-muted">
                        🔥 Streak: {student.streak} solves
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-extrabold text-white">
                      {student.xp} <span className="text-[8px] font-bold text-muted">XP</span>
                    </p>
                    <p className="text-[8px] text-muted font-mono">
                      {student.solves} solved
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-3 bg-secondary/5 border border-secondary/15 rounded-2xl text-[10px] text-muted leading-relaxed flex gap-2 items-start">
              <HelpCircle className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
              <span>Solve puzzles to earn XP, climb the ranks, and secure your place at the top of the ChessHub Academy leaderboard!</span>
            </div>
          </div>
        </div>

      </div>
      )}
    </div>
  );
}
