import { Calendar, History, Radar } from 'lucide-react';
import { useState } from 'react';
import type { UnifiedTimelineEvent } from '../../types/disaster';
import type { AppLanguage } from '../../utils/i18n';
import type { RadarTimelinesBundle } from '../../utils/jmaTilesApi';
import { RadarSatelliteView } from '../weather/RadarSatelliteView';
import { DisasterTimelineView } from './DisasterTimelineView';

interface ReplayArchiveViewProps {
  lang: AppLanguage;
  events: UnifiedTimelineEvent[];
  timelines: RadarTimelinesBundle | null;
  onNavigate: (view: string) => void;
  onRefreshRadar: () => void;
}

export function ReplayArchiveView({
  lang,
  events,
  timelines,
  onNavigate,
  onRefreshRadar,
}: ReplayArchiveViewProps) {
  const [subTab, setSubTab] = useState<'timeline' | 'radar_replay'>('timeline');

  const labels = {
    ja: {
      title: 'NEiN REPLAY — 過去の災害情報・時系列再生',
      subtitle: '統合タイムライン履歴・地震アーカイブ検索・高解像度雨雲レーダー/ひまわり衛星の時系列再生を利用できます。',
      tabTimeline: '災害タイムライン履歴',
      tabRadar: 'レーダー・衛星 時系列再生',
      openArchiveSearch: '地震アーカイブ日付検索へ →',
    },
    en: {
      title: 'NEiN REPLAY — Historical Timeline & Time-Series Playback',
      subtitle: 'Review the multi-hazard chronological event log, jump to past earthquake archives, or scrub JMA radar/satellite frames.',
      tabTimeline: 'Disaster Event Timeline',
      tabRadar: 'Radar & Satellite Replay',
      openArchiveSearch: 'Open Quake Date Archive →',
    },
    zh: {
      title: 'NEiN REPLAY — 历史灾害信息・时间序列回放',
      subtitle: '查看综合防灾时间线记录、历史地震检索以及高分辨率雷达/向日葵卫星时间序列回放。',
      tabTimeline: '灾害时间线历史',
      tabRadar: '雷达与卫星时序回放',
      openArchiveSearch: '前往地震历史检索 →',
    },
    ko: {
      title: 'NEiN REPLAY — 과거 재해 정보・시계열 재생',
      subtitle: '통합 방재 타임라인 이력, 과거 지진 아카이브 검색, 기상 레이더/위성 시계열 재생을 이용할 수 있습니다.',
      tabTimeline: '재해 타임라인 이력',
      tabRadar: '레이더·위성 시계열 재생',
      openArchiveSearch: '지진 과거 기록 검색 →',
    },
  }[lang];

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)] p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50">{labels.title}</h1>
            </div>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">{labels.subtitle}</p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('quake')}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--nein-accent-text)] cursor-pointer"
          >
            <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{labels.openArchiveSearch}</span>
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSubTab('timeline')}
            className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold cursor-pointer ${
              subTab === 'timeline'
                ? 'border-[var(--nein-accent)] bg-[var(--nein-accent)] text-[var(--nein-accent-contrast)]'
                : 'border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-700 dark:text-slate-300'
            }`}
          >
            <History className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{labels.tabTimeline}</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('radar_replay')}
            className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold cursor-pointer ${
              subTab === 'radar_replay'
                ? 'border-[var(--nein-accent)] bg-[var(--nein-accent)] text-[var(--nein-accent-contrast)]'
                : 'border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-700 dark:text-slate-300'
            }`}
          >
            <Radar className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{labels.tabRadar}</span>
          </button>
        </div>
      </section>

      {subTab === 'timeline' ? (
        <DisasterTimelineView lang={lang} events={events} onNavigate={onNavigate} />
      ) : (
        <RadarSatelliteView lang={lang} timelines={timelines} onRefresh={onRefreshRadar} />
      )}
    </div>
  );
}
