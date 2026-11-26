import assert from 'node:assert/strict';
import test from 'node:test';
import {
  STARTUP_BRAND_INTRO_MS,
  STARTUP_TOTAL_DURATION_MS,
  computeStartupSplashState,
  getStartupSplashCopy,
} from './startupSplash.ts';

test('computeStartupSplashState transitions cleanly from brand intro to loading to done across 2.5s', () => {
  const start = computeStartupSplashState(0);
  assert.equal(start.phase, 'brand');
  assert.equal(start.progress, 0);

  const negative = computeStartupSplashState(-120);
  assert.equal(negative.phase, 'brand');
  assert.equal(negative.progress, 0);

  const justBeforeLoading = computeStartupSplashState(STARTUP_BRAND_INTRO_MS - 1);
  assert.equal(justBeforeLoading.phase, 'brand');
  assert.equal(justBeforeLoading.progress, 0);

  const loadingStart = computeStartupSplashState(STARTUP_BRAND_INTRO_MS);
  assert.equal(loadingStart.phase, 'loading');
  assert.equal(loadingStart.progress, 0);

  const loadingMid = computeStartupSplashState(1575);
  assert.equal(loadingMid.phase, 'loading');
  assert.ok(loadingMid.progress >= 40 && loadingMid.progress <= 65);
  assert.equal(loadingMid.loadingStepIndex, 1);

  const loadingNearEnd = computeStartupSplashState(STARTUP_TOTAL_DURATION_MS - 150);
  assert.equal(loadingNearEnd.phase, 'loading');
  assert.ok(loadingNearEnd.progress > loadingMid.progress);
  assert.equal(loadingNearEnd.loadingStepIndex, 2);

  const done = computeStartupSplashState(STARTUP_TOTAL_DURATION_MS);
  assert.equal(done.phase, 'done');
  assert.equal(done.progress, 100);

  const overrun = computeStartupSplashState(STARTUP_TOTAL_DURATION_MS + 1000);
  assert.equal(overrun.phase, 'done');
  assert.equal(overrun.progress, 100);
});

test('computeStartupSplashState progress is monotonically non-decreasing', () => {
  let prev = 0;
  for (let ms = 0; ms <= STARTUP_TOTAL_DURATION_MS; ms += 50) {
    const state = computeStartupSplashState(ms);
    assert.ok(state.progress >= prev, `Expected progress at ${ms}ms (${state.progress}) >= ${prev}`);
    prev = state.progress;
  }
  assert.equal(prev, 100);
});

test('getStartupSplashCopy returns complete localized strings for all 4 languages', () => {
  for (const lang of ['ja', 'en', 'zh', 'ko'] as const) {
    const copy = getStartupSplashCopy(lang);
    assert.ok(copy.subtitle.length > 0);
    assert.ok(copy.skipLabel.length > 0);
    assert.ok(copy.skipAriaLabel.length > 0);
    assert.ok(copy.loadingAriaLabel.length > 0);
    assert.equal(copy.steps.length, 3);
    for (const step of copy.steps) {
      assert.ok(step.length > 0);
    }
  }
});
