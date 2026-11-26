import {
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Radar,
  RefreshCw,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { JmaTileTimeEntry } from '../../types/disaster';
import type { AppLanguage } from '../../utils/i18n';
import { getExtendedMessages } from '../../utils/i18nExtended';
import {
  type RadarTimelinesBundle,
  buildGsiTileUrl,
  buildHimawariTileUrl,
  buildJmaNowcTileUrl,
  buildJmaRasrfTileUrl,
  computeVisibleTiles,
  findLiveObservationIndex,
} from '../../utils/jmaTilesApi';

type RadarMode = 'hrpns' | 'rasrf' | 'lightning' | 'tornado' | 'satellite' | 'weather_map';

interface RadarSatelliteViewProps {
  lang: AppLanguage;
  timelines: RadarTimelinesBundle | null;
  onRefresh: () => void;
}

export function RadarSatelliteView({
  lang,
  timelines,
  onRefresh,
}: RadarSatelliteViewProps) {
  const ext = getExtendedMessages(lang);
  const [mode, setMode] = useState<RadarMode>('hrpns');
  const [satBand, setSatBand] = useState<'B13' | 'REP'>('B13');
  const [wmapArea, setWmapArea] = useState<'near' | 'asia'>('near');
  const [wmapSpan, setWmapSpan] = useState<'now' | 'ft24' | 'ft48'>('now');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(800);
  const [zoom, setZoom] = useState(5);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [renderTick, setRenderTick] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgCacheRef = useRef<Map<string, HTMLImageElement | 'loading' | 'error'>>(new Map());

  const [frameState, setFrameState] = useState<{ mode: RadarMode; idx: number }>({
    mode: 'hrpns',
    idx: 0,
  });

  const activeList: JmaTileTimeEntry[] = useMemo(() => {
    if (!timelines) return [];
    if (mode === 'hrpns') return timelines.hrpns;
    if (mode === 'rasrf') return timelines.rasrf;
    if (mode === 'lightning' || mode === 'tornado') return timelines.lightningTornado;
    if (mode === 'satellite') return timelines.himawari;
    return [];
  }, [mode, timelines]);

  const defaultLiveIdx = useMemo(() => findLiveObservationIndex(activeList), [activeList]);
  const frameIdx =
    frameState.mode === mode && frameState.idx >= 0 && frameState.idx < activeList.length
      ? frameState.idx
      : defaultLiveIdx;

  const setFrameIdx = (next: number | ((prev: number) => number)) => {
    setFrameState((prev) => {
      const baseIdx =
        prev.mode === mode && prev.idx >= 0 && prev.idx < activeList.length
          ? prev.idx
          : defaultLiveIdx;
      const resolved = typeof next === 'function' ? next(baseIdx) : next;
      return { mode, idx: resolved };
    });
  };

  useEffect(() => {
    setFrameState({ mode, idx: defaultLiveIdx });
    setIsPlaying(false);
  }, [mode, defaultLiveIdx]);

  useEffect(() => {
    if (!isPlaying || activeList.length <= 1) return;
    const t = window.setInterval(() => {
      setFrameState((prev) => {
        const cur = prev.mode === mode ? prev.idx : defaultLiveIdx;
        return { mode, idx: (cur + 1) % activeList.length };
      });
    }, speedMs);
    return () => window.clearInterval(t);
  }, [isPlaying, activeList.length, speedMs, mode, defaultLiveIdx]);

  useEffect(() => {
    const onFs = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
      setRenderTick((v) => v + 1);
    };
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setRenderTick((v) => v + 1));
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [mode]);

  const currentEntry = activeList[frameIdx] ?? null;

  useEffect(() => {
    if (mode === 'weather_map') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = canvas.clientWidth || 720;
    const height = canvas.clientHeight || 440;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    const tiles = computeVisibleTiles(36.2, 138.2, zoom, width, height);
    const loadImg = (url: string): HTMLImageElement | null => {
      const hit = imgCacheRef.current.get(url);
      if (hit === 'loading' || hit === 'error') return null;
      if (hit) return hit;
      imgCacheRef.current.set(url, 'loading');
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imgCacheRef.current.set(url, img);
        setRenderTick((v) => v + 1);
      };
      img.onerror = () => {
        imgCacheRef.current.set(url, 'error');
      };
      img.src = url;
      return null;
    };

    for (const tile of tiles) {
      const baseImg = loadImg(buildGsiTileUrl('gsi_std', tile.z, tile.x, tile.y));
      if (baseImg) ctx.drawImage(baseImg, tile.screenX, tile.screenY, 256, 256);

      if (currentEntry) {
        const overlayUrl =
          mode === 'hrpns'
            ? buildJmaNowcTileUrl(currentEntry, 'hrpns', tile.z, tile.x, tile.y)
            : mode === 'rasrf'
            ? buildJmaRasrfTileUrl(currentEntry, tile.z, tile.x, tile.y)
            : mode === 'lightning'
            ? buildJmaNowcTileUrl(currentEntry, 'thns', tile.z, tile.x, tile.y)
            : mode === 'tornado'
            ? buildJmaNowcTileUrl(currentEntry, 'trns', tile.z, tile.x, tile.y)
            : buildHimawariTileUrl(currentEntry, satBand, tile.z, tile.x, tile.y);

        if (overlayUrl) {
          const ovImg = loadImg(overlayUrl);
          if (ovImg) {
            ctx.save();
            ctx.globalAlpha = mode === 'satellite' ? 0.72 : 0.8;
            ctx.drawImage(ovImg, tile.screenX, tile.screenY, 256, 256);
            ctx.restore();
          }
        }
      }
    }
    ctx.restore();
  }, [currentEntry, mode, renderTick, satBand, zoom]);

  const weatherMapFilename = useMemo(() => {
    if (!timelines) return null;
    const wm = timelines.weatherMaps;
    const list =
      wmapArea === 'near'
        ? wmapSpan === 'now'
          ? wm.nearNow
          : wmapSpan === 'ft24'
          ? wm.nearFt24
          : wm.nearFt48
        : wmapSpan === 'now'
        ? wm.asiaNow
        : wmapSpan === 'ft24'
        ? wm.asiaFt24
        : wm.asiaFt48;
    return list[list.length - 1] ?? null;
  }, [timelines, wmapArea, wmapSpan]);

  const tabs: Array<{ id: RadarMode; label: string }> = [
    { id: 'hrpns', label: ext.radar.tabHrpns },
    { id: 'rasrf', label: ext.radar.tabRasrf },
    { id: 'lightning', label: ext.radar.tabLightning },
    { id: 'tornado', label: ext.radar.tabTornado },
    { id: 'satellite', label: ext.radar.tabSatellite },
    { id: 'weather_map', label: ext.radar.tabWeatherMap },
  ];

  return (
    <section
      ref={containerRef}
      aria-label={ext.radar.title}
      className="flex flex-col gap-4 rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)] p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--nein-border-subtle)] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Radar className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50">{ext.radar.title}</h1>
          </div>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">{ext.radar.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1 rounded-md border border-[var(--nein-border)] bg-[var(--nein-sub)] px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-[var(--nein-accent-border)] dark:text-slate-200 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{ext.common.refresh}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (!document.fullscreenElement) {
                void containerRef.current?.requestFullscreen?.().catch(() => {});
              } else {
                void document.exitFullscreen?.().catch(() => {});
              }
            }}
            className="inline-flex items-center gap-1 rounded-md border border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--nein-accent-text)] cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            <span>{isFullscreen ? ext.map.fullscreenExit : ext.map.fullscreenEnter}</span>
          </button>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex flex-wrap gap-1.5" role="tablist">
        {tabs.map((tab) => {
          const active = mode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setMode(tab.id)}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                active
                  ? 'border-[var(--nein-accent)] bg-[var(--nein-accent)] text-[var(--nein-accent-contrast)]'
                  : 'border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-700 dark:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {mode === 'satellite' && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSatBand('B13')}
            className={`rounded border px-3 py-1 text-xs font-medium cursor-pointer ${
              satBand === 'B13'
                ? 'border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] text-[var(--nein-accent-text)]'
                : 'border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-600 dark:text-slate-300'
            }`}
          >
            {ext.radar.satBandIr}
          </button>
          <button
            type="button"
            onClick={() => setSatBand('REP')}
            className={`rounded border px-3 py-1 text-xs font-medium cursor-pointer ${
              satBand === 'REP'
                ? 'border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] text-[var(--nein-accent-text)]'
                : 'border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-600 dark:text-slate-300'
            }`}
          >
            {ext.radar.satBandTrueColor}
          </button>
        </div>
      )}

      {mode === 'weather_map' ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {(['near', 'asia'] as const).map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => setWmapArea(area)}
                className={`rounded border px-3 py-1 text-xs font-semibold cursor-pointer ${
                  wmapArea === area
                    ? 'border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] text-[var(--nein-accent-text)]'
                    : 'border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-600 dark:text-slate-300'
                }`}
              >
                {area === 'near' ? ext.radar.wmapNear : ext.radar.wmapAsia}
              </button>
            ))}
            <span className="mx-1 text-slate-400">|</span>
            {(['now', 'ft24', 'ft48'] as const).map((span) => (
              <button
                key={span}
                type="button"
                onClick={() => setWmapSpan(span)}
                className={`rounded border px-3 py-1 text-xs font-semibold cursor-pointer ${
                  wmapSpan === span
                    ? 'border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] text-[var(--nein-accent-text)]'
                    : 'border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-600 dark:text-slate-300'
                }`}
              >
                {span === 'now'
                  ? ext.radar.wmapNow
                  : span === 'ft24'
                  ? ext.radar.wmapFt24
                  : ext.radar.wmapFt48}
              </button>
            ))}
          </div>

          <div className="flex justify-center overflow-hidden rounded-lg border border-[var(--nein-border)] bg-white p-2">
            {weatherMapFilename ? (
              <img
                src={`https://www.jma.go.jp/bosai/weather_map/data/png/${weatherMapFilename}`}
                alt={ext.radar.tabWeatherMap}
                className="max-h-[540px] w-auto object-contain"
              />
            ) : (
              <p className="py-12 text-xs text-slate-500">{ext.common.noData}</p>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="relative h-[420px] sm:h-[500px] w-full overflow-hidden rounded-lg border border-[var(--nein-border)] bg-slate-900">
            <canvas ref={canvasRef} className="h-full w-full" />
            <div className="absolute right-3 top-3 flex gap-1.5">
              {[4, 5, 6, 7].map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => setZoom(z)}
                  className={`rounded border px-2 py-1 font-mono text-[11px] font-bold cursor-pointer ${
                    zoom === z
                      ? 'border-sky-400 bg-sky-600 text-white'
                      : 'border-slate-700 bg-slate-900/90 text-slate-200'
                  }`}
                >
                  Z{z}
                </button>
              ))}
            </div>
            <div className="absolute bottom-2 left-2 rounded bg-slate-950/85 px-2.5 py-1 font-mono text-xs text-slate-100">
              {currentEntry?.labelJst ?? ext.common.loading}
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] px-3.5 py-2.5">
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              disabled={activeList.length <= 1}
              className="inline-flex items-center gap-1 rounded bg-[var(--nein-accent)] px-3 py-1.5 text-xs font-semibold text-[var(--nein-accent-contrast)] disabled:opacity-50 cursor-pointer"
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              <span>{isPlaying ? ext.map.pause : ext.map.play}</span>
            </button>

            <input
              type="range"
              min={0}
              max={Math.max(0, activeList.length - 1)}
              value={frameIdx}
              onChange={(e) => {
                setIsPlaying(false);
                setFrameIdx(Number(e.target.value));
              }}
              className="min-w-[160px] flex-1 accent-[var(--nein-accent)] cursor-pointer"
            />

            <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
              <span>{ext.map.speed}:</span>
              <select
                value={speedMs}
                onChange={(e) => setSpeedMs(Number(e.target.value))}
                className="rounded border border-[var(--nein-border)] bg-[var(--nein-surface)] px-2 py-1 font-mono text-xs cursor-pointer"
              >
                <option value={1200}>0.7x</option>
                <option value={800}>1.0x</option>
                <option value={450}>2.0x</option>
              </select>
            </label>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400">
            {mode === 'lightning' || mode === 'tornado'
              ? ext.radar.legendLightning
              : ext.radar.legendRain}
          </p>
        </>
      )}
    </section>
  );
}
