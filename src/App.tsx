/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Activity, AlertCircle, CloudSun } from 'lucide-react';
import { useRef, useState } from 'react';
import { EEWWarningModal } from './components/EEWWarningModal';
import { Header, type AppViewMode } from './components/Header';
import { QuakeDetailPanel } from './components/QuakeDetailPanel';
import { QuakeList } from './components/QuakeList';
import { TestDispatchModal } from './components/TestDispatchModal';
import { WeatherDashboard } from './components/weather/WeatherDashboard';
import { WorkspaceToolbar } from './components/WorkspaceToolbar';
import { useQuakeFeed } from './hooks/useQuakeFeed';
import type { QuakeFilter } from './types/quake';

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
    isLoading,
    isRefreshing,
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
  const detailContainerRef = useRef<HTMLDivElement | null>(null);

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
    <div id="top" className="flex min-h-screen flex-col bg-[#090D16] text-slate-100">
      <Header
        activeView={activeView}
        activeFilter={filter}
        onSelectFilter={handleSelectQuakeFilter}
        onSelectWeather={() => setActiveView('weather')}
        onOpenTestModal={() => setIsTestModalOpen(true)}
      />

      {/* Mobile View Switcher (visible < md) */}
      <div className="border-b border-slate-800/80 bg-[#0D131F] px-4 py-2 md:hidden">
        <div role="tablist" aria-label="表示モード切替" className="grid grid-cols-2 gap-2">
          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'quake'}
            onClick={() => setActiveView('quake')}
            className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              activeView === 'quake'
                ? 'border-sky-500/60 bg-sky-500/20 text-sky-100'
                : 'border-slate-800 bg-[#090D16] text-slate-400'
            }`}
          >
            <Activity className="h-3.5 w-3.5" aria-hidden="true" />
            <span>地震・津波モニター</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'weather'}
            onClick={() => setActiveView('weather')}
            className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              activeView === 'weather'
                ? 'border-sky-500/60 bg-sky-500/20 text-sky-100'
                : 'border-slate-800 bg-[#090D16] text-slate-400'
            }`}
          >
            <CloudSun className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
            <span>NEiN WEATHER</span>
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
          onQuickTestEEW={() => triggerTestEEW('kanto_alert')}
          hasTestRecords={hasTestRecords}
          onClearTestRecords={clearTestRecords}
          archiveDate={archiveDate}
          onExitArchiveMode={exitArchiveMode}
        />
      )}

      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-5 px-4 py-5 sm:px-6">
        {activeView === 'weather' ? (
          <WeatherDashboard isActive={activeView === 'weather'} />
        ) : (
          <>
            {error && (
              <div
                role="alert"
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-800/80 bg-red-950/50 px-4 py-3 text-xs text-red-200"
              >
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
                  <span>
                    最新データの取得中にエラーが発生しました（{error}）。
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void refreshNow()}
                  className="rounded border border-red-700 bg-red-900/60 px-3 py-1 font-medium text-red-100 hover:bg-red-800 cursor-pointer"
                >
                  再試行
                </button>
              </div>
            )}

            <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
              <QuakeList
                records={filteredRecords}
                selectedId={selectedId}
                onSelect={handleSelectRecord}
                filter={filter}
                onFilterChange={setFilter}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                counts={counts}
                isLoading={isLoading}
                archiveDate={archiveDate}
                onSelectArchiveDate={(ymd) => void selectArchiveDate(ymd)}
                onExitArchiveMode={exitArchiveMode}
              />

              <div ref={detailContainerRef} className="min-w-0 flex-1">
                <QuakeDetailPanel
                  records={records}
                  selectedRecord={selectedRecord}
                  onSelectRecord={setSelectedId}
                />
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="border-t border-slate-800/80 bg-[#0B101B] py-4 text-xs text-slate-500">
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
