'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { api } from '@/utils/api';
import { Users, Plus, X, Key, Search, UserCheck, Trash2 } from 'lucide-react';

interface Student {
  id: string; session_balance: number; lichess_rating: number;
  total_xp: number; level: number; parent_name: string;
  parent_email?: string; lichess_username?: string;
  starting_rating?: number; target_rating?: number;
  assigned_coach: { id: string; user: { first_name: string; last_name: string } } | null;
  user: { id: string; first_name: string; last_name: string; email: string; phone: string };
}
interface Coach { id: string; user: { first_name: string; last_name: string } }

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', parentName: '', parentEmail: '', coachId: '', password: '' });
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ coachId: '', lichessUsername: '', parentName: '', parentEmail: '', startingRating: '', targetRating: '' });
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [pkgSize, setPkgSize] = useState(12);
  const [pkgAmount, setPkgAmount] = useState(8400);

  const generatePassword = () => 'ChessHub' + Math.floor(1000 + Math.random() * 9000) + '!';

  const loadData = useCallback(async () => {
    try {
      const [s, c] = await Promise.all([api.get('/academy/students/'), api.get('/academy/coaches/')]);
      setStudents(s.data); setCoaches(c.data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const createStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/register/', {
        email: form.email, first_name: form.firstName, last_name: form.lastName,
        role: 'student', phone: form.phone, parent_name: form.parentName,
        parent_email: form.parentEmail,
        assigned_coach_id: form.coachId || undefined,
        password: form.password,
      });
      setMsg(`✅ Student ${form.firstName} created! Password: ${form.password}`);
      setForm({ firstName: '', lastName: '', email: '', phone: '', parentName: '', parentEmail: '', coachId: '', password: '' });
      setShowForm(false);
      loadData();
      setTimeout(() => setMsg(''), 8000);
    } catch (err: any) { setMsg('Error: ' + JSON.stringify(err.response?.data)); }
  };

  const registerPurchase = async (studentId: string) => {
    try {
      await api.post('/academy/enrollments/', {
        student_id: studentId, plan_name: `${pkgSize} Sessions Pack`,
        sessions_purchased: pkgSize, amount_paid: pkgAmount,
      });
      setMsg('✅ Session package registered! Balance updated.');
      setPurchasing(null);
      loadData();
    } catch (err: any) { setMsg('Error: ' + JSON.stringify(err.response?.data)); }
  };

  const resetPassword = async (studentId: string) => {
    try {
      const res = await api.post(`/academy/students/${studentId}/reset_password/`);
      setMsg(`Password reset. Temp password: ${res.data.temp_password}`);
      setTimeout(() => setMsg(''), 8000);
    } catch { setMsg('Reset failed.'); }
  };

  const startEdit = (s: Student) => {
    setEditingStudentId(s.id);
    setEditForm({
      coachId: s.assigned_coach?.id || '',
      lichessUsername: s.lichess_username || '',
      parentName: s.parent_name || '',
      parentEmail: s.parent_email || '',
      startingRating: String(s.starting_rating || ''),
      targetRating: String(s.target_rating || ''),
    });
    setPurchasing(null);
    setShowForm(false);
  };

  const saveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patch(`/academy/students/${editingStudentId}/`, {
        assigned_coach_id: editForm.coachId || null,
        lichess_username: editForm.lichessUsername,
        parent_name: editForm.parentName,
        parent_email: editForm.parentEmail,
        starting_rating: editForm.startingRating ? parseInt(editForm.startingRating) : null,
        target_rating: editForm.targetRating ? parseInt(editForm.targetRating) : null,
      });
      setMsg('✅ Student profile updated successfully.');
      setEditingStudentId(null);
      loadData();
      setTimeout(() => setMsg(''), 5000);
    } catch {
      setMsg('Failed to update student profile.');
    }
  };

  const filtered = students.filter(s =>
    `${s.user.first_name} ${s.user.last_name} ${s.user.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Users className="text-primary w-5 h-5" /> Students ({students.length})
          </h2>
          <p className="text-xs text-muted mt-0.5">Manage all enrolled students</p>
        </div>
        <button onClick={() => {
            setForm({ firstName: '', lastName: '', email: '', phone: '', parentName: '', parentEmail: '', coachId: '', password: generatePassword() });
            setShowForm(!showForm);
          }}
          className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:opacity-90 transition">
          <Plus className="w-4 h-4" /> Add Student
        </button>
      </div>

      {msg && <div className="p-3 bg-secondary/10 border border-secondary/30 text-secondary text-xs rounded-xl break-all">{msg}</div>}

      {showForm && (
        <div className="glass p-6 rounded-3xl border-border space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white">Register New Student</h3>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-muted" /></button>
          </div>
          <form onSubmit={createStudent} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[['First Name', 'firstName'], ['Last Name', 'lastName']].map(([lbl, key]) => (
                <div key={key}>
                  <label className="text-[10px] text-muted font-bold uppercase tracking-wider block mb-1">{lbl}</label>
                  <input required value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-primary/50" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-muted font-bold uppercase tracking-wider block mb-1">Email Address</label>
                <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="text-[10px] text-muted font-bold uppercase tracking-wider block mb-1">Phone</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-muted font-bold uppercase tracking-wider block mb-1">Password</label>
                <input required type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="text-[10px] text-muted font-bold uppercase tracking-wider block mb-1">Assign Coach</label>
                <select value={form.coachId} onChange={e => setForm({ ...form, coachId: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground">
                  <option value="">No coach yet</option>
                  {coaches.map(c => <option key={c.id} value={c.id}>{c.user.first_name} {c.user.last_name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-muted font-bold uppercase tracking-wider block mb-1">Parent Name</label>
                <input value={form.parentName} onChange={e => setForm({ ...form, parentName: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] text-muted font-bold uppercase tracking-wider block mb-1">Parent Email</label>
                <input type="email" value={form.parentEmail} onChange={e => setForm({ ...form, parentEmail: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded-xl text-xs text-muted font-bold">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:opacity-90 transition">Create Student</button>
            </div>
          </form>
        </div>
      )}

      {editingStudentId && (
        <div className="glass p-6 rounded-3xl border-border space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white">Edit Student Profile</h3>
            <button onClick={() => setEditingStudentId(null)}><X className="w-4 h-4 text-muted" /></button>
          </div>
          <form onSubmit={saveStudent} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-muted font-bold uppercase tracking-wider block mb-1">Assign Coach</label>
                <select value={editForm.coachId} onChange={e => setEditForm({ ...editForm, coachId: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground">
                  <option value="">No coach yet</option>
                  {coaches.map(c => <option key={c.id} value={c.id}>{c.user.first_name} {c.user.last_name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-muted font-bold uppercase tracking-wider block mb-1">Lichess Username</label>
                <input value={editForm.lichessUsername} onChange={e => setEditForm({ ...editForm, lichessUsername: e.target.value })}
                  placeholder="e.g. Aarav_ChessKid"
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-primary/50" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-muted font-bold uppercase tracking-wider block mb-1">Parent Name</label>
                <input value={editForm.parentName} onChange={e => setEditForm({ ...editForm, parentName: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="text-[10px] text-muted font-bold uppercase tracking-wider block mb-1">Parent Email</label>
                <input type="email" value={editForm.parentEmail} onChange={e => setEditForm({ ...editForm, parentEmail: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-primary/50" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-muted font-bold uppercase tracking-wider block mb-1">Starting Rating</label>
                <input type="number" value={editForm.startingRating} onChange={e => setEditForm({ ...editForm, startingRating: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="text-[10px] text-muted font-bold uppercase tracking-wider block mb-1">Target Rating</label>
                <input type="number" value={editForm.targetRating} onChange={e => setEditForm({ ...editForm, targetRating: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-primary/50" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={() => setEditingStudentId(null)} className="px-4 py-2 border border-border rounded-xl text-xs text-muted font-bold">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:opacity-90 transition">Save Changes</button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search students..."
          className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted/60 focus:outline-none focus:border-primary/50" />
      </div>

      {/* Students Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(s => (
          <div key={s.id} className="glass p-5 rounded-2xl border-border space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-white text-sm">{s.user.first_name} {s.user.last_name}</p>
                <p className="text-[10px] text-muted mt-0.5">{s.user.email}</p>
                {s.parent_name && <p className="text-[10px] text-muted">Parent: {s.parent_name}</p>}
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg">{s.session_balance} classes</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                ['Rating', s.lichess_rating],
                ['XP', s.total_xp],
                ['Level', s.level],
              ].map(([lbl, val]) => (
                <div key={lbl} className="bg-background/50 rounded-xl p-2">
                  <p className="text-xs font-extrabold text-white">{val}</p>
                  <p className="text-[9px] text-muted font-bold uppercase tracking-wider">{lbl}</p>
                </div>
              ))}
            </div>

            {s.assigned_coach && (
              <p className="text-[10px] text-muted flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-secondary" /> {s.assigned_coach.user.first_name} {s.assigned_coach.user.last_name}
              </p>
            )}

            <div className="flex gap-1.5 pt-1">
              <button onClick={() => { setPurchasing(purchasing === s.id ? null : s.id); setEditingStudentId(null); }}
                className="flex-1 px-2.5 py-1.5 bg-secondary/10 border border-secondary/30 text-secondary rounded-xl text-[10px] font-bold hover:bg-secondary/20 transition">
                + Package
              </button>
              <button onClick={() => startEdit(s)}
                className="px-2.5 py-1.5 border border-primary/30 text-primary rounded-xl text-[10px] font-bold hover:bg-primary/10 transition">
                Edit
              </button>
              <button onClick={() => resetPassword(s.id)}
                className="px-2.5 py-1.5 border border-border text-muted rounded-xl text-[10px] font-bold hover:text-white transition flex items-center gap-1">
                <Key className="w-3 h-3" /> Reset
              </button>
            </div>

            {purchasing === s.id && (
              <div className="border-t border-border/50 pt-3 space-y-2">
                <select value={pkgSize} onChange={e => { const n = parseInt(e.target.value); setPkgSize(n); setPkgAmount(n === 12 ? 8400 : n === 24 ? 14400 : 24000); }}
                  className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-[10px] text-foreground">
                  <option value={12}>12 Sessions — ₹8,400</option>
                  <option value={24}>24 Sessions — ₹14,400</option>
                  <option value={48}>48 Sessions — ₹24,000</option>
                </select>
                <button onClick={() => registerPurchase(s.id)}
                  className="w-full py-1.5 bg-secondary text-white rounded-lg text-[10px] font-bold hover:opacity-90 transition">
                  Confirm Purchase
                </button>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 glass p-10 rounded-2xl text-center border-border text-muted text-sm">
            No students found.
          </div>
        )}
      </div>
    </div>
  );
}
