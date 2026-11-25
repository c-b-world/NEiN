import assert from 'node:assert/strict';
import test from 'node:test';
import { buildEEWNotificationPayload } from './browserNotification.ts';
import { createTestEEWPayload } from './quakeParser.ts';

test('buildEEWNotificationPayload formats active 556 EEW with epicenter, scale, magnitude, and areas', () => {
  const eew = createTestEEWPayload('kanto_alert', new Date('2026-11-25T10:00:00+09:00'));
  const payload = buildEEWNotificationPayload(eew);
  assert.match(payload.title, /【テスト】緊急地震速報：東京湾/);
  assert.match(payload.title, /震度6弱/);
  assert.match(payload.body, /M6\.9/);
  assert.match(payload.body, /東京都２３区/);
  assert.equal(payload.requireInteraction, true);
});

test('buildEEWNotificationPayload formats cancelled 556 and 554 detection cleanly', () => {
  const cancelled = createTestEEWPayload('eew_cancelled');
  const cancelPayload = buildEEWNotificationPayload(cancelled);
  assert.match(cancelPayload.title, /取消/);
  assert.equal(cancelPayload.requireInteraction, false);

  const detected = createTestEEWPayload('eew_detection');
  const detectPayload = buildEEWNotificationPayload(detected);
  assert.match(detectPayload.title, /発表検出/);
  assert.equal(detectPayload.requireInteraction, true);
});
