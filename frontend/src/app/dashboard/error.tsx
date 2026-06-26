'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, FileText, Home, Copy, Check } from 'lucide-react';
import { captureException } from '@/utils/errorTracking';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    captureException(error, { digest: error.digest, context: 'dashboard' });
  }, [error]);

  const handleCopyLog = () => {
    const logText = `Dashboard Error: ${error.message}\nDigest: ${error.digest || 'N/A'}\nStack: ${error.stack || 'N/A'}`;
    navigator.clipboard.writeText(logText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 md:p-12 text-left">
      <div className="w-full max-w-2xl glass p-8 rounded-3xl border border-red-500/10 shadow-xl backdrop-blur-md">
        
        {/* Error Header */}
        <div className="flex items-start gap-4 mb-6 border-b border-border pb-6">
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 shrink-0">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[9px] bg-red-500/10 border border-red-500/20 text-red-400 font-extrabold uppercase tracking-wider px-2 py-0.5 rounded">
              Subsystem Failure
            </span>
            <h2 className="text-lg font-extrabold text-white mt-1.5">Dashboard Subsystem Crashed</h2>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              We encountered an exception loading dashboard widget components.
            </p>
          </div>
        </div>

        {/* Display Message */}
        <div className="p-4 bg-background/50 border border-border rounded-2xl mb-6">
          <p className="text-xs font-bold text-red-400 font-sans">Diagnostics details:</p>
          <code className="text-xs font-mono text-slate-300 mt-1 block select-all whitespace-pre-wrap leading-relaxed">
            {error.message || 'Unknown dashboard render exception.'}
          </code>
        </div>

        {/* Action Panel */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch">
          <button
            onClick={() => reset()}
            className="flex-1 py-2.5 px-4 bg-primary text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:opacity-90 transition shadow-lg shadow-primary/10"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reload Subsystem
          </button>

          <button
            onClick={handleCopyLog}
            className="py-2.5 px-4 bg-background/50 border border-border hover:border-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <FileText className="w-3.5 h-3.5" />}
            Copy Error Details
          </button>

          <button
            onClick={() => window.location.href = '/'}
            className="py-2.5 px-4 bg-background/50 border border-border hover:border-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
          >
            <Home className="w-3.5 h-3.5" />
            Academy Home
          </button>
        </div>
      </div>
    </div>
  );
}
