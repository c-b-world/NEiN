import test from 'node:test';
import assert from 'node:assert/strict';
import { geoPath } from 'd3';
import {
  buildDistanceRingPath,
  createEpicenterProjection,
  getJapanAndNeighborFeatures,
  getNearbyCities,
  kmToGeoDegrees,
} from './d3MapUtils';

test('getJapanAndNeighborFeatures extracts Japan (392) from world-atlas 50m', () => {
  const { japan, neighbors } = getJapanAndNeighborFeatures();
  assert.ok(japan);
  assert.equal(String(japan.id), '392');
  assert.ok(neighbors.length > 0);
});

test('createEpicenterProjection centers accurately on epicenter in vicinity mode', () => {
  const proj = createEpicenterProjection({
    width: 640,
    height: 440,
    mode: 'vicinity',
    centerLat: 35.5,
    centerLon: 139.9,
  });
  const pt = proj([139.9, 35.5]);
  assert.ok(pt);
  assert.ok(Math.abs(pt[0] - 320) < 0.5);
  assert.ok(Math.abs(pt[1] - 220) < 0.5);
});

test('getNearbyCities finds Tokyo and Chiba closest to Tokyo Bay epicenter', () => {
  const nearby = getNearbyCities(35.5, 139.9, 3);
  assert.equal(nearby.length, 3);
  const names = nearby.map((c) => c.name);
  assert.ok(names.includes('東京'));
  assert.ok(names.includes('千葉'));
  assert.ok(nearby[0].distanceKm <= nearby[1].distanceKm);
});

test('buildDistanceRingPath creates valid SVG path for 50km geodesic ring', () => {
  const proj = createEpicenterProjection({
    width: 640,
    height: 440,
    mode: 'vicinity',
    centerLat: 32.2,
    centerLon: 130.4,
  });
  const pathGen = geoPath(proj);
  const d = buildDistanceRingPath(pathGen, 130.4, 32.2, 50);
  assert.ok(d && d.startsWith('M'));
  assert.ok(kmToGeoDegrees(50) > 0.4 && kmToGeoDegrees(50) < 0.5);
});
