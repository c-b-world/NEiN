import assert from 'node:assert/strict';
import test from 'node:test';
import type { JMAQuake551, JMATsunami552 } from '../types/quake';
import {
  buildEarthquakePreparednessAdvice,
  getEarthquakeSeverityTier,
} from './earthquakeAdvice';
import type { AppLanguage } from './i18n';
import { createTestEEWPayload } from './quakeParser';

function makeQuake551(
  maxScale: number,
  magnitude: number,
  domesticTsunami: JMAQuake551['earthquake']['domesticTsunami'] = 'None'
): JMAQuake551 {
  return {
    id: `q-${maxScale}-${magnitude}`,
    code: 551,
    time: '2026/11/25 12:00:00',
    earthquake: {
      domesticTsunami,
      maxScale,
      time: '2026/11/25 11:58:00',
      hypocenter: {
        name: 'テスト震源',
        latitude: 35.6,
        longitude: 139.8,
        depth: 25,
        magnitude,
      },
    },
    issue: {
      source: '気象庁',
      time: '2026/11/25 12:00:00',
      type: 'DetailScale',
    },
  };
}

test('getEarthquakeSeverityTier classifies scale, magnitude, tsunami, and EEW correctly', () => {
  assert.deepEqual(getEarthquakeSeverityTier(makeQuake551(60, 7.2, 'Warning')), {
    tier: 'critical',
    hasTsunamiRisk: true,
  });

  assert.deepEqual(getEarthquakeSeverityTier(makeQuake551(50, 5.8, 'None')), {
    tier: 'strong',
    hasTsunamiRisk: false,
  });

  assert.deepEqual(getEarthquakeSeverityTier(makeQuake551(30, 4.2, 'None')), {
    tier: 'moderate',
    hasTsunamiRisk: false,
  });

  assert.deepEqual(getEarthquakeSeverityTier(makeQuake551(10, 2.3, 'None')), {
    tier: 'routine',
    hasTsunamiRisk: false,
  });

  const tsunamiWarn: JMATsunami552 = {
    id: 'tsu-1',
    code: 552,
    time: '2026/11/25 12:05:00',
    cancelled: false,
    issue: { source: '気象庁', time: '2026/11/25 12:05:00', type: 'Focus' },
    areas: [{ grade: 'Warning', immediate: true, name: '相模湾' }],
  };
  assert.deepEqual(getEarthquakeSeverityTier(tsunamiWarn), {
    tier: 'critical',
    hasTsunamiRisk: true,
  });

  const eewCancel = createTestEEWPayload('eew_cancelled');
  assert.deepEqual(getEarthquakeSeverityTier(eewCancel), {
    tier: 'routine',
    hasTsunamiRisk: false,
  });
});

test('buildEarthquakePreparednessAdvice returns evacuation mindset & stockpile chips in all 4 languages', () => {
  const langs: AppLanguage[] = ['ja', 'en', 'zh', 'ko'];
  const strongQuake = makeQuake551(55, 7.1, 'Warning');

  for (const lang of langs) {
    const advice = buildEarthquakePreparednessAdvice(strongQuake, lang);
    assert.equal(advice.tier, 'critical');
    assert.equal(advice.hasTsunamiRisk, true);
    assert.ok(advice.tierLabel.length > 0);
    assert.ok(advice.summary.length > 0);
    assert.ok(advice.evacuationMindset.length >= 3);
    assert.equal(advice.evacuationMindset[0].id, 'tsunami-high-ground');
    assert.ok(advice.stockpileAdvice.length >= 2);
  }
});
