import test from 'node:test';
import assert from 'node:assert/strict';
import type { JmaTileTimeEntry } from '../types/disaster';
import {
  buildGsiFloodHazardTileUrl,
  buildJmaKikikuruTileUrl,
  buildJmaNowcTileUrl,
  buildJmaRasrfTileUrl,
  filterEntriesByElement,
  isTileOverJapanLand,
} from './jmaTilesApi';

const lidenOnlyEntry: JmaTileTimeEntry = {
  basetime: '20261126060500',
  validtime: '20261126060500',
  member: 'none',
  elements: ['liden'],
  labelJst: '11/26 15:05 JST',
};

const thunderEntry: JmaTileTimeEntry = {
  basetime: '20261126060000',
  validtime: '20261126061000',
  member: 'none',
  elements: ['thns', 'trns'],
  labelJst: '11/26 15:10 JST',
};

const rasrfEntry: JmaTileTimeEntry = {
  basetime: '20261126060000',
  validtime: '20261126070000',
  member: 'none',
  elements: ['rasrf', 'rasrf_point'],
  labelJst: '11/26 16:00 JST',
};

const riskEntry: JmaTileTimeEntry = {
  basetime: '20261126060000',
  validtime: '20261126060000',
  member: 'none',
  elements: ['land', 'inund', 'flood_mesh'],
  labelJst: '11/26 15:00 JST',
};

test('buildJmaNowcTileUrl returns null when entry lacks thns/trns element (liden-only frame)', () => {
  assert.equal(buildJmaNowcTileUrl(lidenOnlyEntry, 'thns', 5, 28, 12), null);
  assert.equal(buildJmaNowcTileUrl(lidenOnlyEntry, 'trns', 5, 28, 12), null);
  assert.ok(buildJmaNowcTileUrl(thunderEntry, 'thns', 5, 28, 12)?.includes('/surf/thns/5/28/12.png'));
  assert.ok(buildJmaNowcTileUrl(thunderEntry, 'trns', 5, 28, 12)?.includes('/surf/trns/5/28/12.png'));
});

test('filterEntriesByElement excludes entries missing the target element', () => {
  const filtered = filterEntriesByElement([lidenOnlyEntry, thunderEntry], 'thns');
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].validtime, thunderEntry.validtime);
});

test('buildJmaRasrfTileUrl and buildJmaKikikuruTileUrl validate elements and clamp high zoom', () => {
  assert.equal(buildJmaRasrfTileUrl(lidenOnlyEntry, 5, 28, 12), null);
  assert.ok(buildJmaRasrfTileUrl(rasrfEntry, 5, 28, 12)?.includes('/surf/rasrf/5/28/12.png'));
  assert.ok(buildJmaKikikuruTileUrl(riskEntry, 'land', 5, 28, 12)?.includes('/none/20261126060000/surf/land/5/28/12.png'));
  assert.ok(buildJmaKikikuruTileUrl(riskEntry, 'inund', 12, 3632, 1600)?.includes('/surf/inund/10/'));
});

test('buildGsiFloodHazardTileUrl skips far-ocean tiles outside Japan bounds', () => {
  // All 5 valid z=5 GSI flood hazard tiles over Japan pass
  for (const [x, y] of [
    [28, 11],
    [27, 12],
    [28, 12],
    [26, 13],
    [27, 13],
  ]) {
    assert.equal(isTileOverJapanLand(5, x, y), true, `expected 5/${x}/${y} to be over Japan`);
    assert.ok(buildGsiFloodHazardTileUrl(5, x, y)?.includes(`/5/${x}/${y}.png`));
  }
  // Pacific ocean tiles (5/28/13, 5/30/13) are outside Japan land
  assert.equal(isTileOverJapanLand(5, 28, 13), false);
  assert.equal(buildGsiFloodHazardTileUrl(5, 28, 13), null);
  assert.equal(isTileOverJapanLand(5, 30, 13), false);
  assert.equal(buildGsiFloodHazardTileUrl(5, 30, 13), null);
});
