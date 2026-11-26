import { AlertTriangle, RefreshCw, ServerCrash } from 'lucide-react';
import type { FeedHealthStatus, SourceHealthRecord } from '../../types/disaster';
import type { AppLanguage } from '../../utils/i18n';
import { getExtendedMessages } from '../../utils/i18nExtended';
import { formatJstClock, formatJstTimestamp } from '../../utils/weatherParser';

interface SystemStatusPanelProps {
  lang: AppLanguage;
  sources: SourceHealthRecord[];
  onRecheckAll: () => void;
}

const STATUS_STYLE: Record<FeedHealthStatus, string> = {
  normal: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/40 dark:text-emerald-300',
  connecting: 'bg-sky-500/15 text-sky-700 border-sky-500/40 dark:text-sky-300',
  updating: 'bg-sky-500/15 text-sky-700 border-sky-500/40 dark:text-sky-300',
  delayed: 'bg-amber-500/15 text-amber-800 border-amber-500/50 dark:text-amber-300',
  disconnected: 'bg-red-500/15 text-red-700 border-red-500/50 dark:text-red-300',
  fetch_failed: 'bg-red-500/15 text-red-700 border-red-500/50 dark:text-red-300',
  unfetched: 'bg-slate-500/15 text-slate-700 border-slate-500/40 dark:text-slate-300',
  unsupported: 'bg-amber-500/15 text-amber-800 border-amber-500/50 dark:text-amber-200',
  maintenance: 'bg-purple-500/15 text-purple-700 border-purple-500/40 dark:text-purple-300',
  expired: 'bg-amber-500/15 text-amber-800 border-amber-500/50 dark:text-amber-300',
};

export function SystemStatusPanel({
  lang,
  sources,
  onRecheckAll,
}: SystemStatusPanelProps) {
  const ext = getExtendedMessages(lang);

  return (
    <section
      aria-label={ext.statusPanel.title}
      data-testid="system-status-panel"
      className="rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)] p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--nein-border-subtle)] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <ServerCrash className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              {ext.statusPanel.title}
            </h1>
          </div>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
            {ext.statusPanel.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={onRecheckAll}
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--nein-accent-text)] cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{ext.statusPanel.recheckAll}</span>
        </button>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/60 bg-amber-500/10 p-3 text-xs text-amber-950 dark:text-amber-100">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        <span>{ext.statusPanel.noSafeFallbackWarning}</span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[780px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-[var(--nein-border)] text-[11px] text-slate-500 dark:text-slate-400">
              <th className="py-2 pr-3 font-semibold">{ext.statusPanel.colSource}</th>
              <th className="py-2 px-2 font-semibold">{ext.statusPanel.colStatus}</th>
              <th className="py-2 px-2 font-semibold">{ext.statusPanel.colPublished}</th>
              <th className="py-2 px-2 font-semibold">{ext.statusPanel.colFetched}</th>
              <th className="py-2 px-2 font-semibold">{ext.statusPanel.colInterval}</th>
              <th className="py-2 pl-2 font-semibold">{ext.statusPanel.colLatency}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--nein-border-subtle)]">
            {sources.map((src) => (
              <tr key={src.id} className="align-top">
                <td className="py-2.5 pr-3">
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    {src.name[lang]}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {src.provider} ·{' '}
                    <a
                      href={src.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--nein-accent-text)] hover:underline"
                    >
                      {ext.common.openOfficialSite}
                    </a>
                  </div>
                  {src.errorMessage && (
                    <div className="mt-1 text-[11px] font-medium text-red-600 dark:text-red-400">
                      {src.errorMessage}
                    </div>
                  )}
                  {src.note && (
                    <div className="mt-1 text-[11px] text-amber-800 dark:text-amber-200">
                      {src.note[lang]}
                    </div>
                  )}
                </td>
                <td className="py-2.5 px-2 whitespace-nowrap">
                  <span
                    className={`inline-block rounded border px-2 py-0.5 text-[11px] font-bold ${STATUS_STYLE[src.status]}`}
                  >
                    {ext.statusLabels[src.status]}
                  </span>
                </td>
                <td className="py-2.5 px-2 font-mono text-[11px] text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  {src.publishedAt ? formatJstTimestamp(src.publishedAt) : '--'}
                </td>
                <td className="py-2.5 px-2 font-mono text-[11px] text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  {src.lastFetchedAt ? `${formatJstClock(src.lastFetchedAt)} JST` : '--'}
                </td>
                <td className="py-2.5 px-2 font-mono text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  {src.intervalSec ? `${src.intervalSec}s` : 'Event'}
                </td>
                <td className="py-2.5 pl-2 font-mono text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  {src.latencyMs !== null ? `${src.latencyMs}ms` : '--'}
                  {src.cacheHit ? ` (${ext.common.cacheHit})` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
