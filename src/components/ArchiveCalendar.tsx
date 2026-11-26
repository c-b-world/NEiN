import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { P2PQuakeRecord } from '../types/quake';
import {
  type DayQuakeSummary,
  buildCalendarMonthGrid,
  buildJmaQuakeArchiveUrl,
  getJstTodayParts,
  getMonthRangeYmd,
  summarizeMonthQuakes,
} from '../utils/archiveApi';
import { type AppLanguage, getMessages } from '../utils/i18n';
import { getScalePresentation, normalizeQuakeRecord } from '../utils/quakeParser';

interface ArchiveCalendarProps {
  lang: AppLanguage;
  selectedDate: string | null;
  onSelectDate: (ymd: string) => void;
  onExitArchive: () => void;
  onClose?: () => void;
}

function getSeverityDotClass(maxScale: number): string {
  if (maxScale >= 45) return 'bg-red-500 dark:bg-red-400';
  if (maxScale >= 30) return 'bg-amber-500 dark:bg-amber-400';
  return 'bg-sky-500 dark:bg-sky-400';
}

export function ArchiveCalendar({
  lang,
  selectedDate,
  onSelectDate,
  onExitArchive,
  onClose,
}: ArchiveCalendarProps) {
  const m = getMessages(lang);
  const today = useMemo(() => getJstTodayParts(), []);
  const initialDateParts = useMemo(() => {
    if (selectedDate) {
      const [y, mo] = selectedDate.split('-').map(Number);
      if (y && mo) return { year: y, month: mo };
    }
    return { year: today.year, month: today.month };
  }, [selectedDate, today.year, today.month]);

  const [viewYear, setViewYear] = useState(initialDateParts.year);
  const [viewMonth, setViewMonth] = useState(initialDateParts.month);
  const [monthSummary, setMonthSummary] = useState<Record<string, DayQuakeSummary>>({});
  const [loadingMonth, setLoadingMonth] = useState(false);
  const cacheRef = useRef<Map<string, Record<string, DayQuakeSummary>>>(new Map());

  const monthKey = `${viewYear}-${String(viewMonth).padStart(2, '0')}`;

  useEffect(() => {
    const cached = cacheRef.current.get(monthKey);
    if (cached) {
      setMonthSummary(cached);
      return;
    }

    let cancelled = false;
    setLoadingMonth(true);
    const { sinceYmd, untilYmd } = getMonthRangeYmd(viewYear, viewMonth);
    const url = buildJmaQuakeArchiveUrl(sinceYmd, untilYmd, 100, 0);

    fetch(url, { headers: { Accept: 'application/json' } })
      .then(async (res) => {
        if (!res.ok) return [];
        const raw = (await res.json()) as P2PQuakeRecord[];
        return Array.isArray(raw)
          ? raw.map((item, idx) => normalizeQuakeRecord(item, idx))
          : [];
      })
      .then((records) => {
        if (cancelled) return;
        const summary = summarizeMonthQuakes(records);
        cacheRef.current.set(monthKey, summary);
        setMonthSummary(summary);
      })
      .catch(() => {
        if (!cancelled) setMonthSummary({});
      })
      .finally(() => {
        if (!cancelled) setLoadingMonth(false);
      });

    return () => {
      cancelled = true;
    };
  }, [monthKey, viewYear, viewMonth]);

  const cells = useMemo(
    () => buildCalendarMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const isAtCurrentMonth =
    viewYear > today.year || (viewYear === today.year && viewMonth >= today.month);

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth((mo) => mo - 1);
    }
  };

  const handleNextMonth = () => {
    if (isAtCurrentMonth) return;
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth((mo) => mo + 1);
    }
  };

  const yearOptions = useMemo(() => {
    const list: number[] = [];
    for (let y = today.year; y >= 2019; y--) {
      list.push(y);
    }
    return list;
  }, [today.year]);

  const monthOptions = useMemo(() => {
    const maxMonth = viewYear === today.year ? today.month : 12;
    return Array.from({ length: maxMonth }, (_, i) => i + 1);
  }, [viewYear, today.year, today.month]);

  const handleSelectCell = (ymd: string) => {
    onSelectDate(ymd);
    onClose?.();
  };

  return (
    <div
      data-testid="archive-calendar"
      role="region"
      aria-label={m.list.pickDate}
      className="mt-3 rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-3 shadow-xl"
    >
      {/* Month / Year Navigation */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={handlePrevMonth}
          aria-label="Prev Month"
          className="inline-flex h-7 w-7 items-center justify-center rounded border border-[var(--nein-border)] bg-[var(--nein-surface)] text-slate-700 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-1.5">
          <label htmlFor="archive-cal-year" className="sr-only">
            Year
          </label>
          <select
            id="archive-cal-year"
            value={viewYear}
            onChange={(e) => {
              const nextY = Number(e.target.value);
              setViewYear(nextY);
              if (nextY === today.year && viewMonth > today.month) {
                setViewMonth(today.month);
              }
            }}
            className="rounded border border-[var(--nein-border)] bg-[var(--nein-surface)] px-2 py-1 text-xs font-mono font-semibold text-slate-900 dark:text-slate-100 focus:border-[var(--nein-accent)] focus:outline-none cursor-pointer"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {lang === 'en' ? y : lang === 'ko' ? `${y}년` : lang === 'zh' ? `${y}年` : `${y}年`}
              </option>
            ))}
          </select>

          <label htmlFor="archive-cal-month" className="sr-only">
            Month
          </label>
          <select
            id="archive-cal-month"
            value={viewMonth}
            onChange={(e) => setViewMonth(Number(e.target.value))}
            className="rounded border border-[var(--nein-border)] bg-[var(--nein-surface)] px-2 py-1 text-xs font-mono font-semibold text-slate-900 dark:text-slate-100 focus:border-[var(--nein-accent)] focus:outline-none cursor-pointer"
          >
            {monthOptions.map((mo) => (
              <option key={mo} value={mo}>
                {lang === 'en'
                  ? String(mo).padStart(2, '0')
                  : lang === 'ko'
                  ? `${mo}월`
                  : `${mo}月`}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleNextMonth}
          disabled={isAtCurrentMonth}
          aria-label="Next Month"
          className="inline-flex h-7 w-7 items-center justify-center rounded border border-[var(--nein-border)] bg-[var(--nein-surface)] text-slate-700 hover:bg-slate-200/70 disabled:opacity-35 disabled:cursor-not-allowed dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white cursor-pointer"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Weekday Labels */}
      <div className="mt-2.5 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold">
        {m.calendar.weekdays.map((wd, idx) => (
          <div
            key={`${wd}-${idx}`}
            className={
              idx === 0
                ? 'text-red-600 dark:text-red-400/85'
                : idx === 6
                ? 'text-sky-600 dark:text-sky-400/85'
                : 'text-slate-500'
            }
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Calendar Days Grid */}
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          const isSelected = cell.ymd === selectedDate;
          const summary = cell.inCurrentMonth ? monthSummary[cell.ymd] : undefined;
          const scaleLabel =
            summary && summary.maxScale > 0
              ? getScalePresentation(summary.maxScale, lang).label
              : null;

          const ariaParts = [cell.ymd];
          if (summary) {
            ariaParts.push(String(summary.count));
            if (scaleLabel) ariaParts.push(scaleLabel);
          }

          return (
            <button
              key={cell.ymd}
              type="button"
              disabled={cell.isFuture}
              onClick={() => handleSelectCell(cell.ymd)}
              title={
                summary
                  ? `${cell.ymd}: ${summary.count}${scaleLabel ? ` (${scaleLabel})` : ''}`
                  : cell.ymd
              }
              aria-label={ariaParts.join(' ')}
              aria-pressed={isSelected}
              className={`relative flex h-8 flex-col items-center justify-center rounded text-xs font-mono tabular-nums transition-colors ${
                cell.isFuture
                  ? 'text-slate-400 dark:text-slate-700 cursor-not-allowed'
                  : isSelected
                  ? 'bg-[var(--nein-accent)] font-bold text-[var(--nein-accent-contrast)] cursor-pointer'
                  : cell.inCurrentMonth
                  ? 'text-slate-800 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer'
                  : 'text-slate-400 hover:bg-slate-200/60 dark:text-slate-600 dark:hover:bg-slate-800/50 cursor-pointer'
              } ${
                cell.isToday && !isSelected
                  ? 'ring-1 ring-inset ring-[var(--nein-accent)]'
                  : ''
              }`}
            >
              <span className="leading-none">{cell.day}</span>
              {summary && (
                <span
                  aria-hidden="true"
                  className={`mt-0.5 h-1 w-1 rounded-full ${
                    isSelected
                      ? 'bg-[var(--nein-accent-contrast)]'
                      : getSeverityDotClass(summary.maxScale)
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer / Legend / Actions */}
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--nein-border-subtle)] pt-2 text-[11px]">
        <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400">
          {loadingMonth ? (
            <span>{m.calendar.loadingMonth}</span>
          ) : (
            <>
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500 dark:bg-sky-400" aria-hidden="true" />
                {m.calendar.scale12}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 dark:bg-amber-400" aria-hidden="true" />
                {m.calendar.scale34}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 dark:bg-red-400" aria-hidden="true" />
                {m.calendar.scale5Plus}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setViewYear(today.year);
              setViewMonth(today.month);
              handleSelectCell(today.ymd);
            }}
            className="rounded border border-[var(--nein-border)] bg-[var(--nein-surface)] px-2 py-1 text-[11px] font-medium text-slate-800 hover:bg-slate-200/70 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
          >
            {m.calendar.todayBtn}
          </button>

          {selectedDate && (
            <button
              type="button"
              onClick={() => {
                onExitArchive();
                onClose?.();
              }}
              className="inline-flex items-center gap-1 rounded border border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] px-2 py-1 text-[11px] font-medium text-[var(--nein-accent-text)] hover:opacity-85 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              <span>{m.calendar.realtimeBtn}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
