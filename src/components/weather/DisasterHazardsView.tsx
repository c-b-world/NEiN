import { AlertTriangle, CloudRain, Info, RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { JmaXmlBulletin } from '../../types/disaster';
import type { AppLanguage } from '../../utils/i18n';
import { getExtendedMessages } from '../../utils/i18nExtended';
import {
  type RadarTimelinesBundle,
  buildGsiTileUrl,
  buildJmaKikikuruTileUrl,
  computeVisibleTiles,
} from '../../utils/jmaTilesApi';
import { formatJstTimestamp } from '../../utils/weatherParser';
import { RawTextDrawer } from '../RawTextDrawer';

interface DisasterHazardsViewProps {
  lang: AppLanguage;
  xmlBulletins: JmaXmlBulletin[];
  timelines: RadarTimelinesBundle | null;
  onRefresh: () => void;
}

type KikikuruLayerType = 'land' | 'inund' | 'flood_mesh';

const ALERT_LEVELS: Array<{
  level: string;
  colorClass: string;
  jmaRef: Record<AppLanguage, string>;
  evacAction: Record<AppLanguage, string>;
}> = [
  {
    level: 'Lv.5',
    colorClass: 'bg-neutral-900 text-white border-neutral-600',
    jmaRef: {
      ja: '特別警報（大雨など）等',
      en: 'Emergency Warning / Disaster Occurring',
      zh: '特别警报（暴雨等）',
      ko: '특별경보(호우 등)',
    },
    evacAction: {
      ja: '緊急安全確保（自治体発令）',
      en: 'Emergency Safety Measures (Municipal Order)',
      zh: '紧急安全确保（自治体发布）',
      ko: '긴급 안전 확보(지자체 발령)',
    },
  },
  {
    level: 'Lv.4',
    colorClass: 'bg-fuchsia-700 text-white border-fuchsia-500',
    jmaRef: {
      ja: '土砂災害警戒情報 / キキクル「極めて危険」',
      en: 'Landslide Alert / Kikikuru Dark Purple',
      zh: '泥石流警戒信息 / Kikikuru「极其危险」',
      ko: '토사재해 경계정보 / 키키쿠루 극도로 위험',
    },
    evacAction: {
      ja: '避難指示（必ず全員避難・自治体発令）',
      en: 'Evacuation Order (Mandatory Evacuation)',
      zh: '避难指示（全员避难・自治体发布）',
      ko: '피난 지시(전원 대피・지자체 발령)',
    },
  },
  {
    level: 'Lv.3',
    colorClass: 'bg-red-600 text-white border-red-400',
    jmaRef: {
      ja: '大雨・洪水警報 / キキクル「警戒」(赤)',
      en: 'Heavy Rain/Flood Warning / Kikikuru Red',
      zh: '暴雨・洪水警报 / Kikikuru「警戒」(红)',
      ko: '호우・홍수 경보 / 키키쿠루 경계(적)',
    },
    evacAction: {
      ja: '高齢者等避難（自治体発令）',
      en: 'Evacuation of the Elderly (Municipal Order)',
      zh: '高龄者等避难（自治体发布）',
      ko: '고령자 등 피난(지자체 발령)',
    },
  },
  {
    level: 'Lv.2',
    colorClass: 'bg-amber-400 text-slate-950 border-amber-500',
    jmaRef: {
      ja: '大雨・洪水注意報 / キキクル「注意」(黄)',
      en: 'Heavy Rain/Flood Advisory / Kikikuru Yellow',
      zh: '暴雨・洪水注意报 / Kikikuru「注意」(黄)',
      ko: '호우・홍수 주의보 / 키키쿠루 주의(황)',
    },
    evacAction: {
      ja: 'ハザードマップ・避難経路の確認',
      en: 'Verify Hazard Maps & Evacuation Routes',
      zh: '确认防灾地图与避难路线',
      ko: '위험 지도 및 대피 경로 확인',
    },
  },
];

export function DisasterHazardsView({
  lang,
  xmlBulletins,
  timelines,
  onRefresh,
}: DisasterHazardsViewProps) {
  const ext = getExtendedMessages(lang);
  const [riskType, setRiskType] = useState<KikikuruLayerType>('land');
  const [renderTick, setRenderTick] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgCacheRef = useRef<Map<string, HTMLImageElement | 'loading' | 'error'>>(new Map());

  const bulletins = xmlBulletins.filter(
    (b) =>
      b.category === 'landslide' ||
      b.category === 'heavy_rain' ||
      b.category === 'flood_river',
  );

  const latestRiskEntry =
    timelines && timelines.kikikuru.length > 0
      ? timelines.kikikuru[timelines.kikikuru.length - 1]
      : null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setRenderTick((t) => t + 1));
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = canvas.clientWidth || 640;
    const height = canvas.clientHeight || 360;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    const tiles = computeVisibleTiles(36.0, 138.2, 5, width, height);
    const loadImg = (url: string): HTMLImageElement | null => {
      const hit = imgCacheRef.current.get(url);
      if (hit === 'loading' || hit === 'error') return null;
      if (hit) return hit;
      imgCacheRef.current.set(url, 'loading');
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imgCacheRef.current.set(url, img);
        setRenderTick((t) => t + 1);
      };
      img.onerror = () => {
        imgCacheRef.current.set(url, 'error');
      };
      img.src = url;
      return null;
    };

    for (const tile of tiles) {
      const base = loadImg(buildGsiTileUrl('gsi_pale', tile.z, tile.x, tile.y));
      if (base) ctx.drawImage(base, tile.screenX, tile.screenY, 256, 256);
      if (latestRiskEntry) {
        const riskUrl = buildJmaKikikuruTileUrl(latestRiskEntry, riskType, tile.z, tile.x, tile.y);
        if (riskUrl) {
          const riskImg = loadImg(riskUrl);
          if (riskImg) {
            ctx.save();
            ctx.globalAlpha = 0.78;
            ctx.drawImage(riskImg, tile.screenX, tile.screenY, 256, 256);
            ctx.restore();
          }
        }
      }
    }
    ctx.restore();
  }, [latestRiskEntry, renderTick, riskType]);

  return (
    <div className="flex flex-col gap-5">
      {/* Header + Kikikuru Live Risk Map */}
      <section
        aria-label={ext.hazards.title}
        className="rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)] p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--nein-border-subtle)] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <CloudRain className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                {ext.hazards.title}
              </h1>
            </div>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
              {ext.hazards.subtitle}
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

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {ext.hazards.kikikuruHeading}
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ['land', ext.hazards.kikikuruLand],
                ['inund', ext.hazards.kikikuruInund],
                ['flood_mesh', ext.hazards.kikikuruFlood],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setRiskType(k)}
                className={`rounded border px-3 py-1 text-xs font-semibold cursor-pointer ${
                  riskType === k
                    ? 'border-[var(--nein-accent)] bg-[var(--nein-accent)] text-[var(--nein-accent-contrast)]'
                    : 'border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-700 dark:text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mt-3 h-[340px] w-full overflow-hidden rounded-lg border border-[var(--nein-border)] bg-slate-900">
          <canvas ref={canvasRef} className="h-full w-full" />
          <div className="absolute bottom-2 left-2 rounded bg-slate-950/85 px-2.5 py-1 font-mono text-xs text-slate-100">
            {latestRiskEntry?.labelJst ?? ext.common.loading}
          </div>
        </div>

        {/* Alert Levels 1-5 & Distinction Warning */}
        <div className="mt-4 rounded-lg border border-amber-400/70 bg-amber-50/70 p-3.5 text-xs text-amber-950 dark:border-amber-600/60 dark:bg-amber-950/35 dark:text-amber-100">
          <div className="flex items-start gap-2 font-bold">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            <span>{ext.hazards.evacuationVsWeatherNote}</span>
          </div>
        </div>

        <h3 className="mt-4 text-xs font-bold text-slate-900 dark:text-slate-100">
          {ext.hazards.alertLevelsTitle}
        </h3>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {ALERT_LEVELS.map((row) => (
            <div
              key={row.level}
              className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-2.5 text-xs"
            >
              <span className={`inline-block rounded border px-2 py-0.5 font-mono text-[11px] font-bold ${row.colorClass}`}>
                {row.level}
              </span>
              <div className="mt-1.5 font-semibold text-slate-900 dark:text-slate-100">
                {row.evacAction[lang]}
              </div>
              <div className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                {row.jmaRef[lang]}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Honest Unsupported Banner for MLIT Live River Gauges & Dam Levels */}
      <section
        aria-label={ext.hazards.mlitUnsupportedTitle}
        className="rounded-xl border border-amber-500/60 bg-amber-500/10 p-4 text-xs"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {ext.hazards.mlitUnsupportedTitle}
                </span>
                <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-slate-950">
                  {ext.statusLabels.unsupported}
                </span>
              </div>
              <p className="mt-1 text-slate-700 dark:text-slate-300">
                {ext.hazards.mlitUnsupportedDesc}
              </p>
            </div>
          </div>
          <a
            href="https://www.river.go.jp/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] px-3 py-1.5 font-semibold text-[var(--nein-accent-text)] hover:underline whitespace-nowrap"
          >
            {ext.common.openOfficialSite}
          </a>
        </div>
      </section>

      {/* Active JMAXML Landslide / Record Rain / Flood Bulletins */}
      <section
        aria-label={ext.hazards.bulletinsHeading}
        className="rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)] p-4 sm:p-5"
      >
        <h2 className="border-b border-[var(--nein-border-subtle)] pb-2.5 text-sm font-bold text-slate-900 dark:text-slate-100">
          {ext.hazards.bulletinsHeading} ({bulletins.length})
        </h2>

        {bulletins.length === 0 ? (
          <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">
            {ext.hazards.noActiveBulletins}
          </p>
        ) : (
          <div className="mt-3 space-y-2.5">
            {bulletins.map((b) => (
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
