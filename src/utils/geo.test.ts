import test from 'node:test';
import assert from 'node:assert/strict';
import { JAPAN_BOUNDS, JAPAN_ISLANDS_LON_LAT, coordsToSvgPath, projectLatLon } from './geo';

test('projectLatLon places Tokyo inside bounds and in central Japan', () => {
  const tokyo = projectLatLon(35.68, 139.76);
  assert.equal(tokyo.inBounds, true);
  assert.ok(tokyo.x > JAPAN_BOUNDS.width * 0.5);
  assert.ok(tokyo.y > JAPAN_BOUNDS.height * 0.3 && tokyo.y < JAPAN_BOUNDS.height * 0.65);
});

test('projectLatLon orders Hokkaido north of Kyushu', () => {
  const sapporo = projectLatLon(43.06, 141.35);
  const kumamoto = projectLatLon(32.8, 130.7);
  assert.ok(sapporo.y < kumamoto.y);
  assert.ok(sapporo.x > kumamoto.x);
});

test('coordsToSvgPath builds valid closed SVG paths for all islands', () => {
  for (const island of JAPAN_ISLANDS_LON_LAT) {
    const path = coordsToSvgPath(island.coords);
    assert.ok(path.startsWith('M'));
    assert.ok(path.endsWith(' Z'));
  }
});
