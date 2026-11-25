import test from 'node:test';
import assert from 'node:assert/strict';
import {
  REQUESTED_API_URL,
  createTestEEWPayload,
  formatDepth,
  formatMagnitude,
  formatQuakeForClipboard,
  getScalePresentation,
  matchesFilter,
  mergeQuakeRecords,
  normalizeP2PQuakeUrl,
  resolveRecordId,
} from './quakeParser';
import type { JMAQuake551, P2PQuakeRecord } from '../types/quake';

test('normalizeP2PQuakeUrl expands comma-separated codes into OpenAPI array params', () => {
  const normalized = normalizeP2PQuakeUrl(REQUESTED_API_URL);
  const parsed = new URL(normalized);
  assert.deepEqual(parsed.searchParams.getAll('codes'), ['551', '552', '554', '556', '561']);
  assert.equal(parsed.searchParams.get('limit'), '30');
  assert.equal(parsed.searchParams.get('offset'), '0');
});

test('getScalePresentation maps JMA scales accurately', () => {
  assert.equal(getScalePresentation(45).label, '震度5弱');
  assert.equal(getScalePresentation(55).short, '6弱');
  assert.equal(getScalePresentation(70).label, '震度7');
  assert.equal(getScalePresentation(-1).label, '震度不明');
});

test('formatDepth and formatMagnitude handle edge cases', () => {
  assert.equal(formatDepth(0), 'ごく浅い');
  assert.equal(formatDepth(10), '約10km');
  assert.equal(formatDepth(-1), '不明');
  assert.equal(formatMagnitude(6.4), 'M6.4');
  assert.equal(formatMagnitude(-1), 'M不明');
});

test('formatQuakeForClipboard formats JMA 551 earthquake cleanly', () => {
  const sample: JMAQuake551 = {
    id: 'q1',
    code: 551,
    time: '2026/11/25 08:44:35.416',
    earthquake: {
      domesticTsunami: 'None',
      maxScale: 40,
      time: '2026/11/25 08:40:00',
      hypocenter: {
        name: '東京湾',
        latitude: 35.5,
        longitude: 139.9,
        depth: 40,
        magnitude: 4.8,
      },
    },
    issue: {
      source: '気象庁',
      time: '2026/11/25 08:44:35',
      type: 'DetailScale',
    },
    points: [
      { pref: '東京都', addr: '千代田区大手町', isArea: false, scale: 40 },
    ],
  };

  const text = formatQuakeForClipboard(sample);
  assert.match(text, /【地震情報】各地の震度に関する情報/);
  assert.match(text, /震源地：東京湾/);
  assert.match(text, /最大震度：震度4/);
  assert.match(text, /規模：M4\.8/);
  assert.match(text, /深さ：約40km/);
  assert.match(text, /東京都（千代田区大手町）/);
});

test('createTestEEWPayload creates valid test EEW alerts in JST for all presets', () => {
  const fixedDate = new Date('2026-11-25T01:15:30Z'); // 10:15:30 JST
  const kanto = createTestEEWPayload('kanto_alert', fixedDate);
  assert.equal(kanto.code, 556);
  assert.equal(kanto.isTest, true);
  assert.equal(kanto.cancelled, false);
  assert.equal(kanto.earthquake?.hypocenter.name, '東京湾');
  assert.equal(kanto.time, '2026/11/25 10:15:30.000');

  const detection = createTestEEWPayload('eew_detection', fixedDate);
  assert.equal(detection.code, 554);
  assert.equal(detection.isTest, true);

  const cancelled = createTestEEWPayload('eew_cancelled', fixedDate);
  assert.equal(cancelled.code, 556);
  assert.equal(cancelled.cancelled, true);
});

test('mergeQuakeRecords deduplicates by id, preserves test records, and caps at 30', () => {
  const testRecord = createTestEEWPayload('kanto_alert', new Date('2026-11-25T12:00:00'));
  const liveRecords: P2PQuakeRecord[] = Array.from({ length: 35 }, (_, i) => ({
    id: `live-${i}`,
    code: 561,
    time: `2026/11/25 09:${String(i).padStart(2, '0')}:00.000`,
    area: 415,
  }));

  const merged = mergeQuakeRecords(liveRecords, [testRecord], 30);
  assert.equal(merged.length, 30);
  assert.equal(merged[0].id, testRecord.id);
  assert.equal(matchesFilter(testRecord, 'eew'), true);
  assert.equal(matchesFilter(liveRecords[0], 'other'), true);
});

test('resolveRecordId and mergeQuakeRecords assign unique non-empty IDs when id is missing', () => {
  assert.equal(resolveRecordId({ _id: { $oid: 'abc123' }, code: 551 }), 'abc123');
  const rawMissing = [
    { code: 561, time: '2026/11/25 10:00:00.000', area: 415 } as unknown as P2PQuakeRecord,
    { code: 561, time: '2026/11/25 10:01:00.000', area: 420 } as unknown as P2PQuakeRecord,
  ];
  const merged = mergeQuakeRecords(rawMissing, [], 30);
  assert.equal(merged.length, 2);
  assert.ok(merged[0].id && merged[0].id.length > 0);
  assert.ok(merged[1].id && merged[1].id.length > 0);
  assert.notEqual(merged[0].id, merged[1].id);
});
