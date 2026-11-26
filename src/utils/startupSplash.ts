import type { AppLanguage } from './i18n';

export const STARTUP_BRAND_INTRO_MS = 650;
export const STARTUP_TOTAL_DURATION_MS = 2500;
export const STARTUP_EXIT_FADE_MS = 260;

export type StartupSplashPhase = 'brand' | 'loading' | 'done';

export interface StartupSplashState {
  phase: StartupSplashPhase;
  progress: number;
  loadingStepIndex: 0 | 1 | 2;
}

export interface StartupSplashCopy {
  subtitle: string;
  skipLabel: string;
  skipAriaLabel: string;
  loadingAriaLabel: string;
  steps: [string, string, string];
}

const STARTUP_COPY: Record<AppLanguage, StartupSplashCopy> = {
  ja: {
    subtitle: '総合気象・防災情報システム',
    skipLabel: 'スキップ',
    skipAriaLabel: '起動ローディング画面をスキップ',
    loadingAriaLabel: 'NEiN 起動ローディング',
    steps: [
      '気象庁・防災データソースへ接続中...',
      '地震・津波・気象情報を読み込み中...',
      'ワークスペースを準備しています...',
    ],
  },
  en: {
    subtitle: 'Integrated Meteorological & Disaster Information',
    skipLabel: 'Skip',
    skipAriaLabel: 'Skip startup loading screen',
    loadingAriaLabel: 'NEiN startup loading',
    steps: [
      'Connecting to JMA & disaster feeds...',
      'Loading earthquake, tsunami & weather data...',
      'Preparing workspace...',
    ],
  },
  zh: {
    subtitle: '综合气象与防灾信息系统',
    skipLabel: '跳过',
    skipAriaLabel: '跳过启动加载画面',
    loadingAriaLabel: 'NEiN 启动加载中',
    steps: [
      '正在连接气象与防灾数据源...',
      '正在加载地震、海啸与气象信息...',
      '正在准备工作区...',
    ],
  },
  ko: {
    subtitle: '종합 기상·방재 정보 시스템',
    skipLabel: '건너뛰기',
    skipAriaLabel: '시작 로딩 화면 건너뛰기',
    loadingAriaLabel: 'NEiN 시작 로딩 중',
    steps: [
      '기상·방재 데이터 소스에 연결 중...',
      '지진·쓰나미·기상 정보를 불러오는 중...',
      '워크스페이스를 준비하고 있습니다...',
    ],
  },
};

export function getStartupSplashCopy(lang: AppLanguage): StartupSplashCopy {
  return STARTUP_COPY[lang] ?? STARTUP_COPY.ja;
}

export function computeStartupSplashState(elapsedMs: number): StartupSplashState {
  const clamped = Math.max(0, Number.isFinite(elapsedMs) ? elapsedMs : 0);

  if (clamped < STARTUP_BRAND_INTRO_MS) {
    return {
      phase: 'brand',
      progress: 0,
      loadingStepIndex: 0,
    };
  }

  if (clamped >= STARTUP_TOTAL_DURATION_MS) {
    return {
      phase: 'done',
      progress: 100,
      loadingStepIndex: 2,
    };
  }

  const loadingWindow = STARTUP_TOTAL_DURATION_MS - STARTUP_BRAND_INTRO_MS;
  const linear = (clamped - STARTUP_BRAND_INTRO_MS) / loadingWindow;
  // Smooth ease-in-out-sine blended with linear so the bar accelerates naturally and finishes crisply at 100%
  const eased = 0.35 * linear + 0.65 * (0.5 - Math.cos(Math.PI * linear) / 2);
  const progress = Math.min(100, Math.max(0, Math.round(eased * 100)));

  const loadingStepIndex: 0 | 1 | 2 = progress < 36 ? 0 : progress < 74 ? 1 : 2;

  return {
    phase: 'loading',
    progress,
    loadingStepIndex,
  };
}
