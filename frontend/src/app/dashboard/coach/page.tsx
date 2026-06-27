'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { api, API_URL } from '@/utils/api';
import {
  Calendar, CheckCircle, Clock, Video, ClipboardList,
  Users, ChevronRight, Award, UserMinus, FileText, AlertTriangle, BookOpen, Star, RefreshCw
} from 'lucide-react';
import Link from 'next/link';

interface Session {
  id: string;
  title: string;
  class_type: string;
  scheduled_start: string;
  status: string;
  notes?: string;
  topics_covered?: string;
  students: { student: { id: string; user: { first_name: string; last_name: string } } }[];
  zoom_meeting?: { start_url: string };
}

interface Submission {
  id: string;
  submission_notes: string;
  submitted_at: string;
  drive_file_id?: string;
  assignment: {
    homework: { title: string };
    student: { id: string; user: { first_name: string; last_name: string } };
  };
}

interface StudentDetail {
  id: string;
  user: { first_name: string; last_name: string; email: string };
  lichess_rating?: number;
  session_balance: number;
  total_xp: number;
  level: number;
}

export default function CoachDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [students, setStudents] = useState<StudentDetail[]>([]);
  const [msg, setMsg] = useState('');
  const [matching, setMatching] = useState(false);
  
  // Tab states
  const [filterTab, setFilterTab] = useState<'today' | 'upcoming' | 'completed'>('today');

  const runAutoMatch = async () => {
    setMatching(true);
    try {
      const res = await api.post('/academy/sessions/auto_match_recordings/');
      setMsg(`✅ ${res.data.message}`);
      loadData();
    } catch (err) {
      setMsg('❌ Failed to run recording auto-matcher.');
    } finally {
      setMatching(false);
      setTimeout(() => setMsg(''), 6000);
    }
  };

  const loadData = useCallback(async () => {
    try {
      const [sRes, sessRes, subsRes, studRes] = await Promise.all([
        api.get('/academy/dashboard/stats/'),
        api.get('/academy/sessions/'),
        api.get('/homework/submissions/'),
        api.get('/academy/students/'),
      ]);
      setStats(sRes.data);
      setSessions(sessRes.data);
      setSubmissions(subsRes.data.filter((x: any) => x.status === 'pending_review'));
      setStudents(studRes.data);
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute Active Session (starts within 30m or already running)
  const now = new Date();
  const activeClass = sessions.find(s => {
    if (s.status !== 'scheduled') return false;
    const diff = new Date(s.scheduled_start).getTime() - now.getTime();
    // active if scheduled start is within past 2 hours or next 30 minutes
    return diff >= -7200000 && diff <= 1800000;
  });

  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);

  const todaySessions = sessions.filter(s => {
    const d = new Date(s.scheduled_start);
    return s.status === 'scheduled' && d >= todayStart && d <= todayEnd;
  });
  const upcomingSessions = sessions.filter(s => s.status === 'scheduled' && new Date(s.scheduled_start) > todayEnd);
  const completedSessions = sessions.filter(s => s.status === 'completed');

  const displaySessions = filterTab === 'today' ? todaySessions : filterTab === 'upcoming' ? upcomingSessions : completedSessions;

  // Attendance Queue: Scheduled sessions scheduled today/past that are NOT completed yet
  const attendanceQueue = sessions.filter(s => s.status === 'scheduled' && new Date(s.scheduled_start) <= todayEnd);

  // Pending Reports: Completed sessions with missing 'topics_covered' or 'notes' fields
  const pendingReports = sessions.filter(s => s.status === 'completed' && (!s.topics_covered || !s.notes));

  // Low Activity Students: (Calculated dynamically)
  // Has session balance > 0 but hasn't attended any completed session in the past 14 days
  const lowActivityStudents = students.filter(student => {
    const studentSessions = sessions.filter(s =>
      s.status === 'completed' &&
      s.students.some(sp => sp.student.id === student.id)
    );
    if (studentSessions.length === 0) return true;

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const hasRecent = studentSessions.some(s => new Date(s.scheduled_start) >= fourteenDaysAgo);
    return !hasRecent && student.session_balance > 0;
  });

  const approveSubmission = async (id: string) => {
    try {
      await api.post(`/homework/submissions/${id}/review/`, {
        status: 'approved',
        coach_feedback: 'Excellent work and accuracy!',
        coach_score: 100
      });
      setMsg('✅ Homework approved. XP rewards credited to the student.');
      loadData();
      setTimeout(() => setMsg(''), 4000);
    } catch {
      setMsg('❌ Review approval failed.');
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header bar */}
      <div className="flex justify-between items-center flex-wrap gap-4 border-b border-border/80 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Star className="text-primary w-5 h-5" /> Coach Control Center
          </h2>
          <p className="text-xs text-muted mt-0.5">Manage live classrooms, review homework submissions, and monitor student metrics.</p>
        </div>
        <button
          onClick={runAutoMatch}
          disabled={matching}
          className="px-4 py-2 bg-secondary text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${matching ? 'animate-spin' : ''}`} />
          {matching ? 'Matching Google Drive...' : 'Auto-Match Recordings'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today's Classes", value: todaySessions.length, color: 'text-primary' },
          { label: "Homework Reviews", value: submissions.length, color: 'text-secondary' },
          { label: "Active Students", value: students.length, color: 'text-accent' },
          { label: "Pending Reports", value: pendingReports.length, color: 'text-yellow-400' }
        ].map((s, idx) => (
          <div key={idx} className="glass p-5 rounded-2xl border-border hover:-translate-y-0.5 transition duration-200">
            <p className="text-2xl font-extrabold text-white">{s.value}</p>
            <p className={`text-[9px] font-bold uppercase tracking-wider mt-1 ${s.color}`}>{s.label}</p>
          </div>
        ))}
      </div>

      {msg && (
        <div className="p-3 bg-secondary/15 border border-secondary/30 text-secondary text-xs rounded-xl font-medium animate-fade-in">
          {msg}
        </div>
      )}

      {/* Active Class Live Banner */}
      {activeClass && (
        <div className="glass p-5 rounded-3xl border-primary/30 bg-gradient-to-r from-primary/10 to-secondary/5 flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/20 rounded-xl text-primary shrink-0">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded font-bold uppercase tracking-wider">LIVE NOW</span>
              <h3 className="font-extrabold text-white text-sm mt-1">{activeClass.title}</h3>
              <p className="text-[10px] text-muted">
                Scheduled start: {new Date(activeClass.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <Link href={`/dashboard/classroom/${activeClass.id}`}
            className="w-full md:w-auto px-5 py-2 bg-primary text-white rounded-xl text-xs font-bold text-center hover:opacity-90 transition shadow-lg shadow-primary/20">
            One-Click Start Class
          </Link>
        </div>
      )}

      {/* Main Grid split */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (65%) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Class Schedules Panel */}
          <div className="space-y-4">
            <div className="flex gap-2 border-b border-border pb-2">
              {(['today', 'upcoming', 'completed'] as const).map(tab => {
                const count = tab === 'today' ? todaySessions.length : tab === 'upcoming' ? upcomingSessions.length : completedSessions.length;
                return (
                  <button key={tab} onClick={() => setFilterTab(tab)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                      filterTab === tab ? 'bg-primary text-white' : 'text-muted hover:text-foreground'
                    }`}>
                    {tab} ({count})
                  </button>
                );
              })}
            </div>

            <div className="glass p-5 rounded-3xl border-border space-y-3">
              {displaySessions.length === 0 ? (
                <div className="py-8 text-center text-muted text-xs border border-dashed border-border rounded-xl">
                  No {filterTab} classes found.
                </div>
              ) : (
                displaySessions.map(session => (
                  <div key={session.id} className="p-4 bg-background/50 border border-border rounded-2xl flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <p className="font-bold text-white text-sm">{session.title}</p>
                      <p className="text-[10px] text-muted mt-1">
                        {new Date(session.scheduled_start).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        {' · '}{session.class_type} · {session.students.length} student(s)
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/dashboard/classroom/${session.id}`}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-secondary to-primary text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:opacity-90 transition">
                        <Video className="w-3.5 h-3.5" /> Start Classroom
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Low Activity Warning panel */}
          <div className="glass p-5 rounded-3xl border-border space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <AlertTriangle className="text-yellow-400 w-4 h-4" /> Low Activity Monitor
              </h3>
              <span className="text-[9px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded font-bold">ATTENTION NEEDED</span>
            </div>
            {lowActivityStudents.length === 0 ? (
              <p className="text-xs text-muted text-center py-4">All students active within the past 14 days. Good engagement!</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {lowActivityStudents.map(student => (
                  <div key={student.id} className="p-3 bg-yellow-500/5 border border-yellow-500/10 rounded-xl flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-white">{student.user.first_name} {student.user.last_name}</p>
                      <p className="text-[9px] text-muted mt-0.5">No attendance in last 14 days</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-yellow-400 font-bold">Bal: {student.session_balance} classes</p>
                      <Link href={`mailto:${student.user.email}`} className="text-[8px] text-muted underline block mt-0.5">Contact parent</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (35%) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Coach Performance Dashboard */}
          <div className="glass p-5 rounded-3xl border-border bg-gradient-to-br from-secondary/10 to-primary/5">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 mb-4 border-b border-border/40 pb-2">
              <Award className="text-secondary w-4 h-4 animate-bounce" /> Performance Metrics
            </h3>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-background/50 border border-border rounded-2xl text-center">
                <p className="text-[8px] text-muted font-bold uppercase">Attendance Rate</p>
                <p className="text-lg font-extrabold text-white mt-0.5">{stats?.attendance_rate ?? 100}%</p>
              </div>
              <div className="p-3 bg-background/50 border border-border rounded-2xl text-center">
                <p className="text-[8px] text-muted font-bold uppercase">HW Completion</p>
                <p className="text-lg font-extrabold text-white mt-0.5">{stats?.homework_completion_rate ?? 100}%</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center p-2.5 bg-background/30 rounded-xl border border-border/50 text-xs">
                <span className="text-muted">Assigned Students</span>
                <span className="font-bold text-white">{stats?.assigned_students ?? 0}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-background/30 rounded-xl border border-border/50 text-xs">
                <span className="text-muted">Classes Completed</span>
                <span className="font-bold text-white">{stats?.completed_classes ?? 0}</span>
              </div>
              <div className="flex justify-between items-center p-2.5 bg-background/30 rounded-xl border border-border/50 text-xs">
                <span className="text-muted">Avg ELO Improvement</span>
                <span className="font-bold text-accent font-mono">+{stats?.average_improvement ?? 150} ELO</span>
              </div>
            </div>
          </div>

          {/* Homework Review Panel */}
          <div className="glass p-5 rounded-3xl border-border">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 mb-4">

              <ClipboardList className="text-secondary w-4 h-4" /> Homework Review Queue ({submissions.length})
            </h3>
            {submissions.length === 0 ? (
              <div className="py-6 text-center text-muted text-xs border border-dashed border-border rounded-xl">
                No submissions waiting for review.
              </div>
            ) : (
              submissions.map(sub => (
                <div key={sub.id} className="p-3 bg-background/50 border border-border rounded-2xl space-y-2 mb-3">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-xs font-bold text-white leading-snug">{sub.assignment.homework.title}</p>
                  </div>
                  <p className="text-[9px] text-muted">Submitted by: {sub.assignment.student.user.first_name} {sub.assignment.student.user.last_name}</p>
                  {sub.submission_notes && <p className="text-[9px] text-muted/80 italic font-mono">"{sub.submission_notes}"</p>}
                  <div className="flex gap-2 justify-end pt-1">
                    {sub.drive_file_id && (
                      <a href={`${API_URL}/homework/submissions/${sub.id}/download/`} target="_blank" rel="noreferrer"
                        className="px-2.5 py-1 border border-border text-muted rounded-lg text-[9px] font-bold hover:text-white transition">
                        View PDF
                      </a>
                    )}
                    <button onClick={() => approveSubmission(sub.id)}
                      className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded-lg text-[9px] font-bold transition">
                      Approve & Credit XP
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Attendance Roll Call Queue */}
          <div className="glass p-5 rounded-3xl border-border">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 mb-3">
              <CheckCircle className="text-primary w-4 h-4" /> Roll Call Queue ({attendanceQueue.length})
            </h3>
            <p className="text-[9px] text-muted mb-3">Sessions requiring attendance list submissions.</p>
            <div className="space-y-2">
              {attendanceQueue.length === 0 ? (
                <p className="text-xs text-muted text-center py-4">All sessions updated.</p>
              ) : (
                attendanceQueue.map(session => (
                  <Link href={`/dashboard/classroom/${session.id}`} key={session.id}
                    className="flex justify-between items-center p-2.5 bg-background/50 hover:bg-border/20 border border-border rounded-xl transition text-xs">
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate">{session.title}</p>
                      <p className="text-[8px] text-muted mt-0.5">{new Date(session.scheduled_start).toLocaleDateString()}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted" />
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Pending Reports / Notes Queue */}
          <div className="glass p-5 rounded-3xl border-border">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 mb-3">
              <FileText className="text-yellow-400 w-4 h-4" /> Pending Reports ({pendingReports.length})
            </h3>
            <p className="text-[9px] text-muted mb-3">Completed sessions with missing summary reports or feedback notes.</p>
            <div className="space-y-2">
              {pendingReports.length === 0 ? (
                <p className="text-xs text-muted text-center py-4">All summaries generated.</p>
              ) : (
                pendingReports.map(session => (
                  <Link href={`/dashboard/classroom/${session.id}`} key={session.id}
                    className="flex justify-between items-center p-2.5 bg-background/50 hover:bg-border/20 border border-border rounded-xl transition text-xs">
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate">{session.title}</p>
                      <p className="text-[8px] text-muted mt-0.5">{new Date(session.scheduled_start).toLocaleDateString()}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted" />
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
