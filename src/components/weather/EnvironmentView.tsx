import { Info, RefreshCw, Sun, ThermometerSun } from 'lucide-react';
import { JAPAN_WEATHER_OFFICES } from '../../data/japanWeatherRegions';
import type { JmaXmlBulletin, OpenMeteoAirQualityData } from '../../types/disaster';
import type { AppLanguage } from '../../utils/i18n';
import { getExtendedMessages } from '../../utils/i18nExtended';
import { formatJstTimestamp } from '../../utils/weatherParser';
import { RawTextDrawer } from '../RawTextDrawer';

interface EnvironmentViewProps {
  lang: AppLanguage;
  airQuality: OpenMeteoAirQualityData | null;
  xmlBulletins: JmaXmlBulletin[];
  activeOfficeCode: string;
  onSelectOfficeCode: (code: string) => void;
  onRefresh: () => void;
}

export function EnvironmentView({
  lang,
  airQuality,
  xmlBulletins,
  activeOfficeCode,
  onSelectOfficeCode,
  onRefresh,
}: EnvironmentViewProps) {
  const ext = getExtendedMessages(lang);
  const infoBulletins = xmlBulletins.filter(
    (b) =>
      b.category === 'early_warning' ||
      b.category === 'general_weather' ||
      b.category === 'seasonal' ||
      b.category === 'tornado' ||
      b.category === 'environment',
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Open-Meteo Air Quality, Dust & UV */}
      <section
        aria-label={ext.environment.title}
        className="rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)] p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--nein-border-subtle)] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-amber-500" aria-hidden="true" />
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                {ext.environment.title}
              </h1>
              <span className="rounded border border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--nein-accent-text)]">
                {ext.common.modelRefBadge}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
              {ext.environment.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Select region for air quality and UV"
              value={activeOfficeCode}
              onChange={(e) => onSelectOfficeCode(e.target.value)}
              className="rounded-md border border-[var(--nein-border)] bg-[var(--nein-sub)] px-2.5 py-1.5 text-xs font-medium text-slate-900 dark:text-slate-100 cursor-pointer"
            >
              {JAPAN_WEATHER_OFFICES.map((o) => (
                <option key={o.officeCode} value={o.officeCode}>
                  {o.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-1 rounded-md border border-[var(--nein-border)] bg-[var(--nein-sub)] px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-[var(--nein-accent-border)] dark:text-slate-200 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{ext.common.refresh}</span>
            </button>
          </div>
        </div>

        {airQuality?.isError ? (
          <div className="mt-3 rounded-lg border border-red-400/70 bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300">
            {airQuality.errorMessage}
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-3">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {ext.environment.uvLabel}
              </div>
              <div className="mt-1 font-mono text-xl font-bold text-slate-900 dark:text-slate-100">
                {airQuality?.uvIndex !== null && airQuality?.uvIndex !== undefined
                  ? airQuality.uvIndex.toFixed(1)
                  : '--'}
              </div>
            </div>
            <div className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-3">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {ext.environment.pm25Label}
              </div>
              <div className="mt-1 font-mono text-xl font-bold text-slate-900 dark:text-slate-100">
                {airQuality?.pm25 !== null && airQuality?.pm25 !== undefined
                  ? `${airQuality.pm25.toFixed(1)} µg/m³`
                  : '--'}
              </div>
            </div>
            <div className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-3">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {ext.environment.pm10Label}
              </div>
              <div className="mt-1 font-mono text-xl font-bold text-slate-900 dark:text-slate-100">
                {airQuality?.pm10 !== null && airQuality?.pm10 !== undefined
                  ? `${airQuality.pm10.toFixed(1)} µg/m³`
                  : '--'}
              </div>
            </div>
            <div className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-3">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {ext.environment.dustLabel}
              </div>
              <div className="mt-1 font-mono text-xl font-bold text-slate-900 dark:text-slate-100">
                {airQuality?.dust !== null && airQuality?.dust !== undefined
                  ? `${airQuality.dust.toFixed(1)} µg/m³`
                  : '--'}
              </div>
            </div>
            <div className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-3">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {ext.environment.aqiLabel}
              </div>
              <div className="mt-1 font-mono text-xl font-bold text-slate-900 dark:text-slate-100">
                {airQuality?.europeanAqi !== null && airQuality?.europeanAqi !== undefined
                  ? Math.round(airQuality.europeanAqi)
                  : '--'}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Honest Unsupported Banner for MOE WBGT CSV */}
      <section
        aria-label={ext.environment.moeUnsupportedTitle}
        className="rounded-xl border border-amber-500/60 bg-amber-500/10 p-4 text-xs"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {ext.environment.moeUnsupportedTitle}
                </span>
                <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-slate-950">
                  {ext.statusLabels.unsupported}
                </span>
              </div>
              <p className="mt-1 text-slate-700 dark:text-slate-300">
                {ext.environment.moeUnsupportedDesc}
              </p>
            </div>
          </div>
          <a
            href="https://www.wbgt.env.go.jp/alert.php"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] px-3 py-1.5 font-semibold text-[var(--nein-accent-text)] hover:underline whitespace-nowrap"
          >
            {ext.common.openOfficialSite}
          </a>
        </div>
      </section>

      {/* Early Warning / General Weather / Seasonal / Tornado Bulletins */}
      <section
        aria-label={ext.environment.weatherBulletinsHeading}
        className="rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)] p-4 sm:p-5"
      >
        <div className="flex items-center gap-2 border-b border-[var(--nein-border-subtle)] pb-2.5">
          <ThermometerSun className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {ext.environment.weatherBulletinsHeading} ({infoBulletins.length})
          </h2>
        </div>

        {infoBulletins.length === 0 ? (
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{ext.common.noData}</p>
        ) : (
          <div className="mt-3 space-y-2.5">
            {infoBulletins.slice(0, 30).map((b) => (
              <div
                key={b.id}
                className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {b.title}
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">
                    {b.updatedAt ? formatJstTimestamp(b.updatedAt) : '--'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">{b.headline}</p>
                <RawTextDrawer lang={lang} rawText={`${b.title}\n${b.headline}`} officialUrl={b.link} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
