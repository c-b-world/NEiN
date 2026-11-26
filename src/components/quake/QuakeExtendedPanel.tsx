import { Activity, AlertTriangle, RefreshCw, Waves } from 'lucide-react';
import { useMemo, useState } from 'react';
import type {
  JmaQuakeSubKind,
  JmaQuakeSummaryItem,
  JmaTsunamiSummaryItem,
  JmaXmlBulletin,
} from '../../types/disaster';
import type { AppLanguage } from '../../utils/i18n';
import { getExtendedMessages } from '../../utils/i18nExtended';
import { fetchJmaQuakeDetailRaw } from '../../utils/jmaFeedsApi';
import { formatJstTimestamp } from '../../utils/weatherParser';
import { RawTextDrawer } from '../RawTextDrawer';

interface QuakeExtendedPanelProps {
  lang: AppLanguage;
  mode: 'jma_quake' | 'tsunami';
  jmaQuakes: JmaQuakeSummaryItem[];
  jmaTsunamis: JmaTsunamiSummaryItem[];
  xmlBulletins: JmaXmlBulletin[];
  onLoadTsunamiDetail: (item: JmaTsunamiSummaryItem) => Promise<JmaTsunamiSummaryItem>;
  onRefresh: () => void;
}

export function QuakeExtendedPanel({
  lang,
  mode,
  jmaQuakes,
  jmaTsunamis,
  xmlBulletins,
  onLoadTsunamiDetail,
  onRefresh,
}: QuakeExtendedPanelProps) {
  const ext = getExtendedMessages(lang);
  const [kindFilter, setKindFilter] = useState<'all' | 'domestic' | 'distant' | 'long_period' | 'special'>('all');
  const [detailTextMap, setDetailTextMap] = useState<Record<string, string>>({});

  const specialBulletins = useMemo(
    () => xmlBulletins.filter((b) => b.category === 'quake_special'),
    [xmlBulletins],
  );

  const filteredQuakes = useMemo(() => {
    return jmaQuakes.filter((q) => {
      if (kindFilter === 'all') return true;
      if (kindFilter === 'special') {
        return q.subKind === 'nankai_trough' || q.subKind === 'hokkaido_sanriku';
      }
      return q.subKind === (kindFilter as JmaQuakeSubKind);
    });
  }, [jmaQuakes, kindFilter]);

  const handleLoadQuakeDetail = async (q: JmaQuakeSummaryItem) => {
    if (detailTextMap[q.id] || !q.jsonFile) return;
    try {
      const raw = (await fetchJmaQuakeDetailRaw(q.jsonFile)) as Record<string, unknown> | null;
      const head = (raw?.Head ?? {}) as Record<string, unknown>;
      const headline = (head.Headline ?? {}) as Record<string, unknown>;
      const text = typeof headline.Text === 'string' ? headline.Text : JSON.stringify(head, null, 2);
      setDetailTextMap((prev) => ({ ...prev, [q.id]: text }));
    } catch {
      // Ignore
    }
  };

  if (mode === 'tsunami') {
    const activeEvent = jmaTsunamis[0] ?? null;
    return (
      <div className="flex flex-col gap-5">
        <section
          aria-label={ext.quakeExt.tsunamiTitle}
          className="rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)] p-4 sm:p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--nein-border-subtle)] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Waves className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
                <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                  {ext.quakeExt.tsunamiTitle}
                </h1>
              </div>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                {ext.quakeExt.tsunamiSubtitle}
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

          {jmaTsunamis.length === 0 ? (
            <p className="mt-4 text-xs text-slate-600 dark:text-slate-400">{ext.common.noData}</p>
          ) : (
            <div className="mt-4 space-y-4">
              {jmaTsunamis.slice(0, 5).map((ts) => {
                const sevTone =
                  ts.highestSeverity === 'major_warning'
                    ? 'border-fuchsia-600 bg-fuchsia-950/85 text-fuchsia-100'
                    : ts.highestSeverity === 'warning'
                    ? 'border-red-600 bg-red-950/75 text-red-100'
                    : ts.highestSeverity === 'watch'
                    ? 'border-amber-500 bg-amber-500/15 text-amber-900 dark:text-amber-100'
                    : 'border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-900 dark:text-slate-100';

                const sevLabel =
                  ts.highestSeverity === 'major_warning'
                    ? ext.quakeExt.tsunamiMajorWarning
                    : ts.highestSeverity === 'warning'
                    ? ext.quakeExt.tsunamiWarning
                    : ts.highestSeverity === 'watch'
                    ? ext.quakeExt.tsunamiWatch
                    : ts.highestSeverity === 'lifted'
                    ? ext.quakeExt.tsunamiLifted
                    : ext.quakeExt.tsunamiForecast;

                return (
                  <div key={ts.id} className={`rounded-lg border p-4 ${sevTone}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-black/25 px-2 py-0.5 text-xs font-bold">
                          {sevLabel}
                        </span>
                        <span className="text-sm font-bold">
                          {lang === 'en' && ts.enTitle ? ts.enTitle : ts.title} —{' '}
                          {lang === 'en' && ts.enEpicenter ? ts.enEpicenter : ts.epicenter}
                        </span>
                      </div>
                      <span className="font-mono text-xs opacity-90">
                        {ts.reportDatetime ? formatJstTimestamp(ts.reportDatetime) : '--'}
                      </span>
                    </div>

                    {ts.headlineText && <p className="mt-2 text-xs opacity-95">{ts.headlineText}</p>}

                    {ts.areas.length === 0 && ts.jsonFile && (
                      <button
                        type="button"
                        onClick={() => void onLoadTsunamiDetail(ts)}
                        className="mt-2 rounded border border-current/30 px-2.5 py-1 text-[11px] font-semibold hover:bg-black/10 cursor-pointer"
                      >
                        {ext.common.viewDetails}
                      </button>
                    )}

                    {ts.areas.length > 0 && (
                      <div className="mt-3">
                        <h3 className="text-xs font-bold opacity-90">
                          {ext.quakeExt.coastalAreas} ({ts.areas.length})
                        </h3>
                        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {ts.areas.slice(0, 24).map((a, idx) => (
                            <div
                              key={`${a.areaCode}-${idx}`}
                              className="rounded border border-black/15 bg-black/15 px-2.5 py-2 text-xs"
                            >
                              <div className="font-bold">
                                {lang === 'en' && a.enAreaName ? a.enAreaName : a.areaName}
                              </div>
                              <div className="mt-0.5 flex flex-wrap gap-2 font-mono text-[11px] opacity-90">
                                <span>{lang === 'en' && a.enKindName ? a.enKindName : a.kindName}</span>
                                {a.maxHeight && (
                                  <span>
                                    {ext.quakeExt.expectedHeight}: {a.maxHeight}
                                  </span>
                                )}
                                {a.arrivalTime && (
                                  <span>
                                    {ext.quakeExt.arrivalTime}: {formatJstTimestamp(a.arrivalTime)}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {ts.observations.length > 0 && (
                      <div className="mt-3">
                        <h3 className="text-xs font-bold opacity-90">
                          {ext.quakeExt.observationsHeading} ({ts.observations.length})
                        </h3>
                        <div className="mt-1.5 grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                          {ts.observations.slice(0, 15).map((ob, i) => (
                            <div
                              key={`${ob.stationName}-${i}`}
                              className="rounded border border-black/15 bg-black/15 px-2.5 py-1.5 text-[11px]"
                            >
                              <div className="font-semibold">
                                {ob.stationName} {ob.isOffshore ? '(沖合)' : ''}
                              </div>
                              <div className="font-mono">
                                {ext.quakeExt.observedHeight}: {ob.maxHeight ?? '--'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <RawTextDrawer
                      lang={lang}
                      rawText={`${ts.title} (${ts.issueType})\n${ts.epicenter}\n${ts.headlineText}`}
                      officialUrl="https://www.jma.go.jp/bosai/map.html#contents=tsunami"
                    />
                  </div>
                );
              })}

              {activeEvent && activeEvent.areas.some((a) => a.lat !== null && a.lon !== null) && (
                <div className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-3 text-xs">
                  <div className="font-bold text-slate-900 dark:text-slate-100 mb-2">
                    {ext.quakeExt.coastalAreas} — Japan Coastal Coordinates Plot
                  </div>
                  <svg viewBox="0 0 360 280" className="h-56 w-full rounded bg-slate-950">
                    {activeEvent.areas.map((a, idx) => {
                      if (a.lat === null || a.lon === null) return null;
                      const x = ((a.lon - 122) / (150 - 122)) * 340 + 10;
                      const y = ((46 - a.lat) / (46 - 23)) * 260 + 10;
                      const fill =
                        a.severity === 'major_warning'
                          ? '#d946ef'
                          : a.severity === 'warning'
                          ? '#ef4444'
                          : a.severity === 'watch'
                          ? '#f59e0b'
                          : '#38bdf8';
                      return (
                        <g key={`${a.areaCode}-${idx}`}>
                          <circle cx={x} cy={y} r={5} fill={fill} stroke="#fff" strokeWidth={1} />
                          <text x={x + 7} y={y + 3} fontSize="8" fill="#e2e8f0">
                            {a.areaName.slice(0, 8)}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <section
        aria-label={ext.quakeExt.jmaTitle}
        className="rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)] p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--nein-border-subtle)] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                {ext.quakeExt.jmaTitle}
              </h1>
            </div>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
              {ext.quakeExt.jmaSubtitle}
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

        {/* Nankai Trough / Hokkaido-Sanriku / Long-period Special XML Advisories */}
        {specialBulletins.length > 0 && (
          <div className="mt-4 space-y-2">
            {specialBulletins.slice(0, 4).map((sb) => (
              <div
                key={sb.id}
                className="rounded-lg border border-amber-500/70 bg-amber-500/10 p-3 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-200">
                    <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                    {sb.title}
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">
                    {formatJstTimestamp(sb.updatedAt)}
                  </span>
                </div>
                <p className="mt-1 text-slate-700 dark:text-slate-300">{sb.headline}</p>
                <RawTextDrawer lang={lang} rawText={`${sb.title}\n${sb.headline}`} officialUrl={sb.link} />
              </div>
            ))}
          </div>
        )}

        {/* Filter Chips */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {(
            [
              ['all', ext.quakeExt.filterAll],
              ['domestic', ext.quakeExt.filterDomestic],
              ['distant', ext.quakeExt.filterDistant],
              ['long_period', ext.quakeExt.filterLongPeriod],
              ['special', ext.quakeExt.filterSpecial],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setKindFilter(id)}
              className={`rounded-md border px-3 py-1 text-xs font-semibold cursor-pointer ${
                kindFilter === id
                  ? 'border-[var(--nein-accent)] bg-[var(--nein-accent)] text-[var(--nein-accent-contrast)]'
                  : 'border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-700 dark:text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-2.5">
          {filteredQuakes.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">{ext.common.noData}</p>
          ) : (
            filteredQuakes.slice(0, 40).map((q) => (
              <div
                key={q.id}
                onMouseEnter={() => void handleLoadQuakeDetail(q)}
                className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-3.5 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {lang === 'en' && q.enEpicenter ? q.enEpicenter : q.epicenter || q.title}
                    </span>
                    {q.subKind === 'distant' && (
                      <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-200">
                        {ext.quakeExt.distantTag}
                      </span>
                    )}
                    {q.subKind === 'long_period' && (
                      <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-200">
                        {ext.quakeExt.longPeriodTag}
                      </span>
                    )}
                    {q.subKind === 'nankai_trough' && (
                      <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-700 dark:text-red-200">
                        {ext.quakeExt.nankaiTag}
                      </span>
                    )}
                    {q.subKind === 'hokkaido_sanriku' && (
                      <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-200">
                        {ext.quakeExt.sanrikuTag}
                      </span>
                    )}
                    {q.isCorrected && (
                      <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-bold text-sky-700 dark:text-sky-200">
                        {ext.quakeExt.correctedTag}
                      </span>
                    )}
                    {q.isCancelled && (
                      <span className="rounded bg-slate-500/20 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                        {ext.quakeExt.cancelledTag}
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[11px] text-slate-500">
                    {q.reportDatetime ? formatJstTimestamp(q.reportDatetime) : '--'}
                  </span>
                </div>

                <div className="mt-1.5 flex flex-wrap gap-3 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                  <span>{lang === 'en' && q.enTitle ? q.enTitle : q.title}</span>
                  {q.maxIntensity && <span>Max Int: {q.maxIntensity}</span>}
                  {q.magnitude !== null && <span>M{q.magnitude.toFixed(1)}</span>}
                  {q.depthKm !== null && <span>Depth {q.depthKm}km</span>}
                </div>

                {detailTextMap[q.id] && (
                  <p className="mt-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                    {detailTextMap[q.id]}
                  </p>
                )}

                <RawTextDrawer
                  lang={lang}
                  rawText={`${q.title} (${q.issueType})\n${q.epicenter}\n${detailTextMap[q.id] || q.coordinatesRaw}`}
                  officialUrl="https://www.jma.go.jp/bosai/map.html#contents=earthquake_map"
                />
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
