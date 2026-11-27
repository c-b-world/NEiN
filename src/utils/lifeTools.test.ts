import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateAgeSummary,
  calculateSplitBill,
  calculateTaxAndDiscount,
  convertJapaneseEraToWesternYear,
  convertLifeUnit,
  convertWesternYearToJapaneseEra,
  countMemoStats,
  evaluateCalculatorExpression,
  formatCountdownSec,
  formatStopwatchMs,
  getZodiacForYear,
} from './lifeTools';

test('evaluateCalculatorExpression computes arithmetic safely with operator precedence and parentheses', () => {
  const res1 = evaluateCalculatorExpression('12 + 3 * 4');
  assert.equal(res1.ok, true);
  if (res1.ok) assert.equal(res1.value, 24);

  const res2 = evaluateCalculatorExpression('(12 + 3) × 4 ÷ 5');
  assert.equal(res2.ok, true);
  if (res2.ok) assert.equal(res2.value, 12);

  const res3 = evaluateCalculatorExpression('1000 * 10%');
  assert.equal(res3.ok, true);
  if (res3.ok) assert.equal(res3.value, 100);

  const res4 = evaluateCalculatorExpression('-25 + 10.5');
  assert.equal(res4.ok, true);
  if (res4.ok) assert.equal(res4.value, -14.5);

  const divZero = evaluateCalculatorExpression('10 / (5 - 5)');
  assert.equal(divZero.ok, false);
  if (!divZero.ok) assert.equal(divZero.error, 'div_zero');

  const syntaxErr = evaluateCalculatorExpression('10 + * 5');
  assert.equal(syntaxErr.ok, false);
  if (!syntaxErr.ok) assert.equal(syntaxErr.error, 'syntax');
});

test('calculateTaxAndDiscount handles 8%/10% exclusive and inclusive tax with discounts', () => {
  const excl = calculateTaxAndDiscount({
    baseAmount: 2000,
    discountPercent: 20,
    taxRatePercent: 10,
    mode: 'tax_excluded',
  });
  assert.equal(excl.discountSaved, 400);
  assert.equal(excl.discountedPrice, 1600);
  assert.equal(excl.taxAmount, 160);
  assert.equal(excl.totalWithTax, 1760);

  const incl = calculateTaxAndDiscount({
    baseAmount: 1080,
    discountPercent: 0,
    taxRatePercent: 8,
    mode: 'tax_included',
  });
  assert.equal(incl.preTaxAmount, 1000);
  assert.equal(incl.taxAmount, 80);
  assert.equal(incl.totalWithTax, 1080);
});

test('calculateSplitBill rounds per-person shares cleanly and balances organizer remainder', () => {
  const split = calculateSplitBill({
    totalAmount: 13500,
    peopleCount: 4,
    roundingUnit: 500,
    organizerDiscountYen: 0,
  });
  assert.equal(split.regularPerPerson, 3500);
  assert.equal(split.organizerAmount, 3000);
  assert.equal(split.collectedTotal, 13500);
  assert.equal(split.surplusOrShortfall, 0);

  const single = calculateSplitBill({
    totalAmount: 4200,
    peopleCount: 1,
    roundingUnit: 100,
  });
  assert.equal(single.regularPerPerson, 4200);
  assert.equal(single.organizerAmount, 4200);
});

test('convertLifeUnit converts length, temperature, cooking volume, area (tatami/tsubo), and speed', () => {
  assert.equal(convertLifeUnit(100, 'length', 'cm', 'm'), 1);
  assert.equal(convertLifeUnit(0, 'temperature', 'c', 'f'), 32);
  assert.equal(convertLifeUnit(212, 'temperature', 'f', 'c'), 100);
  assert.equal(convertLifeUnit(2, 'volume', 'tbsp', 'ml'), 30);
  assert.equal(convertLifeUnit(1, 'volume', 'cup_jp', 'ml'), 200);
  assert.equal(convertLifeUnit(16.2, 'area', 'sqm', 'tatami'), 10);
  assert.equal(convertLifeUnit(36, 'speed', 'kmh', 'ms'), 10);
});

test('Japanese era, western year, zodiac, and age converters work across Reiwa, Heisei, and Showa', () => {
  const reiwa8 = convertWesternYearToJapaneseEra(2026, 'ja');
  assert.equal(reiwa8?.eraId, 'reiwa');
  assert.equal(reiwa8?.eraYear, 8);
  assert.equal(reiwa8?.label, '令和8年');

  const reiwa1 = convertWesternYearToJapaneseEra(2019, 'ja');
  assert.equal(reiwa1?.label, '令和元年（1年）');

  assert.equal(convertJapaneseEraToWesternYear('heisei', 12), 2000);
  assert.equal(convertJapaneseEraToWesternYear('showa', 60), 1985);
  assert.equal(convertJapaneseEraToWesternYear('heisei', 99), null);

  assert.equal(getZodiacForYear(2026, 'en'), 'Horse');
  const age = calculateAgeSummary(1996, 2026);
  assert.equal(age.ageThisYear, 30);
  assert.equal(age.ageBeforeBirthday, 29);
});

test('formatCountdownSec, formatStopwatchMs, and countMemoStats format accurately', () => {
  assert.equal(formatCountdownSec(185), '03:05');
  assert.equal(formatCountdownSec(3661), '01:01:01');
  assert.equal(formatStopwatchMs(65430), '01:05.43');

  const stats = countMemoStats('こんにちは 世界\n2行目');
  assert.equal(stats.chars, 12);
  assert.equal(stats.charsNoSpaces, 10);
  assert.equal(stats.lines, 2);
  assert.equal(stats.manuscriptPages, 1);
});
