import { BellRing, CloudSun, Settings } from 'lucide-react';
import type { QuakeFilter } from '../types/quake';

export type AppViewMode = 'quake' | 'weather' | 'settings';

interface HeaderProps {
  activeView: AppViewMode;
  activeFilter: QuakeFilter;
  onSelectFilter: (filter: QuakeFilter) => void;
  onSelectWeather: () => void;
  onSelectSettings: () => void;
  onOpenTestModal: () => void;
}

const NAV_ITEMS: Array<{ id: QuakeFilter; label: string }> = [
  { id: 'all', label: '新着履歴' },
  { id: 'quake', label: '地震情報' },
  { id: 'eew', label: '緊急地震速報' },
  { id: 'other', label: '津波・感知' },
];

export function Header({
  activeView,
  activeFilter,
  onSelectFilter,
  onSelectWeather,
  onSelectSettings,
  onOpenTestModal,
}: HeaderProps) {
  return (
    <header className="border-b border-[var(--nein-border)] bg-[var(--nein-header)] transition-colors">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-6 px-4 py-3.5 sm:px-6">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onSelectFilter('all');
          }}
          className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--nein-accent)]"
        >
          NEiN
        </a>

        <nav
          aria-label="情報カテゴリ"
          className="hidden md:flex items-center gap-5 lg:gap-6"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === 'quake' && activeFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectFilter(item.id)}
                className={`relative py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--nein-accent)] ${
                  isActive
                    ? 'text-slate-950 dark:text-slate-50 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-3.5 h-0.5 bg-[var(--nein-accent)]"
                  />
                )}
              </button>
            );
          })}

          <button
            type="button"
            onClick={onSelectWeather}
            className={`relative inline-flex items-center gap-1.5 py-1 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--nein-accent)] ${
              activeView === 'weather'
                ? 'text-[var(--nein-accent-text)]'
                : 'text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-slate-100'
            }`}
          >
            <CloudSun className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
            <span>NEiN WEATHER</span>
            {activeView === 'weather' && (
              <span
                aria-hidden="true"
                className="absolute inset-x-0 -bottom-3.5 h-0.5 bg-[var(--nein-accent)]"
              />
            )}
          </button>

          <button
            type="button"
            data-testid="nav-system-settings"
            onClick={onSelectSettings}
            className={`relative inline-flex items-center gap-1.5 py-1 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--nein-accent)] ${
              activeView === 'settings'
                ? 'text-[var(--nein-accent-text)]'
                : 'text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-slate-100'
            }`}
          >
            <Settings className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
            <span>システム設定</span>
            {activeView === 'settings' && (
              <span
                aria-hidden="true"
                className="absolute inset-x-0 -bottom-3.5 h-0.5 bg-[var(--nein-accent)]"
              />
            )}
          </button>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenTestModal}
            className="inline-flex items-center gap-2 rounded-md border border-amber-500/50 bg-amber-500/15 px-4 py-2 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-500/25 dark:border-amber-500/40 dark:text-amber-200 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
          >
            <BellRing className="h-3.5 w-3.5" aria-hidden="true" />
            <span>テスト送信</span>
          </button>
        </div>
      </div>
    </header>
  );
}
