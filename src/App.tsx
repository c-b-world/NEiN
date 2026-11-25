/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Activity, AlertCircle, CloudSun, Settings } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { EEWWarningModal } from './components/EEWWarningModal';
import { Header, type AppViewMode } from './components/Header';
import { QuakeDetailPanel } from './components/QuakeDetailPanel';
import { QuakeList } from './components/QuakeList';
import { SystemSettingsPanel } from './components/SystemSettingsPanel';
import { TestDispatchModal } from './components/TestDispatchModal';
import { WeatherDashboard } from './components/weather/WeatherDashboard';
import { WorkspaceToolbar } from './components/WorkspaceToolbar';
import { useQuakeFeed } from './hooks/useQuakeFeed';
import type { QuakeFilter } from './types/quake';
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

  const [activeView, setActiveView] = useState<AppViewMode>('quake');
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(() => loadThemeSettings());
  const detailContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    applyThemeToDocument(themeSettings);
    saveThemeSettings(themeSettings);
  }, [themeSettings]);

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

  return (
    <div
      id="top"
      className="flex min-h-screen flex-col bg-[var(--nein-canvas)] text-slate-900 transition-colors dark:text-slate-100"
    >
      <Header
        activeView={activeView}
        activeFilter={filter}
        onSelectFilter={handleSelectQuakeFilter}
        onSelectWeather={() => setActiveView('weather')}
        onSelectSettings={() => setActiveView('settings')}
        onOpenTestModal={() => setIsTestModalOpen(true)}
      />

      {/* Mobile View Switcher (visible < md) */}
      <div className="border-b border-[var(--nein-border)] bg-[var(--nein-surface)] px-4 py-2 md:hidden">
        <div role="tablist" aria-label="表示モード切替" className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'quake'}
            onClick={() => setActiveView('quake')}
            className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              activeView === 'quake'
                ? 'border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] text-[var(--nein-accent-text)]'
                : 'border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-600 dark:text-slate-400'
            }`}
          >
            <Activity className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>地震・津波</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'weather'}
            onClick={() => setActiveView('weather')}
            className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              activeView === 'weather'
                ? 'border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] text-[var(--nein-accent-text)]'
                : 'border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-600 dark:text-slate-400'
            }`}
          >
            <CloudSun className="h-3.5 w-3.5 shrink-0 text-[var(--nein-accent-text)]" aria-hidden="true" />
            <span>天気</span>
          </button>
          <button
            type="button"
            role="tab"
            data-testid="mobile-nav-system-settings"
            aria-selected={activeView === 'settings'}
            onClick={() => setActiveView('settings')}
            className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              activeView === 'settings'
                ? 'border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] text-[var(--nein-accent-text)]'
                : 'border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-600 dark:text-slate-400'
            }`}
          >
            <Settings className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>システム設定</span>
          </button>
        </div>
      </div>

      {activeView === 'quake' && (
        <WorkspaceToolbar
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
        {activeView === 'weather' ? (
          <WeatherDashboard isActive={activeView === 'weather'} themeMode={themeSettings.mode} />
        ) : activeView === 'settings' ? (
          <SystemSettingsPanel
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
                    最新データの取得中にエラーが発生しました（{error}）。
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void refreshNow()}
                  className="rounded border border-red-400 bg-red-100 px-3 py-1 font-medium text-red-900 hover:bg-red-200 dark:border-red-700 dark:bg-red-900/60 dark:text-red-100 dark:hover:bg-red-800 cursor-pointer"
                >
                  再試行
                </button>
              </div>
            )}

            <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
              <QuakeList
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
          <span>NEiN 防災 — リアルタイム地震情報・緊急地震速報・気象情報モニター</span>
          <span>
            出典：P2P地震情報 API (v2) ／ 気象庁防災情報JSON ／ Open-Meteo (CC BY 4.0) ※公式の防災情報を代替するものではありません
          </span>
        </div>
      </footer>

      <EEWWarningModal alert={activeEEW} onDismiss={dismissEEW} />

      <TestDispatchModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        onDispatch={triggerTestEEW}
      />
    </div>
  );
}
