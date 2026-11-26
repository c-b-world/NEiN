import { Calendar, Check, ChevronDown, Copy, Loader2, RotateCcw, Search, X } from 'lucide-react';
import { useState } from 'react';
import type { P2PQuakeRecord, QuakeFilter } from '../types/quake';
import { formatDisplayYmd, formatJapaneseDateHeading } from '../utils/archiveApi';
import { copyTextToClipboard } from '../utils/clipboard';
import { type AppLanguage, getMessages } from '../utils/i18n';
import {
  formatDepth,
  formatMagnitude,
  formatQuakeForClipboard,
  formatShortTime,
  getEEWMaxScale,
  getRecordCategoryLabel,
  getRecordTitle,
  getScalePresentation,
} from '../utils/quakeParser';
import { ArchiveCalendar } from './ArchiveCalendar';

interface QuakeListProps {
  lang: AppLanguage;
  records: P2PQuakeRecord[];
  totalCount: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  filter: QuakeFilter;
  onFilterChange: (filter: QuakeFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  dateFrom: string;
  onDateFromChange: (ymd: string) => void;
  dateTo: string;
  onDateToChange: (ymd: string) => void;
  minScale: number;
  onMinScaleChange: (scale: number) => void;
  minMagnitude: number | null;
  onMinMagnitudeChange: (mag: number | null) => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  counts: {
    all: number;
    quake: number;
    eew: number;
    other: number;
  };
  isLoading: boolean;
  canLoadMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  archiveDate: string | null;
  onSelectArchiveDate: (ymd: string) => void;
  onExitArchiveMode: () => void;
}

const SCALE_VALUES = [0, 10, 20, 30, 40, 45, 50, 55, 60, 70];
const MAGNITUDE_VALUES = ['', '3', '4', '5', '6', '7'];

function ScaleSquare({ record, lang }: { record: P2PQuakeRecord; lang: AppLanguage }) {
  if (record.code === 551) {
    const scale = getScalePresentation(record.earthquake.maxScale, lang);
    const caption = lang === 'en' ? 'Scale' : lang === 'ko' ? '진도' : '震度';
    return (
      <div
        className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-md border ${scale.bgClass} ${scale.borderClass} ${scale.textClass}`}
      >
        <span className="text-[9px] leading-none opacity-80">{caption}</span>
        <span className="mt-0.5 font-mono text-sm font-bold leading-none tabular-nums">
          {scale.short}
        </span>
      </div>
    );
  }

  if (record.code === 556) {
    if (record.cancelled) {
      return (
        <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-md border border-slate-600 bg-slate-800 text-slate-200">
          <span className="text-[10px] font-semibold leading-tight">
            {lang === 'en' ? 'CXL' : lang === 'ko' ? '취소' : '取消'}
          </span>
        </div>
      );
    }
    const maxScale = getEEWMaxScale(record);
    const scale = maxScale > 0 ? getScalePresentation(maxScale, lang) : null;
    return (
      <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-md border border-red-600 bg-red-950 text-red-100">
        <span className="text-[9px] font-semibold leading-none text-red-300">
          {lang === 'en' ? 'EEW' : lang === 'ko' ? '경보' : '警報'}
        </span>
        <span className="mt-0.5 font-mono text-xs font-bold leading-none tabular-nums">
          {scale ? scale.short : 'EEW'}
        </span>
      </div>
    );
  }

  if (record.code === 554) {
    return (
      <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-md border border-amber-700 bg-amber-950 text-amber-200">
        <span className="text-[10px] font-semibold leading-tight">
          {lang === 'en' ? 'DET' : lang === 'ko' ? '감지' : '検出'}
        </span>
      </div>
    );
  }

  if (record.code === 552) {
    return (
      <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-md border border-cyan-700 bg-cyan-950 text-cyan-200">
        <span className="text-[10px] font-semibold leading-tight">
          {lang === 'en' ? 'TSU' : lang === 'zh' ? '海啸' : lang === 'ko' ? '해일' : '津波'}
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-md border border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-600 dark:text-slate-400">
      <span className="text-[10px] font-medium leading-tight">
        {lang === 'en' ? 'FELT' : lang === 'zh' ? '体感' : lang === 'ko' ? '체감' : '感知'}
      </span>
    </div>
  );
}

export function QuakeList({
  lang,
  records,
  totalCount,
  selectedId,
  onSelect,
  filter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  minScale,
  onMinScaleChange,
  minMagnitude,
  onMinMagnitudeChange,
  hasActiveFilters,
  onResetFilters,
  counts,
  isLoading,
  canLoadMore,
  isLoadingMore,
  onLoadMore,
  archiveDate,
  onSelectArchiveDate,
  onExitArchiveMode,
}: QuakeListProps) {
  const m = getMessages(lang);
  const [copiedRowId, setCopiedRowId] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleRowCopy = async (record: P2PQuakeRecord) => {
    const ok = await copyTextToClipboard(formatQuakeForClipboard(record, lang));
    if (ok) {
      setCopiedRowId(record.id);
      window.setTimeout(() => {
        setCopiedRowId((prev) => (prev === record.id ? null : prev));
      }, 1800);
    }
  };

  const scaleOptions = SCALE_VALUES.map((val) => {
    if (val === 0) return { value: 0, label: m.list.allOption };
    const pres = getScalePresentation(val, lang);
    if (val === 70) return { value: val, label: pres.label };
    return {
      value: val,
      label: `${m.list.scaleOverPrefix}${pres.label}${m.list.scaleOverSuffix}`,
    };
  });

  const magOptions = MAGNITUDE_VALUES.map((val) => {
    if (!val) return { value: '', label: m.list.allOption };
    return {
      value: val,
      label:
        lang === 'en'
          ? `M${val}.0+`
          : lang === 'ko'
          ? `M${val}.0 이상`
          : `M${val}.0以上`,
    };
  });

  const filterTabs: Array<{ id: QuakeFilter; label: string; count: number }> = [
    { id: 'all', label: m.list.tabAll, count: counts.all },
    { id: 'quake', label: m.list.tabQuake, count: counts.quake },
    { id: 'eew', label: m.list.tabEew, count: counts.eew },
    { id: 'other', label: m.list.tabOther, count: counts.other },
  ];

  const archiveHeadingText = archiveDate
    ? lang === 'ja'
      ? formatJapaneseDateHeading(archiveDate)
      : formatDisplayYmd(archiveDate)
    : '';

  return (
    <aside
      aria-label={m.list.historyHeading}
      className="flex w-full flex-col rounded-lg border border-[var(--nein-border)] bg-[var(--nein-surface)] transition-colors lg:w-[440px] lg:shrink-0"
    >
      <div className="border-b border-[var(--nein-border)] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {archiveDate
                ? `${m.list.archiveHeadingPrefix}${archiveHeadingText}`
                : m.list.historyHeading}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span
              data-testid="quake-count-label"
              className="font-mono text-xs tabular-nums text-slate-600 dark:text-slate-400"
            >
              {records.length !== totalCount
                ? `${records.length} / ${totalCount}`
                : `${records.length} ${m.list.itemsShownSuffix}`}
            </span>
            <button
              type="button"
              data-testid="toggle-calendar-btn"
              aria-expanded={calendarOpen}
              onClick={() => setCalendarOpen((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--nein-accent)] ${
                calendarOpen || archiveDate
                  ? 'border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] text-[var(--nein-accent-text)]'
                  : 'border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-700 hover:bg-slate-200/70 dark:text-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{archiveDate ? m.list.changeDate : m.list.pickDate}</span>
            </button>
          </div>
        </div>

        {archiveDate && (
          <div className="flex items-center justify-between gap-2 rounded-md border border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] px-3 py-1.5 text-xs">
            <span className="text-[var(--nein-accent-text)] font-medium">
              {m.list.archiveBanner}
            </span>
            <button
              type="button"
              data-testid="exit-archive-btn"
              onClick={onExitArchiveMode}
              className="inline-flex items-center gap-1 font-semibold text-[var(--nein-accent-text)] hover:underline cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              <span>{m.list.backToRealtime}</span>
            </button>
          </div>
        )}

        {calendarOpen && (
          <ArchiveCalendar
            lang={lang}
            selectedDate={archiveDate}
            onSelectDate={onSelectArchiveDate}
            onExitArchive={onExitArchiveMode}
            onClose={() => setCalendarOpen(false)}
          />
        )}

        <div className="relative">
          <label htmlFor="quake-search-input" className="sr-only">
            {m.list.searchPlaceholder}
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            aria-hidden="true"
          />
          <input
            id="quake-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={m.list.searchPlaceholder}
            className="w-full rounded-md border border-[var(--nein-border)] bg-[var(--nein-sub)] py-2 pl-9 pr-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[var(--nein-accent)] focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label={m.list.clearSearchAria}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Multi-criteria Search Controls: Date Range, Max Intensity, Magnitude */}
        <div
          aria-label={m.list.maxScale}
          className="grid grid-cols-2 gap-2 rounded-md border border-[var(--nein-border-subtle)] bg-[var(--nein-sub)] p-2.5"
        >
          <div className="min-w-0">
            <label
              htmlFor="quake-date-from"
              className="mb-1 block text-[10px] font-medium text-slate-600 dark:text-slate-400"
            >
              {m.list.dateFrom}
            </label>
            <input
              id="quake-date-from"
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="w-full rounded border border-[var(--nein-border)] bg-[var(--nein-surface)] px-2 py-1 font-mono text-[11px] text-slate-900 focus:border-[var(--nein-accent)] focus:outline-none dark:text-slate-200"
            />
          </div>

          <div className="min-w-0">
            <label
              htmlFor="quake-date-to"
              className="mb-1 block text-[10px] font-medium text-slate-600 dark:text-slate-400"
            >
              {m.list.dateTo}
            </label>
            <input
              id="quake-date-to"
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => onDateToChange(e.target.value)}
              className="w-full rounded border border-[var(--nein-border)] bg-[var(--nein-surface)] px-2 py-1 font-mono text-[11px] text-slate-900 focus:border-[var(--nein-accent)] focus:outline-none dark:text-slate-200"
            />
          </div>

          <div className="min-w-0">
            <label
              htmlFor="quake-min-scale"
              className="mb-1 block text-[10px] font-medium text-slate-600 dark:text-slate-400"
            >
              {m.list.maxScale}
            </label>
            <select
              id="quake-min-scale"
              value={minScale}
              onChange={(e) => onMinScaleChange(Number(e.target.value))}
              className="w-full rounded border border-[var(--nein-border)] bg-[var(--nein-surface)] px-2 py-1 text-[11px] text-slate-900 focus:border-[var(--nein-accent)] focus:outline-none dark:text-slate-200 cursor-pointer"
            >
              {scaleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0">
            <label
              htmlFor="quake-min-magnitude"
              className="mb-1 block text-[10px] font-medium text-slate-600 dark:text-slate-400"
            >
              {m.list.magnitude}
            </label>
            <select
              id="quake-min-magnitude"
              value={minMagnitude !== null ? String(minMagnitude) : ''}
              onChange={(e) =>
                onMinMagnitudeChange(e.target.value === '' ? null : Number(e.target.value))
              }
              className="w-full rounded border border-[var(--nein-border)] bg-[var(--nein-surface)] px-2 py-1 font-mono text-[11px] text-slate-900 focus:border-[var(--nein-accent)] focus:outline-none dark:text-slate-200 cursor-pointer"
            >
              {magOptions.map((opt) => (
                <option key={opt.label} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <div className="col-span-2 flex items-center justify-between border-t border-[var(--nein-border-subtle)] pt-2 text-[11px]">
              <span className="font-mono tabular-nums font-semibold text-[var(--nein-accent-text)]">
                {m.list.matchedPrefix}{records.length}
              </span>
              <button
                type="button"
                data-testid="reset-quake-filters-btn"
                onClick={onResetFilters}
                className="inline-flex items-center gap-1 rounded border border-[var(--nein-border)] bg-[var(--nein-surface)] px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-200/70 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                <span>{m.list.resetFilters}</span>
              </button>
            </div>
          )}
        </div>

        <div
          role="tablist"
          aria-label={m.nav.navAria}
          className="grid grid-cols-4 gap-1 rounded-md border border-[var(--nein-border-subtle)] bg-[var(--nein-sub)] p-1"
        >
          {filterTabs.map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onFilterChange(tab.id)}
                className={`min-w-0 truncate rounded px-1.5 py-1.5 text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--nein-accent)] ${
                  active
                    ? 'bg-[var(--nein-surface)] text-slate-950 shadow-xs dark:bg-slate-800 dark:text-slate-50'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
                <span className="ml-1 font-mono tabular-nums text-[10px] opacity-75">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-h-[620px] overflow-y-auto divide-y divide-[var(--nein-border-subtle)]">
        {isLoading ? (
          <div className="space-y-3 p-4" aria-label={m.toolbar.refreshing}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-md border border-[var(--nein-border-subtle)] bg-[var(--nein-sub)] p-3 animate-pulse"
              >
                <div className="h-11 w-11 rounded-md bg-slate-200 dark:bg-slate-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-3 w-1/2 rounded bg-slate-200/80 dark:bg-slate-800/80" />
                </div>
              </div>
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-300">
              {archiveDate
                ? `${archiveHeadingText}${m.list.emptyArchive}`
                : m.list.emptyFiltered}
            </p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-500">
              {archiveDate ? m.list.emptyArchiveHint : m.list.emptyFilteredHint}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {archiveDate && (
                <button
                  type="button"
                  onClick={onExitArchiveMode}
                  className="rounded-md border border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] px-3.5 py-2 text-xs font-medium text-[var(--nein-accent-text)] hover:opacity-85 cursor-pointer"
                >
                  {m.list.backToRealtime}
                </button>
              )}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="rounded-md border border-[var(--nein-border)] bg-[var(--nein-sub)] px-3.5 py-2 text-xs font-medium text-slate-800 hover:bg-slate-200/70 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  {m.list.showAll}
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <ul data-testid="quake-list" className="divide-y divide-[var(--nein-border-subtle)]">
              {records.map((record, idx) => {
                const isSelected = record.id === selectedId;
                const title = getRecordTitle(record, lang);
                const category = getRecordCategoryLabel(record, lang);
                const isCopied = copiedRowId === record.id;

                let metaSummary = formatShortTime(
                  record.code === 551 ? record.earthquake.time : record.time
                );
                if (record.code === 551) {
                  metaSummary += ` · ${formatMagnitude(record.earthquake.hypocenter.magnitude, lang)} · ${formatDepth(record.earthquake.hypocenter.depth, lang)}`;
                } else if (record.code === 556 && record.earthquake) {
                  const repPrefix = lang === 'en' ? `#${record.issue.serial}` : `第${record.issue.serial}報`;
                  metaSummary += ` · ${repPrefix} · ${formatMagnitude(record.earthquake.hypocenter.magnitude, lang)}`;
                } else {
                  metaSummary += ` · ${category}`;
                }

                return (
                  <li
                    key={record.id ? `${record.id}-${idx}` : `row-${idx}`}
                    className={`flex items-stretch transition-colors ${
                      isSelected
                        ? 'bg-[var(--nein-accent-soft)]'
                        : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(record.id)}
                      aria-current={isSelected ? 'true' : undefined}
                      aria-label={`${title} ${metaSummary}`}
                      className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[var(--nein-accent)]"
                    >
                      <ScaleSquare record={record} lang={lang} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`truncate text-sm font-semibold ${
                              isSelected
                                ? 'text-[var(--nein-accent-text)]'
                                : 'text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            {title}
                          </span>
                          {record.isTest && (
                            <span className="shrink-0 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                              {m.list.testTag}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 truncate font-mono text-xs tabular-nums text-slate-600 dark:text-slate-400">
                          {metaSummary}
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center pr-2.5">
                      <button
                        type="button"
                        onClick={() => void handleRowCopy(record)}
                        aria-label={`${m.list.copyRowAria}${title}`}
                        title={m.detail.copyQuake}
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-md border text-xs transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--nein-accent)] ${
                          isCopied
                            ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : 'border-transparent text-slate-500 hover:border-[var(--nein-border)] hover:bg-[var(--nein-sub)] hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                        }`}
                      >
                        {isCopied ? (
                          <Check className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Copy className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            {!archiveDate && (
              <div className="border-t border-[var(--nein-border-subtle)] bg-[var(--nein-sub)] p-3">
                {canLoadMore ? (
                  <button
                    type="button"
                    data-testid="load-more-quakes-btn"
                    onClick={onLoadMore}
                    disabled={isLoadingMore}
                    className="flex w-full items-center justify-center gap-2 rounded-md border border-[var(--nein-border)] bg-[var(--nein-surface)] px-4 py-2 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-100 disabled:opacity-60 dark:bg-slate-800/90 dark:text-slate-100 dark:hover:bg-slate-700 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--nein-accent)]"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                        <span>{m.list.loadingMore}</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{m.list.loadMore}</span>
                      </>
                    )}
                  </button>
                ) : (
                  <p className="text-center font-mono text-[11px] tabular-nums text-slate-500">
                    {m.list.loadedTotalPrefix}{totalCount}
                    {lang === 'ja' ? '件）' : ')'}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
