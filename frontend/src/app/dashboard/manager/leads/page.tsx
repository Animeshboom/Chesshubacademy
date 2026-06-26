'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { api } from '@/utils/api';
import {
  TrendingUp, CheckCircle, XCircle, Clock, Phone, User,
  MessageSquare, ChevronDown, ChevronUp, UserPlus, RefreshCw
} from 'lucide-react';

interface Lead {
  id: string; parent_name: string; student_name: string;
  age: number; country: string; whatsapp_number: string;
  chess_level: string; preferred_time: string;
  status: string; notes: string; created_at: string; updated_at: string;
}
interface Coach { id: string; user: { first_name: string; last_name: string } }

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  new:            { label: 'New Lead',       color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
  contacted:      { label: 'Contacted',      color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  demo_scheduled: { label: 'Demo Scheduled', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  demo_completed: { label: 'Demo Done',      color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  converted:      { label: 'Converted ✓',   color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20' },
  lost:           { label: 'Lost',           color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20' },
};
const STATUS_ORDER = ['new', 'contacted', 'demo_scheduled', 'demo_completed', 'converted', 'lost'];
const NEXT_STATUS: Record<string, string> = {
  new: 'contacted', contacted: 'demo_scheduled',
  demo_scheduled: 'demo_completed', demo_completed: 'converted',
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [msg, setMsg] = useState('');
  const [converting, setConverting] = useState<string | null>(null);
  const [convertForm, setConvertForm] = useState({ email: '', coachId: '', sessions: 12, amount: 8400, password: '', parentEmail: '' });

  const loadData = useCallback(async () => {
    try {
      const [l, s, c] = await Promise.all([
        api.get('/academy/demo-bookings/'),
        api.get('/academy/demo-bookings/stats/'),
        api.get('/academy/coaches/'),
      ]);
      
      // Handle potential pagination wrapper from Django REST Framework
      const leadsList = Array.isArray(l.data) ? l.data : (l.data?.results || []);
      const coachesList = Array.isArray(c.data) ? c.data : (c.data?.results || []);
      
      setLeads(leadsList);
      setStats(s.data || {});
      setCoaches(coachesList);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const updateStatus = async (id: string, newStatus: string, note = '') => {
    try {
      await api.post(`/academy/demo-bookings/${id}/update_status/`, { status: newStatus, note });
      setMsg(`Lead moved to "${STATUS_CONFIG[newStatus]?.label}"`);
      setNoteInput('');
      loadData();
      setTimeout(() => setMsg(''), 3000);
    } catch { setMsg('Update failed.'); }
  };

  const addNote = async (id: string) => {
    if (!noteInput.trim()) return;
    await updateStatus(id, leads.find(l => l.id === id)?.status || 'new', noteInput);
  };

  const convertToStudent = async (lead: Lead) => {
    try {
      const res = await api.post(`/academy/demo-bookings/${lead.id}/convert_to_student/`, {
        email: convertForm.email || undefined,
        coach_id: convertForm.coachId || undefined,
        sessions_purchased: convertForm.sessions,
        amount_paid: convertForm.amount,
        password: convertForm.password,
        parent_email: convertForm.parentEmail || undefined,
      });
      setMsg(`✅ Student created! Login: ${res.data.email} | Password: ${res.data.temp_password}`);
      setConverting(null);
      loadData();
      setTimeout(() => setMsg(''), 8000);
    } catch (e: any) {
      setMsg(e.response?.data?.error || 'Conversion failed.');
    }
  };

  const filtered = filter === 'all' ? leads : leads.filter(l => l.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <TrendingUp className="text-primary w-5 h-5" /> Demo Lead Pipeline
          </h2>
          <p className="text-xs text-muted mt-0.5">Track and convert demo enquiries into enrolled students</p>
        </div>
        <button onClick={loadData} className="p-2 border border-border rounded-xl text-muted hover:text-white transition">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {msg && (
        <div className="p-3 bg-secondary/10 border border-secondary/30 text-secondary text-xs rounded-xl">{msg}</div>
      )}

      {/* Pipeline Stats Bar */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {STATUS_ORDER.map(s => (
          <button key={s} onClick={() => setFilter(filter === s ? 'all' : s)}
            className={`p-3 rounded-2xl border text-left transition-all ${filter === s ? STATUS_CONFIG[s].bg + ' border-opacity-60' : 'glass border-border hover:border-border/80'}`}>
            <p className={`text-xl font-extrabold ${filter === s ? STATUS_CONFIG[s].color : 'text-white'}`}>
              {stats[s] ?? 0}
            </p>
            <p className="text-[10px] text-muted font-semibold mt-0.5">{STATUS_CONFIG[s].label}</p>
          </button>
        ))}
      </div>

      {/* Leads List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="glass p-10 rounded-3xl text-center border-border text-muted text-sm">
            No leads in this stage.
          </div>
        )}
        {filtered.map(lead => {
          const cfg = STATUS_CONFIG[lead.status] || STATUS_CONFIG['new'];
          const isOpen = expanded === lead.id;
          const isConverting = converting === lead.id;
          const nextSt = NEXT_STATUS[lead.status];
          return (
            <div key={lead.id} className="glass rounded-2xl border-border overflow-hidden">
              {/* Lead Header Row */}
              <div className="p-4 flex items-center gap-4 flex-wrap">
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-extrabold text-sm shrink-0">
                  {lead.student_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm truncate">{lead.student_name}</p>
                  <p className="text-[10px] text-muted">Parent: {lead.parent_name} | Age {lead.age} | {lead.country}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-xl border text-[10px] font-bold ${cfg.bg} ${cfg.color}`}>
                    {cfg.label}
                  </span>
                  <a href={`https://wa.me/${lead.whatsapp_number.replace(/\D/g, '')}`} target="_blank"
                    className="p-1.5 border border-green-500/30 bg-green-500/10 text-green-400 rounded-xl hover:bg-green-500/20 transition">
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  {nextSt && (
                    <button onClick={() => updateStatus(lead.id, nextSt)}
                      className="px-3 py-1.5 bg-primary text-white text-[10px] font-bold rounded-xl hover:opacity-90 transition">
                      → {STATUS_CONFIG[nextSt]?.label}
                    </button>
                  )}
                  {lead.status === 'demo_completed' && (
                    <button onClick={() => {
                      if (isConverting) {
                        setConverting(null);
                      } else {
                        const nameParts = lead.student_name.trim().split(' ');
                        const first = nameParts[0] || '';
                        const last = nameParts[1] || '';
                        const base_email = last ? `${first.toLowerCase()}.${last.toLowerCase()}@chesshubstudent.com` : `${first.toLowerCase()}@chesshubstudent.com`;
                        setConvertForm({
                          email: base_email,
                          coachId: '',
                          sessions: 12,
                          amount: 8400,
                          password: 'ChessHub' + Math.floor(1000 + Math.random() * 9000) + '!',
                          parentEmail: ''
                        });
                        setConverting(lead.id);
                      }
                    }}
                      className="px-3 py-1.5 bg-green-600 text-white text-[10px] font-bold rounded-xl hover:bg-green-500 transition flex items-center gap-1">
                      <UserPlus className="w-3 h-3" /> Convert
                    </button>
                  )}
                  {lead.status === 'converted' && (
                    <span className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold rounded-xl cursor-pointer hover:bg-red-500/20 transition"
                      onClick={() => updateStatus(lead.id, 'lost')}>
                      Mark Lost
                    </span>
                  )}
                  <button onClick={() => setExpanded(isOpen ? null : lead.id)}
                    className="p-1.5 border border-border rounded-xl text-muted hover:text-white transition">
                    {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Expanded Detail */}
              {isOpen && (
                <div className="px-4 pb-4 border-t border-border/50 pt-4 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div><p className="text-muted font-bold uppercase tracking-wider text-[9px] mb-0.5">Level</p><p className="text-white capitalize">{lead.chess_level}</p></div>
                    <div><p className="text-muted font-bold uppercase tracking-wider text-[9px] mb-0.5">Preferred Time</p><p className="text-white">{lead.preferred_time}</p></div>
                    <div><p className="text-muted font-bold uppercase tracking-wider text-[9px] mb-0.5">WhatsApp</p><p className="text-white">{lead.whatsapp_number}</p></div>
                    <div><p className="text-muted font-bold uppercase tracking-wider text-[9px] mb-0.5">Received</p><p className="text-white">{new Date(lead.created_at).toLocaleDateString()}</p></div>
                  </div>

                  {lead.notes && (
                    <div className="p-3 bg-background/50 border border-border/60 rounded-xl">
                      <p className="text-[9px] text-muted font-bold uppercase tracking-wider mb-1">Activity Log</p>
                      <pre className="text-xs text-foreground/80 whitespace-pre-wrap font-sans leading-relaxed">{lead.notes}</pre>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input value={noteInput} onChange={e => setNoteInput(e.target.value)}
                      placeholder="Add a follow-up note..."
                      className="flex-1 px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted/60 focus:outline-none focus:border-primary/50" />
                    <button onClick={() => addNote(lead.id)}
                      className="px-3 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:opacity-90 transition flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" /> Save
                    </button>
                    {lead.status !== 'lost' && lead.status !== 'converted' && (
                      <button onClick={() => updateStatus(lead.id, 'lost')}
                        className="px-3 py-2 border border-red-500/30 text-red-400 rounded-xl text-xs font-bold hover:bg-red-500/10 transition">
                        Mark Lost
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Convert to Student Form */}
              {isConverting && (
                <div className="px-4 pb-4 border-t border-green-500/20 bg-green-500/5 pt-4 space-y-3">
                  <p className="text-xs font-bold text-green-400 flex items-center gap-1"><UserPlus className="w-3.5 h-3.5" /> Convert to Student</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[9px] text-muted font-bold uppercase tracking-wider block mb-1">Student Email</label>
                      <input value={convertForm.email} onChange={e => setConvertForm({ ...convertForm, email: e.target.value })}
                        placeholder="auto-generated if blank"
                        className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted/50 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[9px] text-muted font-bold uppercase tracking-wider block mb-1">Password</label>
                      <input required type="text" value={convertForm.password} onChange={e => setConvertForm({ ...convertForm, password: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary/50" />
                    </div>
                    <div>
                      <label className="text-[9px] text-muted font-bold uppercase tracking-wider block mb-1">Parent Email (Optional)</label>
                      <input type="email" value={convertForm.parentEmail} onChange={e => setConvertForm({ ...convertForm, parentEmail: e.target.value })}
                        placeholder="parent@example.com"
                        className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary/50" />
                    </div>
                    <div>
                      <label className="text-[9px] text-muted font-bold uppercase tracking-wider block mb-1">Assign Coach</label>
                      <select value={convertForm.coachId} onChange={e => setConvertForm({ ...convertForm, coachId: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground">
                        <option value="">No coach yet</option>
                        {coaches.map(c => <option key={c.id} value={c.id}>{c.user.first_name} {c.user.last_name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] text-muted font-bold uppercase tracking-wider block mb-1">Session Package</label>
                      <select value={convertForm.sessions} onChange={e => {
                        const n = parseInt(e.target.value);
                        setConvertForm({ ...convertForm, sessions: n, amount: n === 12 ? 8400 : n === 24 ? 14400 : 24000 });
                      }} className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground">
                        <option value={12}>12 Sessions — ₹8,400</option>
                        <option value={24}>24 Sessions — ₹14,400</option>
                        <option value={48}>48 Sessions — ₹24,000</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setConverting(null)}
                      className="px-3 py-1.5 border border-border rounded-xl text-xs text-muted font-bold">Cancel</button>
                    <button onClick={() => convertToStudent(lead)}
                      className="px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-bold transition">
                      Create Student Account
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
