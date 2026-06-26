'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { api } from '@/utils/api';
import {
  Users, TrendingUp, RefreshCw, Edit, Target, Award,
  BookOpen, FileText, CheckCircle2, XCircle, Plus, Trash2,
  Calendar, CheckSquare, Square, X, BarChart2, Star, AlertTriangle, Clock
} from 'lucide-react';

interface PerformanceProfile {
  id: string;
  blunders_avg: number;
  mistakes_avg: number;
  inaccuracies_avg: number;
  acpl: number;
  opening_perf_rating: number;
  middlegame_perf_rating: number;
  endgame_perf_rating: number;
  puzzle_accuracy: number;
  puzzle_rating: number;
  solve_speed_seconds: number;
  strongest_theme: string;
  weakest_theme: string;
  improvement_trend: { date: string; rating: number }[];
  fork_weakness: number;
  pin_weakness: number;
  skewer_weakness: number;
  king_safety_issues: number;
  calculation_issues: number;
  endgame_issues: number;
  risk_level: 'low' | 'medium' | 'high';
  risk_alerts: string[];
  recommendations: { type: string; category: string; message: string }[];
  updated_at: string;
}

interface Student {
  id: string;
  session_balance: number;
  lichess_rating: number;
  total_xp: number;
  level: number;
  user: { first_name: string; last_name: string; email: string };
  starting_rating: number;
  target_rating: number;
  strengths: string[];
  weaknesses: string[];
  coach_notes: string;
  weekly_goals: { text: string; completed: boolean }[];
  monthly_goals: { text: string; completed: boolean }[];
  target_attendance_rate: number;
  target_homework_rate: number;
  roadmap: Record<string, { status: 'not_started' | 'in_progress' | 'completed'; topics: string[] }>;
  performance_profile?: PerformanceProfile;
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

export default function CoachStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Selected student details & modal state
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'roadmap' | 'reports' | 'intel'>('profile');

  // Input states for goals
  const [newWeeklyGoal, setNewWeeklyGoal] = useState('');
  const [newMonthlyGoal, setNewMonthlyGoal] = useState('');

  // Strengths / Weaknesses input tags
  const [newStrengthTag, setNewStrengthTag] = useState('');
  const [newWeaknessTag, setNewWeaknessTag] = useState('');

  // Monthly Report states
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [reportMonth, setReportMonth] = useState('2026-06');
  const [previewReport, setPreviewReport] = useState<Partial<MonthlyReport> | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const r = await api.get('/academy/students/');
      setStudents(r.data);
    } catch {
      setErrorMsg('Failed to load students.');
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const syncLichess = async (id: string, name: string) => {
    setSyncing(id);
    try {
      const res = await api.post(`/academy/students/${id}/sync_lichess/`);
      const rewards = res.data.xp_rewards || [];
      if (rewards.length > 0) {
        setMsg(`Lichess data synced for ${name}! Rewards: ${rewards.join(' | ')}`);
      } else {
        setMsg(`Lichess data synced for ${name}.`);
      }
      loadData();
    } catch {
      setErrorMsg('Sync failed — no Lichess username set.');
    } finally {
      setSyncing(null);
      setTimeout(() => { setMsg(''); setErrorMsg(''); }, 8000);
    }
  };

  const syncPerformance = async () => {
    if (!activeStudent) return;
    setAnalyzing(true);
    try {
      const res = await api.post(`/academy/students/${activeStudent.id}/sync_performance/`);
      setActiveStudent(res.data);
      setMsg('Performance metrics analyzed and updated successfully!');
      loadData();
    } catch {
      setErrorMsg('Failed to run performance intelligence engine.');
    } finally {
      setAnalyzing(false);
      setTimeout(() => { setMsg(''); setErrorMsg(''); }, 5000);
    }
  };


  // Open Manage Modal
  const openManageModal = async (student: Student) => {
    try {
      const response = await api.get(`/academy/students/${student.id}/`);
      const fullStudent = response.data;
      setActiveStudent(fullStudent);
      setModalOpen(true);
      setActiveTab('profile');
      setPreviewReport(null);
      fetchReports(student.id);
    } catch (err) {
      setErrorMsg('Failed to fetch student details.');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Fetch past monthly reports
  const fetchReports = async (studentId: string) => {
    try {
      const res = await api.get(`/academy/monthly-reports/?student=${studentId}`);
      setReports(res.data);
    } catch {
      // silent fail
    }
  };

  // Save Student Profile / Goals / Roadmap changes
  const saveStudentChanges = async (updatedStudent: Student) => {
    try {
      const response = await api.patch(`/academy/students/${updatedStudent.id}/`, updatedStudent);
      setActiveStudent(response.data);
      setMsg('Changes saved successfully!');
      loadData();
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setErrorMsg('Failed to update student profile.');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  // Toggle goal completion state
  const toggleGoal = (type: 'weekly' | 'monthly', idx: number) => {
    if (!activeStudent) return;
    const goalsField = type === 'weekly' ? 'weekly_goals' : 'monthly_goals';
    const goalsCopy = [...(activeStudent[goalsField] || [])];
    goalsCopy[idx] = { ...goalsCopy[idx], completed: !goalsCopy[idx].completed };
    
    saveStudentChanges({
      ...activeStudent,
      [goalsField]: goalsCopy
    });
  };

  // Add Goal
  const addGoal = (type: 'weekly' | 'monthly') => {
    if (!activeStudent) return;
    const isWeekly = type === 'weekly';
    const textVal = isWeekly ? newWeeklyGoal.trim() : newMonthlyGoal.trim();
    if (!textVal) return;

    const goalsField = isWeekly ? 'weekly_goals' : 'monthly_goals';
    const goalsCopy = [...(activeStudent[goalsField] || [])];
    goalsCopy.push({ text: textVal, completed: false });

    saveStudentChanges({
      ...activeStudent,
      [goalsField]: goalsCopy
    });

    if (isWeekly) setNewWeeklyGoal('');
    else setNewMonthlyGoal('');
  };

  // Delete Goal
  const deleteGoal = (type: 'weekly' | 'monthly', idx: number) => {
    if (!activeStudent) return;
    const goalsField = type === 'weekly' ? 'weekly_goals' : 'monthly_goals';
    const goalsCopy = (activeStudent[goalsField] || []).filter((_, i) => i !== idx);

    saveStudentChanges({
      ...activeStudent,
      [goalsField]: goalsCopy
    });
  };

  // Add Tag (Strength / Weakness)
  const addTag = (type: 'strengths' | 'weaknesses') => {
    if (!activeStudent) return;
    const isStrength = type === 'strengths';
    const textVal = isStrength ? newStrengthTag.trim() : newWeaknessTag.trim();
    if (!textVal) return;

    const tagsCopy = [...(activeStudent[type] || [])];
    if (!tagsCopy.includes(textVal)) {
      tagsCopy.push(textVal);
    }

    saveStudentChanges({
      ...activeStudent,
      [type]: tagsCopy
    });

    if (isStrength) setNewStrengthTag('');
    else setNewWeaknessTag('');
  };

  // Remove Tag
  const removeTag = (type: 'strengths' | 'weaknesses', tag: string) => {
    if (!activeStudent) return;
    const tagsCopy = (activeStudent[type] || []).filter(t => t !== tag);

    saveStudentChanges({
      ...activeStudent,
      [type]: tagsCopy
    });
  };

  // Update Roadmap Category Status or Topics
  const updateRoadmap = (category: string, field: 'status' | 'topics', val: any) => {
    if (!activeStudent) return;
    const roadmapCopy = { ...activeStudent.roadmap };
    if (!roadmapCopy[category]) {
      roadmapCopy[category] = { status: 'not_started', topics: [] };
    }

    if (field === 'status') {
      roadmapCopy[category].status = val;
    } else if (field === 'topics') {
      // Parse comma-separated list into array
      const topicsList = val.split(',').map((t: string) => t.trim()).filter(Boolean);
      roadmapCopy[category].topics = topicsList;
    }

    saveStudentChanges({
      ...activeStudent,
      roadmap: roadmapCopy
    });
  };

  // Generate Monthly Report Preview
  const handleGeneratePreview = async () => {
    if (!activeStudent) return;
    setLoadingPreview(true);
    setPreviewReport(null);
    try {
      const res = await api.get(`/academy/students/${activeStudent.id}/preview_report_metrics/${reportMonth}/`);
      setPreviewReport(res.data);
    } catch {
      setErrorMsg('Could not preview metrics. Please verify class sessions exist for this month.');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setLoadingPreview(false);
    }
  };

  // Save Generated Report to Database
  const handlePublishReport = async () => {
    if (!activeStudent || !previewReport) return;
    try {
      await api.post('/academy/monthly-reports/', {
        student: activeStudent.id,
        report_month: reportMonth,
        attendance_rate: previewReport.attendance_rate,
        homework_rate: previewReport.homework_rate,
        rating_growth: previewReport.rating_growth,
        puzzle_accuracy: previewReport.puzzle_accuracy,
        strengths: previewReport.strengths || [],
        weaknesses: previewReport.weaknesses || [],
        coach_feedback: previewReport.coach_feedback || '',
        next_month_goals: previewReport.next_month_goals || []
      });
      setMsg('Report successfully published for parent visibility!');
      setPreviewReport(null);
      fetchReports(activeStudent.id);
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setErrorMsg('Failed to publish report. Report might already exist for this month.');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Users className="text-primary w-6 h-6" /> Student Development Center
          </h2>
          <p className="text-xs text-muted mt-0.5">Define student target rating goals, track attendance/homework targets, customize roadmaps, and generate monthly reports.</p>
        </div>
      </div>

      {msg && (
        <div className="p-3.5 bg-green-500/10 border border-green-500/30 text-green-400 text-xs rounded-xl font-semibold animate-fade-in flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {msg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl font-semibold animate-fade-in flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0" /> {errorMsg}
        </div>
      )}

      {/* Student List Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {students.map(s => (
          <div key={s.id} className="glass p-5 rounded-3xl border-border space-y-4 hover:-translate-y-0.5 transition duration-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-extrabold text-white text-base leading-tight">{s.user.first_name} {s.user.last_name}</p>
                <p className="text-[10px] text-muted">{s.user.email}</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold bg-secondary/15 border border-secondary/30 text-secondary uppercase tracking-wide">
                Level {s.level}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Rating', val: s.lichess_rating },
                { label: 'Target Rating', val: s.target_rating || (s.lichess_rating + 200) },
                { label: 'Session Bal', val: `${s.session_balance} Left` }
              ].map((item, idx) => (
                <div key={idx} className="bg-background/40 border border-border/55 rounded-xl p-2.5">
                  <p className="text-sm font-black text-white">{item.val}</p>
                  <p className="text-[8px] text-muted font-bold uppercase tracking-wider mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>

            {/* Development mini info */}
            <div className="bg-background/25 border border-border/30 rounded-2xl p-3 text-xs space-y-2 text-left">
              <div className="flex justify-between text-[10px]">
                <span className="text-muted">Weekly Goals:</span>
                <span className="font-bold text-white">
                  {(s.weekly_goals || []).filter(g => g.completed).length} / {(s.weekly_goals || []).length} done
                </span>
              </div>
              <div className="w-full bg-background rounded-full h-1.5 overflow-hidden">
                <div 
                  className="h-1.5 bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                  style={{ 
                    width: `${s.weekly_goals?.length ? ((s.weekly_goals.filter(g => g.completed).length / s.weekly_goals.length) * 100) : 0}%` 
                  }} 
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button 
                onClick={() => openManageModal(s)}
                className="flex-1 px-3 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/95 transition flex items-center justify-center gap-1.5 shadow-lg shadow-primary/10"
              >
                <Edit className="w-3.5 h-3.5" /> Manage Student
              </button>
              <button 
                onClick={() => syncLichess(s.id, s.user.first_name)}
                disabled={syncing === s.id}
                className="px-3 py-2 bg-background/50 border border-border/60 text-muted rounded-xl text-xs font-bold hover:text-white transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing === s.id ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        ))}

        {students.length === 0 && (
          <div className="col-span-3 glass p-16 rounded-3xl text-center border-border text-muted text-sm">
            No students assigned to your roster yet.
          </div>
        )}
      </div>

      {/* Interactive Management Modal / Sidebar Overlay */}
      {modalOpen && activeStudent && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in text-left">
          <div className="glass max-w-4xl w-full rounded-3xl border-border overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-border/60 flex justify-between items-center flex-wrap gap-3">
              <div>
                <span className="text-[9px] bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                  DEVELOPMENT PORTAL
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  Managing: {activeStudent.user.first_name} {activeStudent.user.last_name}
                </h3>
              </div>
              <button 
                onClick={() => setModalOpen(false)}
                className="p-1.5 bg-background/40 hover:bg-background/80 border border-border/60 text-muted hover:text-white rounded-xl transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-border/40 px-6 gap-2">
              {[
                { id: 'profile', label: 'Profile & Goal Tracking', icon: Target },
                { id: 'roadmap', label: 'Curriculum Roadmap', icon: BookOpen },
                { id: 'intel', label: 'Performance Intelligence', icon: BarChart2 },
                { id: 'reports', label: 'Monthly Report Generator', icon: FileText }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 -mb-[1px] ${
                    activeTab === tab.id 
                      ? 'border-primary text-primary font-black' 
                      : 'border-transparent text-muted hover:text-foreground'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* Tab 1: Profile & Goals */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  {/* Rating parameters */}
                  <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-[10px] text-muted font-bold uppercase tracking-wider block mb-1">Starting Rating (ELO)</label>
                      <input 
                        type="number" 
                        value={activeStudent.starting_rating}
                        onChange={e => saveStudentChanges({ ...activeStudent, starting_rating: parseInt(e.target.value) || 0 })}
                        className="w-full px-3.5 py-2 bg-background/60 border border-border/70 rounded-xl text-xs text-white focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted font-bold uppercase tracking-wider block mb-1">Current Rating (ELO)</label>
                      <input 
                        type="number" 
                        disabled
                        value={activeStudent.lichess_rating}
                        className="w-full px-3.5 py-2 bg-background/30 border border-border/40 rounded-xl text-xs text-muted focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted font-bold uppercase tracking-wider block mb-1">Target Rating (ELO)</label>
                      <input 
                        type="number" 
                        value={activeStudent.target_rating}
                        onChange={e => saveStudentChanges({ ...activeStudent, target_rating: parseInt(e.target.value) || 0 })}
                        className="w-full px-3.5 py-2 bg-background/60 border border-border/70 rounded-xl text-xs text-white focus:outline-none focus:border-primary/50"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted font-bold uppercase tracking-wider block mb-1">Target Attendance (%)</label>
                      <input 
                        type="number" 
                        value={activeStudent.target_attendance_rate}
                        onChange={e => saveStudentChanges({ ...activeStudent, target_attendance_rate: parseInt(e.target.value) || 0 })}
                        className="w-full px-3.5 py-2 bg-background/60 border border-border/70 rounded-xl text-xs text-white focus:outline-none focus:border-primary/50"
                      />
                    </div>
                  </div>

                  {/* Strengths & Weaknesses tags builder */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Strengths */}
                    <div className="glass p-4 rounded-2xl border-border space-y-3">
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Star className="text-primary w-4 h-4" /> Student Strengths
                      </p>
                      
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="e.g. Endgames, Tactics"
                          value={newStrengthTag}
                          onChange={e => setNewStrengthTag(e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-background border border-border/70 rounded-xl text-xs text-white"
                        />
                        <button 
                          onClick={() => addTag('strengths')}
                          className="px-3 bg-primary text-white rounded-xl text-xs font-bold"
                        >
                          Add
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(activeStudent.strengths || []).map(tag => (
                          <span key={tag} className="flex items-center gap-1 text-[10px] bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded-lg">
                            {tag}
                            <button onClick={() => removeTag('strengths', tag)} className="text-primary/70 hover:text-white font-bold ml-0.5">×</button>
                          </span>
                        ))}
                        {(activeStudent.strengths || []).length === 0 && (
                          <span className="text-[10px] text-muted italic">No strengths defined.</span>
                        )}
                      </div>
                    </div>

                    {/* Weaknesses */}
                    <div className="glass p-4 rounded-2xl border-border space-y-3">
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Star className="text-accent w-4 h-4" /> Student Weaknesses
                      </p>
                      
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="e.g. Calculation, Openings"
                          value={newWeaknessTag}
                          onChange={e => setNewWeaknessTag(e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-background border border-border/70 rounded-xl text-xs text-white"
                        />
                        <button 
                          onClick={() => addTag('weaknesses')}
                          className="px-3 bg-accent text-white rounded-xl text-xs font-bold"
                        >
                          Add
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(activeStudent.weaknesses || []).map(tag => (
                          <span key={tag} className="flex items-center gap-1 text-[10px] bg-accent/10 border border-accent/20 text-accent px-2 py-0.5 rounded-lg">
                            {tag}
                            <button onClick={() => removeTag('weaknesses', tag)} className="text-accent/70 hover:text-white font-bold ml-0.5">×</button>
                          </span>
                        ))}
                        {(activeStudent.weaknesses || []).length === 0 && (
                          <span className="text-[10px] text-muted italic">No weaknesses defined.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Goal Tracking Section */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Weekly Goals list */}
                    <div className="glass p-4 rounded-2xl border-border space-y-3">
                      <h4 className="text-xs font-bold text-white border-b border-border/60 pb-2">Weekly Goal Checklist</h4>
                      
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {(activeStudent.weekly_goals || []).map((goal, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-background/50 border border-border/40 rounded-xl">
                            <button 
                              onClick={() => toggleGoal('weekly', idx)}
                              className="flex items-center gap-2 text-xs text-left"
                            >
                              {goal.completed ? (
                                <CheckSquare className="w-4 h-4 text-green-400 shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-muted shrink-0" />
                              )}
                              <span className={goal.completed ? 'line-through text-muted' : 'text-white'}>
                                {goal.text}
                              </span>
                            </button>
                            <button 
                              onClick={() => deleteGoal('weekly', idx)}
                              className="text-red-400 hover:text-red-300 p-1 rounded-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        {(activeStudent.weekly_goals || []).length === 0 && (
                          <p className="text-[10px] text-muted text-center py-4 italic">No weekly goals set.</p>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-border/30">
                        <input 
                          type="text" 
                          placeholder="Add new weekly goal..."
                          value={newWeeklyGoal}
                          onChange={e => setNewWeeklyGoal(e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-background border border-border rounded-xl text-xs text-white"
                        />
                        <button 
                          onClick={() => addGoal('weekly')}
                          className="px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-bold flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Add
                        </button>
                      </div>
                    </div>

                    {/* Monthly Goals list */}
                    <div className="glass p-4 rounded-2xl border-border space-y-3">
                      <h4 className="text-xs font-bold text-white border-b border-border/60 pb-2">Monthly Goal Checklist</h4>
                      
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {(activeStudent.monthly_goals || []).map((goal, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-background/50 border border-border/40 rounded-xl">
                            <button 
                              onClick={() => toggleGoal('monthly', idx)}
                              className="flex items-center gap-2 text-xs text-left"
                            >
                              {goal.completed ? (
                                <CheckSquare className="w-4 h-4 text-green-400 shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-muted shrink-0" />
                              )}
                              <span className={goal.completed ? 'line-through text-muted' : 'text-white'}>
                                {goal.text}
                              </span>
                            </button>
                            <button 
                              onClick={() => deleteGoal('monthly', idx)}
                              className="text-red-400 hover:text-red-300 p-1 rounded-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        {(activeStudent.monthly_goals || []).length === 0 && (
                          <p className="text-[10px] text-muted text-center py-4 italic">No monthly goals set.</p>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-border/30">
                        <input 
                          type="text" 
                          placeholder="Add new monthly goal..."
                          value={newMonthlyGoal}
                          onChange={e => setNewMonthlyGoal(e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-background border border-border rounded-xl text-xs text-white"
                        />
                        <button 
                          onClick={() => addGoal('monthly')}
                          className="px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-bold flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Add
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Coach Notes */}
                  <div>
                    <label className="text-[10px] text-muted font-bold uppercase tracking-wider block mb-1">General Coach Notes / Feedback</label>
                    <textarea 
                      rows={3}
                      value={activeStudent.coach_notes || ''}
                      onChange={e => saveStudentChanges({ ...activeStudent, coach_notes: e.target.value })}
                      placeholder="Write core notes about student progression here..."
                      className="w-full px-3.5 py-2.5 bg-background/60 border border-border/70 rounded-2xl text-xs text-white focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Curriculum Roadmap Builder */}
              {activeTab === 'roadmap' && (
                <div className="space-y-4">
                  <div className="bg-primary/5 border border-primary/10 p-3 rounded-xl mb-2">
                    <p className="text-[10px] text-primary font-bold uppercase">Curriculum Roadmap Engine</p>
                    <p className="text-[10px] text-muted mt-0.5">Toggle statuses (Not Started, In Progress, Completed) and type in comma-separated subtopics to customize the roadmap layout.</p>
                  </div>

                  {[
                    'Tactics', 'Opening', 'Middlegame', 'Endgame',
                    'Calculation', 'Strategy', 'Visualization'
                  ].map(cat => {
                    const catData = activeStudent.roadmap?.[cat] || { status: 'not_started', topics: [] };
                    return (
                      <div key={cat} className="glass p-4 rounded-2xl border-border grid sm:grid-cols-12 gap-4 items-center">
                        <div className="sm:col-span-3">
                          <p className="font-extrabold text-white text-xs leading-none">{cat}</p>
                        </div>
                        
                        <div className="sm:col-span-3">
                          <select 
                            value={catData.status}
                            onChange={e => updateRoadmap(cat, 'status', e.target.value)}
                            className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs text-white"
                          >
                            <option value="not_started">Not Started</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>

                        <div className="sm:col-span-6">
                          <input 
                            type="text" 
                            placeholder="Topics covered (comma separated)..."
                            value={catData.topics?.join(', ') || ''}
                            onChange={e => updateRoadmap(cat, 'topics', e.target.value)}
                            className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs text-white"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tab 3: Monthly Report Generator */}
              {activeTab === 'reports' && (
                <div className="space-y-6">
                  {/* Select month & generate preview */}
                  <div className="glass p-5 rounded-2xl border-border flex items-end gap-4 flex-wrap">
                    <div className="w-48">
                      <label className="text-[10px] text-muted font-bold uppercase tracking-wider block mb-1">Select Report Month</label>
                      <input 
                        type="month" 
                        value={reportMonth}
                        onChange={e => setReportMonth(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-white"
                      />
                    </div>
                    
                    <button 
                      onClick={handleGeneratePreview}
                      disabled={loadingPreview}
                      className="px-5 py-2 bg-secondary text-white rounded-xl text-xs font-bold hover:bg-secondary/90 transition flex items-center gap-1 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingPreview ? 'animate-spin' : ''}`} />
                      {loadingPreview ? 'Fetching Data...' : 'Auto-Generate Metrics'}
                    </button>
                  </div>

                  {/* Preview generated report details */}
                  {previewReport && (
                    <div className="glass p-5 rounded-2xl border-secondary/30 bg-secondary/5 space-y-4 animate-fade-in">
                      <div className="flex justify-between items-center border-b border-border/40 pb-2">
                        <h4 className="font-extrabold text-white text-xs">Preview Monthly Report ({reportMonth})</h4>
                        <span className="text-[9px] bg-secondary/20 text-secondary border border-secondary/30 px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                          DRAFT METRICS
                        </span>
                      </div>

                      {/* Generated Stats Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                        {[
                          { label: 'Attendance Rate', val: `${previewReport.attendance_rate}%` },
                          { label: 'Homework Complete', val: `${previewReport.homework_rate}%` },
                          { label: 'ELO Growth', val: `${previewReport.rating_growth > 0 ? '+' : ''}${previewReport.rating_growth}` },
                          { label: 'Puzzle Accuracy', val: `${previewReport.puzzle_accuracy}%` }
                        ].map((stat, idx) => (
                          <div key={idx} className="bg-background/60 p-3 rounded-xl border border-border/50">
                            <p className="text-base font-black text-white">{stat.val}</p>
                            <p className="text-[8px] text-muted uppercase mt-0.5 font-semibold">{stat.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Strengths & Weaknesses preview editor */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[9px] text-muted font-bold uppercase tracking-wider block mb-1">Strengths (Press comma-separated to edit)</label>
                          <input 
                            type="text"
                            value={previewReport.strengths?.join(', ') || ''}
                            onChange={e => setPreviewReport({ ...previewReport, strengths: e.target.value.split(',').map(x => x.trim()).filter(Boolean) })}
                            className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-muted font-bold uppercase tracking-wider block mb-1">Weaknesses</label>
                          <input 
                            type="text"
                            value={previewReport.weaknesses?.join(', ') || ''}
                            onChange={e => setPreviewReport({ ...previewReport, weaknesses: e.target.value.split(',').map(x => x.trim()).filter(Boolean) })}
                            className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs text-white"
                          />
                        </div>
                      </div>

                      {/* Feedback Text area */}
                      <div>
                        <label className="text-[9px] text-muted font-bold uppercase tracking-wider block mb-1">Coach Monthly Feedback</label>
                        <textarea 
                          rows={3}
                          value={previewReport.coach_feedback || ''}
                          onChange={e => setPreviewReport({ ...previewReport, coach_feedback: e.target.value })}
                          placeholder="Provide overview feedback for the parent and student..."
                          className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-white"
                        />
                      </div>

                      {/* Publish report */}
                      <div className="flex justify-end pt-2 border-t border-border/40">
                        <button 
                          onClick={handlePublishReport}
                          className="px-5 py-2 bg-gradient-to-r from-secondary to-primary text-white rounded-xl text-xs font-black hover:opacity-95 transition flex items-center gap-1 shadow-lg shadow-primary/10"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Publish Report
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Past Monthly Reports list */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-white border-b border-border/40 pb-2 flex items-center gap-1">
                      <BarChart2 className="w-4 h-4 text-primary" /> Past Monthly Reports ({reports.length})
                    </h4>

                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {reports.map(report => (
                        <div key={report.id} className="p-3 bg-background/50 border border-border rounded-2xl text-xs space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-white">{report.report_month} Report</span>
                            <span className="text-[8px] text-muted">{new Date(report.created_at).toLocaleDateString()}</span>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-1 text-[9px] text-center text-muted">
                            <div>
                              <p className="font-bold text-white">{report.attendance_rate}%</p>
                              <p className="text-[7px]">Attendance</p>
                            </div>
                            <div>
                              <p className="font-bold text-white">{report.homework_rate}%</p>
                              <p className="text-[7px]">Homework</p>
                            </div>
                            <div>
                              <p className="font-bold text-white">+{report.rating_growth} ELO</p>
                              <p className="text-[7px]">Rating Growth</p>
                            </div>
                            <div>
                              <p className="font-bold text-white">{report.puzzle_accuracy}%</p>
                              <p className="text-[7px]">Puzzle Acc</p>
                            </div>
                          </div>

                          {report.coach_feedback && (
                            <p className="italic text-muted leading-tight border-t border-border/20 pt-1.5 mt-1 font-sans">
                              "{report.coach_feedback}"
                            </p>
                          )}
                        </div>
                      ))}
                      {reports.length === 0 && (
                        <p className="text-[10px] text-muted text-center py-6 italic">No reports published yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Performance Intelligence */}
              {activeTab === 'intel' && (
                <div className="space-y-6">
                  {/* Sync Header */}
                  <div className="flex justify-between items-center bg-background/40 p-4 border border-border/80 rounded-2xl">
                    <div>
                      <h4 className="text-xs font-black text-white">Performance Analytics Dashboard</h4>
                      <p className="text-[10px] text-muted">
                        Last Analysed: {activeStudent.performance_profile?.updated_at 
                          ? new Date(activeStudent.performance_profile.updated_at).toLocaleString() 
                          : 'Never'}
                      </p>
                    </div>
                    <button
                      onClick={syncPerformance}
                      disabled={analyzing}
                      className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-black hover:opacity-95 disabled:opacity-50 transition flex items-center gap-1.5 shadow-lg shadow-primary/20"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
                      {analyzing ? 'Running Analysis...' : 'Re-Run Performance Analysis'}
                    </button>
                  </div>

                  {activeStudent.performance_profile ? (
                    <>
                      {/* Success & Risk Prediction Block */}
                      <div className="grid md:grid-cols-3 gap-6">
                        {/* Risk prediction */}
                        <div className="glass p-5 rounded-2xl border-border/80 col-span-1 space-y-4">
                          <p className="text-xs font-extrabold text-white">Success Prediction</p>
                          <div className="flex flex-col items-center justify-center py-2 space-y-2">
                            {activeStudent.performance_profile.risk_level === 'high' ? (
                              <>
                                <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-black rounded-lg uppercase tracking-wider">
                                  High Risk
                                </span>
                                <p className="text-[10px] text-muted text-center mt-1 leading-relaxed">Urgent coaching adjustments required to improve success odds.</p>
                              </>
                            ) : activeStudent.performance_profile.risk_level === 'medium' ? (
                              <>
                                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs font-black rounded-lg uppercase tracking-wider">
                                  Medium Risk
                                </span>
                                <p className="text-[10px] text-muted text-center mt-1 leading-relaxed">Monitor closely. Some homework or attendance metrics are slipping.</p>
                              </>
                            ) : (
                              <>
                                <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-black rounded-lg uppercase tracking-wider">
                                  Low Risk
                                </span>
                                <p className="text-[10px] text-muted text-center mt-1 leading-relaxed">Healthy development course. High success probability.</p>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Active Alerts */}
                        <div className="glass p-5 rounded-2xl border-border/80 col-span-2 space-y-3">
                          <p className="text-xs font-extrabold text-white flex items-center gap-1">
                            <AlertTriangle className="text-accent w-4 h-4" /> Risk Alerts & Warnings ({(activeStudent.performance_profile.risk_alerts || []).length})
                          </p>
                          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
                            {(activeStudent.performance_profile.risk_alerts || []).map((alert, i) => (
                              <span key={i} className="px-3 py-1.5 bg-background/50 border border-red-500/20 text-red-400 rounded-xl text-[10px] font-bold flex items-center gap-1">
                                ⚠️ {alert}
                              </span>
                            ))}
                            {(activeStudent.performance_profile.risk_alerts || []).length === 0 && (
                              <p className="text-[10px] text-muted italic">All indicators clear. No risks detected.</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Main Performance Grid */}
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Game Analysis Engine */}
                        <div className="glass p-5 rounded-2xl border-border space-y-4">
                          <h4 className="text-xs font-extrabold text-white border-b border-border/40 pb-2 flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-primary" /> Lichess Match Intelligence
                          </h4>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-background/40 p-3 rounded-xl border border-border text-center">
                              <p className="text-xl font-extrabold text-white">{activeStudent.performance_profile.acpl}</p>
                              <p className="text-[8px] text-muted uppercase font-bold tracking-wider mt-0.5">Avg Centipawn Loss</p>
                            </div>
                            <div className="bg-background/40 p-3 rounded-xl border border-border text-center flex flex-col justify-center">
                              <p className="text-[10px] font-semibold text-white">
                                {activeStudent.performance_profile.blunders_avg} blunders / game
                              </p>
                              <p className="text-[10px] font-semibold text-muted">
                                {activeStudent.performance_profile.mistakes_avg} mistakes
                              </p>
                              <p className="text-[10px] font-semibold text-muted">
                                {activeStudent.performance_profile.inaccuracies_avg} inaccuracies
                              </p>
                            </div>
                          </div>

                          {/* Stage Ratings */}
                          <div className="space-y-2 pt-2">
                            <p className="text-[10px] text-muted font-bold uppercase tracking-wider">Game-Stage Performance Estimates</p>
                            <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                              <div className="p-2 bg-background/50 border border-border/60 rounded-lg">
                                <span className="font-extrabold text-white">{activeStudent.performance_profile.opening_perf_rating}</span>
                                <p className="text-[8px] text-muted mt-0.5">Opening</p>
                              </div>
                              <div className="p-2 bg-background/50 border border-border/60 rounded-lg">
                                <span className="font-extrabold text-white">{activeStudent.performance_profile.middlegame_perf_rating}</span>
                                <p className="text-[8px] text-muted mt-0.5">Middlegame</p>
                              </div>
                              <div className="p-2 bg-background/50 border border-border/60 rounded-lg">
                                <span className="font-extrabold text-white">{activeStudent.performance_profile.endgame_perf_rating}</span>
                                <p className="text-[8px] text-muted mt-0.5">Endgame</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Tactical Analytics */}
                        <div className="glass p-5 rounded-2xl border-border space-y-4">
                          <h4 className="text-xs font-extrabold text-white border-b border-border/40 pb-2 flex items-center gap-1.5">
                            <Target className="w-4 h-4 text-secondary" /> Puzzle & Tactical Analytics
                          </h4>
                          
                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-background/40 p-2 rounded-xl text-center">
                              <p className="text-sm font-extrabold text-white">{activeStudent.performance_profile.puzzle_accuracy}%</p>
                              <p className="text-[7px] text-muted uppercase font-bold tracking-wider">Accuracy</p>
                            </div>
                            <div className="bg-background/40 p-2 rounded-xl text-center">
                              <p className="text-sm font-extrabold text-white">{activeStudent.performance_profile.puzzle_rating}</p>
                              <p className="text-[7px] text-muted uppercase font-bold tracking-wider">Puzzle ELO</p>
                            </div>
                            <div className="bg-background/40 p-2 rounded-xl text-center">
                              <p className="text-sm font-extrabold text-white">{activeStudent.performance_profile.solve_speed_seconds}s</p>
                              <p className="text-[7px] text-muted uppercase font-bold tracking-wider">Avg Speed</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="p-3 bg-green-500/5 border border-green-500/10 rounded-xl">
                              <span className="text-[8px] text-green-400 font-bold uppercase tracking-wider block">Strongest Theme</span>
                              <span className="text-xs font-extrabold text-white mt-1 block">{activeStudent.performance_profile.strongest_theme}</span>
                            </div>
                            <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                              <span className="text-[8px] text-red-400 font-bold uppercase tracking-wider block">Weakest Theme</span>
                              <span className="text-xs font-extrabold text-white mt-1 block">{activeStudent.performance_profile.weakest_theme}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Weakness Detection & Coach Recommendations */}
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Weakness Sliders */}
                        <div className="glass p-5 rounded-2xl border-border space-y-4">
                          <h4 className="text-xs font-extrabold text-white border-b border-border/40 pb-2">Automated Weakness Diagnostics</h4>
                          <div className="space-y-3">
                            {[
                              { label: 'Fork Weakness', value: activeStudent.performance_profile.fork_weakness, color: 'from-orange-500 to-red-500' },
                              { label: 'Pin Weakness', value: activeStudent.performance_profile.pin_weakness, color: 'from-orange-500 to-red-500' },
                              { label: 'Skewer Weakness', value: activeStudent.performance_profile.skewer_weakness, color: 'from-orange-500 to-red-500' },
                              { label: 'King Safety Issues', value: activeStudent.performance_profile.king_safety_issues, color: 'from-orange-500 to-red-500' },
                              { label: 'Calculation Issues', value: activeStudent.performance_profile.calculation_issues, color: 'from-orange-500 to-red-500' },
                              { label: 'Endgame Issues', value: activeStudent.performance_profile.endgame_issues, color: 'from-orange-500 to-red-500' }
                            ].map((w, i) => (
                              <div key={i} className="space-y-1.5">
                                <div className="flex justify-between text-[10px] font-bold">
                                  <span className="text-muted">{w.label}</span>
                                  <span className="text-white">{w.value}%</span>
                                </div>
                                <div className="h-2 w-full bg-background rounded-full overflow-hidden border border-border/30">
                                  <div 
                                    className={`h-full bg-gradient-to-r ${w.color}`}
                                    style={{ width: `${w.value}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* recommendations */}
                        <div className="glass p-5 rounded-2xl border-border space-y-4">
                          <h4 className="text-xs font-extrabold text-white border-b border-border/40 pb-2 flex items-center gap-1">
                            <Award className="w-4 h-4 text-primary" /> AI Coaching Recommendations
                          </h4>
                          <div className="space-y-2.5 max-h-72 overflow-y-auto">
                            {(activeStudent.performance_profile.recommendations || []).map((rec, i) => (
                              <div key={i} className="p-3 bg-background/40 border border-border/80 rounded-xl text-xs space-y-1 text-left">
                                <span className="text-[8px] bg-secondary/20 border border-secondary/30 text-secondary px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                                  {rec.type.replace('_', ' ')}
                                </span>
                                <p className="font-extrabold text-white mt-1">{rec.category}</p>
                                <p className="text-[10px] text-muted mt-0.5 font-sans leading-relaxed">{rec.message}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-12 text-center text-xs text-muted">
                      No performance analysis profile matches found. Please click "Re-Run Performance Analysis" to compute stats.
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
