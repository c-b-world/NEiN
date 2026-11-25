import { useMemo } from 'react';
import type { P2PQuakeRecord } from '../types/quake';
import {
  JAPAN_BOUNDS,
  JAPAN_ISLANDS_LON_LAT,
  coordsToSvgPath,
  projectLatLon,
} from '../utils/geo';
import { getRecordCoordinates, getRecordTitle } from '../utils/quakeParser';

interface JapanMapProps {
  records: P2PQuakeRecord[];
  selectedRecord: P2PQuakeRecord | null;
  onSelectRecord: (id: string) => void;
}

const LON_LINES = [125, 130, 135, 140, 145];
const LAT_LINES = [25, 30, 35, 40, 45];

export function JapanMap({
  records,
  selectedRecord,
  onSelectRecord,
}: JapanMapProps) {
  const islandPaths = useMemo(
    () =>
      JAPAN_ISLANDS_LON_LAT.map((island) => ({
        name: island.name,
        d: coordsToSvgPath(island.coords),
      })),
    []
  );

  const plottedRecords = useMemo(() => {
    return records
      .map((rec) => {
        const coords = getRecordCoordinates(rec);
        if (!coords) return null;
        const pt = projectLatLon(coords.latitude, coords.longitude);
        if (!pt.inBounds) return null;
        return {
          record: rec,
          coords,
          pt,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [records]);

  const selectedCoords = selectedRecord
    ? getRecordCoordinates(selectedRecord)
    : null;
  const selectedProjected = selectedCoords
    ? projectLatLon(selectedCoords.latitude, selectedCoords.longitude)
    : null;

  const isSelectedEEW =
    selectedRecord?.code === 556 && !selectedRecord.cancelled;

  return (
    <div
      data-testid="japan-seismic-map"
      className="relative overflow-hidden rounded-lg border border-slate-800 bg-[#080C14]"
    >
      <div className="flex items-center justify-between border-b border-slate-800/80 px-3.5 py-2">
        <span className="text-xs font-medium text-slate-300">
          震央分布マップ
        </span>
        <span className="font-mono text-[11px] tabular-nums text-slate-400">
          {selectedCoords
            ? `N${selectedCoords.latitude.toFixed(1)}° / E${selectedCoords.longitude.toFixed(1)}°`
            : '座標データなし'}
        </span>
      </div>

      <div className="relative aspect-[640/440] w-full">
        <svg
          viewBox={`0 0 ${JAPAN_BOUNDS.width} ${JAPAN_BOUNDS.height}`}
          className="h-full w-full"
          role="img"
          aria-label="日本列島および震央位置マップ"
        >
          {/* Lat/Lon Graticule */}
          {LON_LINES.map((lon) => {
            const { x } = projectLatLon(35, lon);
            return (
              <g key={`lon-${lon}`}>
                <line
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={JAPAN_BOUNDS.height}
                  stroke="#1E293B"
                  strokeWidth={1}
                  strokeDasharray="3 4"
                />
                <text
                  x={x + 4}
                  y={JAPAN_BOUNDS.height - 8}
                  fill="#475569"
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {lon}°E
                </text>
              </g>
            );
          })}

          {LAT_LINES.map((lat) => {
            const { y } = projectLatLon(lat, 135);
            return (
              <g key={`lat-${lat}`}>
                <line
                  x1={0}
                  y1={y}
                  x2={JAPAN_BOUNDS.width}
                  y2={y}
                  stroke="#1E293B"
                  strokeWidth={1}
                  strokeDasharray="3 4"
                />
                <text
                  x={8}
                  y={y - 5}
                  fill="#475569"
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {lat}°N
                </text>
              </g>
            );
          })}

          {/* Japan Landmasses */}
          {islandPaths.map((island) => (
            <path
              key={island.name}
              d={island.d}
              fill="#141C2B"
              stroke="#334155"
              strokeWidth={1.5}
              strokeLinejoin="round"
            />
          ))}

          {/* Recent epicenters */}
          {plottedRecords.map(({ record, pt }, idx) => {
            const isSelected = record.id === selectedRecord?.id;
            if (isSelected) return null;
            const isEEW = record.code === 556;
            return (
              <circle
                key={record.id ? `${record.id}-${idx}` : `pin-${idx}`}
                cx={pt.x}
                cy={pt.y}
                r={isEEW ? 5 : 4}
                fill={isEEW ? '#EF4444' : '#38BDF8'}
                fillOpacity={0.45}
                stroke={isEEW ? '#FCA5A5' : '#7DD3FC'}
                strokeWidth={1}
                className="cursor-pointer"
                onClick={() => onSelectRecord(record.id)}
              >
                <title>{getRecordTitle(record)}</title>
              </circle>
            );
          })}

          {/* Selected epicenter reticle */}
          {selectedProjected && selectedProjected.inBounds && (
            <g>
              <line
                x1={0}
                y1={selectedProjected.y}
                x2={JAPAN_BOUNDS.width}
                y2={selectedProjected.y}
                stroke={isSelectedEEW ? '#EF4444' : '#38BDF8'}
                strokeOpacity={0.3}
                strokeWidth={1}
              />
              <line
                x1={selectedProjected.x}
                y1={0}
                x2={selectedProjected.x}
                y2={JAPAN_BOUNDS.height}
                stroke={isSelectedEEW ? '#EF4444' : '#38BDF8'}
                strokeOpacity={0.3}
                strokeWidth={1}
              />
              <circle
                cx={selectedProjected.x}
                cy={selectedProjected.y}
                r={26}
                fill="none"
                stroke={isSelectedEEW ? '#EF4444' : '#38BDF8'}
                strokeOpacity={0.35}
                strokeWidth={1.25}
              />
              <circle
                cx={selectedProjected.x}
                cy={selectedProjected.y}
                r={14}
                fill={isSelectedEEW ? '#EF4444' : '#38BDF8'}
                fillOpacity={0.18}
                stroke={isSelectedEEW ? '#F87171' : '#38BDF8'}
                strokeWidth={1.5}
              />
              <path
                d={`M${selectedProjected.x - 6},${selectedProjected.y - 6} L${selectedProjected.x + 6},${selectedProjected.y + 6} M${selectedProjected.x + 6},${selectedProjected.y - 6} L${selectedProjected.x - 6},${selectedProjected.y + 6}`}
                stroke={isSelectedEEW ? '#FEE2E2' : '#E0F2FE'}
                strokeWidth={2}
                strokeLinecap="round"
              />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
