import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { BGM_SETTINGS_STORAGE_KEY } from '../utils/bgmManager';
import {
  BACKGROUND_MOTION_STORAGE_KEY,
  COLOR_THEME_STORAGE_KEY,
  THEME_MODE_STORAGE_KEY,
} from '../utils/themeSettings';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'Unexpected rendering error',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[NEiN] Uncaught UI error:', error, info.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetAndReload = () => {
    try {
      window.localStorage.removeItem(THEME_MODE_STORAGE_KEY);
      window.localStorage.removeItem(COLOR_THEME_STORAGE_KEY);
      window.localStorage.removeItem(BACKGROUND_MOTION_STORAGE_KEY);
      window.localStorage.removeItem(BGM_SETTINGS_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        role="alert"
        className="flex min-h-screen flex-col items-center justify-center bg-[var(--nein-canvas)] px-4 py-10 text-slate-900 dark:text-slate-100"
      >
        <div className="w-full max-w-md rounded-lg border border-[var(--nein-border)] bg-[var(--nein-surface)] p-6 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-lg font-bold">NEiN — 表示エラーが発生しました</h1>
          <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            画面の描画中に予期しないエラーが発生しました。再読み込みしても解消しない場合は、外観設定を初期化して再起動してください。
          </p>
          {this.state.message && (
            <p className="mt-3 rounded border border-[var(--nein-border-subtle)] bg-[var(--nein-sub)] px-3 py-2 font-mono text-[11px] text-slate-600 dark:text-slate-400 break-all">
              {this.state.message}
            </p>
          )}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center gap-1.5 rounded-md bg-[var(--nein-accent)] px-4 py-2 text-xs font-semibold text-[var(--nein-accent-contrast)] cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>再読み込み</span>
            </button>
            <button
              type="button"
              onClick={this.handleResetAndReload}
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--nein-border)] bg-[var(--nein-sub)] px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <span>外観設定を初期化して再起動</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
}
