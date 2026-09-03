import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { clearLibraryDB } from '../utils/audioStorage';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends (Component as any) {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetAndReload = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        await clearLibraryDB().catch(() => {});
        if ('caches' in window) {
          const keys = await caches.keys();
          for (const key of keys) {
            await caches.delete(key);
          }
        }
      }
    } catch (e) {
      console.warn('Reset error:', e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050507] text-[#e0e0e0] flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl border border-rose-500/20 bg-white/5 backdrop-blur-2xl shadow-2xl text-center space-y-5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-white font-urdu">
                ایپ لوڈ کرنے میں رکاوٹ آئی
              </h1>
              <h2 className="text-sm font-semibold text-white/90">
                Application Encountered an Error
              </h2>
              <p className="text-xs text-white/60 leading-relaxed font-urdu">
                براہ کرم ایپ کو دوبارہ لوڈ کریں یا کیشے صاف کر کے دوبارہ کوشش کریں۔
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-black/50 border border-white/10 text-left text-[11px] text-rose-300 font-mono overflow-x-auto max-h-24">
                {this.state.error.message || 'Unknown error occurred'}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/25"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>دوبارہ کوشش کریں (Reload)</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetAndReload}
                className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer border border-white/10"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>کیشے صاف کریں (Reset)</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
