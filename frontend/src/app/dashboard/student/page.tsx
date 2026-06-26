'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/utils/api';
import Link from 'next/link';
import {
  Calendar, Video, FileText, TrendingUp, Trophy,
  Flame, Clock, CheckCircle, Award, Target, RefreshCw, Star, Users, CheckSquare, Square, BarChart2, BookOpen
} from 'lucide-react';

interface Session {
  id: string;
  title: string;
  scheduled_start: string;
  status: string;
  notes?: string;
  topics_covered?: string;
  coach: { user: { first_name: string; last_name: string } };
  zoom_meeting?: { join_url: string };
  recording_drive_link?: string;
}

interface Assignment {
  id: string;
  status: string;
  due_date: string;
  homework: { title: string; description: string; homework_type: string; lichess_study_url?: string };
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon_type: string;
  xp_bonus: number;
}

interface LeaderboardEntry {
  rank: number;
  student_id: string;
  name: string;
  total_xp: number;
  level: number;
  badges_count: number;
}

interface MonthlyReport {
  id: string;
  report_month: string;
  attendance_rate: number;
  homework_rate: number;
  rating_growth: number;
  puzzle_accuracy: number;
  strengths: string[];
  weaknesses: string[];
  coach_feedback: string;
  next_month_goals: { text: string; completed: boolean }[];
  created_at: string;
}

export default function StudentDashboard() {
  const { user, profile, loadMe } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [homework, setHomework] = useState<Assignment[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Homework submission state
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [subNotes, setSubNotes] = useState('');
  const [subFile, setSubFile] = useState<File | null>(null);
  const [msg, setMsg] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [sRes, sessRes, hwRes, badgeRes, leadRes, reportsRes] = await Promise.all([
        api.get('/academy/dashboard/stats/'),
        api.get('/academy/sessions/'),
        api.get('/homework/assignments/'),
        api.get('/gamification/badges/').catch(() => ({ data: [] })),
        api.get('/gamification/leaderboard/').catch(() => ({ data: [] })),
        api.get('/academy/monthly-reports/').catch(() => ({ data: [] })),
      ]);
      setStats(sRes.data);
      setSessions(sessRes.data);
      setHomework(hwRes.data);
      setBadges(badgeRes.data);
      setLeaderboard(leadRes.data.slice(0, 5)); // top 5
      setReports(reportsRes.data);

      if (typeof window !== 'undefined') {
        localStorage.setItem('offline_stats', JSON.stringify(sRes.data));
        localStorage.setItem('offline_sessions', JSON.stringify(sessRes.data));
        localStorage.setItem('offline_homework', JSON.stringify(hwRes.data));
        localStorage.setItem('offline_badges', JSON.stringify(badgeRes.data));
        localStorage.setItem('offline_leaderboard', JSON.stringify(leadRes.data.slice(0, 5)));
        localStorage.setItem('offline_reports', JSON.stringify(reportsRes.data));
      }
    } catch (err) {
      console.error('Failed to load student dashboard', err);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      setIsOffline(!navigator.onLine);

      const cachedStats = localStorage.getItem('offline_stats');
      const cachedSessions = localStorage.getItem('offline_sessions');
      const cachedHomework = localStorage.getItem('offline_homework');
      const cachedBadges = localStorage.getItem('offline_badges');
      const cachedLeaderboard = localStorage.getItem('offline_leaderboard');
      const cachedReports = localStorage.getItem('offline_reports');

      if (cachedStats) setStats(JSON.parse(cachedStats));
      if (cachedSessions) setSessions(JSON.parse(cachedSessions));
      if (cachedHomework) setHomework(JSON.parse(cachedHomework));
      if (cachedBadges) setBadges(JSON.parse(cachedBadges));
      if (cachedLeaderboard) setLeaderboard(JSON.parse(cachedLeaderboard));
      if (cachedReports) setReports(JSON.parse(cachedReports));
    }
    loadData();
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, [loadData]);

  const syncLichess = async () => {
    if (!profile?.id) return;
    setSyncing(true);
    try {
      await api.post(`/academy/students/${profile.id}/sync_lichess/`);
      await loadMe();
      await loadData();
      setMsg('✅ Lichess ratings synchronized successfully!');
    } catch {
      setMsg('❌ Failed to sync Lichess. Make sure username is correct.');
    } finally {
      setSyncing(false);
      setTimeout(() => setMsg(''), 4000);
    }
  };

  const submitHomework = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('assignment', id);
    fd.append('submission_notes', subNotes);
    if (subFile) fd.append('uploaded_file', subFile);
    
    try {
      await api.post('/homework/submissions/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMsg('✅ Homework submitted successfully!');
      setSubmitting(null);
      setSubNotes('');
      setSubFile(null);
      loadData();
    } catch {
      setMsg('❌ Submission failed. Try again.');
    }
    setTimeout(() => setMsg(''), 4000);
  };

  const upcomingClasses = sessions.filter(s => s.status === 'scheduled');
  const activeClass = upcomingClasses.find(s => {
    const diff = new Date(s.scheduled_start).getTime() - new Date().getTime();
    return diff >= -3600000 && diff <= 1800000; // scheduled start is within 1 hour past or 30 mins future
  });

  const completedClasses = sessions.filter(s => s.status === 'completed');
  const pendingHW = homework.filter(h => h.status === 'assigned');

  return (
    <div className="space-y-6 text-left">
      {isOffline && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl flex items-center justify-between text-amber-300 text-xs font-bold shrink-0">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            Offline Mode Active. Viewing cached curriculum, schedule, and homework.
          </span>
        </div>
      )}
      {/* Welcome & Overview Banner */}
      <div className="glass p-5 rounded-3xl border-border bg-gradient-to-r from-primary/10 to-secondary/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] text-primary font-bold uppercase tracking-widest">Student Portal</span>
          <h2 className="text-xl font-extrabold text-white mt-1">Hello, {user?.first_name}! 👋</h2>
          <p className="text-xs text-muted mt-1.5 flex items-center gap-2">
            <span>Coach: {profile?.assigned_coach?.user ? `${profile.assigned_coach.user.first_name} ${profile.assigned_coach.user.last_name}` : 'Awaiting Assign'}</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-accent animate-pulse" /> {stats?.daily_streak ?? 0} Day Streak</span>
          </p>
        </div>
        
        {/* XP Level display */}
        <div className="flex items-center gap-3 bg-background/50 p-3 rounded-2xl border border-border">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-extrabold text-white text-sm shrink-0">
            {profile?.level ?? 1}
          </div>
          <div>
            <p className="text-[9px] text-muted font-bold uppercase tracking-wider">Current Level</p>
            <p className="text-xs font-extrabold text-white">{profile?.total_xp ?? 0} XP Total</p>
            <div className="w-24 bg-border rounded-full h-1.5 mt-1 overflow-hidden">
              <div className="bg-primary h-1.5 rounded-full" style={{ width: `${((profile?.total_xp ?? 0) % 1000) / 10}%` }} />
            </div>
          </div>
        </div>
      </div>

      {msg && (
        <div className="p-3 bg-secondary/15 border border-secondary/30 text-secondary text-xs rounded-xl font-medium animate-fade-in">
          {msg}
        </div>
      )}

      {/* Live Class alert banner */}
      {activeClass && (
        <div className="glass p-5 rounded-3xl border-accent/30 bg-gradient-to-r from-accent/15 to-transparent flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-accent/20 rounded-xl text-accent animate-bounce">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] bg-accent/20 text-accent border border-accent/30 px-2 py-0.5 rounded font-bold uppercase tracking-wider">CLASS IN SESSION</span>
              <h3 className="font-extrabold text-white text-sm mt-1">{activeClass.title}</h3>
              <p className="text-[10px] text-muted">Join now to start learning with your coach!</p>
            </div>
          </div>
          <Link href={`/dashboard/classroom/${activeClass.id}`}
            className="w-full md:w-auto px-5 py-2 bg-accent text-background rounded-xl text-xs font-bold text-center hover:opacity-90 transition shadow-lg shadow-accent/20">
            Enter Live Room
          </Link>
        </div>
      )}

      {/* Main content grid */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left column (60%) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Upcoming & Completed tabs */}
          <div className="glass p-5 rounded-3xl border-border space-y-4">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 border-b border-border/60 pb-3">
              <Calendar className="text-primary w-4 h-4" /> Class Schedule
            </h3>
            {upcomingClasses.length === 0 ? (
              <p className="text-xs text-muted text-center py-6">No scheduled classes. Contact admin to book a session.</p>
            ) : (
              upcomingClasses.slice(0, 3).map(cls => (
                <div key={cls.id} className="p-3 bg-background/50 border border-border rounded-xl flex justify-between items-center flex-wrap gap-3">
                  <div>
                    <p className="font-bold text-white text-xs">{cls.title}</p>
                    <p className="text-[9px] text-muted mt-0.5">
                      {cls.coach.user.first_name} {cls.coach.user.last_name} ·{' '}
                      {new Date(cls.scheduled_start).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <Link href={`/dashboard/classroom/${cls.id}`}
                    className="px-3 py-1 bg-gradient-to-r from-secondary to-primary text-white rounded-lg text-[9px] font-bold flex items-center gap-1 hover:opacity-90 transition">
                    <Video className="w-3 h-3" /> Enter Class
                  </Link>
                </div>
              ))
            )}
          </div>

          {/* Homework list */}
          <div className="glass p-5 rounded-3xl border-border space-y-4">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 border-b border-border/60 pb-3">
              <FileText className="text-secondary w-4 h-4" /> Homework Board ({pendingHW.length} pending)
            </h3>
            {homework.length === 0 ? (
              <p className="text-xs text-muted text-center py-6">No assignments right now. Perfect score!</p>
            ) : (
              homework.map(hw => (
                <div key={hw.id} className="p-3.5 bg-background/50 border border-border rounded-2xl space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="font-bold text-white text-xs">{hw.homework.title}</p>
                      <p className="text-[10px] text-muted mt-0.5">{hw.homework.description}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider shrink-0 ${
                      hw.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                      hw.status === 'submitted' ? 'bg-secondary/10 text-secondary' : 'bg-yellow-500/10 text-yellow-400'
                    }`}>{hw.status}</span>
                  </div>
                  
                  <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-border/20">
                    <p className="text-[9px] text-muted">Due: {hw.due_date ? new Date(hw.due_date).toLocaleDateString() : 'No limit'}</p>
                    <div className="flex gap-2">
                      {hw.homework.lichess_study_url && (
                        <a href={hw.homework.lichess_study_url} target="_blank" rel="noreferrer"
                          className="text-[9px] text-secondary font-semibold hover:underline">Lichess Study →</a>
                      )}
                      {hw.status === 'assigned' && (
                        <button onClick={() => setSubmitting(submitting === hw.id ? null : hw.id)}
                          className="px-2.5 py-0.5 bg-primary/20 border border-primary/30 text-primary rounded text-[9px] font-bold hover:bg-primary/30 transition">
                          Submit
                        </button>
                      )}
                    </div>
                  </div>

                  {submitting === hw.id && (
                    <form onSubmit={(e) => submitHomework(e, hw.id)} className="border-t border-border/40 pt-3 space-y-2">
                      <input type="text" required value={subNotes} onChange={e => setSubNotes(e.target.value)}
                        placeholder="Submission details or solution links..."
                        className="w-full px-2.5 py-1.5 bg-background border border-border rounded-xl text-[10px] text-foreground placeholder:text-muted/60 focus:outline-none" />
                      <input type="file" accept=".pdf" onChange={e => setSubFile(e.target.files?.[0] || null)}
                        className="text-[9px] text-muted block" />
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setSubmitting(null)} className="px-2.5 py-0.5 border border-border rounded text-[9px] text-muted font-bold">Cancel</button>
                        <button type="submit" className="px-3.5 py-0.5 bg-secondary text-white rounded text-[9px] font-bold">Submit</button>
                      </div>
                    </form>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Class Reports / Coach Notes logs */}
          <div className="glass p-5 rounded-3xl border-border space-y-4">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 border-b border-border/60 pb-3">
              <Star className="text-yellow-400 w-4 h-4" /> Lesson Progress Reports
            </h3>
            {completedClasses.length === 0 ? (
              <p className="text-xs text-muted text-center py-4">Completed class summaries will show up here.</p>
            ) : (
              completedClasses.slice(0, 3).map(cls => (
                <div key={cls.id} className="p-3 bg-background/50 border border-border rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-white">{cls.title}</p>
                    <span className="text-[9px] text-muted">{new Date(cls.scheduled_start).toLocaleDateString()}</span>
                  </div>
                  {cls.topics_covered && (
                    <p className="text-muted leading-relaxed font-medium"><strong className="text-[10px] text-white">Topics Covered:</strong> {cls.topics_covered}</p>
                  )}
                  {cls.notes && (
                    <p className="text-muted leading-relaxed italic"><strong className="text-[10px] text-white">Coach Feedback:</strong> "{cls.notes}"</p>
                  )}
                  {cls.recording_drive_link && (
                    <div className="pt-2 flex items-center justify-between border-t border-border/20">
                      <span className="text-[10px] text-muted flex items-center gap-1">
                        <Video className="w-3.5 h-3.5 text-primary" /> Class Recording Available
                      </span>
                      <a href={cls.recording_drive_link} target="_blank" rel="noreferrer"
                        className="px-2.5 py-0.5 bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary rounded text-[9px] font-bold transition">
                        Watch Recording
                      </a>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Performance Intelligence & Weakness Detection */}
          {profile?.performance_profile && (
            <div className="glass p-5 rounded-3xl border-border space-y-6">
              <h3 className="text-xs font-bold text-white flex items-center gap-2 border-b border-border/60 pb-3">
                <BarChart2 className="text-primary w-4 h-4" /> Performance Intelligence Diagnostics
              </h3>

              {/* Grid for Lichess Match and Puzzles */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Lichess stats */}
                <div className="bg-background/40 p-4 border border-border/80 rounded-2xl space-y-3">
                  <span className="text-[9px] text-primary font-bold uppercase tracking-wider block">Match Analytics</span>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-background/80 p-2 rounded-xl border border-border/40">
                      <p className="text-lg font-black text-white">{profile.performance_profile.acpl}</p>
                      <p className="text-[7px] text-muted uppercase font-bold tracking-wider">Avg Centipawn Loss</p>
                    </div>
                    <div className="bg-background/80 p-2 rounded-xl border border-border/40 flex flex-col justify-center text-left px-2">
                      <p className="text-[8px] font-semibold text-white">💀 {profile.performance_profile.blunders_avg} blunders / gm</p>
                      <p className="text-[8px] font-semibold text-muted">⚠️ {profile.performance_profile.mistakes_avg} mistakes</p>
                      <p className="text-[8px] font-semibold text-muted">📉 {profile.performance_profile.inaccuracies_avg} inaccuracies</p>
                    </div>
                  </div>
                  <div className="space-y-1 pt-1">
                    <span className="text-[7px] text-muted font-bold uppercase tracking-wider block">Game Stage Ratings</span>
                    <div className="grid grid-cols-3 gap-1.5 text-center text-[9px]">
                      <div className="bg-background/70 p-1 rounded border border-border/20">
                        <span className="font-extrabold text-white">{profile.performance_profile.opening_perf_rating}</span>
                        <p className="text-[6px] text-muted">Opening</p>
                      </div>
                      <div className="bg-background/70 p-1 rounded border border-border/20">
                        <span className="font-extrabold text-white">{profile.performance_profile.middlegame_perf_rating}</span>
                        <p className="text-[6px] text-muted">Middlegame</p>
                      </div>
                      <div className="bg-background/70 p-1 rounded border border-border/20">
                        <span className="font-extrabold text-white">{profile.performance_profile.endgame_perf_rating}</span>
                        <p className="text-[6px] text-muted">Endgame</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Puzzle / Tactical stats */}
                <div className="bg-background/40 p-4 border border-border/80 rounded-2xl space-y-3">
                  <span className="text-[9px] text-secondary font-bold uppercase tracking-wider block">Tactical Analytics</span>
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[9px]">
                    <div className="bg-background/80 p-1.5 rounded-lg border border-border/40">
                      <span className="font-extrabold text-white">{profile.performance_profile.puzzle_accuracy}%</span>
                      <p className="text-[6px] text-muted">Accuracy</p>
                    </div>
                    <div className="bg-background/80 p-1.5 rounded-lg border border-border/40">
                      <span className="font-extrabold text-white">{profile.performance_profile.puzzle_rating}</span>
                      <p className="text-[6px] text-muted">Puzzle ELO</p>
                    </div>
                    <div className="bg-background/80 p-1.5 rounded-lg border border-border/40">
                      <span className="font-extrabold text-white">{profile.performance_profile.solve_speed_seconds}s</span>
                      <p className="text-[6px] text-muted">Avg Speed</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2 bg-green-500/5 border border-green-500/10 rounded-xl">
                      <span className="text-[7px] text-green-400 font-bold uppercase tracking-wider block">Strongest</span>
                      <span className="text-[10px] font-extrabold text-white mt-0.5 block truncate">{profile.performance_profile.strongest_theme}</span>
                    </div>
                    <div className="p-2 bg-red-500/5 border border-red-500/10 rounded-xl">
                      <span className="text-[7px] text-red-400 font-bold uppercase tracking-wider block">Weakest</span>
                      <span className="text-[10px] font-extrabold text-white mt-0.5 block truncate">{profile.performance_profile.weakest_theme}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Automated Weakness Diagnostics */}
              <div className="space-y-3">
                <span className="text-[9px] text-muted font-bold uppercase tracking-wider block">Tactical & Strategic Weakness Diagnostic</span>
                <div className="grid sm:grid-cols-2 gap-x-4 gap-y-2.5">
                  {[
                    { label: 'Fork Vulnerability', value: profile.performance_profile.fork_weakness },
                    { label: 'Pin Vulnerability', value: profile.performance_profile.pin_weakness },
                    { label: 'Skewer Vulnerability', value: profile.performance_profile.skewer_weakness },
                    { label: 'King Safety Issues', value: profile.performance_profile.king_safety_issues },
                    { label: 'Calculation Accuracy', value: profile.performance_profile.calculation_issues },
                    { label: 'Endgame Execution', value: profile.performance_profile.endgame_issues }
                  ].map((w, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-[9px] font-bold">
                        <span className="text-muted">{w.label}</span>
                        <span className="text-white">{w.value}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-background rounded-full overflow-hidden border border-border/30">
                        <div 
                          className="h-full bg-gradient-to-r from-orange-500 to-red-500"
                          style={{ width: `${w.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              {profile.performance_profile.recommendations && profile.performance_profile.recommendations.length > 0 && (
                <div className="p-4 bg-background/50 border border-border/80 rounded-2xl space-y-2">
                  <span className="text-[9px] text-accent font-bold uppercase tracking-wider block">AI Suggested Actions for Improvement</span>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {profile.performance_profile.recommendations.map((rec, i) => (
                      <div key={i} className="p-2.5 bg-background/80 border border-border/30 rounded-xl text-[10px] space-y-1">
                        <span className="text-[7px] bg-accent/20 border border-accent/30 text-accent px-1 py-0.5 rounded font-black uppercase tracking-wider">
                          {rec.type.replace('_', ' ')}
                        </span>
                        <p className="font-extrabold text-white mt-1">{rec.category}</p>
                        <p className="text-[9px] text-muted mt-0.5 font-sans leading-relaxed">{rec.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>


        {/* Right column (40%) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Lichess Ratings & Sync Card */}
          <div className="glass p-5 rounded-3xl border-border space-y-4">
            <div className="flex justify-between items-center border-b border-border/60 pb-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <TrendingUp className="text-secondary w-4 h-4" /> Chess Ratings
              </h3>
              {profile?.lichess_username && (
                <button onClick={syncLichess} disabled={syncing}
                  className="p-1 border border-border rounded-lg text-muted hover:text-white transition"
                  title="Sync Ratings">
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-primary' : ''}`} />
                </button>
              )}
            </div>

            {profile?.lichess_username ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-background/30 p-2.5 rounded-xl border border-border/60">
                  <span className="text-xs text-muted">Lichess ID</span>
                  <span className="text-xs font-bold text-white font-mono">@{profile.lichess_username}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'Rapid', val: profile?.lichess_rapid_rating ?? profile?.lichess_rating ?? 1500 },
                    { label: 'Blitz', val: profile?.lichess_blitz_rating ?? 1500 },
                    { label: 'Classical', val: profile?.lichess_classical_rating ?? 1500 },
                  ].map(r => (
                    <div key={r.label} className="p-2.5 bg-background/50 border border-border rounded-xl">
                      <p className="text-[9px] text-muted font-bold uppercase tracking-wider">{r.label}</p>
                      <p className="text-sm font-extrabold text-white mt-1">{r.val}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-background/50 border border-border rounded-xl text-center text-xs text-muted space-y-2">
                <p>No Lichess username linked to your account.</p>
                <p className="text-[10px]">Add your username in settings to import ratings and history.</p>
              </div>
            )}

            {/* Quick Puzzle Arena launcher */}
            <Link href="/dashboard/student/puzzles"
              className="flex justify-between items-center p-3.5 bg-accent/10 border border-accent/20 hover:bg-accent/15 rounded-2xl transition">
              <div className="flex items-center gap-2">
                <Trophy className="text-accent w-4 h-4 animate-pulse" />
                <div className="text-left">
                  <p className="text-xs font-bold text-white">Interactive Puzzle Arena</p>
                  <p className="text-[9px] text-muted">Practice tactical vision, earn +25 XP rewards</p>
                </div>
              </div>
              <span className="text-xs text-accent">Play →</span>
            </Link>

            {/* Lichess Training Chapters Launcher */}
            <Link href="/dashboard/student/puzzles?tab=chapters"
              className="flex justify-between items-center p-3.5 bg-primary/10 border border-primary/20 hover:bg-primary/15 rounded-2xl transition">
              <div className="flex items-center gap-2">
                <BookOpen className="text-primary w-4 h-4" />
                <div className="text-left">
                  <p className="text-xs font-bold text-white">Lichess Training Chapters</p>
                  <p className="text-[9px] text-muted">Practice specific motifs: Forks, Pins, & more</p>
                </div>
              </div>
              <span className="text-xs text-primary">Explore →</span>
            </Link>
          </div>

          {/* Leaderboard Board */}
          <div className="glass p-5 rounded-3xl border-border space-y-4">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 border-b border-border/60 pb-3">
              <Users className="text-primary w-4 h-4" /> Global Standings (Top 5)
            </h3>
            <div className="space-y-1.5">
              {leaderboard.length === 0 ? (
                <p className="text-xs text-muted text-center py-4">No rankings generated yet.</p>
              ) : (
                leaderboard.map((entry, idx) => (
                  <div key={entry.student_id} className={`flex items-center gap-2 p-2 rounded-xl text-xs ${
                    entry.student_id === profile?.id ? 'bg-primary/10 border border-primary/20' : 'bg-background/30'
                  }`}>
                    <span className="font-extrabold text-muted w-4 text-center">{idx + 1}</span>
                    <span className="text-white font-semibold truncate flex-1">{entry.name}</span>
                    <span className="text-[9px] text-muted">Lvl {entry.level}</span>
                    <span className="font-bold text-white shrink-0 ml-2">{entry.total_xp} XP</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Achievement badge shelf */}
          <div className="glass p-5 rounded-3xl border-border space-y-4">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 border-b border-border/60 pb-3">
              <Award className="text-primary w-4 h-4" /> Badge Showcase
            </h3>
            {badges.length === 0 ? (
              <p className="text-xs text-muted text-center py-4 font-medium">Earn badges by completing assignments and attending classes!</p>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {badges.map(b => (
                  <div key={b.id} className="flex flex-col items-center text-center p-1 cursor-help" title={b.description}>
                    <div className="w-10 h-10 rounded-full bg-secondary/15 border border-secondary/30 flex items-center justify-center text-sm mb-1 text-secondary">
                      🏆
                    </div>
                    <p className="text-[8px] font-bold text-white truncate w-full">{b.name}</p>
                    <p className="text-[6px] text-muted">+{b.xp_bonus} XP</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Class Package Tracking */}
          <div className="glass p-5 rounded-3xl border-border space-y-4">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 border-b border-border/60 pb-3">
              <Clock className="text-secondary w-4 h-4" /> Class Package Status
            </h3>
            {(!profile?.package_tracking || profile.package_tracking.length === 0) ? (
              <div className="p-3 bg-background/50 border border-border rounded-xl text-center text-xs text-muted">
                No active class packages found.
              </div>
            ) : (
              profile.package_tracking.map((pkg: any) => (
                <div key={pkg.id} className="p-3 bg-background/50 border border-border rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white">{pkg.plan_name}</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                      pkg.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-border text-muted'
                    }`}>{pkg.status}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[10px] text-center text-muted">
                    <div>
                      <p className="font-semibold text-white">{pkg.purchased}</p>
                      <p className="text-[8px]">Purchased</p>
                    </div>
                    <div>
                      <p className="font-semibold text-white">{pkg.consumed}</p>
                      <p className="text-[8px]">Consumed</p>
                    </div>
                    <div>
                      <p className="font-semibold text-accent">{pkg.remaining}</p>
                      <p className="text-[8px]">Remaining</p>
                    </div>
                  </div>
                  <p className="text-[8px] text-muted border-t border-border/20 pt-1">Expiry: {pkg.expiry_date}</p>
                </div>
              ))
            )}
          </div>

          {/* Student Learning Roadmap & Goals */}
          <div className="glass p-5 rounded-3xl border-border space-y-5">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 border-b border-border/60 pb-3">
              <Target className="text-primary w-4 h-4" /> Curriculum Roadmap & Targets
            </h3>

            {/* Target Progress ELO */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted">Target ELO Progression</span>
                <span className="text-white font-black">{profile?.lichess_rating ?? 1500} / {profile?.target_rating ?? 1750} ELO</span>
              </div>
              <div className="w-full bg-background rounded-full h-2 overflow-hidden border border-border/50">
                <div 
                  className="bg-gradient-to-r from-primary via-accent to-secondary h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min(Math.max(
                      (((profile?.lichess_rating ?? 1500) - (profile?.starting_rating ?? 1200)) / 
                      (Math.max((profile?.target_rating ?? 1750) - (profile?.starting_rating ?? 1200), 100))) * 100, 
                      10
                    ), 100)}%` 
                  }} 
                />
              </div>
              <div className="flex justify-between text-[8px] text-muted font-bold uppercase tracking-wider">
                <span>Start: {profile?.starting_rating ?? 1200}</span>
                <span>Current: {profile?.lichess_rating ?? 1500}</span>
                <span>Target: {profile?.target_rating ?? 1750}</span>
              </div>
            </div>

            {/* Detailed Roadmap */}
            <div className="space-y-2 pt-2 border-t border-border/20">
              <p className="text-[9px] text-muted font-bold uppercase tracking-wider">Milestones by Category</p>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {profile?.roadmap && Object.entries(profile.roadmap).map(([cat, details]: [string, any]) => {
                  const statusColors = {
                    completed: 'bg-green-500/10 border-green-500/30 text-green-400',
                    in_progress: 'bg-primary/10 border-primary/30 text-primary',
                    not_started: 'bg-background border-border/40 text-muted'
                  };
                  const statusLabel = {
                    completed: 'Completed',
                    in_progress: 'In Progress',
                    not_started: 'Not Started'
                  };
                  return (
                    <div key={cat} className="p-2.5 bg-background/40 border border-border/55 rounded-xl flex justify-between items-start gap-3">
                      <div className="space-y-1">
                        <p className="font-extrabold text-white text-[11px]">{cat}</p>
                        {details.topics?.length > 0 ? (
                          <p className="text-[10px] text-muted leading-tight">
                            Topics: {details.topics.join(', ')}
                          </p>
                        ) : (
                          <p className="text-[9px] text-muted/60 italic leading-none">No custom topics assigned yet.</p>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase shrink-0 border ${statusColors[details.status as 'completed' | 'in_progress' | 'not_started'] || statusColors.not_started}`}>
                        {statusLabel[details.status as 'completed' | 'in_progress' | 'not_started'] || 'Not Started'}
                      </span>
                    </div>
                  );
                })}
                {(!profile?.roadmap || Object.keys(profile.roadmap).length === 0) && (
                  <p className="text-[10px] text-muted italic">Roadmap not yet customized by coach.</p>
                )}
              </div>
            </div>

            {/* Goals checklists */}
            <div className="space-y-4 pt-3 border-t border-border/20">
              {/* Weekly Goals */}
              <div className="space-y-1.5">
                <p className="text-[9px] text-muted font-bold uppercase tracking-wider">Weekly Goals</p>
                <div className="space-y-1">
                  {profile?.weekly_goals?.map((goal: any, idx: number) => (
                    <div key={idx} className="flex gap-2 items-center text-[11px]">
                      {goal.completed ? (
                        <CheckSquare className="w-3.5 h-3.5 text-green-400 shrink-0" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-muted shrink-0" />
                      )}
                      <span className={goal.completed ? 'line-through text-muted' : 'text-white'}>
                        {goal.text}
                      </span>
                    </div>
                  ))}
                  {(!profile?.weekly_goals || profile.weekly_goals.length === 0) && (
                    <p className="text-[10px] text-muted italic">No weekly goals active.</p>
                  )}
                </div>
              </div>

              {/* Monthly Goals */}
              <div className="space-y-1.5">
                <p className="text-[9px] text-muted font-bold uppercase tracking-wider">Monthly Goals</p>
                <div className="space-y-1">
                  {profile?.monthly_goals?.map((goal: any, idx: number) => (
                    <div key={idx} className="flex gap-2 items-center text-[11px]">
                      {goal.completed ? (
                        <CheckSquare className="w-3.5 h-3.5 text-green-400 shrink-0" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-muted shrink-0" />
                      )}
                      <span className={goal.completed ? 'line-through text-muted' : 'text-white'}>
                        {goal.text}
                      </span>
                    </div>
                  ))}
                  {(!profile?.monthly_goals || profile.monthly_goals.length === 0) && (
                    <p className="text-[10px] text-muted italic">No monthly goals active.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/20">
              <div className="p-2.5 bg-primary/5 border border-primary/10 rounded-xl space-y-1">
                <p className="text-[8px] text-primary font-bold uppercase tracking-wider">Strengths</p>
                <div className="flex flex-wrap gap-1">
                  {profile?.strengths?.map((str: string) => (
                    <span key={str} className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">{str}</span>
                  ))}
                  {(!profile?.strengths || profile.strengths.length === 0) && (
                    <span className="text-[9px] text-muted italic">Not set</span>
                  )}
                </div>
              </div>
              
              <div className="p-2.5 bg-accent/5 border border-accent/10 rounded-xl space-y-1">
                <p className="text-[8px] text-accent font-bold uppercase tracking-wider">Weaknesses</p>
                <div className="flex flex-wrap gap-1">
                  {profile?.weaknesses?.map((wk: string) => (
                    <span key={wk} className="text-[9px] bg-accent/10 text-accent px-1.5 py-0.5 rounded">{wk}</span>
                  ))}
                  {(!profile?.weaknesses || profile.weaknesses.length === 0) && (
                    <span className="text-[9px] text-muted italic">Not set</span>
                  )}
                </div>
              </div>
            </div>

            {/* Coach Recommendation */}
            {profile?.coach_notes && (
              <div className="p-3 bg-secondary/10 border border-secondary/20 rounded-2xl text-[11px] text-muted">
                <p className="font-bold text-white mb-1">💡 Coach Recommendation</p>
                <p className="leading-relaxed font-sans">"{profile.coach_notes}"</p>
              </div>
            )}
          </div>

          {/* Published Monthly Student Reports Feed */}
          <div className="glass p-5 rounded-3xl border-border space-y-4">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 border-b border-border/60 pb-3">
              <BarChart2 className="text-secondary w-4 h-4" /> Published Monthly Reports
            </h3>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {reports.map(report => (
                <div key={report.id} className="p-3.5 bg-background/50 border border-border rounded-2xl space-y-3 text-xs">
                  <div className="flex justify-between items-center border-b border-border/20 pb-1.5">
                    <span className="font-extrabold text-white text-[11px]">{report.report_month} Progress Report</span>
                    <span className="text-[8px] text-muted">{new Date(report.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="font-black text-white text-sm">{report.attendance_rate}%</p>
                      <p className="text-[8px] text-muted">Attendance</p>
                    </div>
                    <div>
                      <p className="font-black text-white text-sm">{report.homework_rate}%</p>
                      <p className="text-[8px] text-muted">Homework</p>
                    </div>
                    <div>
                      <p className="font-black text-white text-sm">{report.rating_growth >= 0 ? '+' : ''}{report.rating_growth}</p>
                      <p className="text-[8px] text-muted">Rating Growth</p>
                    </div>
                    <div>
                      <p className="font-black text-white text-sm">{report.puzzle_accuracy}%</p>
                      <p className="text-[8px] text-muted">Puzzle Acc</p>
                    </div>
                  </div>

                  {report.coach_feedback && (
                    <div className="bg-background/40 p-2.5 rounded-xl border border-border/30">
                      <p className="text-[8px] text-muted font-bold uppercase tracking-wider mb-0.5">Coach Review</p>
                      <p className="italic text-muted leading-relaxed">"{report.coach_feedback}"</p>
                    </div>
                  )}
                </div>
              ))}
              {reports.length === 0 && (
                <p className="text-xs text-muted text-center py-6">Your monthly developmental reports will appear here once published by your coach.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

