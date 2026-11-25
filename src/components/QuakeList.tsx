import { Check, Copy, Search, X } from 'lucide-react';
import { useState } from 'react';
import type { P2PQuakeRecord, QuakeFilter } from '../types/quake';
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

interface QuakeListProps {
  records: P2PQuakeRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  filter: QuakeFilter;
  onFilterChange: (filter: QuakeFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  counts: {
    all: number;
    quake: number;
    eew: number;
    other: number;
  };
  isLoading: boolean;
}

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
        <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-md border border-slate-700 bg-slate-800 text-slate-300">
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
    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-md border border-slate-800 bg-slate-900 text-slate-400">
      <span className="text-[10px] font-medium leading-tight">感知</span>
    </div>
  );
}

export function QuakeList({
  records,
  selectedId,
  onSelect,
  filter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  counts,
  isLoading,
}: QuakeListProps) {
  const [copiedRowId, setCopiedRowId] = useState<string | null>(null);

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
      aria-label="新着地震情報一覧"
      className="flex w-full flex-col rounded-lg border border-slate-800 bg-[#0D131F] lg:w-[440px] lg:shrink-0"
    >
      <div className="border-b border-slate-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-100">
            新着履歴（最大30件）
          </h2>
          <span className="font-mono text-xs tabular-nums text-slate-400">
            {records.length}件表示
          </span>
        </div>

        <div className="relative">
          <label htmlFor="quake-search-input" className="sr-only">
            震源地や地域名で検索
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500"
            aria-hidden="true"
          />
          <input
            id="quake-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="震源地・都道府県で絞り込み"
            className="w-full rounded-md border border-slate-800 bg-[#090D16] py-2 pl-9 pr-8 text-xs text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="検索をクリア"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        <div
          role="tablist"
          aria-label="情報種別フィルター"
          className="grid grid-cols-4 gap-1 rounded-md border border-slate-800/80 bg-[#090D16] p-1"
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
                className={`min-w-0 truncate rounded px-1.5 py-1.5 text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-400 ${
                  active
                    ? 'bg-slate-800 text-slate-50'
                    : 'text-slate-400 hover:text-slate-200'
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

      <div className="max-h-[620px] overflow-y-auto divide-y divide-slate-800/70">
        {isLoading ? (
          <div className="space-y-3 p-4" aria-label="地震情報を読み込み中">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-md border border-slate-800/50 bg-[#090D16] p-3 animate-pulse"
              >
                <div className="h-11 w-11 rounded-md bg-slate-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-slate-800" />
                  <div className="h-3 w-1/2 rounded bg-slate-800/80" />
                </div>
              </div>
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-300">
              該当する情報はありません
            </p>
            <p className="mt-1 text-xs text-slate-500">
              別のカテゴリまたは検索条件をお試しください。
            </p>
            <button
              type="button"
              onClick={() => {
                onFilterChange('all');
                onSearchChange('');
              }}
              className="mt-4 rounded-md border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 cursor-pointer"
            >
              すべて表示に戻す
            </button>
          </div>
        ) : (
          <ul data-testid="quake-list" className="divide-y divide-slate-800/70">
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
                      ? 'bg-sky-500/10'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(record.id)}
                    aria-current={isSelected ? 'true' : undefined}
                    aria-label={`${title} ${metaSummary}`}
                    className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-sky-400"
                  >
                    <ScaleSquare record={record} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`truncate text-sm font-semibold ${
                            isSelected ? 'text-sky-200' : 'text-slate-100'
                          }`}
                        >
                          {title}
                        </span>
                        {record.isTest && (
                          <span className="shrink-0 text-[11px] font-medium text-amber-400">
                            テスト
                          </span>
                        )}
                      </div>
                      <p className="mt-1 truncate font-mono text-xs tabular-nums text-slate-400">
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
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-md border text-xs transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-400 ${
                        isCopied
                          ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                          : 'border-transparent text-slate-400 hover:border-slate-700 hover:bg-slate-800 hover:text-slate-100'
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
        )}
      </div>
    </aside>
  );
}
