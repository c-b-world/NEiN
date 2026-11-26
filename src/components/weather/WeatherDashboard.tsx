import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Compass,
  Droplets,
  Gauge,
  Info,
  MapPin,
  RefreshCw,
  ShieldAlert,
  Umbrella,
  Wind,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  JAPAN_WEATHER_OFFICES,
  WEATHER_REGION_LABELS,
} from '../../data/japanWeatherRegions';
import { useWeatherDashboard } from '../../hooks/useWeatherDashboard';
import type { SourceMeta, WeatherRegionGroup } from '../../types/weather';
import { type AppLanguage, getMessages } from '../../utils/i18n';
import { getExtendedMessages } from '../../utils/i18nExtended';
import { fetchWeatherOverviewText } from '../../utils/jmaFeedsApi';
import type { ThemeMode } from '../../utils/themeSettings';
import { describeJmaWeatherCode } from '../../utils/weatherCodes';
import {
  deriveModelAdvisoryNotes,
  formatJstClock,
  formatJstTimestamp,
} from '../../utils/weatherParser';
import { RawTextDrawer } from '../RawTextDrawer';
import { WeatherCharts } from './WeatherCharts';
import { WeatherIcon } from './WeatherIcon';

interface WeatherDashboardProps {
  lang: AppLanguage;
  isActive: boolean;
  themeMode: ThemeMode;
}

const REGION_GROUP_LIST: Array<{ id: WeatherRegionGroup; label: string }> = [
  { id: 'hokkaido', label: '北海道' },
  { id: 'tohoku', label: '東北' },
  { id: 'kanto', label: '関東・甲信' },
  { id: 'chubu', label: '中部・北陸' },
  { id: 'kinki', label: '近畿' },
  { id: 'chugoku', label: '中国' },
  { id: 'shikoku', label: '四国' },
  { id: 'kyushu_okinawa', label: '九州・沖縄' },
];

function StatusIndicator({
  meta,
  label,
  lang,
}: {
  meta: SourceMeta | undefined;
  label: string;
  lang: AppLanguage;
}) {
  const mw = getMessages(lang).weather;
  const status = meta?.status ?? 'loading';
  const dotClass =
    status === 'ok'
      ? 'bg-emerald-500 dark:bg-emerald-400'
      : status === 'stale'
      ? 'bg-amber-500 dark:bg-amber-400'
      : status === 'error'
      ? 'bg-red-500 dark:bg-red-400'
      : 'bg-sky-500 dark:bg-sky-400';
  const textClass =
    status === 'ok'
      ? 'text-emerald-700 dark:text-emerald-300'
      : status === 'stale'
      ? 'text-amber-700 dark:text-amber-300'
      : status === 'error'
      ? 'text-red-700 dark:text-red-300'
      : 'text-slate-700 dark:text-slate-300';
  const statusLabel =
    status === 'ok'
      ? mw.statusOk
      : status === 'stale'
      ? mw.statusStale
      : status === 'error'
      ? mw.statusError
      : mw.statusLoading;

  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] px-3 py-2 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-slate-800 dark:text-slate-300">{label}</span>
        <span className={`inline-flex items-center gap-1.5 font-semibold ${textClass}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} aria-hidden="true" />
          {statusLabel}
        </span>
      </div>
      <div className="font-mono text-[11px] tabular-nums text-slate-500">
        {mw.publishedAt} {meta?.publishedAt ? formatJstTimestamp(meta.publishedAt) : '--'}
      </div>
    </div>
  );
}

export function WeatherDashboard({ lang, isActive, themeMode }: WeatherDashboardProps) {
  const mw = getMessages(lang).weather;
  const ext = getExtendedMessages(lang);
  const {
    selectedOffice,
    selectedOfficeCode,
    selectedAreaCode,
    selectOffice,
    selectSubArea,
    forecast,
    warning,
    amedas,
    openMeteo,
    isLoadingDetail,
    lastFetchedAt,
    refreshCooldownSec,
    refreshNow,
    overviewRegionGroup,
    setOverviewRegionGroup,
    overviewRows,
    isLoadingOverview,
  } = useWeatherDashboard(isActive);

  const [overviewText, setOverviewText] = useState<{
    headlineText: string;
    text: string;
    reportDatetime: string;
  } | null>(null);

  useEffect(() => {
    if (!isActive) return;
    let cancelled = false;
    void fetchWeatherOverviewText(selectedOfficeCode).then((res) => {
      if (!cancelled) setOverviewText(res);
    });
    return () => {
      cancelled = true;
    };
  }, [isActive, selectedOfficeCode]);

  const modelNotes = deriveModelAdvisoryNotes(openMeteo);
  const specialWarnings = warning?.activeSpecialWarnings ?? [];
  const activeWarnings = warning?.activeWarnings ?? [];
  const activeAdvisories = warning?.activeAdvisories ?? [];

  const handleSelectPrefectureFromOverview = (officeCode: string) => {
    selectOffice(officeCode);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const currentPop6h = forecast?.popSlots[0]?.pop ?? null;
  const obsTimeLabel = amedas?.observedAtIso
    ? formatJstTimestamp(amedas.observedAtIso)
    : '--';

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Special Warning High-Visibility Alert Banner (only shown when active) */}
      {specialWarnings.length > 0 && (
        <section
          role="alert"
          aria-live="assertive"
          className="rounded-xl border-2 border-fuchsia-600 bg-gradient-to-r from-red-900 via-fuchsia-900 to-red-900 px-4 py-4 shadow-lg shadow-red-950/30 sm:px-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-fuchsia-200" aria-hidden="true" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-fuchsia-400 px-2 py-0.5 text-xs font-extrabold tracking-wider text-slate-950">
                    {mw.specialWarningBadge}
                  </span>
                  {warning?.meta.isStale && (
                    <span className="rounded bg-amber-400 px-2 py-0.5 text-xs font-bold text-slate-950">
                      {mw.staleBadge}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-sm font-bold text-white">
                  {specialWarnings.map((w) => `${w.areaName}: ${w.name}（${w.status}）`).join(' ／ ')}
                </p>
                <p className="mt-1 text-xs text-fuchsia-100/90">
                  {mw.specialWarningAction}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. Region Selector & API Connection / Timestamp Strip */}
      <section
        aria-label={mw.prefectureLabel}
        className="rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)] p-4 sm:p-5"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div>
              <label
                htmlFor="weather-office-select"
                className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                <MapPin className="h-3.5 w-3.5 text-[var(--nein-accent-text)]" aria-hidden="true" />
                <span>{mw.prefectureLabel}</span>
              </label>
              <select
                id="weather-office-select"
                value={selectedOfficeCode}
                onChange={(e) => selectOffice(e.target.value)}
                className="w-full min-w-[230px] rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] px-3 py-2 text-sm font-medium text-slate-900 focus:border-[var(--nein-accent)] focus:outline-none dark:text-slate-100 sm:w-auto cursor-pointer"
              >
                {REGION_GROUP_LIST.map((grp) => (
                  <optgroup key={grp.id} label={grp.label} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
                    {JAPAN_WEATHER_OFFICES.filter((o) => o.regionGroup === grp.id).map((o) => (
                      <option key={o.officeCode} value={o.officeCode}>
                        {o.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {forecast && forecast.subAreas.length > 0 && (
              <div>
                <label
                  htmlFor="weather-subarea-select"
                  className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  {mw.subAreaLabel}
                </label>
                <select
                  id="weather-subarea-select"
                  value={selectedAreaCode}
                  onChange={(e) => selectSubArea(e.target.value)}
                  className="w-full min-w-[170px] rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] px-3 py-2 text-sm font-medium text-slate-900 focus:border-[var(--nein-accent)] focus:outline-none dark:text-slate-100 sm:w-auto cursor-pointer"
                >
                  {forecast.subAreas.map((sub) => (
                    <option key={sub.code} value={sub.code}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
            <div className="flex items-center gap-2 font-mono text-xs tabular-nums text-slate-600 dark:text-slate-400">
              <Clock className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
              <span>{mw.fetchedAt}</span>
              <span className="font-semibold text-slate-900 dark:text-slate-200">
                {lastFetchedAt ? `${formatJstClock(lastFetchedAt)} JST` : '--:--:--'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => void refreshNow()}
              disabled={isLoadingDetail || refreshCooldownSec > 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] px-3.5 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-200/70 disabled:cursor-not-allowed disabled:opacity-55 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 cursor-pointer"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isLoadingDetail ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>
                {isLoadingDetail
                  ? mw.fetchingBtn
                  : refreshCooldownSec > 0
                  ? `${mw.waitBtnPrefix} (${refreshCooldownSec}s)`
                  : mw.refreshBtn}
              </span>
            </button>
          </div>
        </div>

        {/* 4 API Source Status Cards */}
        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <StatusIndicator lang={lang} meta={forecast?.meta} label="JMA Forecast JSON" />
          <StatusIndicator lang={lang} meta={warning?.meta} label="JMA Warning JSON" />
          <StatusIndicator
            lang={lang}
            meta={amedas?.meta}
            label={`JMA AMeDAS (${selectedOffice.stationName})`}
          />
          <StatusIndicator lang={lang} meta={openMeteo?.meta} label="Open-Meteo Model" />
        </div>
      </section>

      {/* 3. Official JMA Warnings vs Model Risk Notes (Strict Separation) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Official JMA Warnings Panel */}
        <section
          aria-label="気象庁公式 気象警報・注意報"
          className="rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)] p-4 sm:p-5 lg:col-span-2"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--nein-border-subtle)] pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {mw.officialWarningHeading}（{selectedOffice.prefectureName}）
              </h2>
            </div>
            <span className="font-mono text-[11px] tabular-nums text-slate-600 dark:text-slate-400">
              発表時刻: {warning?.meta.publishedAt ? formatJstTimestamp(warning.meta.publishedAt) : '取得不可'}
            </span>
          </div>

          {!warning && isLoadingDetail ? (
            <div className="mt-4 rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-4 text-xs text-slate-600 dark:text-slate-400">
              気象庁 警報・注意報データを取得中...
            </div>
          ) : warning?.meta.status === 'error' ? (
            <div
              role="alert"
              className="mt-4 flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-xs text-red-900 dark:border-red-700/80 dark:bg-red-950/50 dark:text-red-100"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
              <div>
                <p className="font-bold text-red-800 dark:text-red-200">
                  警報・注意報データを取得できませんでした（「警報なし」と解釈しないでください）
                </p>
                <p className="mt-1 text-red-700 dark:text-red-200/90">{warning.meta.errorMessage}</p>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {/* Stale Warning Banner */}
              {warning?.meta.isStale && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-lg border border-amber-400 bg-amber-50 p-3.5 text-xs text-amber-950 dark:border-amber-600/80 dark:bg-amber-950/50 dark:text-amber-100"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                  <div>
                    <p className="font-bold text-amber-900 dark:text-amber-200">
                      情報期限切れ / 更新停止の可能性
                    </p>
                    <p className="mt-0.5 text-amber-800 dark:text-amber-100/90">
                      {warning.meta.staleReason} 現在の最新の警報・注意報ではない可能性が高いため、必ず気象庁公式サイトをご確認ください。
                    </p>
                  </div>
                </div>
              )}

              {warning?.headlineText && (
                <p className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] px-3.5 py-2.5 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                  {warning.headlineText}
                </p>
              )}

              {/* Summary Counts when fresh & no active warnings */}
              {warning &&
              !warning.meta.isStale &&
              specialWarnings.length === 0 &&
              activeWarnings.length === 0 &&
              activeAdvisories.length === 0 ? (
                <div className="flex items-center gap-2.5 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-200">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  <span>
                    現在、{selectedOffice.prefectureName}管内に発表中の気象警報・注意報はありません（発表確認済み）。
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {warning?.areaGroups.map((group) => (
                    <div
                      key={group.areaCode}
                      className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-3"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-900 dark:text-slate-200">
                        <span>{group.areaName}</span>
                        {group.hasNoWarningsFlag && (
                          <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                            {warning.meta.isStale ? '記録時点: なし' : '発表なし'}
                          </span>
                        )}
                      </div>
                      {group.items.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {group.items.map((item, idx) => {
                            const isCleared = item.status === '解除';
                            const tone = isCleared
                              ? 'border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400'
                              : item.level === 'special'
                              ? 'border-fuchsia-600 bg-fuchsia-950 text-fuchsia-100 font-bold'
                              : item.level === 'warning'
                              ? 'border-red-600/80 bg-red-600 text-white dark:bg-red-950/80 dark:text-red-100 font-semibold'
                              : 'border-amber-500/70 bg-amber-100 text-amber-950 dark:border-amber-600/70 dark:bg-amber-950/60 dark:text-amber-100';
                            return (
                              <span
                                key={`${group.areaCode}-${item.code}-${idx}`}
                                className={`rounded border px-2 py-0.5 text-[11px] ${tone}`}
                              >
                                {item.name}（{item.status}）
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Distinct Model Advisory Notes Panel */}
        <section
          aria-label="気象モデル参考情報"
          className="rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)] p-4 sm:p-5"
        >
          <div className="border-b border-[var(--nein-border-subtle)] pb-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {mw.modelAdvisoryHeading}
              </h2>
            </div>
            <p className="mt-1 text-[11px] font-medium text-[var(--nein-accent-text)]">
              {mw.modelAdvisoryNote}
            </p>
          </div>

          <div className="mt-3 space-y-2.5">
            {openMeteo?.meta.status === 'error' ? (
              <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-800 dark:border-red-800/70 dark:bg-red-950/40 dark:text-red-200">
                Open-Meteo予測データを取得できなかったため算出できません。
              </div>
            ) : modelNotes.length === 0 ? (
              <div className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-3 text-xs text-slate-600 dark:text-slate-400">
                予測データを読み込み中です。
              </div>
            ) : (
              modelNotes.map((note) => (
                <div
                  key={note.id}
                  className={`rounded-lg border p-3 text-xs ${
                    note.severity === 'caution'
                      ? 'border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] text-slate-900 dark:text-sky-100'
                      : 'border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    {note.title}
                  </div>
                  <p className="mt-1 leading-relaxed text-slate-700 dark:text-slate-300">
                    {note.detail}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* 4. Current Weather Metrics: Real AMeDAS Observation vs Model Forecast */}
      <section
        aria-label="現在の気象観測および予測値"
        className="rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)] p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--nein-border-subtle)] pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {mw.currentConditionsHeading}（{selectedOffice.stationName} / {forecast?.activeAreaName ?? selectedOffice.prefectureName}）
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
              <strong className="text-emerald-700 dark:text-emerald-300">実測値</strong>（気象庁アメダス {obsTimeLabel}）と
              <strong className="ml-1 text-[var(--nein-accent-text)]">予測値</strong>（Open-Meteo気象モデル）を明確に分けて表示しています。
            </p>
          </div>
          {amedas?.meta.isStale && (
            <span className="rounded border border-amber-400 bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-900 dark:border-amber-600/80 dark:bg-amber-950/60 dark:text-amber-200">
              アメダス実測値：情報期限切れ
            </span>
          )}
        </div>

        {amedas?.meta.status === 'error' && (
          <div
            role="alert"
            className="mt-3 flex items-center gap-2 rounded-lg border border-amber-400 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900 dark:border-amber-700/70 dark:bg-amber-950/40 dark:text-amber-100"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            <span>{amedas.meta.errorMessage}（モデル予測値を参考表示します）</span>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {/* Temp */}
          <div className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-3.5">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>{mw.tempLabel}</span>
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                {amedas?.tempC !== null && amedas?.tempC !== undefined ? 'アメダス実測' : 'モデル予測'}
              </span>
            </div>
            <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-950 dark:text-slate-50">
              {amedas?.tempC !== null && amedas?.tempC !== undefined ? (
                <>
                  {amedas.tempC.toFixed(1)}
                  <span className="ml-0.5 font-sans text-sm font-medium text-slate-600 dark:text-slate-300">℃</span>
                </>
              ) : openMeteo?.current?.tempC !== null && openMeteo?.current?.tempC !== undefined ? (
                <>
                  {openMeteo.current.tempC.toFixed(1)}
                  <span className="ml-0.5 font-sans text-sm font-medium text-slate-600 dark:text-slate-300">℃</span>
                </>
              ) : (
                '--'
              )}
            </div>
            <div className="mt-1.5 font-mono text-[11px] tabular-nums text-slate-600 dark:text-slate-400">
              Model:{' '}
              {openMeteo?.current?.tempC !== null && openMeteo?.current?.tempC !== undefined
                ? `${openMeteo.current.tempC.toFixed(1)} ℃`
                : '--'}
            </div>
          </div>

          {/* Humidity */}
          <div className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-3.5">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Droplets className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" aria-hidden="true" />
                {mw.humidityLabel}
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                {amedas?.humidityPct !== null && amedas?.humidityPct !== undefined ? 'アメダス実測' : 'モデル予測'}
              </span>
            </div>
            <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-950 dark:text-slate-50">
              {amedas?.humidityPct !== null && amedas?.humidityPct !== undefined ? (
                <>
                  {amedas.humidityPct}
                  <span className="ml-0.5 font-sans text-sm font-medium text-slate-600 dark:text-slate-300">%</span>
                </>
              ) : openMeteo?.current?.humidityPct !== null && openMeteo?.current?.humidityPct !== undefined ? (
                <>
                  {openMeteo.current.humidityPct}
                  <span className="ml-0.5 font-sans text-sm font-medium text-slate-600 dark:text-slate-300">%</span>
                </>
              ) : (
                '--'
              )}
            </div>
            <div className="mt-1.5 font-mono text-[11px] tabular-nums text-slate-600 dark:text-slate-400">
              Model:{' '}
              {openMeteo?.current?.humidityPct !== null && openMeteo?.current?.humidityPct !== undefined
                ? `${openMeteo.current.humidityPct} %`
                : '--'}
            </div>
          </div>

          {/* Pressure */}
          <div className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-3.5">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Gauge className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                {mw.pressureLabel}
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                {amedas?.pressureHpa !== null && amedas?.pressureHpa !== undefined ? 'アメダス実測' : 'モデル予測'}
              </span>
            </div>
            <div className="mt-2 font-mono text-xl font-bold tabular-nums text-slate-950 dark:text-slate-50">
              {amedas?.pressureHpa !== null && amedas?.pressureHpa !== undefined ? (
                <>
                  {amedas.pressureHpa.toFixed(1)}
                  <span className="ml-1 font-sans text-xs font-medium text-slate-600 dark:text-slate-300">hPa</span>
                </>
              ) : openMeteo?.current?.pressureMslHpa !== null && openMeteo?.current?.pressureMslHpa !== undefined ? (
                <>
                  {openMeteo.current.pressureMslHpa.toFixed(1)}
                  <span className="ml-1 font-sans text-xs font-medium text-slate-600 dark:text-slate-300">hPa</span>
                </>
              ) : (
                '--'
              )}
            </div>
            <div className="mt-1.5 font-mono text-[11px] tabular-nums text-slate-600 dark:text-slate-400">
              Model:{' '}
              {openMeteo?.current?.pressureMslHpa !== null && openMeteo?.current?.pressureMslHpa !== undefined
                ? `${openMeteo.current.pressureMslHpa.toFixed(1)} hPa`
                : '--'}
            </div>
          </div>

          {/* Wind Speed & Direction */}
          <div className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-3.5">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Wind className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                {mw.windLabel}
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                {amedas?.windSpeedMs !== null && amedas?.windSpeedMs !== undefined ? 'アメダス実測' : 'モデル予測'}
              </span>
            </div>
            <div className="mt-2 font-mono text-xl font-bold tabular-nums text-slate-950 dark:text-slate-50">
              {amedas?.windSpeedMs !== null && amedas?.windSpeedMs !== undefined ? (
                <>
                  {amedas.windSpeedMs.toFixed(1)}
                  <span className="ml-1 font-sans text-xs font-medium text-slate-600 dark:text-slate-300">m/s</span>
                </>
              ) : openMeteo?.current?.windSpeedMs !== null && openMeteo?.current?.windSpeedMs !== undefined ? (
                <>
                  {openMeteo.current.windSpeedMs.toFixed(1)}
                  <span className="ml-1 font-sans text-xs font-medium text-slate-600 dark:text-slate-300">m/s</span>
                </>
              ) : (
                '--'
              )}
            </div>
            <div className="mt-1.5 flex items-center gap-1 font-mono text-[11px] tabular-nums text-slate-600 dark:text-slate-400">
              <Compass className="h-3 w-3 text-slate-500" aria-hidden="true" />
              <span>
                {amedas?.windDirectionText ??
                  openMeteo?.current?.windDirectionText ??
                  '--'}
              </span>
            </div>
          </div>

          {/* Precipitation */}
          <div className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-3.5">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Umbrella className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
                {mw.precipLabel}
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                {amedas?.precipitation1hMm !== null && amedas?.precipitation1hMm !== undefined ? 'アメダス実測' : 'モデル予測'}
              </span>
            </div>
            <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-950 dark:text-slate-50">
              {amedas?.precipitation1hMm !== null && amedas?.precipitation1hMm !== undefined ? (
                <>
                  {amedas.precipitation1hMm.toFixed(1)}
                  <span className="ml-1 font-sans text-xs font-medium text-slate-600 dark:text-slate-300">mm</span>
                </>
              ) : openMeteo?.current?.precipitationMm !== null && openMeteo?.current?.precipitationMm !== undefined ? (
                <>
                  {openMeteo.current.precipitationMm.toFixed(1)}
                  <span className="ml-1 font-sans text-xs font-medium text-slate-600 dark:text-slate-300">mm</span>
                </>
              ) : (
                '--'
              )}
            </div>
            <div className="mt-1.5 font-mono text-[11px] tabular-nums text-slate-600 dark:text-slate-400">
              24h:{' '}
              {amedas?.precipitation24hMm !== null && amedas?.precipitation24hMm !== undefined
                ? `${amedas.precipitation24hMm.toFixed(1)} mm`
                : '--'}
            </div>
          </div>

          {/* PoP (JMA Official) */}
          <div className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-3.5">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>{mw.popLabel}</span>
              <span className="text-[10px] font-semibold text-[var(--nein-accent-text)]">
                JMA
              </span>
            </div>
            <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-950 dark:text-slate-50">
              {currentPop6h !== null ? (
                <>
                  {currentPop6h}
                  <span className="ml-0.5 font-sans text-sm font-medium text-slate-600 dark:text-slate-300">%</span>
                </>
              ) : (
                '--'
              )}
            </div>
            <div className="mt-1.5 text-[11px] text-slate-600 dark:text-slate-400 truncate">
              {forecast?.popSlots[0]?.label ?? '6時間区分'}
            </div>
          </div>
        </div>

        {/* Extended Atmospheric Telemetry Strip (Snow, Sunshine, Gusts, Visibility, Apparent Temp, UV) */}
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-lg border border-[var(--nein-border-subtle)] bg-[var(--nein-sub)] px-3 py-2 text-xs">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">{ext.environment.snowDepthLabel}</div>
            <div className="mt-0.5 font-mono font-bold text-slate-900 dark:text-slate-100">
              {amedas?.snowDepthCm !== null && amedas?.snowDepthCm !== undefined
                ? `${amedas.snowDepthCm} cm`
                : amedas?.snow1hCm !== null && amedas?.snow1hCm !== undefined
                ? `1h: ${amedas.snow1hCm} cm`
                : openMeteo?.current?.snowfallCm !== null && openMeteo?.current?.snowfallCm !== undefined
                ? `${openMeteo.current.snowfallCm} cm`
                : '--'}
            </div>
          </div>

          <div className="rounded-lg border border-[var(--nein-border-subtle)] bg-[var(--nein-sub)] px-3 py-2 text-xs">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">{ext.environment.sunshineLabel}</div>
            <div className="mt-0.5 font-mono font-bold text-slate-900 dark:text-slate-100">
              {amedas?.sunshine1hMin !== null && amedas?.sunshine1hMin !== undefined
                ? `${amedas.sunshine1hMin} min`
                : '--'}
            </div>
          </div>

          <div className="rounded-lg border border-[var(--nein-border-subtle)] bg-[var(--nein-sub)] px-3 py-2 text-xs">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">{ext.environment.gustLabel}</div>
            <div className="mt-0.5 font-mono font-bold text-slate-900 dark:text-slate-100">
              {amedas?.maxGustMs !== null && amedas?.maxGustMs !== undefined
                ? `${amedas.maxGustMs.toFixed(1)} m/s`
                : openMeteo?.current?.windGustMs !== null && openMeteo?.current?.windGustMs !== undefined
                ? `${openMeteo.current.windGustMs.toFixed(1)} m/s`
                : '--'}
            </div>
          </div>

          <div className="rounded-lg border border-[var(--nein-border-subtle)] bg-[var(--nein-sub)] px-3 py-2 text-xs">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">{ext.environment.apparentTempLabel}</div>
            <div className="mt-0.5 font-mono font-bold text-slate-900 dark:text-slate-100">
              {openMeteo?.current?.apparentTempC !== null && openMeteo?.current?.apparentTempC !== undefined
                ? `${openMeteo.current.apparentTempC.toFixed(1)} ℃`
                : '--'}
            </div>
          </div>

          <div className="rounded-lg border border-[var(--nein-border-subtle)] bg-[var(--nein-sub)] px-3 py-2 text-xs">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">{ext.environment.visibilityLabel}</div>
            <div className="mt-0.5 font-mono font-bold text-slate-900 dark:text-slate-100">
              {openMeteo?.current?.visibilityM !== null && openMeteo?.current?.visibilityM !== undefined
                ? `${(openMeteo.current.visibilityM / 1000).toFixed(1)} km`
                : '--'}
            </div>
          </div>

          <div className="rounded-lg border border-[var(--nein-border-subtle)] bg-[var(--nein-sub)] px-3 py-2 text-xs">
            <div className="text-[11px] text-slate-500 dark:text-slate-400">{ext.environment.uvLabel}</div>
            <div className="mt-0.5 font-mono font-bold text-slate-900 dark:text-slate-100">
              {openMeteo?.current?.uvIndex !== null && openMeteo?.current?.uvIndex !== undefined
                ? openMeteo.current.uvIndex.toFixed(1)
                : '--'}
            </div>
          </div>
        </div>

        {overviewText?.text && (
          <div className="mt-3 rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-3.5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 font-bold text-slate-900 dark:text-slate-100">
              <span>気象庁 天気概況（{selectedOffice.prefectureName}）</span>
              <span className="font-mono text-[11px] font-normal text-slate-500">
                {overviewText.reportDatetime ? formatJstTimestamp(overviewText.reportDatetime) : ''}
              </span>
            </div>
            {overviewText.headlineText && (
              <p className="mt-1 font-medium text-[var(--nein-accent-text)]">
                {overviewText.headlineText}
              </p>
            )}
            <p className="mt-1 whitespace-pre-line leading-relaxed text-slate-700 dark:text-slate-300">
              {overviewText.text}
            </p>
            <RawTextDrawer
              lang={lang}
              rawText={`${overviewText.headlineText}\n${overviewText.text}`}
              officialUrl={`https://www.jma.go.jp/bosai/forecast/#area_type=offices&area_code=${selectedOfficeCode}`}
            />
          </div>
        )}
      </section>

      {/* 5. 24-Hour Temperature Chart + Official JMA Short Forecast & 6h PoP */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <WeatherCharts openMeteo={openMeteo} isLoading={isLoadingDetail} themeMode={themeMode} />
        </div>

        <section
          aria-label="気象庁公式 短期予報・降水確率"
          className="flex flex-col gap-4 rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)] p-4 sm:p-5 lg:col-span-5"
        >
          <div className="flex items-center justify-between border-b border-[var(--nein-border-subtle)] pb-2.5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {mw.shortForecastHeading}（{forecast?.activeAreaName ?? selectedOffice.prefectureName}）
              </h3>
              <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                発表: {forecast?.meta.publishedAt ? formatJstTimestamp(forecast.meta.publishedAt) : '--'}
              </p>
            </div>
          </div>

          {forecast?.meta.status === 'error' ? (
            <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-800 dark:border-red-800/70 dark:bg-red-950/40 dark:text-red-200">
              {forecast.meta.errorMessage}
            </div>
          ) : (
            <>
              <div className="space-y-2.5">
                {(forecast?.shortDays ?? []).slice(0, 3).map((day) => {
                  const visual = describeJmaWeatherCode(day.weatherCode);
                  return (
                    <div
                      key={day.dateIso}
                      className="flex items-start justify-between gap-3 rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-3"
                    >
                      <div className="flex items-start gap-2.5">
                        <WeatherIcon kind={visual.kind} className="mt-0.5 h-5 w-5 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {day.label}
                          </div>
                          <div className="mt-0.5 text-xs text-slate-700 dark:text-slate-200">
                            {day.weatherText}
                          </div>
                          {day.windText && (
                            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                              {day.windText}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-right font-mono text-xs tabular-nums">
                        {day.tempMax !== null && (
                          <div className="font-semibold text-amber-700 dark:text-amber-300">
                            最高 {day.tempMax}℃
                          </div>
                        )}
                        {day.tempMin !== null && (
                          <div className="text-sky-700 dark:text-sky-300">
                            最低 {day.tempMin}℃
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {forecast && forecast.popSlots.length > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    6時間ごとの降水確率（気象庁公式）
                  </h4>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-3">
                    {forecast.popSlots.slice(0, 6).map((slot) => (
                      <div
                        key={slot.timeIso}
                        className="rounded border border-[var(--nein-border)] bg-[var(--nein-sub)] px-2.5 py-2 text-center"
                      >
                        <div className="text-[10px] text-slate-600 dark:text-slate-400">
                          {slot.label}
                        </div>
                        <div className="mt-0.5 font-mono text-sm font-bold tabular-nums text-sky-700 dark:text-sky-300">
                          {slot.pop !== null ? `${slot.pop}%` : '--'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* 6. Weekly Weather Forecast (7 Days: JMA Official + Open-Meteo Model) */}
      <section
        aria-label="週間天気予報"
        className="rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)] p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--nein-border-subtle)] pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {mw.weeklyForecastHeading}（{forecast?.activeAreaName ?? selectedOffice.prefectureName}）
            </h3>
            <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
              上段：気象庁 公式週間予報（信頼度付） ／ 下段：Open-Meteo 気象モデル予測値（参考比較）
            </p>
          </div>
        </div>

        {forecast?.meta.status === 'error' && (!openMeteo || openMeteo.meta.status === 'error') ? (
          <div className="mt-3 rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-800 dark:border-red-800/70 dark:bg-red-950/40 dark:text-red-200">
            週間予報データを取得できませんでした。
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
            {(forecast?.weeklyDays.length ? forecast.weeklyDays : openMeteo?.daily7d ?? []).map(
              (day, idx) => {
                const isJma = 'reliability' in day;
                const dateIso = day.dateIso.slice(0, 10);
                const modelCounterpart = openMeteo?.daily7d.find((d) => d.dateIso === dateIso);
                const visual = isJma
                  ? describeJmaWeatherCode(day.weatherCode)
                  : describeJmaWeatherCode('100');

                return (
                  <div
                    key={day.dateIso + idx}
                    className="flex flex-col justify-between rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-3"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-slate-200">
                        <span>{day.label}</span>
                        {isJma && day.reliability && (
                          <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                            信頼度 {day.reliability}
                          </span>
                        )}
                      </div>

                      <div className="my-2.5 flex items-center gap-2">
                        <WeatherIcon kind={visual.kind} className="h-5 w-5 shrink-0" />
                        <span className="text-xs text-slate-800 dark:text-slate-200">
                          {day.weatherLabel}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 border-t border-[var(--nein-border-subtle)] pt-2 font-mono text-[11px] tabular-nums">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 dark:text-slate-400">最高/最低</span>
                        <span>
                          <strong className="text-amber-700 dark:text-amber-300">
                            {isJma
                              ? day.tempMax !== null
                                ? `${day.tempMax}°`
                                : '--'
                              : modelCounterpart?.tempMaxC !== null && modelCounterpart?.tempMaxC !== undefined
                              ? `${Math.round(modelCounterpart.tempMaxC)}°`
                              : '--'}
                          </strong>
                          <span className="mx-0.5 text-slate-400 dark:text-slate-600">/</span>
                          <strong className="text-sky-700 dark:text-sky-300">
                            {isJma
                              ? day.tempMin !== null
                                ? `${day.tempMin}°`
                                : '--'
                              : modelCounterpart?.tempMinC !== null && modelCounterpart?.tempMinC !== undefined
                              ? `${Math.round(modelCounterpart.tempMinC)}°`
                              : '--'}
                          </strong>
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 dark:text-slate-400">降水確率</span>
                        <span className="text-sky-700 dark:text-sky-300 font-semibold">
                          {isJma
                            ? day.pop !== null
                              ? `${day.pop}%`
                              : '--'
                            : modelCounterpart?.popMaxPct !== null && modelCounterpart?.popMaxPct !== undefined
                            ? `${modelCounterpart.popMaxPct}%`
                            : '--'}
                        </span>
                      </div>
                      {modelCounterpart && isJma && (
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span>モデル予測</span>
                          <span>
                            {modelCounterpart.tempMaxC !== null ? Math.round(modelCounterpart.tempMaxC) : '--'}°/
                            {modelCounterpart.tempMinC !== null ? Math.round(modelCounterpart.tempMinC) : '--'}°
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              },
            )}
          </div>
        )}
      </section>

      {/* 7. Nationwide Prefecture Weather Overview (Filtered by Region to Throttle API Access) */}
      <section
        aria-label="全国の都道府県別天気予報"
        className="rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)] p-4 sm:p-5"
      >
        <div className="flex flex-col gap-3 border-b border-[var(--nein-border-subtle)] pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {mw.overviewHeading}（58）
            </h3>
            <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
              サーバー負荷軽減のため、地方別にキャッシュ付き並列制御（最大3並列）で取得しています。行をクリックすると詳細表示へ切り替わります。
            </p>
          </div>
          {isLoadingOverview && (
            <span className="font-mono text-xs text-[var(--nein-accent-text)]">
              地域データ更新中...
            </span>
          )}
        </div>

        {/* Region Filter Tabs */}
        <div
          role="tablist"
          aria-label="地方区分フィルタ"
          className="mt-3 flex flex-wrap gap-1.5"
        >
          {WEATHER_REGION_LABELS.map((reg) => {
            const active = overviewRegionGroup === reg.id;
            return (
              <button
                key={reg.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setOverviewRegionGroup(reg.id)}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  active
                    ? 'border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] text-[var(--nein-accent-text)] font-semibold'
                    : 'border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {reg.label}
              </button>
            );
          })}
        </div>

        {/* Responsive Overview Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--nein-border)] text-slate-600 dark:text-slate-400">
                <th className="py-2 pr-3 font-semibold">都道府県・管区</th>
                <th className="px-3 py-2 font-semibold">実測気温 / 風（アメダス）</th>
                <th className="px-3 py-2 font-semibold">気象庁 本日の予報</th>
                <th className="px-3 py-2 font-semibold">予想最高/最低</th>
                <th className="px-3 py-2 font-semibold">最大降水確率</th>
                <th className="pl-3 py-2 font-semibold">警報・注意報状態</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--nein-border-subtle)]">
              {overviewRows.map((row) => {
                const isSelected = row.office.officeCode === selectedOfficeCode;
                const visual = describeJmaWeatherCode(row.weatherCode ?? '');
                return (
                  <tr
                    key={row.office.officeCode}
                    onClick={() => handleSelectPrefectureFromOverview(row.office.officeCode)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[var(--nein-accent-soft)]'
                        : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-2.5 pr-3 font-medium text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2">
                        <span>{row.office.name}</span>
                        {isSelected && (
                          <span className="rounded bg-[var(--nein-accent-soft)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--nein-accent-text)]">
                            選択中
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-normal text-slate-500">
                        観測所: {row.office.stationName}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-mono tabular-nums text-slate-800 dark:text-slate-200">
                      <div>
                        {row.amedasTempC !== null ? `${row.amedasTempC.toFixed(1)}℃` : '--'}
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400">
                        {row.amedasWindDir ?? '--'} {row.amedasWindMs !== null ? `${row.amedasWindMs.toFixed(1)}m/s` : ''}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-slate-800 dark:text-slate-200">
                      {row.forecastStatus === 'idle' ? (
                        <span className="text-slate-500">取得待ち...</span>
                      ) : row.forecastStatus === 'error' ? (
                        <span className="text-red-700 dark:text-red-300">取得エラー</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <WeatherIcon kind={visual.kind} className="h-4 w-4 shrink-0" />
                          <span className="max-w-[200px] truncate">{row.weatherText ?? '--'}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-mono tabular-nums">
                      <span className="text-amber-700 dark:text-amber-300 font-semibold">
                        {row.tempMaxC !== null ? `${row.tempMaxC}°` : '--'}
                      </span>
                      <span className="mx-1 text-slate-400 dark:text-slate-600">/</span>
                      <span className="text-sky-700 dark:text-sky-300 font-semibold">
                        {row.tempMinC !== null ? `${row.tempMinC}°` : '--'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono tabular-nums text-sky-700 dark:text-sky-300 font-semibold">
                      {row.popMaxPct !== null ? `${row.popMaxPct}%` : '--'}
                    </td>
                    <td className="pl-3 py-2.5">
                      {row.warningStatus === 'idle' ? (
                        <span className="text-slate-500">確認中...</span>
                      ) : row.warningStatus === 'error' ? (
                        <span className="font-semibold text-red-700 dark:text-red-300">取得失敗（不明）</span>
                      ) : row.warningStatus === 'stale' ? (
                        <span className="font-semibold text-amber-700 dark:text-amber-300">
                          期限切れ
                          {row.specialCount + row.warningCount + row.advisoryCount > 0
                            ? ` (記録:${row.specialCount + row.warningCount + row.advisoryCount})`
                            : ''}
                        </span>
                      ) : row.specialCount > 0 ? (
                        <span className="font-bold text-fuchsia-700 dark:text-fuchsia-300">
                          特別警報 {row.specialCount}件
                        </span>
                      ) : row.warningCount > 0 ? (
                        <span className="font-semibold text-red-700 dark:text-red-300">
                          警報 {row.warningCount}件
                        </span>
                      ) : row.advisoryCount > 0 ? (
                        <span className="text-amber-700 dark:text-amber-300 font-medium">
                          注意報 {row.advisoryCount}件
                        </span>
                      ) : (
                        <span className="text-emerald-700 dark:text-emerald-300 font-medium">発表なし</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 8. Data Sources, Licensing & Non-Replacement Disclaimer */}
      <section
        aria-label="出典・ライセンスおよび免責事項"
        className="rounded-xl border border-[var(--nein-border)] bg-[var(--nein-sub)] p-4 text-xs leading-relaxed text-slate-600 dark:text-slate-400 sm:p-5"
      >
        <h3 className="font-bold text-slate-900 dark:text-slate-200">
          出典・ライセンス・防災情報に関する重要なお知らせ
        </h3>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <strong>気象庁 防災情報JSON（天気予報・警報・注意報・アメダス実測値）</strong>：
            気象庁提供データを加工して利用（気象庁コンテンツ利用規約 / CC BY 4.0 準拠）。
          </li>
          <li>
            <strong>Open-Meteo Weather API</strong>：
            数値気象モデルによる時間別・週間予測値（Creative Commons Attribution 4.0 International / CC BY 4.0）。
          </li>
          <li>
            <strong>P2P地震情報 API (v2)</strong>：
            地震情報・緊急地震速報・津波予報データのリアルタイム配信。
          </li>
        </ul>
        <p className="mt-3 rounded-lg border border-amber-400 bg-amber-50 px-3.5 py-2.5 font-medium text-amber-950 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-200/95">
          {mw.disclaimer} — NEiNおよびNEiN WEATHERが提供する情報は、気象庁・自治体等が発表する公式の防災情報を代替するものではありません。また、通信障害や配信側の仕様変更等により情報が遅延・期限切れとなる場合があります。
        </p>
      </section>
    </div>
  );
}
