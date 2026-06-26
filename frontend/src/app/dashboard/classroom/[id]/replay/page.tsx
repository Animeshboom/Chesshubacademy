'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/utils/api';
import ChessBoard from '@/components/chess/ChessBoard';
import { Play, Pause, SkipBack, SkipForward, ArrowLeft, Clock, MessageSquare, ShieldAlert, Trophy } from 'lucide-react';

interface EventLog {
  id: string;
  event_type: string;
  event_data: any;
  timestamp: string;
  actor_name: string;
}

export default function SessionReplay() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [session, setSession] = useState<any>(null);
  const [events, setEvents] = useState<EventLog[]>([]);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchReplayData = async () => {
      try {
        const [sessRes, eventsRes] = await Promise.all([
          api.get(`/academy/sessions/${id}/`),
          api.get(`/classroom/sessions/${id}/replay/`)
        ]);
        setSession(sessRes.data);
        
        // Filter out irrelevant socket events, focusing on moves and chat
        const filteredEvents = eventsRes.data.filter((e: EventLog) => 
          ['board_move', 'chat_message', 'board_reset', 'board_clear_annotations', 'draw_annotation'].includes(e.event_type)
        );
        setEvents(filteredEvents);
        if (filteredEvents.length > 0) {
          setCurrentIdx(0);
        }
      } catch (err) {
        console.error('Failed to load replay data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReplayData();
  }, [id]);

  // Compute active FEN at current index
  const activeFen = useMemo(() => {
    if (currentIdx < 0 || events.length === 0) {
      return session?.board_state?.initial_fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    }
    // Scan backward to find the latest move FEN
    for (let i = currentIdx; i >= 0; i--) {
      const e = events[i];
      if (e.event_type === 'board_move' && e.event_data?.fen) {
        return e.event_data.fen;
      }
      if (e.event_type === 'board_reset') {
        return e.event_data?.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      }
    }
    return session?.board_state?.initial_fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  }, [events, currentIdx, session]);

  // Autoplay intervals
  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentIdx(prev => {
          if (prev >= events.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, events]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-12 text-muted max-w-md mx-auto space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="text-md font-bold text-white">Replay Room Offline</h3>
        <p className="text-xs">No session matching that identifier could be fetched from the database.</p>
        <button onClick={() => router.back()} className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold">Go Back</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 border border-border rounded-xl text-muted hover:text-white transition">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-lg font-extrabold text-white">{session.title} — Replay Mode</h2>
            <p className="text-xs text-muted mt-0.5">Recorded on {new Date(session.scheduled_start).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Chessboard (Left 65%) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="glass p-5 rounded-3xl border-border flex flex-col items-center">
            <ChessBoard
              key={currentIdx}
              initialFen={activeFen}
              interactive={false}
            />

            {/* Timeline controller */}
            {events.length > 0 && (
              <div className="w-full mt-6 space-y-4">
                <input
                  type="range"
                  min="0"
                  max={events.length - 1}
                  value={currentIdx}
                  onChange={e => {
                    setIsPlaying(false);
                    setCurrentIdx(parseInt(e.target.value));
                  }}
                  className="w-full accent-primary bg-border h-1 rounded-lg appearance-none cursor-pointer"
                />

                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted">Event {currentIdx + 1} of {events.length}</span>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setIsPlaying(false);
                        setCurrentIdx(prev => Math.max(0, prev - 1));
                      }}
                      disabled={currentIdx <= 0}
                      className="p-2 bg-background hover:bg-border/30 rounded-lg border border-border text-white disabled:opacity-50"
                    >
                      <SkipBack className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="p-2 bg-primary hover:bg-primary/90 rounded-lg text-white font-bold"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => {
                        setIsPlaying(false);
                        setCurrentIdx(prev => Math.min(events.length - 1, prev + 1));
                      }}
                      disabled={currentIdx >= events.length - 1}
                      className="p-2 bg-background hover:bg-border/30 rounded-lg border border-border text-white disabled:opacity-50"
                    >
                      <SkipForward className="w-4 h-4" />
                    </button>
                  </div>

                  <span className="text-muted">
                    {events[currentIdx] ? new Date(events[currentIdx].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar logs (Right 35%) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass p-5 rounded-3xl border-border h-[520px] flex flex-col">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 border-b border-border/60 pb-3">
              <Clock className="text-primary w-4 h-4" /> Live Replay Timeline
            </h3>

            <div className="flex-1 overflow-y-auto space-y-2 mt-3 pr-1">
              {events.length === 0 ? (
                <p className="text-xs text-muted text-center py-12">No event sequences logged for this classroom session.</p>
              ) : (
                events.map((e, idx) => {
                  const isActive = idx === currentIdx;
                  return (
                    <button
                      key={e.id}
                      onClick={() => {
                        setIsPlaying(false);
                        setCurrentIdx(idx);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl border transition flex gap-2 items-start text-xs ${
                        isActive 
                          ? 'bg-primary/10 border-primary text-white font-bold' 
                          : 'bg-background/40 border-border text-muted hover:border-border/80'
                      }`}
                    >
                      {e.event_type === 'board_move' && (
                        <>
                          <Trophy className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className="text-white">Move Played</p>
                            <p className="text-[10px] text-muted truncate">
                              {e.actor_name}: {e.event_data?.move?.san || e.event_data?.move?.from + '→' + e.event_data?.move?.to}
                            </p>
                          </div>
                        </>
                      )}
                      {e.event_type === 'chat_message' && (
                        <>
                          <MessageSquare className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className="text-white">Chat message</p>
                            <p className="text-[10px] text-muted truncate italic">
                              "{e.event_data?.text || e.event_data?.message}"
                            </p>
                          </div>
                        </>
                      )}
                      {e.event_type === 'board_reset' && (
                        <>
                          <ShieldAlert className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className="text-white">Board Reset</p>
                            <p className="text-[10px] text-muted truncate">Reset to default by {e.actor_name}</p>
                          </div>
                        </>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
