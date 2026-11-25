import { Calendar, Pause, Play, RefreshCw, RotateCcw, Trash2, Volume2, VolumeX, Zap } from 'lucide-react';
import type { WsStatus } from '../hooks/useQuakeFeed';
import { formatDisplayYmd } from '../utils/archiveApi';

interface WorkspaceToolbarProps {
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
  onQuickTestEEW,
  hasTestRecords,
  onClearTestRecords,
  archiveDate,
  onExitArchiveMode,
}: WorkspaceToolbarProps) {
  const wsLabel =
    wsStatus === 'connected'
      ? 'リアルタイム受信中'
      : wsStatus === 'connecting'
      ? 'リアルタイム接続中'
      : wsStatus === 'reconnecting'
      ? '再接続中'
      : 'ポーリング待機';

  const wsTone =
    wsStatus === 'connected'
      ? 'text-emerald-400'
      : wsStatus === 'offline'
      ? 'text-slate-400'
      : 'text-amber-400';

  return (
    <section
      aria-label="リアルタイム更新設定"
      className="border-b border-slate-800/80 bg-[#0D131F]"
    >
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          <div className="flex items-center gap-2 font-medium">
            <span
              aria-hidden="true"
              className={`inline-block h-2 w-2 rounded-full ${
                wsStatus === 'connected'
                  ? 'bg-emerald-400'
                  : wsStatus === 'offline'
                  ? 'bg-slate-500'
                  : 'bg-amber-400'
              }`}
            />
            <span className={wsTone}>{wsLabel}</span>
          </div>

          <span aria-hidden="true" className="text-slate-700">
            /
          </span>

          {archiveDate ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 font-mono text-sky-300 tabular-nums">
                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                アーカイブ: {formatDisplayYmd(archiveDate)}
              </span>
              <button
                type="button"
                onClick={onExitArchiveMode}
                className="inline-flex items-center gap-1 rounded border border-sky-500/40 bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-200 hover:bg-sky-500/20 cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                <span>最新に戻る</span>
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-slate-400 font-mono tabular-nums">
                <span>最終更新</span>
                <span className="text-slate-200">{formatClockTime(lastUpdated)}</span>
              </div>

              {autoUpdateEnabled && (
                <>
                  <span aria-hidden="true" className="text-slate-700 hidden sm:inline">
                    /
                  </span>
                  <span className="text-slate-400 font-mono tabular-nums hidden sm:inline">
                    次回自動取得 <strong className="text-sky-300 font-semibold">{nextRefreshIn}s</strong>
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
            className="inline-flex items-center gap-1.5 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-200 transition-colors hover:bg-red-500/20 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400"
          >
            <Zap className="h-3.5 w-3.5" aria-hidden="true" />
            <span>即時テスト発報</span>
          </button>

          {hasTestRecords && (
            <button
              type="button"
              onClick={onClearTestRecords}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>テスト消去</span>
            </button>
          )}

          <div className="flex items-center rounded-md border border-slate-800 bg-[#090D16] p-0.5">
            <button
              type="button"
              onClick={onToggleAutoUpdate}
              aria-pressed={autoUpdateEnabled}
              className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-400 ${
                autoUpdateEnabled
                  ? 'bg-slate-800 text-sky-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {autoUpdateEnabled ? (
                <Pause className="h-3 w-3" aria-hidden="true" />
              ) : (
                <Play className="h-3 w-3" aria-hidden="true" />
              )}
              <span>{autoUpdateEnabled ? '自動更新 ON' : '自動更新 OFF'}</span>
            </button>

            <label htmlFor="poll-interval-select" className="sr-only">
              自動更新間隔
            </label>
            <select
              id="poll-interval-select"
              value={pollIntervalSec}
              onChange={(e) => onChangePollInterval(Number(e.target.value))}
              disabled={!autoUpdateEnabled}
              className="bg-transparent px-2 py-1 text-xs font-mono tabular-nums text-slate-300 focus:outline-none disabled:opacity-40 cursor-pointer"
            >
              <option value={10} className="bg-slate-900">
                10秒
              </option>
              <option value={30} className="bg-slate-900">
                30秒
              </option>
              <option value={60} className="bg-slate-900">
                60秒
              </option>
            </select>
          </div>

          <button
            type="button"
            onClick={onToggleSound}
            aria-pressed={soundEnabled}
            aria-label={soundEnabled ? '緊急地震速報の警報音をオフにする' : '緊急地震速報の警報音をオンにする'}
            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
              soundEnabled
                ? 'border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-800'
                : 'border-slate-800 bg-[#090D16] text-slate-500 hover:text-slate-300'
            }`}
          >
            {soundEnabled ? (
              <Volume2 className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
            ) : (
              <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">{soundEnabled ? '警報音 ON' : '警報音 OFF'}</span>
          </button>

          <button
            type="button"
            onClick={onRefreshNow}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 transition-colors hover:bg-slate-700 disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>{isRefreshing ? '更新中...' : '今すぐ更新'}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
