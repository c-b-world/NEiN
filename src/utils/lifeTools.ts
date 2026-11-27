import type { AppLanguage } from './i18n';

// ============================================================================
// 1. Safe Arithmetic Expression Evaluator (No eval / Function)
// ============================================================================

export type CalcEvalResult =
  | { ok: true; value: number; formatted: string }
  | { ok: false; error: 'empty' | 'syntax' | 'div_zero' | 'overflow' };

type Token =
  | { kind: 'num'; value: number }
  | { kind: 'op'; value: '+' | '-' | '*' | '/' | '%' }
  | { kind: 'lparen' }
  | { kind: 'rparen' };

function tokenizeExpression(raw: string): Token[] | null {
  const normalized = raw
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/＋/g, '+')
    .replace(/,/g, '')
    .trim();

  if (!normalized) return [];

  const tokens: Token[] = [];
  let i = 0;

  while (i < normalized.length) {
    const ch = normalized[i];
    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let numStr = '';
      let dotCount = 0;
      while (i < normalized.length && /[0-9.]/.test(normalized[i])) {
        if (normalized[i] === '.') dotCount += 1;
        if (dotCount > 1) return null;
        numStr += normalized[i];
        i += 1;
      }
      if (numStr === '.') return null;
      const val = Number(numStr);
      if (!Number.isFinite(val)) return null;
      tokens.push({ kind: 'num', value: val });
      continue;
    }
    if (ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '%') {
      tokens.push({ kind: 'op', value: ch });
      i += 1;
      continue;
    }
    if (ch === '(') {
      tokens.push({ kind: 'lparen' });
      i += 1;
      continue;
    }
    if (ch === ')') {
      tokens.push({ kind: 'rparen' });
      i += 1;
      continue;
    }
    return null;
  }

  return tokens;
}

export function formatCalcNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';
  const rounded = Math.abs(value) < 1e-12 ? 0 : Number(value.toPrecision(12));
  if (Math.abs(rounded) >= 1e12 || (Math.abs(rounded) > 0 && Math.abs(rounded) < 1e-6)) {
    return rounded.toExponential(6).replace(/\.?0+e/, 'e');
  }
  return String(rounded);
}

/**
 * Evaluates a standard arithmetic expression (+, -, *, /, %, parentheses, unary +/-)
 * using a safe recursive-descent parser.
 */
export function evaluateCalculatorExpression(expression: string): CalcEvalResult {
  const tokens = tokenizeExpression(expression);
  if (tokens === null) return { ok: false, error: 'syntax' };
  if (tokens.length === 0) return { ok: false, error: 'empty' };

  let pos = 0;
  let divZero = false;

  const peek = (): Token | undefined => tokens[pos];
  const consume = (): Token => tokens[pos++];

  const parseExpr = (): number | null => {
    let left = parseTerm();
    if (left === null) return null;
    while (true) {
      const next = peek();
      if (next?.kind === 'op' && (next.value === '+' || next.value === '-')) {
        consume();
        const right = parseTerm();
        if (right === null) return null;
        left = next.value === '+' ? left + right : left - right;
      } else {
        break;
      }
    }
    return left;
  };

  const parseTerm = (): number | null => {
    let left = parseUnary();
    if (left === null) return null;
    while (true) {
      const next = peek();
      if (next?.kind === 'op' && (next.value === '*' || next.value === '/')) {
        consume();
        const right = parseUnary();
        if (right === null) return null;
        if (next.value === '/') {
          if (right === 0) {
            divZero = true;
            return null;
          }
          left /= right;
        } else {
          left *= right;
        }
      } else {
        break;
      }
    }
    return left;
  };

  const parseUnary = (): number | null => {
    const next = peek();
    if (next?.kind === 'op' && (next.value === '+' || next.value === '-')) {
      consume();
      const val = parseUnary();
      if (val === null) return null;
      return next.value === '-' ? -val : val;
    }
    return parsePostfix();
  };

  const parsePostfix = (): number | null => {
    let val = parsePrimary();
    if (val === null) return null;
    while (peek()?.kind === 'op' && (peek() as { kind: 'op'; value: string }).value === '%') {
      consume();
      val /= 100;
    }
    return val;
  };

  const parsePrimary = (): number | null => {
    const next = peek();
    if (!next) return null;
    if (next.kind === 'num') {
      consume();
      return next.value;
    }
    if (next.kind === 'lparen') {
      consume();
      const inner = parseExpr();
      if (inner === null) return null;
      if (peek()?.kind !== 'rparen') return null;
      consume();
      return inner;
    }
    return null;
  };

  const result = parseExpr();
  if (divZero) return { ok: false, error: 'div_zero' };
  if (result === null || pos !== tokens.length) return { ok: false, error: 'syntax' };
  if (!Number.isFinite(result)) return { ok: false, error: 'overflow' };

  return {
    ok: true,
    value: Math.abs(result) < 1e-12 ? 0 : Number(result.toPrecision(12)),
    formatted: formatCalcNumber(result),
  };
}

// ============================================================================
// 2. Tax, Discount & Split Bill Calculators
// ============================================================================

export interface TaxDiscountInput {
  baseAmount: number;
  discountPercent: number; // 0 .. 99
  taxRatePercent: number; // e.g., 10, 8, 0
  mode: 'tax_excluded' | 'tax_included';
}

export interface TaxDiscountResult {
  discountedPrice: number;
  discountSaved: number;
  preTaxAmount: number;
  taxAmount: number;
  totalWithTax: number;
}

export function calculateTaxAndDiscount(input: TaxDiscountInput): TaxDiscountResult {
  const base = Number.isFinite(input.baseAmount) && input.baseAmount > 0 ? input.baseAmount : 0;
  const discPct = Math.max(0, Math.min(99, Number.isFinite(input.discountPercent) ? input.discountPercent : 0));
  const taxPct = Math.max(0, Math.min(50, Number.isFinite(input.taxRatePercent) ? input.taxRatePercent : 0));

  const discountSaved = Math.floor(base * (discPct / 100));
  const discountedPrice = Math.max(0, base - discountSaved);

  if (input.mode === 'tax_included') {
    const preTaxAmount = Math.round(discountedPrice / (1 + taxPct / 100));
    const taxAmount = Math.max(0, discountedPrice - preTaxAmount);
    return {
      discountedPrice,
      discountSaved,
      preTaxAmount,
      taxAmount,
      totalWithTax: discountedPrice,
    };
  }

  const taxAmount = Math.floor(discountedPrice * (taxPct / 100));
  const totalWithTax = discountedPrice + taxAmount;
  return {
    discountedPrice,
    discountSaved,
    preTaxAmount: discountedPrice,
    taxAmount,
    totalWithTax,
  };
}

export type SplitRoundingUnit = 1 | 10 | 100 | 500 | 1000;

export interface SplitBillInput {
  totalAmount: number;
  peopleCount: number;
  roundingUnit: SplitRoundingUnit;
  organizerDiscountYen?: number; // positive = organizer pays less; negative = organizer pays more
}

export interface SplitBillResult {
  exactPerPerson: number;
  regularPerPerson: number;
  organizerAmount: number;
  collectedTotal: number;
  surplusOrShortfall: number; // positive = extra tip/change, negative = shortfall covered by organizer
  peopleCount: number;
}

export function calculateSplitBill(input: SplitBillInput): SplitBillResult {
  const total = Math.max(0, Math.round(Number.isFinite(input.totalAmount) ? input.totalAmount : 0));
  const people = Math.max(1, Math.min(999, Math.floor(Number.isFinite(input.peopleCount) ? input.peopleCount : 1)));
  const unit = input.roundingUnit || 1;
  const orgOffset = Math.round(Number.isFinite(input.organizerDiscountYen ?? 0) ? (input.organizerDiscountYen ?? 0) : 0);

  const exactPerPerson = total / people;
  if (people === 1) {
    return {
      exactPerPerson: total,
      regularPerPerson: total,
      organizerAmount: total,
      collectedTotal: total,
      surplusOrShortfall: 0,
      peopleCount: 1,
    };
  }

  // Round each non-organizer member's share to the selected unit (ceiling when needed if no offset)
  const targetRegular = Math.max(0, (total + orgOffset) / people);
  const regularPerPerson = Math.ceil(targetRegular / unit) * unit;
  const othersTotal = regularPerPerson * (people - 1);
  const organizerAmount = Math.max(0, total - othersTotal);
  const collectedTotal = othersTotal + organizerAmount;

  return {
    exactPerPerson: Math.round(exactPerPerson * 10) / 10,
    regularPerPerson,
    organizerAmount,
    collectedTotal,
    surplusOrShortfall: collectedTotal - total,
    peopleCount: people,
  };
}

// ============================================================================
// 3. Everyday Unit Converter
// ============================================================================

export type UnitCategoryId = 'length' | 'weight' | 'temperature' | 'volume' | 'area' | 'speed';

export interface UnitDef {
  id: string;
  symbol: string;
  labels: Record<AppLanguage, string>;
  /** Factor to convert 1 unit into the category's SI base unit (ignored for temperature) */
  toBase: number;
}

export interface UnitCategoryDef {
  id: UnitCategoryId;
  labels: Record<AppLanguage, string>;
  defaultFrom: string;
  defaultTo: string;
  units: UnitDef[];
}

export const UNIT_CATEGORIES: UnitCategoryDef[] = [
  {
    id: 'length',
    labels: { ja: '長さ', en: 'Length', zh: '长度', ko: '길이' },
    defaultFrom: 'cm',
    defaultTo: 'inch',
    units: [
      { id: 'mm', symbol: 'mm', labels: { ja: 'ミリメートル', en: 'Millimeter', zh: '毫米', ko: '밀리미터' }, toBase: 0.001 },
      { id: 'cm', symbol: 'cm', labels: { ja: 'センチメートル', en: 'Centimeter', zh: '厘米', ko: '센티미터' }, toBase: 0.01 },
      { id: 'm', symbol: 'm', labels: { ja: 'メートル', en: 'Meter', zh: '米', ko: '미터' }, toBase: 1 },
      { id: 'km', symbol: 'km', labels: { ja: 'キロメートル', en: 'Kilometer', zh: '千米', ko: '킬로미터' }, toBase: 1000 },
      { id: 'inch', symbol: 'in', labels: { ja: 'インチ', en: 'Inch', zh: '英寸', ko: '인치' }, toBase: 0.0254 },
      { id: 'ft', symbol: 'ft', labels: { ja: 'フィート', en: 'Foot', zh: '英尺', ko: '피트' }, toBase: 0.3048 },
      { id: 'mile', symbol: 'mi', labels: { ja: 'マイル', en: 'Mile', zh: '英里', ko: '마일' }, toBase: 1609.344 },
    ],
  },
  {
    id: 'weight',
    labels: { ja: '重さ', en: 'Weight', zh: '重量', ko: '무게' },
    defaultFrom: 'kg',
    defaultTo: 'lb',
    units: [
      { id: 'g', symbol: 'g', labels: { ja: 'グラム', en: 'Gram', zh: '克', ko: '그램' }, toBase: 0.001 },
      { id: 'kg', symbol: 'kg', labels: { ja: 'キログラム', en: 'Kilogram', zh: '千克', ko: '킬로그램' }, toBase: 1 },
      { id: 'oz', symbol: 'oz', labels: { ja: 'オンス', en: 'Ounce', zh: '盎司', ko: '온스' }, toBase: 0.028349523125 },
      { id: 'lb', symbol: 'lb', labels: { ja: 'ポンド', en: 'Pound', zh: '磅', ko: '파운드' }, toBase: 0.45359237 },
    ],
  },
  {
    id: 'temperature',
    labels: { ja: '温度', en: 'Temperature', zh: '温度', ko: '온도' },
    defaultFrom: 'c',
    defaultTo: 'f',
    units: [
      { id: 'c', symbol: '°C', labels: { ja: '摂氏 (°C)', en: 'Celsius (°C)', zh: '摄氏度 (°C)', ko: '섭씨 (°C)' }, toBase: 1 },
      { id: 'f', symbol: '°F', labels: { ja: '華氏 (°F)', en: 'Fahrenheit (°F)', zh: '华氏度 (°F)', ko: '화씨 (°F)' }, toBase: 1 },
      { id: 'k', symbol: 'K', labels: { ja: 'ケルビン (K)', en: 'Kelvin (K)', zh: '开尔文 (K)', ko: '켈빈 (K)' }, toBase: 1 },
    ],
  },
  {
    id: 'volume',
    labels: { ja: '料理・体積', en: 'Cooking & Volume', zh: '烹饪・体积', ko: '요리・부피' },
    defaultFrom: 'tbsp',
    defaultTo: 'ml',
    units: [
      { id: 'ml', symbol: 'mL', labels: { ja: 'ミリリットル (mL)', en: 'Milliliter (mL)', zh: '毫升 (mL)', ko: '밀리리터 (mL)' }, toBase: 1 },
      { id: 'l', symbol: 'L', labels: { ja: 'リットル (L)', en: 'Liter (L)', zh: '升 (L)', ko: '리터 (L)' }, toBase: 1000 },
      { id: 'tsp', symbol: '小さじ', labels: { ja: '小さじ (5mL)', en: 'Teaspoon (5mL)', zh: '茶匙 (5mL)', ko: '작은술 (5mL)' }, toBase: 5 },
      { id: 'tbsp', symbol: '大さじ', labels: { ja: '大さじ (15mL)', en: 'Tablespoon (15mL)', zh: '汤匙 (15mL)', ko: '큰술 (15mL)' }, toBase: 15 },
      { id: 'cup_jp', symbol: 'カップ(JP)', labels: { ja: '計量カップ (200mL)', en: 'Japanese Cup (200mL)', zh: '日式量杯 (200mL)', ko: '계량컵 (200mL)' }, toBase: 200 },
      { id: 'go', symbol: '合', labels: { ja: '合 (180mL)', en: 'Go (180mL)', zh: '合 (180mL)', ko: '홉 (180mL)' }, toBase: 180 },
      { id: 'floz', symbol: 'fl oz', labels: { ja: '液量オンス (US)', en: 'Fluid Ounce (US)', zh: '美制液盎司', ko: '액량 온스 (US)' }, toBase: 29.5735296 },
    ],
  },
  {
    id: 'area',
    labels: { ja: '広さ・面積', en: 'Area', zh: '面积', ko: '면적' },
    defaultFrom: 'sqm',
    defaultTo: 'tatami',
    units: [
      { id: 'sqm', symbol: 'm²', labels: { ja: '平方メートル (m²)', en: 'Square Meter (m²)', zh: '平方米 (m²)', ko: '제곱미터 (m²)' }, toBase: 1 },
      { id: 'tatami', symbol: '畳', labels: { ja: '畳 (約1.62m²)', en: 'Tatami Mat (1.62m²)', zh: '榻榻米/叠 (1.62m²)', ko: '다다미 (1.62m²)' }, toBase: 1.62 },
      { id: 'tsubo', symbol: '坪', labels: { ja: '坪 (約3.306m²)', en: 'Tsubo (3.306m²)', zh: '坪 (3.306m²)', ko: '평 (3.306m²)' }, toBase: 3.305785 },
      { id: 'ha', symbol: 'ha', labels: { ja: 'ヘクタール (ha)', en: 'Hectare (ha)', zh: '公顷 (ha)', ko: '헥타르 (ha)' }, toBase: 10000 },
      { id: 'sqft', symbol: 'ft²', labels: { ja: '平方フィート (ft²)', en: 'Square Foot (ft²)', zh: '平方英尺 (ft²)', ko: '제곱피트 (ft²)' }, toBase: 0.09290304 },
    ],
  },
  {
    id: 'speed',
    labels: { ja: '速度', en: 'Speed', zh: '速度', ko: '속도' },
    defaultFrom: 'kmh',
    defaultTo: 'ms',
    units: [
      { id: 'kmh', symbol: 'km/h', labels: { ja: '時速 (km/h)', en: 'km/h', zh: '千米/时 (km/h)', ko: '시속 (km/h)' }, toBase: 1 / 3.6 },
      { id: 'ms', symbol: 'm/s', labels: { ja: '秒速 (m/s)', en: 'm/s', zh: '米/秒 (m/s)', ko: '초속 (m/s)' }, toBase: 1 },
      { id: 'mph', symbol: 'mph', labels: { ja: 'マイル毎時 (mph)', en: 'mph', zh: '英里/时 (mph)', ko: '마일/시 (mph)' }, toBase: 0.44704 },
      { id: 'knot', symbol: 'kt', labels: { ja: 'ノット (kt)', en: 'Knot (kt)', zh: '节 (kt)', ko: '노트 (kt)' }, toBase: 0.514444444 },
    ],
  },
];

export function convertLifeUnit(
  value: number,
  categoryId: UnitCategoryId,
  fromUnitId: string,
  toUnitId: string,
): number | null {
  if (!Number.isFinite(value)) return null;

  if (categoryId === 'temperature') {
    let celsius: number;
    if (fromUnitId === 'c') celsius = value;
    else if (fromUnitId === 'f') celsius = ((value - 32) * 5) / 9;
    else if (fromUnitId === 'k') celsius = value - 273.15;
    else return null;

    let result: number;
    if (toUnitId === 'c') result = celsius;
    else if (toUnitId === 'f') result = (celsius * 9) / 5 + 32;
    else if (toUnitId === 'k') result = celsius + 273.15;
    else return null;

    return Math.round(result * 10000) / 10000;
  }

  const category = UNIT_CATEGORIES.find((c) => c.id === categoryId);
  if (!category) return null;
  const fromUnit = category.units.find((u) => u.id === fromUnitId);
  const toUnit = category.units.find((u) => u.id === toUnitId);
  if (!fromUnit || !toUnit) return null;

  const baseValue = value * fromUnit.toBase;
  const converted = baseValue / toUnit.toBase;
  return Math.round(converted * 100000) / 100000;
}

// ============================================================================
// 4. Japanese Era (和暦) ⇔ Western Year (西暦), Zodiac & Age Converter
// ============================================================================

export type JapaneseEraId = 'reiwa' | 'heisei' | 'showa' | 'taisho' | 'meiji';

export interface JapaneseEraDef {
  id: JapaneseEraId;
  startYear: number;
  endYear: number | null;
  labels: Record<AppLanguage, string>;
}

export const JAPANESE_ERAS: JapaneseEraDef[] = [
  { id: 'reiwa', startYear: 2019, endYear: null, labels: { ja: '令和', en: 'Reiwa', zh: '令和', ko: '레이와' } },
  { id: 'heisei', startYear: 1989, endYear: 2019, labels: { ja: '平成', en: 'Heisei', zh: '平成', ko: '헤이세이' } },
  { id: 'showa', startYear: 1926, endYear: 1989, labels: { ja: '昭和', en: 'Showa', zh: '昭和', ko: '쇼와' } },
  { id: 'taisho', startYear: 1912, endYear: 1926, labels: { ja: '大正', en: 'Taisho', zh: '大正', ko: '다이쇼' } },
  { id: 'meiji', startYear: 1868, endYear: 1912, labels: { ja: '明治', en: 'Meiji', zh: '明治', ko: '메이지' } },
];

const ZODIAC_LIST: Array<Record<AppLanguage, string>> = [
  { ja: '子（ねずみ）', en: 'Rat', zh: '鼠', ko: '쥐' },
  { ja: '丑（うし）', en: 'Ox', zh: '牛', ko: '소' },
  { ja: '寅（とら）', en: 'Tiger', zh: '虎', ko: '호랑이' },
  { ja: '卯（うさぎ）', en: 'Rabbit', zh: '兔', ko: '토끼' },
  { ja: '辰（たつ）', en: 'Dragon', zh: '龙', ko: '용' },
  { ja: '巳（へび）', en: 'Snake', zh: '蛇', ko: '뱀' },
  { ja: '午（うま）', en: 'Horse', zh: '马', ko: '말' },
  { ja: '未（ひつじ）', en: 'Sheep', zh: '羊', ko: '양' },
  { ja: '申（さる）', en: 'Monkey', zh: '猴', ko: '원숭이' },
  { ja: '酉（とり）', en: 'Rooster', zh: '鸡', ko: '닭' },
  { ja: '戌（いぬ）', en: 'Dog', zh: '狗', ko: '개' },
  { ja: '亥（いのしし）', en: 'Boar', zh: '猪', ko: '돼지' },
];

export interface JapaneseEraMatch {
  eraId: JapaneseEraId;
  eraYear: number;
  label: string;
}

export function convertWesternYearToJapaneseEra(
  year: number,
  lang: AppLanguage = 'ja',
): JapaneseEraMatch | null {
  if (!Number.isInteger(year) || year < 1868 || year > 2200) return null;
  for (const era of JAPANESE_ERAS) {
    if (year >= era.startYear) {
      const eraYear = year - era.startYear + 1;
      const eraName = era.labels[lang];
      const label =
        lang === 'en'
          ? `${eraName} ${eraYear}`
          : eraYear === 1 && lang === 'ja'
            ? `${eraName}元年（1年）`
            : `${eraName}${eraYear}年`;
      return { eraId: era.id, eraYear, label };
    }
  }
  return null;
}

export function convertJapaneseEraToWesternYear(
  eraId: JapaneseEraId,
  eraYear: number,
): number | null {
  if (!Number.isInteger(eraYear) || eraYear < 1) return null;
  const era = JAPANESE_ERAS.find((e) => e.id === eraId);
  if (!era) return null;
  const western = era.startYear + eraYear - 1;
  if (era.endYear !== null && western > era.endYear) return null;
  if (western > 2200) return null;
  return western;
}

export function getZodiacForYear(year: number, lang: AppLanguage = 'ja'): string {
  if (!Number.isInteger(year)) return '';
  const idx = (((year - 4) % 12) + 12) % 12;
  return ZODIAC_LIST[idx][lang];
}

export function calculateAgeSummary(birthYear: number, referenceYear: number): {
  ageThisYear: number;
  ageBeforeBirthday: number;
} {
  const ageThisYear = Math.max(0, referenceYear - birthYear);
  const ageBeforeBirthday = Math.max(0, ageThisYear - 1);
  return { ageThisYear, ageBeforeBirthday };
}

// ============================================================================
// 5. Timer, Stopwatch & World Clock Utilities
// ============================================================================

export function formatCountdownSec(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(Number.isFinite(totalSeconds) ? totalSeconds : 0));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hrs > 0 ? `${pad(hrs)}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
}

export function formatStopwatchMs(ms: number): string {
  const safe = Math.max(0, Math.floor(Number.isFinite(ms) ? ms : 0));
  const mins = Math.floor(safe / 60000);
  const secs = Math.floor((safe % 60000) / 1000);
  const centis = Math.floor((safe % 1000) / 10);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(mins)}:${pad(secs)}.${pad(centis)}`;
}

export interface WorldClockCity {
  id: string;
  timeZone: string;
  labels: Record<AppLanguage, string>;
  regionCode: string;
}

export const WORLD_CLOCK_CITIES: WorldClockCity[] = [
  { id: 'tokyo', timeZone: 'Asia/Tokyo', regionCode: 'JST', labels: { ja: '東京', en: 'Tokyo', zh: '东京', ko: '도쿄' } },
  { id: 'seoul', timeZone: 'Asia/Seoul', regionCode: 'KST', labels: { ja: 'ソウル', en: 'Seoul', zh: '首尔', ko: '서울' } },
  { id: 'shanghai', timeZone: 'Asia/Shanghai', regionCode: 'CST', labels: { ja: '上海', en: 'Shanghai', zh: '上海', ko: '상하이' } },
  { id: 'sydney', timeZone: 'Australia/Sydney', regionCode: 'AEDT/AEST', labels: { ja: 'シドニー', en: 'Sydney', zh: '悉尼', ko: '시드니' } },
  { id: 'london', timeZone: 'Europe/London', regionCode: 'GMT/BST', labels: { ja: 'ロンドン', en: 'London', zh: '伦敦', ko: '런던' } },
  { id: 'paris', timeZone: 'Europe/Paris', regionCode: 'CET/CEST', labels: { ja: 'パリ', en: 'Paris', zh: '巴黎', ko: '파리' } },
  { id: 'newyork', timeZone: 'America/New_York', regionCode: 'EST/EDT', labels: { ja: 'ニューヨーク', en: 'New York', zh: '纽约', ko: '뉴욕' } },
  { id: 'utc', timeZone: 'UTC', regionCode: 'UTC', labels: { ja: '世界標準時 (UTC)', en: 'UTC', zh: '协调世界时 (UTC)', ko: '세계협정시 (UTC)' } },
];

export function formatCityClock(
  now: Date,
  timeZone: string,
  lang: AppLanguage,
): { timeText: string; dateText: string } {
  const locale =
    lang === 'en' ? 'en-US' : lang === 'zh' ? 'zh-CN' : lang === 'ko' ? 'ko-KR' : 'ja-JP';
  try {
    const timeText = new Intl.DateTimeFormat(locale, {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(now);
    const dateText = new Intl.DateTimeFormat(locale, {
      timeZone,
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    }).format(now);
    return { timeText, dateText };
  } catch {
    return { timeText: '--:--:--', dateText: '--' };
  }
}

// ============================================================================
// 6. Quick Memo & Everyday Checklist Storage Helpers
// ============================================================================

export type ChecklistCategory = 'shopping' | 'todo' | 'carry';

export interface ChecklistItem {
  id: string;
  text: string;
  category: ChecklistCategory;
  done: boolean;
  createdAt: number;
}

export interface QuickMemoNote {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  updatedAt: number;
}

export const LIFE_MEMOS_STORAGE_KEY = 'nein_life_quick_memos_v1';
export const LIFE_CHECKLIST_STORAGE_KEY = 'nein_life_checklist_v1';

export function countMemoStats(body: string): {
  chars: number;
  charsNoSpaces: number;
  lines: number;
  manuscriptPages: number;
} {
  const chars = body.length;
  const charsNoSpaces = body.replace(/\s/g, '').length;
  const lines = body.length === 0 ? 0 : body.split(/\r?\n/).length;
  const manuscriptPages = chars === 0 ? 0 : Math.ceil(chars / 400);
  return { chars, charsNoSpaces, lines, manuscriptPages };
}

export function loadQuickMemos(): QuickMemoNote[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(LIFE_MEMOS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is QuickMemoNote =>
          item &&
          typeof item.id === 'string' &&
          typeof item.title === 'string' &&
          typeof item.body === 'string',
      )
      .map((item) => ({
        id: item.id,
        title: item.title,
        body: item.body,
        pinned: Boolean(item.pinned),
        updatedAt: typeof item.updatedAt === 'number' ? item.updatedAt : Date.now(),
      }));
  } catch {
    return [];
  }
}

export function saveQuickMemos(notes: QuickMemoNote[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(LIFE_MEMOS_STORAGE_KEY, JSON.stringify(notes));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadChecklistItems(): ChecklistItem[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(LIFE_CHECKLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is ChecklistItem =>
          item &&
          typeof item.id === 'string' &&
          typeof item.text === 'string' &&
          (item.category === 'shopping' || item.category === 'todo' || item.category === 'carry'),
      )
      .map((item) => ({
        id: item.id,
        text: item.text,
        category: item.category,
        done: Boolean(item.done),
        createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
      }));
  } catch {
    return [];
  }
}

export function saveChecklistItems(items: ChecklistItem[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(LIFE_CHECKLIST_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Plays a gentle two-tone chime via Web Audio API when a timer finishes.
 */
export function playGentleTimerChime(): void {
  if (typeof window === 'undefined') return;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;

  try {
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const notes = [587.33, 880, 1174.66]; // D5 -> A5 -> D6 soft chord arpeggio
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.16);
      gain.gain.setValueAtTime(0.0001, now + idx * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.14, now + idx * 0.16 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.16 + 0.65);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.16);
      osc.stop(now + idx * 0.16 + 0.7);
    });
    window.setTimeout(() => {
      void ctx.close().catch(() => {});
    }, 1400);
  } catch {
    // Ignore autoplay-blocked audio context errors
  }
}
