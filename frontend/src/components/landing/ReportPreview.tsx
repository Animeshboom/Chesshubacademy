'use client';

import React from 'react';
import { Award, CheckCircle2, TrendingUp, BookOpen, Clock, ChevronRight } from 'lucide-react';

export default function ReportPreview() {
  return (
    <div className="w-full max-w-4xl mx-auto glass border border-accent/20 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
      {/* Golden accents */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border/80 pb-6 mb-8 gap-4">
        <div>
          <span className="text-xs font-bold text-accent uppercase tracking-widest bg-accent/10 border border-accent/20 px-3 py-1 rounded-full">
            TRUSTBUILDER PREVIEW
          </span>
          <h3 className="text-2xl font-extrabold text-white mt-3">
            Monthly Student Progress Report
          </h3>
          <p className="text-muted text-sm mt-1">
            Real progress data delivered to parent dashboards and emails every 30 days.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-background/50 border border-border px-4 py-3 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-bold text-lg">
            A
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">Aarav Sharma</h4>
            <p className="text-xs text-muted">Age: 10 | Level: Intermediate</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Side: Stats and Metrics */}
        <div className="md:col-span-1 space-y-6">
          {/* Attendance metric */}
          <div className="p-4 bg-background/40 border border-border/80 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-muted uppercase tracking-wider">
              <span>Attendance</span>
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">96%</span>
              <span className="text-xs text-muted">(24 / 25 Classes)</span>
            </div>
            <div className="w-full bg-border h-2 rounded-full overflow-hidden">
              <div className="bg-primary h-full rounded-full" style={{ width: '96%' }} />
            </div>
            <p className="text-[11px] text-green-400">Excellent commitment</p>
          </div>

          {/* Homework completion metric */}
          <div className="p-4 bg-background/40 border border-border/80 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-muted uppercase tracking-wider">
              <span>Homework</span>
              <BookOpen className="w-4 h-4 text-accent" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">92%</span>
              <span className="text-xs text-muted">(12 / 13 Submitted)</span>
            </div>
            <div className="w-full bg-border h-2 rounded-full overflow-hidden">
              <div className="bg-accent h-full rounded-full" style={{ width: '92%' }} />
            </div>
            <p className="text-[11px] text-green-400">9 puzzles solved correctly</p>
          </div>

          {/* XP & Level Status */}
          <div className="p-4 bg-background/40 border border-border/80 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">XP Rank</span>
              <span className="text-xl font-bold text-white mt-1 block">Level 4 (Elite)</span>
              <span className="text-xs text-muted">3,450 Total XP</span>
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-accent to-amber-500 flex items-center justify-center text-black font-extrabold text-lg shadow-lg shadow-accent/20">
              4
            </div>
          </div>
        </div>

        {/* Center: Rating Growth Chart Mockup (SVG line chart) */}
        <div className="md:col-span-2 space-y-6">
          <div className="p-5 bg-background/40 border border-border/80 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" /> Lichess Rating Growth
              </h4>
              <span className="text-xs font-semibold text-green-400 font-mono">+600 Points (6 Months)</span>
            </div>

            {/* SVG Interactive Line Chart */}
            <div className="relative h-44 w-full bg-slate-950/40 rounded-xl p-3 border border-border/60">
              {/* Grid Lines */}
              <div className="absolute inset-x-0 top-1/4 border-t border-border/10" />
              <div className="absolute inset-x-0 top-2/4 border-t border-border/10" />
              <div className="absolute inset-x-0 top-3/4 border-t border-border/10" />

              {/* Chart SVG */}
              <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Gradient area */}
                <defs>
                  <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d4af37" stopOpacity="0.25"/>
                    <stop offset="100%" stopColor="#d4af37" stopOpacity="0.0"/>
                  </linearGradient>
                </defs>
                
                {/* Area path */}
                <path
                  d="M 0,90 L 20,80 L 40,65 L 60,45 L 80,30 L 100,10 L 100,100 L 0,100 Z"
                  fill="url(#chartGlow)"
                  className="transition-all duration-1000 ease-out"
                />

                {/* Line path */}
                <path
                  d="M 0,90 L 20,80 L 40,65 L 60,45 L 80,30 L 100,10"
                  fill="none"
                  stroke="#d4af37"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />

                {/* Data points */}
                <circle cx="0" cy="90" r="1.5" fill="#d4af37" />
                <circle cx="20" cy="80" r="1.5" fill="#d4af37" />
                <circle cx="40" cy="65" r="1.5" fill="#d4af37" />
                <circle cx="60" cy="45" r="1.5" fill="#d4af37" />
                <circle cx="80" cy="30" r="1.5" fill="#d4af37" />
                <circle cx="100" cy="10" r="2.0" fill="#ffffff" stroke="#d4af37" strokeWidth="1" />
              </svg>

              {/* Labels overlay */}
              <div className="absolute inset-x-0 bottom-1 flex justify-between text-[8px] text-muted px-1 font-mono">
                <span>Month 1 (600)</span>
                <span>Month 2</span>
                <span>Month 3 (850)</span>
                <span>Month 4</span>
                <span>Month 5 (1020)</span>
                <span>Month 6 (1200)</span>
              </div>
            </div>
          </div>

          {/* Strengths & Improvement Areas */}
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="p-4 bg-green-950/20 border border-green-500/20 rounded-2xl space-y-2">
              <h4 className="text-xs font-bold text-green-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Strengths
              </h4>
              <ul className="text-xs text-muted space-y-1.5 list-disc pl-4">
                <li>Excellent tactical vision (Pins & forks)</li>
                <li>Calculates forcing lines quickly</li>
                <li>Solid Sicilian Defense structures</li>
              </ul>
            </div>

            {/* Improvement Areas */}
            <div className="p-4 bg-amber-950/20 border border-amber-500/20 rounded-2xl space-y-2">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" /> Improvement Areas
              </h4>
              <ul className="text-xs text-muted space-y-1.5 list-disc pl-4">
                <li>Middle-game pawn structure management</li>
                <li>Defensive patience in passive endgames</li>
                <li>Blunder-checking before executing moves</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Coach Remarks footer */}
      <div className="mt-8 p-5 bg-card border border-border/80 rounded-2xl flex flex-col sm:flex-row gap-4 items-start">
        <div className="w-12 h-12 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center text-accent text-xl shrink-0">
          👑
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-accent uppercase tracking-wider">Coach Remarks</span>
          <p className="text-xs text-muted italic leading-relaxed">
            "Aarav has shown outstanding tactical growth this month. His chess calculation speed has effectively doubled, and his focus during tournament games has greatly improved. We are currently preparing him for his first FIDE-rated tournament next month."
          </p>
          <span className="text-[10px] text-white font-bold block mt-1">
            — Coach Priyadarshan, FIDE Master (FM)
          </span>
        </div>
      </div>
    </div>
  );
}
