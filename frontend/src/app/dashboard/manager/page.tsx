'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/utils/api';
import {
  Users, Calendar, DollarSign, TrendingUp, Activity,
  CheckCircle, UserPlus, Video, ClipboardList, AlertCircle,
  BarChart3, Flame, BookOpen, Clock
} from 'lucide-react';

interface Stats {
  total_students: number; active_students: number; inactive_students: number;
  total_coaches: number; upcoming_classes: number; completed_classes: number;
  total_revenue: number; new_leads: number;
  homework_completion_rate: number; coach_utilization: number;
}
interface Session {
  id: string; title: string; class_type: string;
  scheduled_start: string; status: string;
  coach: { user: { first_name: string; last_name: string } };
  students: { student: { user: { first_name: string; last_name: string } } }[];
  zoom_meeting?: { start_url: string; join_url: string };
}

function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="glass p-5 rounded-2xl border-border flex items-center justify-between">
      <div>
        <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-extrabold text-white">{value}</p>
      </div>
      <div className={`p-3 rounded-xl ${color}`}><Icon className="w-5 h-5" /></div>
    </div>
  );
}

interface CoachPerformance {
  coach_id: string;
  name: string;
  classes_completed: number;
  assigned_students: number;
  homework_completion_rate: number;
  average_improvement: number;
}
interface MonthlyReport {
  new_leads: number;
  conversions: number;
  active_students: number;
  classes_conducted: number;
  homework_completion_rate: number;
  attendance_rate: number;
  coach_performance: CoachPerformance[];
}

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [msg, setMsg] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [s, sess, r] = await Promise.all([
        api.get('/academy/dashboard/stats/'),
        api.get('/academy/sessions/'),
        api.get('/academy/reports/monthly/').catch(() => ({ data: null })),
      ]);
      setStats(s.data);
      setSessions(sess.data.filter((x: any) => x.status === 'scheduled').slice(0, 5));
      if (r && r.data) setReport(r.data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const cancelSession = async (id: string) => {
    try {
      await api.post(`/academy/sessions/${id}/cancel/`);
      setMsg('Session cancelled.');
      loadData();
    } catch { setMsg('Failed to cancel session.'); }
  };

  return (

    <div className="space-y-7">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={stats?.total_students ?? 0} icon={Users} color="bg-primary/10 text-primary" />
        <StatCard label="Active Students" value={stats?.active_students ?? 0} icon={Activity} color="bg-green-500/10 text-green-400" />
        <StatCard label="Total Coaches" value={stats?.total_coaches ?? 0} icon={UserPlus} color="bg-secondary/10 text-secondary" />
        <StatCard label="Revenue (₹)" value={(stats?.total_revenue ?? 0).toLocaleString('en-IN')} icon={DollarSign} color="bg-accent/10 text-accent" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Upcoming Classes" value={stats?.upcoming_classes ?? 0} icon={Calendar} color="bg-blue-500/10 text-blue-400" />
        <StatCard label="Classes Done" value={stats?.completed_classes ?? 0} icon={CheckCircle} color="bg-green-500/10 text-green-400" />
        <StatCard label="New Leads" value={stats?.new_leads ?? 0} icon={TrendingUp} color="bg-yellow-500/10 text-yellow-400" />
        <StatCard label="HW Completion" value={`${stats?.homework_completion_rate ?? 0}%`} icon={BookOpen} color="bg-secondary/10 text-secondary" />
      </div>

      {msg && (
        <div className="p-3 bg-secondary/10 border border-secondary/30 text-secondary text-sm rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {msg}
        </div>
      )}

      {/* Upcoming Sessions Table */}
      <div className="glass p-6 rounded-3xl border-border">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Calendar className="text-primary w-4 h-4" /> Upcoming Sessions
          </h3>
          <a href="/dashboard/manager/sessions" className="text-xs text-primary hover:underline font-semibold">Manage All →</a>
        </div>

        {sessions.length === 0 ? (
          <div className="py-8 text-center text-muted text-xs border border-dashed border-border rounded-xl">
            No upcoming sessions scheduled. <a href="/dashboard/manager/sessions" className="text-primary hover:underline">Schedule one →</a>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/60">
                  {['Session', 'Coach', 'Students', 'Time', 'Type', 'Actions'].map(h => (
                    <th key={h} className="pb-2 text-left text-muted font-bold uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {sessions.map(s => (
                  <tr key={s.id} className="hover:bg-border/10 transition">
                    <td className="py-3 font-semibold text-white">{s.title}</td>
                    <td className="py-3 text-muted">{s.coach.user.first_name} {s.coach.user.last_name}</td>
                    <td className="py-3 text-muted">{s.students.map(x => x.student.user.first_name).join(', ') || '—'}</td>
                    <td className="py-3 text-muted whitespace-nowrap">{new Date(s.scheduled_start).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="py-3"><span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary capitalize font-semibold">{s.class_type}</span></td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <a href={`/dashboard/classroom/${s.id}`}
                          className="px-2.5 py-1 bg-secondary text-white rounded-lg font-semibold hover:opacity-90 transition">
                          Join
                        </a>
                        <button onClick={() => cancelSession(s.id)}
                          className="px-2.5 py-1 border border-red-500/30 text-red-400 rounded-lg font-semibold hover:bg-red-500/10 transition">
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Academy Monthly Report */}
      {report && (
        <div className="glass p-6 rounded-3xl border-border bg-gradient-to-br from-primary/5 to-secondary/5 space-y-6">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <BarChart3 className="text-secondary w-4 h-4 animate-pulse" /> Monthly Executive Academy Report (Last 30 Days)
            </h3>
            <span className="text-[10px] text-muted uppercase font-bold tracking-wider">Confidential</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-background/55 border border-border/80 rounded-2xl">
              <p className="text-[9px] text-muted font-bold uppercase tracking-wider">Leads & Conversions</p>
              <p className="text-lg font-extrabold text-white mt-1">
                {report.conversions} / {report.new_leads} <span className="text-xs text-accent font-medium">({report.new_leads > 0 ? Math.round((report.conversions / report.new_leads) * 100) : 100}%)</span>
              </p>
            </div>
            <div className="p-4 bg-background/55 border border-border/80 rounded-2xl">
              <p className="text-[9px] text-muted font-bold uppercase tracking-wider">Classes Conducted</p>
              <p className="text-lg font-extrabold text-white mt-1">{report.classes_conducted}</p>
            </div>
            <div className="p-4 bg-background/55 border border-border/80 rounded-2xl">
              <p className="text-[9px] text-muted font-bold uppercase tracking-wider">Attendance Rate</p>
              <p className="text-lg font-extrabold text-green-400 mt-1">{report.attendance_rate}%</p>
            </div>
            <div className="p-4 bg-background/55 border border-border/80 rounded-2xl">
              <p className="text-[9px] text-muted font-bold uppercase tracking-wider">Homework Completion</p>
              <p className="text-lg font-extrabold text-secondary mt-1">{report.homework_completion_rate}%</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Coach Performance Metrics</p>
            <div className="overflow-x-auto border border-border/60 rounded-2xl bg-background/45">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border/60 bg-border/20 text-muted">
                    <th className="p-3 font-bold uppercase">Coach</th>
                    <th className="p-3 font-bold uppercase text-center">Classes Completed</th>
                    <th className="p-3 font-bold uppercase text-center">Assigned Students</th>
                    <th className="p-3 font-bold uppercase text-center">HW Completion</th>
                    <th className="p-3 font-bold uppercase text-center">Avg student ELO Growth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/25">
                  {report.coach_performance.map((c) => (
                    <tr key={c.coach_id} className="hover:bg-border/10 transition">
                      <td className="p-3 font-semibold text-white">{c.name}</td>
                      <td className="p-3 text-center text-muted">{c.classes_completed}</td>
                      <td className="p-3 text-center text-muted">{c.assigned_students}</td>
                      <td className="p-3 text-center text-muted">{c.homework_completion_rate}%</td>
                      <td className="p-3 text-center font-bold text-accent">+{c.average_improvement} ELO</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        {[
          { label: 'Manage Leads', desc: 'CRM pipeline', href: '/dashboard/manager/leads', icon: TrendingUp, color: 'from-yellow-500/20 to-yellow-600/5 border-yellow-500/20 text-yellow-400' },
          { label: 'Schedule Class', desc: 'Book a session', href: '/dashboard/manager/sessions', icon: Calendar, color: 'from-primary/20 to-primary/5 border-primary/20 text-primary' },
          { label: 'Add User', desc: 'Student or coach', href: '/dashboard/manager/students', icon: UserPlus, color: 'from-secondary/20 to-secondary/5 border-secondary/20 text-secondary' },
          { label: 'Gallery', desc: 'Upload images', href: '/dashboard/manager/gallery', icon: Activity, color: 'from-accent/20 to-accent/5 border-accent/20 text-accent' },
        ].map(q => (
          <a key={q.href} href={q.href}
            className={`glass p-5 rounded-2xl border bg-gradient-to-br ${q.color} hover:scale-[1.02] transition-transform block`}>
            <q.icon className="w-5 h-5 mb-3" />
            <p className="font-bold text-white text-sm">{q.label}</p>
            <p className="text-[10px] text-muted mt-0.5">{q.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
