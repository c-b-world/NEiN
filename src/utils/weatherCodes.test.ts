import assert from 'node:assert/strict';
import test from 'node:test';
import {
  decodeJmaWarningCode,
  describeJmaWeatherCode,
  describeWmoWeatherCode,
  formatAmedasWindDirection,
  formatDegreesToCompass,
} from './weatherCodes.ts';

test('decodeJmaWarningCode distinguishes special warnings, warnings, danger warnings, and advisories', () => {
  const special = decodeJmaWarningCode('33');
  assert.equal(special.name, '大雨特別警報');
  assert.equal(special.level, 'special');

  const stormSpecial = decodeJmaWarningCode('35');
  assert.equal(stormSpecial.name, '暴風特別警報');
  assert.equal(stormSpecial.level, 'special');

  const landslideSpecial = decodeJmaWarningCode('39');
  assert.equal(landslideSpecial.name, '土砂災害特別警報');
  assert.equal(landslideSpecial.level, 'special');

  const dangerWarn = decodeJmaWarningCode('43');
  assert.equal(dangerWarn.name, '大雨危険警報');
  assert.equal(dangerWarn.level, 'warning');

  const warn = decodeJmaWarningCode('03');
  assert.equal(warn.name, '大雨警報');
  assert.equal(warn.level, 'warning');

  const adv = decodeJmaWarningCode('14');
  assert.equal(adv.name, '雷注意報');
  assert.equal(adv.level, 'advisory');
});

test('describeJmaWeatherCode and describeWmoWeatherCode map core weather codes cleanly', () => {
  assert.equal(describeJmaWeatherCode('100').label, '晴れ');
  assert.equal(describeJmaWeatherCode('300').kind, 'rain');
  assert.equal(describeWmoWeatherCode(0).label, '快晴');
  assert.equal(describeWmoWeatherCode(95).kind, 'thunder');
});

test('wind direction formatters handle calm, 16-point compass, and degree inputs', () => {
  assert.equal(formatAmedasWindDirection(0), '静穏');
  assert.equal(formatAmedasWindDirection(16), '北');
  assert.equal(formatAmedasWindDirection(4), '東');
  assert.equal(formatDegreesToCompass(0), '北');
  assert.equal(formatDegreesToCompass(90), '東');
  assert.equal(formatDegreesToCompass(180), '南');
});
