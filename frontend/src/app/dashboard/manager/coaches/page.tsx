'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { api } from '@/utils/api';
import { UserCheck, Plus, X, Key, Search } from 'lucide-react';

interface Coach {
  id: string; bio: string; lichess_username: string;
  zoom_personal_link: string; hourly_rate: string;
  user: { first_name: string; last_name: string; email: string; phone: string };
}

export default function CoachesPage() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '' });
  const [editingCoachId, setEditingCoachId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ bio: '', lichessUsername: '', zoomPersonalLink: '', hourlyRate: '' });

  const generatePassword = () => 'ChessHub' + Math.floor(1000 + Math.random() * 9000) + '!';

  const loadData = useCallback(async () => {
    try { const r = await api.get('/academy/coaches/'); setCoaches(r.data); }
    catch { /* silent */ }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const createCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/register/', {
        email: form.email, first_name: form.firstName, last_name: form.lastName,
        role: 'coach', phone: form.phone, password: form.password,
      });
      setMsg(`✅ Coach ${form.firstName} created! Password: ${form.password}`);
      setForm({ firstName: '', lastName: '', email: '', phone: '', password: '' });
      setShowForm(false);
      loadData();
      setTimeout(() => setMsg(''), 8000);
    } catch (err: any) { setMsg('Error: ' + JSON.stringify(err.response?.data)); }
  };

  const resetPassword = async (id: string, name: string) => {
    try {
      const r = await api.post(`/academy/coaches/${id}/reset_password/`);
      setMsg(`Password reset for ${name}. Temp: ${r.data.temp_password}`);
      setTimeout(() => setMsg(''), 8000);
    } catch { setMsg('Reset failed.'); }
  };

  const startEdit = (c: Coach) => {
    setEditingCoachId(c.id);
    setEditForm({
      bio: c.bio || '',
      lichessUsername: c.lichess_username || '',
      zoomPersonalLink: c.zoom_personal_link || '',
      hourlyRate: c.hourly_rate || '',
    });
    setShowForm(false);
  };

  const saveCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patch(`/academy/coaches/${editingCoachId}/`, {
        bio: editForm.bio,
        lichess_username: editForm.lichessUsername,
        zoom_personal_link: editForm.zoomPersonalLink,
        hourly_rate: editForm.hourlyRate,
      });
      setMsg('✅ Coach profile updated successfully.');
      setEditingCoachId(null);
      loadData();
      setTimeout(() => setMsg(''), 5000);
    } catch {
      setMsg('Failed to update coach profile.');
    }
  };

  const filtered = coaches.filter(c =>
    `${c.user.first_name} ${c.user.last_name} ${c.user.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <UserCheck className="text-primary w-5 h-5" /> Coaches ({coaches.length})
          </h2>
          <p className="text-xs text-muted mt-0.5">Manage academy coaching team</p>
        </div>
        <button onClick={() => {
            setForm({ firstName: '', lastName: '', email: '', phone: '', password: generatePassword() });
            setShowForm(!showForm);
          }}
          className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-xl text-xs font-bold flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Coach
        </button>
      </div>

      {msg && <div className="p-3 bg-secondary/10 border border-secondary/30 text-secondary text-xs rounded-xl break-all">{msg}</div>}

      {showForm && (
        <div className="glass p-6 rounded-3xl border-border space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white">Register New Coach</h3>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-muted" /></button>
          </div>
          <form onSubmit={createCoach} className="grid grid-cols-2 gap-3">
            {[
              ['First Name', 'firstName'],
              ['Last Name', 'lastName'],
              ['Email', 'email'],
              ['Phone', 'phone'],
              ['Password', 'password']
            ].map(([lbl, key]) => (
              <div key={key} className={key === 'password' ? 'col-span-2' : ''}>
                <label className="text-[10px] text-muted font-bold uppercase tracking-wider block mb-1">{lbl}</label>
                <input required={key !== 'phone'} type={key === 'email' ? 'email' : 'text'}
                  value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-primary/50" />
              </div>
            ))}

            <div className="col-span-2 flex justify-end gap-3 pt-1">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded-xl text-xs text-muted font-bold">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:opacity-90">Create Coach</button>
            </div>
          </form>
        </div>
      )}

      {editingCoachId && (
        <div className="glass p-6 rounded-3xl border-border space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white">Edit Coach Profile</h3>
            <button onClick={() => setEditingCoachId(null)}><X className="w-4 h-4 text-muted" /></button>
          </div>
          <form onSubmit={saveCoach} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-[10px] text-muted font-bold uppercase tracking-wider block mb-1">Biography / Experience</label>
                <textarea
                  value={editForm.bio}
                  onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="Tell students about this coach's background, achievements, and coaching style..."
                  rows={3}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted font-bold uppercase tracking-wider block mb-1">Lichess Username</label>
                <input
                  type="text"
                  value={editForm.lichessUsername}
                  onChange={e => setEditForm({ ...editForm, lichessUsername: e.target.value })}
                  placeholder="e.g. GM_Magnus"
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted font-bold uppercase tracking-wider block mb-1">Hourly Rate (₹)</label>
                <input
                  type="number"
                  value={editForm.hourlyRate}
                  onChange={e => setEditForm({ ...editForm, hourlyRate: e.target.value })}
                  placeholder="e.g. 1500"
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] text-muted font-bold uppercase tracking-wider block mb-1">Zoom Personal Link</label>
                <input
                  type="url"
                  value={editForm.zoomPersonalLink}
                  onChange={e => setEditForm({ ...editForm, zoomPersonalLink: e.target.value })}
                  placeholder="https://zoom.us/j/..."
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={() => setEditingCoachId(null)} className="px-4 py-2 border border-border rounded-xl text-xs text-muted font-bold">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:opacity-90">Save Changes</button>
            </div>
          </form>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search coaches..."
          className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted/60 focus:outline-none focus:border-primary/50" />
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(c => (
          <div key={c.id} className="glass p-5 rounded-2xl border-border space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-white text-sm">{c.user.first_name} {c.user.last_name}</p>
                <p className="text-[10px] text-muted mt-0.5">{c.user.email}</p>
                {c.user.phone && <p className="text-[10px] text-muted">{c.user.phone}</p>}
                {c.hourly_rate && <p className="text-[10px] text-emerald-400 font-bold mt-1">Rate: ₹{c.hourly_rate}/hr</p>}
              </div>
              <div className="w-9 h-9 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary font-extrabold text-sm">
                {c.user.first_name[0]}
              </div>
            </div>
            {c.bio && <p className="text-[10px] text-muted leading-relaxed">{c.bio}</p>}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
              {c.lichess_username ? (
                <a href={`https://lichess.org/@/${c.lichess_username}`} target="_blank"
                  className="text-[10px] text-accent font-semibold hover:underline">♞ {c.lichess_username}</a>
              ) : (
                <span className="text-[10px] text-muted italic">No Lichess linked</span>
              )}
              <div className="flex items-center gap-1.5">
                <button onClick={() => startEdit(c)}
                  className="px-2.5 py-1.5 border border-primary/30 text-primary rounded-xl text-[10px] font-bold hover:bg-primary/10 transition">
                  Edit
                </button>
                <button onClick={() => resetPassword(c.id, c.user.first_name)}
                  className="px-2.5 py-1.5 border border-border text-muted rounded-xl text-[10px] font-bold hover:text-white transition flex items-center gap-1">
                  <Key className="w-3 h-3" /> Reset
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 glass p-10 rounded-2xl text-center border-border text-muted text-sm">
            No coaches found.
          </div>
        )}
      </div>
    </div>
  );
}
