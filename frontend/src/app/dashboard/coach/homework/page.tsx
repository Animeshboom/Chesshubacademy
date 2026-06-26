'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/utils/api';
import { ClipboardList, CheckCircle, XCircle, Eye } from 'lucide-react';

interface Student {
  id: string; user: { first_name: string; last_name: string }; session_balance: number;
}
interface Submission {
  id: string; status: string; submitted_at: string; submission_notes: string;
  coach_feedback?: string; coach_score?: number; drive_file_id?: string;
  assignment: {
    homework: { title: string; description: string };
    student: { id: string; user: { first_name: string; last_name: string } };
  };
}

export default function CoachHomeworkPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [msg, setMsg] = useState('');
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [filterStatus, setFilterStatus] = useState('pending_review');

  const loadData = useCallback(async () => {
    try { const r = await api.get('/homework/submissions/'); setSubmissions(r.data); }
    catch { /* silent */ }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const review = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await api.post(`/homework/submissions/${id}/review/`, {
        status, coach_feedback: feedback[id] || (status === 'approved' ? 'Good work!' : 'Please redo this.'), coach_score: status === 'approved' ? 100 : 0,
      });
      setMsg(status === 'approved' ? '✅ Approved! 200 XP awarded to student.' : '❌ Rejected and sent back.');
      loadData();
    } catch { setMsg('Action failed.'); }
    setTimeout(() => setMsg(''), 4000);
  };

  const filtered = submissions.filter(s => filterStatus === 'all' || s.status === filterStatus);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
          <ClipboardList className="text-primary w-5 h-5" /> Homework Review Queue
        </h2>
        <p className="text-xs text-muted mt-0.5">Review and grade student homework submissions</p>
      </div>

      {msg && <div className="p-3 bg-secondary/10 border border-secondary/30 text-secondary text-xs rounded-xl">{msg}</div>}

      <div className="flex gap-2">
        {['all', 'pending_review', 'approved', 'rejected'].map(st => (
          <button key={st} onClick={() => setFilterStatus(st)}
            className={`px-4 py-1.5 rounded-xl text-[10px] font-bold capitalize transition ${filterStatus === st ? 'bg-primary text-white' : 'border border-border text-muted hover:text-foreground'}`}>
            {st.replace('_', ' ')} ({submissions.filter(s => st === 'all' || s.status === st).length})
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="glass p-10 rounded-3xl border-border text-center text-muted text-sm">
            No submissions in this category.
          </div>
        ) : filtered.map(sub => (
          <div key={sub.id} className="glass p-5 rounded-2xl border-border space-y-3">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <p className="font-bold text-white text-sm">{sub.assignment.homework.title}</p>
                <p className="text-[10px] text-muted mt-0.5">
                  Student: {sub.assignment.student.user.first_name} {sub.assignment.student.user.last_name} ·
                  Submitted: {new Date(sub.submitted_at).toLocaleDateString()}
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold capitalize ${
                sub.status === 'approved' ? 'bg-green-500/10 text-green-400' :
                sub.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                'bg-yellow-500/10 text-yellow-400'
              }`}>{sub.status.replace('_', ' ')}</span>
            </div>

            {sub.submission_notes && (
              <div className="p-3 bg-background/50 border border-border rounded-xl">
                <p className="text-[9px] text-muted font-bold uppercase tracking-wider mb-1">Student Notes</p>
                <p className="text-xs text-foreground">{sub.submission_notes}</p>
              </div>
            )}

            {sub.status === 'pending_review' && (
              <div className="space-y-2">
                <textarea
                  placeholder="Add feedback for the student..."
                  rows={2}
                  value={feedback[sub.id] || ''}
                  onChange={e => setFeedback({ ...feedback, [sub.id]: e.target.value })}
                  className="w-full px-3 py-2 bg-background/50 border border-border rounded-xl text-xs text-foreground placeholder:text-muted/60 focus:outline-none resize-none" />
                <div className="flex gap-2 justify-end">
                  {sub.drive_file_id && (
                    <a href={`http://localhost:8000/api/v1/homework/submissions/${sub.id}/download/`} target="_blank"
                      className="px-3 py-1.5 border border-border text-muted rounded-xl text-[10px] font-bold hover:text-white transition flex items-center gap-1">
                      <Eye className="w-3 h-3" /> View PDF
                    </a>
                  )}
                  <button onClick={() => review(sub.id, 'rejected')}
                    className="px-3 py-1.5 border border-red-500/30 text-red-400 rounded-xl text-[10px] font-bold hover:bg-red-500/10 transition flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Reject
                  </button>
                  <button onClick={() => review(sub.id, 'approved')}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-xl text-[10px] font-bold transition flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Approve (+200 XP)
                  </button>
                </div>
              </div>
            )}

            {sub.coach_feedback && (
              <div className="p-3 bg-background/50 border border-border rounded-xl">
                <p className="text-[9px] text-muted font-bold uppercase tracking-wider mb-1">Coach Feedback</p>
                <p className="text-xs text-foreground">{sub.coach_feedback}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
