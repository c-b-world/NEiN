import {
  geoGraticule10,
  geoPath,
  select,
  zoom,
  zoomIdentity,
  type ZoomBehavior,
  type ZoomTransform,
} from 'd3';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { P2PQuakeRecord } from '../types/quake';
import {
  JAPAN_CITIES,
  type MapViewMode,
  buildDistanceRingPath,
  createEpicenterProjection,
  getJapanAndNeighborFeatures,
  getNearbyCities,
} from '../utils/d3MapUtils';
import { type AppLanguage, getMessages } from '../utils/i18n';
import { getRecordCoordinates, getRecordTitle } from '../utils/quakeParser';
import {
  type ColorThemeId,
  type ThemeMode,
  getColorThemeOption,
} from '../utils/themeSettings';

interface EpicenterD3MapProps {
  lang: AppLanguage;
  records: P2PQuakeRecord[];
  selectedRecord: P2PQuakeRecord | null;
  onSelectRecord: (id: string) => void;
  themeMode: ThemeMode;
  colorTheme: ColorThemeId;
}

const SVG_WIDTH = 640;
const SVG_HEIGHT = 440;
const MAJOR_HUB_NAMES = new Set([
  '札幌',
  '仙台',
  '東京',
  '名古屋',
  '大阪',
  '広島',
  '福岡',
  '那覇',
]);

export function EpicenterD3Map({
  lang,
  records,
  selectedRecord,
  onSelectRecord,
  themeMode,
  colorTheme,
}: EpicenterD3MapProps) {
  const m = getMessages(lang);
  const [viewMode, setViewMode] = useState<MapViewMode>('vicinity');
  const [transform, setTransform] = useState<ZoomTransform>(zoomIdentity);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const zoomBehaviorRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(
    null
  );

  const selectedCoords = selectedRecord
    ? getRecordCoordinates(selectedRecord)
    : null;

  const effectiveMode: MapViewMode =
    selectedCoords && viewMode === 'vicinity' ? 'vicinity' : 'national';

  const { japan, neighbors } = useMemo(() => getJapanAndNeighborFeatures(), []);

  const projection = useMemo(
    () =>
      createEpicenterProjection({
        width: SVG_WIDTH,
        height: SVG_HEIGHT,
        mode: effectiveMode,
        centerLat: selectedCoords?.latitude,
        centerLon: selectedCoords?.longitude,
      }),
    [effectiveMode, selectedCoords?.latitude, selectedCoords?.longitude]
  );

  const pathGenerator = useMemo(() => geoPath(projection), [projection]);

  const graticulePath = useMemo(
    () => pathGenerator(geoGraticule10()) ?? '',
    [pathGenerator]
  );

  const neighborPaths = useMemo(
    () =>
      neighbors.map((feat, idx) => ({
        key: String(feat.id ?? idx),
        d: pathGenerator(feat) ?? '',
      })),
    [neighbors, pathGenerator]
  );

  const japanPath = useMemo(
    () => (japan ? pathGenerator(japan) ?? '' : ''),
    [japan, pathGenerator]
  );

  const plottedRecords = useMemo(() => {
    return records
      .map((rec) => {
        const coords = getRecordCoordinates(rec);
        if (!coords) return null;
        const projected = projection([coords.longitude, coords.latitude]);
        if (!projected) return null;
        return {
          record: rec,
          x: projected[0],
          y: projected[1],
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [records, projection]);

  const selectedPoint = useMemo(() => {
    if (!selectedCoords) return null;
    const projected = projection([
      selectedCoords.longitude,
      selectedCoords.latitude,
    ]);
    if (!projected) return null;
    return { x: projected[0], y: projected[1] };
  }, [selectedCoords, projection]);

  const distanceRings = useMemo(() => {
    if (!selectedCoords) return [];
    const radii = effectiveMode === 'vicinity' ? [50, 100] : [200];
    return radii
      .map((km) => {
        const d = buildDistanceRingPath(
          pathGenerator,
          selectedCoords.longitude,
          selectedCoords.latitude,
          km
        );
        const deg = (km / 6371) * (180 / Math.PI);
        const labelPt = projection([
          selectedCoords.longitude,
          selectedCoords.latitude - deg,
        ]);
        if (!d) return null;
        return {
          km,
          d,
          labelX: labelPt?.[0] ?? null,
          labelY: labelPt?.[1] ?? null,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);
  }, [selectedCoords, effectiveMode, pathGenerator, projection]);

  const cityMarkers = useMemo(() => {
    const sourceCities =
      effectiveMode === 'vicinity'
        ? JAPAN_CITIES
        : JAPAN_CITIES.filter((c) => MAJOR_HUB_NAMES.has(c.name));

    return sourceCities
      .map((city) => {
        const projected = projection([city.lon, city.lat]);
        if (!projected) return null;
        const [x, y] = projected;
        if (x < -40 || x > SVG_WIDTH + 40 || y < -40 || y > SVG_HEIGHT + 40) {
          return null;
        }
        return {
          ...city,
          x,
          y,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);
  }, [effectiveMode, projection]);

  const nearbyCities = useMemo(() => {
    if (!selectedCoords) return [];
    return getNearbyCities(selectedCoords.latitude, selectedCoords.longitude, 3);
  }, [selectedCoords]);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const behavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.6, 10])
      .on('zoom', (event) => {
        setTransform(event.transform);
      });

    zoomBehaviorRef.current = behavior;
    const selection = select(svgEl);
    selection.call(behavior);

    return () => {
      selection.on('.zoom', null);
    };
  }, []);

  useEffect(() => {
    const svgEl = svgRef.current;
    const behavior = zoomBehaviorRef.current;
    if (svgEl && behavior) {
      select(svgEl).call(behavior.transform, zoomIdentity);
      setTransform(zoomIdentity);
    }
  }, [selectedRecord?.id, effectiveMode]);

  const handleZoomBy = (factor: number) => {
    const svgEl = svgRef.current;
    const behavior = zoomBehaviorRef.current;
    if (!svgEl || !behavior) return;
    select(svgEl).transition().duration(180).call(behavior.scaleBy, factor);
  };

  const handleResetZoom = () => {
    const svgEl = svgRef.current;
    const behavior = zoomBehaviorRef.current;
    if (!svgEl || !behavior) return;
    select(svgEl).transition().duration(200).call(behavior.transform, zoomIdentity);
  };

  const isDark = themeMode === 'dark';
  const themeDef = getColorThemeOption(colorTheme);
  const isSelectedEEW =
    selectedRecord?.code === 556 && !selectedRecord.cancelled;
  const accentColor = isSelectedEEW
    ? isDark
      ? '#EF4444'
      : '#DC2626'
    : isDark
    ? themeDef.darkAccent
    : themeDef.lightAccent;

  const seaBg = isDark ? themeDef.mapSeaDark : themeDef.mapSeaLight;
  const landFill = isDark ? themeDef.mapLandDark : themeDef.mapLandLight;
  const landStroke = isDark ? themeDef.mapStrokeDark : themeDef.mapStrokeLight;
  const neighborFill = isDark ? '#0D1422' : '#E2E8F0';
  const neighborStroke = isDark ? '#1E293B' : '#CBD5E1';
  const graticuleStroke = isDark ? '#172033' : '#CBD5E1';
  const cityLabelFill = isDark ? '#94A3B8' : '#334155';
  const cityDotFill = isDark ? '#64748B' : '#475569';
  const labelOutline = seaBg;
  const invScale = 1 / Math.max(transform.k, 0.5);

  return (
    <div
      data-testid="epicenter-d3-map"
      className="flex flex-col overflow-hidden rounded-lg border border-[var(--nein-border)] bg-[var(--nein-surface)]"
    >
      {/* Map Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--nein-border-subtle)] px-3.5 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
            {m.detail.mapTitle}
          </span>
          <span className="font-mono text-[11px] tabular-nums text-slate-500">
            {transform.k.toFixed(1)}x
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div
            role="group"
            aria-label={m.detail.mapTitle}
            className="flex items-center rounded border border-[var(--nein-border)] bg-[var(--nein-sub)] p-0.5"
          >
            <button
              type="button"
              disabled={!selectedCoords}
              onClick={() => setViewMode('vicinity')}
              aria-pressed={effectiveMode === 'vicinity'}
              className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                effectiveMode === 'vicinity'
                  ? 'bg-[var(--nein-accent-soft)] text-[var(--nein-accent-text)]'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {m.detail.mapVicinity}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('national')}
              aria-pressed={effectiveMode === 'national'}
              className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                effectiveMode === 'national'
                  ? 'bg-[var(--nein-accent-soft)] text-[var(--nein-accent-text)]'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {m.detail.mapNational}
            </button>
          </div>

          <div
            role="group"
            aria-label="Map Zoom"
            className="flex items-center rounded border border-[var(--nein-border)] bg-[var(--nein-sub)]"
          >
            <button
              type="button"
              onClick={() => handleZoomBy(1.5)}
              aria-label="Zoom In"
              className="p-1 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => handleZoomBy(1 / 1.5)}
              aria-label="Zoom Out"
              className="border-x border-[var(--nein-border)] p-1 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 cursor-pointer"
            >
              <Minus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              aria-label="Reset Zoom"
              className="p-1 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* D3 Interactive SVG Canvas */}
      <div className="relative aspect-[640/440] w-full" style={{ backgroundColor: seaBg }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="h-full w-full cursor-grab active:cursor-grabbing select-none"
          role="img"
          aria-label={m.detail.mapTitle}
        >
          <g transform={transform.toString()}>
            {/* Graticule */}
            <path
              d={graticulePath}
              fill="none"
              stroke={graticuleStroke}
              strokeWidth={0.75 * invScale}
              strokeDasharray={`${3 * invScale} ${4 * invScale}`}
            />

            {/* Neighboring coastlines */}
            {neighborPaths.map((feat) => (
              <path
                key={feat.key}
                d={feat.d}
                fill={neighborFill}
                stroke={neighborStroke}
                strokeWidth={0.8 * invScale}
              />
            ))}

            {/* Japan 50m coastline */}
            {japanPath && (
              <path
                d={japanPath}
                fill={landFill}
                stroke={landStroke}
                strokeWidth={1.15 * invScale}
                strokeLinejoin="round"
              />
            )}

            {/* Prefectural / Major City Markers */}
            {cityMarkers.map((city) => (
              <g key={city.name} pointerEvents="none">
                <circle
                  cx={city.x}
                  cy={city.y}
                  r={2.2 * invScale}
                  fill={cityDotFill}
                />
                <text
                  x={city.x + 4.5 * invScale}
                  y={city.y + 3 * invScale}
                  fill={cityLabelFill}
                  stroke={labelOutline}
                  strokeWidth={2.5 * invScale}
                  paintOrder="stroke"
                  fontSize={10 * invScale}
                  fontWeight={500}
                >
                  {city.name}
                </text>
              </g>
            ))}

            {/* Other recent epicenters */}
            {plottedRecords.map(({ record, x, y }, idx) => {
              const isSelected = record.id === selectedRecord?.id;
              if (isSelected) return null;
              const isEEW = record.code === 556;
              const dotColor = isEEW
                ? '#EF4444'
                : isDark
                ? themeDef.darkAccent
                : themeDef.lightAccent;
              return (
                <circle
                  key={record.id ? `${record.id}-${idx}` : `pin-${idx}`}
                  cx={x}
                  cy={y}
                  r={(isEEW ? 5 : 4) * invScale}
                  fill={dotColor}
                  fillOpacity={0.55}
                  stroke={isEEW ? '#FCA5A5' : dotColor}
                  strokeWidth={1 * invScale}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectRecord(record.id);
                  }}
                >
                  <title>{getRecordTitle(record, lang)}</title>
                </circle>
              );
            })}

            {/* Geodesic distance rings around selected epicenter */}
            {distanceRings.map((ring) => (
              <g key={`ring-${ring.km}`} pointerEvents="none">
                <path
                  d={ring.d}
                  fill={accentColor}
                  fillOpacity={isDark ? 0.05 : 0.07}
                  stroke={accentColor}
                  strokeOpacity={0.55}
                  strokeWidth={1 * invScale}
                  strokeDasharray={`${4 * invScale} ${3 * invScale}`}
                />
                {ring.labelX !== null && ring.labelY !== null && (
                  <text
                    x={ring.labelX}
                    y={ring.labelY + 11 * invScale}
                    textAnchor="middle"
                    fill={accentColor}
                    fillOpacity={0.95}
                    stroke={labelOutline}
                    strokeWidth={2.5 * invScale}
                    paintOrder="stroke"
                    fontSize={9.5 * invScale}
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {ring.km}km
                  </text>
                )}
              </g>
            ))}

            {/* Selected Epicenter Crosshair */}
            {selectedPoint && (
              <g pointerEvents="none">
                <circle
                  cx={selectedPoint.x}
                  cy={selectedPoint.y}
                  r={12 * invScale}
                  fill={accentColor}
                  fillOpacity={0.2}
                  stroke={accentColor}
                  strokeWidth={1.6 * invScale}
                />
                <path
                  d={`M${selectedPoint.x - 6 * invScale},${selectedPoint.y - 6 * invScale} L${selectedPoint.x + 6 * invScale},${selectedPoint.y + 6 * invScale} M${selectedPoint.x + 6 * invScale},${selectedPoint.y - 6 * invScale} L${selectedPoint.x - 6 * invScale},${selectedPoint.y + 6 * invScale}`}
                  stroke={isSelectedEEW ? '#DC2626' : isDark ? '#E0F2FE' : accentColor}
                  strokeWidth={2.2 * invScale}
                  strokeLinecap="round"
                />
              </g>
            )}
          </g>
        </svg>

        {!selectedCoords && (
          <div className="pointer-events-none absolute bottom-3 left-3 rounded border border-[var(--nein-border)] bg-[var(--nein-surface)]/95 px-2.5 py-1 text-[11px] text-slate-700 dark:text-slate-300">
            {m.detail.mapNoCoordsOverlay}
          </div>
        )}
      </div>

      {/* Bottom Spatial Reference HUD */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--nein-border-subtle)] bg-[var(--nein-sub)] px-3.5 py-2 text-[11px] text-slate-600 dark:text-slate-400">
        <span className="font-mono tabular-nums text-slate-800 dark:text-slate-300">
          {selectedCoords
            ? `${m.detail.mapLatPrefix} ${selectedCoords.latitude.toFixed(1)}° / ${m.detail.mapLonPrefix} ${selectedCoords.longitude.toFixed(1)}°`
            : m.detail.mapNoCoordsFooter}
        </span>

        {nearbyCities.length > 0 && (
          <span className="font-mono tabular-nums text-slate-600 dark:text-slate-400 truncate">
            {m.detail.mapNearby}{' '}
            {nearbyCities
              .map((c) => `${c.name} ${c.distanceKm}km`)
              .join(' · ')}
          </span>
        )}
      </div>
    </div>
  );
}
