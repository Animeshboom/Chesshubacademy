'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, ChevronRight, FileText, ArrowLeft, Copy, Check } from 'lucide-react';
import { captureException } from '@/utils/errorTracking';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Log exception to our Sentry / LogRocket channel
    captureException(error, { digest: error.digest });
  }, [error]);

  const handleCopyLog = () => {
    const logText = `Error: ${error.message}\nDigest: ${error.digest || 'N/A'}\nStack: ${error.stack || 'N/A'}`;
    navigator.clipboard.writeText(logText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#060814] flex items-center justify-center p-6 text-left font-sans">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.04),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.03),transparent_40%)] pointer-events-none" />

      <div className="w-full max-w-xl glass p-8 rounded-3xl border border-red-500/10 shadow-2xl relative z-10 backdrop-blur-xl">
        {/* Header Warning Icon */}
        <div className="flex items-center gap-4 border-b border-slate-800/80 pb-6 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 animate-pulse">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-red-400 font-extrabold uppercase tracking-widest bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
              System Exception Captured
            </span>
            <h1 className="text-xl font-black text-white mt-1">ChessHub Academy Runtime Error</h1>
          </div>
        </div>

        {/* Error Info Box */}
        <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4 mb-6">
          <p className="text-xs font-bold text-red-400">Error Description:</p>
          <p className="text-sm font-semibold text-slate-200 mt-1 leading-relaxed">
            {error.message || 'An unexpected runtime error occurred on this page.'}
          </p>
          {error.digest && (
            <p className="text-[10px] text-slate-500 mt-2 font-mono">Digest ID: {error.digest}</p>
          )}
        </div>

        <p className="text-xs text-muted mb-6 leading-relaxed">
          Don't worry, your learning progress and chess stats have been preserved. You can try refreshing the section or report this log to the academy developers.
        </p>

        {/* Buttons Panel */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button
            onClick={() => reset()}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-amber-500 hover:opacity-90 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-red-500/10"
          >
            <RefreshCw className="w-4 h-4 animate-spin-reverse" />
            Retry Segment
          </button>
          
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="flex-1 py-3 px-4 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to Dashboard
          </button>
        </div>

        {/* Advanced Log Inspector */}
        <div className="border-t border-slate-800/80 pt-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-between w-full text-xs text-slate-400 hover:text-white font-bold transition"
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              Developer Exception Details
            </span>
            <ChevronRight className={`w-4 h-4 transition ${showDetails ? 'rotate-90' : ''}`} />
          </button>

          {showDetails && (
            <div className="mt-3 relative">
              <pre className="p-4 bg-slate-950/80 border border-slate-850 rounded-xl text-[10px] font-mono text-slate-400 overflow-x-auto max-h-48 whitespace-pre-wrap select-all">
                {error.stack || `${error.name}: ${error.message}`}
              </pre>
              <button
                onClick={handleCopyLog}
                className="absolute top-2 right-2 p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition"
                title="Copy log to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
