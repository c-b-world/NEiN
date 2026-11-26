import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BACKGROUND_MOTION_OPTIONS,
  COLOR_THEME_OPTIONS,
  DEFAULT_THEME_SETTINGS,
  getBackgroundMotionOption,
  getColorThemeOption,
  isValidBackgroundMotion,
  isValidColorTheme,
  isValidThemeMode,
  resolveEffectiveBackgroundMotion,
} from './themeSettings';

test('themeSettings validates dark/light modes and all 5 color theme ids', () => {
  assert.equal(DEFAULT_THEME_SETTINGS.mode, 'dark');
  assert.equal(DEFAULT_THEME_SETTINGS.colorTheme, 'sky');
  assert.equal(DEFAULT_THEME_SETTINGS.backgroundMotion, 'off');
  assert.equal(isValidThemeMode('dark'), true);
  assert.equal(isValidThemeMode('light'), true);
  assert.equal(isValidThemeMode('sepia'), false);

  assert.equal(COLOR_THEME_OPTIONS.length, 5);
  for (const option of COLOR_THEME_OPTIONS) {
    assert.equal(isValidColorTheme(option.id), true);
    assert.equal(getColorThemeOption(option.id).id, option.id);
    assert.ok(option.darkAccent.startsWith('#'));
    assert.ok(option.lightAccent.startsWith('#'));
  }
  assert.equal(isValidColorTheme('invalid-theme'), false);
});

test('themeSettings validates background motion options and restricts space to dark mode', () => {
  assert.equal(BACKGROUND_MOTION_OPTIONS.length, 6);
  const expectedIds = ['off', 'spring', 'summer', 'autumn', 'winter', 'space'];
  assert.deepEqual(
    BACKGROUND_MOTION_OPTIONS.map((o) => o.id),
    expectedIds,
  );

  for (const opt of BACKGROUND_MOTION_OPTIONS) {
    assert.equal(isValidBackgroundMotion(opt.id), true);
    assert.equal(getBackgroundMotionOption(opt.id).id, opt.id);
    assert.ok(opt.label.ja && opt.label.en && opt.label.zh && opt.label.ko);
    assert.ok(opt.description.ja && opt.description.en && opt.description.zh && opt.description.ko);
  }
  assert.equal(isValidBackgroundMotion('rainy'), false);

  // Space is dark-mode only
  assert.equal(resolveEffectiveBackgroundMotion('space', 'dark'), 'space');
  assert.equal(resolveEffectiveBackgroundMotion('space', 'light'), 'off');

  // Seasonal motions work in both dark and light modes
  for (const season of ['spring', 'summer', 'autumn', 'winter'] as const) {
    assert.equal(resolveEffectiveBackgroundMotion(season, 'dark'), season);
    assert.equal(resolveEffectiveBackgroundMotion(season, 'light'), season);
  }
});
