import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CloudRain,
  Eye,
  EyeOff,
  Flame,
  LayoutDashboard,
  MapPin,
  Radar,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  SlidersHorizontal,
  Sun,
  Waves,
  Wind,
} from 'lucide-react';
import { useState } from 'react';
import type {
  DashboardCardId,
  DashboardCardSetting,
  JmaQuakeSummaryItem,
  JmaTsunamiSummaryItem,
  JmaXmlBulletin,
  OpenMeteoAirQualityData,
  RegisteredRegion,
  SourceHealthRecord,
  TyphoonActiveInfo,
  UnifiedTimelineEvent,
  VolcanoLocationEntry,
} from '../../types/disaster';
import type { P2PQuakeRecord } from '../../types/quake';
import type { PrefectureOverviewRow } from '../../types/weather';
import type { AppLanguage } from '../../utils/i18n';
import { getExtendedMessages } from '../../utils/i18nExtended';
import { getRecordTitle, getScalePresentation } from '../../utils/quakeParser';
import { formatJstTimestamp } from '../../utils/weatherParser';

interface ComprehensiveDashboardProps {
  lang: AppLanguage;
  cards: DashboardCardSetting[];
  onMoveCard: (id: DashboardCardId, dir: -1 | 1) => void;
  onToggleVisible: (id: DashboardCardId) => void;
  onToggleSize: (id: DashboardCardId) => void;
  onResetLayout: () => void;
  onNavigate: (view: string) => void;
  onRefreshAll: () => void;
  p2pRecords: P2PQuakeRecord[];
  jmaQuakes: JmaQuakeSummaryItem[];
  jmaTsunamis: JmaTsunamiSummaryItem[];
  xmlBulletins: JmaXmlBulletin[];
  volcanoes: VolcanoLocationEntry[];
  typhoons: TyphoonActiveInfo[];
  registeredRegions: RegisteredRegion[];
  regionSnapshots: PrefectureOverviewRow[];
  airQuality: OpenMeteoAirQualityData | null;
  timelineEvents: UnifiedTimelineEvent[];
  sourceHealth: SourceHealthRecord[];
}

export function ComprehensiveDashboard({
  lang,
  cards,
  onMoveCard,
  onToggleVisible,
  onToggleSize,
  onResetLayout,
  onNavigate,
  onRefreshAll,
  p2pRecords,
  jmaQuakes,
  jmaTsunamis,
  xmlBulletins,
  volcanoes,
  typhoons,
  registeredRegions,
  regionSnapshots,
  airQuality,
  timelineEvents,
  sourceHealth,
}: ComprehensiveDashboardProps) {
  const ext = getExtendedMessages(lang);
  const [isCustomizing, setIsCustomizing] = useState(false);

  const badgeText = {
    ja: {
      special: '特別警報',
      warning: '警報',
      monitored: '監視火山',
      elevated: '警戒Lv.2+',
      bulletins: '発表電文',
      errors: '異常/停止',
      wide: '幅広',
      compact: '標準',
      eewPrefix: '緊急地震速報',
      tsunamiPrefix: '津波',
      specialActive: (n: number) => `特別警報 発表中（${n}件）`,
    },
    en: {
      special: 'Special',
      warning: 'Warning',
      monitored: 'Monitored',
      elevated: 'Lv.2+',
      bulletins: 'JMAXML Bulletins',
      errors: 'Errors',
      wide: 'Wide',
      compact: 'Compact',
      eewPrefix: 'EEW',
      tsunamiPrefix: 'Tsunami',
      specialActive: (n: number) => `Special Weather Warnings Active (${n})`,
    },
    zh: {
      special: '特别警报',
      warning: '警报',
      monitored: '监测火山',
      elevated: '警戒Lv.2+',
      bulletins: '气象通报',
      errors: '异常/中断',
      wide: '宽幅',
      compact: '标准',
      eewPrefix: '紧急地震速报',
      tsunamiPrefix: '海啸',
      specialActive: (n: number) => `正在发布特别警报（${n}项）`,
    },
    ko: {
      special: '특별경보',
      warning: '경보',
      monitored: '감시 화산',
      elevated: '경계Lv.2+',
      bulletins: '기상 전문',
      errors: '오류/중단',
      wide: '넓게',
      compact: '기본',
      eewPrefix: '긴급지진속보',
      tsunamiPrefix: '지진해일',
      specialActive: (n: number) => `특별경보 발효 중 (${n}건)`,
    },
  }[lang];

  const latestP2PQuake = p2pRecords.find((r) => r.code === 551) ?? p2pRecords[0] ?? null;
  const activeEew = p2pRecords.find((r) => (r.code === 556 || r.code === 554) && !(r.code === 556 && r.cancelled));
  const activeTsunami = jmaTsunamis.find(
    (t) => t.highestSeverity === 'major_warning' || t.highestSeverity === 'warning' || t.highestSeverity === 'watch',
  );
  const specialWarningsTotal = regionSnapshots.reduce((sum, r) => sum + r.specialCount, 0);
  const warningsTotal = regionSnapshots.reduce((sum, r) => sum + r.warningCount, 0);
  const hazardBulletins = xmlBulletins.filter(
    (b) => b.category === 'landslide' || b.category === 'heavy_rain' || b.category === 'flood_river',
  );
  const elevatedVolcanoes = volcanoes.filter((v) => (v.alertLevelNum ?? 0) >= 2);
  const healthyCount = sourceHealth.filter((s) => s.status === 'normal').length;
  const issueCount = sourceHealth.filter(
    (s) => s.status === 'fetch_failed' || s.status === 'disconnected',
  ).length;

  const urgentExists = Boolean(activeEew || activeTsunami || specialWarningsTotal > 0);

  const renderCardBody = (id: DashboardCardId) => {
    switch (id) {
      case 'urgent_alerts':
        return urgentExists ? (
          <div className="space-y-2 text-xs">
            {activeEew && (
              <div className="rounded border border-red-500 bg-red-500/15 p-2.5 font-bold text-red-700 dark:text-red-200">
                {badgeText.eewPrefix}: {getRecordTitle(activeEew, lang)}
              </div>
            )}
            {activeTsunami && (
              <div className="rounded border border-fuchsia-500 bg-fuchsia-500/15 p-2.5 font-bold text-fuchsia-800 dark:text-fuchsia-200">
                {badgeText.tsunamiPrefix}: {activeTsunami.title} — {activeTsunami.epicenter}
              </div>
            )}
            {specialWarningsTotal > 0 && (
              <div className="rounded border border-fuchsia-500 bg-fuchsia-500/15 p-2.5 font-bold text-fuchsia-800 dark:text-fuchsia-200">
                {badgeText.specialActive(specialWarningsTotal)}
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-600 dark:text-slate-400">{ext.dashboard.noUrgentBanner}</p>
        );

      case 'latest_quake':
        return (
          <div className="space-y-2 text-xs">
            {latestP2PQuake ? (
              <div className="rounded border border-[var(--nein-border-subtle)] bg-[var(--nein-surface)] p-2.5">
                <div className="font-bold text-slate-900 dark:text-slate-100">
                  {getRecordTitle(latestP2PQuake, lang)}
                </div>
                <div className="mt-1 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                  {latestP2PQuake.code === 551
                    ? `${getScalePresentation(latestP2PQuake.earthquake.maxScale, lang).label} · M${latestP2PQuake.earthquake.hypocenter.magnitude > 0 ? latestP2PQuake.earthquake.hypocenter.magnitude.toFixed(1) : '--'}`
                    : ''}
                  {' · '}
                  {formatJstTimestamp(latestP2PQuake.time)}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">{ext.common.noData}</p>
            )}
            {jmaQuakes[0] && (
              <div className="text-[11px] text-slate-600 dark:text-slate-400">
                JMA: {jmaQuakes[0].epicenter} ({jmaQuakes[0].title})
              </div>
            )}
            <button
              type="button"
              onClick={() => onNavigate('quake')}
              className="text-[11px] font-semibold text-[var(--nein-accent-text)] hover:underline cursor-pointer"
            >
              {ext.common.viewDetails} →
            </button>
          </div>
        );

      case 'tsunami_status':
        return (
          <div className="space-y-2 text-xs">
            {jmaTsunamis[0] ? (
              <div>
                <div className="font-bold text-slate-900 dark:text-slate-100">
                  {jmaTsunamis[0].title}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                  {jmaTsunamis[0].epicenter} · {formatJstTimestamp(jmaTsunamis[0].reportDatetime)}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">{ext.common.noData}</p>
            )}
            <button
              type="button"
              onClick={() => onNavigate('tsunami')}
              className="text-[11px] font-semibold text-[var(--nein-accent-text)] hover:underline cursor-pointer"
            >
              {ext.common.viewDetails} →
            </button>
          </div>
        );

      case 'weather_warnings':
        return (
          <div className="space-y-2 text-xs">
            <div className="flex flex-wrap gap-2 font-mono">
              <span className="rounded bg-fuchsia-500/20 px-2 py-1 font-bold text-fuchsia-800 dark:text-fuchsia-200">
                {badgeText.special}: {specialWarningsTotal}
              </span>
              <span className="rounded bg-red-500/20 px-2 py-1 font-bold text-red-700 dark:text-red-200">
                {badgeText.warning}: {warningsTotal}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('weather')}
              className="text-[11px] font-semibold text-[var(--nein-accent-text)] hover:underline cursor-pointer"
            >
              {ext.common.viewDetails} →
            </button>
          </div>
        );

      case 'registered_regions':
        return (
          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {registeredRegions.map((reg) => {
                const snap = regionSnapshots.find((s) => s.office.officeCode === reg.officeCode);
                return (
                  <div
                    key={reg.id}
                    className="rounded border border-[var(--nein-border-subtle)] bg-[var(--nein-surface)] p-2.5"
                  >
                    <div className="flex items-center justify-between gap-2 font-bold text-slate-900 dark:text-slate-100">
                      <span className="truncate">{reg.label}</span>
                      <span className="font-mono text-[var(--nein-accent-text)]">
                        {snap?.amedasTempC !== null && snap?.amedasTempC !== undefined
                          ? `${snap.amedasTempC.toFixed(1)}℃`
                          : '--'}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                      {snap?.weatherText || ext.common.loading}
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => onNavigate('settings')}
              className="text-[11px] font-semibold text-[var(--nein-accent-text)] hover:underline cursor-pointer"
            >
              {ext.regions.title} →
            </button>
          </div>
        );

      case 'radar_preview':
        return (
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <p className="text-slate-600 dark:text-slate-400">
              {ext.radar.subtitle}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onNavigate('radar')}
                className="rounded border border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] px-3 py-1 font-semibold text-[var(--nein-accent-text)] cursor-pointer"
              >
                {ext.extNav.radarSatellite}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('map')}
                className="rounded border border-[var(--nein-border)] bg-[var(--nein-surface)] px-3 py-1 font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                {ext.extNav.integratedMap}
              </button>
            </div>
          </div>
        );

      case 'typhoon_status':
        return (
          <div className="space-y-1.5 text-xs">
            <div className="font-bold text-slate-900 dark:text-slate-100">
              {typhoons.length > 0 ? typhoons[0].nameJp : ext.typhoon.noActiveTitle}
            </div>
            <button
              type="button"
              onClick={() => onNavigate('typhoon')}
              className="text-[11px] font-semibold text-[var(--nein-accent-text)] hover:underline cursor-pointer"
            >
              {ext.common.viewDetails} →
            </button>
          </div>
        );

      case 'volcano_status':
        return (
          <div className="space-y-1.5 text-xs">
            <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
              {badgeText.monitored}: {volcanoes.length} · {badgeText.elevated}: {elevatedVolcanoes.length}
            </div>
            <button
              type="button"
              onClick={() => onNavigate('volcano')}
              className="text-[11px] font-semibold text-[var(--nein-accent-text)] hover:underline cursor-pointer"
            >
              {ext.common.viewDetails} →
            </button>
          </div>
        );

      case 'landslide_flood':
        return (
          <div className="space-y-1.5 text-xs">
            <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
              {badgeText.bulletins}: {hazardBulletins.length}
            </div>
            <button
              type="button"
              onClick={() => onNavigate('hazards')}
              className="text-[11px] font-semibold text-[var(--nein-accent-text)] hover:underline cursor-pointer"
            >
              {ext.common.viewDetails} →
            </button>
          </div>
        );

      case 'heat_environment':
        return (
          <div className="space-y-1.5 text-xs">
            <div className="font-mono text-slate-800 dark:text-slate-200">
              UV: {airQuality?.uvIndex !== null && airQuality?.uvIndex !== undefined ? airQuality.uvIndex.toFixed(1) : '--'} · PM2.5:{' '}
              {airQuality?.pm25 !== null && airQuality?.pm25 !== undefined ? `${airQuality.pm25.toFixed(1)}` : '--'}
            </div>
            <button
              type="button"
              onClick={() => onNavigate('environment')}
              className="text-[11px] font-semibold text-[var(--nein-accent-text)] hover:underline cursor-pointer"
            >
              {ext.common.viewDetails} →
            </button>
          </div>
        );

      case 'timeline_preview':
        return (
          <div className="space-y-1.5 text-xs">
            {timelineEvents.slice(0, 4).map((ev) => (
              <div
                key={ev.id}
                className="flex items-center justify-between gap-2 rounded border border-[var(--nein-border-subtle)] bg-[var(--nein-surface)] px-2.5 py-1.5"
              >
                <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                  {ev.title}
                </span>
                <span className="shrink-0 font-mono text-[10px] text-slate-500">
                  {formatJstTimestamp(ev.timestampIso)}
                </span>
              </div>
            ))}
            <button
              type="button"
              onClick={() => onNavigate('timeline')}
              className="text-[11px] font-semibold text-[var(--nein-accent-text)] hover:underline cursor-pointer"
            >
              {ext.extNav.timeline} →
            </button>
          </div>
        );

      case 'api_health':
        return (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-mono text-slate-800 dark:text-slate-200">
              {ext.statusLabels.normal}: {healthyCount} / {sourceHealth.length} · {badgeText.errors}: {issueCount}
            </span>
            <button
              type="button"
              onClick={() => onNavigate('status')}
              className="text-[11px] font-semibold text-[var(--nein-accent-text)] hover:underline cursor-pointer"
            >
              {ext.extNav.systemStatus} →
            </button>
          </div>
        );
    }
  };

  const iconForCard = (id: DashboardCardId) => {
    switch (id) {
      case 'urgent_alerts':
        return <AlertTriangle className="h-4 w-4 text-red-500" aria-hidden="true" />;
      case 'latest_quake':
        return <Activity className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />;
      case 'tsunami_status':
        return <Waves className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />;
      case 'weather_warnings':
        return <ShieldAlert className="h-4 w-4 text-amber-500" aria-hidden="true" />;
      case 'registered_regions':
        return <MapPin className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />;
      case 'radar_preview':
        return <Radar className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />;
      case 'typhoon_status':
        return <Wind className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />;
      case 'volcano_status':
        return <Flame className="h-4 w-4 text-orange-500" aria-hidden="true" />;
      case 'landslide_flood':
        return <CloudRain className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />;
      case 'heat_environment':
        return <Sun className="h-4 w-4 text-amber-500" aria-hidden="true" />;
      default:
        return <LayoutDashboard className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />;
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header & Customization Bar */}
      <section className="rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)] p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                {ext.dashboard.title}
              </h1>
            </div>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
              {ext.dashboard.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onRefreshAll}
              className="inline-flex items-center gap-1 rounded-md border border-[var(--nein-border)] bg-[var(--nein-sub)] px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-[var(--nein-accent-border)] dark:text-slate-200 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{ext.common.refresh}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsCustomizing((v) => !v)}
              className={`inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                isCustomizing
                  ? 'border-[var(--nein-accent)] bg-[var(--nein-accent)] text-[var(--nein-accent-contrast)]'
                  : 'border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] text-[var(--nein-accent-text)]'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{isCustomizing ? ext.dashboard.doneCustomizeBtn : ext.dashboard.customizeBtn}</span>
            </button>
            {isCustomizing && (
              <button
                type="button"
                onClick={onResetLayout}
                className="inline-flex items-center gap-1 rounded-md border border-[var(--nein-border)] bg-[var(--nein-sub)] px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{ext.dashboard.resetLayoutBtn}</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Customizable Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {cards.map((card, index) => {
          if (!card.visible && !isCustomizing) return null;
          return (
            <article
              key={card.id}
              className={`rounded-xl border border-[var(--nein-border)] bg-[var(--nein-sub)] p-4 transition-opacity ${
                card.size === 'wide' ? 'md:col-span-2' : ''
              } ${!card.visible ? 'opacity-50' : ''}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--nein-border-subtle)] pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  {iconForCard(card.id)}
                  <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {ext.dashboard.cards[card.id]}
                  </h2>
                </div>

                {isCustomizing && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => onMoveCard(card.id, -1)}
                      aria-label={ext.dashboard.moveUp}
                      className="rounded border border-[var(--nein-border)] bg-[var(--nein-surface)] p-1 text-slate-600 disabled:opacity-40 cursor-pointer"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      disabled={index === cards.length - 1}
                      onClick={() => onMoveCard(card.id, 1)}
                      aria-label={ext.dashboard.moveDown}
                      className="rounded border border-[var(--nein-border)] bg-[var(--nein-surface)] p-1 text-slate-600 disabled:opacity-40 cursor-pointer"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleSize(card.id)}
                      className="rounded border border-[var(--nein-border)] bg-[var(--nein-surface)] px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      {card.size === 'wide' ? badgeText.wide : badgeText.compact}
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleVisible(card.id)}
                      aria-label={ext.dashboard.toggleVisible}
                      className="rounded border border-[var(--nein-border)] bg-[var(--nein-surface)] p-1 text-slate-600 cursor-pointer"
                    >
                      {card.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    </button>
                  </div>
                )}
              </div>

              {renderCardBody(card.id)}
            </article>
          );
        })}
      </div>
    </div>
  );
}
