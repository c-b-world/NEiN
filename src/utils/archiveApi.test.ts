import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCalendarMonthGrid,
  buildJmaQuakeArchiveUrl,
  buildJmaTsunamiArchiveUrl,
  extractRecordYmd,
  getJstTodayParts,
  getMonthRangeYmd,
  summarizeMonthQuakes,
  toP2PDateParam,
} from './archiveApi';
import type { JMAQuake551 } from '../types/quake';

test('getJstTodayParts formats JST date accurately across UTC day boundary', () => {
  // 2026-11-24 19:00 PST is 2026-11-25 12:00 JST
  const dt = new Date('2026-11-25T03:00:00Z');
  const today = getJstTodayParts(dt);
  assert.equal(today.year, 2026);
  assert.equal(today.month, 11);
  assert.equal(today.day, 25);
  assert.equal(today.ymd, '2026-11-25');
});

test('buildJmaQuakeArchiveUrl and buildJmaTsunamiArchiveUrl format YYYYMMDD dates', () => {
  assert.equal(toP2PDateParam('2026-11-10'), '20261110');
  const quakeUrl = new URL(buildJmaQuakeArchiveUrl('2026-11-10', '2026-11-10', 100));
  assert.equal(quakeUrl.pathname, '/v2/jma/quake');
  assert.equal(quakeUrl.searchParams.get('since_date'), '20261110');
  assert.equal(quakeUrl.searchParams.get('until_date'), '20261110');
  assert.equal(quakeUrl.searchParams.get('limit'), '100');

  const tsunamiUrl = new URL(buildJmaTsunamiArchiveUrl('2026-11-10', '2026-11-10'));
  assert.equal(tsunamiUrl.pathname, '/v2/jma/tsunami');
  assert.equal(tsunamiUrl.searchParams.get('since_date'), '20261110');
});

test('buildCalendarMonthGrid generates aligned Sunday-first cells and marks today/future', () => {
  // Nov 1, 2026 is Sunday
  const now = new Date('2026-11-25T03:00:00Z'); // 2026-11-25 JST
  const cells = buildCalendarMonthGrid(2026, 11, now);
  assert.equal(cells.length, 35);
  assert.equal(cells[0].ymd, '2026-11-01');
  assert.equal(cells[0].inCurrentMonth, true);
  assert.equal(cells[0].isFuture, false);

  const nov25 = cells.find((c) => c.ymd === '2026-11-25');
  assert.ok(nov25);
  assert.equal(nov25.isToday, true);
  assert.equal(nov25.isFuture, false);

  const nov26 = cells.find((c) => c.ymd === '2026-11-26');
  assert.ok(nov26);
  assert.equal(nov26.isFuture, true);

  const range = getMonthRangeYmd(2026, 11);
  assert.deepEqual(range, { sinceYmd: '2026-11-01', untilYmd: '2026-11-30' });
});

test('summarizeMonthQuakes counts events and tracks max scale per day', () => {
  const base: Omit<JMAQuake551, 'id' | 'time' | 'earthquake'> = {
    code: 551,
    issue: { source: '気象庁', time: '2026/11/10 15:39:00', type: 'DetailScale' },
  };
  const recs: JMAQuake551[] = [
    {
      ...base,
      id: 'a',
      time: '2026/11/10 15:39:37',
      earthquake: {
        time: '2026/11/10 15:36:00',
        maxScale: 20,
        hypocenter: { name: '房総半島南方沖', latitude: 34.8, longitude: 140.0, depth: 30, magnitude: 3.5 },
      },
    },
    {
      ...base,
      id: 'b',
      time: '2026/11/10 22:25:48',
      earthquake: {
        time: '2026/11/10 22:23:00',
        maxScale: 40,
        hypocenter: { name: '茨城県沖', latitude: 36.2, longitude: 141.1, depth: 40, magnitude: 4.5 },
      },
    },
  ];
  assert.equal(extractRecordYmd(recs[0]), '2026-11-10');
  const summary = summarizeMonthQuakes(recs);
  assert.deepEqual(summary['2026-11-10'], { count: 2, maxScale: 40 });
});
