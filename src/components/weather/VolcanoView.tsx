import { Flame, RefreshCw, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { JmaXmlBulletin, VolcanoLocationEntry } from '../../types/disaster';
import type { AppLanguage } from '../../utils/i18n';
import { getExtendedMessages } from '../../utils/i18nExtended';
import { formatJstTimestamp } from '../../utils/weatherParser';
import { RawTextDrawer } from '../RawTextDrawer';

interface VolcanoViewProps {
  lang: AppLanguage;
  volcanoes: VolcanoLocationEntry[];
  xmlBulletins: JmaXmlBulletin[];
  onRefresh: () => void;
}

export function VolcanoView({
  lang,
  volcanoes,
  xmlBulletins,
  onRefresh,
}: VolcanoViewProps) {
  const ext = getExtendedMessages(lang);
  const [query, setQuery] = useState('');

  const volcanoBulletins = useMemo(
    () => xmlBulletins.filter((b) => b.category === 'volcano'),
    [xmlBulletins],
  );

  const filteredVolcanoes = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? volcanoes.filter(
          (v) =>
            v.nameJp.toLowerCase().includes(q) ||
            v.nameEn.toLowerCase().includes(q) ||
            v.code.includes(q),
        )
      : volcanoes;
    return [...list].sort((a, b) => (b.alertLevelNum ?? 0) - (a.alertLevelNum ?? 0));
  }, [query, volcanoes]);

  return (
    <div className="flex flex-col gap-5">
      {/* Header + Recent Bulletins */}
      <section
        aria-label={ext.volcano.title}
        className="rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)] p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--nein-border-subtle)] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" aria-hidden="true" />
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                {ext.volcano.title}
              </h1>
              <span className="rounded border border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] px-2 py-0.5 font-mono text-[11px] font-bold text-[var(--nein-accent-text)]">
                {ext.volcano.totalCount}: {volcanoes.length}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
              {ext.volcano.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1 rounded-md border border-[var(--nein-border)] bg-[var(--nein-sub)] px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-[var(--nein-accent-border)] dark:text-slate-200 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{ext.common.refresh}</span>
          </button>
        </div>

        <h2 className="mt-4 text-sm font-bold text-slate-900 dark:text-slate-100">
          {ext.volcano.activeBulletinsHeading} ({volcanoBulletins.length})
        </h2>

        {volcanoBulletins.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{ext.common.noData}</p>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {volcanoBulletins.slice(0, 12).map((b) => (
              <div
                key={b.id}
                className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {b.title}
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">
                    {b.updatedAt ? formatJstTimestamp(b.updatedAt) : '--'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">{b.headline}</p>
                <RawTextDrawer lang={lang} rawText={`${b.title}\n${b.headline}`} officialUrl={b.link} />
              </div>
            ))}
          </div>
        )}

        <p className="mt-3 text-[11px] text-slate-600 dark:text-slate-400">
          {ext.volcano.ashfallNote}
        </p>
      </section>

      {/* Searchable 120-Volcano Directory */}
      <section
        aria-label={ext.volcano.volcanoListHeading}
        className="rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)] p-4 sm:p-5"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--nein-border-subtle)] pb-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {ext.volcano.volcanoListHeading} ({filteredVolcanoes.length})
          </h2>
          <div className="relative w-full sm:w-72">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={ext.volcano.searchPlaceholder}
              className="w-full rounded-md border border-[var(--nein-border)] bg-[var(--nein-sub)] py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-500 focus:border-[var(--nein-accent)] focus:outline-none dark:text-slate-100"
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVolcanoes.slice(0, 90).map((v) => {
            const isElevated = (v.alertLevelNum ?? 0) >= 2;
            return (
              <div
                key={v.code}
                className={`rounded-lg border p-3 text-xs ${
                  isElevated
                    ? 'border-red-500/70 bg-red-500/10'
                    : 'border-[var(--nein-border)] bg-[var(--nein-sub)]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100">
                      {lang === 'en' ? `${v.nameEn} (${v.nameJp})` : v.nameJp}
                    </div>
                    <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                      #{v.code} · {v.lat.toFixed(2)}°N, {v.lon.toFixed(2)}°E
                    </div>
                  </div>
                  {v.alertLevelText && (
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold whitespace-nowrap ${
                        isElevated
                          ? 'bg-red-600 text-white'
                          : 'bg-amber-500/20 text-amber-800 dark:text-amber-200'
                      }`}
                    >
                      {v.alertLevelText}
                    </span>
                  )}
                </div>
                {v.latestBulletin && (
                  <p className="mt-1.5 line-clamp-2 text-[11px] text-slate-700 dark:text-slate-300">
                    {v.latestBulletin.headline}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
