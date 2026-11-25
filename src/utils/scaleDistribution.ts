import type { P2PQuakeRecord } from '../types/quake';

export interface ScaleDistributionBin {
  scale: number;
  shortLabel: string;
  fullLabel: string;
  count: number;
  prefectures: string[];
  color: string;
}

export interface ScaleDistributionResult {
  bins: ScaleDistributionBin[];
  totalCount: number;
  unitLabel: '地点' | '地域';
  title: string;
}

const ORDERED_SCALES: Array<{
  scale: number;
  shortLabel: string;
  fullLabel: string;
  color: string;
}> = [
  { scale: 10, shortLabel: '1', fullLabel: '震度1', color: '#64748B' },
  { scale: 20, shortLabel: '2', fullLabel: '震度2', color: '#38BDF8' },
  { scale: 30, shortLabel: '3', fullLabel: '震度3', color: '#10B981' },
  { scale: 40, shortLabel: '4', fullLabel: '震度4', color: '#F59E0B' },
  { scale: 45, shortLabel: '5弱', fullLabel: '震度5弱', color: '#FB923C' },
  { scale: 50, shortLabel: '5強', fullLabel: '震度5強', color: '#F97316' },
  { scale: 55, shortLabel: '6弱', fullLabel: '震度6弱', color: '#F87171' },
  { scale: 60, shortLabel: '6強', fullLabel: '震度6強', color: '#EF4444' },
  { scale: 70, shortLabel: '7', fullLabel: '震度7', color: '#D946EF' },
];

export function buildScaleDistribution(
  record: P2PQuakeRecord | null
): ScaleDistributionResult {
  const counts = new Map<number, number>();
  const prefsByScale = new Map<number, Set<string>>();

  const addEntry = (scale: number, pref: string) => {
    counts.set(scale, (counts.get(scale) ?? 0) + 1);
    if (!prefsByScale.has(scale)) {
      prefsByScale.set(scale, new Set());
    }
    if (pref) {
      prefsByScale.get(scale)!.add(pref);
    }
  };

  let unitLabel: '地点' | '地域' = '地点';
  let title = '震度別 観測地点分布';

  if (record?.code === 551 && record.points) {
    for (const pt of record.points) {
      addEntry(pt.scale, pt.pref);
    }
  } else if (record?.code === 556 && !record.cancelled && record.areas) {
    unitLabel = '地域';
    title = '予想震度別 警報対象地域分布';
    for (const area of record.areas) {
      addEntry(area.scaleFrom, area.pref);
    }
  }

  let totalCount = 0;
  const bins: ScaleDistributionBin[] = ORDERED_SCALES.map((def) => {
    const count = counts.get(def.scale) ?? 0;
    totalCount += count;
    return {
      ...def,
      count,
      prefectures: Array.from(prefsByScale.get(def.scale) ?? []),
    };
  });

  return {
    bins,
    totalCount,
    unitLabel,
    title,
  };
}
