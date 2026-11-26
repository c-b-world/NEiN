import {
  BellRing,
  Check,
  ChevronDown,
  CloudSun,
  Layers,
  LayoutDashboard,
  Map as MapIcon,
  Settings,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { QuakeFilter } from '../types/quake';
import { type AppLanguage, getMessages } from '../utils/i18n';
import { getExtendedMessages } from '../utils/i18nExtended';

export type AppViewMode =
  | 'dashboard'
  | 'quake'
  | 'jma_quake'
  | 'tsunami'
  | 'weather'
  | 'radar'
  | 'typhoon'
  | 'hazards'
  | 'volcano'
  | 'environment'
  | 'map'
  | 'timeline'
  | 'status'
  | 'settings';

type OpenMenuId = 'quack' | 'weather' | 'system' | null;

interface HeaderProps {
  lang: AppLanguage;
  activeView: AppViewMode;
  activeFilter: QuakeFilter;
  onSelectView: (view: AppViewMode) => void;
  onSelectFilter: (filter: QuakeFilter) => void;
  onOpenTestModal: () => void;
}

export function Header({
  lang,
  activeView,
  activeFilter,
  onSelectView,
  onSelectFilter,
  onOpenTestModal,
}: HeaderProps) {
  const m = getMessages(lang);
  const ext = getExtendedMessages(lang);
  const [openMenu, setOpenMenu] = useState<OpenMenuId>(null);
  const navRef = useRef<HTMLElement | null>(null);

  const quackSubItems: Array<{ id: QuakeFilter; label: string }> = [
    { id: 'all', label: m.nav.quackAll },
    { id: 'quake', label: m.nav.quackQuake },
    { id: 'eew', label: m.nav.quackEew },
    { id: 'other', label: m.nav.quackOther },
  ];

  const activeSubItem =
    quackSubItems.find((item) => item.id === activeFilter) ?? quackSubItems[0];

  const isQuackGroup =
    activeView === 'quake' || activeView === 'jma_quake' || activeView === 'tsunami';
  const isWeatherGroup =
    activeView === 'weather' ||
    activeView === 'radar' ||
    activeView === 'typhoon' ||
    activeView === 'hazards' ||
    activeView === 'volcano' ||
    activeView === 'environment';
  const isSystemGroup =
    activeView === 'timeline' || activeView === 'status' || activeView === 'settings';

  useEffect(() => {
    if (!openMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [openMenu]);

  const weatherSubItems: Array<{ view: AppViewMode; label: string }> = [
    { view: 'weather', label: ext.extNav.weatherForecast },
    { view: 'radar', label: ext.extNav.radarSatellite },
    { view: 'typhoon', label: ext.extNav.typhoonMarine },
    { view: 'hazards', label: ext.extNav.hazardsFlood },
    { view: 'volcano', label: ext.extNav.volcano },
    { view: 'environment', label: ext.extNav.environment },
  ];

  const systemSubItems: Array<{ view: AppViewMode; label: string }> = [
    { view: 'timeline', label: ext.extNav.timeline },
    { view: 'status', label: ext.extNav.systemStatus },
    { view: 'settings', label: ext.extNav.settings },
  ];

  return (
    <header className="border-b border-[var(--nein-border)] bg-[var(--nein-header)] transition-colors">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setOpenMenu(null);
            onSelectView('dashboard');
          }}
          className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--nein-accent)]"
        >
          NEiN
        </a>

        <nav
          ref={navRef}
          aria-label={m.nav.navAria}
          className="hidden md:flex items-center gap-4 lg:gap-6"
        >
          {/* Comprehensive Dashboard */}
          <button
            type="button"
            data-testid="nav-dashboard"
            onClick={() => {
              setOpenMenu(null);
              onSelectView('dashboard');
            }}
            className={`relative inline-flex items-center gap-1.5 py-1 text-xs lg:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeView === 'dashboard'
                ? 'text-[var(--nein-accent-text)]'
                : 'text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-slate-100'
            }`}
          >
            <LayoutDashboard className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
            <span>{ext.extNav.dashboard}</span>
            {activeView === 'dashboard' && (
              <span aria-hidden="true" className="absolute inset-x-0 -bottom-3 h-0.5 bg-[var(--nein-accent)]" />
            )}
          </button>

          {/* Folded NEiN QUACK + JMA Quake + Tsunami Dropdown */}
          <div className="relative">
            <button
              type="button"
              data-testid="nav-nein-quack"
              aria-expanded={openMenu === 'quack'}
              aria-haspopup="menu"
              onClick={() => {
                if (!isQuackGroup) {
                  onSelectFilter(activeFilter);
                  setOpenMenu('quack');
                } else {
                  setOpenMenu((prev) => (prev === 'quack' ? null : 'quack'));
                }
              }}
              className={`relative inline-flex items-center gap-1.5 py-1 text-xs lg:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isQuackGroup
                  ? 'text-[var(--nein-accent-text)]'
                  : 'text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-slate-100'
              }`}
            >
              <Layers className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
              <span>{m.nav.quack}</span>
              <span className="hidden xl:inline text-xs font-medium text-slate-500 dark:text-slate-400">
                / {activeView === 'jma_quake' ? 'JMA' : activeView === 'tsunami' ? 'Tsunami' : activeSubItem.label}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-150 ${
                  openMenu === 'quack' ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
              {isQuackGroup && (
                <span aria-hidden="true" className="absolute inset-x-0 -bottom-3 h-0.5 bg-[var(--nein-accent)]" />
              )}
            </button>

            {openMenu === 'quack' && (
              <div
                role="menu"
                data-testid="quack-dropdown-menu"
                aria-label={m.nav.quack}
                className="absolute left-0 top-full z-40 mt-3 w-64 overflow-hidden rounded-lg border border-[var(--nein-border)] bg-[var(--nein-surface)] p-1.5 shadow-xl"
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
                        setOpenMenu(null);
                      }}
                      className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                        isItemActive
                          ? 'bg-[var(--nein-accent-soft)] font-semibold text-[var(--nein-accent-text)]'
                          : 'text-slate-700 hover:bg-[var(--nein-sub)] hover:text-slate-950 dark:text-slate-300 dark:hover:text-slate-100'
                      }`}
                    >
                      <span>{item.label}</span>
                      {isItemActive && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                    </button>
                  );
                })}
                <div className="my-1 border-t border-[var(--nein-border-subtle)]" />
                <button
                  type="button"
                  data-testid="quack-submenu-jma"
                  onClick={() => {
                    onSelectView('jma_quake');
                    setOpenMenu(null);
                  }}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    activeView === 'jma_quake'
                      ? 'bg-[var(--nein-accent-soft)] font-semibold text-[var(--nein-accent-text)]'
                      : 'text-slate-700 hover:bg-[var(--nein-sub)] dark:text-slate-300'
                  }`}
                >
                  <span>{ext.extNav.quackExtended}</span>
                  {activeView === 'jma_quake' && <Check className="h-3.5 w-3.5 shrink-0" />}
                </button>
                <button
                  type="button"
                  data-testid="quack-submenu-tsunami"
                  onClick={() => {
                    onSelectView('tsunami');
                    setOpenMenu(null);
                  }}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    activeView === 'tsunami'
                      ? 'bg-[var(--nein-accent-soft)] font-semibold text-[var(--nein-accent-text)]'
                      : 'text-slate-700 hover:bg-[var(--nein-sub)] dark:text-slate-300'
                  }`}
                >
                  <span>{ext.extNav.tsunamiMonitor}</span>
                  {activeView === 'tsunami' && <Check className="h-3.5 w-3.5 shrink-0" />}
                </button>
              </div>
            )}
          </div>

          {/* NEiN WEATHER Suite Dropdown */}
          <div className="relative">
            <button
              type="button"
              data-testid="nav-nein-weather"
              aria-expanded={openMenu === 'weather'}
              aria-haspopup="menu"
              onClick={() => {
                if (!isWeatherGroup) {
                  onSelectView('weather');
                  setOpenMenu('weather');
                } else {
                  setOpenMenu((prev) => (prev === 'weather' ? null : 'weather'));
                }
              }}
              className={`relative inline-flex items-center gap-1.5 py-1 text-xs lg:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isWeatherGroup
                  ? 'text-[var(--nein-accent-text)]'
                  : 'text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-slate-100'
              }`}
            >
              <CloudSun className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
              <span>{ext.extNav.weatherMenu}</span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-150 ${
                  openMenu === 'weather' ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
              {isWeatherGroup && (
                <span aria-hidden="true" className="absolute inset-x-0 -bottom-3 h-0.5 bg-[var(--nein-accent)]" />
              )}
            </button>

            {openMenu === 'weather' && (
              <div
                role="menu"
                className="absolute left-0 top-full z-40 mt-3 w-64 overflow-hidden rounded-lg border border-[var(--nein-border)] bg-[var(--nein-surface)] p-1.5 shadow-xl"
              >
                {weatherSubItems.map((item) => {
                  const isItemActive = activeView === item.view;
                  return (
                    <button
                      key={item.view}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onSelectView(item.view);
                        setOpenMenu(null);
                      }}
                      className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                        isItemActive
                          ? 'bg-[var(--nein-accent-soft)] font-semibold text-[var(--nein-accent-text)]'
                          : 'text-slate-700 hover:bg-[var(--nein-sub)] dark:text-slate-300'
                      }`}
                    >
                      <span>{item.label}</span>
                      {isItemActive && <Check className="h-3.5 w-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Integrated National Disaster Map */}
          <button
            type="button"
            data-testid="nav-integrated-map"
            onClick={() => {
              setOpenMenu(null);
              onSelectView('map');
            }}
            className={`relative inline-flex items-center gap-1.5 py-1 text-xs lg:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeView === 'map'
                ? 'text-[var(--nein-accent-text)]'
                : 'text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-slate-100'
            }`}
          >
            <MapIcon className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
            <span>{ext.extNav.integratedMap}</span>
            {activeView === 'map' && (
              <span aria-hidden="true" className="absolute inset-x-0 -bottom-3 h-0.5 bg-[var(--nein-accent)]" />
            )}
          </button>

          {/* System / Monitor / Settings Dropdown */}
          <div className="relative">
            <button
              type="button"
              data-testid="nav-system-settings"
              aria-expanded={openMenu === 'system'}
              aria-haspopup="menu"
              onClick={() => {
                if (!isSystemGroup) {
                  onSelectView('settings');
                  setOpenMenu('system');
                } else {
                  setOpenMenu((prev) => (prev === 'system' ? null : 'system'));
                }
              }}
              className={`relative inline-flex items-center gap-1.5 py-1 text-xs lg:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isSystemGroup
                  ? 'text-[var(--nein-accent-text)]'
                  : 'text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-slate-100'
              }`}
            >
              <Settings className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
              <span>{ext.extNav.systemMenu}</span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-150 ${
                  openMenu === 'system' ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
              {isSystemGroup && (
                <span aria-hidden="true" className="absolute inset-x-0 -bottom-3 h-0.5 bg-[var(--nein-accent)]" />
              )}
            </button>

            {openMenu === 'system' && (
              <div
                role="menu"
                className="absolute right-0 top-full z-40 mt-3 w-56 overflow-hidden rounded-lg border border-[var(--nein-border)] bg-[var(--nein-surface)] p-1.5 shadow-xl"
              >
                {systemSubItems.map((item) => {
                  const isItemActive = activeView === item.view;
                  return (
                    <button
                      key={item.view}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onSelectView(item.view);
                        setOpenMenu(null);
                      }}
                      className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                        isItemActive
                          ? 'bg-[var(--nein-accent-soft)] font-semibold text-[var(--nein-accent-text)]'
                          : 'text-slate-700 hover:bg-[var(--nein-sub)] dark:text-slate-300'
                      }`}
                    >
                      <span>{item.label}</span>
                      {isItemActive && <Check className="h-3.5 w-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenTestModal}
            className="inline-flex items-center gap-2 rounded-md border border-amber-500/50 bg-amber-500/15 px-3.5 py-2 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-500/25 dark:border-amber-500/40 dark:text-amber-200 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
          >
            <BellRing className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{m.nav.testDispatch}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
