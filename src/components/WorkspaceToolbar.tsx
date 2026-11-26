import {
  Bell,
  BellOff,
  Calendar,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Trash2,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import type { WsStatus } from '../hooks/useQuakeFeed';
import { formatDisplayYmd } from '../utils/archiveApi';
import { type AppLanguage, getMessages } from '../utils/i18n';

interface WorkspaceToolbarProps {
  lang: AppLanguage;
  wsStatus: WsStatus;
  autoUpdateEnabled: boolean;
  onToggleAutoUpdate: () => void;
  pollIntervalSec: number;
  onChangePollInterval: (sec: number) => void;
  nextRefreshIn: number;
  lastUpdated: Date | null;
  isRefreshing: boolean;
  onRefreshNow: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  notificationEnabled: boolean;
  onToggleNotification: () => void;
  notificationHint: string | null;
  onDismissNotificationHint: () => void;
  onQuickTestEEW: () => void;
  hasTestRecords: boolean;
  onClearTestRecords: () => void;
  archiveDate: string | null;
  onExitArchiveMode: () => void;
}

function formatClockTime(date: Date | null): string {
  if (!date) return '--:--:--';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function WorkspaceToolbar({
  lang,
  wsStatus,
  autoUpdateEnabled,
  onToggleAutoUpdate,
  pollIntervalSec,
  onChangePollInterval,
  nextRefreshIn,
  lastUpdated,
  isRefreshing,
  onRefreshNow,
  soundEnabled,
  onToggleSound,
  notificationEnabled,
  onToggleNotification,
  notificationHint,
  onDismissNotificationHint,
  onQuickTestEEW,
  hasTestRecords,
  onClearTestRecords,
  archiveDate,
  onExitArchiveMode,
}: WorkspaceToolbarProps) {
  const m = getMessages(lang);

  const wsLabel =
    wsStatus === 'connected'
      ? m.toolbar.wsConnected
      : wsStatus === 'connecting'
      ? m.toolbar.wsConnecting
      : wsStatus === 'reconnecting'
      ? m.toolbar.wsReconnecting
      : m.toolbar.wsOffline;

  const wsTone =
    wsStatus === 'connected'
      ? 'text-emerald-700 dark:text-emerald-400'
      : wsStatus === 'offline'
      ? 'text-slate-600 dark:text-slate-400'
      : 'text-amber-700 dark:text-amber-400';

  return (
    <section
      aria-label={m.settings.opsTitle}
      className="border-b border-[var(--nein-border)] bg-[var(--nein-surface)] transition-colors"
    >
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          <div className="flex items-center gap-2 font-medium">
            <span
              aria-hidden="true"
              className={`inline-block h-2 w-2 rounded-full ${
                wsStatus === 'connected'
                  ? 'bg-emerald-500 dark:bg-emerald-400'
                  : wsStatus === 'offline'
                  ? 'bg-slate-400 dark:bg-slate-500'
                  : 'bg-amber-500 dark:bg-amber-400'
              }`}
            />
            <span className={wsTone}>{wsLabel}</span>
          </div>

          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
            /
          </span>

          {archiveDate ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 font-mono text-[var(--nein-accent-text)] tabular-nums">
                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                {m.toolbar.archiveLabel}: {formatDisplayYmd(archiveDate)}
              </span>
              <button
                type="button"
                onClick={onExitArchiveMode}
                className="inline-flex items-center gap-1 rounded border border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--nein-accent-text)] hover:opacity-85 cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                <span>{m.toolbar.backToLatest}</span>
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-mono tabular-nums">
                <span>{m.toolbar.lastUpdated}</span>
                <span className="text-slate-900 dark:text-slate-200 font-medium">
                  {formatClockTime(lastUpdated)}
                </span>
              </div>

              {autoUpdateEnabled && (
                <>
                  <span aria-hidden="true" className="text-slate-300 dark:text-slate-700 hidden sm:inline">
                    /
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 font-mono tabular-nums hidden sm:inline">
                    {m.toolbar.nextAutoFetch}{' '}
                    <strong className="text-[var(--nein-accent-text)] font-semibold">
                      {nextRefreshIn}s
                    </strong>
                  </span>
                </>
              )}
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onQuickTestEEW}
            className="inline-flex items-center gap-1.5 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-500/20 dark:text-red-200 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
          >
            <Zap className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{m.toolbar.quickTestEew}</span>
          </button>

          {hasTestRecords && (
            <button
              type="button"
              onClick={onClearTestRecords}
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--nein-border)] bg-[var(--nein-sub)] px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-700 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nein-accent)]"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{m.toolbar.clearTests}</span>
            </button>
          )}

          <div className="flex items-center rounded-md border border-[var(--nein-border)] bg-[var(--nein-sub)] p-0.5">
            <button
              type="button"
              onClick={onToggleAutoUpdate}
              aria-pressed={autoUpdateEnabled}
              className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--nein-accent)] ${
                autoUpdateEnabled
                  ? 'bg-[var(--nein-accent-soft)] text-[var(--nein-accent-text)]'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {autoUpdateEnabled ? (
                <Pause className="h-3 w-3" aria-hidden="true" />
              ) : (
                <Play className="h-3 w-3" aria-hidden="true" />
              )}
              <span>{autoUpdateEnabled ? m.toolbar.autoOn : m.toolbar.autoOff}</span>
            </button>

            <label htmlFor="poll-interval-select" className="sr-only">
              {m.settings.pollingTitle}
            </label>
            <select
              id="poll-interval-select"
              value={pollIntervalSec}
              onChange={(e) => onChangePollInterval(Number(e.target.value))}
              disabled={!autoUpdateEnabled}
              className="bg-transparent px-2 py-1 text-xs font-mono tabular-nums text-slate-800 dark:text-slate-300 focus:outline-none disabled:opacity-40 cursor-pointer"
            >
              <option value={10} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
                10{m.toolbar.intervalUnitSec}
              </option>
              <option value={30} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
                30{m.toolbar.intervalUnitSec}
              </option>
              <option value={60} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
                60{m.toolbar.intervalUnitSec}
              </option>
            </select>
          </div>

          <button
            type="button"
            onClick={onToggleSound}
            aria-pressed={soundEnabled}
            aria-label={m.settings.soundTitle}
            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nein-accent)] ${
              soundEnabled
                ? 'border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-800 hover:bg-slate-200/70 dark:text-slate-200 dark:hover:bg-slate-800'
                : 'border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            {soundEnabled ? (
              <Volume2 className="h-3.5 w-3.5 text-[var(--nein-accent-text)]" aria-hidden="true" />
            ) : (
              <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">
              {soundEnabled ? m.toolbar.soundOn : m.toolbar.soundOff}
            </span>
          </button>

          <button
            type="button"
            role="switch"
            aria-checked={notificationEnabled}
            data-testid="eew-notification-switch"
            onClick={onToggleNotification}
            aria-label={m.settings.pushTitle}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nein-accent)] ${
              notificationEnabled
                ? 'border-emerald-600/40 bg-emerald-500/15 text-emerald-800 hover:bg-emerald-500/20 dark:border-emerald-500/40 dark:text-emerald-200'
                : 'border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-700 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {notificationEnabled ? (
              <Bell className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            ) : (
              <BellOff className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
            )}
            <span>{notificationEnabled ? m.toolbar.notifyOn : m.toolbar.notifyOff}</span>
            <span
              aria-hidden="true"
              className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                notificationEnabled ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  notificationEnabled ? 'translate-x-3.5' : 'translate-x-0.5'
                }`}
              />
            </span>
          </button>

          <button
            type="button"
            onClick={onRefreshNow}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--nein-border)] bg-[var(--nein-sub)] px-3 py-1.5 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-200/70 disabled:opacity-60 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nein-accent)]"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>{isRefreshing ? m.toolbar.refreshing : m.toolbar.refreshNow}</span>
          </button>
        </div>
      </div>

      {notificationHint && (
        <div
          role="status"
          data-testid="notification-hint-banner"
          className="border-t border-amber-500/25 bg-amber-100/80 dark:bg-amber-950/30"
        >
          <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-1.5 text-xs text-amber-900 dark:text-amber-200 sm:px-6">
            <span>{notificationHint}</span>
            <button
              type="button"
              onClick={onDismissNotificationHint}
              aria-label={m.eewModal.closeBtn}
              className="rounded p-0.5 text-amber-800 hover:text-amber-950 dark:text-amber-300/80 dark:hover:text-amber-100 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
