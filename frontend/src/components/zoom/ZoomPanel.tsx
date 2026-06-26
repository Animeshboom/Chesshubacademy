'use client';
import React, { useEffect, useRef, useState } from 'react';

interface ZoomPanelProps {
  meetingNumber: string;
  signature: string;
  sdkKey: string;
  userName: string;
  userEmail: string;
  passWord?: string;
  role: number;
}

export default function ZoomPanel({
  meetingNumber,
  signature,
  sdkKey,
  userName,
  userEmail,
  passWord = '',
  role,
}: ZoomPanelProps) {
  const [error, setError] = useState('');
  const [joined, setJoined] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<any>(null);

  useEffect(() => {
    let active = true;

    async function initZoom() {
      try {
        const ZoomMtgEmbedded = (await import('@zoom/meetingsdk/embedded')).default;
        
        if (!active) return;
        if (!containerRef.current) return;

        const client = ZoomMtgEmbedded.createClient();
        clientRef.current = client;

        await client.init({
          zoomAppHeader: false,
          language: 'en-US',
          customize: {
            meetingInfo: [
              'topic',
              'host',
              'participant',
            ]
          }
        });

        if (!active) return;

        await client.join({
          sdkKey: sdkKey,
          signature: signature,
          meetingNumber: meetingNumber,
          password: passWord,
          userName: userName,
          userEmail: userEmail,
          tk: '',
          container: containerRef.current
        });

        if (active) setJoined(true);
      } catch (err: any) {
        console.error("Zoom SDK Error:", err);
        if (active) setError(err.message || 'Failed to join Zoom Meeting via Embedded SDK');
      }
    }

    initZoom();

    return () => {
      active = false;
      if (clientRef.current) {
        try {
          clientRef.current.leave();
        } catch (e) {
          console.error("Error leaving Zoom:", e);
        }
      }
    };
  }, [meetingNumber, signature, sdkKey, userName, userEmail, passWord, role]);

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center text-rose-400">
        <p className="text-sm font-bold">Failed to load embedded video call</p>
        <p className="text-[10px] mt-1 opacity-80">{error}</p>
        <div className="mt-4 text-xs text-slate-400">
          Please check your Zoom settings or fallback to the external launch option.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative min-h-[400px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800/80 flex flex-col">
      {!joined && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 z-10 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-450 border-t-transparent animate-spin" />
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Connecting Video Call...</p>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full flex-1" style={{ minHeight: '400px' }} />
    </div>
  );
}
