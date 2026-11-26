import { Activity, AlertTriangle, Monitor, Radio, RefreshCw, ShieldAlert, Waves } from 'lucide-react';
import type { WsStatus } from '../../hooks/useQuakeFeed';
import type {
  JmaQuakeSummaryItem,
  JmaTsunamiSummaryItem,
  JmaXmlBulletin,
  SourceHealthRecord,
  TyphoonActiveInfo,
  VolcanoLocationEntry,
} from '../../types/disaster';
import type { P2PQuakeRecord } from '../../types/quake';
import type { PrefectureOverviewRow } from '../../types/weather';
import type { AppLanguage } from '../../utils/i18n';
import { getExtendedMessages } from '../../utils/i18nExtended';
import { getRecordTitle, getScalePresentation } from '../../utils/quakeParser';
import { formatJstTimestamp } from '../../utils/weatherParser';

interface RealtimeMonitorViewProps {
  lang: AppLanguage;
  wsStatus: WsStatus;
  lastUpdated: Date | null;
  p2pRecords: P2PQuakeRecord[];
  jmaQuakes: JmaQuakeSummaryItem[];
  jmaTsunamis: JmaTsunamiSummaryItem[];
  xmlBulletins: JmaXmlBulletin[];
  typhoons: TyphoonActiveInfo[];
  volcanoes: VolcanoLocationEntry[];
  regionSnapshots: PrefectureOverviewRow[];
  sourceHealth: SourceHealthRecord[];
  onNavigate: (view: string) => void;
  onRefreshAll: () => void;
}

export function RealtimeMonitorView({
  lang,
  wsStatus,
  lastUpdated,
  p2pRecords,
  jmaQuakes,
  jmaTsunamis,
  xmlBulletins,
  typhoons,
  volcanoes,
  regionSnapshots,
  sourceHealth,
  onNavigate,
  onRefreshAll,
}: RealtimeMonitorViewProps) {
  const ext = getExtendedMessages(lang);

  const labels = {
    ja: {
      title: 'NEiN MONITOR — 総合リアルタイム監視',
      subtitle: 'P2P地震情報 WebSocket ストリーム・気象庁公式速報・警報・火山・台風のリアルタイム稼働モニターです。',
      wsStream: 'P2P WebSocket',
      activeAlerts: '発表中の重要・緊急情報',
      liveStreamHeading: 'リアルタイム受信ストリーム（最新 P2P / 気象庁情報）',
      jmaQuakeHeading: '気象庁 公式地震・特別情報ヘッドライン',
      warningWatchHeading: '監視地域の気象警報・注意報サマリー',
      healthyFeeds: '正常稼働ソース',
      noLiveAlerts: '現在、緊急地震速報・津波警報・気象特別警報は発表されていません。',
      openDetail: '詳細ビューへ',
    },
    en: {
      title: 'NEiN MONITOR — Unified Real-Time Telemetry',
      subtitle: 'Live operations board combining P2PQuake WebSocket, JMA official quake/tsunami alerts, warnings, typhoons, and volcanoes.',
      wsStream: 'P2P WebSocket',
      activeAlerts: 'Active Critical Alerts',
      liveStreamHeading: 'Live Incoming Telemetry Stream (P2P / JMA)',
      jmaQuakeHeading: 'JMA Official Quake & Special Bulletins',
      warningWatchHeading: 'Monitored Regions Weather Warning Summary',
      healthyFeeds: 'Healthy Feeds',
      noLiveAlerts: 'No active EEW, Tsunami Warning, or Special Weather Warning at this time.',
      openDetail: 'Open View',
    },
    zh: {
      title: 'NEiN MONITOR — 综合实时监测台',
      subtitle: '集中监测 P2P 地震 WebSocket 实时流、气象厅地震海啸速报、气象警报、台风与火山动态。',
      wsStream: 'P2P WebSocket',
      activeAlerts: '正在发布的重大警报',
      liveStreamHeading: '实时接收数据流（P2P / 气象厅）',
      jmaQuakeHeading: '气象厅官方地震与特别通报',
      warningWatchHeading: '监测区域气象警报摘要',
      healthyFeeds: '正常数据源',
      noLiveAlerts: '当前无紧急地震速报、海啸警报或气象特别警报。',
      openDetail: '前往详情',
    },
    ko: {
      title: 'NEiN MONITOR — 종합 실시간 모니터링',
      subtitle: 'P2P 지진 WebSocket 스트림과 일본 기상청 지진·지진해일·기상경보·태풍·화산 상황을 실시간으로 통합 감시합니다.',
      wsStream: 'P2P WebSocket',
      activeAlerts: '발효 중인 주요 긴급 정보',
      liveStreamHeading: '실시간 수신 스트림 (P2P / 기상청)',
      jmaQuakeHeading: '기상청 공식 지진 및 특별 정보',
      warningWatchHeading: '감시 지역 기상경보·주의보 요약',
      healthyFeeds: '정상 소스',
      noLiveAlerts: '현재 긴급지진속보, 지진해일 경보, 특별경보가 없습니다.',
      openDetail: '상세 화면 열기',
    },
  }[lang];

  const activeEew = p2pRecords.find(
    (r) => (r.code === 556 || r.code === 554) && !(r.code === 556 && r.cancelled),
  );
  const activeTsunami = jmaTsunamis.find(
    (t) =>
      t.highestSeverity === 'major_warning' ||
      t.highestSeverity === 'warning' ||
      t.highestSeverity === 'watch',
  );
  const specialTotal = regionSnapshots.reduce((s, r) => s + r.specialCount, 0);
  const warningTotal = regionSnapshots.reduce((s, r) => s + r.warningCount, 0);
  const elevatedVolcanoes = volcanoes.filter((v) => (v.alertLevelNum ?? 0) >= 2).length;
  const healthyCount = sourceHealth.filter((s) => s.status === 'normal').length;

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)] p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--nein-border-subtle)] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50">{labels.title}</h1>
            </div>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">{labels.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--nein-border)] bg-[var(--nein-sub)] px-2.5 py-1 font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-200">
              <Radio
                className={`h-3.5 w-3.5 ${wsStatus === 'connected' ? 'text-emerald-500' : 'text-amber-500'}`}
                aria-hidden="true"
              />
              {labels.wsStream}: {wsStatus.toUpperCase()}
            </span>
            <button
              type="button"
              onClick={onRefreshAll}
              className="inline-flex items-center gap-1 rounded-md border border-[var(--nein-border)] bg-[var(--nein-sub)] px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-[var(--nein-accent-border)] dark:text-slate-200 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{ext.common.refresh}</span>
            </button>
          </div>
        </div>

        {/* Telemetry Overview Grid */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-3">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">{labels.healthyFeeds}</div>
            <div className="mt-1 font-mono text-xl font-bold text-slate-900 dark:text-slate-100">
              {healthyCount} / {sourceHealth.length}
            </div>
          </div>
          <div className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-3">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">P2P / JMA</div>
            <div className="mt-1 font-mono text-xl font-bold text-slate-900 dark:text-slate-100">
              {p2pRecords.length} / {jmaQuakes.length}
            </div>
          </div>
          <div className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-3">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">{ext.quakeExt.tsunamiTitle}</div>
            <div className="mt-1 font-mono text-xl font-bold text-slate-900 dark:text-slate-100">
              {jmaTsunamis.length}
            </div>
          </div>
          <div className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-3">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">{labels.warningWatchHeading}</div>
            <div className="mt-1 font-mono text-xl font-bold text-slate-900 dark:text-slate-100">
              {specialTotal} / {warningTotal}
            </div>
          </div>
          <div className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-3">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">TYPHOON</div>
            <div className="mt-1 font-mono text-xl font-bold text-slate-900 dark:text-slate-100">
              {typhoons.length}
            </div>
          </div>
          <div className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-3">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">VOLCANO Lv.2+</div>
            <div className="mt-1 font-mono text-xl font-bold text-slate-900 dark:text-slate-100">
              {elevatedVolcanoes}
            </div>
          </div>
        </div>

        {/* Active Critical Alert Strip */}
        <div className="mt-4 rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-3.5 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
            <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden="true" />
            <span>{labels.activeAlerts}</span>
            {lastUpdated && (
              <span className="ml-auto font-mono text-[11px] font-normal text-slate-500">
                {formatJstTimestamp(lastUpdated.toISOString())}
              </span>
            )}
          </div>
          {!activeEew && !activeTsunami && specialTotal === 0 ? (
            <p className="mt-1.5 text-slate-600 dark:text-slate-400">{labels.noLiveAlerts}</p>
          ) : (
            <div className="mt-2 space-y-1.5">
              {activeEew && (
                <div className="rounded border border-red-500 bg-red-500/15 px-3 py-2 font-bold text-red-700 dark:text-red-200">
                  {getRecordTitle(activeEew, lang)}
                </div>
              )}
              {activeTsunami && (
                <div className="rounded border border-fuchsia-500 bg-fuchsia-500/15 px-3 py-2 font-bold text-fuchsia-800 dark:text-fuchsia-200">
                  {activeTsunami.title} — {activeTsunami.epicenter}
                </div>
              )}
              {specialTotal > 0 && (
                <div className="rounded border border-fuchsia-500 bg-fuchsia-500/15 px-3 py-2 font-bold text-fuchsia-800 dark:text-fuchsia-200">
                  Special Warnings Active: {specialTotal}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Live P2P Stream */}
        <section className="rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)] p-4">
          <div className="flex items-center justify-between border-b border-[var(--nein-border-subtle)] pb-2.5">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {labels.liveStreamHeading}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('quake')}
              className="text-xs font-semibold text-[var(--nein-accent-text)] hover:underline cursor-pointer"
            >
              {labels.openDetail} →
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {p2pRecords.slice(0, 10).map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-[var(--nein-border-subtle)] bg-[var(--nein-sub)] px-3 py-2 text-xs"
              >
                <div className="min-w-0">
                  <div className="truncate font-semibold text-slate-900 dark:text-slate-100">
                    {getRecordTitle(r, lang)}
                  </div>
                  <div className="font-mono text-[10px] text-slate-500">
                    Code {r.code}
                    {r.code === 551
                      ? ` · ${getScalePresentation(r.earthquake.maxScale, lang).label}`
                      : ''}
                  </div>
                </div>
                <span className="shrink-0 font-mono text-[10px] text-slate-500">
                  {formatJstTimestamp(r.time)}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* JMA Official Bulletins & Tsunamis */}
        <section className="rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)] p-4">
          <div className="flex items-center justify-between border-b border-[var(--nein-border-subtle)] pb-2.5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {labels.jmaQuakeHeading}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('tsunami')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--nein-accent-text)] hover:underline cursor-pointer"
              >
                <Waves className="h-3.5 w-3.5" aria-hidden="true" />
                <span>TSUNAMI</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('status')}
                className="text-xs font-semibold text-[var(--nein-accent-text)] hover:underline cursor-pointer"
              >
                STATUS →
              </button>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {xmlBulletins.slice(0, 10).map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-[var(--nein-border-subtle)] bg-[var(--nein-sub)] px-3 py-2 text-xs"
              >
                <div className="min-w-0">
                  <div className="truncate font-semibold text-slate-900 dark:text-slate-100">
                    {b.title}
                  </div>
                  <div className="truncate text-[11px] text-slate-600 dark:text-slate-400">
                    {b.headline}
                  </div>
                </div>
                <span className="shrink-0 font-mono text-[10px] text-slate-500">
                  {b.updatedAt ? formatJstTimestamp(b.updatedAt) : '--'}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
