import { History } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { UnifiedTimelineEvent } from '../../types/disaster';
import type { AppLanguage } from '../../utils/i18n';
import { getExtendedMessages } from '../../utils/i18nExtended';
import { formatJstTimestamp } from '../../utils/weatherParser';
import { RawTextDrawer } from '../RawTextDrawer';

interface DisasterTimelineViewProps {
  lang: AppLanguage;
  events: UnifiedTimelineEvent[];
  onNavigate: (view: string) => void;
}

export function DisasterTimelineView({
  lang,
  events,
  onNavigate,
}: DisasterTimelineViewProps) {
  const ext = getExtendedMessages(lang);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    if (categoryFilter === 'all') return events;
    return events.filter((e) => e.category === categoryFilter);
  }, [categoryFilter, events]);

  const categories = [
    { id: 'all', label: ext.timeline.allCategories },
    { id: 'eew', label: ext.notifyExt.categories.eew },
    { id: 'quake', label: ext.notifyExt.categories.quake },
    { id: 'tsunami', label: ext.notifyExt.categories.tsunami },
    { id: 'weather_warning', label: ext.notifyExt.categories.weather_warning },
    { id: 'typhoon', label: ext.notifyExt.categories.typhoon },
    { id: 'landslide_flood', label: ext.notifyExt.categories.landslide_flood },
    { id: 'volcano', label: ext.notifyExt.categories.volcano },
  ];

  return (
    <section
      aria-label={ext.timeline.title}
      className="rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)] p-4 sm:p-5"
    >
      <div className="border-b border-[var(--nein-border-subtle)] pb-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50">
            {ext.timeline.title}
          </h1>
        </div>
        <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
          {ext.timeline.subtitle}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategoryFilter(cat.id)}
            className={`rounded-md border px-2.5 py-1 text-xs font-semibold cursor-pointer ${
              categoryFilter === cat.id
                ? 'border-[var(--nein-accent)] bg-[var(--nein-accent)] text-[var(--nein-accent-contrast)]'
                : 'border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-700 dark:text-slate-300'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2.5">
        {filtered.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">{ext.timeline.empty}</p>
        ) : (
          filtered.slice(0, 80).map((ev) => {
            const borderTone =
              ev.severity === 'critical'
                ? 'border-red-500/80 bg-red-500/10'
                : ev.severity === 'warning'
                ? 'border-amber-500/70 bg-amber-500/10'
                : 'border-[var(--nein-border)] bg-[var(--nein-sub)]';

            return (
              <div key={ev.id} className={`rounded-lg border p-3 text-xs ${borderTone}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded border border-[var(--nein-border)] bg-[var(--nein-surface)] px-1.5 py-0.5 font-mono text-[10px] font-semibold">
                      {ev.sourceName}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{ev.title}</span>
                    {ev.isTest && (
                      <span className="rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-extrabold text-slate-950">
                        {ext.common.testSimulationWarning}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[11px] text-slate-500">
                    {ev.timestampIso ? formatJstTimestamp(ev.timestampIso) : '--'}
                  </span>
                </div>

                {ev.summary && (
                  <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">{ev.summary}</p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {ev.jumpView && (
                    <button
                      type="button"
                      onClick={() => onNavigate(ev.jumpView!)}
                      className="text-[11px] font-semibold text-[var(--nein-accent-text)] hover:underline cursor-pointer"
                    >
                      {ext.common.viewDetails} →
                    </button>
                  )}
                </div>

                <RawTextDrawer
                  lang={lang}
                  rawText={`${ev.rawJapaneseTitle}\n${ev.summary}`}
                  officialUrl={ev.officialUrl}
                />
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
