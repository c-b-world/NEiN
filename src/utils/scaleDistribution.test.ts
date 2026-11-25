import test from 'node:test';
import assert from 'node:assert/strict';
import type { JMAQuake551, Userquake561 } from '../types/quake';
import { createTestEEWPayload } from './quakeParser';
import { buildScaleDistribution } from './scaleDistribution';

test('buildScaleDistribution aggregates 551 observation points across JMA scales', () => {
  const sample: JMAQuake551 = {
    id: 'q-dist-1',
    code: 551,
    time: '2026/11/25 10:00:00.000',
    earthquake: {
      maxScale: 30,
      time: '2026/11/25 09:56:00',
      hypocenter: {
        name: '福島県沖',
        latitude: 37.5,
        longitude: 141.5,
        depth: 40,
        magnitude: 4.9,
      },
    },
    issue: {
      source: '気象庁',
      time: '2026/11/25 10:00:00',
      type: 'DetailScale',
    },
    points: [
      { pref: '福島県', addr: 'いわき市', isArea: false, scale: 30 },
      { pref: '福島県', addr: '相馬市', isArea: false, scale: 30 },
      { pref: '宮城県', addr: '名取市', isArea: false, scale: 20 },
      { pref: '茨城県', addr: '日立市', isArea: false, scale: 10 },
    ],
  };

  const result = buildScaleDistribution(sample);
  assert.equal(result.totalCount, 4);
  assert.equal(result.unitLabel, '地点');
  assert.equal(result.bins.length, 9);

  const scale30 = result.bins.find((b) => b.scale === 30);
  assert.equal(scale30?.count, 2);
  assert.deepEqual(scale30?.prefectures, ['福島県']);

  const scale20 = result.bins.find((b) => b.scale === 20);
  assert.equal(scale20?.count, 1);
});

test('buildScaleDistribution aggregates 556 EEW target areas by predicted scale', () => {
  const eew = createTestEEWPayload('kanto_alert', new Date('2026-11-25T01:00:00Z'));
  const result = buildScaleDistribution(eew);
  assert.equal(result.totalCount, 4);
  assert.equal(result.unitLabel, '地域');
  const scale55 = result.bins.find((b) => b.scale === 55);
  assert.equal(scale55?.count, 2);
});

test('buildScaleDistribution returns 0 total for records without scale points', () => {
  const userquake: Userquake561 = {
    id: 'uq-1',
    code: 561,
    time: '2026/11/25 10:00:00.000',
    area: 415,
  };
  const result = buildScaleDistribution(userquake);
  assert.equal(result.totalCount, 0);
  assert.equal(result.bins.length, 9);
});
