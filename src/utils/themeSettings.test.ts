import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COLOR_THEME_OPTIONS,
  DEFAULT_THEME_SETTINGS,
  getColorThemeOption,
  isValidColorTheme,
  isValidThemeMode,
} from './themeSettings';

test('themeSettings validates dark/light modes and all 5 color theme ids', () => {
  assert.equal(DEFAULT_THEME_SETTINGS.mode, 'dark');
  assert.equal(DEFAULT_THEME_SETTINGS.colorTheme, 'sky');
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
