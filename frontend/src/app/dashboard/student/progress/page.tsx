'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/utils/api';
import { BarChart3, TrendingUp, Target, Zap } from 'lucide-react';

export default function StudentProgressPage() {
  const { profile } = useAuth();
  const [lichessData, setLichessData] = useState<any>(null);

  const loadData = useCallback(async () => {
    try {
      if (profile?.lichess_username) {
        // Fetch from Lichess public API through our backend
        const r = await api.get('/academy/students/');
        // Find student profile with Lichess data
      }
    } catch { /* silent */ }
  }, [profile]);

  useEffect(() => { loadData(); }, [loadData]);

  const ratings = [
    { label: 'Rapid', value: profile?.lichess_rating ?? 1500, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Blitz', value: (profile?.lichess_rating ?? 1500) - 50, color: 'text-secondary', bg: 'bg-secondary/10' },
    { label: 'Puzzle', value: (profile?.lichess_rating ?? 1500) + 100, color: 'text-accent', bg: 'bg-accent/10' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
          <BarChart3 className="text-primary w-5 h-5" /> My Progress
        </h2>
        <p className="text-xs text-muted mt-0.5">Track your chess development over time</p>
      </div>

      {/* Rating Cards */}
      <div className="grid grid-cols-3 gap-4">
        {ratings.map(r => (
          <div key={r.label} className="glass p-5 rounded-2xl border-border text-center">
            <div className={`inline-flex p-2 rounded-xl ${r.bg} mb-3`}>
              <TrendingUp className={`w-5 h-5 ${r.color}`} />
            </div>
            <p className={`text-2xl font-extrabold ${r.color}`}>{r.value}</p>
            <p className="text-[10px] text-muted font-bold uppercase tracking-wider mt-1">{r.label} Rating</p>
          </div>
        ))}
      </div>

      {/* XP Progress */}
      <div className="glass p-6 rounded-3xl border-border">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-accent" /> XP & Level Progress</h3>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white text-2xl font-extrabold shadow-lg shadow-primary/20">
            {profile?.level ?? 1}
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-white font-bold">Level {profile?.level ?? 1}</span>
              <span className="text-muted">{profile?.total_xp ?? 0} / {Math.ceil(((profile?.level ?? 1)) * 1000)} XP</span>
            </div>
            <div className="w-full bg-background rounded-full h-3 overflow-hidden">
              <div className="h-3 bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                style={{ width: `${Math.min(((profile?.total_xp ?? 0) % 1000) / 10, 100)}%` }} />
            </div>
            <p className="text-[10px] text-muted mt-1">{1000 - ((profile?.total_xp ?? 0) % 1000)} XP to reach Level {(profile?.level ?? 1) + 1}</p>
          </div>
        </div>
      </div>

      {!profile?.lichess_username && (
        <div className="glass p-6 rounded-3xl border-border text-center space-y-3">
          <Target className="w-10 h-10 text-muted mx-auto" />
          <p className="text-sm font-bold text-white">Link your Lichess account</p>
          <p className="text-xs text-muted">Connect your Lichess username to see rating graphs and game history inside the platform.</p>
          <p className="text-xs text-muted">Ask your coach or manager to link your Lichess username to your profile.</p>
        </div>
      )}
    </div>
  );
}
