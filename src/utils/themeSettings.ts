import type { AppLanguage } from './i18n';

export type ThemeMode = 'dark' | 'light';

export type ColorThemeId = 'sky' | 'emerald' | 'indigo' | 'amber' | 'slate';

export type BackgroundMotionId = 'off' | 'spring' | 'summer' | 'autumn' | 'winter' | 'space';

export interface ColorThemeOption {
  id: ColorThemeId;
  name: string;
  description: string;
  darkAccent: string;
  lightAccent: string;
  darkCanvas: string;
  darkSurface: string;
  lightCanvas: string;
  lightSurface: string;
  mapLandDark: string;
  mapLandLight: string;
  mapStrokeDark: string;
  mapStrokeLight: string;
  mapSeaDark: string;
  mapSeaLight: string;
}

export interface BackgroundMotionOption {
  id: BackgroundMotionId;
  darkOnly?: boolean;
  label: Record<AppLanguage, string>;
  description: Record<AppLanguage, string>;
  darkPreviewGradient: string;
  lightPreviewGradient: string;
  accentDot: string;
}

export interface ThemeSettings {
  mode: ThemeMode;
  colorTheme: ColorThemeId;
  backgroundMotion: BackgroundMotionId;
}

export const THEME_MODE_STORAGE_KEY = 'nein_theme_mode';
export const COLOR_THEME_STORAGE_KEY = 'nein_color_theme';
export const BACKGROUND_MOTION_STORAGE_KEY = 'nein_bg_motion';

export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  mode: 'dark',
  colorTheme: 'sky',
  backgroundMotion: 'off',
};

export const BACKGROUND_MOTION_OPTIONS: BackgroundMotionOption[] = [
  {
    id: 'off',
    label: {
      ja: 'OFF',
      en: 'OFF',
      zh: '关闭 (OFF)',
      ko: 'OFF',
    },
    description: {
      ja: '背景モーションなし・標準の無地背景',
      en: 'No background motion — standard solid backdrop',
      zh: '无背景动态效果・标准纯色背景',
      ko: '배경 모션 없음・기본 단색 배경',
    },
    darkPreviewGradient: 'linear-gradient(180deg, #0b101b 0%, #090d16 100%)',
    lightPreviewGradient: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
    accentDot: '#64748b',
  },
  {
    id: 'spring',
    label: {
      ja: '春（桜）',
      en: 'Spring (Sakura)',
      zh: '春（樱花）',
      ko: '봄 (벚꽃)',
    },
    description: {
      ja: '桜の咲く公園と舞い散る桜の花びら',
      en: 'Cherry blossom park horizon with drifting sakura petals',
      zh: '樱花盛开的公园与飘落花瓣',
      ko: '벚꽃 핀 공원과 흩날리는 벚꽃잎',
    },
    darkPreviewGradient: 'linear-gradient(180deg, #111328 0%, #2b1936 68%, #1d2722 100%)',
    lightPreviewGradient: 'linear-gradient(180deg, #e0f2fe 0%, #fce7f3 66%, #bbf7d0 100%)',
    accentDot: '#f472b6',
  },
  {
    id: 'summer',
    label: {
      ja: '夏（雲・海）',
      en: 'Summer (Clouds & Sea)',
      zh: '夏（流云与海）',
      ko: '여름 (구름・바다)',
    },
    description: {
      ja: 'ゆっくり流れる夏の雲と穏やかな海辺',
      en: 'Slowly drifting summer clouds over a shimmering sea',
      zh: '缓缓飘动的夏日云朵与宁静海面',
      ko: '천천히 흐르는 여름 구름과 잔잔한 바다',
    },
    darkPreviewGradient: 'linear-gradient(180deg, #071226 0%, #102548 64%, #0c3a5e 100%)',
    lightPreviewGradient: 'linear-gradient(180deg, #7dd3fc 0%, #e0f2fe 64%, #0284c7 100%)',
    accentDot: '#38bdf8',
  },
  {
    id: 'autumn',
    label: {
      ja: '秋（紅葉）',
      en: 'Autumn (Foliage)',
      zh: '秋（红叶）',
      ko: '가을 (단풍)',
    },
    description: {
      ja: '紅葉で紅く染まった山並みと舞い落ちる葉',
      en: 'Crimson autumn mountain ridges with falling maple leaves',
      zh: '被红叶染红的群山与飘落枫叶',
      ko: '단풍으로 붉게 물든 산과 흩날리는 낙엽',
    },
    darkPreviewGradient: 'linear-gradient(180deg, #160d12 0%, #3b1718 66%, #7c2d12 100%)',
    lightPreviewGradient: 'linear-gradient(180deg, #fef3c7 0%, #fed7aa 64%, #c2410c 100%)',
    accentDot: '#ea580c',
  },
  {
    id: 'winter',
    label: {
      ja: '冬（雪）',
      en: 'Winter (Snow)',
      zh: '冬（飘雪）',
      ko: '겨울 (눈)',
    },
    description: {
      ja: '雪が積もった静かな風景と舞い降る雪',
      en: 'Snow-covered ground horizon with gently falling snowflakes',
      zh: '白雪皑皑的地面与静静飘落的雪花',
      ko: '눈이 쌓인 설경과 고요히 내리는 눈송이',
    },
    darkPreviewGradient: 'linear-gradient(180deg, #091120 0%, #17253d 68%, #cbd5e1 100%)',
    lightPreviewGradient: 'linear-gradient(180deg, #cbd5e1 0%, #e2e8f0 64%, #ffffff 100%)',
    accentDot: '#93c5fd',
  },
  {
    id: 'space',
    darkOnly: true,
    label: {
      ja: '宇宙（星）',
      en: 'Space (Stars)',
      zh: '宇宙（星空）',
      ko: '우주 (별빛)',
    },
    description: {
      ja: '煌めく星空と流れ星（ダークモード限定）',
      en: 'Twinkling starfield and shooting stars (Dark Mode only)',
      zh: '璀璨星空与流星（仅限深色模式）',
      ko: '반짝이는 별빛과 유성 (다크 모드 전용)',
    },
    darkPreviewGradient: 'linear-gradient(180deg, #030612 0%, #0b1433 70%, #172554 100%)',
    lightPreviewGradient: 'linear-gradient(180deg, #1e293b 0%, #334155 100%)',
    accentDot: '#a78bfa',
  },
];

export const COLOR_THEME_OPTIONS: ColorThemeOption[] = [
  {
    id: 'sky',
    name: 'オーシャンスカイ',
    description: '標準テーマ・クリアなブルーアクセント',
    darkAccent: '#0EA5E9',
    lightAccent: '#0284C7',
    darkCanvas: '#090D16',
    darkSurface: '#0D131F',
    lightCanvas: '#F1F5F9',
    lightSurface: '#FFFFFF',
    mapLandDark: '#162135',
    mapLandLight: '#DBEAFE',
    mapStrokeDark: '#3B4F70',
    mapStrokeLight: '#64748B',
    mapSeaDark: '#070B13',
    mapSeaLight: '#EFF6FF',
  },
  {
    id: 'emerald',
    name: 'フォレストグリーン',
    description: '目に優しい深緑・防災グリーン',
    darkAccent: '#10B981',
    lightAccent: '#059669',
    darkCanvas: '#07100D',
    darkSurface: '#0B1813',
    lightCanvas: '#EEF5F1',
    lightSurface: '#FFFFFF',
    mapLandDark: '#122921',
    mapLandLight: '#D1FAE5',
    mapStrokeDark: '#2D604E',
    mapStrokeLight: '#4D7C6B',
    mapSeaDark: '#050D0A',
    mapSeaLight: '#ECFDF5',
  },
  {
    id: 'indigo',
    name: 'ディープインディゴ',
    description: '落ち着いた藍・ナイトダッシュボード',
    darkAccent: '#6366F1',
    lightAccent: '#4F46E5',
    darkCanvas: '#090B16',
    darkSurface: '#0F1324',
    lightCanvas: '#F0F2FA',
    lightSurface: '#FFFFFF',
    mapLandDark: '#171D38',
    mapLandLight: '#E0E7FF',
    mapStrokeDark: '#3F4B85',
    mapStrokeLight: '#6366A1',
    mapSeaDark: '#060811',
    mapSeaLight: '#EEF2FF',
  },
  {
    id: 'amber',
    name: 'アンバーゴールド',
    description: '視認性重視の暖色系コントラスト',
    darkAccent: '#F59E0B',
    lightAccent: '#B45309',
    darkCanvas: '#100D08',
    darkSurface: '#18130C',
    lightCanvas: '#F6F3EC',
    lightSurface: '#FFFFFF',
    mapLandDark: '#292114',
    mapLandLight: '#FEF3C7',
    mapStrokeDark: '#6B5532',
    mapStrokeLight: '#9A7B4F',
    mapSeaDark: '#0B0905',
    mapSeaLight: '#FFFBEB',
  },
  {
    id: 'slate',
    name: 'モノクロスレート',
    description: '情報を際立たせる無彩色ニュートラル',
    darkAccent: '#E2E8F0',
    lightAccent: '#18181B',
    darkCanvas: '#0A0B0E',
    darkSurface: '#121419',
    lightCanvas: '#F4F4F5',
    lightSurface: '#FFFFFF',
    mapLandDark: '#1E2129',
    mapLandLight: '#E4E4E7',
    mapStrokeDark: '#474D5E',
    mapStrokeLight: '#71717A',
    mapSeaDark: '#07080A',
    mapSeaLight: '#FAFAFA',
  },
];

export function isValidThemeMode(value: unknown): value is ThemeMode {
  return value === 'dark' || value === 'light';
}

export function isValidColorTheme(value: unknown): value is ColorThemeId {
  return COLOR_THEME_OPTIONS.some((opt) => opt.id === value);
}

export function isValidBackgroundMotion(value: unknown): value is BackgroundMotionId {
  return BACKGROUND_MOTION_OPTIONS.some((opt) => opt.id === value);
}

export function resolveEffectiveBackgroundMotion(
  motion: BackgroundMotionId,
  mode: ThemeMode,
): BackgroundMotionId {
  if (motion === 'space' && mode !== 'dark') {
    return 'off';
  }
  return motion;
}

export function getColorThemeOption(id: ColorThemeId): ColorThemeOption {
  return COLOR_THEME_OPTIONS.find((opt) => opt.id === id) ?? COLOR_THEME_OPTIONS[0];
}

export function getBackgroundMotionOption(id: BackgroundMotionId): BackgroundMotionOption {
  return BACKGROUND_MOTION_OPTIONS.find((opt) => opt.id === id) ?? BACKGROUND_MOTION_OPTIONS[0];
}

export function loadThemeSettings(): ThemeSettings {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return DEFAULT_THEME_SETTINGS;
    }
    const storedMode = window.localStorage.getItem(THEME_MODE_STORAGE_KEY);
    const storedColor = window.localStorage.getItem(COLOR_THEME_STORAGE_KEY);
    const storedMotion = window.localStorage.getItem(BACKGROUND_MOTION_STORAGE_KEY);
    return {
      mode: isValidThemeMode(storedMode) ? storedMode : DEFAULT_THEME_SETTINGS.mode,
      colorTheme: isValidColorTheme(storedColor)
        ? storedColor
        : DEFAULT_THEME_SETTINGS.colorTheme,
      backgroundMotion: isValidBackgroundMotion(storedMotion)
        ? storedMotion
        : DEFAULT_THEME_SETTINGS.backgroundMotion,
    };
  } catch {
    return DEFAULT_THEME_SETTINGS;
  }
}

export function saveThemeSettings(settings: ThemeSettings): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(THEME_MODE_STORAGE_KEY, settings.mode);
      window.localStorage.setItem(COLOR_THEME_STORAGE_KEY, settings.colorTheme);
      window.localStorage.setItem(BACKGROUND_MOTION_STORAGE_KEY, settings.backgroundMotion);
    }
  } catch {
    // Ignore storage quota or privacy mode errors
  }
}

export function applyThemeToDocument(settings: ThemeSettings): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (settings.mode === 'dark') {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }
  root.setAttribute('data-color-theme', settings.colorTheme);
  const effectiveMotion = resolveEffectiveBackgroundMotion(
    settings.backgroundMotion,
    settings.mode,
  );
  root.setAttribute('data-bg-motion', effectiveMotion);
}
