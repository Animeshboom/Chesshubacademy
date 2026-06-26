'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue } from 'framer-motion';
import { 
  Trophy, Shield, Target, Award, Clock, Compass, Phone, CheckCircle2, 
  ArrowRight, Users, Check, Sparkles, BookOpen, Star, CalendarDays, Activity,
  TrendingUp, Zap, ChevronRight, MessageSquare, Gamepad2, Award as BadgeIcon, MapPin
} from 'lucide-react';

import DemoBookingForm from '@/components/landing/DemoBookingForm';
import Gallery from '@/components/landing/Gallery';
import LearningJourney from '@/components/landing/LearningJourney';
import ReportPreview from '@/components/landing/ReportPreview';
import Testimonials from '@/components/landing/Testimonials';
import CoachProfile from '@/components/landing/CoachProfile';
import FAQ from '@/components/landing/FAQ';

// Custom counter animation
function AnimatedCounter({ 
  value, 
  duration = 2000, 
  suffix = "", 
  decimals = 0 
}: { 
  value: number; 
  duration?: number; 
  suffix?: string; 
  decimals?: number 
}) {
  const [count, setCount] = useState(0);
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let observer: IntersectionObserver;
    let animationFrameId: number;

    const startAnimation = () => {
      let startTimestamp: number | null = null;
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentValue = progress * value;
        setCount(currentValue);
        if (progress < 1) {
          animationFrameId = window.requestAnimationFrame(step);
        }
      };
      animationFrameId = window.requestAnimationFrame(step);
    };

    if (elementRef.current) {
      observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          startAnimation();
          observer.disconnect();
        }
      }, { threshold: 0.1 });
      observer.observe(elementRef.current);
    }

    return () => {
      if (observer) observer.disconnect();
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
    };
  }, [value, duration]);

  const formattedCount = count.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span ref={elementRef}>
      {formattedCount}{suffix}
    </span>
  );
}

// Sparkle/Particle components for background
function BackgroundParticles() {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number }>>([]);
  
  useEffect(() => {
    const items = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      delay: Math.random() * 5
    }));
    setParticles(items);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-accent/30"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0.2, 0.7, 0.2]
          }}
          transition={{
            duration: Math.random() * 15 + 10,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}

// 3D-Style Chessboard Interactive Redesign
function InteractiveBoard3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Parallax Rotation Motion values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-200, 200], [45, 35]); // Tilt effect
  const rotateY = useTransform(mouseX, [-200, 200], [-35, -25]); // Rotation effect
  
  // Sound readiness helper (simulated audio context click)
  const playChessSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      // Audio context block fallback
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full aspect-square max-w-[460px] flex items-center justify-center cursor-pointer select-none"
      style={{ perspective: 1200 }}
    >
      {/* Background Soft Gold / Royal Blue Cinematic light beams */}
      <div className="absolute w-[350px] h-[350px] rounded-full bg-primary/10 blur-3xl -z-10" />
      <div className="absolute w-[250px] h-[250px] rounded-full bg-accent/5 blur-3xl -z-10 translate-x-12 translate-y-12" />

      {/* Floating stars/constellation background inside container */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-60 animate-rotate-stars" />

      {/* 3D Rendered Perspective Chessboard */}
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="w-[320px] h-[320px] sm:w-[380px] sm:h-[380px] bg-[#0c1224] border-4 border-accent/40 rounded-3xl p-4 shadow-[0_50px_100px_rgba(0,0,0,0.8),0_0_80px_rgba(29,78,216,0.15)] relative transform-gpu animate-float-board"
      >
        {/* Reflection glossy overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 rounded-2xl pointer-events-none z-20" />

        {/* Board grid squares */}
        <div className="w-full h-full border border-slate-800 rounded-xl grid grid-cols-4 grid-rows-4 overflow-hidden bg-slate-950/80 relative" style={{ transformStyle: 'preserve-3d' }}>
          {Array.from({ length: 16 }).map((_, idx) => {
            const isDark = (Math.floor(idx / 4) + (idx % 4)) % 2 === 1;
            return (
              <div 
                key={idx}
                className={`w-full h-full border-[0.5px] border-slate-900/30 transition-colors duration-500 ${
                  isDark ? 'bg-slate-900/50' : 'bg-[#0f172e]/30'
                }`}
              />
            );
          })}

          {/* Glowing King - standing upright in 3D */}
          <motion.div
            initial={{ opacity: 0, z: 200, y: -50 }}
            animate={{ 
              opacity: 1, 
              z: 50, 
              y: [-12, -22, -12],
            }}
            transition={{
              opacity: { duration: 1, delay: 0.3 },
              z: { duration: 1, delay: 0.3, type: 'spring' },
              y: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
            }}
            style={{ 
              transform: 'translateZ(50px) rotateX(-40deg)',
              transformStyle: 'preserve-3d'
            }}
            onHoverStart={playChessSound}
            className="absolute top-[20%] left-[20%] w-16 h-16 flex items-center justify-center group"
          >
            {/* Soft gold light pulse ring */}
            <div className="absolute inset-0 rounded-full bg-accent/20 blur-md scale-125 animate-pulse-glow" />
            <div className="text-6xl drop-shadow-[0_12px_12px_rgba(212,175,55,0.7)] group-hover:scale-110 transition-transform cursor-default">
              👑
            </div>
            {/* Floating indicator */}
            <div className="absolute -top-4 bg-accent/90 text-slate-950 font-black text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full scale-0 group-hover:scale-100 transition-transform shadow-lg shadow-accent/20">
              Gold King
            </div>
          </motion.div>

          {/* Floating Knight - performing leap leaps with particles */}
          <motion.div
            initial={{ opacity: 0, x: 80, y: 160 }}
            animate={{ 
              opacity: 1,
              x: [80, 80, 0, 0, 80],
              y: [160, 0, 0, 160, 160],
              rotate: [0, -10, 10, -5, 0]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
            style={{ 
              transform: 'translateZ(40px) rotateX(-40deg)',
              transformStyle: 'preserve-3d'
            }}
            onHoverStart={playChessSound}
            className="absolute top-[10%] left-[10%] w-16 h-16 flex items-center justify-center group"
          >
            {/* Royal blue pulse ring */}
            <div className="absolute inset-0 rounded-full bg-primary/30 blur-lg scale-110" />
            <div className="text-6xl drop-shadow-[0_12px_12px_rgba(29,78,216,0.6)] group-hover:scale-110 transition-transform cursor-default">
              ♞
            </div>
            <div className="absolute -top-4 bg-primary/95 text-white font-extrabold text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full scale-0 group-hover:scale-100 transition-transform shadow-md shadow-primary/30">
              Knight
            </div>
          </motion.div>

          {/* Interactive Rook piece */}
          <motion.div
            initial={{ opacity: 0, y: 150 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.6 }}
            style={{ 
              transform: 'translateZ(30px) rotateX(-40deg)',
              transformStyle: 'preserve-3d'
            }}
            onHoverStart={playChessSound}
            className="absolute bottom-[15%] right-[20%] w-12 h-12 flex items-center justify-center group"
          >
            <div className="text-5xl drop-shadow-[0_6px_6px_rgba(255,255,255,0.35)] group-hover:scale-110 transition-transform cursor-default">
              ♜
            </div>
          </motion.div>

          {/* Interactive Pawn */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.9, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            style={{ 
              transform: 'translateZ(20px) rotateX(-40deg)',
              transformStyle: 'preserve-3d'
            }}
            onHoverStart={playChessSound}
            className="absolute top-[40%] right-[30%] w-10 h-10 flex items-center justify-center group"
          >
            <div className="text-4xl drop-shadow-[0_4px_4px_rgba(255,255,255,0.25)] group-hover:scale-110 transition-transform cursor-default">
              ♟️
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

// 1. LIVE CLASSES: Animated Classroom preview UI component
function ClassroomPreviewSection() {
  const [raiseHandActive, setRaiseHandActive] = useState(false);
  const [messages, setMessages] = useState([
    { user: 'Coach Plamen', text: 'Let us study the back rank mate pattern.', role: 'coach' },
    { user: 'Aman (Student)', text: 'Is Rd8 the winning move here?', role: 'student' }
  ]);
  const [newMsg, setNewMsg] = useState('');

  const triggerMockMessage = () => {
    if (!newMsg.trim()) return;
    setMessages(prev => [...prev, { user: 'You (Demo)', text: newMsg.trim(), role: 'student' }]);
    setNewMsg('');
    setTimeout(() => {
      setMessages(prev => [...prev, { user: 'Coach Plamen', text: 'Correct! That is a forced checkmate.', role: 'coach' }]);
    }, 1000);
  };

  return (
    <div className="glass rounded-3xl border border-accent/20 overflow-hidden shadow-2xl bg-[#090e1f]/90 relative">
      <div className="h-10 bg-slate-950/80 px-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
        </div>
        <span className="text-[10px] text-accent font-extrabold uppercase tracking-widest font-mono">Live Classroom Console</span>
        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-black animate-pulse">Class Active</span>
      </div>

      <div className="grid lg:grid-cols-12 gap-4 p-4">
        {/* Left: Simulated Video Feeds */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          {/* Coach Video box */}
          <div className="relative aspect-video rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center">
            <div className="absolute top-2 left-2 px-2 py-0.5 bg-slate-950/80 rounded-md text-[8px] font-bold text-white uppercase tracking-wider">Coach Plamen</div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-xl mx-auto">♟️</div>
              <p className="text-[10px] text-slate-400 font-mono">Audio waveform active</p>
            </div>
            {/* Waveform graphic */}
            <div className="absolute bottom-2 right-2 flex items-end gap-0.5 h-4">
              <span className="w-0.5 bg-emerald-400 h-2 animate-bounce" style={{ animationDelay: '0.1s' }} />
              <span className="w-0.5 bg-emerald-400 h-3 animate-bounce" style={{ animationDelay: '0.3s' }} />
              <span className="w-0.5 bg-emerald-400 h-1 animate-bounce" style={{ animationDelay: '0.5s' }} />
              <span className="w-0.5 bg-emerald-400 h-4 animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          </div>

          {/* Student Video box */}
          <div className="relative aspect-video rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center">
            <div className="absolute top-2 left-2 px-2 py-0.5 bg-slate-950/80 rounded-md text-[8px] font-bold text-white uppercase tracking-wider">Junior Champion (Aman)</div>
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xl mx-auto">♞</div>
            </div>
            {raiseHandActive && (
              <div className="absolute inset-0 bg-accent/10 backdrop-blur-[1px] flex items-center justify-center animate-pulse">
                <span className="bg-accent text-slate-950 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg shadow-accent/20">✋ Hand Raised</span>
              </div>
            )}
          </div>

          <button 
            onClick={() => setRaiseHandActive(!raiseHandActive)}
            className={`w-full py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition ${
              raiseHandActive ? 'bg-accent text-slate-950 shadow-md' : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-850'
            }`}
          >
            {raiseHandActive ? 'Lower Hand' : 'Raise Hand (Demo)'}
          </button>
        </div>

        {/* Center: Mini interactive chessboard */}
        <div className="lg:col-span-5 aspect-square bg-[#0f172a] rounded-2xl border border-slate-800 p-2 flex items-center justify-center relative">
          <div className="w-full h-full grid grid-cols-4 grid-rows-4 rounded-xl overflow-hidden border border-slate-900 bg-slate-950/90">
            {Array.from({ length: 16 }).map((_, idx) => (
              <div key={idx} className={`w-full h-full flex items-center justify-center ${
                ((Math.floor(idx / 4) + (idx % 4)) % 2 === 1) ? 'bg-slate-900/60' : 'bg-[#0f172e]/30'
              }`}>
                {idx === 0 && <span className="text-2xl select-none">♜</span>}
                {idx === 3 && <span className="text-2xl select-none">♚</span>}
                {idx === 12 && <span className="text-2xl select-none text-accent">♖</span>}
                {idx === 15 && <span className="text-2xl select-none text-accent">♔</span>}
              </div>
            ))}
          </div>
          <div className="absolute bottom-4 bg-slate-950/90 border border-slate-800 px-3 py-1.5 rounded-xl text-[9px] text-slate-400 text-center font-bold">
            Live evaluation shared by Coach: <span className="text-accent">+2.4 (White Winning)</span>
          </div>
        </div>

        {/* Right: Classroom Chat Feed */}
        <div className="lg:col-span-3 flex flex-col h-full justify-between min-h-[220px]">
          <div className="flex-1 overflow-y-auto space-y-2 max-h-48 pr-1 scrollbar-none">
            {messages.map((m, idx) => (
              <div key={idx} className={`p-2 rounded-xl text-[10px] ${m.role === 'coach' ? 'bg-accent/10 border border-accent/20 text-slate-200' : 'bg-slate-950/60 border border-slate-850 text-slate-400'}`}>
                <span className="font-extrabold uppercase text-[8px] text-accent block mb-0.5">{m.user}</span>
                {m.text}
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-1.5">
            <input 
              type="text" 
              placeholder="Ask coach..."
              value={newMsg} 
              onChange={e => setNewMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && triggerMockMessage()}
              className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-850 rounded-xl text-[10px] text-slate-200 focus:outline-none focus:border-accent/40" 
            />
            <button onClick={triggerMockMessage} className="px-3 bg-accent text-slate-950 rounded-xl text-[10px] font-black uppercase">Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 2. DAILY PUZZLE: Interactive mini card puzzle
function DailyPuzzleSection() {
  const [puzzleSolved, setPuzzleSolved] = useState(false);
  const [wrongMove, setWrongMove] = useState(false);

  const handleCorrectSolve = () => {
    setWrongMove(false);
    setPuzzleSolved(true);
  };

  const handleIncorrectSolve = () => {
    setWrongMove(true);
    setTimeout(() => setWrongMove(false), 800);
  };

  return (
    <div className="glass p-6 rounded-3xl border border-accent/20 shadow-2xl relative overflow-hidden flex flex-col justify-between h-full bg-[#0a0e1f]/80">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-accent font-extrabold uppercase tracking-widest font-mono">Daily Tactic Challenge</span>
          <span className="text-[10px] text-slate-500 font-bold font-mono">ID: #4928</span>
        </div>
        <h4 className="text-base font-extrabold text-white">White to Move & Win</h4>
        <p className="text-[11px] text-slate-400 leading-relaxed">Find the tactical pin that winning material in 1 move.</p>
      </div>

      {/* Grid for chess puzzle */}
      <div className="my-6 aspect-square max-w-[240px] mx-auto bg-slate-950 border-2 border-slate-850 rounded-2xl overflow-hidden grid grid-cols-3 grid-rows-3 relative">
        {Array.from({ length: 9 }).map((_, i) => {
          const isDark = (Math.floor(i / 3) + (i % 3)) % 2 === 1;
          return (
            <div key={i} className={`w-full h-full flex items-center justify-center transition-all ${
              isDark ? 'bg-slate-900/60' : 'bg-slate-950/20'
            }`}>
              {/* Queen piece on top left */}
              {i === 0 && !puzzleSolved && (
                <motion.button 
                  onClick={handleCorrectSolve}
                  whileHover={{ scale: 1.15 }}
                  className="text-4xl filter drop-shadow-[0_4px_4px_rgba(212,175,55,0.4)] cursor-pointer focus:outline-none bg-transparent border-none"
                >
                  ♕
                </motion.button>
              )}
              {/* Target square for Queen */}
              {i === 8 && puzzleSolved && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-4xl text-accent drop-shadow-[0_4px_8px_rgba(212,175,55,0.6)]">
                  ♕
                </motion.div>
              )}
              {/* Defending Knight */}
              {i === 2 && (
                <span className="text-3xl text-slate-600 select-none">♞</span>
              )}
              {/* Trapped King */}
              {i === 5 && (
                <span className="text-3xl text-slate-600 select-none">♚</span>
              )}
            </div>
          );
        })}

        <AnimatePresence>
          {wrongMove && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 font-extrabold text-xs uppercase"
            >
              Incorrect Move. Try again!
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-3">
        {puzzleSolved ? (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center">
            <p className="text-[10px] text-emerald-400 font-black uppercase tracking-wider">🎉 Puzzle Solved! +50 XP Awarded</p>
          </div>
        ) : (
          <div className="flex gap-2">
            <button 
              onClick={handleIncorrectSolve}
              className="flex-1 py-2 border border-slate-800 rounded-xl text-[10px] font-extrabold uppercase tracking-wide text-slate-400 hover:text-slate-200"
            >
              Knight d4
            </button>
            <button 
              onClick={handleCorrectSolve}
              className="flex-1 py-2 bg-accent text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-wide"
            >
              Queen e3
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// 3. PROGRESS TRACKING: SVG ELO progression graph
function EloProgressSection() {
  return (
    <div className="glass p-6 rounded-3xl border border-accent/20 shadow-2xl relative overflow-hidden flex flex-col justify-between h-full bg-[#0a0e1f]/80">
      <div className="space-y-2">
        <span className="text-[10px] text-accent font-extrabold uppercase tracking-widest font-mono">Performance Metric</span>
        <h4 className="text-base font-extrabold text-white">Continuous Elo Progression</h4>
        <p className="text-[11px] text-slate-400">Monthly Elo growth plotted automatically from live class ratings.</p>
      </div>

      {/* SVG line chart */}
      <div className="my-8 relative h-36 w-full">
        <svg viewBox="0 0 400 150" className="w-full h-full overflow-visible">
          {/* Grid lines */}
          <line x1="0" y1="30" x2="400" y2="30" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3" />
          <line x1="0" y1="75" x2="400" y2="75" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3" />
          <line x1="0" y1="120" x2="400" y2="120" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3" />

          {/* Smooth path */}
          <motion.path
            d="M 10 130 Q 90 120 120 90 T 230 65 T 320 40 T 390 20"
            fill="none"
            stroke="url(#chart-glow)"
            strokeWidth="3.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
          />

          {/* Chart gradient config */}
          <defs>
            <linearGradient id="chart-glow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1d4ed8" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#d4af37" />
            </linearGradient>
          </defs>

          {/* Glow nodes */}
          <circle cx="10" cy="130" r="4.5" fill="#1d4ed8" className="animate-pulse" />
          <circle cx="120" cy="90" r="4.5" fill="#3b82f6" />
          <circle cx="230" cy="65" r="4.5" fill="#3b82f6" />
          <circle cx="390" cy="20" r="5" fill="#d4af37" className="animate-pulse" />
        </svg>

        {/* Floating node label */}
        <div className="absolute top-1 right-2 bg-accent/15 border border-accent/40 rounded px-1.5 py-0.5 text-[8px] text-accent font-extrabold uppercase tracking-wide font-mono">
          Current: 1450 ELO
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center text-[9px] font-bold text-slate-500 uppercase tracking-widest border-t border-slate-800/80 pt-4">
        <div>Month 1</div>
        <div>Month 3</div>
        <div>Month 6</div>
        <div>Month 12</div>
      </div>
    </div>
  );
}

// 4. ACHIEVEMENT SYSTEM: Badges section
function AchievementSystemSection() {
  const badges = [
    { title: 'Tactical Genius', desc: 'Solved 100+ puzzles', icon: '⚡', glow: 'shadow-amber-500/10 border-amber-500/20' },
    { title: 'Endgame Maestro', desc: 'Oppositions expert', icon: '🏰', glow: 'shadow-blue-500/10 border-blue-500/20' },
    { title: 'Tournament Legend', desc: 'Placed in youth cup', icon: '🏆', glow: 'shadow-accent/15 border-accent/25' }
  ];

  return (
    <div className="glass p-6 rounded-3xl border border-accent/20 shadow-2xl relative overflow-hidden flex flex-col justify-between h-full bg-[#0a0e1f]/85">
      <div className="space-y-2">
        <span className="text-[10px] text-accent font-extrabold uppercase tracking-widest font-mono">Gamified Growth</span>
        <h4 className="text-base font-extrabold text-white">Student Achievements</h4>
        <p className="text-[11px] text-slate-400">Unlock luxury digital badges for calculation, attendance, and tournament wins.</p>
      </div>

      {/* Row of badges */}
      <div className="grid grid-cols-3 gap-3 my-6">
        {badges.map((b, i) => (
          <motion.div 
            key={i}
            whileHover={{ scale: 1.06, rotateY: 10 }}
            className={`p-3 bg-slate-950/70 border rounded-2xl text-center space-y-1.5 shadow-lg ${b.glow} cursor-pointer transition`}
          >
            <div className="text-2xl">{b.icon}</div>
            <p className="text-[9px] font-black text-white leading-tight">{b.title}</p>
            <p className="text-[7.5px] text-slate-500 uppercase font-bold tracking-wider leading-none">{b.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="p-2.5 bg-slate-950 rounded-xl text-center border border-slate-900">
        <span className="text-[8px] text-slate-400 uppercase tracking-widest font-extrabold">Next Milestone: 1000 XP away</span>
      </div>
    </div>
  );
}

// 5. TOURNAMENT JOURNEY: Roadmap Timeline
function TournamentRoadmapSection() {
  const steps = [
    { title: '1-on-1 Assessment', desc: 'Determine rating range & opening habits.', active: true },
    { title: 'Monthly Match Arena', desc: 'Compete in in-house ChessHub tournaments.', active: true },
    { title: 'FIDE Registration', desc: 'Secure official national federation membership.', active: false },
    { title: 'Championship Prep', desc: 'Master clock controls & tournament psychology.', active: false }
  ];

  return (
    <div className="glass p-6 rounded-3xl border border-accent/20 shadow-2xl relative overflow-hidden bg-[#090e1f]/90">
      <div className="text-center mb-8 space-y-2">
        <span className="text-[10px] text-accent font-extrabold uppercase tracking-widest font-mono">Roadmap Journey</span>
        <h3 className="text-lg font-extrabold text-white">The Tournament Pathway</h3>
        <p className="text-xs text-slate-400 max-w-xl mx-auto">From complete novice to competitive rated tournament play under FIDE rules.</p>
      </div>

      <div className="grid md:grid-cols-4 gap-6 relative">
        {steps.map((st, idx) => (
          <div key={idx} className="relative space-y-3 p-4 bg-slate-950/40 border border-slate-850 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[8px] text-slate-500 font-extrabold uppercase tracking-wider font-mono">Phase 0{idx + 1}</span>
              {st.active ? (
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-md shadow-accent/40" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-slate-800" />
              )}
            </div>
            <h4 className="text-xs font-black text-white uppercase tracking-wide">{st.title}</h4>
            <p className="text-[10px] text-slate-400 leading-relaxed">{st.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How do online chess classes work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Classes are conducted live via Zoom. Students interact with their coach on an interactive virtual board (powered by Chessground) with live Stockfish engine analysis, drag-and-drop puzzles, and homework review."
        }
      },
      {
        "@type": "Question",
        "name": "What session plans are available at ChessHub Academy?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We offer structured programs: Beginner Foundations, Intermediate Development, Advanced Training, and Tournament Excellence, spanning from 12 to 48 sessions with detailed monthly parent progress reports."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#050816] text-[#f8fafc] flex flex-col font-sans overflow-x-hidden selection:bg-accent selection:text-black relative">
      {/* Schema markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Floating particles background across the main wrapper */}
      <BackgroundParticles />

      {/* SECTION 1 — HEADER NAVIGATION */}
      <header className="sticky top-0 z-50 bg-[#050816]/80 border-b border-slate-900 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20 group-hover:rotate-12 transition-transform duration-300">
              ♞
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-accent to-white bg-clip-text text-transparent">
                ChessHub Academy
              </span>
              <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Global Portal</span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Link href="#why-us" className="hover:text-accent transition">Why Us</Link>
            <Link href="#roadmap" className="hover:text-accent transition">Journey</Link>
            <Link href="#programs" className="hover:text-accent transition">Programs</Link>
            <Link href="#method" className="hover:text-accent transition">Method</Link>
            <Link href="#gallery" className="hover:text-accent transition">Gallery</Link>
            <Link href="#coach" className="hover:text-accent transition">Coach</Link>
            <Link href="#report" className="hover:text-accent transition">Reports</Link>
            <Link href="#faq" className="hover:text-accent transition">FAQ</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-accent transition">
              Sign In
            </Link>
            <Link
              href="#book-demo"
              className="px-5 py-2.5 bg-gradient-to-r from-primary to-blue-700 text-white text-xs font-extrabold uppercase tracking-wider rounded-xl hover:opacity-95 transition shadow-lg shadow-primary/25 border border-primary/20 premium-shine"
            >
              Book Free Demo
            </Link>
          </div>
        </div>
      </header>

      {/* SECTION 1 — NEW LUXURY HERO SECTION */}
      <section className="relative py-20 md:py-32 overflow-hidden flex flex-col items-center justify-center px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(29,78,216,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(212,175,55,0.08),transparent_60%)]" />

        <div className="relative max-w-7xl mx-auto w-full grid lg:grid-cols-12 gap-16 items-center">
          {/* Left Details */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="lg:col-span-7 text-left space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/25 text-[10px] text-accent font-bold uppercase tracking-widest animate-pulse">
              <Trophy className="w-3.5 h-3.5" /> Elite Online Chess Academy
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none text-white">
              Master Chess. <br />
              <span className="bg-gradient-to-r from-accent via-amber-400 to-accent bg-clip-text text-transparent">
                Build Thinking.
              </span>
            </h1>
            
            <p className="text-xs md:text-sm text-slate-400 max-w-xl leading-relaxed">
              Live coaching, structured curriculum, daily puzzles, tournament preparation, and personalized feedback. Empowering children to think like Grandmasters.
            </p>

            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center gap-4 pt-4"
            >
              <Link
                href="#book-demo"
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-accent to-amber-600 text-slate-950 font-black rounded-xl hover:shadow-xl hover:shadow-accent/25 transition flex items-center justify-center gap-2 group cursor-pointer uppercase tracking-wider text-xs premium-shine"
              >
                Book Free Demo <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition" />
              </Link>
              <Link
                href="#programs"
                className="w-full sm:w-auto px-8 py-4 bg-slate-900/60 border border-slate-800/80 hover:bg-slate-900 font-bold rounded-xl text-white text-xs uppercase tracking-wider transition flex items-center justify-center"
              >
                Explore Curriculum
              </Link>
            </motion.div>

            {/* Social Proof details */}
            <div className="flex gap-8 border-t border-slate-900 pt-8 mt-4">
              <div className="space-y-1">
                <span className="text-lg md:text-xl font-black text-white block">500+</span>
                <span className="text-[8px] text-slate-500 font-extrabold uppercase tracking-widest">Classes Conducted</span>
              </div>
              <div className="space-y-1">
                <span className="text-lg md:text-xl font-black text-white block">100+</span>
                <span className="text-[8px] text-slate-500 font-extrabold uppercase tracking-widest">Active Students</span>
              </div>
              <div className="space-y-1">
                <span className="text-lg md:text-xl font-black text-accent block flex items-center gap-1">★ 4.9</span>
                <span className="text-[8px] text-slate-500 font-extrabold uppercase tracking-widest">Parent Rating</span>
              </div>
            </div>
          </motion.div>

          {/* Right Side: Redesigned 3D Board and pieces */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <InteractiveBoard3D />
          </div>
        </div>
      </section>

      {/* SECTION 2 — TRUST BAR */}
      <section className="border-y border-slate-900 bg-slate-950/20 py-8 px-6 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          {/* Differentiators */}
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 text-xs font-bold uppercase tracking-wider text-slate-400 mb-8 border-b border-slate-900 pb-6 text-center">
            <span className="flex items-center gap-2 text-white"><Check className="text-accent w-4 h-4" /> Personalized Coaching</span>
            <span className="flex items-center gap-2 text-white"><Check className="text-accent w-4 h-4" /> Progress Reports</span>
            <span className="flex items-center gap-2 text-white"><Check className="text-accent w-4 h-4" /> Homework Tracking</span>
            <span className="flex items-center gap-2 text-white"><Check className="text-accent w-4 h-4" /> Tournament Prep</span>
            <span className="flex items-center gap-2 text-white"><Check className="text-accent w-4 h-4" /> WhatsApp Support</span>
          </div>

          {/* Counters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div className="space-y-1">
              <span className="text-2xl md:text-4xl font-black text-white block">
                <AnimatedCounter value={5000} suffix="+" />
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Students Trained</span>
            </div>
            <div className="space-y-1">
              <span className="text-2xl md:text-4xl font-black text-white block">
                <AnimatedCounter value={50000} suffix="+" />
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Classes Conducted</span>
            </div>
            <div className="space-y-1">
              <span className="text-2xl md:text-4xl font-black text-white block">
                <AnimatedCounter value={98.4} suffix="%" decimals={1} />
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Parent Satisfaction</span>
            </div>
          </div>
        </div>
      </section>

      {/* ADDITIONAL SECTIONS: INTERACTIVE LIVE CLASSROOM, DAILY PUZZLE, ELO METRIC GRAPH */}
      <section className="py-24 px-6 max-w-7xl mx-auto w-full space-y-16 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(29,78,216,0.05),transparent_70%)] pointer-events-none" />

        <div className="text-center space-y-4">
          <span className="text-xs font-bold text-accent uppercase tracking-widest">Academy Ecosystem</span>
          <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">The Modern Teaching Stack</h2>
          <p className="text-slate-400 text-xs max-w-xl mx-auto leading-relaxed">Experience a live demonstration of how ChessHub combines interactive classroom control tables, daily challenge puzzles, and metrics tracking.</p>
        </div>

        {/* 3-Card Grid for preview tools */}
        <div className="grid lg:grid-cols-3 gap-8 items-stretch">
          <div>
            <DailyPuzzleSection />
          </div>
          <div>
            <EloProgressSection />
          </div>
          <div>
            <AchievementSystemSection />
          </div>
        </div>

        {/* Big classroom console mockup */}
        <div className="pt-8">
          <ClassroomPreviewSection />
        </div>

        {/* Tournament timeline */}
        <div className="pt-8">
          <TournamentRoadmapSection />
        </div>
      </section>

      {/* SECTION 3 — WHY PARENTS CHOOSE CHESSHUB */}
      <section id="why-us" className="py-24 px-6 max-w-7xl mx-auto w-full relative">
        <div className="text-center mb-16 space-y-4">
          <span className="text-xs font-bold text-accent uppercase tracking-widest">WHY CHOOSE US</span>
          <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">Coaching with Measurable Progress</h2>
          <p className="text-slate-400 text-xs max-w-xl mx-auto">We combine top chess pedagogy with rigorous technology to make sure your child grows continually.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="glass p-6 rounded-2xl border-slate-900 hover:border-accent/30 transition-all duration-300 group">
            <div className="p-3 rounded-xl bg-accent/15 text-accent mb-4 w-max">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white mb-2 group-hover:text-accent transition">Structured Curriculum</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Step-by-step chess syllabus mapping all core tactical, strategic, and positional concepts for rapid Elo growth.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass p-6 rounded-2xl border-slate-900 hover:border-accent/30 transition-all duration-300 group">
            <div className="p-3 rounded-xl bg-accent/15 text-accent mb-4 w-max">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white mb-2 group-hover:text-accent transition">Monthly Progress Reports</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Detailed analytical progress details covering attendance, ratings, homework, strengths, and coach recommendations.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass p-6 rounded-2xl border-slate-900 hover:border-accent/30 transition-all duration-300 group">
            <div className="p-3 rounded-xl bg-accent/15 text-accent mb-4 w-max">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white mb-2 group-hover:text-accent transition">Homework Accountability</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Weekly puzzle sheets and analysis assignments pushed to the student dashboard, reviewed and scored by coaches.
            </p>
          </div>

          {/* Card 4 */}
          <div className="glass p-6 rounded-2xl border-slate-900 hover:border-accent/30 transition-all duration-300 group">
            <div className="p-3 rounded-xl bg-accent/15 text-accent mb-4 w-max">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white mb-2 group-hover:text-accent transition">Attendance Monitoring</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Automated notifications for attendance status, and direct rescheduling systems to ensure zero learning gaps.
            </p>
          </div>

          {/* Card 5 */}
          <div className="glass p-6 rounded-2xl border-slate-900 hover:border-accent/30 transition-all duration-300 group">
            <div className="p-3 rounded-xl bg-accent/15 text-accent mb-4 w-max">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white mb-2 group-hover:text-accent transition">Tournament Preparation</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              FIDE tournament opening prep databases, calculation tactics, mock matches, and psychological confidence building.
            </p>
          </div>

          {/* Card 6 */}
          <div className="glass p-6 rounded-2xl border-slate-900 hover:border-accent/30 transition-all duration-300 group">
            <div className="p-3 rounded-xl bg-accent/15 text-accent mb-4 w-max">
              <Phone className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white mb-2 group-hover:text-accent transition">Direct Coach Support</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Instant contact channel on WhatsApp with teachers and coordinators to resolve queries and reschedule classes.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 4 — LEARNING JOURNEY */}
      <section id="roadmap" className="py-20 bg-slate-950/20 border-y border-slate-900 px-6 w-full">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <span className="text-xs font-bold text-accent uppercase tracking-widest">THE CURRICULUM ROADMAP</span>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">Student Progress Progression</h2>
            <p className="text-slate-400 text-xs max-w-xl mx-auto">Click through our learning tiers to review specific goals, skills, and assessment criteria.</p>
          </div>

          <LearningJourney />
        </div>
      </section>

      {/* SECTION 5 — PROGRAMS */}
      <section id="programs" className="py-24 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16 space-y-4">
          <span className="text-xs font-bold text-accent uppercase tracking-widest">OUR TRAINING PROGRAM PACKS</span>
          <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">Choose Your Training Plan</h2>
          <p className="text-slate-400 text-xs max-w-xl mx-auto">Comprehensive coaching packages structured to maximize performance milestones.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Prog 1 */}
          <div className="glass p-6 rounded-3xl border-slate-900 flex flex-col justify-between hover:border-accent/30 transition-all duration-300 bg-[#0a0e1f]/60">
            <div className="space-y-4">
              <span className="text-2xl">♟️</span>
              <h4 className="font-bold text-lg text-white">Beginner Foundations</h4>
              <p className="text-slate-400 text-xs leading-relaxed">Ideal for complete novices. Focuses on rules, basic checkmate patterns, and piece coordinations.</p>
              <div className="border-t border-slate-900 pt-3 space-y-2">
                <span className="text-[10px] text-accent font-bold uppercase tracking-wider block">Details</span>
                <span className="text-xs text-slate-500 block">Duration: 3 Months</span>
                <span className="text-xs text-slate-500 block">Outcomes: Play complete games</span>
              </div>
            </div>
            <Link href="#book-demo" className="mt-6 w-full py-3 text-center bg-slate-950/60 border border-slate-850 text-white text-xs font-bold rounded-xl hover:bg-slate-900 transition uppercase tracking-wider">
              Enquire Demo
            </Link>
          </div>

          {/* Prog 2 */}
          <div className="glass p-6 rounded-3xl border-slate-900 flex flex-col justify-between hover:border-accent/30 transition-all duration-300 bg-[#0a0e1f]/60">
            <div className="space-y-4">
              <span className="text-2xl">♞</span>
              <h4 className="font-bold text-lg text-white">Intermediate Development</h4>
              <p className="text-slate-400 text-xs leading-relaxed">Focuses on tactical combinations (forks, pins), opening principles, and basic pawn checkmates.</p>
              <div className="border-t border-slate-900 pt-3 space-y-2">
                <span className="text-[10px] text-accent font-bold uppercase tracking-wider block">Details</span>
                <span className="text-xs text-slate-500 block">Duration: 6 Months</span>
                <span className="text-xs text-slate-500 block">Outcomes: 1000+ Elo Rating</span>
              </div>
            </div>
            <Link href="#book-demo" className="mt-6 w-full py-3 text-center bg-slate-950/60 border border-slate-850 text-white text-xs font-bold rounded-xl hover:bg-slate-900 transition uppercase tracking-wider">
              Enquire Demo
            </Link>
          </div>

          {/* Prog 3 */}
          <div className="glass p-6 rounded-3xl border-accent/30 bg-[#0a0e1f]/80 flex flex-col justify-between hover:border-accent transition-all duration-300 relative">
            <div className="absolute -top-3 right-6 px-2.5 py-0.5 bg-accent text-slate-950 text-[9px] font-black uppercase tracking-widest rounded-full">
              Best Value
            </div>
            <div className="space-y-4">
              <span className="text-2xl">♜</span>
              <h4 className="font-bold text-lg text-white">Advanced Training</h4>
              <p className="text-slate-400 text-xs leading-relaxed">Focuses on positional imbalances, complex calculation visualization, and rook endgame files.</p>
              <div className="border-t border-slate-900 pt-3 space-y-2">
                <span className="text-[10px] text-accent font-bold uppercase tracking-wider block">Details</span>
                <span className="text-xs text-slate-500 block">Duration: 12 Months</span>
                <span className="text-xs text-slate-500 block">Outcomes: 1500+ Elo Rating</span>
              </div>
            </div>
            <Link href="#book-demo" className="mt-6 w-full py-3 text-center bg-gradient-to-r from-accent to-amber-600 text-slate-950 text-xs font-black rounded-xl hover:opacity-95 transition uppercase tracking-wider premium-shine">
              Enquire Demo
            </Link>
          </div>

          {/* Prog 4 */}
          <div className="glass p-6 rounded-3xl border-slate-900 flex flex-col justify-between hover:border-accent/30 transition-all duration-300 bg-[#0a0e1f]/60">
            <div className="space-y-4">
              <span className="text-2xl">👑</span>
              <h4 className="font-bold text-lg text-white">Tournament Excellence</h4>
              <p className="text-slate-400 text-xs leading-relaxed">Deep opening database theory prep, asymmetric endgame squeezes, and FIDE rated prep.</p>
              <div className="border-t border-slate-900 pt-3 space-y-2">
                <span className="text-[10px] text-accent font-bold uppercase tracking-wider block">Details</span>
                <span className="text-xs text-slate-500 block">Duration: Continuous</span>
                <span className="text-xs text-slate-500 block">Outcomes: Active FIDE Rating</span>
              </div>
            </div>
            <Link href="#book-demo" className="mt-6 w-full py-3 text-center bg-slate-950/60 border border-slate-850 text-white text-xs font-bold rounded-xl hover:bg-slate-900 transition uppercase tracking-wider">
              Enquire Demo
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 6 — HOW WE TEACH */}
      <section id="method" className="py-20 bg-slate-950/20 border-y border-slate-900 px-6 w-full">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <span className="text-xs font-bold text-accent uppercase tracking-widest">OUR PEDAGOGY TIMELINE</span>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">Our 5-Step Learning Method</h2>
            <p className="text-slate-400 text-xs max-w-xl mx-auto">How we take absolute beginners and transform them into strategic tournament players.</p>
          </div>

          <div className="relative border-l border-accent/20 max-w-2xl mx-auto pl-6 space-y-12">
            {/* Step 1 */}
            <div className="relative">
              <div className="absolute -left-9.5 top-1.5 w-6 h-6 rounded-full bg-accent border-4 border-[#050816] flex items-center justify-center text-[10px] font-black text-slate-950 font-sans">✓</div>
              <div className="space-y-1">
                <span className="text-[10px] text-accent font-bold uppercase tracking-wider font-mono">Step 01</span>
                <h4 className="font-bold text-white text-base">Student Assessment</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  We evaluate the child's current rating level, tactical vision, and calculation style in a free 1-on-1 demo call.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="absolute -left-9.5 top-1.5 w-6 h-6 rounded-full bg-accent border-4 border-[#050816] flex items-center justify-center text-[10px] font-black text-slate-950 font-sans">✓</div>
              <div className="space-y-1">
                <span className="text-[10px] text-accent font-bold uppercase tracking-wider font-mono">Step 02</span>
                <h4 className="font-bold text-white text-base">Personalized Learning Plan</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Our Academy Director compiles a custom syllabus targeting strengths, weak openings, and tactic puzzle scopes.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="absolute -left-9.5 top-1.5 w-6 h-6 rounded-full bg-accent border-4 border-[#050816] flex items-center justify-center text-[10px] font-black text-slate-950 font-sans">✓</div>
              <div className="space-y-1">
                <span className="text-[10px] text-accent font-bold uppercase tracking-wider font-mono">Step 03</span>
                <h4 className="font-bold text-white text-base">Live Coaching Sessions</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Live classes with FIDE-rated coaches, focusing on interactive chessboard tasks and dynamic game reviews.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative">
              <div className="absolute -left-9.5 top-1.5 w-6 h-6 rounded-full bg-accent border-4 border-[#050816] flex items-center justify-center text-[10px] font-black text-slate-950 font-sans">✓</div>
              <div className="space-y-1">
                <span className="text-[10px] text-accent font-bold uppercase tracking-wider font-mono">Step 04</span>
                <h4 className="font-bold text-white text-base">Homework & Practice</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Students solve curated chess puzzles and practice matches on Lichess to cement covered session plans.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="relative">
              <div className="absolute -left-9.5 top-1.5 w-6 h-6 rounded-full bg-accent border-4 border-[#050816] flex items-center justify-center text-[10px] font-black text-slate-950 font-sans">✓</div>
              <div className="space-y-1">
                <span className="text-[10px] text-accent font-bold uppercase tracking-wider font-mono">Step 05</span>
                <h4 className="font-bold text-white text-base">Monthly Parent Review</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Parents receive digital progress reports plotting Elo ratings, strengths, and upcoming tournament targets.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7 — STUDENT SUCCESS STORIES */}
      <section className="py-24 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16 space-y-4">
          <span className="text-xs font-bold text-accent uppercase tracking-widest">SUCCESS STORIES</span>
          <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">Before & After Progress Results</h2>
          <p className="text-slate-400 text-xs max-w-xl mx-auto">Real rating growth achieved by junior players under our elite training structures.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Success 1 */}
          <div className="glass p-6 rounded-2xl border-slate-900 flex flex-col justify-between bg-[#0a0e1f]/60">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-950 border border-accent flex items-center justify-center font-bold text-white">
                  AK
                </div>
                <div>
                  <h5 className="font-bold text-white text-sm">Aman Kapoor</h5>
                  <p className="text-[10px] text-slate-500">Student for 6 months</p>
                </div>
              </div>
              <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-900">
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 block uppercase font-mono">Before</span>
                  <span className="text-base font-bold text-white">600 Lichess</span>
                </div>
                <ArrowRight className="w-4 h-4 text-accent" />
                <div className="text-center">
                  <span className="text-[10px] text-accent block uppercase font-mono">Current</span>
                  <span className="text-base font-bold text-accent">1200 Lichess</span>
                </div>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                "Aman was struggling with defensive vision. After focusing on forks & pins for 2 months, his tactical accuracy surged."
              </p>
            </div>
            <span className="mt-4 text-[10px] text-slate-500 block font-mono">FIDE Rating Target: 1000 Elo</span>
          </div>

          {/* Success 2 */}
          <div className="glass p-6 rounded-2xl border-slate-900 flex flex-col justify-between bg-[#0a0e1f]/60">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-950 border border-accent flex items-center justify-center font-bold text-white">
                  RI
                </div>
                <div>
                  <h5 className="font-bold text-white text-sm">Rohan Iyer</h5>
                  <p className="text-[10px] text-slate-500">Student for 12 months</p>
                </div>
              </div>
              <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-900">
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 block uppercase font-mono">Before</span>
                  <span className="text-base font-bold text-white">1000 Lichess</span>
                </div>
                <ArrowRight className="w-4 h-4 text-accent" />
                <div className="text-center">
                  <span className="text-[10px] text-accent block uppercase font-mono">Current</span>
                  <span className="text-base font-bold text-accent">1650 Lichess</span>
                </div>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                "Rohan mastered the Sicilian defense and positional king safety, which led him to win 2nd place in Chennai youth blitz."
              </p>
            </div>
            <span className="mt-4 text-[10px] text-slate-500 block font-mono">FIDE Rating Target: 1400 Elo</span>
          </div>

          {/* Success 3 */}
          <div className="glass p-6 rounded-2xl border-slate-900 flex flex-col justify-between bg-[#0a0e1f]/60">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-950 border border-accent flex items-center justify-center font-bold text-white">
                  EP
                </div>
                <div>
                  <h5 className="font-bold text-white text-sm">Emily Patel</h5>
                  <p className="text-[10px] text-slate-500">Student for 8 months</p>
                </div>
              </div>
              <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-900">
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 block uppercase font-mono">Before</span>
                  <span className="text-base font-bold text-white">850 Lichess</span>
                </div>
                <ArrowRight className="w-4 h-4 text-accent" />
                <div className="text-center">
                  <span className="text-[10px] text-accent block uppercase font-mono">Current</span>
                  <span className="text-base font-bold text-accent">1400 Lichess</span>
                </div>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                "Emily showed great endgame growth. Her King-and-Pawn opposition calculations secured several clutch wins."
              </p>
            </div>
            <span className="mt-4 text-[10px] text-slate-500 block font-mono">FIDE Rating Target: 1200 Elo</span>
          </div>
        </div>
      </section>

      {/* SECTION 8 — PHOTO GALLERY */}
      <section id="gallery" className="py-20 bg-slate-950/20 border-y border-slate-900 px-6 w-full">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <span className="text-xs font-bold text-accent uppercase tracking-widest">MEDIA GALLERY</span>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">ChessHub Photo Gallery</h2>
            <p className="text-slate-400 text-xs max-w-xl mx-auto">Snapshots of live classes, tournament arenas, certificate awards, and student wins.</p>
          </div>

          <Gallery />
        </div>
      </section>

      {/* SECTION 9 — PARENT TESTIMONIALS */}
      <section className="py-24 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16 space-y-4">
          <span className="text-xs font-bold text-accent uppercase tracking-widest">PARENT REVIEWS</span>
          <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">What Parents Are Saying</h2>
          <p className="text-slate-400 text-xs max-w-xl mx-auto">Verified text, video, and screenshot reviews submitted by our global student base.</p>
        </div>

        <Testimonials />
      </section>

      {/* SECTION 10 — COACH PROFILE */}
      <section id="coach" className="py-20 bg-slate-950/20 border-y border-slate-900 px-6 w-full">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <span className="text-xs font-bold text-accent uppercase tracking-widest">MEET THE STAFF</span>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">FIDE Rated Chess Instructors</h2>
            <p className="text-slate-400 text-xs max-w-xl mx-auto">Learn more about our elite team led by certified Master coaches.</p>
          </div>

          <CoachProfile />
        </div>
      </section>

      {/* SECTION 11 — MONTHLY REPORT PREVIEW */}
      <section id="report" className="py-24 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16 space-y-4">
          <span className="text-xs font-bold text-accent uppercase tracking-widest">METRIC TRACKING</span>
          <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">Premium Parent Progress Reports</h2>
          <p className="text-slate-400 text-xs max-w-xl mx-auto">We provide detailed accountability charts to keep parents informed of every milestone.</p>
        </div>

        <ReportPreview />
      </section>

      {/* SECTION 11.5 — RECOMMENDED RESOURCES & GEAR */}
      <section id="resources" className="py-24 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16 space-y-4">
          <span className="text-xs font-bold text-accent uppercase tracking-widest">CURATED RECOMMENDATIONS</span>
          <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">Recommended Chess Gear & Books</h2>
          <p className="text-slate-400 text-xs max-w-xl mx-auto">Enhance your off-screen study. Selected by our grandmaster coaches to accelerate your training loop.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "DGT Centaur Chess Computer",
              desc: "The ultimate digital adapter chess board. Adapts dynamically to your playing strength, offering the perfect challenge.",
              price: "$249.00",
              link: "https://digitalgametechnology.com/",
              badge: "Premium Gear",
              imgSymbol: "♔"
            },
            {
              title: "My System - Aron Nimzowitsch",
              desc: "The foundation of modern positional play. A mandatory textbook for intermediate and advanced ChessHub students.",
              price: "$19.99",
              link: "https://www.amazon.com/",
              badge: "Best Book",
              imgSymbol: "📚"
            },
            {
              title: "DGT 2010 Official FIDE Clock",
              desc: "The official chess timer of the world chess federation. Features custom delay, increment, and tournament presets.",
              price: "$79.00",
              link: "https://digitalgametechnology.com/",
              badge: "Official Timer",
              imgSymbol: "⏱"
            }
          ].map((item, idx) => (
            <div key={idx} className="glass p-6 rounded-3xl border-border flex flex-col justify-between hover:scale-[1.01] hover:border-accent/30 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-bl-full flex items-center justify-center font-bold text-4xl text-accent/15 group-hover:scale-110 transition-transform">
                {item.imgSymbol}
              </div>
              <div className="space-y-4 relative z-10">
                <span className="text-[9px] font-bold text-accent bg-accent/10 border border-accent/25 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                  {item.badge}
                </span>
                <div className="space-y-1">
                  <h4 className="text-base font-extrabold text-white">{item.title}</h4>
                  <p className="text-xs text-muted leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
              <div className="pt-6 mt-6 border-t border-border/50 flex justify-between items-center gap-4 relative z-10">
                <span className="text-sm font-black text-white">{item.price}</span>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-slate-900 border border-border hover:border-accent/40 text-xs font-bold text-white rounded-xl transition"
                >
                  Buy Now ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 12 — FAQ */}
      <section id="faq" className="py-20 bg-slate-950/20 border-y border-slate-900 px-6 w-full">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <span className="text-xs font-bold text-accent uppercase tracking-widest">FAQS</span>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">Frequently Asked Questions</h2>
            <p className="text-slate-400 text-xs max-w-xl mx-auto">Search our detailed database to resolve operations, classes, and billing queries.</p>
          </div>

          <FAQ />
        </div>
      </section>

      {/* SECTION 13 — FINAL CTA / LEAD CAPTURE */}
      <section id="book-demo" className="py-24 px-6 max-w-7xl mx-auto w-full relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.06),transparent_60%)]" />

        <div className="grid lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-6 space-y-6 text-left">
            <span className="text-xs font-bold text-accent uppercase tracking-widest">BOOK FREE DEMO SESSION</span>
            <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight">Start Your Chess Journey Today</h2>
            <p className="text-slate-400 text-xs leading-relaxed max-w-lg">
              Book a free 45-minute 1-on-1 assessment. Our FIDE-certified instructor will play a games assessment, review coordinates alert speeds, and draft a custom learning trajectory.
            </p>
            
            <div className="space-y-4 border-t border-slate-900 pt-6">
              <div className="flex items-center gap-3 text-sm text-white">
                <div className="w-5 h-5 rounded-full bg-accent/10 border border-accent/30 text-accent flex items-center justify-center text-[10px] font-bold">
                  ✓
                </div>
                <span>45-Min Live Zoom Assessment</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white">
                <div className="w-5 h-5 rounded-full bg-accent/10 border border-accent/30 text-accent flex items-center justify-center text-[10px] font-bold">
                  ✓
                </div>
                <span>Custom Elo Roadmap Drafted</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white">
                <div className="w-5 h-5 rounded-full bg-accent/10 border border-accent/30 text-accent flex items-center justify-center text-[10px] font-bold">
                  ✓
                </div>
                <span>Direct Rescheduling WhatsApp Channel</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <DemoBookingForm />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-[#02040a] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold text-lg">
              ♞
            </div>
            <div className="flex flex-col text-left">
              <span className="font-extrabold text-sm text-white">ChessHub Academy</span>
              <span className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">Elite Online Coaching</span>
            </div>
          </div>

          {/* Social Media Links */}
          <div className="flex items-center gap-3">
            <a href="https://www.facebook.com/onlinechess1" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-slate-950 border border-slate-900 text-slate-400 hover:text-accent hover:border-accent/40 hover:scale-105 transition-all" title="Facebook">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
            </a>
            <a href="https://www.instagram.com/chesshub.__?igsh=Y3c2dWJ0ZHl0Mmlz" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-slate-950 border border-slate-900 text-slate-400 hover:text-accent hover:border-accent/40 hover:scale-105 transition-all" title="Instagram">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
            <a href="https://www.linkedin.com/in/animeshray786?utm_source=share_via&utm_content=profile&utm_medium=member_android" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-slate-950 border border-slate-900 text-slate-400 hover:text-accent hover:border-accent/40 hover:scale-105 transition-all" title="LinkedIn">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
            </a>
            <a href="https://wa.me/917008665245" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-slate-950 border border-slate-900 text-slate-400 hover:text-accent hover:border-accent/40 hover:scale-105 transition-all" title="WhatsApp Support">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            </a>
          </div>

          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} ChessHub Academy Global. All rights reserved. Built for FIDE Rating Excellence.
          </p>
        </div>
      </footer>
    </div>
  );
}
