import assert from 'node:assert/strict';
import test from 'node:test';
import {
  type AppLanguage,
  LANGUAGE_OPTIONS,
  MESSAGES,
  getMessages,
  isValidLanguage,
} from './i18n';

test('i18n exposes ja, en, zh, ko messages with NEiN QUACK nav label preserved', () => {
  const langs: AppLanguage[] = ['ja', 'en', 'zh', 'ko'];
  assert.equal(LANGUAGE_OPTIONS.length, 4);

  for (const lang of langs) {
    assert.equal(isValidLanguage(lang), true);
    const msg = getMessages(lang);
    assert.equal(msg, MESSAGES[lang]);
    assert.equal(msg.nav.quack, 'NEiN QUACK');
    assert.equal(msg.nav.weather, 'NEiN WEATHER');
    assert.ok(msg.detail.adviceMindsetTitle.length > 0);
    assert.ok(msg.detail.adviceStockpileTitle.length > 0);
    assert.equal(msg.calendar.weekdays.length, 7);
  }

  assert.equal(isValidLanguage('fr'), false);
  assert.equal(isValidLanguage(null), false);
});
