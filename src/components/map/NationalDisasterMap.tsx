import {
  Compass,
  Layers,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  AmedasStationPoint,
  EvacuationShelterFeature,
  IntegratedMapConfig,
  JmaQuakeSummaryItem,
  JmaTsunamiSummaryItem,
  MapLayerId,
  TyphoonActiveInfo,
  VolcanoLocationEntry,
} from '../../types/disaster';
import type { P2PQuakeRecord } from '../../types/quake';
import type { AppLanguage } from '../../utils/i18n';
import { getExtendedMessages } from '../../utils/i18nExtended';
import {
  type RadarTimelinesBundle,
  buildGsiFloodHazardTileUrl,
  buildGsiTileUrl,
  buildHimawariTileUrl,
  buildJmaKikikuruTileUrl,
  buildJmaNowcTileUrl,
  buildJmaRasrfTileUrl,
  computeVisibleTiles,
  fetchNearbyEvacuationShelters,
  latToWorldY,
  lonToWorldX,
} from '../../utils/jmaTilesApi';
import { setSourceStatus } from '../../utils/sourceHealthTracker';

interface NationalDisasterMapProps {
  lang: AppLanguage;
  config: IntegratedMapConfig;
  onChangeConfig: (next: IntegratedMapConfig) => void;
  onResetConfig: () => void;
  p2pRecords: P2PQuakeRecord[];
  jmaQuakes: JmaQuakeSummaryItem[];
  jmaTsunamis: JmaTsunamiSummaryItem[];
  volcanoes: VolcanoLocationEntry[];
  typhoons: TyphoonActiveInfo[];
  amedasPoints: AmedasStationPoint[];
  onRequestAmedas: () => void;
  radarTimelines: RadarTimelinesBundle | null;
}

const REGION_PRESETS: Array<{ id: string; label: Record<AppLanguage, string>; lat: number; lon: number; zoom: number }> = [
  { id: 'all', label: { ja: '日本全国', en: 'Nationwide', zh: '日本全国', ko: '일본 전국' }, lat: 36.2, lon: 138.2, zoom: 5 },
  { id: 'hokkaido', label: { ja: '北海道', en: 'Hokkaido', zh: '北海道', ko: '홋카이도' }, lat: 43.2, lon: 142.5, zoom: 6 },
  { id: 'tohoku', label: { ja: '東北', en: 'Tohoku', zh: '东北', ko: '도호쿠' }, lat: 39.2, lon: 140.8, zoom: 7 },
  { id: 'kanto', label: { ja: '関東', en: 'Kanto', zh: '关东', ko: '간토' }, lat: 35.69, lon: 139.69, zoom: 8 },
  { id: 'chubu', label: { ja: '中部', en: 'Chubu', zh: '中部', ko: '주부' }, lat: 36.0, lon: 137.4, zoom: 7 },
  { id: 'kinki', label: { ja: '近畿', en: 'Kinki', zh: '近畿', ko: '긴키' }, lat: 34.7, lon: 135.5, zoom: 8 },
  { id: 'kyushu', label: { ja: '九州', en: 'Kyushu', zh: '九州', ko: '규슈' }, lat: 32.6, lon: 130.8, zoom: 7 },
  { id: 'okinawa', label: { ja: '沖縄', en: 'Okinawa', zh: '冲绳', ko: '오키나와' }, lat: 26.2, lon: 127.7, zoom: 8 },
];

const LAYER_ORDER: MapLayerId[] = [
  'quake_epicenters',
  'tsunami_areas',
  'rain_radar',
  'precip_forecast',
  'lightning_nowcast',
  'tornado_nowcast',
  'himawari_sat',
  'kikikuru_landslide',
  'kikikuru_inundation',
  'kikikuru_flood',
  'gsi_flood_hazard',
  'typhoon_track',
  'volcanoes',
  'amedas_stations',
  'evacuation_shelters',
];

export function NationalDisasterMap({
  lang,
  config,
  onChangeConfig,
  onResetConfig,
  p2pRecords,
  jmaQuakes,
  jmaTsunamis,
  volcanoes,
  typhoons,
  amedasPoints,
  onRequestAmedas,
  radarTimelines,
}: NationalDisasterMapProps) {
  const ext = getExtendedMessages(lang);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tileImgCacheRef = useRef<Map<string, HTMLImageElement | 'loading' | 'error'>>(new Map());
  const dragRef = useRef<{ active: boolean; startX: number; startY: number; lat: number; lon: number }>({
    active: false,
    startX: 0,
    startY: 0,
    lat: config.centerLat,
    lon: config.centerLon,
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [renderTick, setRenderTick] = useState(0);
  const [shelters, setShelters] = useState<EvacuationShelterFeature[]>([]);

  const activeTimeline = useMemo(() => {
    if (!radarTimelines) return [];
    if (config.enabledLayers.rain_radar && radarTimelines.hrpns.length > 0) return radarTimelines.hrpns;
    if (config.enabledLayers.precip_forecast && radarTimelines.rasrf.length > 0) return radarTimelines.rasrf;
    if (
      (config.enabledLayers.kikikuru_landslide ||
        config.enabledLayers.kikikuru_inundation ||
        config.enabledLayers.kikikuru_flood) &&
      radarTimelines.kikikuru.length > 0
    ) {
      return radarTimelines.kikikuru;
    }
    if (config.enabledLayers.himawari_sat && radarTimelines.himawari.length > 0) {
      return radarTimelines.himawari;
    }
    return radarTimelines.hrpns;
  }, [config.enabledLayers, radarTimelines]);

  useEffect(() => {
    if (activeTimeline.length > 0) {
      setFrameIndex(activeTimeline.length - 1);
    }
  }, [activeTimeline.length]);

  useEffect(() => {
    if (!isPlaying || activeTimeline.length <= 1) return;
    const id = window.setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % activeTimeline.length);
    }, 850);
    return () => window.clearInterval(id);
  }, [isPlaying, activeTimeline.length]);

  useEffect(() => {
    if (config.enabledLayers.amedas_stations && amedasPoints.length === 0) {
      onRequestAmedas();
    }
  }, [amedasPoints.length, config.enabledLayers.amedas_stations, onRequestAmedas]);

  useEffect(() => {
    if (!config.enabledLayers.evacuation_shelters || config.zoom < 11) {
      return;
    }
    let cancelled = false;
    void fetchNearbyEvacuationShelters(config.centerLat, config.centerLon).then((list) => {
      if (!cancelled) setShelters(list);
    });
    return () => {
      cancelled = true;
    };
  }, [config.centerLat, config.centerLon, config.enabledLayers.evacuation_shelters, config.zoom]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen?.().catch(() => {});
    } else {
      await document.exitFullscreen?.().catch(() => {});
    }
  };

  const getTileImage = useCallback((url: string): HTMLImageElement | null => {
    const cache = tileImgCacheRef.current;
    const hit = cache.get(url);
    if (hit === 'loading' || hit === 'error') return null;
    if (hit) return hit;

    cache.set(url, 'loading');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      cache.set(url, img);
      setSourceStatus('gsi_tiles_shelters', 'normal');
      setRenderTick((t) => t + 1);
    };
    img.onerror = () => {
      cache.set(url, 'error');
    };
    img.src = url;
    return null;
  }, []);

  const currentFrameEntry = activeTimeline[frameIndex] ?? null;

  // Render Slippy Tiles + Vector Hazard Overlays onto Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = canvas.clientWidth || 780;
    const height = canvas.clientHeight || 500;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    const z = Math.max(4, Math.min(15, Math.round(config.zoom)));
    const tiles = computeVisibleTiles(config.centerLat, config.centerLon, z, width, height);

    // 1. GSI Base Map
    for (const tile of tiles) {
      const url = buildGsiTileUrl(config.baseStyle, tile.z, tile.x, tile.y);
      const img = getTileImage(url);
      if (img) {
        ctx.drawImage(img, tile.screenX, tile.screenY, 256, 256);
      } else {
        ctx.fillStyle = config.baseStyle === 'gsi_pale' ? '#cbd5e1' : '#1e293b';
        ctx.fillRect(tile.screenX, tile.screenY, 256, 256);
        ctx.strokeStyle = 'rgba(148,163,184,0.2)';
        ctx.strokeRect(tile.screenX, tile.screenY, 256, 256);
      }
    }

    // 2. Raster Overlays (GSI Flood, Himawari, Rain Radar, Forecast, Lightning, Tornado, Kikikuru)
    const drawRasterLayer = (
      layerId: MapLayerId,
      urlForTile: (tile: { x: number; y: number; z: number }) => string | null,
    ) => {
      if (!config.enabledLayers[layerId]) return;
      ctx.save();
      ctx.globalAlpha = config.layerOpacity[layerId] ?? 0.7;
      for (const tile of tiles) {
        const u = urlForTile(tile);
        if (!u) continue;
        const img = getTileImage(u);
        if (img) ctx.drawImage(img, tile.screenX, tile.screenY, 256, 256);
      }
      ctx.restore();
    };

    drawRasterLayer('gsi_flood_hazard', (t) => buildGsiFloodHazardTileUrl(t.z, t.x, t.y));

    if (radarTimelines) {
      const hrpnsEntry =
        radarTimelines.hrpns[Math.min(frameIndex, Math.max(0, radarTimelines.hrpns.length - 1))] ??
        radarTimelines.hrpns[radarTimelines.hrpns.length - 1];
      const rasrfEntry =
        radarTimelines.rasrf[Math.min(frameIndex, Math.max(0, radarTimelines.rasrf.length - 1))] ??
        radarTimelines.rasrf[0];
      const ltEntry = radarTimelines.lightningTornado[radarTimelines.lightningTornado.length - 1];
      const riskEntry =
        radarTimelines.kikikuru[Math.min(frameIndex, Math.max(0, radarTimelines.kikikuru.length - 1))] ??
        radarTimelines.kikikuru[radarTimelines.kikikuru.length - 1];
      const satEntry =
        radarTimelines.himawari[Math.min(frameIndex, Math.max(0, radarTimelines.himawari.length - 1))] ??
        radarTimelines.himawari[radarTimelines.himawari.length - 1];

      if (satEntry && config.enabledLayers.himawari_sat) {
        drawRasterLayer('himawari_sat', (t) => buildHimawariTileUrl(satEntry, 'B13', t.z, t.x, t.y));
      }
      if (hrpnsEntry) {
        drawRasterLayer('rain_radar', (t) => buildJmaNowcTileUrl(hrpnsEntry, 'hrpns', t.z, t.x, t.y));
      }
      if (rasrfEntry) {
        drawRasterLayer('precip_forecast', (t) => buildJmaRasrfTileUrl(rasrfEntry, t.z, t.x, t.y));
      }
      if (ltEntry) {
        drawRasterLayer('lightning_nowcast', (t) => buildJmaNowcTileUrl(ltEntry, 'thns', t.z, t.x, t.y));
        drawRasterLayer('tornado_nowcast', (t) => buildJmaNowcTileUrl(ltEntry, 'trns', t.z, t.x, t.y));
      }
      if (riskEntry) {
        drawRasterLayer('kikikuru_landslide', (t) => buildJmaKikikuruTileUrl(riskEntry, 'land', t.z, t.x, t.y));
        drawRasterLayer('kikikuru_inundation', (t) => buildJmaKikikuruTileUrl(riskEntry, 'inund', t.z, t.x, t.y));
        drawRasterLayer('kikikuru_flood', (t) => buildJmaKikikuruTileUrl(riskEntry, 'flood_mesh', t.z, t.x, t.y));
      }
    }

    const cxWorld = lonToWorldX(config.centerLon, z);
    const cyWorld = latToWorldY(config.centerLat, z);
    const project = (lat: number, lon: number) => ({
      x: lonToWorldX(lon, z) - cxWorld + width / 2,
      y: latToWorldY(lat, z) - cyWorld + height / 2,
    });

    // 3. Tsunami Coastal Areas Overlay
    if (config.enabledLayers.tsunami_areas) {
      for (const ts of jmaTsunamis.slice(0, 2)) {
        for (const area of ts.areas) {
          if (area.lat === null || area.lon === null) continue;
          const pt = project(area.lat, area.lon);
          const color =
            area.severity === 'major_warning'
              ? '#c026d3'
              : area.severity === 'warning'
              ? '#dc2626'
              : area.severity === 'watch'
              ? '#f59e0b'
              : area.severity === 'lifted'
              ? '#64748b'
              : '#0284c7';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 7, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();
        }
      }
    }

    // 4. Volcanoes Layer (120 JMA Volcanoes)
    if (config.enabledLayers.volcanoes) {
      const placedBoxes: Array<{ x: number; y: number; w: number; h: number }> = [];
      const sortedVolcanoes = [...volcanoes].sort(
        (a, b) => (b.alertLevelNum ?? 0) - (a.alertLevelNum ?? 0),
      );
      for (const v of sortedVolcanoes) {
        const pt = project(v.lat, v.lon);
        if (pt.x < -10 || pt.x > width + 10 || pt.y < -10 || pt.y > height + 10) continue;
        const isAlert = (v.alertLevelNum ?? 0) >= 2;
        ctx.beginPath();
        ctx.moveTo(pt.x, pt.y - (isAlert ? 8 : 5));
        ctx.lineTo(pt.x - (isAlert ? 7 : 4.5), pt.y + (isAlert ? 6 : 4));
        ctx.lineTo(pt.x + (isAlert ? 7 : 4.5), pt.y + (isAlert ? 6 : 4));
        ctx.closePath();
        ctx.fillStyle = isAlert ? '#ef4444' : '#f97316';
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1;
        ctx.stroke();
        if (z >= 8 || isAlert) {
          const label = lang === 'en' ? v.nameEn : v.nameJp;
          ctx.font = '600 10px sans-serif';
          const textW = ctx.measureText(label).width + 6;
          const box = { x: pt.x + 6, y: pt.y - 8, w: textW, h: 14 };
          const collides = placedBoxes.some(
            (b) =>
              box.x < b.x + b.w &&
              box.x + box.w > b.x &&
              box.y < b.y + b.h &&
              box.y + box.h > b.y,
          );
          if (!collides || z >= 10) {
            placedBoxes.push(box);
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = 'rgba(15,23,42,0.88)';
            ctx.lineWidth = 3;
            ctx.strokeText(label, pt.x + 8, pt.y + 3);
            ctx.fillText(label, pt.x + 8, pt.y + 3);
          }
        }
      }
    }

    // 5. AMeDAS Observations
    if (config.enabledLayers.amedas_stations && amedasPoints.length > 0) {
      const step = z <= 6 ? 6 : z <= 8 ? 2 : 1;
      for (let i = 0; i < amedasPoints.length; i += step) {
        const st = amedasPoints[i];
        if (st.tempC === null) continue;
        const pt = project(st.lat, st.lon);
        if (pt.x < 0 || pt.x > width || pt.y < 0 || pt.y > height) continue;
        ctx.fillStyle =
          st.tempC >= 30 ? '#ef4444' : st.tempC >= 20 ? '#f59e0b' : st.tempC >= 10 ? '#10b981' : '#38bdf8';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        if (z >= 8) {
          ctx.font = 'bold 10px monospace';
          ctx.fillStyle = '#0f172a';
          ctx.fillText(`${st.tempC.toFixed(0)}°`, pt.x + 5, pt.y + 3);
        }
      }
    }

    // 6. GSI Evacuation Shelters (zoom >= 11)
    if (config.enabledLayers.evacuation_shelters && z >= 11) {
      for (const sh of shelters.slice(0, 120)) {
        const pt = project(sh.lat, sh.lon);
        if (pt.x < 0 || pt.x > width || pt.y < 0 || pt.y > height) continue;
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(pt.x - 4, pt.y - 4, 8, 8);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(pt.x - 4, pt.y - 4, 8, 8);
      }
    }

    // 7. Quake Epicenters (P2P + JMA)
    if (config.enabledLayers.quake_epicenters) {
      const epicenters: Array<{ lat: number; lon: number; label: string; isMajor: boolean }> = [];
      for (const r of p2pRecords.slice(0, 18)) {
        if (r.code === 551 && r.earthquake.hypocenter.latitude > -90 && r.earthquake.hypocenter.longitude > -180) {
          epicenters.push({
            lat: r.earthquake.hypocenter.latitude,
            lon: r.earthquake.hypocenter.longitude,
            label: `${r.earthquake.hypocenter.name} M${r.earthquake.hypocenter.magnitude > 0 ? r.earthquake.hypocenter.magnitude.toFixed(1) : '--'}`,
            isMajor: r.earthquake.maxScale >= 45,
          });
        }
      }
      for (const jq of jmaQuakes.slice(0, 12)) {
        if (jq.latitude !== null && jq.longitude !== null) {
          epicenters.push({
            lat: jq.latitude,
            lon: jq.longitude,
            label: jq.epicenter,
            isMajor: jq.maxIntensity.includes('5') || jq.maxIntensity.includes('6') || jq.maxIntensity.includes('7'),
          });
        }
      }
      for (const ep of epicenters) {
        const pt = project(ep.lat, ep.lon);
        if (pt.x < -12 || pt.x > width + 12 || pt.y < -12 || pt.y > height + 12) continue;
        const size = ep.isMajor ? 7 : 5;
        ctx.strokeStyle = ep.isMajor ? '#ef4444' : '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(pt.x - size, pt.y - size);
        ctx.lineTo(pt.x + size, pt.y + size);
        ctx.moveTo(pt.x + size, pt.y - size);
        ctx.lineTo(pt.x - size, pt.y + size);
        ctx.stroke();
      }
    }

    // 8. Typhoon Centers if coordinates exist
    if (config.enabledLayers.typhoon_track) {
      for (const ty of typhoons) {
        if (ty.currentLat !== null && ty.currentLon !== null) {
          const pt = project(ty.currentLat, ty.currentLon);
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 12, 0, Math.PI * 2);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }

    ctx.restore();
  }, [
    amedasPoints,
    config,
    frameIndex,
    getTileImage,
    jmaQuakes,
    jmaTsunamis,
    lang,
    p2pRecords,
    radarTimelines,
    renderTick,
    shelters,
    typhoons,
    volcanoes,
  ]);

  const panByPixels = (dx: number, dy: number) => {
    const z = Math.max(4, Math.min(15, Math.round(config.zoom)));
    const cx = lonToWorldX(config.centerLon, z) - dx;
    const cy = latToWorldY(config.centerLat, z) - dy;
    const n = 2 ** z;
    const lon = (cx / (n * 256)) * 360 - 180;
    const mercN = Math.PI - (2 * Math.PI * cy) / (n * 256);
    const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(mercN) - Math.exp(-mercN)));
    onChangeConfig({
      ...config,
      centerLat: Math.max(-75, Math.min(75, lat)),
      centerLon: Math.max(100, Math.min(175, lon)),
    });
  };

  const toggleLayer = (id: MapLayerId) => {
    onChangeConfig({
      ...config,
      enabledLayers: {
        ...config.enabledLayers,
        [id]: !config.enabledLayers[id],
      },
    });
  };

  return (
    <section
      ref={containerRef}
      aria-label={ext.map.title}
      className="flex flex-col gap-4 rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)] p-4 sm:p-5"
    >
      {/* Header + Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--nein-border-subtle)] pb-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50">{ext.map.title}</h1>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">{ext.map.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label={ext.map.baseStyleLabel}
            value={config.baseStyle}
            onChange={(e) =>
              onChangeConfig({
                ...config,
                baseStyle: e.target.value as 'gsi_std' | 'gsi_pale',
              })
            }
            className="rounded-md border border-[var(--nein-border)] bg-[var(--nein-sub)] px-2.5 py-1.5 text-xs font-medium text-slate-900 dark:text-slate-100 cursor-pointer"
          >
            <option value="gsi_std">{ext.map.baseStd}</option>
            <option value="gsi_pale">{ext.map.basePale}</option>
          </select>

          <button
            type="button"
            onClick={onResetConfig}
            className="inline-flex items-center gap-1 rounded-md border border-[var(--nein-border)] bg-[var(--nein-sub)] px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-[var(--nein-accent-border)] dark:text-slate-200 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{ext.map.resetLayers}</span>
          </button>

          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="inline-flex items-center gap-1 rounded-md border border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] px-2.5 py-1.5 text-xs font-semibold text-[var(--nein-accent-text)] cursor-pointer"
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>{isFullscreen ? ext.map.fullscreenExit : ext.map.fullscreenEnter}</span>
          </button>
        </div>
      </div>

      {/* Regional Preset Jump Bar */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 mr-1">
          <Compass className="h-3.5 w-3.5 text-[var(--nein-accent-text)]" aria-hidden="true" />
          {ext.map.regionJumpLabel}:
        </span>
        {REGION_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() =>
              onChangeConfig({
                ...config,
                centerLat: p.lat,
                centerLon: p.lon,
                zoom: p.zoom,
              })
            }
            className="rounded border border-[var(--nein-border)] bg-[var(--nein-sub)] px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-[var(--nein-accent-border)] hover:text-[var(--nein-accent-text)] dark:text-slate-300 cursor-pointer"
          >
            {p.label[lang]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Map Canvas Column */}
        <div className="flex flex-col gap-3 lg:col-span-8">
          <div className="relative h-[430px] sm:h-[520px] w-full overflow-hidden rounded-lg border border-[var(--nein-border)] bg-slate-900">
            <canvas
              ref={canvasRef}
              onPointerDown={(e) => {
                dragRef.current = {
                  active: true,
                  startX: e.clientX,
                  startY: e.clientY,
                  lat: config.centerLat,
                  lon: config.centerLon,
                };
              }}
              onPointerMove={(e) => {
                if (!dragRef.current.active) return;
                const dx = e.clientX - dragRef.current.startX;
                const dy = e.clientY - dragRef.current.startY;
                dragRef.current.startX = e.clientX;
                dragRef.current.startY = e.clientY;
                panByPixels(dx, dy);
              }}
              onPointerUp={() => {
                dragRef.current.active = false;
              }}
              onPointerLeave={() => {
                dragRef.current.active = false;
              }}
              className="h-full w-full cursor-grab active:cursor-grabbing touch-none"
            />

            {/* Zoom Controls */}
            <div className="absolute right-3 top-3 flex flex-col gap-1.5">
              <button
                type="button"
                aria-label="Zoom In"
                onClick={() =>
                  onChangeConfig({ ...config, zoom: Math.min(15, config.zoom + 1) })
                }
                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 bg-slate-900/90 text-slate-100 hover:bg-slate-800 cursor-pointer"
              >
                <ZoomIn className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Zoom Out"
                onClick={() =>
                  onChangeConfig({ ...config, zoom: Math.max(4, config.zoom - 1) })
                }
                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 bg-slate-900/90 text-slate-100 hover:bg-slate-800 cursor-pointer"
              >
                <ZoomOut className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Bottom Coordinate & Attribution Overlay */}
            <div className="pointer-events-none absolute bottom-2 left-2 right-2 flex flex-wrap items-center justify-between gap-2 text-[10px]">
              <span className="rounded bg-slate-950/85 px-2 py-0.5 font-mono text-slate-200">
                Z{config.zoom} · {config.centerLat.toFixed(2)}°N, {config.centerLon.toFixed(2)}°E
              </span>
              <span className="rounded bg-slate-950/85 px-2 py-0.5 text-slate-200">
                地理院タイル (GSI) / 気象庁 (JMA)
              </span>
            </div>
          </div>

          {/* Time-Series Scrubber */}
          {activeTimeline.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] px-3.5 py-2.5">
              <button
                type="button"
                onClick={() => setIsPlaying((p) => !p)}
                className="inline-flex items-center gap-1 rounded bg-[var(--nein-accent)] px-2.5 py-1 text-xs font-semibold text-[var(--nein-accent-contrast)] cursor-pointer"
              >
                {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                <span>{isPlaying ? ext.map.pause : ext.map.play}</span>
              </button>
              <input
                type="range"
                min={0}
                max={Math.max(0, activeTimeline.length - 1)}
                value={frameIndex}
                onChange={(e) => {
                  setIsPlaying(false);
                  setFrameIndex(Number(e.target.value));
                }}
                aria-label={ext.map.playbackTitle}
                className="min-w-[140px] flex-1 accent-[var(--nein-accent)] cursor-pointer"
              />
              <span className="font-mono text-xs tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                {currentFrameEntry?.labelJst ?? '--'}
              </span>
            </div>
          )}

          {/* Legend & Safety Notes */}
          <div className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-3 text-[11px] text-slate-700 dark:text-slate-300">
            <div className="font-bold text-slate-900 dark:text-slate-100 mb-1.5">
              {ext.map.legendHeading}
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1"><strong className="text-red-500">×</strong> {ext.map.layerLabels.quake_epicenters}</span>
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-fuchsia-600 inline-block" /> {ext.map.layerLabels.tsunami_areas}</span>
              <span className="inline-flex items-center gap-1"><strong className="text-orange-500">▲</strong> {ext.map.layerLabels.volcanoes}</span>
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 bg-green-600 inline-block" /> {ext.map.layerLabels.evacuation_shelters}</span>
            </div>
            <p className="mt-1.5 text-[11px] text-amber-700 dark:text-amber-300">
              {ext.map.typhoonCircleNote} · {ext.map.shelterZoomHint}
            </p>
          </div>
        </div>

        {/* Layer Control Column */}
        <div className="flex flex-col gap-2 rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-3.5 lg:col-span-4 max-h-[640px] overflow-y-auto">
          <div className="flex items-center gap-1.5 border-b border-[var(--nein-border-subtle)] pb-2 text-xs font-bold text-slate-900 dark:text-slate-100">
            <Layers className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
            <span>{ext.map.layersHeading}</span>
          </div>

          {LAYER_ORDER.map((id) => {
            const active = Boolean(config.enabledLayers[id]);
            const opacity = config.layerOpacity[id] ?? 0.7;
            return (
              <div
                key={id}
                className="flex flex-col gap-1 rounded border border-[var(--nein-border-subtle)] bg-[var(--nein-surface)] px-2.5 py-2"
              >
                <label className="flex items-center justify-between gap-2 text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer">
                  <span>{ext.map.layerLabels[id]}</span>
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleLayer(id)}
                    className="h-4 w-4 accent-[var(--nein-accent)] cursor-pointer"
                  />
                </label>
                {active && (
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                    <span>{ext.map.opacity}</span>
                    <input
                      type="range"
                      min={20}
                      max={100}
                      value={Math.round(opacity * 100)}
                      onChange={(e) =>
                        onChangeConfig({
                          ...config,
                          layerOpacity: {
                            ...config.layerOpacity,
                            [id]: Number(e.target.value) / 100,
                          },
                        })
                      }
                      className="flex-1 accent-[var(--nein-accent)] cursor-pointer"
                    />
                    <span className="font-mono tabular-nums">{Math.round(opacity * 100)}%</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
