import { BellRing, CloudSun } from 'lucide-react';
import type { QuakeFilter } from '../types/quake';

export type AppViewMode = 'quake' | 'weather';

interface HeaderProps {
  activeView: AppViewMode;
  activeFilter: QuakeFilter;
  onSelectFilter: (filter: QuakeFilter) => void;
  onSelectWeather: () => void;
  onOpenTestModal: () => void;
}

const NAV_ITEMS: Array<{ id: QuakeFilter; label: string }> = [
  { id: 'all', label: '新着30件' },
  { id: 'quake', label: '地震情報' },
  { id: 'eew', label: '緊急地震速報' },
  { id: 'other', label: '津波・感知' },
];

export function Header({
  activeView,
  activeFilter,
  onSelectFilter,
  onSelectWeather,
  onOpenTestModal,
}: HeaderProps) {
  return (
    <header className="border-b border-slate-800 bg-[#0B101B]">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-6 px-4 py-3.5 sm:px-6">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onSelectFilter('all');
          }}
          className="text-xl font-extrabold tracking-tight text-slate-50 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-400"
        >
          NEiN
        </a>

        <nav
          aria-label="情報カテゴリ"
          className="hidden md:flex items-center gap-6"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === 'quake' && activeFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectFilter(item.id)}
                className={`relative py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-400 ${
                  isActive
                    ? 'text-slate-50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-3.5 h-0.5 bg-sky-400"
                  />
                )}
              </button>
            );
          })}

          <button
            type="button"
            onClick={onSelectWeather}
            className={`relative inline-flex items-center gap-1.5 py-1 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-400 ${
              activeView === 'weather'
                ? 'text-sky-300'
                : 'text-slate-300 hover:text-sky-200'
            }`}
          >
            <CloudSun className="h-4 w-4 text-sky-400" aria-hidden="true" />
            <span>NEiN WEATHER</span>
            {activeView === 'weather' && (
              <span
                aria-hidden="true"
                className="absolute inset-x-0 -bottom-3.5 h-0.5 bg-sky-400"
              />
            )}
          </button>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenTestModal}
            className="inline-flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/15 px-4 py-2 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-500/25 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
          >
            <BellRing className="h-3.5 w-3.5" aria-hidden="true" />
            <span>テスト送信</span>
          </button>
        </div>
      </div>
    </header>
  );
}
