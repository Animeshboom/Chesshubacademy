'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    // Connect to external trackers like Sentry or LogRocket if present
    if (typeof window !== 'undefined') {
      const win = window as any;
      if (win.Sentry) {
        win.Sentry.captureException(error, { extra: errorInfo });
      }
      if (win.LogRocket) {
        win.LogRocket.captureException(error);
      }
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] w-full flex items-center justify-center p-6 bg-card/25 border border-border/40 rounded-3xl backdrop-blur-md shadow-2xl text-center">
          <div className="max-w-md space-y-6">
            <div className="inline-flex p-4 rounded-full bg-red-500/10 border border-red-500/20 text-red-500">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Something went wrong</h3>
              <p className="text-xs text-muted leading-relaxed">
                An unexpected error occurred in this application module. We have logged this issue and our team is investigating.
              </p>
              {this.state.error && (
                <pre className="mt-2 p-3 bg-[#02040a] border border-border text-[10px] text-red-400 font-mono rounded-lg max-h-32 overflow-auto text-left">
                  {this.state.error.toString()}
                </pre>
              )}
            </div>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 py-2.5 px-6 bg-primary hover:bg-secondary border border-border rounded-xl transition text-xs font-bold text-white uppercase tracking-wider"
            >
              <RefreshCw className="w-4 h-4" /> Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
