'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/utils/api';
import {
  Calendar, CheckCircle, Clock, BookOpen, TrendingUp, Award,
  Flame, FileSpreadsheet, User, Users, ClipboardList, Target, CheckSquare, Square, BarChart2
} from 'lucide-react';

interface StudentData {
  student_id: string; first_name: string; last_name: string;
  assigned_coach_name: string | null; lichess_username: string | null;
  lichess_rating: number; session_balance: number;
  total_xp: number; level: number;
  package_tracking?: any[];
  target_rating?: number;
  starting_rating?: number;
  learning_roadmap?: string[];
  goals?: string[];
  coach_recommendations?: string;
  strengths?: string[];
  weaknesses?: string[];
  weekly_goals?: { text: string; completed: boolean }[];
  monthly_goals?: { text: string; completed: boolean }[];
  roadmap?: Record<string, { status: string; topics: string[] }>;
  coach_notes?: string;
}

interface Session {
  id: string; title: string; class_type: string; status: string;
  scheduled_start: string;
  coach: { user: { first_name: string; last_name: string } };
  students: { student: { id: string }; attendance_status: string }[];
  recording_drive_link?: string;
  notes?: string;
  topics_covered?: string;
}

interface Assignment {
  id: string; status: string; due_date: string;
  homework: { title: string; description: string };
  student: { id: string };
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

export default function ParentDashboard() {
  const { user, profile } = useAuth();
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [homework, setHomework] = useState<Assignment[]>([]);
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [loading, setLoading] = useState(true);

  const students: StudentData[] = profile?.students || [];

  const loadData = useCallback(async () => {
    try {
      const [sess, hw] = await Promise.all([
        api.get('/academy/sessions/'),
        api.get('/homework/assignments/'),
      ]);
      setSessions(sess.data);
      setHomework(hw.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  const fetchReports = useCallback(async (studentId: string) => {
    if (!studentId) return;
    try {
      const res = await api.get(`/academy/monthly-reports/?student=${studentId}`);
      setReports(res.data);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].student_id);
    }
    loadData();
  }, [profile, loadData, students, selectedStudentId]);

  useEffect(() => {
    if (selectedStudentId) {
      fetchReports(selectedStudentId);
    }
  }, [selectedStudentId, fetchReports]);

  const activeStudent = students.find(s => s.student_id === selectedStudentId);

  // Filter sessions and homework for the selected student
  const studentSessions = sessions.filter(s =>
    s.students.some(st => st.student.id === selectedStudentId)
  );
  const studentHomework = homework.filter(h => h.student.id === selectedStudentId);

  const upcoming = studentSessions.filter(s => s.status === 'scheduled');
  const completed = studentSessions.filter(s => s.status === 'completed');

  const attendanceRate = completed.length > 0
    ? Math.round((completed.filter(s =>
        s.students.find(st => st.student.id === selectedStudentId)?.attendance_status === 'present'
      ).length / completed.length) * 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* Header & Child Selector */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Users className="text-primary w-5 h-5" /> Parent Portal
          </h2>
          <p className="text-xs text-muted mt-0.5">Monitor your children's learning progress and classes</p>
        </div>

        {students.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted font-semibold">Select Student:</span>
            <select
              value={selectedStudentId}
              onChange={e => setSelectedStudentId(e.target.value)}
              className="px-3 py-1.5 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-primary/50"
            >
              {students.map(s => (
                <option key={s.student_id} value={s.student_id}>
                  {s.first_name} {s.last_name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {!activeStudent ? (
        <div className="glass p-12 rounded-3xl border-border text-center text-muted text-sm space-y-2">
          <p>No students linked to your parent email ({user?.email}).</p>
          <p className="text-[10px]">Please ask the Academy Manager to set your email as the parent email on your child's profile.</p>
        </div>
      ) : (
        <>
          {/* Student Overview Header */}
          <div className="glass p-5 rounded-2xl border-border bg-gradient-to-r from-primary/10 to-secondary/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-[10px] text-primary font-bold uppercase tracking-wider">Active Student</p>
              <h3 className="text-lg font-extrabold text-white mt-0.5">{activeStudent.first_name} {activeStudent.last_name}</h3>
              <p className="text-xs text-muted mt-1">
                Coach: {activeStudent.assigned_coach_name || 'No coach assigned yet'}
                {activeStudent.lichess_username && ` · Lichess: ${activeStudent.lichess_username}`}
              </p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-secondary/15 border border-secondary/30 text-secondary text-xs rounded-xl font-bold">
                Level {activeStudent.level}
              </span>
              <span className="px-3 py-1 bg-primary/15 border border-primary/30 text-primary text-xs rounded-xl font-bold">
                {activeStudent.session_balance} Classes Left
              </span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Attendance Rate', value: `${attendanceRate}%`, icon: CheckCircle, color: 'text-green-400 bg-green-500/10' },
              { label: 'Lichess Rating', value: activeStudent.lichess_rating, icon: TrendingUp, color: 'text-accent bg-accent/10' },
              { label: 'Total XP Earned', value: activeStudent.total_xp, icon: Award, color: 'text-secondary bg-secondary/10' },
              { label: 'Homework Done', value: `${studentHomework.filter(h => h.status === 'completed').length} / ${studentHomework.length}`, icon: FileSpreadsheet, color: 'text-yellow-400 bg-yellow-500/10' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="glass p-5 rounded-2xl border-border flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1">{label}</p>
                  <p className="text-2xl font-extrabold text-white">{value}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${color}`}><Icon className="w-5 h-5" /></div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Upcoming + Attendance */}
            <div className="lg:col-span-2 space-y-5">
              {/* Upcoming Classes */}
              <div className="glass p-5 rounded-3xl border-border">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                  <Calendar className="text-primary w-4 h-4" /> Upcoming Classes
                </h3>
                {upcoming.length === 0 ? (
                  <div className="py-6 text-center text-muted text-xs border border-dashed border-border rounded-xl">
                    No upcoming classes scheduled.
                  </div>
                ) : upcoming.map(cls => (
                  <div key={cls.id} className="flex items-center justify-between p-3.5 bg-background/50 border border-border rounded-xl mb-2 gap-3 flex-wrap">
                    <div>
                      <p className="font-bold text-white text-xs">{cls.title}</p>
                      <p className="text-[10px] text-muted mt-0.5">
                        Coach: {cls.coach.user.first_name} {cls.coach.user.last_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-white font-bold">
                        {new Date(cls.scheduled_start).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary capitalize font-semibold mt-1 inline-block">
                        {cls.class_type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Attendance & Coach Notes */}
              <div className="glass p-5 rounded-3xl border-border">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                  <ClipboardList className="text-secondary w-4 h-4" /> Class Attendance & Coach Notes
                </h3>
                {completed.length === 0 ? (
                  <div className="py-6 text-center text-muted text-xs border border-dashed border-border rounded-xl">
                    No classes completed yet.
                  </div>
                ) : completed.map(cls => {
                  const studentStatus = cls.students.find(st => st.student.id === selectedStudentId)?.attendance_status || 'present';
                  return (
                    <div key={cls.id} className="p-3.5 bg-background/50 border border-border rounded-xl mb-2 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-white text-xs">{cls.title}</p>
                          <p className="text-[10px] text-muted">
                            {new Date(cls.scheduled_start).toLocaleDateString()} · Coach: {cls.coach.user.first_name} {cls.coach.user.last_name}
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold capitalize ${
                          studentStatus === 'present' ? 'bg-green-500/10 text-green-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>{studentStatus}</span>
                      </div>
                      
                      {studentStatus === 'present' && (
                        <div className="pt-2 border-t border-border/20 text-xs space-y-1 text-muted">
                          {cls.topics_covered && (
                            <p><strong className="text-[10px] text-white">Topics Covered:</strong> {cls.topics_covered}</p>
                          )}
                          {cls.notes && (
                            <p className="italic"><strong className="text-[10px] text-white">Coach Notes:</strong> "{cls.notes}"</p>
                          )}
                          {cls.recording_drive_link && (
                            <div className="pt-2 flex justify-between items-center border-t border-border/10 mt-1">
                              <span className="text-[9px] text-muted font-semibold">Recording Ready</span>
                              <a href={cls.recording_drive_link} target="_blank" rel="noreferrer"
                                className="px-2 py-0.5 bg-primary/20 text-primary border border-primary/30 rounded text-[9px] font-bold hover:bg-primary/35 transition">
                                Watch Recording
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                  );
                })}
              </div>

              {/* Performance Trend Engine */}
              {reports.length > 0 && (
                <div className="glass p-5 rounded-3xl border-border space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-border/60 pb-3">
                    <TrendingUp className="text-primary w-4 h-4" /> Child Performance Trend Insights
                  </h3>
                  
                  {(() => {
                    const sortedReports = [...reports].sort((a, b) => b.report_month.localeCompare(a.report_month));
                    const current = sortedReports[0];
                    const previous = sortedReports[1];

                    if (!current) return null;

                    if (!previous) {
                      return (
                        <div className="p-3 bg-background/50 border border-border rounded-xl text-xs text-muted space-y-1">
                          <p className="font-bold text-white">Baseline established for {current.report_month}!</p>
                          <p className="leading-relaxed">Comparative trend analytics (e.g., month-over-month improvements) will activate as soon as the next monthly report is published.</p>
                        </div>
                      );
                    }

                    const attDiff = current.attendance_rate - previous.attendance_rate;
                    const hwDiff = current.homework_rate - previous.homework_rate;
                    const growthDiff = current.rating_growth - previous.rating_growth;
                    const puzDiff = current.puzzle_accuracy - previous.puzzle_accuracy;

                    return (
                      <div className="space-y-3.5 text-xs">
                        <p className="text-[10px] text-muted font-bold uppercase tracking-wider">
                          Comparing {current.report_month} stats vs {previous.report_month}
                        </p>
                        
                        <div className="grid sm:grid-cols-2 gap-3">
                          {/* Attendance trend */}
                          <div className="p-3.5 bg-background/40 border border-border rounded-2xl space-y-1.5">
                            <span className="text-[9px] text-muted font-bold uppercase tracking-wider block">Attendance</span>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-lg font-black text-white">{current.attendance_rate}%</span>
                              <span className={`text-[10px] font-bold ${attDiff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {attDiff >= 0 ? `▲ +${attDiff}%` : `▼ ${attDiff}%`}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted leading-tight">
                              {attDiff > 0 ? 'Attendance rate improved from last month.' : 
                               attDiff < 0 ? 'Attendance rate dropped slightly this month.' : 'Attendance remained stable.'}
                            </p>
                          </div>

                          {/* Homework trend */}
                          <div className="p-3.5 bg-background/40 border border-border rounded-2xl space-y-1.5">
                            <span className="text-[9px] text-muted font-bold uppercase tracking-wider block">Homework Rate</span>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-lg font-black text-white">{current.homework_rate}%</span>
                              <span className={`text-[10px] font-bold ${hwDiff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {hwDiff >= 0 ? `▲ +${hwDiff}%` : `▼ ${hwDiff}%`}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted leading-tight">
                              {hwDiff > 0 ? 'Homework submission has increased!' : 
                               hwDiff < 0 ? 'Homework submission declined this month.' : 'Homework rate remained steady.'}
                            </p>
                          </div>

                          {/* Rating Growth trend */}
                          <div className="p-3.5 bg-background/40 border border-border rounded-2xl space-y-1.5">
                            <span className="text-[9px] text-muted font-bold uppercase tracking-wider block">Monthly ELO Growth</span>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-lg font-black text-white">+{current.rating_growth} ELO</span>
                              <span className={`text-[10px] font-bold ${growthDiff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {growthDiff >= 0 ? `▲ +${growthDiff}` : `▼ ${growthDiff}`}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted leading-tight">
                              {growthDiff > 0 ? 'Rating gain was faster than last month!' : 
                               growthDiff < 0 ? 'Rating progress slowed down slightly.' : 'Consistent rating progress.'}
                            </p>
                          </div>

                          {/* Puzzle Accuracy trend */}
                          <div className="p-3.5 bg-background/40 border border-border rounded-2xl space-y-1.5">
                            <span className="text-[9px] text-muted font-bold uppercase tracking-wider block">Tactical Accuracy</span>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-lg font-black text-white">{current.puzzle_accuracy}%</span>
                              <span className={`text-[10px] font-bold ${puzDiff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {puzDiff >= 0 ? `▲ +${puzDiff}%` : `▼ ${puzDiff}%`}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted leading-tight">
                              {puzDiff > 0 ? 'Tactical calculation accuracy went up!' : 
                               puzDiff < 0 ? 'Calculated puzzle accuracy dropped.' : 'Calculation accuracy was stable.'}
                            </p>
                          </div>
                        </div>

                        {/* Summary sentence */}
                        <div className="p-3 bg-secondary/5 border border-secondary/15 rounded-xl text-[10.5px] leading-relaxed text-muted mt-2 text-left">
                          💡 <strong className="text-white">Trend Summary:</strong> {activeStudent.first_name}'s average metrics are{' '}
                          {attDiff + hwDiff + growthDiff + puzDiff > 0 ? (
                            <span className="text-green-400 font-bold">trending upward!</span>
                          ) : (
                            <span className="text-amber-400 font-bold">holding steady.</span>
                          )}{' '}
                          Active focus on {attDiff < 0 ? 'class attendance' : hwDiff < 0 ? 'completing homework assignments' : puzDiff < 0 ? 'solving puzzles slower and more accurately' : 'continuing current training'} is advised.
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>


            {/* Right: Homework & Progress Reports */}
            <div className="space-y-5">
              {/* Homework Tracker */}
              <div className="glass p-5 rounded-3xl border-border">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                  <FileSpreadsheet className="text-accent w-4 h-4" /> Homework Tracker
                </h3>
                {studentHomework.length === 0 ? (
                  <div className="py-6 text-center text-muted text-xs border border-dashed border-border rounded-xl">
                    No homework assigned yet.
                  </div>
                ) : studentHomework.map(hw => (
                  <div key={hw.id} className="p-3 bg-background/50 border border-border rounded-xl mb-2 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white text-xs">{hw.homework.title}</p>
                      <p className="text-[9px] text-muted mt-0.5">Due: {new Date(hw.due_date).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold capitalize ${
                      hw.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                      hw.status === 'submitted' ? 'bg-secondary/10 text-secondary' :
                      'bg-yellow-500/10 text-yellow-400'
                    }`}>{hw.status}</span>
                  </div>
                ))}
              </div>

              {/* Progress Report */}
              <div className="glass p-5 rounded-3xl border-border space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                  <Target className="text-primary w-4 h-4" /> Targets & Progression
                </h3>
                <div className="space-y-4 text-xs text-muted">
                  {/* Level Progression */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span>Level Progression</span>
                      <span className="text-white font-bold">{((activeStudent.total_xp % 1000) / 10)}%</span>
                    </div>
                    <div className="w-full bg-background rounded-full h-2 overflow-hidden border border-border/50">
                      <div
                        className="h-2 bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-300"
                        style={{ width: `${(activeStudent.total_xp % 1000) / 10}%` }}
                      />
                    </div>
                  </div>

                  {/* Target Rating Progression */}
                  <div className="space-y-1.5 pt-2 border-t border-border/20">
                    <div className="flex justify-between items-center text-[11px]">
                      <span>Target ELO Progression</span>
                      <span className="text-white font-black">{activeStudent.lichess_rating ?? 1500} / {activeStudent.target_rating ?? 1750} ELO</span>
                    </div>
                    <div className="w-full bg-background rounded-full h-2 overflow-hidden border border-border/50">
                      <div 
                        className="bg-gradient-to-r from-primary via-accent to-secondary h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min(Math.max(
                            (((activeStudent.lichess_rating ?? 1500) - (activeStudent.starting_rating ?? 1200)) / 
                            (Math.max((activeStudent.target_rating ?? 1750) - (activeStudent.starting_rating ?? 1200), 100))) * 100, 
                            10
                          ), 100)}%` 
                        }} 
                      />
                    </div>
                    <div className="flex justify-between text-[8px] text-muted font-bold uppercase tracking-wider">
                      <span>Start: {activeStudent.starting_rating ?? 1200}</span>
                      <span>Current: {activeStudent.lichess_rating ?? 1500}</span>
                      <span>Target: {activeStudent.target_rating ?? 1750}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Class Package Status */}
              <div className="glass p-5 rounded-3xl border-border">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                  <Clock className="text-primary w-4 h-4" /> Class Packages
                </h3>
                {(!activeStudent.package_tracking || activeStudent.package_tracking.length === 0) ? (
                  <div className="p-3 bg-background/50 border border-border rounded-xl text-center text-xs text-muted">
                    No active packages found.
                  </div>
                ) : (
                  activeStudent.package_tracking.map((pkg: any) => (
                    <div key={pkg.id} className="p-3 bg-background/50 border border-border rounded-xl space-y-2 mb-2 text-xs">
                      <div className="flex justify-between items-center font-bold">
                        <span className="text-white">{pkg.plan_name}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] uppercase ${
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

              {/* Curriculum Roadmap */}
              <div className="glass p-5 rounded-3xl border-border space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                  <Award className="text-accent w-4 h-4" /> Curriculum Roadmap
                </h3>
                
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {activeStudent.roadmap && Object.entries(activeStudent.roadmap).map(([cat, details]: [string, any]) => {
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
                      <div key={cat} className="p-2 bg-background/40 border border-border/50 rounded-xl flex justify-between items-start gap-2 text-xs">
                        <div className="space-y-0.5">
                          <p className="font-bold text-white text-[11px]">{cat}</p>
                          {details.topics?.length > 0 ? (
                            <p className="text-[10px] text-muted leading-tight">
                              {details.topics.join(', ')}
                            </p>
                          ) : (
                            <p className="text-[9px] text-muted/50 italic leading-none">No topics</p>
                          )}
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase shrink-0 border ${statusColors[details.status as 'completed' | 'in_progress' | 'not_started'] || statusColors.not_started}`}>
                          {statusLabel[details.status as 'completed' | 'in_progress' | 'not_started'] || 'Not Started'}
                        </span>
                      </div>
                    );
                  })}
                  {(!activeStudent.roadmap || Object.keys(activeStudent.roadmap).length === 0) && (
                    <p className="text-xs text-muted italic">Roadmap not yet set by coach.</p>
                  )}
                </div>
              </div>

              {/* Goals checklist */}
              <div className="glass p-5 rounded-3xl border-border space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                  <ClipboardList className="text-secondary w-4 h-4" /> Active Goals
                </h3>

                <div className="space-y-3 text-xs">
                  {/* Weekly */}
                  <div className="space-y-1.5">
                    <p className="text-[9px] text-muted font-bold uppercase tracking-wider">Weekly Goals</p>
                    <div className="space-y-1">
                      {activeStudent.weekly_goals?.map((goal: any, idx: number) => (
                        <div key={idx} className="flex gap-2 items-center">
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
                      {(!activeStudent.weekly_goals || activeStudent.weekly_goals.length === 0) && (
                        <p className="text-[10px] text-muted italic">No weekly goals active.</p>
                      )}
                    </div>
                  </div>

                  {/* Monthly */}
                  <div className="space-y-1.5 border-t border-border/20 pt-2.5">
                    <p className="text-[9px] text-muted font-bold uppercase tracking-wider">Monthly Goals</p>
                    <div className="space-y-1">
                      {activeStudent.monthly_goals?.map((goal: any, idx: number) => (
                        <div key={idx} className="flex gap-2 items-center">
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
                      {(!activeStudent.monthly_goals || activeStudent.monthly_goals.length === 0) && (
                        <p className="text-[10px] text-muted italic">No monthly goals active.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="glass p-5 rounded-3xl border-border space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                  <User className="text-primary w-4 h-4" /> Skills & Recommendations
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 bg-primary/5 border border-primary/10 rounded-xl space-y-1">
                    <p className="text-[8px] text-primary font-bold uppercase tracking-wider">Strengths</p>
                    <div className="flex flex-wrap gap-1">
                      {activeStudent.strengths?.map((str: string) => (
                        <span key={str} className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">{str}</span>
                      ))}
                      {(!activeStudent.strengths || activeStudent.strengths.length === 0) && (
                        <span className="text-[9px] text-muted italic">Not set</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-2.5 bg-accent/5 border border-accent/10 rounded-xl space-y-1">
                    <p className="text-[8px] text-accent font-bold uppercase tracking-wider">Weaknesses</p>
                    <div className="flex flex-wrap gap-1">
                      {activeStudent.weaknesses?.map((wk: string) => (
                        <span key={wk} className="text-[9px] bg-accent/10 text-accent px-1.5 py-0.5 rounded">{wk}</span>
                      ))}
                      {(!activeStudent.weaknesses || activeStudent.weaknesses.length === 0) && (
                        <span className="text-[9px] text-muted italic">Not set</span>
                      )}
                    </div>
                  </div>
                </div>

                {activeStudent.coach_notes && (
                  <div className="p-3 bg-secondary/10 border border-secondary/20 rounded-2xl text-[11px] text-muted mt-2">
                    <p className="font-bold text-white mb-1">💡 Coach Recommendation</p>
                    <p className="leading-relaxed font-sans">"{activeStudent.coach_notes}"</p>
                  </div>
                )}
              </div>

              {/* Published Monthly Reports Feed */}
              <div className="glass p-5 rounded-3xl border-border space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-border/60 pb-3">
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
                          <p className="font-black text-white text-sm">+{report.rating_growth}</p>
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
                    <p className="text-xs text-muted text-center py-6">Monthly developmental reports will appear here once published by the coach.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

