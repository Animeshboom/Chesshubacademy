'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/utils/api';
import Link from 'next/link';
import { Calendar, Video, CheckCircle, Clock } from 'lucide-react';

interface Session {
  id: string; title: string; scheduled_start: string; status: string; class_type: string;
  coach: { user: { first_name: string; last_name: string } };
  zoom_meeting?: { join_url: string };
}

export default function StudentClassesPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [tab, setTab] = useState<'upcoming' | 'completed'>('upcoming');

  const loadData = useCallback(async () => {
    try { const r = await api.get('/academy/sessions/'); setSessions(r.data); }
    catch { /* silent */ }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const upcoming = sessions.filter(s => s.status === 'scheduled');
  const completed = sessions.filter(s => s.status === 'completed');
  const display = tab === 'upcoming' ? upcoming : completed;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
          <Calendar className="text-primary w-5 h-5" /> My Classes
        </h2>
        <p className="text-xs text-muted mt-0.5">All scheduled and completed coaching sessions</p>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setTab('upcoming')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${tab === 'upcoming' ? 'bg-primary text-white' : 'border border-border text-muted hover:text-foreground'}`}>
          Upcoming ({upcoming.length})
        </button>
        <button onClick={() => setTab('completed')}
          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${tab === 'completed' ? 'bg-primary text-white' : 'border border-border text-muted hover:text-foreground'}`}>
          Completed ({completed.length})
        </button>
      </div>

      <div className="space-y-3">
        {display.length === 0 ? (
          <div className="glass p-10 rounded-3xl border-border text-center text-muted text-sm">
            No {tab} sessions.
          </div>
        ) : display.map(s => (
          <div key={s.id} className="glass p-4 rounded-2xl border-border flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-2.5 rounded-xl ${s.status === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-primary/10 text-primary'}`}>
                {s.status === 'completed' ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-white text-sm truncate">{s.title}</p>
                <p className="text-[10px] text-muted mt-0.5">
                  Coach: {s.coach.user.first_name} {s.coach.user.last_name} ·{' '}
                  {new Date(s.scheduled_start).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  {' · '}
                  <span className="capitalize">{s.class_type}</span>
                </p>
              </div>
            </div>
            <Link href={`/dashboard/classroom/${s.id}`}
              className="px-3 py-1.5 bg-gradient-to-r from-secondary to-primary text-white rounded-xl text-[10px] font-bold flex items-center gap-1.5 hover:opacity-90 transition shrink-0">
              <Video className="w-3.5 h-3.5" /> {s.status === 'completed' ? 'Review' : 'Join Class'}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
