import assert from 'node:assert/strict';
import test from 'node:test';
import { buildUnifiedTimeline } from './disasterConfigStorage';
import { findMissingExtendedI18nKeys } from './i18nExtended';
import {
  buildHimawariTileUrl,
  computeVisibleTiles,
  findLiveObservationIndex,
  formatJmaCompactUtcToJst,
  jmaCompactUtcToIso,
} from './jmaTilesApi';
import {
  DEFAULT_NOTIFICATION_PREFS,
  recordAndDispatchNotification,
  shouldNotifyForScale,
} from './notificationCenter';
import { findNearestWeatherOffice } from './regionWatchlist';
import { getAllSourceHealth } from './sourceHealthTracker';

test('i18nExtended has complete key parity across ja, en, zh, and ko', () => {
  const missing = findMissingExtendedI18nKeys();
  assert.deepEqual(missing.ja, []);
  assert.deepEqual(missing.en, []);
  assert.deepEqual(missing.zh, []);
  assert.deepEqual(missing.ko, []);
});

test('sourceHealthTracker explicitly tracks unsupported static-CORS endpoints', () => {
  const all = getAllSourceHealth();
  const moe = all.find((s) => s.id === 'moe_wbgt_official');
  const mlit = all.find((s) => s.id === 'mlit_river_official');
  assert.equal(moe?.status, 'unsupported');
  assert.equal(mlit?.status, 'unsupported');
});

test('computeVisibleTiles & formatJmaCompactUtcToJst produce valid Web Mercator tiles and JST labels', () => {
  const tiles = computeVisibleTiles(35.69, 139.69, 5, 640, 480);
  assert.ok(tiles.length >= 4);
  for (const t of tiles) {
    assert.ok(t.x >= 0 && t.x < 32);
    assert.ok(t.y >= 0 && t.y < 32);
  }
  assert.equal(formatJmaCompactUtcToJst('20261101000000'), '11/01 09:00 JST');
});

test('findNearestWeatherOffice resolves Tokyo for Kanto coordinates locally', () => {
  const office = findNearestWeatherOffice(35.68, 139.76);
  assert.equal(office.officeCode, '130000');
});

test('notificationCenter deduplicates identical alerts and respects category & scale thresholds', () => {
  assert.equal(shouldNotifyForScale(20, 30, 'quake'), false);
  assert.equal(shouldNotifyForScale(40, 30, 'quake'), true);
  assert.equal(shouldNotifyForScale(10, 50, 'eew'), true);

  const uniqueId = `test-dedupe-${Date.now()}`;
  const first = recordAndDispatchNotification(
    {
      id: uniqueId,
      category: 'quake',
      title: 'Test Quake',
      body: 'Tokyo',
      timestampIso: new Date().toISOString(),
      isTest: true,
      statusTag: 'issued',
      severity: 'info',
    },
    DEFAULT_NOTIFICATION_PREFS,
  );
  const second = recordAndDispatchNotification(
    {
      id: uniqueId,
      category: 'quake',
      title: 'Test Quake',
      body: 'Tokyo',
      timestampIso: new Date().toISOString(),
      isTest: true,
      statusTag: 'issued',
      severity: 'info',
    },
    DEFAULT_NOTIFICATION_PREFS,
  );
  assert.equal(first, true);
  assert.equal(second, false);
});

test('buildUnifiedTimeline sorts mixed P2P, JMA Quake, Tsunami, and XML items newest-first', () => {
  const events = buildUnifiedTimeline({
    p2pRecords: [],
    jmaQuakes: [
      {
        id: 'jq1',
        eventId: '1',
        title: '震源・震度情報',
        enTitle: 'Earthquake',
        issueType: '発表',
        serial: '1',
        reportDatetime: '2026-11-01T10:00:00+09:00',
        originDatetime: '2026-11-01T09:58:00+09:00',
        epicenter: '能登半島',
        enEpicenter: 'Noto',
        coordinatesRaw: '',
        latitude: 37.5,
        longitude: 137.2,
        depthKm: 10,
        magnitude: 4.5,
        maxIntensity: '4',
        subKind: 'domestic',
        isCorrected: false,
        isCancelled: false,
        jsonFile: '',
      },
    ],
    jmaTsunamis: [
      {
        id: 'ts1',
        eventId: '2',
        title: '津波予報',
        enTitle: 'Tsunami Forecast',
        issueType: '発表',
        reportDatetime: '2026-11-01T12:00:00+09:00',
        validDatetime: null,
        originDatetime: null,
        epicenter: '宮城県沖',
        enEpicenter: 'Off Miyagi',
        magnitude: 6.2,
        jsonFile: '',
        headlineText: '若干の海面変動',
        highestSeverity: 'forecast',
        areas: [],
        observations: [],
      },
    ],
    xmlBulletins: [],
    lang: 'en',
  });

  assert.equal(events.length, 2);
  assert.equal(events[0].id, 'jmats:ts1');
  assert.equal(events[1].id, 'jmaq:jq1');
});

test('jmaTilesApi resolves live observation frame, ISO timestamps, and scales Himawari tiles when z > 6', () => {
  assert.equal(jmaCompactUtcToIso('20261126012000'), '2026-11-26T01:20:00Z');
  assert.equal(jmaCompactUtcToIso('invalid'), null);

  const merged = [
    { basetime: '20261126011000', validtime: '20261126011000', member: 'none', elements: ['hrpns'], labelJst: '' },
    { basetime: '20261126012000', validtime: '20261126012000', member: 'none', elements: ['hrpns'], labelJst: '' },
    { basetime: '20261126012000', validtime: '20261126013000', member: 'none', elements: ['hrpns'], labelJst: '' },
    { basetime: '20261126012000', validtime: '20261126022000', member: 'none', elements: ['hrpns'], labelJst: '' },
  ];
  assert.equal(findLiveObservationIndex(merged), 1);

  const satUrlZ8 = buildHimawariTileUrl(merged[1], 'B13', 8, 224, 100);
  assert.ok(satUrlZ8.endsWith('/B13/TBB/6/56/25.jpg'));
});

