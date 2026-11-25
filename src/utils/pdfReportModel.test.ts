import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPdfReportModel } from './pdfReportModel';
import type { JMAQuake551 } from '../types/quake';

test('buildPdfReportModel structures 551 earthquake metrics, municipalities, and filename cleanly', () => {
  const sample: JMAQuake551 = {
    id: 'pdf-test-1',
    code: 551,
    time: '2026/11/24 21:10:05.504',
    earthquake: {
      domesticTsunami: 'None',
      maxScale: 30,
      time: '2026/11/24 21:07:00',
      hypocenter: {
        name: '福島県沖',
        latitude: 37.3,
        longitude: 141.6,
        depth: 50,
        magnitude: 4.6,
      },
    },
    issue: {
      source: '気象庁',
      time: '2026/11/24 21:10:05',
      type: 'DetailScale',
    },
    points: [
      { pref: '福島県', addr: 'いわき市小名浜', isArea: false, scale: 30 },
      { pref: '福島県', addr: 'いわき市三和町', isArea: false, scale: 20 },
      { pref: '福島県', addr: '田村市常葉町', isArea: false, scale: 20 },
    ],
  };

  const model = buildPdfReportModel(sample, new Date('2026-11-25T02:00:00Z'));
  assert.equal(model.filename, 'NEiN_20261124_2107_福島県沖.pdf');
  assert.equal(model.title, '福島県沖');
  assert.equal(model.metrics[0].value, '震度3');
  assert.equal(model.metrics[1].value, 'M4.6');
  assert.equal(model.metrics[2].value, '約50km');
  assert.equal(model.scaleDistribution.totalCount, 3);
  assert.equal(model.municipalityGroups.length, 2);
  assert.deepEqual(model.municipalityGroups[1].prefectures[0].cities, [
    'いわき市',
    '田村市',
  ]);
  assert.equal(model.issuedAt, '2026/11/25 11:00:00 JST');
});
