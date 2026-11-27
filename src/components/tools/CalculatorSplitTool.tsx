import { Calculator, Check, Copy, Delete, Percent, RotateCcw, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { copyTextToClipboard } from '../../utils/clipboard';
import type { AppLanguage } from '../../utils/i18n';
import {
  type SplitRoundingUnit,
  calculateSplitBill,
  calculateTaxAndDiscount,
  evaluateCalculatorExpression,
} from '../../utils/lifeTools';

interface CalculatorSplitToolProps {
  lang: AppLanguage;
}

const COPY: Record<
  AppLanguage,
  {
    calcTitle: string;
    calcHint: string;
    historyTitle: string;
    historyEmpty: string;
    clearHistory: string;
    copyBtn: string;
    copied: string;
    errDivZero: string;
    errSyntax: string;
    taxTitle: string;
    taxBaseLabel: string;
    taxModeExcl: string;
    taxModeIncl: string;
    taxRateLabel: string;
    discountLabel: string;
    discountedOut: string;
    savedOut: string;
    preTaxOut: string;
    taxOut: string;
    totalOut: string;
    splitTitle: string;
    splitTotalLabel: string;
    splitPeopleLabel: string;
    splitPeopleUnit: string;
    splitRoundLabel: string;
    splitOrganizerOffset: string;
    splitRegularLabel: string;
    splitOrganizerLabel: string;
    splitExactLabel: string;
    splitCopySummary: string;
    yenUnit: string;
  }
> = {
  ja: {
    calcTitle: '標準電卓',
    calcHint: 'キーボード入力（数字・+ - * / Enter）にも対応',
    historyTitle: '計算履歴',
    historyEmpty: '計算結果がここに履歴表示されます',
    clearHistory: '履歴をクリア',
    copyBtn: 'コピー',
    copied: 'コピー済み',
    errDivZero: '0で割ることはできません',
    errSyntax: '式を確認してください',
    taxTitle: '消費税・割引計算',
    taxBaseLabel: '元の金額（円）',
    taxModeExcl: '税抜価格から計算',
    taxModeIncl: '税込価格から逆算',
    taxRateLabel: '税率',
    discountLabel: '割引率',
    discountedOut: '割引後価格',
    savedOut: '割引額',
    preTaxOut: '本体価格（税抜）',
    taxOut: '消費税額',
    totalOut: 'お支払い合計（税込）',
    splitTitle: '割り勘計算',
    splitTotalLabel: 'お会計合計（円）',
    splitPeopleLabel: '人数',
    splitPeopleUnit: '人',
    splitRoundLabel: '1人あたりの丸め単位',
    splitOrganizerOffset: '幹事の調整（円）',
    splitRegularLabel: 'メンバー 1人あたり',
    splitOrganizerLabel: '幹事（端数調整）',
    splitExactLabel: '均等割り（端数あり）',
    splitCopySummary: '割り勘結果をコピー',
    yenUnit: '円',
  },
  en: {
    calcTitle: 'Standard Calculator',
    calcHint: 'Supports keyboard input (digits, + - * / Enter)',
    historyTitle: 'History',
    historyEmpty: 'Recent calculations appear here',
    clearHistory: 'Clear',
    copyBtn: 'Copy',
    copied: 'Copied',
    errDivZero: 'Cannot divide by zero',
    errSyntax: 'Invalid expression',
    taxTitle: 'Tax & Discount Calculator',
    taxBaseLabel: 'Original Price',
    taxModeExcl: 'Add Tax (Tax Excluded)',
    taxModeIncl: 'Extract Tax (Tax Included)',
    taxRateLabel: 'Tax Rate',
    discountLabel: 'Discount',
    discountedOut: 'After Discount',
    savedOut: 'You Save',
    preTaxOut: 'Subtotal (Pre-Tax)',
    taxOut: 'Tax Amount',
    totalOut: 'Total (Tax Included)',
    splitTitle: 'Split Bill Calculator',
    splitTotalLabel: 'Total Bill',
    splitPeopleLabel: 'People',
    splitPeopleUnit: 'ppl',
    splitRoundLabel: 'Round Per Person',
    splitOrganizerOffset: 'Organizer Adjustment',
    splitRegularLabel: 'Per Member',
    splitOrganizerLabel: 'Organizer (Remainder)',
    splitExactLabel: 'Exact Equal Split',
    splitCopySummary: 'Copy Split Summary',
    yenUnit: 'JPY',
  },
  zh: {
    calcTitle: '标准计算器',
    calcHint: '支持键盘数字与四则运算快捷键',
    historyTitle: '计算历史',
    historyEmpty: '计算记录将显示在此处',
    clearHistory: '清空',
    copyBtn: '复制',
    copied: '已复制',
    errDivZero: '不能除以 0',
    errSyntax: '请检查表达式',
    taxTitle: '消费税与折扣计算',
    taxBaseLabel: '商品原价（日元）',
    taxModeExcl: '从不含税价计算',
    taxModeIncl: '从含税价反推',
    taxRateLabel: '税率',
    discountLabel: '折扣',
    discountedOut: '折后价',
    savedOut: '已优惠',
    preTaxOut: '不含税金额',
    taxOut: '税额',
    totalOut: '应付总额（含税）',
    splitTitle: 'AA 聚餐分摊计算',
    splitTotalLabel: '账单总额（日元）',
    splitPeopleLabel: '人数',
    splitPeopleUnit: '人',
    splitRoundLabel: '每人取整单位',
    splitOrganizerOffset: '组织者差额调整',
    splitRegularLabel: '每位成员应付',
    splitOrganizerLabel: '组织者（补齐尾数）',
    splitExactLabel: '精确平摊',
    splitCopySummary: '复制分摊结果',
    yenUnit: '日元',
  },
  ko: {
    calcTitle: '표준 계산기',
    calcHint: '키보드 입력(숫자, + - * / Enter) 지원',
    historyTitle: '계산 기록',
    historyEmpty: '최근 계산 결과가 여기에 표시됩니다',
    clearHistory: '지우기',
    copyBtn: '복사',
    copied: '복사됨',
    errDivZero: '0으로 나눌 수 없습니다',
    errSyntax: '수식을 확인해 주세요',
    taxTitle: '소비세・할인 계산기',
    taxBaseLabel: '원래 금액 (엔)',
    taxModeExcl: '세전 가격에서 계산',
    taxModeIncl: '세후 가격에서 역산',
    taxRateLabel: '세율',
    discountLabel: '할인율',
    discountedOut: '할인 후 금액',
    savedOut: '할인 금액',
    preTaxOut: '공급가액 (세전)',
    taxOut: '소비세액',
    totalOut: '최종 결제 금액 (세후)',
    splitTitle: '더치페이 정산기',
    splitTotalLabel: '총 결제 금액 (엔)',
    splitPeopleLabel: '인원',
    splitPeopleUnit: '명',
    splitRoundLabel: '1인당 반올림 단위',
    splitOrganizerOffset: '총무 조정액 (엔)',
    splitRegularLabel: '일반 멤버 1인당',
    splitOrganizerLabel: '총무 (잔액 정산)',
    splitExactLabel: '정확한 1/N 금액',
    splitCopySummary: '정산 결과 복사',
    yenUnit: '엔',
  },
};

interface HistoryEntry {
  id: string;
  expr: string;
  result: string;
}

const KEYPAD_ROWS: Array<Array<{ label: string; value: string; kind: 'num' | 'op' | 'action' | 'eq' }>> = [
  [
    { label: 'C', value: 'C', kind: 'action' },
    { label: '(', value: '(', kind: 'action' },
    { label: ')', value: ')', kind: 'action' },
    { label: '÷', value: '÷', kind: 'op' },
  ],
  [
    { label: '7', value: '7', kind: 'num' },
    { label: '8', value: '8', kind: 'num' },
    { label: '9', value: '9', kind: 'num' },
    { label: '×', value: '×', kind: 'op' },
  ],
  [
    { label: '4', value: '4', kind: 'num' },
    { label: '5', value: '5', kind: 'num' },
    { label: '6', value: '6', kind: 'num' },
    { label: '−', value: '-', kind: 'op' },
  ],
  [
    { label: '1', value: '1', kind: 'num' },
    { label: '2', value: '2', kind: 'num' },
    { label: '3', value: '3', kind: 'num' },
    { label: '+', value: '+', kind: 'op' },
  ],
  [
    { label: '0', value: '0', kind: 'num' },
    { label: '.', value: '.', kind: 'num' },
    { label: '%', value: '%', kind: 'action' },
    { label: '=', value: '=', kind: 'eq' },
  ],
];

const ROUND_UNITS: SplitRoundingUnit[] = [1, 10, 100, 500, 1000];

export function CalculatorSplitTool({ lang }: CalculatorSplitToolProps) {
  const c = COPY[lang] ?? COPY.ja;

  // Calculator state
  const [expr, setExpr] = useState('');
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcError, setCalcError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Tax & Discount state
  const [taxBaseStr, setTaxBaseStr] = useState('2980');
  const [taxRate, setTaxRate] = useState<number>(10);
  const [discountPct, setDiscountPct] = useState<number>(0);
  const [taxMode, setTaxMode] = useState<'tax_excluded' | 'tax_included'>('tax_excluded');

  // Split Bill state
  const [splitTotalStr, setSplitTotalStr] = useState('14800');
  const [splitPeople, setSplitPeople] = useState<number>(4);
  const [roundingUnit, setRoundingUnit] = useState<SplitRoundingUnit>(500);
  const [organizerOffset, setOrganizerOffset] = useState<number>(0);

  const liveEval = expr.trim() ? evaluateCalculatorExpression(expr) : null;

  const triggerCopy = async (id: string, text: string) => {
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1800);
    }
  };

  const handleEvaluate = () => {
    if (!expr.trim()) return;
    const res = evaluateCalculatorExpression(expr);
    if (!res.ok) {
      setCalcError(res.error === 'div_zero' ? c.errDivZero : c.errSyntax);
      return;
    }
    setCalcError(null);
    setCalcDisplay(res.formatted);
    setHistory((prev) => [
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, expr, result: res.formatted },
      ...prev.slice(0, 7),
    ]);
    setExpr(res.formatted);
  };

  const handleKeyPress = (value: string) => {
    setCalcError(null);
    if (value === 'C') {
      setExpr('');
      setCalcDisplay('0');
      return;
    }
    if (value === '=') {
      handleEvaluate();
      return;
    }
    setExpr((prev) => prev + value);
  };

  const handleBackspace = () => {
    setCalcError(null);
    setExpr((prev) => prev.slice(0, -1));
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }
      if (/^[0-9.+\-*/()%]$/.test(e.key)) {
        e.preventDefault();
        const mapped = e.key === '*' ? '×' : e.key === '/' ? '÷' : e.key;
        setCalcError(null);
        setExpr((prev) => prev + mapped);
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEvaluate();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setExpr('');
        setCalcDisplay('0');
        setCalcError(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const taxResult = calculateTaxAndDiscount({
    baseAmount: Number(taxBaseStr) || 0,
    discountPercent: discountPct,
    taxRatePercent: taxRate,
    mode: taxMode,
  });

  const splitResult = calculateSplitBill({
    totalAmount: Number(splitTotalStr) || 0,
    peopleCount: splitPeople,
    roundingUnit,
    organizerDiscountYen: organizerOffset,
  });

  const fmtYen = (n: number) => `${n.toLocaleString()} ${c.yenUnit}`;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      {/* Left Column: Standard Calculator + History */}
      <section
        data-testid="life-calc-standard"
        className="flex flex-col justify-between rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)] p-5 lg:col-span-5"
      >
        <div>
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
              <Calculator className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
              <span>{c.calcTitle}</span>
            </h2>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">{c.calcHint}</span>
          </div>

          {/* Display Screen */}
          <div className="mt-3 rounded-lg border border-[var(--nein-border-subtle)] bg-[var(--nein-sub)] px-4 py-3 text-right">
            <div
              data-testid="life-calc-expression"
              className="min-h-[20px] truncate font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400"
            >
              {expr || '\u00A0'}
            </div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <button
                type="button"
                aria-label={c.copyBtn}
                onClick={() =>
                  void triggerCopy(
                    'calc-main',
                    liveEval?.ok ? liveEval.formatted : calcDisplay,
                  )
                }
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-slate-500 transition-colors hover:bg-[var(--nein-surface)] hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 cursor-pointer"
              >
                {copiedId === 'calc-main' ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>{copiedId === 'calc-main' ? c.copied : c.copyBtn}</span>
              </button>
              <div
                data-testid="life-calc-display"
                className="truncate font-mono text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50"
              >
                {calcError ? (
                  <span className="text-sm font-semibold text-red-600 dark:text-red-400">{calcError}</span>
                ) : liveEval?.ok ? (
                  liveEval.formatted
                ) : (
                  calcDisplay
                )}
              </div>
            </div>
          </div>

          {/* Keypad */}
          <div className="mt-3 grid grid-cols-4 gap-2">
            {KEYPAD_ROWS.flat().map((btn) => (
              <button
                key={btn.label}
                type="button"
                data-testid={`calc-key-${btn.label}`}
                onClick={() => handleKeyPress(btn.value)}
                className={`flex min-h-[46px] items-center justify-center rounded-lg border text-sm font-bold tabular-nums transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nein-accent)] ${
                  btn.kind === 'eq'
                    ? 'border-[var(--nein-accent)] bg-[var(--nein-accent)] text-[var(--nein-accent-contrast)] hover:opacity-90'
                    : btn.kind === 'op'
                      ? 'border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] text-[var(--nein-accent-text)] hover:opacity-90'
                      : btn.kind === 'action'
                        ? 'border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-700 hover:bg-slate-200/60 dark:text-slate-200 dark:hover:bg-slate-800'
                        : 'border-[var(--nein-border-subtle)] bg-[var(--nein-surface)] text-slate-900 hover:bg-[var(--nein-sub)] dark:text-slate-100'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="mt-2 flex items-center justify-end">
            <button
              type="button"
              data-testid="calc-key-backspace"
              onClick={handleBackspace}
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--nein-border)] bg-[var(--nein-sub)] px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-[var(--nein-accent-border)] dark:text-slate-200 cursor-pointer"
            >
              <Delete className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Backspace</span>
            </button>
          </div>
        </div>

        {/* History list */}
        <div className="mt-5 border-t border-[var(--nein-border-subtle)] pt-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-400">{c.historyTitle}</span>
            {history.length > 0 && (
              <button
                type="button"
                onClick={() => setHistory([])}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                <span>{c.clearHistory}</span>
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{c.historyEmpty}</p>
          ) : (
            <ul className="mt-2 divide-y divide-[var(--nein-border-subtle)]">
              {history.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2 py-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setExpr(item.result);
                      setCalcDisplay(item.result);
                    }}
                    className="min-w-0 truncate text-left font-mono text-slate-500 hover:text-[var(--nein-accent-text)] dark:text-slate-400 cursor-pointer"
                  >
                    {item.expr}
                  </button>
                  <span className="shrink-0 font-mono font-bold tabular-nums text-slate-900 dark:text-slate-100">
                    = {item.result}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Right Column: Tax & Discount + Split Bill */}
      <div className="flex flex-col gap-5 lg:col-span-7">
        {/* Tax & Discount Calculator */}
        <section
          data-testid="life-calc-tax"
          className="rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)] p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
              <Percent className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
              <span>{c.taxTitle}</span>
            </h2>
            <div className="inline-flex rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-0.5 text-xs">
              <button
                type="button"
                data-testid="tax-mode-excluded"
                onClick={() => setTaxMode('tax_excluded')}
                className={`rounded-md px-2.5 py-1 font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  taxMode === 'tax_excluded'
                    ? 'bg-[var(--nein-accent)] text-[var(--nein-accent-contrast)]'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {c.taxModeExcl}
              </button>
              <button
                type="button"
                data-testid="tax-mode-included"
                onClick={() => setTaxMode('tax_included')}
                className={`rounded-md px-2.5 py-1 font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  taxMode === 'tax_included'
                    ? 'bg-[var(--nein-accent)] text-[var(--nein-accent-contrast)]'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {c.taxModeIncl}
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="tax-base-input" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                {c.taxBaseLabel}
              </label>
              <input
                id="tax-base-input"
                type="number"
                min={0}
                value={taxBaseStr}
                data-testid="tax-base-input"
                onChange={(e) => setTaxBaseStr(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] px-3 py-2 font-mono text-sm font-bold tabular-nums text-slate-900 focus:border-[var(--nein-accent)] focus:outline-none dark:text-slate-100"
              />
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">{c.taxRateLabel}</div>
              <div className="mt-1.5 flex gap-1.5">
                {[10, 8, 0].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    data-testid={`tax-rate-${rate}`}
                    onClick={() => setTaxRate(rate)}
                    className={`flex-1 rounded-lg border py-2 font-mono text-xs font-bold tabular-nums transition-colors cursor-pointer ${
                      taxRate === rate
                        ? 'border-[var(--nein-accent)] bg-[var(--nein-accent-soft)] text-[var(--nein-accent-text)]'
                        : 'border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                <label htmlFor="tax-discount-input">{c.discountLabel}</label>
                <span className="font-mono tabular-nums text-[var(--nein-accent-text)]">{discountPct}% OFF</span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {[0, 10, 20, 30, 50].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    data-testid={`tax-discount-${pct}`}
                    onClick={() => setDiscountPct(pct)}
                    className={`flex-1 rounded-md border py-2 font-mono text-[11px] font-bold tabular-nums transition-colors cursor-pointer ${
                      discountPct === pct
                        ? 'border-[var(--nein-accent)] bg-[var(--nein-accent-soft)] text-[var(--nein-accent-text)]'
                        : 'border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[var(--nein-border-subtle)] pt-4 sm:grid-cols-4">
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">{c.savedOut}</div>
              <div className="mt-0.5 font-mono text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                -{fmtYen(taxResult.discountSaved)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">{c.preTaxOut}</div>
              <div className="mt-0.5 font-mono text-sm font-bold tabular-nums text-slate-800 dark:text-slate-200">
                {fmtYen(taxResult.preTaxAmount)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">{c.taxOut}</div>
              <div className="mt-0.5 font-mono text-sm font-bold tabular-nums text-slate-800 dark:text-slate-200">
                {fmtYen(taxResult.taxAmount)}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-[var(--nein-accent-text)]">{c.totalOut}</div>
              <div
                data-testid="tax-total-output"
                className="mt-0.5 font-mono text-lg font-extrabold tabular-nums text-slate-900 dark:text-white"
              >
                {fmtYen(taxResult.totalWithTax)}
              </div>
            </div>
          </div>
        </section>

        {/* Split Bill Calculator */}
        <section
          data-testid="life-calc-split"
          className="rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)] p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
              <Users className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
              <span>{c.splitTitle}</span>
            </h2>
            <button
              type="button"
              data-testid="split-copy-btn"
              onClick={() => {
                const summary = `${c.splitTitle} (${splitResult.peopleCount}${c.splitPeopleUnit} / ${fmtYen(Number(splitTotalStr) || 0)})\n${c.splitRegularLabel}: ${fmtYen(splitResult.regularPerPerson)}\n${c.splitOrganizerLabel}: ${fmtYen(splitResult.organizerAmount)}`;
                void triggerCopy('split-summary', summary);
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--nein-border)] bg-[var(--nein-sub)] px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-[var(--nein-accent-border)] dark:text-slate-200 whitespace-nowrap cursor-pointer"
            >
              {copiedId === 'split-summary' ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>{copiedId === 'split-summary' ? c.copied : c.splitCopySummary}</span>
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="split-total-input" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                {c.splitTotalLabel}
              </label>
              <input
                id="split-total-input"
                type="number"
                min={0}
                step={100}
                value={splitTotalStr}
                data-testid="split-total-input"
                onChange={(e) => setSplitTotalStr(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] px-3 py-2 font-mono text-sm font-bold tabular-nums text-slate-900 focus:border-[var(--nein-accent)] focus:outline-none dark:text-slate-100"
              />
            </div>

            <div>
              <label htmlFor="split-people-input" className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
                {c.splitPeopleLabel} ({splitPeople}{c.splitPeopleUnit})
              </label>
              <div className="mt-1.5 flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="Decrease people"
                  onClick={() => setSplitPeople((n) => Math.max(1, n - 1))}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] font-mono text-sm font-bold text-slate-800 hover:border-[var(--nein-accent-border)] dark:text-slate-100 cursor-pointer"
                >
                  −
                </button>
                <input
                  id="split-people-input"
                  type="number"
                  min={1}
                  max={999}
                  value={splitPeople}
                  data-testid="split-people-input"
                  onChange={(e) => setSplitPeople(Math.max(1, Math.min(999, Number(e.target.value) || 1)))}
                  className="w-full rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] px-2 py-2 text-center font-mono text-sm font-bold tabular-nums text-slate-900 focus:border-[var(--nein-accent)] focus:outline-none dark:text-slate-100"
                />
                <button
                  type="button"
                  aria-label="Increase people"
                  onClick={() => setSplitPeople((n) => Math.min(999, n + 1))}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] font-mono text-sm font-bold text-slate-800 hover:border-[var(--nein-accent-border)] dark:text-slate-100 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">{c.splitRoundLabel}</div>
              <div className="mt-1.5 flex gap-1">
                {ROUND_UNITS.map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    data-testid={`split-round-${unit}`}
                    onClick={() => setRoundingUnit(unit)}
                    className={`flex-1 rounded-md border py-2 font-mono text-[11px] font-bold tabular-nums transition-colors cursor-pointer ${
                      roundingUnit === unit
                        ? 'border-[var(--nein-accent)] bg-[var(--nein-accent-soft)] text-[var(--nein-accent-text)]'
                        : 'border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-medium text-slate-600 dark:text-slate-400">{c.splitOrganizerOffset}:</span>
            {[-1000, -500, 0, 500, 1000].map((offset) => (
              <button
                key={offset}
                type="button"
                onClick={() => setOrganizerOffset(offset)}
                className={`rounded-md border px-2 py-1 font-mono text-[11px] font-semibold tabular-nums transition-colors cursor-pointer ${
                  organizerOffset === offset
                    ? 'border-[var(--nein-accent)] bg-[var(--nein-accent-soft)] text-[var(--nein-accent-text)]'
                    : 'border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-600 dark:text-slate-300'
                }`}
              >
                {offset === 0 ? '±0' : offset > 0 ? `+${offset}` : offset}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-[var(--nein-border-subtle)] pt-4 sm:grid-cols-3">
            <div>
              <div className="text-[11px] font-semibold text-[var(--nein-accent-text)]">
                {c.splitRegularLabel} ({Math.max(1, splitResult.peopleCount - 1)}{c.splitPeopleUnit})
              </div>
              <div
                data-testid="split-regular-output"
                className="mt-0.5 font-mono text-xl font-extrabold tabular-nums text-slate-900 dark:text-white"
              >
                {fmtYen(splitResult.regularPerPerson)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">{c.splitOrganizerLabel}</div>
              <div
                data-testid="split-organizer-output"
                className="mt-0.5 font-mono text-xl font-bold tabular-nums text-slate-800 dark:text-slate-100"
              >
                {fmtYen(splitResult.organizerAmount)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">{c.splitExactLabel}</div>
              <div className="mt-0.5 font-mono text-base font-semibold tabular-nums text-slate-600 dark:text-slate-300">
                {splitResult.exactPerPerson.toLocaleString()} {c.yenUnit}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
