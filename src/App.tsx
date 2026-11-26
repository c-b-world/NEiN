/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AlertCircle, ChevronDown, LayoutDashboard, Settings } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { BackgroundMotionLayer } from './components/BackgroundMotionLayer';
import { BgmPlayerEngine } from './components/BgmPlayerEngine';
import { EEWWarningModal } from './components/EEWWarningModal';
import {
  Header,
  NAV_GROUPS,
  type AppViewMode,
  type NavGroupId,
  isGroupActive,
} from './components/Header';
import { InAppToastContainer } from './components/InAppToastContainer';
import { QuakeDetailPanel } from './components/QuakeDetailPanel';
import { QuakeList } from './components/QuakeList';
import { StartupSplashScreen } from './components/StartupSplashScreen';
import { SystemSettingsPanel } from './components/SystemSettingsPanel';
import { TestDispatchModal } from './components/TestDispatchModal';
import { WorkspaceToolbar } from './components/WorkspaceToolbar';
import { ComprehensiveDashboard } from './components/dashboard/ComprehensiveDashboard';
import { NationalDisasterMap } from './components/map/NationalDisasterMap';
import { QuakeExtendedPanel } from './components/quake/QuakeExtendedPanel';
import { RealtimeMonitorView } from './components/system/RealtimeMonitorView';
import { ReplayArchiveView } from './components/system/ReplayArchiveView';
import { SystemStatusPanel } from './components/system/SystemStatusPanel';
import { DisasterHazardsView } from './components/weather/DisasterHazardsView';
import { EnvironmentView } from './components/weather/EnvironmentView';
import { RadarSatelliteView } from './components/weather/RadarSatelliteView';
import { TyphoonMarineView } from './components/weather/TyphoonMarineView';
import { VolcanoView } from './components/weather/VolcanoView';
import { WeatherDashboard } from './components/weather/WeatherDashboard';
import { useDisasterHub } from './hooks/useDisasterHub';
import { useQuakeFeed } from './hooks/useQuakeFeed';
import type { RegisteredRegion } from './types/disaster';
import type { EEW556, QuakeFilter } from './types/quake';
import {
  type AppLanguage,
  applyLanguageToDocument,
  getMessages,
  loadLanguage,
  saveLanguage,
} from './utils/i18n';
import { getExtendedMessages } from './utils/i18nExtended';
import {
  type BackgroundMotionId,
  type ColorThemeId,
  DEFAULT_THEME_SETTINGS,
  type ThemeSettings,
  applyThemeToDocument,
  loadThemeSettings,
  resolveEffectiveBackgroundMotion,
  saveThemeSettings,
} from './utils/themeSettings';
import {
  type BgmSettings,
  clampBgmVolume,
  loadBgmSettings,
  saveBgmSettings,
} from './utils/bgmManager';
import {
  type CurrentLocationContext,
  type EewSpeechSettings,
  analyzeLocalEewImpact,
  buildEewSpeechSegments,
  getSpeechErrorMessage,
  isSpeechSynthesisSupported,
  loadEewSpeechSettings,
  resolveCurrentLocationContext,
  resolveEffectiveSpeechLanguage,
  saveEewSpeechSettings,
  speakDisasterSegments,
  stopDisasterAnnouncement,
} from './utils/eewSpeech';
import { localizeJapanesePlaceName } from './utils/eewSpeechLocale';
import {
  createRegionFromOffice,
  findNearestWeatherOffice,
} from './utils/regionWatchlist';

export default function App() {
  const {
    records,
    filteredRecords,
    selectedRecord,
    selectedId,
    setSelectedId,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    minScale,
    setMinScale,
    minMagnitude,
    setMinMagnitude,
    resetSearchFilters,
    hasActiveFilters,
    isLoading,
    isRefreshing,
    isLoadingMore,
    canLoadMore,
    loadMoreHistory,
    error,
    lastUpdated,
    autoUpdateEnabled,
    setAutoUpdateEnabled,
    pollIntervalSec,
    setPollIntervalSec,
    nextRefreshIn,
    wsStatus,
    soundEnabled,
    setSoundEnabled,
    notificationEnabled,
    notificationHint,
    dismissNotificationHint,
    toggleNotificationEnabled,
    activeEEW,
    dismissEEW,
    refreshNow,
    triggerTestEEW,
    clearTestRecords,
    hasTestRecords,
    archiveDate,
    selectArchiveDate,
    exitArchiveMode,
    counts,
  } = useQuakeFeed();

  const [activeView, setActiveView] = useState<AppViewMode>('dashboard');
  const [mobileOpenGroup, setMobileOpenGroup] = useState<NavGroupId | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [showStartupSplash, setShowStartupSplash] = useState(true);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(() => loadThemeSettings());
  const [bgmSettings, setBgmSettings] = useState<BgmSettings>(() => loadBgmSettings());
  const [eewSpeechSettings, setEewSpeechSettings] = useState<EewSpeechSettings>(() =>
    loadEewSpeechSettings(),
  );
  const [detectedLocation, setDetectedLocation] = useState<RegisteredRegion | null>(null);
  const [isEewSpeaking, setIsEewSpeaking] = useState(false);
  const [lastSpokenScript, setLastSpokenScript] = useState<string | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [lang, setLang] = useState<AppLanguage>(() => loadLanguage());
  const detailContainerRef = useRef<HTMLDivElement | null>(null);
  const mobileNavRef = useRef<HTMLDivElement | null>(null);

  const m = getMessages(lang);
  const ext = getExtendedMessages(lang);

  const hub = useDisasterHub(lang, records);
  const speechSupported = isSpeechSynthesisSupported();
  const effectiveSpeechLang = resolveEffectiveSpeechLanguage(eewSpeechSettings.speechLanguage, lang);
  const currentLocation = resolveCurrentLocationContext(detectedLocation, hub.registeredRegions);
  const activeEewImpact = activeEEW
    ? analyzeLocalEewImpact(activeEEW, currentLocation, {
        regionSnapshots: hub.regionSnapshots,
        jmaTsunamis: hub.jmaTsunamis,
      })
    : null;

  useEffect(() => {
    applyThemeToDocument(themeSettings);
    saveThemeSettings(themeSettings);
  }, [themeSettings]);

  useEffect(() => {
    saveBgmSettings(bgmSettings);
  }, [bgmSettings]);

  useEffect(() => {
    saveEewSpeechSettings(eewSpeechSettings);
  }, [eewSpeechSettings]);

  useEffect(() => {
    applyLanguageToDocument(lang);
    saveLanguage(lang);
  }, [lang]);

  useEffect(() => {
    if (activeEEW && showStartupSplash) {
      setShowStartupSplash(false);
    }
  }, [activeEEW, showStartupSplash]);

  // Keep latest speech settings & hub context in a ref so activeEEW updates speak once per alert revision
  const speechContextRef = useRef({
    eewSpeechSettings,
    currentLocation,
    regionSnapshots: hub.regionSnapshots,
    jmaTsunamis: hub.jmaTsunamis,
    lang,
    effectiveSpeechLang,
    soundEnabled,
  });
  speechContextRef.current = {
    eewSpeechSettings,
    currentLocation,
    regionSnapshots: hub.regionSnapshots,
    jmaTsunamis: hub.jmaTsunamis,
    lang,
    effectiveSpeechLang,
    soundEnabled,
  };

  const activeEewKey = activeEEW
    ? `${activeEEW.id}:${activeEEW.code === 556 ? `${activeEEW.issue.serial}:${activeEEW.cancelled}` : activeEEW.type}`
    : '';

  useEffect(() => {
    if (!activeEEW || !activeEewKey) {
      stopDisasterAnnouncement();
      setIsEewSpeaking(false);
      setSpeechError(null);
      return;
    }

    const ctx = speechContextRef.current;
    const impact = analyzeLocalEewImpact(activeEEW, ctx.currentLocation, {
      regionSnapshots: ctx.regionSnapshots,
      jmaTsunamis: ctx.jmaTsunamis,
    });
    const segments = buildEewSpeechSegments(
      activeEEW,
      impact,
      ctx.effectiveSpeechLang,
      ctx.eewSpeechSettings.includePreparednessAdvice,
    );
    const script = segments.map((s) => s.text).join(' ');
    setLastSpokenScript(script);
    setSpeechError(null);

    if (!ctx.eewSpeechSettings.enabled || !isSpeechSynthesisSupported()) {
      return;
    }

    // Slight delay when alert chime is enabled so voice readout starts cleanly right after the chime
    const delayMs = ctx.soundEnabled ? 450 : 80;
    const timer = window.setTimeout(() => {
      speakDisasterSegments(segments, {
        lang: ctx.effectiveSpeechLang,
        rate: ctx.eewSpeechSettings.rate,
        pitch: ctx.eewSpeechSettings.pitch,
        volume: ctx.eewSpeechSettings.volume,
        preferredVoiceName: ctx.eewSpeechSettings.preferredVoiceName,
        onStart: () => {
          setSpeechError(null);
          setIsEewSpeaking(true);
        },
        onEnd: () => setIsEewSpeaking(false),
        onError: (reason) => {
          if (reason !== 'interrupted') {
            setSpeechError(getSpeechErrorMessage(reason, ctx.lang));
          }
        },
      });
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [activeEEW, activeEewKey]);

  // Cancel any active voice readout on unmount
  useEffect(() => {
    return () => {
      stopDisasterAnnouncement();
    };
  }, []);

  useEffect(() => {
    if (!mobileOpenGroup) return;
    const handleOutside = (e: MouseEvent) => {
      if (mobileNavRef.current && !mobileNavRef.current.contains(e.target as Node)) {
        setMobileOpenGroup(null);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpenGroup(null);
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, [mobileOpenGroup]);

  const handleToggleThemeMode = () => {
    setThemeSettings((prev) => ({
      ...prev,
      mode: prev.mode === 'dark' ? 'light' : 'dark',
    }));
  };

  const handleSelectColorTheme = (colorTheme: ColorThemeId) => {
    setThemeSettings((prev) => ({
      ...prev,
      colorTheme,
    }));
  };

  const handleSelectBackgroundMotion = (backgroundMotion: BackgroundMotionId) => {
    setThemeSettings((prev) => ({
      ...prev,
      backgroundMotion,
    }));
  };

  const handleResetTheme = () => {
    setThemeSettings(DEFAULT_THEME_SETTINGS);
  };

  const handleStopEewSpeech = () => {
    stopDisasterAnnouncement();
    setIsEewSpeaking(false);
    setSpeechError(null);
  };

  const handleDismissEEW = () => {
    handleStopEewSpeech();
    dismissEEW();
  };

  const handleReplayActiveEewSpeech = (overrideLang?: AppLanguage) => {
    if (!activeEEW || !activeEewImpact) return;
    const targetLang = overrideLang ?? effectiveSpeechLang;
    const segments = buildEewSpeechSegments(
      activeEEW,
      activeEewImpact,
      targetLang,
      eewSpeechSettings.includePreparednessAdvice,
    );
    const script = segments.map((s) => s.text).join(' ');
    setLastSpokenScript(script);
    setSpeechError(null);
    speakDisasterSegments(segments, {
      lang: targetLang,
      rate: eewSpeechSettings.rate,
      pitch: eewSpeechSettings.pitch,
      volume: eewSpeechSettings.volume,
      preferredVoiceName: overrideLang ? '' : eewSpeechSettings.preferredVoiceName,
      onStart: () => {
        setSpeechError(null);
        setIsEewSpeaking(true);
      },
      onEnd: () => setIsEewSpeaking(false),
      onError: (reason) => {
        if (reason !== 'interrupted') {
          setSpeechError(getSpeechErrorMessage(reason, lang));
        }
      },
    });
  };

  const handleSwitchActiveSpeechLang = (nextLang: AppLanguage) => {
    setEewSpeechSettings((prev) => ({
      ...prev,
      speechLanguage: nextLang,
      preferredVoiceName: '',
    }));
    handleReplayActiveEewSpeech(nextLang);
  };

  const handleTestEewSpeech = () => {
    const loc: CurrentLocationContext = currentLocation;
    const nowStr = new Date().toISOString();
    const sampleAlert: EEW556 = {
      id: `speech-test-${Date.now()}`,
      code: 556,
      time: nowStr,
      isTest: true,
      cancelled: false,
      issue: {
        time: nowStr,
        eventId: `speech-test-evt-${Date.now()}`,
        serial: '1',
      },
      earthquake: {
        originTime: nowStr,
        arrivalTime: nowStr,
        hypocenter: {
          name: `${loc.prefectureName}近海`,
          reduceName: loc.prefectureName,
          latitude: Number((loc.lat - 0.18).toFixed(2)),
          longitude: Number((loc.lon + 0.14).toFixed(2)),
          depth: 30,
          magnitude: 6.4,
        },
      },
      areas: [
        {
          pref: loc.prefectureName,
          name: loc.label,
          scaleFrom: 45,
          scaleTo: 50,
          kindCode: '10',
        },
      ],
    };

    const impact = analyzeLocalEewImpact(sampleAlert, loc, {
      regionSnapshots: hub.regionSnapshots,
      jmaTsunamis: hub.jmaTsunamis,
    });
    const segments = buildEewSpeechSegments(
      sampleAlert,
      impact,
      effectiveSpeechLang,
      eewSpeechSettings.includePreparednessAdvice,
    );
    const script = segments.map((s) => s.text).join(' ');
    setLastSpokenScript(script);
    setSpeechError(null);
    speakDisasterSegments(segments, {
      lang: effectiveSpeechLang,
      rate: eewSpeechSettings.rate,
      pitch: eewSpeechSettings.pitch,
      volume: eewSpeechSettings.volume,
      preferredVoiceName: eewSpeechSettings.preferredVoiceName,
      onStart: () => {
        setSpeechError(null);
        setIsEewSpeaking(true);
      },
      onEnd: () => setIsEewSpeaking(false),
      onError: (reason) => {
        if (reason !== 'interrupted') {
          setSpeechError(getSpeechErrorMessage(reason, lang));
        }
      },
    });
  };

  const handleDetectNearestRegion = (lat: number, lon: number) => {
    const nearest = createRegionFromOffice(findNearestWeatherOffice(lat, lon));
    setDetectedLocation(nearest);
    hub.addNearestRegionByCoords(lat, lon);
  };

  const effectiveBgMotion = resolveEffectiveBackgroundMotion(
    themeSettings.backgroundMotion,
    themeSettings.mode,
  );

  const handleSelectQuakeFilter = (nextFilter: QuakeFilter) => {
    setFilter(nextFilter);
    setActiveView('quake');
  };

  const handleSelectRecord = (id: string) => {
    setSelectedId(id);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      detailContainerRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  const navigateFromViewString = (view: string) => {
    setActiveView(view as AppViewMode);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const mobileSubItems: Array<{ id: QuakeFilter; label: string }> = [
    { id: 'all', label: m.list.tabAll },
    { id: 'quake', label: m.list.tabQuake },
    { id: 'eew', label: m.list.tabEew },
    { id: 'other', label: m.list.tabOther },
  ];

  return (
    <div
      id="top"
      className={`relative flex min-h-screen flex-col text-slate-900 transition-colors dark:text-slate-100 ${
        effectiveBgMotion === 'off' ? 'bg-[var(--nein-canvas)]' : 'bg-transparent'
      }`}
    >
      <BackgroundMotionLayer
        motion={themeSettings.backgroundMotion}
        themeMode={themeSettings.mode}
      />

      <Header
        lang={lang}
        activeView={activeView}
        onSelectView={(v) => {
          setActiveView(v);
          setMobileOpenGroup(null);
          if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        onOpenTestModal={() => setIsTestModalOpen(true)}
      />

      {/* Mobile Grouped Navigation (< md) matching [Icon] HOME / [Icon] QUAKE ▾ / [Icon] WEATHER ▾ / [Icon] DISASTER ▾ / [Icon] TOOLS ▾ / ⚙ */}
      <div
        ref={mobileNavRef}
        className="relative z-40 border-b border-[var(--nein-border)] bg-[var(--nein-surface)] px-3.5 py-2.5 md:hidden"
      >
        <div
          role="tablist"
          aria-label={m.nav.mobileModeSwitcher}
          className="flex flex-wrap items-center gap-1.5"
        >
          <button
            type="button"
            role="tab"
            data-active={activeView === 'dashboard'}
            aria-selected={activeView === 'dashboard'}
            onClick={() => {
              setActiveView('dashboard');
              setMobileOpenGroup(null);
            }}
            className={`nein-tab-home inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-bold tracking-wide transition-colors cursor-pointer ${
              activeView === 'dashboard'
                ? 'border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] text-[var(--nein-accent-text)]'
                : 'border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-700 dark:text-slate-200'
            }`}
          >
            <LayoutDashboard className="nein-tab-icon h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>HOME</span>
          </button>

          {NAV_GROUPS.map((group) => {
            const active = isGroupActive(group, activeView);
            const expanded = mobileOpenGroup === group.id;
            const GroupIcon = group.icon;
            return (
              <button
                key={group.id}
                type="button"
                role="tab"
                data-testid={group.id === 'quake' ? 'mobile-nav-nein-quack' : undefined}
                data-active={active}
                data-expanded={expanded}
                aria-selected={active}
                aria-expanded={expanded}
                onClick={() =>
                  setMobileOpenGroup((prev) => (prev === group.id ? null : group.id))
                }
                className={`${group.animClass} inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-bold tracking-wide transition-colors cursor-pointer ${
                  active || expanded
                    ? 'border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] text-[var(--nein-accent-text)]'
                    : 'border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-700 dark:text-slate-200'
                }`}
              >
                <GroupIcon className="nein-tab-icon h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{group.title}</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>
            );
          })}

          <button
            type="button"
            role="tab"
            data-testid="mobile-nav-system-settings"
            data-active={activeView === 'settings'}
            aria-label={m.nav.settings}
            aria-selected={activeView === 'settings'}
            onClick={() => {
              setActiveView('settings');
              setMobileOpenGroup(null);
            }}
            className={`nein-tab-settings inline-flex items-center justify-center rounded-md border p-1.5 transition-colors cursor-pointer ${
              activeView === 'settings'
                ? 'border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] text-[var(--nein-accent-text)]'
                : 'border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-700 dark:text-slate-200'
            }`}
          >
            <Settings className="nein-tab-icon h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {mobileOpenGroup && (
          <div className="nein-dropdown-panel mt-2.5 rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-2">
            <div className="mb-1.5 border-b border-[var(--nein-border-subtle)] px-2 pb-1.5 text-[11px] font-extrabold tracking-wider text-slate-500 dark:text-slate-400">
              {NAV_GROUPS.find((g) => g.id === mobileOpenGroup)?.title}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {NAV_GROUPS.find((g) => g.id === mobileOpenGroup)?.items.map((item) => {
                const isItemActive = item.matchViews
                  ? item.matchViews.includes(activeView)
                  : activeView === item.view;
                const ItemIcon = item.icon;
                return (
                  <button
                    key={item.view}
                    type="button"
                    onClick={() => {
                      setActiveView(item.view);
                      setMobileOpenGroup(null);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                      isItemActive
                        ? 'border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] text-[var(--nein-accent-text)]'
                        : 'border-[var(--nein-border)] bg-[var(--nein-surface)] text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <ItemIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>{item.labels[lang]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeView === 'quake' && (
          <div className="mt-2.5 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {mobileSubItems.map((sub) => {
              const active = filter === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => handleSelectQuakeFilter(sub.id)}
                  className={`rounded-md border px-2 py-1.5 text-xs font-medium leading-snug transition-colors cursor-pointer ${
                    active
                      ? 'border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] font-semibold text-[var(--nein-accent-text)]'
                      : 'border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {sub.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {(activeView === 'quake' || activeView === 'jma_quake') && (
        <div className="relative z-10 border-b border-[var(--nein-border)] bg-[var(--nein-surface)]">
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-2 px-4 py-2 sm:px-6">
            <button
              type="button"
              onClick={() => setActiveView('quake')}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                activeView === 'quake'
                  ? 'border-[var(--nein-accent)] bg-[var(--nein-accent)] text-[var(--nein-accent-contrast)]'
                  : 'border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-700 dark:text-slate-300'
              }`}
            >
              {ext.quakeExt.subViewP2P}
            </button>
            <button
              type="button"
              data-testid="quack-submenu-jma"
              onClick={() => setActiveView('jma_quake')}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                activeView === 'jma_quake'
                  ? 'border-[var(--nein-accent)] bg-[var(--nein-accent)] text-[var(--nein-accent-contrast)]'
                  : 'border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-700 dark:text-slate-300'
              }`}
            >
              {ext.quakeExt.subViewJmaQuake}
            </button>
          </div>
        </div>
      )}

      {activeView === 'quake' && (
        <div className="relative z-10">
          <WorkspaceToolbar
            lang={lang}
            wsStatus={wsStatus}
            autoUpdateEnabled={autoUpdateEnabled}
            onToggleAutoUpdate={() => setAutoUpdateEnabled(!autoUpdateEnabled)}
            pollIntervalSec={pollIntervalSec}
            onChangePollInterval={setPollIntervalSec}
            nextRefreshIn={nextRefreshIn}
            lastUpdated={lastUpdated}
            isRefreshing={isRefreshing}
            onRefreshNow={() => void refreshNow()}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled(!soundEnabled)}
            notificationEnabled={notificationEnabled}
            onToggleNotification={() => void toggleNotificationEnabled()}
            notificationHint={notificationHint}
            onDismissNotificationHint={dismissNotificationHint}
            onQuickTestEEW={() => triggerTestEEW('kanto_alert')}
            hasTestRecords={hasTestRecords}
            onClearTestRecords={clearTestRecords}
            archiveDate={archiveDate}
            onExitArchiveMode={exitArchiveMode}
          />
        </div>
      )}

      <main
        key={activeView}
        className={`nein-view-stage relative z-10 mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-5 px-4 py-5 sm:px-6 ${
          bgmSettings.enabled ? 'pb-28' : ''
        }`}
      >
        {activeView === 'dashboard' ? (
          <ComprehensiveDashboard
            lang={lang}
            cards={hub.dashboardCards}
            onMoveCard={hub.moveDashboardCard}
            onToggleVisible={hub.toggleDashboardCardVisible}
            onToggleSize={hub.toggleDashboardCardSize}
            onResetLayout={hub.resetDashboardCards}
            onNavigate={navigateFromViewString}
            onRefreshAll={() => {
              void refreshNow();
              void hub.refreshEverything();
            }}
            p2pRecords={records}
            jmaQuakes={hub.jmaQuakes}
            jmaTsunamis={hub.jmaTsunamis}
            xmlBulletins={hub.xmlBulletins}
            volcanoes={hub.volcanoes}
            typhoons={hub.typhoons}
            registeredRegions={hub.registeredRegions}
            regionSnapshots={hub.regionSnapshots}
            airQuality={hub.airQuality}
            timelineEvents={hub.timelineEvents}
            sourceHealth={hub.sourceHealth}
          />
        ) : activeView === 'weather' ? (
          <WeatherDashboard
            lang={lang}
            isActive={activeView === 'weather'}
            themeMode={themeSettings.mode}
          />
        ) : activeView === 'radar' ? (
          <RadarSatelliteView
            lang={lang}
            timelines={hub.radarTimelines}
            onRefresh={() => void hub.refreshCoreFeeds(true)}
          />
        ) : activeView === 'typhoon' || activeView === 'marine' ? (
          <TyphoonMarineView
            lang={lang}
            section={activeView === 'marine' ? 'marine' : 'typhoon'}
            typhoons={hub.typhoons}
            marine={hub.marine}
            xmlBulletins={hub.xmlBulletins}
            activeOfficeCode={hub.activeRegionOfficeCode}
            onSelectOfficeCode={hub.setActiveRegionOfficeCode}
            onRefresh={() => void hub.refreshEverything()}
          />
        ) : activeView === 'hazards' ? (
          <DisasterHazardsView
            lang={lang}
            xmlBulletins={hub.xmlBulletins}
            timelines={hub.radarTimelines}
            onRefresh={() => void hub.refreshCoreFeeds(true)}
          />
        ) : activeView === 'volcano' ? (
          <VolcanoView
            lang={lang}
            volcanoes={hub.volcanoes}
            xmlBulletins={hub.xmlBulletins}
            onRefresh={() => void hub.refreshEverything()}
          />
        ) : activeView === 'environment' ? (
          <EnvironmentView
            lang={lang}
            airQuality={hub.airQuality}
            xmlBulletins={hub.xmlBulletins}
            activeOfficeCode={hub.activeRegionOfficeCode}
            onSelectOfficeCode={hub.setActiveRegionOfficeCode}
            onRefresh={() => void hub.refreshEverything()}
          />
        ) : activeView === 'map' ? (
          <NationalDisasterMap
            lang={lang}
            config={hub.mapConfig}
            onChangeConfig={hub.setMapConfig}
            onResetConfig={hub.resetMapConfig}
            p2pRecords={records}
            jmaQuakes={hub.jmaQuakes}
            jmaTsunamis={hub.jmaTsunamis}
            volcanoes={hub.volcanoes}
            typhoons={hub.typhoons}
            amedasPoints={hub.amedasPoints}
            onRequestAmedas={() => void hub.loadNationwideAmedas(false)}
            radarTimelines={hub.radarTimelines}
          />
        ) : activeView === 'jma_quake' || activeView === 'tsunami' ? (
          <QuakeExtendedPanel
            lang={lang}
            mode={activeView}
            jmaQuakes={hub.jmaQuakes}
            jmaTsunamis={hub.jmaTsunamis}
            xmlBulletins={hub.xmlBulletins}
            onLoadTsunamiDetail={hub.loadTsunamiEventDetail}
            onRefresh={() => void hub.refreshCoreFeeds(true)}
          />
        ) : activeView === 'monitor' ? (
          <RealtimeMonitorView
            lang={lang}
            wsStatus={wsStatus}
            lastUpdated={lastUpdated}
            p2pRecords={records}
            jmaQuakes={hub.jmaQuakes}
            jmaTsunamis={hub.jmaTsunamis}
            xmlBulletins={hub.xmlBulletins}
            typhoons={hub.typhoons}
            volcanoes={hub.volcanoes}
            regionSnapshots={hub.regionSnapshots}
            sourceHealth={hub.sourceHealth}
            onNavigate={navigateFromViewString}
            onRefreshAll={() => {
              void refreshNow();
              void hub.refreshEverything();
            }}
          />
        ) : activeView === 'replay' || activeView === 'timeline' ? (
          <ReplayArchiveView
            lang={lang}
            events={hub.timelineEvents}
            timelines={hub.radarTimelines}
            onNavigate={navigateFromViewString}
            onRefreshRadar={() => void hub.refreshCoreFeeds(true)}
          />
        ) : activeView === 'status' ? (
          <SystemStatusPanel
            lang={lang}
            sources={hub.sourceHealth}
            onRecheckAll={() => {
              void refreshNow();
              void hub.refreshEverything();
            }}
          />
        ) : activeView === 'settings' ? (
          <SystemSettingsPanel
            lang={lang}
            onChangeLang={setLang}
            themeMode={themeSettings.mode}
            onToggleThemeMode={handleToggleThemeMode}
            colorTheme={themeSettings.colorTheme}
            onSelectColorTheme={handleSelectColorTheme}
            backgroundMotion={themeSettings.backgroundMotion}
            onSelectBackgroundMotion={handleSelectBackgroundMotion}
            onResetTheme={handleResetTheme}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled(!soundEnabled)}
            notificationEnabled={notificationEnabled}
            onToggleNotification={() => void toggleNotificationEnabled()}
            notificationHint={notificationHint}
            autoUpdateEnabled={autoUpdateEnabled}
            onToggleAutoUpdate={() => setAutoUpdateEnabled(!autoUpdateEnabled)}
            pollIntervalSec={pollIntervalSec}
            onChangePollInterval={setPollIntervalSec}
            registeredRegions={hub.registeredRegions}
            onAddRegion={hub.addRegisteredRegion}
            onRemoveRegion={hub.removeRegisteredRegion}
            onMoveRegion={hub.moveRegisteredRegion}
            onDetectNearestRegion={handleDetectNearestRegion}
            onOpenWeatherForRegion={() => setActiveView('weather')}
            notificationPrefs={hub.notificationPrefs}
            onChangeNotificationPrefs={hub.setNotificationPrefs}
            notificationHistory={hub.notificationHistory}
            onClearNotificationHistory={hub.clearNotificationHistory}
            bgmSettings={bgmSettings}
            onChangeBgmSettings={setBgmSettings}
            eewSpeechSettings={eewSpeechSettings}
            onChangeEewSpeechSettings={setEewSpeechSettings}
            currentLocation={currentLocation}
            isEewSpeaking={isEewSpeaking}
            lastSpokenScript={lastSpokenScript}
            speechError={speechError}
            onTestEewSpeech={handleTestEewSpeech}
            onStopEewSpeech={handleStopEewSpeech}
          />
        ) : (
          <>
            {error && (
              <div
                role="alert"
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-xs text-red-900 dark:border-red-800/80 dark:bg-red-950/50 dark:text-red-200"
              >
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
                  <span>
                    {m.errorBanner.fetchErrorPrefix}（{error}）
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void refreshNow()}
                  className="rounded border border-red-400 bg-red-100 px-3 py-1 font-medium text-red-900 hover:bg-red-200 dark:border-red-700 dark:bg-red-900/60 dark:text-red-100 dark:hover:bg-red-800 cursor-pointer"
                >
                  {m.errorBanner.retry}
                </button>
              </div>
            )}

            <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
              <QuakeList
                lang={lang}
                records={filteredRecords}
                totalCount={records.length}
                selectedId={selectedId}
                onSelect={handleSelectRecord}
                filter={filter}
                onFilterChange={setFilter}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                dateFrom={dateFrom}
                onDateFromChange={setDateFrom}
                dateTo={dateTo}
                onDateToChange={setDateTo}
                minScale={minScale}
                onMinScaleChange={setMinScale}
                minMagnitude={minMagnitude}
                onMinMagnitudeChange={setMinMagnitude}
                hasActiveFilters={hasActiveFilters}
                onResetFilters={resetSearchFilters}
                counts={counts}
                isLoading={isLoading}
                canLoadMore={canLoadMore}
                isLoadingMore={isLoadingMore}
                onLoadMore={() => void loadMoreHistory()}
                archiveDate={archiveDate}
                onSelectArchiveDate={(ymd) => void selectArchiveDate(ymd)}
                onExitArchiveMode={exitArchiveMode}
              />

              <div ref={detailContainerRef} className="min-w-0 flex-1">
                <QuakeDetailPanel
                  lang={lang}
                  records={records}
                  selectedRecord={selectedRecord}
                  onSelectRecord={setSelectedId}
                  themeMode={themeSettings.mode}
                  colorTheme={themeSettings.colorTheme}
                />
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="relative z-10 border-t border-[var(--nein-border)] bg-[var(--nein-header)] py-4 text-xs text-slate-600 transition-colors dark:text-slate-500">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-2 px-4 sm:flex-row sm:items-center sm:px-6">
          <span>{m.footer.brandLine}</span>
          <span>{m.footer.sourceLine}</span>
        </div>
      </footer>

      <InAppToastContainer
        lang={lang}
        onNewAlertRecorded={hub.refreshNotificationHistory}
      />

      <EEWWarningModal
        lang={lang}
        speechLang={effectiveSpeechLang}
        alert={activeEEW}
        onDismiss={handleDismissEEW}
        localImpact={activeEewImpact}
        isSpeaking={isEewSpeaking}
        speechSupported={speechSupported}
        bgmDucked={bgmSettings.enabled && (Boolean(activeEEW) || (isEewSpeaking && eewSpeechSettings.duckBgmDuringSpeech))}
        spokenScript={lastSpokenScript}
        speechError={speechError}
        onReplaySpeech={() => handleReplayActiveEewSpeech()}
        onStopSpeech={handleStopEewSpeech}
        onSwitchSpeechLang={handleSwitchActiveSpeechLang}
      />

      <TestDispatchModal
        lang={lang}
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        onDispatch={triggerTestEEW}
      />

      <BgmPlayerEngine
        lang={lang}
        settings={bgmSettings}
        isEmergencyDucking={Boolean(activeEEW)}
        isSpeechReading={isEewSpeaking && eewSpeechSettings.duckBgmDuringSpeech}
        speechStatusText={
          isEewSpeaking
            ? `${localizeJapanesePlaceName(currentLocation.prefectureName, effectiveSpeechLang)} — ${lastSpokenScript ?? ''}`
            : null
        }
        onStopSpeech={handleStopEewSpeech}
        onToggleEnabled={() =>
          setBgmSettings((prev) => ({
            ...prev,
            enabled: !prev.enabled,
          }))
        }
        onToggleMute={() =>
          setBgmSettings((prev) => ({
            ...prev,
            muted: !prev.muted,
          }))
        }
        onChangeVolume={(vol) =>
          setBgmSettings((prev) => {
            const clamped = clampBgmVolume(vol);
            return {
              ...prev,
              volume: clamped,
              muted: clamped === 0,
            };
          })
        }
      />

      {showStartupSplash && !activeEEW && (
        <StartupSplashScreen
          lang={lang}
          onComplete={() => setShowStartupSplash(false)}
        />
      )}
    </div>
  );
}
