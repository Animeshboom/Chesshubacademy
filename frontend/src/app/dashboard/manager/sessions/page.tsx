'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { api } from '@/utils/api';
import { 
  Calendar as CalendarIcon, Video, Plus, X, CheckCircle, 
  Users, Clock, ChevronLeft, ChevronRight, List, LayoutGrid 
} from 'lucide-react';

interface Coach { id: string; user: { first_name: string; last_name: string } }
interface Student { id: string; user: { first_name: string; last_name: string } }
interface Session {
  id: string; title: string; class_type: string; status: string;
  scheduled_start: string; scheduled_end: string;
  coach: { user: { first_name: string; last_name: string } };
  students: { student: { user: { first_name: string; last_name: string } } }[];
  zoom_meeting?: { start_url: string; join_url: string };
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // Calendar navigation states
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Form state
  const [title, setTitle] = useState('');
  const [coachId, setCoachId] = useState('');
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [classType, setClassType] = useState('1-to-1');
  const [startDt, setStartDt] = useState('');

  // Form inline date picker states
  const [pickerMonth, setPickerMonth] = useState(new Date().getMonth());
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('10:00');
  const [showVisualHelper, setShowVisualHelper] = useState(false);

  useEffect(() => {
    if (startDt) {
      try {
        const d = new Date(startDt);
        if (!isNaN(d.getTime())) {
          setPickerMonth(d.getMonth());
          setPickerYear(d.getFullYear());
          setSelectedDay(d.getDate());
          const hours = String(d.getHours()).padStart(2, '0');
          const minutes = String(d.getMinutes()).padStart(2, '0');
          setSelectedTime(`${hours}:${minutes}`);
        }
      } catch (e) {
        console.error("Error parsing startDt:", e);
      }
    }
  }, [startDt]);

  const updatePickedDateTime = (day: number, time: string) => {
    setSelectedDay(day);
    setSelectedTime(time);
    const monthStr = String(pickerMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    setStartDt(`${pickerYear}-${monthStr}-${dayStr}T${time}`);
  };

  const handlePickerPrevMonth = () => {
    if (pickerMonth === 0) {
      setPickerMonth(11);
      setPickerYear(y => y - 1);
    } else {
      setPickerMonth(m => m - 1);
    }
    setSelectedDay(null);
  };

  const handlePickerNextMonth = () => {
    if (pickerMonth === 11) {
      setPickerMonth(0);
      setPickerYear(y => y + 1);
    } else {
      setPickerMonth(m => m + 1);
    }
    setSelectedDay(null);
  };

  const loadData = useCallback(async () => {
    try {
      const [sess, c, s] = await Promise.all([
        api.get('/academy/sessions/'),
        api.get('/academy/coaches/'),
        api.get('/academy/students/'),
      ]);
      setSessions(sess.data);
      setCoaches(c.data);
      setStudents(s.data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !coachId || !startDt || studentIds.length === 0) {
      setMsg('All fields including at least one student are required.');
      return;
    }
    const start = new Date(startDt);
    const end = new Date(start.getTime() + (classType === 'group' ? 60 : 50) * 60000);
    try {
      await api.post('/academy/sessions/', {
        title, class_type: classType, coach_id: coachId,
        student_ids: studentIds,
        scheduled_start: start.toISOString(),
        scheduled_end: end.toISOString(),
      });
      setMsg('✅ Session scheduled! Zoom link generated automatically.');
      setTitle(''); setCoachId(''); setStudentIds([]); setStartDt('');
      setShowForm(false);
      loadData();
      setTimeout(() => setMsg(''), 5000);
    } catch (err: any) {
      const detail = err.response?.data;
      setMsg('Error: ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)));
    }
  };

  const cancelSession = async (id: string) => {
    if (!confirm('Cancel this session?')) return;
    try {
      await api.post(`/academy/sessions/${id}/cancel/`);
      setMsg('Session cancelled.');
      loadData();
    } catch { setMsg('Failed to cancel.'); }
  };

  const filtered = sessions.filter(s => filterStatus === 'all' || s.status === filterStatus);

  const toggleStudent = (id: string) =>
    setStudentIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // Calendar helpers
  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const getSessionsForDay = (day: number) => {
    return filtered.filter(s => {
      const d = new Date(s.scheduled_start);
      return d.getDate() === day && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  };

  const handleDayClick = (day: number) => {
    const monthStr = String(currentMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    setStartDt(`${currentYear}-${monthStr}-${dayStr}T10:00`);
    setShowForm(true);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDayOffset = getFirstDayOfMonth(currentMonth, currentYear);
  const calendarCells: (number | null)[] = [
    ...Array(firstDayOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <CalendarIcon className="text-primary w-5 h-5" /> Class Sessions
          </h2>
          <p className="text-xs text-muted mt-0.5">Schedule, manage, and track all coaching sessions</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-background/50 border border-border p-1 rounded-xl">
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                viewMode === 'calendar' ? 'bg-primary text-white shadow' : 'text-muted hover:text-white'
              }`}
              title="Calendar View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Calendar
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                viewMode === 'list' ? 'bg-primary text-white shadow' : 'text-muted hover:text-white'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
          </div>

          <button onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:opacity-90 transition shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" /> Schedule New Session
          </button>
        </div>
      </div>

      {msg && <div className="p-3 bg-secondary/10 border border-secondary/30 text-secondary text-xs rounded-xl">{msg}</div>}

      {/* Schedule Form */}
      {showForm && (
        <div className="glass p-6 rounded-3xl border-border space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">New Class Session</h3>
            <button onClick={() => setShowForm(false)} className="text-muted hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleSchedule} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-muted font-bold uppercase tracking-wider block mb-1">Session Title</label>
                <input required value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. King & Pawn Endgames"
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted/60 focus:outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="text-[10px] text-muted font-bold uppercase tracking-wider block mb-1">Class Type</label>
                <select value={classType} onChange={e => setClassType(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground">
                  <option value="1-to-1">1-to-1 Coaching (50 min)</option>
                  <option value="group">Group Class (60 min)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-muted font-bold uppercase tracking-wider block mb-1">Coach</label>
                <select required value={coachId} onChange={e => setCoachId(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground">
                  <option value="">— Select Coach —</option>
                  {coaches.map(c => <option key={c.id} value={c.id}>{c.user.first_name} {c.user.last_name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-muted font-bold uppercase tracking-wider block mb-1">Date & Time</label>
                <input 
                  required 
                  type="datetime-local" 
                  value={startDt} 
                  onChange={e => setStartDt(e.target.value)}
                  style={{ colorScheme: 'dark' }}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-primary/50" 
                />
              </div>
            </div>

            {/* Visual Calendar Scheduler Helper Toggle */}
            <div className="flex justify-start pt-1">
              <button 
                type="button" 
                onClick={() => setShowVisualHelper(!showVisualHelper)}
                className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 rounded-xl text-[10px] font-bold text-slate-350 hover:text-white flex items-center gap-1.5 transition"
              >
                <CalendarIcon className="w-3.5 h-3.5 text-primary" />
                {showVisualHelper ? 'Hide Visual Scheduler Grid' : 'Use Interactive Calendar Grid'}
              </button>
            </div>

            {/* Visual Date & Time Picker Helper */}
            {showVisualHelper && (
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 space-y-4">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Visual Scheduler Calendar</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Month/Day Grid Selector */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">
                        {monthNames[pickerMonth]} {pickerYear}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button type="button" onClick={handlePickerPrevMonth} className="p-1 border border-slate-800 rounded bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-850">
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={handlePickerNextMonth} className="p-1 border border-slate-800 rounded bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-850">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold text-slate-500 uppercase">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i}>{d}</div>)}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {(() => {
                        const pickerDaysInMonth = new Date(pickerYear, pickerMonth + 1, 0).getDate();
                        const pickerFirstDayOffset = new Date(pickerYear, pickerMonth, 1).getDay();
                        const pickerCells = [
                          ...Array(pickerFirstDayOffset).fill(null),
                          ...Array.from({ length: pickerDaysInMonth }, (_, i) => i + 1)
                        ];
                        return pickerCells.map((day, idx) => {
                          if (day === null) {
                            return <div key={`empty-p-${idx}`} className="aspect-square" />;
                          }
                          const isSelected = selectedDay === day;
                          const isToday = new Date().getDate() === day && new Date().getMonth() === pickerMonth && new Date().getFullYear() === pickerYear;
                          return (
                            <button
                              key={`day-p-${day}`}
                              type="button"
                              onClick={() => updatePickedDateTime(day, selectedTime)}
                              className={`aspect-square rounded-lg text-xs transition font-semibold flex items-center justify-center ${
                                isSelected 
                                  ? 'bg-primary text-white font-black shadow shadow-primary/20' 
                                  : isToday 
                                  ? 'border border-primary/50 text-primary bg-primary/5 hover:bg-slate-800' 
                                  : 'bg-slate-950 text-slate-400 border border-slate-900 hover:border-slate-700 hover:text-white'
                              }`}
                            >
                              {day}
                            </button>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Time Slots Selector */}
                  <div className="space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Available Time Slots</span>
                      <div className="grid grid-cols-3 gap-1.5 max-h-40 overflow-y-auto pr-1">
                        {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map(t => {
                          const isSelTime = selectedTime === t;
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => selectedDay && updatePickedDateTime(selectedDay, t)}
                              disabled={!selectedDay}
                              className={`py-1.5 rounded-lg text-[10px] font-bold border transition text-center disabled:opacity-30 ${
                                isSelTime 
                                  ? 'bg-primary text-white border-primary font-black' 
                                  : 'border-slate-850 bg-slate-950 text-slate-455 hover:border-slate-700 hover:text-white'
                              }`}
                            >
                              {t}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Date & Time selection display */}
                    <div className="bg-slate-950 border border-slate-900 rounded-xl p-2.5 space-y-1.5 text-left">
                      {selectedDay ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-primary font-bold">
                          <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>Selected: {monthNames[pickerMonth]} {selectedDay}, {pickerYear} at {selectedTime}</span>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-550 font-semibold">⚠️ Please select a day on the calendar</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] text-muted font-bold uppercase tracking-wider block mb-2">
                Assign Students ({studentIds.length} selected)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1">
                {students.map(s => (
                  <button key={s.id} type="button" onClick={() => toggleStudent(s.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition text-left ${
                      studentIds.includes(s.id)
                        ? 'bg-primary/20 border-primary/40 text-primary'
                        : 'border-border text-muted hover:border-border/80 hover:text-foreground'
                    }`}>
                    {s.user.first_name} {s.user.last_name}
                  </button>
                ))}
                {students.length === 0 && <p className="text-xs text-muted col-span-3">No students found. Add students first.</p>}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-border rounded-xl text-xs text-muted font-bold">Cancel</button>
              <button type="submit"
                className="px-5 py-2 bg-gradient-to-r from-secondary to-primary text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:opacity-90 transition">
                <Video className="w-4 h-4" /> Schedule & Generate Zoom
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Tabs & Quick Stats */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex gap-2 flex-wrap">
          {['all', 'scheduled', 'completed', 'cancelled'].map(st => (
            <button key={st} onClick={() => setFilterStatus(st)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                filterStatus === st ? 'bg-primary text-white shadow-md' : 'border border-border text-muted hover:text-foreground hover:bg-background/40'
              }`}>{st}</button>
          ))}
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="glass rounded-3xl border-border p-6 space-y-4 shadow-xl">
          {/* Calendar Month Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              {monthNames[currentMonth]} {currentYear}
            </h3>
            <div className="flex items-center gap-2">
              <button onClick={handlePrevMonth} className="p-1.5 border border-border rounded-lg text-muted hover:text-white transition hover:bg-background/60">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={handleNextMonth} className="p-1.5 border border-border rounded-lg text-muted hover:text-white transition hover:bg-background/60">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days Of Week Header */}
          <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-muted uppercase tracking-wider">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="py-2">{d}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarCells.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="aspect-square bg-background/5 rounded-2xl border border-transparent" />;
              }

              const daySessions = getSessionsForDay(day);
              const isToday = new Date().getDate() === day && new Date().getMonth() === currentMonth && new Date().getFullYear() === currentYear;

              return (
                <div
                  key={`day-${day}`}
                  onClick={() => handleDayClick(day)}
                  className={`min-h-[90px] p-2 bg-background/20 hover:bg-background/45 border rounded-2xl transition duration-300 flex flex-col justify-between cursor-pointer group relative ${
                    isToday ? 'border-primary/80 bg-primary/5' : 'border-border/40'
                  }`}
                >
                  {/* Day number */}
                  <span className={`text-[10px] font-bold ${isToday ? 'text-primary' : 'text-muted group-hover:text-white transition-colors'}`}>
                    {day}
                  </span>

                  {/* Add icon overlay */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus className="w-3.5 h-3.5 text-primary" />
                  </div>

                  {/* Sessions within the day */}
                  <div className="space-y-1.5 mt-2 flex-grow overflow-y-auto max-h-[75px] custom-scrollbar">
                    {daySessions.map(s => (
                      <div
                        key={s.id}
                        onClick={(e) => {
                          e.stopPropagation(); // Avoid triggering day scheduling click
                        }}
                        className={`p-1.5 rounded-lg text-[9px] font-semibold leading-snug border transition flex flex-col gap-0.5 ${
                          s.status === 'scheduled' ? 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/20' :
                          s.status === 'completed' ? 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20' :
                          'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                        }`}
                      >
                        <div className="font-bold truncate text-white">{s.title}</div>
                        <div className="text-muted flex items-center gap-0.5">
                          <Users className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{s.coach.user.first_name}</span>
                        </div>
                        <div className="flex justify-between items-center gap-1 mt-1">
                          <span className="text-muted/80">{new Date(s.scheduled_start).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                          <a href={`/dashboard/classroom/${s.id}`} className="px-1 py-0.2 bg-background/50 rounded hover:bg-primary hover:text-white transition font-extrabold uppercase text-[8px] text-center">Join</a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="glass rounded-3xl border-border overflow-hidden shadow-xl">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-muted text-sm">No sessions found for this filter.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="border-b border-border/60">
                  <tr>
                    {['Session', 'Coach', 'Students', 'Date & Time', 'Type', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-muted font-bold uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filtered.map(s => (
                    <tr key={s.id} className="hover:bg-border/10 transition">
                      <td className="px-4 py-3 font-bold text-white max-w-[180px] truncate">{s.title}</td>
                      <td className="px-4 py-3 text-muted whitespace-nowrap">{s.coach.user.first_name} {s.coach.user.last_name}</td>
                      <td className="px-4 py-3 text-muted">{s.students.map(x => x.student.user.first_name).join(', ') || '—'}</td>
                      <td className="px-4 py-3 text-muted whitespace-nowrap">
                        {new Date(s.scheduled_start).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 capitalize text-muted">{s.class_type}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold capitalize ${
                          s.status === 'scheduled' ? 'bg-primary/10 text-primary' :
                          s.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>{s.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <a href={`/dashboard/classroom/${s.id}`}
                            className="px-2.5 py-1 bg-secondary text-white rounded-lg font-bold hover:opacity-90 transition">Join</a>
                          {s.status === 'scheduled' && (
                            <button onClick={() => cancelSession(s.id)}
                              className="px-2.5 py-1 border border-red-500/30 text-red-400 rounded-lg font-bold hover:bg-red-500/10 transition">Cancel</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
