/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Activity,
  AlertCircle,
  CloudRain,
  CloudSun,
  Flame,
  History,
  Layers,
  LayoutDashboard,
  Map as MapIcon,
  Radar,
  ServerCrash,
  Settings,
  Sun,
  Waves,
  Wind,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { EEWWarningModal } from './components/EEWWarningModal';
import { Header, type AppViewMode } from './components/Header';
import { InAppToastContainer } from './components/InAppToastContainer';
import { QuakeDetailPanel } from './components/QuakeDetailPanel';
import { QuakeList } from './components/QuakeList';
import { SystemSettingsPanel } from './components/SystemSettingsPanel';
import { TestDispatchModal } from './components/TestDispatchModal';
import { WorkspaceToolbar } from './components/WorkspaceToolbar';
import { ComprehensiveDashboard } from './components/dashboard/ComprehensiveDashboard';
import { NationalDisasterMap } from './components/map/NationalDisasterMap';
import { QuakeExtendedPanel } from './components/quake/QuakeExtendedPanel';
import { DisasterTimelineView } from './components/system/DisasterTimelineView';
import { SystemStatusPanel } from './components/system/SystemStatusPanel';
import { DisasterHazardsView } from './components/weather/DisasterHazardsView';
import { EnvironmentView } from './components/weather/EnvironmentView';
import { RadarSatelliteView } from './components/weather/RadarSatelliteView';
import { TyphoonMarineView } from './components/weather/TyphoonMarineView';
import { VolcanoView } from './components/weather/VolcanoView';
import { WeatherDashboard } from './components/weather/WeatherDashboard';
import { useDisasterHub } from './hooks/useDisasterHub';
import { useQuakeFeed } from './hooks/useQuakeFeed';
import type { QuakeFilter } from './types/quake';
import {
  type AppLanguage,
  applyLanguageToDocument,
  getMessages,
  loadLanguage,
  saveLanguage,
} from './utils/i18n';
import { getExtendedMessages } from './utils/i18nExtended';
import {
  type ColorThemeId,
  DEFAULT_THEME_SETTINGS,
  type ThemeSettings,
  applyThemeToDocument,
  loadThemeSettings,
  saveThemeSettings,
} from './utils/themeSettings';

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
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(() => loadThemeSettings());
  const [lang, setLang] = useState<AppLanguage>(() => loadLanguage());
  const detailContainerRef = useRef<HTMLDivElement | null>(null);

  const m = getMessages(lang);
  const ext = getExtendedMessages(lang);

  const hub = useDisasterHub(lang, records);

  useEffect(() => {
    applyThemeToDocument(themeSettings);
    saveThemeSettings(themeSettings);
  }, [themeSettings]);

  useEffect(() => {
    applyLanguageToDocument(lang);
    saveLanguage(lang);
  }, [lang]);

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

  const handleResetTheme = () => {
    setThemeSettings(DEFAULT_THEME_SETTINGS);
  };

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

  const mobileNavTabs: Array<{
    view: AppViewMode;
    label: string;
    testId?: string;
    icon: typeof LayoutDashboard;
  }> = [
    { view: 'dashboard', label: ext.extNav.dashboard, icon: LayoutDashboard },
    { view: 'quake', label: m.nav.quack, testId: 'mobile-nav-nein-quack', icon: Layers },
    { view: 'jma_quake', label: 'JMA', icon: Activity },
    { view: 'tsunami', label: ext.extNav.tsunamiMonitor, icon: Waves },
    { view: 'weather', label: m.nav.weather, icon: CloudSun },
    { view: 'radar', label: ext.extNav.radarSatellite, icon: Radar },
    { view: 'map', label: ext.extNav.integratedMap, icon: MapIcon },
    { view: 'typhoon', label: ext.extNav.typhoonMarine, icon: Wind },
    { view: 'hazards', label: ext.extNav.hazardsFlood, icon: CloudRain },
    { view: 'volcano', label: ext.extNav.volcano, icon: Flame },
    { view: 'environment', label: ext.extNav.environment, icon: Sun },
    { view: 'timeline', label: ext.extNav.timeline, icon: History },
    { view: 'status', label: ext.extNav.systemStatus, icon: ServerCrash },
    { view: 'settings', label: m.nav.settings, testId: 'mobile-nav-system-settings', icon: Settings },
  ];

  return (
    <div
      id="top"
      className="flex min-h-screen flex-col bg-[var(--nein-canvas)] text-slate-900 transition-colors dark:text-slate-100"
    >
      <Header
        lang={lang}
        activeView={activeView}
        activeFilter={filter}
        onSelectView={setActiveView}
        onSelectFilter={handleSelectQuakeFilter}
        onOpenTestModal={() => setIsTestModalOpen(true)}
      />

      {/* Mobile View Switcher (visible < md, overflow-x contained cleanly) */}
      <div className="border-b border-[var(--nein-border)] bg-[var(--nein-surface)] px-3 py-2 md:hidden">
        <div
          role="tablist"
          aria-label={m.nav.mobileModeSwitcher}
          className="flex items-center gap-1.5 overflow-x-auto pb-1"
        >
          {mobileNavTabs.map((tab) => {
            const Icon = tab.icon;
            const selected = activeView === tab.view;
            return (
              <button
                key={tab.view}
                type="button"
                role="tab"
                data-testid={tab.testId}
                aria-selected={selected}
                onClick={() => setActiveView(tab.view)}
                className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2.5 py-1.5 text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  selected
                    ? 'border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] text-[var(--nein-accent-text)]'
                    : 'border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-600 dark:text-slate-400'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeView === 'quake' && (
          <div className="mt-2 grid grid-cols-4 gap-1">
            {mobileSubItems.map((sub) => {
              const active = filter === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => handleSelectQuakeFilter(sub.id)}
                  className={`min-w-0 truncate rounded border px-1.5 py-1 text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    active
                      ? 'border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] font-semibold text-[var(--nein-accent-text)]'
                      : 'border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {sub.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {activeView === 'quake' && (
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
      )}

      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-5 px-4 py-5 sm:px-6">
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
        ) : activeView === 'typhoon' ? (
          <TyphoonMarineView
            lang={lang}
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
        ) : activeView === 'timeline' ? (
          <DisasterTimelineView
            lang={lang}
            events={hub.timelineEvents}
            onNavigate={navigateFromViewString}
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
            onDetectNearestRegion={(lat, lon) => hub.addNearestRegionByCoords(lat, lon)}
            onOpenWeatherForRegion={() => setActiveView('weather')}
            notificationPrefs={hub.notificationPrefs}
            onChangeNotificationPrefs={hub.setNotificationPrefs}
            notificationHistory={hub.notificationHistory}
            onClearNotificationHistory={hub.clearNotificationHistory}
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

      <footer className="border-t border-[var(--nein-border)] bg-[var(--nein-header)] py-4 text-xs text-slate-600 transition-colors dark:text-slate-500">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-2 px-4 sm:flex-row sm:items-center sm:px-6">
          <span>{m.footer.brandLine}</span>
          <span>{m.footer.sourceLine}</span>
        </div>
      </footer>

      <InAppToastContainer
        lang={lang}
        onNewAlertRecorded={hub.refreshNotificationHistory}
      />

      <EEWWarningModal lang={lang} alert={activeEEW} onDismiss={dismissEEW} />

      <TestDispatchModal
        lang={lang}
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        onDispatch={triggerTestEEW}
      />
    </div>
  );
}
