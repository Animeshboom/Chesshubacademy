'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { Api } from 'chessground/api';
import { Chessground } from 'chessground';
import { RotateCcw, Copy, CheckCircle, FlipHorizontal } from 'lucide-react';

interface ChessBoardProps {
  initialFen?: string;
  onMove?: (fen: string, pgn: string, move?: { from: string; to: string }) => void;
  interactive?: boolean;
  orientation?: 'white' | 'black';
  drawableEnabled?: boolean;
  annotations?: any[];
  onDraw?: (shapes: any[]) => void;
  showControls?: boolean;
  editMode?: boolean;
  selectedPiece?: string | 'move' | null;
  onEditFen?: (fen: string) => void;
  shouldShakeTrigger?: number;
}

// FEN utility helpers
function fenToGrid(fen: string): (string | null)[][] {
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
}

function gridToFen(grid: (string | null)[][], activeColor: string = 'w'): string {
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
}

export function validateFen(fen?: string, source: string = "unknown"): string {
  const DEFAULT_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

  if (!fen || typeof fen !== "string") {
    return DEFAULT_FEN;
  }

  // Handle common invalid string representations
  const cleaned = fen.trim();
  if (cleaned === "" || cleaned === "start" || cleaned === "undefined" || cleaned === "null") {
    return DEFAULT_FEN;
  }

  // Handle PGN tags containing FEN
  if (cleaned.includes('[') && cleaned.includes(']')) {
    const pgnFenMatch = cleaned.match(/\[FEN\s+"([^"]+)"\]/i);
    if (pgnFenMatch) {
      return validateFen(pgnFenMatch[1], `${source}_extracted_pgn_fen`);
    }
  }

  // Lenient syntax validation: must have 8 ranks separated by slashes
  const parts = cleaned.split(' ');
  const boardPart = parts[0];
  if (boardPart.split('/').length === 8) {
    return cleaned;
  }

  try {
    new Chess(cleaned);
    return cleaned;
  } catch (error) {
    return DEFAULT_FEN;
  }
}

export default function ChessBoard({
  initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  onMove,
  interactive = true,
  orientation = 'white',
  drawableEnabled = true,
  annotations = [],
  onDraw,
  showControls = true,
  editMode = false,
  selectedPiece = 'move',
  onEditFen,
  shouldShakeTrigger = 0,
}: ChessBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chessgroundRef = useRef<Api | null>(null);
  
  const safeFen = validateFen(initialFen, "initialization");
  const chessRef = useRef<Chess>(new Chess());
  
  try {
    chessRef.current = new Chess(safeFen);
  } catch (e) {
    // Keep starting position to avoid crashes, but allow rendering the safeFen
  }
  
  const [fen, setFen] = useState(safeFen);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState('White to move');

  // Custom Particle & Board Shake Engine states
  interface Particle {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
  }
  const [particles, setParticles] = useState<Particle[]>([]);
  const [shouldShake, setShouldShake] = useState(false);

  // Particle update loop
  useEffect(() => {
    if (particles.length === 0) return;
    const timer = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.1, // gravity simulation
            size: Math.max(0, p.size - 0.2),
          }))
          .filter((p) => p.size > 0)
      );
    }, 16);
    return () => clearInterval(timer);
  }, [particles]);

  const spawnParticles = (square: string, count = 15, isGold = false) => {
    const col = square.charCodeAt(0) - 97;
    const row = 8 - parseInt(square[1]);
    const actualCol = orientation === 'black' ? 7 - col : col;
    const actualRow = orientation === 'black' ? 7 - row : row;

    const x = (actualCol + 0.5) * 12.5;
    const y = (actualRow + 0.5) * 12.5;

    const newParticles = Array.from({ length: count }).map((_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 2.5;
      return {
        id: Date.now() + i + Math.random(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.8,
        color: isGold
          ? ['#ffd700', '#d4af37', '#f8fafc', '#fbbf24'][Math.floor(Math.random() * 4)]
          : ['#ef4444', '#f97316', '#fbbf24', '#f87171'][Math.floor(Math.random() * 4)],
        size: 3 + Math.random() * 6,
      };
    });
    setParticles((prev) => [...prev, ...newParticles]);
  };

  const triggerShake = () => {
    setShouldShake(true);
    setTimeout(() => setShouldShake(false), 500);
  };

  useEffect(() => {
    if (shouldShakeTrigger > 0) {
      triggerShake();
    }
  }, [shouldShakeTrigger]);

  // Handle clicking a square to place/erase a piece in edit mode
  const handleSquareClick = (square: string) => {
    if (!editMode) return;
    if (selectedPiece === undefined || selectedPiece === 'move') return;

    const grid = fenToGrid(fen);
    const c = square.charCodeAt(0) - 97;
    const r = 8 - parseInt(square[1]);

    if (selectedPiece === null) {
      grid[r][c] = null;
    } else {
      grid[r][c] = selectedPiece;
    }

    const activeColor = fen.split(' ')[1] || 'w';
    const newFen = gridToFen(grid, activeColor);
    setFen(newFen);
    chessgroundRef.current?.set({ fen: newFen });

    if (onEditFen) {
      onEditFen(newFen);
    } else if (onMove) {
      onMove(newFen, '');
    }
  };

  // Triggered on piece drops
  const handleMove = (orig: string, dest: string) => {
    if (editMode) {
      const grid = fenToGrid(fen);
      const origC = orig.charCodeAt(0) - 97;
      const origR = 8 - parseInt(orig[1]);
      const destC = dest.charCodeAt(0) - 97;
      const destR = 8 - parseInt(dest[1]);

      const piece = grid[origR][origC];
      grid[origR][origC] = null;
      grid[destR][destC] = piece;

      const activeColor = fen.split(' ')[1] || 'w';
      const newFen = gridToFen(grid, activeColor);
      setFen(newFen);
      chessgroundRef.current?.set({ fen: newFen });

      if (onEditFen) {
        onEditFen(newFen);
      } else if (onMove) {
        onMove(newFen, '');
      }
      return;
    }

    try {
      const move = chessRef.current.move({
        from: orig,
        to: dest,
        promotion: 'q', // default to queen for simplicity
      });

      if (move) {
        const newFen = chessRef.current.fen();
        const pgn = chessRef.current.pgn();
        setFen(newFen);
        updateStatus();

        if (onMove) {
          onMove(newFen, pgn, { from: orig, to: dest });
        }

        // Particle triggers
        if (move.captured) {
          spawnParticles(dest, 18, false);
          // Shake board on significant capture
          if (move.captured === 'q' || move.captured === 'r') {
            triggerShake();
          }
        }

        if (chessRef.current.isCheckmate()) {
          spawnParticles(dest, 45, true);
          triggerShake();
        } else if (chessRef.current.isCheck()) {
          triggerShake();
        }

        // Resync board to enforce accurate piece visuals (especially for promotions)
        chessgroundRef.current?.set({
          fen: newFen,
          turnColor: chessRef.current.turn() === 'w' ? 'white' : 'black',
          movable: {
            dests: getDests(),
          },
        });
      }
    } catch (e) {
      // Revert illegal moves in chessground
      chessgroundRef.current?.set({ fen: chessRef.current.fen() });
    }
  };

  const getDests = () => {
    try {
      const dests = new Map();
      chessRef.current.moves({ verbose: true }).forEach((m) => {
        if (!dests.has(m.from)) {
          dests.set(m.from, []);
        }
        dests.get(m.from).push(m.to);
      });
      return dests;
    } catch (error) {
      return new Map();
    }
  };

  const updateStatus = () => {
    try {
      const chess = chessRef.current;
      if (chess.isCheckmate()) {
        setStatus('Game Over: Checkmate!');
      } else if (chess.isDraw()) {
        setStatus('Game Over: Draw!');
      } else if (chess.isCheck()) {
        setStatus(`Check! ${chess.turn() === 'w' ? 'White' : 'Black'} to move`);
      } else {
        setStatus(`${chess.turn() === 'w' ? 'White' : 'Black'} to move`);
      }
    } catch (error) {
      setStatus("Error updating board status");
    }
  };

  // Initialize Chessground
  useEffect(() => {
    if (containerRef.current) {
      const validatedFen = validateFen(initialFen, "initial_effect");
      try {
        chessRef.current = new Chess(validatedFen);
      } catch (e) {
        chessRef.current = new Chess("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
      }
      setFen(validatedFen);
      updateStatus();

      const options = {
        fen: validatedFen,
        orientation: orientation,
        animation: {
          enabled: true,
          duration: 250,
        },
        movable: {
          color: (interactive ? (showControls ? 'both' : orientation) : undefined) as 'white' | 'black' | 'both' | undefined,
          free: editMode,
          dests: interactive && !editMode ? getDests() : new Map(),
          events: {
            after: handleMove,
          },
        },
        events: {
          select: handleSquareClick,
        },
        drawable: {
          enabled: drawableEnabled && !editMode,
          shapes: annotations,
          onChange: (shapes: any[]) => {
            if (onDraw) {
              onDraw(shapes);
            }
          }
        },
        draggable: {
          enabled: interactive,
          deleteOnDropOff: editMode,
        },
        selectable: {
          enabled: interactive,
        },
        highlight: {
          lastMove: true,
          check: true,
        },
        viewOnly: !interactive,
      };

      chessgroundRef.current = Chessground(containerRef.current, options);
    }

    return () => {
      chessgroundRef.current?.destroy();
    };
  }, []);

  // Update Chessground when props change
  useEffect(() => {
    if (chessgroundRef.current) {
      const validatedFen = validateFen(initialFen, "prop_update");
      
      chessgroundRef.current.set({
        fen: validatedFen,
        orientation: orientation,
        viewOnly: !interactive,
        animation: {
          enabled: true,
          duration: 250,
        },
        movable: {
          color: (interactive ? (showControls ? 'both' : orientation) : undefined) as 'white' | 'black' | 'both' | undefined,
          free: editMode,
          dests: interactive && !editMode ? getDests() : new Map(),
        },
        events: {
          select: handleSquareClick,
        },
        draggable: {
          enabled: interactive,
          deleteOnDropOff: editMode,
        },
        selectable: {
          enabled: interactive,
        },
        drawable: {
          enabled: drawableEnabled && !editMode,
          shapes: annotations,
        }
      });

      // Sync internal chess.js state if fen is updated from outside
      if (validatedFen !== chessRef.current.fen()) {
        try {
          chessRef.current = new Chess(validatedFen);
          setFen(validatedFen);
          updateStatus();
        } catch (e) {
          setFen(validatedFen);
          setStatus("Custom Position");
        }
      }
    }
  }, [initialFen, interactive, orientation, drawableEnabled, annotations, editMode, selectedPiece]);

  const handleReset = () => {
    const validatedFen = validateFen(initialFen, "manual_reset");
    try {
      chessRef.current = new Chess(validatedFen);
    } catch (e) {
      chessRef.current = new Chess("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    }
    const startFen = chessRef.current.fen();
    setFen(startFen);
    updateStatus();

    chessgroundRef.current?.set({
      fen: startFen,
      turnColor: 'white',
      movable: {
        dests: getDests(),
      },
    });

    if (onMove) {
      onMove(startFen, '');
    }
  };

  const handleCopyFen = () => {
    navigator.clipboard.writeText(fen);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!showControls) {
    return (
      <div className={`w-full max-w-[480px] aspect-square flex items-center justify-center p-2 bg-background/25 border border-border/40 rounded-3xl backdrop-blur-md shadow-2xl relative ${shouldShake ? 'animate-shake' : ''}`}>
        <style>{`
          @keyframes shake {
            0%, 100% { transform: translate(0, 0); }
            10%, 30%, 50%, 70%, 90% { transform: translate(-3px, 1px); }
            20%, 40%, 60%, 80% { transform: translate(3px, -1px); }
          }
          .animate-shake {
            animation: shake 0.4s ease-in-out;
          }
        `}</style>
        <div ref={containerRef} className="cg-wrap w-full h-full rounded-2xl overflow-hidden shadow-inner" />
        
        {/* Particle Canvas Overlay */}
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
          {particles.map((p) => (
            <div
              key={p.id}
              style={{
                position: 'absolute',
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.color,
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
                boxShadow: `0 0 8px ${p.color}`,
                transition: 'width 0.05s linear, height 0.05s linear',
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-stretch w-full max-w-5xl mx-auto">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translate(0, 0); }
          10%, 30%, 50%, 70%, 90% { transform: translate(-3px, 1px); }
          20%, 40%, 60%, 80% { transform: translate(3px, -1px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
      
      {/* Interactive Board Panel */}
      <div className="flex-1 glass p-4 rounded-2xl flex items-center justify-center border-border">
        <div className={`w-full max-w-[450px] aspect-square relative ${shouldShake ? 'animate-shake' : ''}`}>
          <div ref={containerRef} className="cg-wrap w-full h-full rounded-lg overflow-hidden border border-border" />
          
          {/* Particle Canvas Overlay */}
          <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
            {particles.map((p) => (
              <div
                key={p.id}
                style={{
                  position: 'absolute',
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  backgroundColor: p.color,
                  borderRadius: '50%',
                  transform: 'translate(-50%, -50%)',
                  boxShadow: `0 0 8px ${p.color}`,
                  transition: 'width 0.05s linear, height 0.05s linear',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="w-full lg:w-80 glass p-6 rounded-2xl border-border flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-semibold mb-4 text-foreground flex items-center gap-2">
            <SparkleIcon className="text-secondary" /> Analysis Board
          </h3>
          
          <div className="mb-4">
            <span className="text-xs text-muted block mb-1">Status</span>
            <div className="px-3 py-2 bg-background/50 border border-border rounded-lg text-sm font-medium text-foreground">
              {status}
            </div>
          </div>

          <div className="mb-6">
            <span className="text-xs text-muted block mb-1">Current FEN</span>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={fen}
                className="flex-1 text-xs px-3 py-2 bg-background/50 border border-border rounded-lg text-foreground focus:outline-none overflow-ellipsis"
              />
              <button
                onClick={handleCopyFen}
                className="p-2 border border-border rounded-lg bg-background/50 hover:bg-border transition text-foreground"
                title="Copy FEN"
              >
                {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleReset}
            className="w-full py-2.5 px-4 bg-background/40 hover:bg-border/60 border border-border rounded-xl transition flex items-center justify-center gap-2 text-sm font-medium text-foreground"
          >
            <RotateCcw className="w-4 h-4" /> Reset Board
          </button>
          
          <div className="p-3 bg-secondary/10 border border-secondary/20 rounded-xl text-xs text-secondary leading-relaxed">
            <strong>Pro Tip:</strong> Click and drag pieces to simulate legal chess moves. Use this interface to analyze opening variants or solve assigned tactical positions.
          </div>
        </div>
      </div>
    </div>
  );
}

function SparkleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}
