export type ThemeMode = 'dark' | 'light';

export type ColorThemeId = 'sky' | 'emerald' | 'indigo' | 'amber' | 'slate';

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

export interface ThemeSettings {
  mode: ThemeMode;
  colorTheme: ColorThemeId;
}

export const THEME_MODE_STORAGE_KEY = 'nein_theme_mode';
export const COLOR_THEME_STORAGE_KEY = 'nein_color_theme';

export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  mode: 'dark',
  colorTheme: 'sky',
};

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

export function getColorThemeOption(id: ColorThemeId): ColorThemeOption {
  return COLOR_THEME_OPTIONS.find((opt) => opt.id === id) ?? COLOR_THEME_OPTIONS[0];
}

export function loadThemeSettings(): ThemeSettings {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return DEFAULT_THEME_SETTINGS;
    }
    const storedMode = window.localStorage.getItem(THEME_MODE_STORAGE_KEY);
    const storedColor = window.localStorage.getItem(COLOR_THEME_STORAGE_KEY);
    return {
      mode: isValidThemeMode(storedMode) ? storedMode : DEFAULT_THEME_SETTINGS.mode,
      colorTheme: isValidColorTheme(storedColor)
        ? storedColor
        : DEFAULT_THEME_SETTINGS.colorTheme,
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
}
