import { Calendar, Check, ChevronDown, Copy, Loader2, RotateCcw, Search, X } from 'lucide-react';
import { useState } from 'react';
import type { P2PQuakeRecord, QuakeFilter } from '../types/quake';
import { formatJapaneseDateHeading } from '../utils/archiveApi';
import { copyTextToClipboard } from '../utils/clipboard';
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

const SCALE_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 0, label: 'すべて' },
  { value: 10, label: '震度1以上' },
  { value: 20, label: '震度2以上' },
  { value: 30, label: '震度3以上' },
  { value: 40, label: '震度4以上' },
  { value: 45, label: '震度5弱以上' },
  { value: 50, label: '震度5強以上' },
  { value: 55, label: '震度6弱以上' },
  { value: 60, label: '震度6強以上' },
  { value: 70, label: '震度7' },
];

const MAGNITUDE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'すべて' },
  { value: '3', label: 'M3.0以上' },
  { value: '4', label: 'M4.0以上' },
  { value: '5', label: 'M5.0以上' },
  { value: '6', label: 'M6.0以上' },
  { value: '7', label: 'M7.0以上' },
];

function ScaleSquare({ record }: { record: P2PQuakeRecord }) {
  if (record.code === 551) {
    const scale = getScalePresentation(record.earthquake.maxScale);
    return (
      <div
        className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-md border ${scale.bgClass} ${scale.borderClass} ${scale.textClass}`}
      >
        <span className="text-[9px] leading-none opacity-80">震度</span>
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
          <span className="text-[10px] font-semibold leading-tight">取消</span>
        </div>
      );
    }
    const maxScale = getEEWMaxScale(record);
    const scale = maxScale > 0 ? getScalePresentation(maxScale) : null;
    return (
      <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-md border border-red-600 bg-red-950 text-red-100">
        <span className="text-[9px] font-semibold leading-none text-red-300">
          警報
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
        <span className="text-[10px] font-semibold leading-tight">検出</span>
      </div>
    );
  }

  if (record.code === 552) {
    return (
      <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-md border border-cyan-700 bg-cyan-950 text-cyan-200">
        <span className="text-[10px] font-semibold leading-tight">津波</span>
      </div>
    );
  }

  return (
    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-md border border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-600 dark:text-slate-400">
      <span className="text-[10px] font-medium leading-tight">感知</span>
    </div>
  );
}

export function QuakeList({
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
  const [copiedRowId, setCopiedRowId] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handleRowCopy = async (record: P2PQuakeRecord) => {
    const ok = await copyTextToClipboard(formatQuakeForClipboard(record));
    if (ok) {
      setCopiedRowId(record.id);
      window.setTimeout(() => {
        setCopiedRowId((prev) => (prev === record.id ? null : prev));
      }, 1800);
    }
  };

  const filterTabs: Array<{ id: QuakeFilter; label: string; count: number }> = [
    { id: 'all', label: 'すべて', count: counts.all },
    { id: 'quake', label: '地震', count: counts.quake },
    { id: 'eew', label: '速報', count: counts.eew },
    { id: 'other', label: 'その他', count: counts.other },
  ];

  return (
    <aside
      aria-label="地震情報一覧"
      className="flex w-full flex-col rounded-lg border border-[var(--nein-border)] bg-[var(--nein-surface)] transition-colors lg:w-[440px] lg:shrink-0"
    >
      <div className="border-b border-[var(--nein-border)] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {archiveDate
                ? `過去データ：${formatJapaneseDateHeading(archiveDate)}`
                : '地震・防災履歴（新着・過去）'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span
              data-testid="quake-count-label"
              className="font-mono text-xs tabular-nums text-slate-600 dark:text-slate-400"
            >
              {records.length !== totalCount
                ? `${records.length} / ${totalCount}件`
                : `${records.length}件表示`}
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
              <span>{archiveDate ? '日付変更' : '日付指定'}</span>
            </button>
          </div>
        </div>

        {archiveDate && (
          <div className="flex items-center justify-between gap-2 rounded-md border border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] px-3 py-1.5 text-xs">
            <span className="text-[var(--nein-accent-text)] font-medium">
              アーカイブ閲覧中（JMA地震・津波）
            </span>
            <button
              type="button"
              data-testid="exit-archive-btn"
              onClick={onExitArchiveMode}
              className="inline-flex items-center gap-1 font-semibold text-[var(--nein-accent-text)] hover:underline cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              <span>リアルタイムに戻る</span>
            </button>
          </div>
        )}

        {calendarOpen && (
          <ArchiveCalendar
            selectedDate={archiveDate}
            onSelectDate={onSelectArchiveDate}
            onExitArchive={onExitArchiveMode}
            onClose={() => setCalendarOpen(false)}
          />
        )}

        <div className="relative">
          <label htmlFor="quake-search-input" className="sr-only">
            震源地や地域名で検索
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
            placeholder="震源地・都道府県・市区町村で検索"
            className="w-full rounded-md border border-[var(--nein-border)] bg-[var(--nein-sub)] py-2 pl-9 pr-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[var(--nein-accent)] focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="キーワード検索をクリア"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Multi-criteria Search Controls: Date Range, Max Intensity, Magnitude */}
        <div
          aria-label="詳細検索フィルター"
          className="grid grid-cols-2 gap-2 rounded-md border border-[var(--nein-border-subtle)] bg-[var(--nein-sub)] p-2.5"
        >
          <div className="min-w-0">
            <label
              htmlFor="quake-date-from"
              className="mb-1 block text-[10px] font-medium text-slate-600 dark:text-slate-400"
            >
              開始日
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
              終了日
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
              最大震度
            </label>
            <select
              id="quake-min-scale"
              value={minScale}
              onChange={(e) => onMinScaleChange(Number(e.target.value))}
              className="w-full rounded border border-[var(--nein-border)] bg-[var(--nein-surface)] px-2 py-1 text-[11px] text-slate-900 focus:border-[var(--nein-accent)] focus:outline-none dark:text-slate-200 cursor-pointer"
            >
              {SCALE_OPTIONS.map((opt) => (
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
              マグニチュード
            </label>
            <select
              id="quake-min-magnitude"
              value={minMagnitude !== null ? String(minMagnitude) : ''}
              onChange={(e) =>
                onMinMagnitudeChange(e.target.value === '' ? null : Number(e.target.value))
              }
              className="w-full rounded border border-[var(--nein-border)] bg-[var(--nein-surface)] px-2 py-1 font-mono text-[11px] text-slate-900 focus:border-[var(--nein-accent)] focus:outline-none dark:text-slate-200 cursor-pointer"
            >
              {MAGNITUDE_OPTIONS.map((opt) => (
                <option key={opt.label} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <div className="col-span-2 flex items-center justify-between border-t border-[var(--nein-border-subtle)] pt-2 text-[11px]">
              <span className="font-mono tabular-nums font-semibold text-[var(--nein-accent-text)]">
                一致: {records.length}件
              </span>
              <button
                type="button"
                data-testid="reset-quake-filters-btn"
                onClick={onResetFilters}
                className="inline-flex items-center gap-1 rounded border border-[var(--nein-border)] bg-[var(--nein-surface)] px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-200/70 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                <span>条件リセット</span>
              </button>
            </div>
          )}
        </div>

        <div
          role="tablist"
          aria-label="情報種別フィルター"
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
          <div className="space-y-3 p-4" aria-label="地震情報を読み込み中">
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
                ? `${formatJapaneseDateHeading(archiveDate)}の記録はありません`
                : '該当する情報はありません'}
            </p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-500">
              {archiveDate
                ? '別の日付を選択するか、リアルタイム表示に戻してください。'
                : '別の検索条件や日付範囲をお試しください。'}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {archiveDate && (
                <button
                  type="button"
                  onClick={onExitArchiveMode}
                  className="rounded-md border border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] px-3.5 py-2 text-xs font-medium text-[var(--nein-accent-text)] hover:opacity-85 cursor-pointer"
                >
                  リアルタイムに戻る
                </button>
              )}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="rounded-md border border-[var(--nein-border)] bg-[var(--nein-sub)] px-3.5 py-2 text-xs font-medium text-slate-800 hover:bg-slate-200/70 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  すべて表示に戻す
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <ul data-testid="quake-list" className="divide-y divide-[var(--nein-border-subtle)]">
              {records.map((record, idx) => {
                const isSelected = record.id === selectedId;
                const title = getRecordTitle(record);
                const category = getRecordCategoryLabel(record);
                const isCopied = copiedRowId === record.id;

                let metaSummary = formatShortTime(
                  record.code === 551 ? record.earthquake.time : record.time
                );
                if (record.code === 551) {
                  metaSummary += ` · ${formatMagnitude(record.earthquake.hypocenter.magnitude)} · ${formatDepth(record.earthquake.hypocenter.depth)}`;
                } else if (record.code === 556 && record.earthquake) {
                  metaSummary += ` · 第${record.issue.serial}報 · ${formatMagnitude(record.earthquake.hypocenter.magnitude)}`;
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
                      <ScaleSquare record={record} />
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
                              テスト
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
                        aria-label={`${title} をコピー`}
                        title="この地震情報をコピー"
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
                        <span>過去の履歴を読み込み中...</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>さらに過去の履歴を読み込む（+100件）</span>
                      </>
                    )}
                  </button>
                ) : (
                  <p className="text-center font-mono text-[11px] tabular-nums text-slate-500">
                    取得可能な履歴を読み込み済み（計 {totalCount}件）
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
