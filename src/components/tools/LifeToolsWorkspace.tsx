import { Calculator, CheckSquare, type LucideIcon, Ruler, Timer, Wrench } from 'lucide-react';
import type { AppLanguage } from '../../utils/i18n';
import { CalculatorSplitTool } from './CalculatorSplitTool';
import { MemoChecklistTool } from './MemoChecklistTool';
import { TimerClockTool } from './TimerClockTool';
import { UnitEraConverterTool } from './UnitEraConverterTool';

export type LifeToolViewId = 'life_calc' | 'life_timer' | 'life_convert' | 'life_notes';

interface LifeToolsWorkspaceProps {
  lang: AppLanguage;
  activeTool: LifeToolViewId;
  onSelectTool: (tool: LifeToolViewId) => void;
}

interface ToolTabDef {
  id: LifeToolViewId;
  icon: LucideIcon;
  labels: Record<AppLanguage, string>;
  descriptions: Record<AppLanguage, string>;
}

const TOOL_TABS: ToolTabDef[] = [
  {
    id: 'life_calc',
    icon: Calculator,
    labels: {
      ja: '電卓・割り勘',
      en: 'Calculator & Split',
      zh: '计算器与AA分账',
      ko: '계산기·더치페이',
    },
    descriptions: {
      ja: '四則電卓・8%/10%税込割引・割り勘端数計算',
      en: 'Calculator, 8%/10% tax & discount, and bill splitter',
      zh: '四则计算器、8%/10%含税折扣与聚餐分账',
      ko: '사칙 계산기, 8%/10% 세금·할인 및 더치페이 계산',
    },
  },
  {
    id: 'life_timer',
    icon: Timer,
    labels: {
      ja: 'タイマー・時計',
      en: 'Timer & Clock',
      zh: '计时器与时钟',
      ko: '타이머·시계',
    },
    descriptions: {
      ja: 'カウントダウン・ポモドーロ・ストップウォッチ・世界時計',
      en: 'Countdown, Pomodoro focus timer, stopwatch & world clock',
      zh: '倒计时、番茄专注钟、秒表与世界时钟',
      ko: '카운트다운, 포모도로, 스톱워치 및 세계 시계',
    },
  },
  {
    id: 'life_convert',
    icon: Ruler,
    labels: {
      ja: '単位・和暦変換',
      en: 'Units & Era',
      zh: '单位与和历换算',
      ko: '단위·연호 변환',
    },
    descriptions: {
      ja: '長さ・重さ・料理計量・畳/坪と和暦・西暦・年齢早見',
      en: 'Length, weight, cooking, tatami/tsubo & Japanese era lookup',
      zh: '长度/重量/料理/面积换算与日本年号、西历及年龄查询',
      ko: '길이·무게·요리·면적 단위 및 일본 연호·서력·나이 변환',
    },
  },
  {
    id: 'life_notes',
    icon: CheckSquare,
    labels: {
      ja: 'メモ・リスト',
      en: 'Memo & Checklist',
      zh: '备忘录与清单',
      ko: '메모·체크리스트',
    },
    descriptions: {
      ja: '買い物・やること・防災持ち物リストと自動保存クイックメモ',
      en: 'Shopping, to-do & emergency go-bag checklist plus quick notes',
      zh: '购物、待办、防灾应急清单与本地自动保存速记',
      ko: '쇼핑·할 일·방재 준비물 체크리스트 및 자동 저장 메모',
    },
  },
];

const HEADER_COPY: Record<
  AppLanguage,
  {
    eyebrow: string;
    title: string;
    tabListAria: string;
  }
> = {
  ja: {
    eyebrow: 'TOOLS',
    title: '生活ユーティリティ',
    tabListAria: '生活ツール切り替え',
  },
  en: {
    eyebrow: 'TOOLS',
    title: 'Everyday Utilities',
    tabListAria: 'Switch everyday tool',
  },
  zh: {
    eyebrow: 'TOOLS',
    title: '日常实用工具',
    tabListAria: '切换日常工具',
  },
  ko: {
    eyebrow: 'TOOLS',
    title: '생활 유틸리티',
    tabListAria: '생활 도구 전환',
  },
};

export function LifeToolsWorkspace({
  lang,
  activeTool,
  onSelectTool,
}: LifeToolsWorkspaceProps) {
  const copy = HEADER_COPY[lang];
  const currentMeta = TOOL_TABS.find((t) => t.id === activeTool) ?? TOOL_TABS[0];

  return (
    <section
      data-testid="life-tools-workspace"
      data-active-tool={activeTool}
      className="flex flex-col gap-5"
    >
      <div className="rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)] p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-extrabold tracking-widest text-[var(--nein-accent-text)]">
              <Wrench className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{copy.eyebrow}</span>
            </div>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-2xl">
              {copy.title}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {currentMeta.descriptions[lang]}
            </p>
          </div>

          <div
            role="tablist"
            aria-label={copy.tabListAria}
            className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap sm:items-center"
          >
            {TOOL_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === activeTool;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  data-testid={`life-tool-tab-${tab.id}`}
                  onClick={() => onSelectTool(tab.id)}
                  className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer sm:text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nein-accent)] ${
                    isActive
                      ? 'border-[var(--nein-accent)] bg-[var(--nein-accent)] text-[var(--nein-accent-contrast)]'
                      : 'border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-700 hover:bg-[var(--nein-accent-soft)] hover:text-[var(--nein-accent-text)] dark:text-slate-200'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{tab.labels[lang]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {activeTool === 'life_calc' ? (
        <CalculatorSplitTool lang={lang} />
      ) : activeTool === 'life_timer' ? (
        <TimerClockTool lang={lang} />
      ) : activeTool === 'life_convert' ? (
        <UnitEraConverterTool lang={lang} />
      ) : (
        <MemoChecklistTool lang={lang} />
      )}
    </section>
  );
}
