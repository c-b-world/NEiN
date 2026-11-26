import { Anchor, Compass, RefreshCw, Waves, Wind } from 'lucide-react';
import { JAPAN_WEATHER_OFFICES } from '../../data/japanWeatherRegions';
import type {
  JmaXmlBulletin,
  OpenMeteoMarineData,
  TyphoonActiveInfo,
} from '../../types/disaster';
import type { AppLanguage } from '../../utils/i18n';
import { getExtendedMessages } from '../../utils/i18nExtended';
import { formatJstTimestamp } from '../../utils/weatherParser';
import { RawTextDrawer } from '../RawTextDrawer';

interface TyphoonMarineViewProps {
  lang: AppLanguage;
  typhoons: TyphoonActiveInfo[];
  marine: OpenMeteoMarineData | null;
  xmlBulletins: JmaXmlBulletin[];
  activeOfficeCode: string;
  onSelectOfficeCode: (code: string) => void;
  onRefresh: () => void;
}

export function TyphoonMarineView({
  lang,
  typhoons,
  marine,
  xmlBulletins,
  activeOfficeCode,
  onSelectOfficeCode,
  onRefresh,
}: TyphoonMarineViewProps) {
  const ext = getExtendedMessages(lang);
  const seaBulletins = xmlBulletins.filter((b) => b.category === 'marine').slice(0, 15);

  return (
    <div className="flex flex-col gap-5">
      {/* Typhoons & Tropical Cyclones */}
      <section
        aria-label={ext.typhoon.title}
        className="rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)] p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--nein-border-subtle)] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Wind className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                {ext.typhoon.title}
              </h1>
            </div>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
              {ext.typhoon.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1 rounded-md border border-[var(--nein-border)] bg-[var(--nein-sub)] px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-[var(--nein-accent-border)] dark:text-slate-200 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{ext.common.refresh}</span>
          </button>
        </div>

        <div className="mt-3 rounded-lg border border-amber-400/60 bg-amber-50/70 px-3.5 py-2.5 text-xs text-amber-950 dark:border-amber-600/50 dark:bg-amber-950/35 dark:text-amber-100">
          {ext.typhoon.forecastCircleDisclaimer}
        </div>

        <h2 className="mt-4 text-sm font-bold text-slate-900 dark:text-slate-100">
          {ext.typhoon.activeListHeading} ({typhoons.length})
        </h2>

        {typhoons.length === 0 ? (
          <div className="mt-3 rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-4 text-xs text-slate-700 dark:text-slate-300">
            <div className="font-bold text-slate-900 dark:text-slate-100">
              {ext.typhoon.noActiveTitle}
            </div>
            <p className="mt-1">{ext.typhoon.noActiveDesc}</p>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            {typhoons.map((ty) => (
              <div
                key={ty.id}
                className="flex flex-col justify-between rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-4"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded bg-[var(--nein-accent-soft)] px-2 py-0.5 font-mono text-xs font-bold text-[var(--nein-accent-text)]">
                      {ext.typhoon.typhoonNumber} #{ty.typhoonNumber}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {ty.reportDatetime ? formatJstTimestamp(ty.reportDatetime) : '--'}
                    </span>
                  </div>

                  <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                    {lang === 'en' ? ty.nameEn : ty.nameJp}
                  </h3>
                  <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">{ty.headTitle}</p>

                  {ty.isExpired && (
                    <div className="mt-2 rounded border border-amber-500/60 bg-amber-500/15 px-2.5 py-1 text-[11px] font-medium text-amber-900 dark:text-amber-200">
                      {ext.typhoon.expiredNotice}
                    </div>
                  )}

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded border border-[var(--nein-border-subtle)] bg-[var(--nein-surface)] p-2">
                      <div className="text-[10px] text-slate-500">{ext.typhoon.pressure}</div>
                      <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {ty.centralPressureHpa !== null ? `${ty.centralPressureHpa} hPa` : '--'}
                      </div>
                    </div>
                    <div className="rounded border border-[var(--nein-border-subtle)] bg-[var(--nein-surface)] p-2">
                      <div className="text-[10px] text-slate-500">{ext.typhoon.maxWind}</div>
                      <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {ty.maxWindMs !== null ? `${ty.maxWindMs} m/s` : '--'}
                      </div>
                    </div>
                  </div>
                </div>

                <RawTextDrawer
                  lang={lang}
                  rawText={`${ty.nameJp} (${ty.infoType})\n${ty.headTitle}\n${ty.reportDatetime}`}
                  officialUrl={ty.rawXmlLink || 'https://www.jma.go.jp/bosai/map.html#contents=typhoon'}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Open-Meteo Marine & Sea Surface Telemetry */}
      <section
        aria-label={ext.typhoon.marineHeading}
        className="rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)] p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--nein-border-subtle)] pb-3">
          <div className="flex items-center gap-2">
            <Waves className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {ext.typhoon.marineHeading}
            </h2>
            <span className="rounded border border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--nein-accent-text)]">
              {ext.common.modelRefBadge}
            </span>
          </div>

          <select
            aria-label="Select coastal reference point"
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
        </div>

        {marine?.isError ? (
          <div className="mt-3 rounded-lg border border-red-400/70 bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300">
            {marine.errorMessage}
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-3">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">{ext.typhoon.waveHeight}</div>
              <div className="mt-1 font-mono text-xl font-bold text-slate-900 dark:text-slate-100">
                {marine?.waveHeightM !== null && marine?.waveHeightM !== undefined
                  ? `${marine.waveHeightM.toFixed(2)} m`
                  : '--'}
              </div>
            </div>
            <div className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-3">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">{ext.typhoon.wavePeriod}</div>
              <div className="mt-1 font-mono text-xl font-bold text-slate-900 dark:text-slate-100">
                {marine?.wavePeriodSec !== null && marine?.wavePeriodSec !== undefined
                  ? `${marine.wavePeriodSec.toFixed(1)} s`
                  : '--'}
              </div>
            </div>
            <div className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-3">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">{ext.typhoon.waveDirection}</div>
              <div className="mt-1 flex items-center gap-1 font-mono text-xl font-bold text-slate-900 dark:text-slate-100">
                <Compass className="h-4 w-4 text-slate-500" aria-hidden="true" />
                {marine?.waveDirectionDeg !== null && marine?.waveDirectionDeg !== undefined
                  ? `${Math.round(marine.waveDirectionDeg)}°`
                  : '--'}
              </div>
            </div>
            <div className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-3">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">{ext.typhoon.seaSurfaceTemp}</div>
              <div className="mt-1 font-mono text-xl font-bold text-slate-900 dark:text-slate-100">
                {marine?.seaSurfaceTempC !== null && marine?.seaSurfaceTempC !== undefined
                  ? `${marine.seaSurfaceTempC.toFixed(1)} ℃`
                  : '--'}
              </div>
            </div>
            <div className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-3">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">{ext.typhoon.oceanCurrent}</div>
              <div className="mt-1 font-mono text-xl font-bold text-slate-900 dark:text-slate-100">
                {marine?.oceanCurrentVelocityMs !== null && marine?.oceanCurrentVelocityMs !== undefined
                  ? `${marine.oceanCurrentVelocityMs.toFixed(2)} m/s`
                  : '--'}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* JMA Marine Warnings & Forecasts (JMAXML) */}
      <section
        aria-label={ext.typhoon.seaBulletinsHeading}
        className="rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)] p-4 sm:p-5"
      >
        <div className="flex items-center gap-2 border-b border-[var(--nein-border-subtle)] pb-3">
          <Anchor className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {ext.typhoon.seaBulletinsHeading} ({seaBulletins.length})
          </h2>
        </div>

        {seaBulletins.length === 0 ? (
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{ext.common.noData}</p>
        ) : (
          <div className="mt-3 space-y-2.5">
            {seaBulletins.map((b) => (
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
