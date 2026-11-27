import { ArrowLeftRight, Calendar, Ruler } from 'lucide-react';
import { useState } from 'react';
import type { AppLanguage } from '../../utils/i18n';
import {
  JAPANESE_ERAS,
  type JapaneseEraId,
  UNIT_CATEGORIES,
  type UnitCategoryId,
  calculateAgeSummary,
  convertJapaneseEraToWesternYear,
  convertLifeUnit,
  convertWesternYearToJapaneseEra,
  getZodiacForYear,
} from '../../utils/lifeTools';

interface UnitEraConverterToolProps {
  lang: AppLanguage;
}

const COPY: Record<
  AppLanguage,
  {
    unitTitle: string;
    inputLabel: string;
    fromLabel: string;
    toLabel: string;
    swapBtn: string;
    allUnitsTitle: string;
    eraTitle: string;
    westernToEra: string;
    eraToWestern: string;
    westernYearLabel: string;
    eraSelectLabel: string;
    eraYearLabel: string;
    resultEraLabel: string;
    resultWesternLabel: string;
    zodiacLabel: string;
    ageLabel: string;
    ageFormat: (before: number, after: number) => string;
    invalidEraYear: string;
  }
> = {
  ja: {
    unitTitle: '生活単位変換',
    inputLabel: '変換する数値',
    fromLabel: '変換元の単位',
    toLabel: '変換先の単位',
    swapBtn: '入れ替え',
    allUnitsTitle: 'カテゴリ内の一括換算',
    eraTitle: '和暦・西暦・年齢・干支 変換',
    westernToEra: '西暦 → 和暦',
    eraToWestern: '和暦 → 西暦',
    westernYearLabel: '西暦（年）',
    eraSelectLabel: '元号',
    eraYearLabel: '年数',
    resultEraLabel: '和暦',
    resultWesternLabel: '西暦',
    zodiacLabel: '干支（えと）',
    ageLabel: '今年の満年齢目安',
    ageFormat: (before, after) => `${before}歳（誕生日後は ${after}歳）`,
    invalidEraYear: '該当する年号の範囲外です',
  },
  en: {
    unitTitle: 'Everyday Unit Converter',
    inputLabel: 'Value',
    fromLabel: 'From Unit',
    toLabel: 'To Unit',
    swapBtn: 'Swap',
    allUnitsTitle: 'Quick Reference Table',
    eraTitle: 'Japanese Era, Age & Zodiac Converter',
    westernToEra: 'Western → Era',
    eraToWestern: 'Era → Western',
    westernYearLabel: 'Western Year',
    eraSelectLabel: 'Era',
    eraYearLabel: 'Year #',
    resultEraLabel: 'Japanese Era',
    resultWesternLabel: 'Western Year',
    zodiacLabel: 'Zodiac',
    ageLabel: 'Estimated Age This Year',
    ageFormat: (before, after) => `${before} yrs (${after} after birthday)`,
    invalidEraYear: 'Outside the valid range for this era',
  },
  zh: {
    unitTitle: '常用生活单位换算',
    inputLabel: '输入数值',
    fromLabel: '原单位',
    toLabel: '目标单位',
    swapBtn: '互换',
    allUnitsTitle: '同类别一览换算',
    eraTitle: '日本年号・公历・年龄・生肖换算',
    westernToEra: '公历 → 和历',
    eraToWestern: '和历 → 公历',
    westernYearLabel: '公历年份',
    eraSelectLabel: '年号',
    eraYearLabel: '年数',
    resultEraLabel: '日本年号',
    resultWesternLabel: '公历年份',
    zodiacLabel: '生肖',
    ageLabel: '今年周岁参考',
    ageFormat: (before, after) => `${before} 岁（生日后 ${after} 岁）`,
    invalidEraYear: '超出该年号的有效年份范围',
  },
  ko: {
    unitTitle: '생활 단위 변환기',
    inputLabel: '변환할 값',
    fromLabel: '원본 단위',
    toLabel: '목표 단위',
    swapBtn: '바꾸기',
    allUnitsTitle: '카테고리 전체 환산',
    eraTitle: '일본 연호・서기・나이・띠 변환',
    westernToEra: '서기 → 연호',
    eraToWestern: '연호 → 서기',
    westernYearLabel: '서기 연도',
    eraSelectLabel: '연호',
    eraYearLabel: '연차',
    resultEraLabel: '일본 연호',
    resultWesternLabel: '서기 연도',
    zodiacLabel: '띠 (12간지)',
    ageLabel: '올해 만 나이 기준',
    ageFormat: (before, after) => `만 ${before}세 (생일 후 ${after}세)`,
    invalidEraYear: '해당 연호의 유효 범위를 벗어났습니다',
  },
};

export function UnitEraConverterTool({ lang }: UnitEraConverterToolProps) {
  const c = COPY[lang] ?? COPY.ja;
  const currentYear = new Date().getFullYear();

  // Unit Converter state
  const [categoryId, setCategoryId] = useState<UnitCategoryId>('volume');
  const currentCategory = UNIT_CATEGORIES.find((cat) => cat.id === categoryId) ?? UNIT_CATEGORIES[0];
  const [fromUnit, setFromUnit] = useState<string>(currentCategory.defaultFrom);
  const [toUnit, setToUnit] = useState<string>(currentCategory.defaultTo);
  const [inputValueStr, setInputValueStr] = useState<string>('2');

  // Era Converter state
  const [eraMode, setEraMode] = useState<'western_to_era' | 'era_to_western'>('western_to_era');
  const [westernYearStr, setWesternYearStr] = useState<string>('1996');
  const [selectedEra, setSelectedEra] = useState<JapaneseEraId>('reiwa');
  const [eraYearStr, setEraYearStr] = useState<string>('8');

  const handleSelectCategory = (nextCatId: UnitCategoryId) => {
    const nextCat = UNIT_CATEGORIES.find((cat) => cat.id === nextCatId) ?? UNIT_CATEGORIES[0];
    setCategoryId(nextCat.id);
    setFromUnit(nextCat.defaultFrom);
    setToUnit(nextCat.defaultTo);
  };

  const handleSwapUnits = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  };

  const numInput = Number(inputValueStr);
  const convertedVal = Number.isFinite(numInput)
    ? convertLifeUnit(numInput, categoryId, fromUnit, toUnit)
    : null;
  const toUnitDef = currentCategory.units.find((u) => u.id === toUnit);

  // Era calculation
  const parsedWestern = Number.parseInt(westernYearStr, 10);
  const parsedEraNum = Number.parseInt(eraYearStr, 10);
  const activeWesternYear =
    eraMode === 'western_to_era'
      ? Number.isInteger(parsedWestern)
        ? parsedWestern
        : null
      : convertJapaneseEraToWesternYear(selectedEra, parsedEraNum);
  const activeEraMatch =
    activeWesternYear !== null ? convertWesternYearToJapaneseEra(activeWesternYear, lang) : null;
  const activeZodiac =
    activeWesternYear !== null ? getZodiacForYear(activeWesternYear, lang) : '';
  const activeAge =
    activeWesternYear !== null && activeWesternYear <= currentYear
      ? calculateAgeSummary(activeWesternYear, currentYear)
      : null;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      {/* Left: Everyday Unit Converter */}
      <section
        data-testid="life-unit-converter"
        className="rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)] p-5 lg:col-span-7"
      >
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
          <Ruler className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
          <span>{c.unitTitle}</span>
        </h2>

        {/* Category Tabs */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {UNIT_CATEGORIES.map((cat) => {
            const active = cat.id === categoryId;
            return (
              <button
                key={cat.id}
                type="button"
                data-testid={`unit-cat-${cat.id}`}
                onClick={() => handleSelectCategory(cat.id)}
                className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'border-[var(--nein-accent)] bg-[var(--nein-accent-soft)] text-[var(--nein-accent-text)]'
                    : 'border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-700 hover:border-[var(--nein-accent-border)] dark:text-slate-200'
                }`}
              >
                {cat.labels[lang]}
              </button>
            );
          })}
        </div>

        {/* Input & From/To Selectors */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end">
          <div className="sm:col-span-4">
            <label htmlFor="unit-value-input" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
              {c.inputLabel}
            </label>
            <input
              id="unit-value-input"
              type="number"
              step="any"
              value={inputValueStr}
              data-testid="unit-value-input"
              onChange={(e) => setInputValueStr(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] px-3 py-2 font-mono text-base font-bold tabular-nums text-slate-900 focus:border-[var(--nein-accent)] focus:outline-none dark:text-slate-100"
            />
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="unit-from-select" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
              {c.fromLabel}
            </label>
            <select
              id="unit-from-select"
              data-testid="unit-from-select"
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] px-2.5 py-2 text-xs font-semibold text-slate-900 focus:border-[var(--nein-accent)] focus:outline-none dark:text-slate-100 cursor-pointer"
            >
              {currentCategory.units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.labels[lang]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-center sm:col-span-2">
            <button
              type="button"
              data-testid="unit-swap-btn"
              onClick={handleSwapUnits}
              title={c.swapBtn}
              aria-label={c.swapBtn}
              className="inline-flex h-9 w-full items-center justify-center gap-1 rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] px-2.5 text-xs font-semibold text-slate-700 transition-colors hover:border-[var(--nein-accent-border)] hover:text-[var(--nein-accent-text)] dark:text-slate-200 cursor-pointer"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="unit-to-select" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
              {c.toLabel}
            </label>
            <select
              id="unit-to-select"
              data-testid="unit-to-select"
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] px-2.5 py-2 text-xs font-semibold text-slate-900 focus:border-[var(--nein-accent)] focus:outline-none dark:text-slate-100 cursor-pointer"
            >
              {currentCategory.units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.labels[lang]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Primary Converted Value */}
        <div className="mt-4 rounded-lg border border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] px-4 py-3">
          <div
            data-testid="unit-converted-output"
            className="font-mono text-2xl font-extrabold tabular-nums text-[var(--nein-accent-text)]"
          >
            {convertedVal !== null ? `${convertedVal.toLocaleString()} ${toUnitDef?.symbol ?? ''}` : '--'}
          </div>
        </div>

        {/* All Units Reference Grid */}
        <div className="mt-4 border-t border-[var(--nein-border-subtle)] pt-3.5">
          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">{c.allUnitsTitle}</div>
          <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {currentCategory.units.map((u) => {
              const val = Number.isFinite(numInput)
                ? convertLifeUnit(numInput, categoryId, fromUnit, u.id)
                : null;
              return (
                <div
                  key={u.id}
                  className="flex flex-col justify-between rounded-lg border border-[var(--nein-border-subtle)] bg-[var(--nein-sub)] px-3 py-2"
                >
                  <span className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                    {u.labels[lang]}
                  </span>
                  <span className="mt-0.5 font-mono text-sm font-bold tabular-nums text-slate-900 dark:text-slate-100">
                    {val !== null ? val.toLocaleString() : '--'} {u.symbol}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Right: Japanese Era / Western Year / Age / Zodiac Converter */}
      <section
        data-testid="life-era-converter"
        className="flex flex-col justify-between rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)] p-5 lg:col-span-5"
      >
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <Calendar className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
            <span>{c.eraTitle}</span>
          </h2>

          <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-1 text-xs">
            <button
              type="button"
              data-testid="era-mode-western"
              onClick={() => setEraMode('western_to_era')}
              className={`rounded-md py-1.5 font-semibold transition-colors cursor-pointer ${
                eraMode === 'western_to_era'
                  ? 'bg-[var(--nein-accent)] text-[var(--nein-accent-contrast)]'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {c.westernToEra}
            </button>
            <button
              type="button"
              data-testid="era-mode-japanese"
              onClick={() => setEraMode('era_to_western')}
              className={`rounded-md py-1.5 font-semibold transition-colors cursor-pointer ${
                eraMode === 'era_to_western'
                  ? 'bg-[var(--nein-accent)] text-[var(--nein-accent-contrast)]'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {c.eraToWestern}
            </button>
          </div>

          {eraMode === 'western_to_era' ? (
            <div className="mt-4">
              <label htmlFor="era-western-input" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                {c.westernYearLabel}
              </label>
              <input
                id="era-western-input"
                type="number"
                min={1868}
                max={2200}
                value={westernYearStr}
                data-testid="era-western-input"
                onChange={(e) => setWesternYearStr(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] px-3 py-2 font-mono text-base font-bold tabular-nums text-slate-900 focus:border-[var(--nein-accent)] focus:outline-none dark:text-slate-100"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[1985, 1995, 2000, 2019, currentYear].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setWesternYearStr(String(yr))}
                    className="rounded border border-[var(--nein-border)] bg-[var(--nein-sub)] px-2 py-1 font-mono text-[11px] font-semibold tabular-nums text-slate-700 hover:border-[var(--nein-accent-border)] dark:text-slate-300 cursor-pointer"
                  >
                    {yr}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="era-select" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {c.eraSelectLabel}
                </label>
                <select
                  id="era-select"
                  data-testid="era-select"
                  value={selectedEra}
                  onChange={(e) => setSelectedEra(e.target.value as JapaneseEraId)}
                  className="mt-1.5 w-full rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] px-2.5 py-2 text-sm font-semibold text-slate-900 focus:border-[var(--nein-accent)] focus:outline-none dark:text-slate-100 cursor-pointer"
                >
                  {JAPANESE_ERAS.map((era) => (
                    <option key={era.id} value={era.id}>
                      {era.labels[lang]} ({era.startYear}–{era.endYear ?? ''})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="era-year-input" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {c.eraYearLabel}
                </label>
                <input
                  id="era-year-input"
                  type="number"
                  min={1}
                  max={99}
                  value={eraYearStr}
                  data-testid="era-year-input"
                  onChange={(e) => setEraYearStr(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] px-3 py-2 font-mono text-base font-bold tabular-nums text-slate-900 focus:border-[var(--nein-accent)] focus:outline-none dark:text-slate-100"
                />
              </div>
            </div>
          )}

          {/* Output Summary */}
          <div className="mt-5 space-y-3 border-t border-[var(--nein-border-subtle)] pt-4">
            {activeWesternYear !== null && activeEraMatch ? (
              <>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">{c.resultEraLabel}</span>
                  <span
                    data-testid="era-result-japanese"
                    className="text-lg font-extrabold text-[var(--nein-accent-text)]"
                  >
                    {activeEraMatch.label}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">{c.resultWesternLabel}</span>
                  <span
                    data-testid="era-result-western"
                    className="font-mono text-lg font-extrabold tabular-nums text-slate-900 dark:text-white"
                  >
                    {activeWesternYear}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">{c.zodiacLabel}</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{activeZodiac}</span>
                </div>
                {activeAge && (
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">{c.ageLabel}</span>
                    <span className="font-mono text-sm font-bold tabular-nums text-slate-800 dark:text-slate-200">
                      {c.ageFormat(activeAge.ageBeforeBirthday, activeAge.ageThisYear)}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs font-medium text-amber-700 dark:text-amber-300">{c.invalidEraYear}</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
