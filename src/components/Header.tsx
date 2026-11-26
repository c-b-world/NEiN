import { BellRing, Check, ChevronDown, CloudSun, Layers, Settings } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { QuakeFilter } from '../types/quake';
import { type AppLanguage, getMessages } from '../utils/i18n';

export type AppViewMode = 'quake' | 'weather' | 'settings';

interface HeaderProps {
  lang: AppLanguage;
  activeView: AppViewMode;
  activeFilter: QuakeFilter;
  onSelectFilter: (filter: QuakeFilter) => void;
  onSelectWeather: () => void;
  onSelectSettings: () => void;
  onOpenTestModal: () => void;
}

export function Header({
  lang,
  activeView,
  activeFilter,
  onSelectFilter,
  onSelectWeather,
  onSelectSettings,
  onOpenTestModal,
}: HeaderProps) {
  const m = getMessages(lang);
  const [quackMenuOpen, setQuackMenuOpen] = useState(false);
  const quackDropdownRef = useRef<HTMLDivElement | null>(null);

  const quackSubItems: Array<{ id: QuakeFilter; label: string }> = [
    { id: 'all', label: m.nav.quackAll },
    { id: 'quake', label: m.nav.quackQuake },
    { id: 'eew', label: m.nav.quackEew },
    { id: 'other', label: m.nav.quackOther },
  ];

  const activeSubItem =
    quackSubItems.find((item) => item.id === activeFilter) ?? quackSubItems[0];

  useEffect(() => {
    if (!quackMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        quackDropdownRef.current &&
        !quackDropdownRef.current.contains(e.target as Node)
      ) {
        setQuackMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setQuackMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [quackMenuOpen]);

  return (
    <header className="border-b border-[var(--nein-border)] bg-[var(--nein-header)] transition-colors">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-6 px-4 py-3.5 sm:px-6">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setQuackMenuOpen(false);
            onSelectFilter('all');
          }}
          className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--nein-accent)]"
        >
          NEiN
        </a>

        <nav
          aria-label={m.nav.navAria}
          className="hidden md:flex items-center gap-6 lg:gap-8"
        >
          {/* Folded NEiN QUACK Tab + Dropdown Menu */}
          <div ref={quackDropdownRef} className="relative">
            <button
              type="button"
              data-testid="nav-nein-quack"
              aria-expanded={quackMenuOpen}
              aria-haspopup="menu"
              onClick={() => {
                if (activeView !== 'quake') {
                  onSelectFilter(activeFilter);
                  setQuackMenuOpen(true);
                } else {
                  setQuackMenuOpen((prev) => !prev);
                }
              }}
              className={`relative inline-flex items-center gap-1.5 py-1 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--nein-accent)] ${
                activeView === 'quake'
                  ? 'text-[var(--nein-accent-text)]'
                  : 'text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-slate-100'
              }`}
            >
              <Layers className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
              <span>{m.nav.quack}</span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                / {activeSubItem.label}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-150 ${
                  quackMenuOpen ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
              {activeView === 'quake' && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 -bottom-3.5 h-0.5 bg-[var(--nein-accent)]"
                />
              )}
            </button>

            {quackMenuOpen && (
              <div
                role="menu"
                data-testid="quack-dropdown-menu"
                aria-label={m.nav.quack}
                className="absolute left-0 top-full z-40 mt-3 w-52 overflow-hidden rounded-lg border border-[var(--nein-border)] bg-[var(--nein-surface)] p-1.5 shadow-xl"
              >
                {quackSubItems.map((item) => {
                  const isItemActive = activeView === 'quake' && activeFilter === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="menuitemradio"
                      aria-checked={isItemActive}
                      data-testid={`quack-submenu-${item.id}`}
                      onClick={() => {
                        onSelectFilter(item.id);
                        setQuackMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                        isItemActive
                          ? 'bg-[var(--nein-accent-soft)] font-semibold text-[var(--nein-accent-text)]'
                          : 'text-slate-700 hover:bg-[var(--nein-sub)] hover:text-slate-950 dark:text-slate-300 dark:hover:text-slate-100'
                      }`}
                    >
                      <span>{item.label}</span>
                      {isItemActive && (
                        <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="button"
            data-testid="nav-nein-weather"
            onClick={() => {
              setQuackMenuOpen(false);
              onSelectWeather();
            }}
            className={`relative inline-flex items-center gap-1.5 py-1 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--nein-accent)] ${
              activeView === 'weather'
                ? 'text-[var(--nein-accent-text)]'
                : 'text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-slate-100'
            }`}
          >
            <CloudSun className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
            <span>{m.nav.weather}</span>
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
            onClick={() => {
              setQuackMenuOpen(false);
              onSelectSettings();
            }}
            className={`relative inline-flex items-center gap-1.5 py-1 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--nein-accent)] ${
              activeView === 'settings'
                ? 'text-[var(--nein-accent-text)]'
                : 'text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-slate-100'
            }`}
          >
            <Settings className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
            <span>{m.nav.settings}</span>
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
            <span>{m.nav.testDispatch}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
