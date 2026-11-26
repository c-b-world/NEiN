import { BellRing, Check, ChevronDown, Settings } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { type AppLanguage, getMessages } from '../utils/i18n';

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
  | 'marine'
  | 'environment'
  | 'map'
  | 'monitor'
  | 'replay'
  | 'timeline'
  | 'status'
  | 'settings';

export type NavGroupId = 'quake' | 'weather' | 'disaster' | 'tools';

export interface NavSubItem {
  view: AppViewMode;
  matchViews?: AppViewMode[];
  testId?: string;
  labels: Record<AppLanguage, string>;
}

export interface NavGroupDef {
  id: NavGroupId;
  title: string;
  testId: string;
  defaultView: AppViewMode;
  items: NavSubItem[];
}

export const NAV_GROUPS: NavGroupDef[] = [
  {
    id: 'quake',
    title: 'QUAKE',
    testId: 'nav-nein-quack',
    defaultView: 'quake',
    items: [
      {
        view: 'quake',
        matchViews: ['quake', 'jma_quake'],
        testId: 'quack-submenu-all',
        labels: { ja: '地震', en: 'Earthquake', zh: '地震', ko: '지진' },
      },
      {
        view: 'tsunami',
        testId: 'quack-submenu-tsunami',
        labels: { ja: '津波', en: 'Tsunami', zh: '海啸', ko: '지진해일' },
      },
    ],
  },
  {
    id: 'weather',
    title: 'WEATHER',
    testId: 'nav-nein-weather',
    defaultView: 'weather',
    items: [
      {
        view: 'weather',
        testId: 'weather-submenu-forecast',
        labels: { ja: '天気予報', en: 'Forecast', zh: '天气预报', ko: '일기예보' },
      },
      {
        view: 'radar',
        testId: 'weather-submenu-radar',
        labels: { ja: 'レーダー', en: 'Radar', zh: '雷达', ko: '레이더' },
      },
      {
        view: 'typhoon',
        testId: 'weather-submenu-typhoon',
        labels: { ja: '台風', en: 'Typhoon', zh: '台风', ko: '태풍' },
      },
      {
        view: 'marine',
        testId: 'weather-submenu-marine',
        labels: { ja: '海洋', en: 'Marine', zh: '海洋', ko: '해양' },
      },
      {
        view: 'environment',
        testId: 'weather-submenu-environment',
        labels: { ja: '環境', en: 'Environment', zh: '环境', ko: '환경' },
      },
    ],
  },
  {
    id: 'disaster',
    title: 'DISASTER',
    testId: 'nav-disaster',
    defaultView: 'hazards',
    items: [
      {
        view: 'hazards',
        testId: 'disaster-submenu-flood',
        labels: {
          ja: '洪水・土砂災害',
          en: 'Flood & Landslide',
          zh: '洪水・泥石流',
          ko: '홍수・산사태',
        },
      },
      {
        view: 'volcano',
        testId: 'disaster-submenu-volcano',
        labels: { ja: '火山', en: 'Volcano', zh: '火山', ko: '화산' },
      },
      {
        view: 'map',
        testId: 'nav-integrated-map',
        labels: { ja: '防災マップ', en: 'Disaster Map', zh: '防灾地图', ko: '방재 지도' },
      },
    ],
  },
  {
    id: 'tools',
    title: 'TOOLS',
    testId: 'nav-tools',
    defaultView: 'monitor',
    items: [
      {
        view: 'monitor',
        testId: 'tools-submenu-monitor',
        labels: { ja: '監視モード', en: 'Monitor Mode', zh: '监测模式', ko: '모니터링' },
      },
      {
        view: 'replay',
        matchViews: ['replay', 'timeline'],
        testId: 'tools-submenu-replay',
        labels: { ja: '履歴再生', en: 'History Replay', zh: '历史回放', ko: '이력 재생' },
      },
      {
        view: 'status',
        testId: 'tools-submenu-status',
        labels: { ja: '稼働状況', en: 'System Status', zh: '运行状态', ko: '가동 현황' },
      },
    ],
  },
];

interface HeaderProps {
  lang: AppLanguage;
  activeView: AppViewMode;
  onSelectView: (view: AppViewMode) => void;
  onOpenTestModal: () => void;
}

export function isGroupActive(group: NavGroupDef, activeView: AppViewMode): boolean {
  return group.items.some((item) =>
    item.matchViews ? item.matchViews.includes(activeView) : item.view === activeView,
  );
}

export function Header({
  lang,
  activeView,
  onSelectView,
  onOpenTestModal,
}: HeaderProps) {
  const m = getMessages(lang);
  const [openMenu, setOpenMenu] = useState<NavGroupId | null>(null);
  const navRef = useRef<HTMLElement | null>(null);

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

        {/* Desktop Primary Top Bar matching HOME / QUAKE ▾ / WEATHER ▾ / DISASTER ▾ / TOOLS ▾ / ⚙ */}
        <nav
          ref={navRef}
          aria-label={m.nav.navAria}
          className="hidden md:flex items-center gap-6 lg:gap-7"
        >
          <button
            type="button"
            data-testid="nav-dashboard"
            onClick={() => {
              setOpenMenu(null);
              onSelectView('dashboard');
            }}
            className={`relative inline-flex items-center py-1 text-sm font-bold tracking-wide transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--nein-accent)] ${
              activeView === 'dashboard'
                ? 'text-[var(--nein-accent-text)]'
                : 'text-slate-700 hover:text-slate-950 dark:text-slate-200 dark:hover:text-white'
            }`}
          >
            <span>HOME</span>
            {activeView === 'dashboard' && (
              <span
                aria-hidden="true"
                className="absolute inset-x-0 -bottom-3 h-0.5 bg-[var(--nein-accent)]"
              />
            )}
          </button>

          {NAV_GROUPS.map((group) => {
            const active = isGroupActive(group, activeView);
            const expanded = openMenu === group.id;
            return (
              <div key={group.id} className="relative">
                <button
                  type="button"
                  data-testid={group.testId}
                  aria-expanded={expanded}
                  aria-haspopup="menu"
                  onClick={() => setOpenMenu((prev) => (prev === group.id ? null : group.id))}
                  className={`relative inline-flex items-center gap-1.5 py-1 text-sm font-bold tracking-wide transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--nein-accent)] ${
                    active || expanded
                      ? 'text-[var(--nein-accent-text)]'
                      : 'text-slate-700 hover:text-slate-950 dark:text-slate-200 dark:hover:text-white'
                  }`}
                >
                  <span>{group.title}</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-150 ${
                      expanded ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 -bottom-3 h-0.5 bg-[var(--nein-accent)]"
                    />
                  )}
                </button>

                {expanded && (
                  <div
                    role="menu"
                    data-testid={group.id === 'quake' ? 'quack-dropdown-menu' : `${group.id}-dropdown-menu`}
                    aria-label={group.title}
                    className="absolute left-0 top-full z-40 mt-3 w-52 overflow-hidden rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)] p-2 shadow-xl"
                  >
                    <div className="mb-1.5 border-b border-[var(--nein-border-subtle)] px-2.5 pb-2 pt-1 text-xs font-extrabold tracking-wider text-slate-500 dark:text-slate-400">
                      {group.title}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {group.items.map((item) => {
                        const isItemActive = item.matchViews
                          ? item.matchViews.includes(activeView)
                          : activeView === item.view;
                        return (
                          <button
                            key={item.view}
                            type="button"
                            role="menuitem"
                            data-testid={item.testId}
                            onClick={() => {
                              onSelectView(item.view);
                              setOpenMenu(null);
                            }}
                            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                              isItemActive
                                ? 'bg-[var(--nein-accent-soft)] font-semibold text-[var(--nein-accent-text)]'
                                : 'text-slate-700 hover:bg-[var(--nein-sub)] hover:text-slate-950 dark:text-slate-200 dark:hover:text-white'
                            }`}
                          >
                            <span>{item.labels[lang]}</span>
                            {isItemActive && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <button
            type="button"
            data-testid="nav-system-settings"
            aria-label={m.nav.settings}
            title={m.nav.settings}
            onClick={() => {
              setOpenMenu(null);
              onSelectView('settings');
            }}
            className={`relative inline-flex items-center justify-center rounded-md p-1.5 transition-colors shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--nein-accent)] ${
              activeView === 'settings'
                ? 'text-[var(--nein-accent-text)]'
                : 'text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            <Settings className="h-[19px] w-[19px]" aria-hidden="true" />
            {activeView === 'settings' && (
              <span
                aria-hidden="true"
                className="absolute inset-x-0 -bottom-2.5 h-0.5 bg-[var(--nein-accent)]"
              />
            )}
          </button>
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
