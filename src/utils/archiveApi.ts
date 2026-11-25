import type { P2PQuakeRecord } from '../types/quake';

export interface JstDateParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  ymd: string; // YYYY-MM-DD
}

export interface CalendarCell {
  ymd: string;
  year: number;
  month: number;
  day: number;
  inCurrentMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
}

export interface DayQuakeSummary {
  count: number;
  maxScale: number;
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatYmd(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function getJstTodayParts(now = new Date()): JstDateParts {
  const parts = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const getNum = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? '1');

  const year = getNum('year');
  const month = getNum('month');
  const day = getNum('day');

  return {
    year,
    month,
    day,
    ymd: formatYmd(year, month, day),
  };
}

export function toP2PDateParam(ymd: string): string {
  return ymd.replaceAll('-', '');
}

export function formatDisplayYmd(ymd: string): string {
  const [y, m, d] = ymd.split('-');
  if (!y || !m || !d) return ymd;
  return `${y}/${m}/${d}`;
}

export function formatJapaneseDateHeading(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return ymd;
  return `${y}年${m}月${d}日`;
}

export function getMonthRangeYmd(year: number, month: number): {
  sinceYmd: string;
  untilYmd: string;
} {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    sinceYmd: formatYmd(year, month, 1),
    untilYmd: formatYmd(year, month, lastDay),
  };
}

export function buildJmaQuakeArchiveUrl(
  sinceYmd: string,
  untilYmd: string,
  limit = 100,
  offset = 0
): string {
  const params = new URLSearchParams({
    since_date: toP2PDateParam(sinceYmd),
    until_date: toP2PDateParam(untilYmd),
    limit: String(limit),
    offset: String(offset),
  });
  return `https://api.p2pquake.net/v2/jma/quake?${params.toString()}`;
}

export function buildJmaTsunamiArchiveUrl(
  sinceYmd: string,
  untilYmd: string,
  limit = 100,
  offset = 0
): string {
  const params = new URLSearchParams({
    since_date: toP2PDateParam(sinceYmd),
    until_date: toP2PDateParam(untilYmd),
    limit: String(limit),
    offset: String(offset),
  });
  return `https://api.p2pquake.net/v2/jma/tsunami?${params.toString()}`;
}

export function buildCalendarMonthGrid(
  year: number,
  month: number,
  now = new Date()
): CalendarCell[] {
  const today = getJstTodayParts(now);
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay(); // 0 = Sun
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const totalCells = firstWeekday + daysInMonth > 35 ? 42 : 35;
  const startUtc = Date.UTC(year, month - 1, 1 - firstWeekday);

  const cells: CalendarCell[] = [];
  for (let i = 0; i < totalCells; i++) {
    const dt = new Date(startUtc + i * 86_400_000);
    const cy = dt.getUTCFullYear();
    const cm = dt.getUTCMonth() + 1;
    const cd = dt.getUTCDate();
    const ymd = formatYmd(cy, cm, cd);
    cells.push({
      ymd,
      year: cy,
      month: cm,
      day: cd,
      inCurrentMonth: cy === year && cm === month,
      isToday: ymd === today.ymd,
      isFuture: ymd > today.ymd,
    });
  }

  return cells;
}

export function extractRecordYmd(record: P2PQuakeRecord): string | null {
  const raw =
    record.code === 551 && record.earthquake?.time
      ? record.earthquake.time
      : record.time;
  if (!raw) return null;
  const datePart = raw.split(' ')[0];
  if (!datePart) return null;
  const parts = datePart.split('/');
  if (parts.length !== 3) return null;
  return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
}

export function summarizeMonthQuakes(
  records: P2PQuakeRecord[]
): Record<string, DayQuakeSummary> {
  const map: Record<string, DayQuakeSummary> = {};
  for (const r of records) {
    const ymd = extractRecordYmd(r);
    if (!ymd) continue;
    const scale = r.code === 551 ? r.earthquake?.maxScale ?? -1 : -1;
    if (!map[ymd]) {
      map[ymd] = { count: 1, maxScale: scale };
    } else {
      map[ymd].count += 1;
      if (scale > map[ymd].maxScale) {
        map[ymd].maxScale = scale;
      }
    }
  }
  return map;
}
