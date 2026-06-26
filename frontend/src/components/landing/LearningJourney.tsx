'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, ShieldAlert, Star, Target, CheckCircle } from 'lucide-react';

interface JourneyLevel {
  id: string;
  name: string;
  sub: string;
  icon: string;
  goals: string[];
  skills: string[];
  assessments: string[];
  color: string;
}

const JOURNEY_LEVELS: JourneyLevel[] = [
  {
    id: 'beginner',
    name: 'Beginner Foundations',
    sub: 'Rating: 100 - 800 Elo',
    icon: '♟️',
    goals: [
      'Understand rules, moves, and basic concepts',
      'Learn checkmating patterns (Scholar\'s, Back-rank)',
      'Establish board coordination and visual alertness',
    ],
    skills: [
      'Piece movements & values',
      'Rules of Castling, En Passant, Promotion',
      'Basic forks, pins, and skewers tactics',
      'Introduction to basic opening principles (Center control)',
    ],
    assessments: [
      'Can finish mating puzzles in 1-2 moves',
      'Plays full games without hanging pieces',
      'Identifies legal castling and stalemates',
    ],
    color: '#3b82f6',
  },
  {
    id: 'intermediate',
    name: 'Intermediate Development',
    sub: 'Rating: 800 - 1400 Elo',
    icon: '♞',
    goals: [
      'Formulate tactical combinations and board strategies',
      'Implement structured opening repertoires (White & Black)',
      'Basic endgame checkmates and pawn play',
    ],
    skills: [
      'Double attacks, deflections, and intermediate sacrifices',
      'Opening defenses (Sicilian, Slav, Ruy Lopez foundations)',
      'Basic King & Pawn endgames, opposition concept',
      'Middle-game planning: weak squares and open files',
    ],
    assessments: [
      'Solving rating-specific puzzles (1000-1400 Lichess rating)',
      'Consistent opening execution in rapid/blitz games',
      'Ability to annotate and review played games independently',
    ],
    color: '#d4af37',
  },
  {
    id: 'advanced',
    name: 'Advanced Training',
    sub: 'Rating: 1400 - 1800 Elo',
    icon: '♜',
    goals: [
      'Positional mastery and pawn structure management',
      'Deep opening theory study and branch variations',
      'Complex tactical calculations and candidate move searching',
    ],
    skills: [
      'Positional imbalances, bishop pair advantage',
      'Minor piece endgames, rook activity strategies',
      'Opening lines database management (PGNs and Studies)',
      'Calculation techniques: visualization & elimination',
    ],
    assessments: [
      'Regular participation in local or online tournaments',
      'Submitting self-analyzed PGN portfolios of 10+ games',
      'Solving complex tactics with multiple branch lines',
    ],
    color: '#10b981',
  },
  {
    id: 'tournament',
    name: 'Tournament Excellence',
    sub: 'Rating: 1800+ Elo / FIDE',
    icon: '👑',
    goals: [
      'FIDE and National rating acquisition and growth',
      'Psychological preparation and tournament time management',
      'Advanced positional squeezing and active defense',
    ],
    skills: [
      'Advanced pawn storms and king safety files',
      'Asymmetric endgames (Rook vs Minor pieces)',
      'Customized tournament opening prep against specific rivals',
      'Blunder prevention and emotional intelligence control',
    ],
    assessments: [
      'FIDE Rating acquisition / ELO milestones achievement',
      'Top 3 placements in regional/national junior chess championships',
      'Instructing lower-tier students or writing opening monographs',
    ],
    color: '#ef4444',
  },
];

export default function LearningJourney() {
  const [activeLevel, setActiveLevel] = useState<string>('beginner');

  const currentLevel = JOURNEY_LEVELS.find((l) => l.id === activeLevel)!;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-12">
      {/* Interactive Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {JOURNEY_LEVELS.map((level) => {
          const isActive = level.id === activeLevel;
          return (
            <button
              key={level.id}
              onClick={() => setActiveLevel(level.id)}
              className={`p-5 rounded-2xl border text-left transition duration-300 relative overflow-hidden group cursor-pointer ${
                isActive
                  ? 'bg-card border-accent/40 shadow-lg shadow-accent/5'
                  : 'bg-card/40 border-border/80 hover:bg-card/75'
              }`}
            >
              {/* Top accent line */}
              {isActive && (
                <motion.div
                  layoutId="activeBorder"
                  className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-accent to-amber-500"
                />
              )}

              <div className="flex items-center gap-3">
                <span className="text-2xl">{level.icon}</span>
                <div>
                  <h4 className="font-bold text-sm text-white group-hover:text-accent transition duration-200">
                    {level.name.split(' ')[0]}
                  </h4>
                  <p className="text-[10px] text-muted font-mono">{level.sub}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main roadmap card content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeLevel}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
          className="glass border border-border rounded-3xl p-8 md:p-10 grid md:grid-cols-3 gap-8 relative overflow-hidden"
        >
          {/* Subtle logo background shadow */}
          <div className="absolute right-0 bottom-0 opacity-[0.02] text-[200px] pointer-events-none select-none select-none font-bold">
            {currentLevel.icon}
          </div>

          {/* Goals Column */}
          <div className="space-y-5">
            <div className="flex items-center gap-3 border-b border-border/60 pb-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <Target className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-lg text-white">Milestone Goals</h4>
            </div>
            <ul className="space-y-4">
              {currentLevel.goals.map((goal, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-blue-400 shrink-0 mt-1" />
                  <span className="text-muted text-sm leading-relaxed">{goal}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Skills Column */}
          <div className="space-y-5">
            <div className="flex items-center gap-3 border-b border-border/60 pb-3">
              <div className="p-2 rounded-lg bg-accent/10 text-accent">
                <Star className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-lg text-white">Core Skills Covered</h4>
            </div>
            <ul className="space-y-4">
              {currentLevel.skills.map((skill, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-1" />
                  <span className="text-muted text-sm leading-relaxed">{skill}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Assessment Column */}
          <div className="space-y-5">
            <div className="flex items-center gap-3 border-b border-border/60 pb-3">
              <div className="p-2 rounded-lg bg-green-500/10 text-green-400">
                <Award className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-lg text-white">Assessment Criteria</h4>
            </div>
            <ul className="space-y-4">
              {currentLevel.assessments.map((criteria, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-1" />
                  <span className="text-muted text-sm leading-relaxed">{criteria}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
