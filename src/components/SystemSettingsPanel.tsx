import {
  ArrowDown,
  ArrowUp,
  Ban,
  Bell,
  BellOff,
  Check,
  CloudSun,
  Flower2,
  Globe,
  Leaf,
  LocateFixed,
  Lock,
  MapPin,
  Moon,
  Palette,
  Plus,
  RefreshCw,
  RotateCcw,
  Snowflake,
  Sparkles,
  Sun,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useState } from 'react';
import { JAPAN_WEATHER_OFFICES } from '../data/japanWeatherRegions';
import type {
  NotificationCategoryKey,
  NotificationHistoryEntry,
  NotificationPreferences,
  RegisteredRegion,
} from '../types/disaster';
import {
  type AppLanguage,
  LANGUAGE_OPTIONS,
  getMessages,
} from '../utils/i18n';
import { getExtendedMessages } from '../utils/i18nExtended';
import { playChimeWithVolume } from '../utils/notificationCenter';
import {
  BACKGROUND_MOTION_OPTIONS,
  type BackgroundMotionId,
  COLOR_THEME_OPTIONS,
  type ColorThemeId,
  type ThemeMode,
  resolveEffectiveBackgroundMotion,
} from '../utils/themeSettings';
import { formatJstTimestamp } from '../utils/weatherParser';

const BG_MOTION_COPY: Record<
  AppLanguage,
  {
    title: string;
    current: string;
    desc: string;
    darkOnlyBadge: string;
    darkModeHint: string;
    pausedInLight: string;
    darkPreview: string;
    lightPreview: string;
  }
> = {
  ja: {
    title: '背景モーション（季節・宇宙）',
    current: '現在:',
    desc: '季節の情景や宇宙の星を背景に表示します。ダーク・ライトモードで見え方が変化し、画面下部に各テーマの風景（公園・海・紅葉の山・雪景色）が描かれます。',
    darkOnlyBadge: 'ダークモード限定',
    darkModeHint: 'ダークモード時のみ選択可能',
    pausedInLight: '「宇宙（星）」はダークモード限定のため、ライトモード中は一時的にOFFになっています。',
    darkPreview: 'ダーク',
    lightPreview: 'ライト',
  },
  en: {
    title: 'Background Motion (Seasons & Space)',
    current: 'Current:',
    desc: 'Display subtle animated scenery behind the workspace. Visual tones adapt to Dark/Light mode with grounded horizon scenery (park, sea, autumn mountains, snow).',
    darkOnlyBadge: 'Dark Mode Only',
    darkModeHint: 'Available in Dark Mode only',
    pausedInLight: 'Space (Stars) is Dark Mode only and is temporarily paused while Light Mode is active.',
    darkPreview: 'Dark',
    lightPreview: 'Light',
  },
  zh: {
    title: '背景动态效果（四季・宇宙）',
    current: '当前：',
    desc: '在背景中显示细腻的四季景色或星空动态。深色与浅色模式呈现不同氛围，画面底部带有公园、海面、红叶山峦、雪地等地景。',
    darkOnlyBadge: '仅限深色模式',
    darkModeHint: '仅深色模式可选',
    pausedInLight: '「宇宙（星空）」仅限深色模式，浅色模式下已暂时关闭。',
    darkPreview: '深色',
    lightPreview: '浅色',
  },
  ko: {
    title: '배경 모션 (계절・우주)',
    current: '현재:',
    desc: '배경에 계절 풍경과 별빛 모션을 표시합니다. 다크・라이트 모드에 따라 분위기가 달라지며 하단에 공원・바다・단풍산・설경 지면이 표현됩니다.',
    darkOnlyBadge: '다크 모드 전용',
    darkModeHint: '다크 모드에서만 선택 가능',
    pausedInLight: '「우주 (별빛)」은 다크 모드 전용으로, 라이트 모드에서는 일시적으로 OFF 상태입니다.',
    darkPreview: '다크',
    lightPreview: '라이트',
  },
};

function renderMotionIcon(id: BackgroundMotionId) {
  switch (id) {
    case 'spring':
      return <Flower2 className="h-4 w-4 text-pink-500 dark:text-pink-300" aria-hidden="true" />;
    case 'summer':
      return <CloudSun className="h-4 w-4 text-sky-500 dark:text-sky-300" aria-hidden="true" />;
    case 'autumn':
      return <Leaf className="h-4 w-4 text-orange-600 dark:text-orange-400" aria-hidden="true" />;
    case 'winter':
      return <Snowflake className="h-4 w-4 text-blue-500 dark:text-sky-200" aria-hidden="true" />;
    case 'space':
      return <Sparkles className="h-4 w-4 text-violet-500 dark:text-violet-300" aria-hidden="true" />;
    default:
      return <Ban className="h-4 w-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />;
  }
}

interface SystemSettingsPanelProps {
  lang: AppLanguage;
  onChangeLang: (lang: AppLanguage) => void;
  themeMode: ThemeMode;
  onToggleThemeMode: () => void;
  colorTheme: ColorThemeId;
  onSelectColorTheme: (id: ColorThemeId) => void;
  backgroundMotion: BackgroundMotionId;
  onSelectBackgroundMotion: (id: BackgroundMotionId) => void;
  onResetTheme: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  notificationEnabled: boolean;
  onToggleNotification: () => void;
  notificationHint: string | null;
  autoUpdateEnabled: boolean;
  onToggleAutoUpdate: () => void;
  pollIntervalSec: number;
  onChangePollInterval: (sec: number) => void;
  registeredRegions: RegisteredRegion[];
  onAddRegion: (officeCode: string) => void;
  onRemoveRegion: (id: string) => void;
  onMoveRegion: (id: string, dir: -1 | 1) => void;
  onDetectNearestRegion: (lat: number, lon: number) => void;
  onOpenWeatherForRegion: () => void;
  notificationPrefs: NotificationPreferences;
  onChangeNotificationPrefs: (next: NotificationPreferences) => void;
  notificationHistory: NotificationHistoryEntry[];
  onClearNotificationHistory: () => void;
}

export function SystemSettingsPanel({
  lang,
  onChangeLang,
  themeMode,
  onToggleThemeMode,
  colorTheme,
  onSelectColorTheme,
  backgroundMotion,
  onSelectBackgroundMotion,
  onResetTheme,
  soundEnabled,
  onToggleSound,
  notificationEnabled,
  onToggleNotification,
  notificationHint,
  autoUpdateEnabled,
  onToggleAutoUpdate,
  pollIntervalSec,
  onChangePollInterval,
  registeredRegions,
  onAddRegion,
  onRemoveRegion,
  onMoveRegion,
  onDetectNearestRegion,
  onOpenWeatherForRegion,
  notificationPrefs,
  onChangeNotificationPrefs,
  notificationHistory,
  onClearNotificationHistory,
}: SystemSettingsPanelProps) {
  const m = getMessages(lang);
  const ext = getExtendedMessages(lang);
  const bgCopy = BG_MOTION_COPY[lang] ?? BG_MOTION_COPY.ja;
  const [selectedAddOffice, setSelectedAddOffice] = useState('130000');
  const [geoStatus, setGeoStatus] = useState<string | null>(null);
  const isDark = themeMode === 'dark';
  const activeThemeOption =
    COLOR_THEME_OPTIONS.find((opt) => opt.id === colorTheme) ?? COLOR_THEME_OPTIONS[0];
  const activeLangOption =
    LANGUAGE_OPTIONS.find((opt) => opt.id === lang) ?? LANGUAGE_OPTIONS[0];
  const effectiveBackgroundMotion = resolveEffectiveBackgroundMotion(backgroundMotion, themeMode);
  const activeMotionOption =
    BACKGROUND_MOTION_OPTIONS.find((opt) => opt.id === effectiveBackgroundMotion) ??
    BACKGROUND_MOTION_OPTIONS[0];
  const isSpacePausedInLight = backgroundMotion === 'space' && !isDark;

  const handleRequestGeolocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoStatus(ext.regions.geolocateDenied);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onDetectNearestRegion(pos.coords.latitude, pos.coords.longitude);
        setGeoStatus(null);
      },
      () => {
        setGeoStatus(ext.regions.geolocateDenied);
      },
      { timeout: 8000 },
    );
  };

  const categoryKeys: NotificationCategoryKey[] = [
    'eew',
    'quake',
    'tsunami',
    'weather_warning',
    'typhoon',
    'landslide_flood',
    'volcano',
    'heatstroke',
  ];

  return (
    <section
      aria-label={m.settings.title}
      data-testid="system-settings-panel"
      className="mx-auto flex w-full max-w-4xl flex-col gap-5"
    >
      {/* Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--nein-border)] bg-[var(--nein-surface)] p-5 sm:p-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-2xl">
            {m.settings.title}
          </h1>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            {m.settings.subtitle}
          </p>
        </div>

        <button
          type="button"
          data-testid="reset-theme-settings-btn"
          onClick={onResetTheme}
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--nein-border)] bg-[var(--nein-sub)] px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200/70 dark:text-slate-200 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nein-accent)]"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{m.settings.resetAppearance}</span>
        </button>
      </div>

      {/* 1. International Language Switcher */}
      <div className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-surface)] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--nein-border-subtle)] pb-3.5">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {m.settings.languageTitle}
            </h2>
          </div>
          <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
            {m.settings.languageCurrent}{' '}
            <strong className="text-[var(--nein-accent-text)]">
              {activeLangOption.nativeName}
            </strong>
          </span>
        </div>

        <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">
          {m.settings.languageDesc}
        </p>

        <div
          role="radiogroup"
          aria-label={m.settings.languageTitle}
          data-testid="language-selector-group"
          className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {LANGUAGE_OPTIONS.map((opt) => {
            const isSelected = opt.id === lang;
            return (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                data-testid={`lang-btn-${opt.id}`}
                onClick={() => onChangeLang(opt.id)}
                className={`flex flex-col justify-between rounded-lg border p-3.5 text-left transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nein-accent)] ${
                  isSelected
                    ? 'border-[var(--nein-accent)] bg-[var(--nein-accent-soft)]'
                    : 'border-[var(--nein-border)] bg-[var(--nein-sub)] hover:border-slate-400 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded border border-[var(--nein-border)] bg-[var(--nein-surface)] px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-slate-700 dark:text-slate-300">
                    {opt.codeLabel}
                  </span>
                  {isSelected && (
                    <span className="inline-flex items-center gap-1 rounded bg-[var(--nein-accent)] px-2 py-0.5 text-[10px] font-bold text-[var(--nein-accent-contrast)]">
                      <Check className="h-3 w-3" aria-hidden="true" />
                      {m.settings.colorApplied}
                    </span>
                  )}
                </div>
                <div className="mt-2.5">
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {opt.nativeName}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                    {opt.subLabel}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Appearance Mode: Dark / Light ON/OFF Toggle */}
      <div className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-surface)] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)]">
              {isDark ? (
                <Moon className="h-5 w-5 text-[var(--nein-accent-text)]" aria-hidden="true" />
              ) : (
                <Sun className="h-5 w-5 text-[var(--nein-accent-text)]" aria-hidden="true" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {m.settings.modeTitle}
              </h2>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                {m.settings.modeDesc}
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={isDark}
            data-testid="theme-mode-switch"
            onClick={onToggleThemeMode}
            aria-label={m.settings.modeTitle}
            className="inline-flex min-h-[42px] items-center justify-between gap-3 rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] px-4 py-2 text-xs font-semibold text-slate-900 transition-colors hover:border-[var(--nein-accent-border)] dark:text-slate-100 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nein-accent)]"
          >
            <span className="flex items-center gap-2">
              {isDark ? (
                <Moon className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
              ) : (
                <Sun className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
              )}
              <span>{isDark ? m.settings.modeOnLabel : m.settings.modeOffLabel}</span>
            </span>

            <span
              aria-hidden="true"
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                isDark ? 'bg-[var(--nein-accent)]' : 'bg-slate-400'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                  isDark ? 'translate-x-4.5' : 'translate-x-1'
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      {/* 3. Dual-Mode Color Theme Button Selector */}
      <div className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-surface)] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--nein-border-subtle)] pb-3.5">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {m.settings.colorTitle}
            </h2>
          </div>
          <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
            {m.settings.colorCurrent}{' '}
            <strong className="text-[var(--nein-accent-text)]">{activeThemeOption.name}</strong>
          </span>
        </div>

        <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">
          {m.settings.colorDesc}
        </p>

        <div
          role="radiogroup"
          aria-label={m.settings.colorTitle}
          className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {COLOR_THEME_OPTIONS.map((option) => {
            const isSelected = option.id === colorTheme;
            const currentAccent = isDark ? option.darkAccent : option.lightAccent;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                data-testid={`color-theme-btn-${option.id}`}
                onClick={() => onSelectColorTheme(option.id)}
                className={`flex flex-col justify-between rounded-lg border p-3.5 text-left transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nein-accent)] ${
                  isSelected
                    ? 'border-[var(--nein-accent)] bg-[var(--nein-accent-soft)]'
                    : 'border-[var(--nein-border)] bg-[var(--nein-sub)] hover:border-slate-400 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  {/* Dual Dark/Light Palette Preview Swatch */}
                  <div
                    aria-hidden="true"
                    className="flex h-7 overflow-hidden rounded border border-slate-300 dark:border-slate-700"
                  >
                    <div
                      className="flex w-8 items-center justify-center"
                      style={{ backgroundColor: option.darkCanvas }}
                    >
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: option.darkAccent }}
                      />
                    </div>
                    <div
                      className="flex w-8 items-center justify-center border-l border-slate-300 dark:border-slate-700"
                      style={{ backgroundColor: option.lightCanvas }}
                    >
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: option.lightAccent }}
                      />
                    </div>
                  </div>

                  {isSelected ? (
                    <span
                      className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold"
                      style={{
                        backgroundColor: currentAccent,
                        color: 'var(--nein-accent-contrast)',
                      }}
                    >
                      <Check className="h-3 w-3" aria-hidden="true" />
                      {m.settings.colorApplied}
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {m.settings.colorSelect}
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {option.name}
                  </div>
                  <div className="mt-0.5 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                    {option.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Live Theme Contrast Preview Strip */}
        <div className="mt-5 rounded-lg border border-[var(--nein-border-subtle)] bg-[var(--nein-sub)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                {m.settings.previewLabel}（{isDark ? m.settings.previewModeDark : m.settings.previewModeLight} × {activeThemeOption.name}）
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <span className="font-mono tabular-nums text-[var(--nein-accent-text)] font-semibold">
                  {lang === 'en' ? 'Intensity 4' : lang === 'ko' ? '진도 4' : '震度 4'}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">M5.2</span>
                <span aria-hidden="true">·</span>
                <span>{m.settings.previewSampleQuake}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-md border border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--nein-accent-text)]">
                {m.settings.previewTabState}
              </span>
              <span className="rounded-md bg-[var(--nein-accent)] px-3 py-1.5 text-xs font-semibold text-[var(--nein-accent-contrast)]">
                {m.settings.previewActionBtn}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3.5. Background Motion Selector (OFF / Spring / Summer / Autumn / Winter / Space [Dark Only]) */}
      <div
        data-testid="bg-motion-section"
        className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-surface)] p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--nein-border-subtle)] pb-3.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {bgCopy.title}
            </h2>
          </div>
          <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
            {bgCopy.current}{' '}
            <strong
              data-testid="bg-motion-active-label"
              className="text-[var(--nein-accent-text)]"
            >
              {activeMotionOption.label[lang] ?? activeMotionOption.label.ja}
            </strong>
          </span>
        </div>

        <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">{bgCopy.desc}</p>

        {isSpacePausedInLight && (
          <div
            role="status"
            data-testid="bg-motion-space-paused-notice"
            className="mt-3 flex items-center gap-2 rounded-md border border-amber-400/50 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200"
          >
            <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{bgCopy.pausedInLight}</span>
          </div>
        )}

        <div
          role="radiogroup"
          aria-label={bgCopy.title}
          data-testid="bg-motion-selector-group"
          className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {BACKGROUND_MOTION_OPTIONS.map((opt) => {
            const isLocked = Boolean(opt.darkOnly) && !isDark;
            const isSelected = effectiveBackgroundMotion === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-disabled={isLocked}
                disabled={isLocked}
                data-testid={`bg-motion-btn-${opt.id}`}
                onClick={() => {
                  if (!isLocked) {
                    onSelectBackgroundMotion(opt.id);
                  }
                }}
                className={`flex flex-col justify-between rounded-lg border p-3.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nein-accent)] ${
                  isLocked
                    ? 'cursor-not-allowed border-[var(--nein-border)] bg-[var(--nein-sub)] opacity-55'
                    : isSelected
                      ? 'cursor-pointer border-[var(--nein-accent)] bg-[var(--nein-accent-soft)]'
                      : 'cursor-pointer border-[var(--nein-border)] bg-[var(--nein-sub)] hover:border-slate-400 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  {/* Scenic Dark / Light Mini Preview */}
                  <div
                    aria-hidden="true"
                    className="flex h-7 overflow-hidden rounded border border-slate-300 dark:border-slate-700"
                  >
                    <div
                      className="flex w-9 items-center justify-center"
                      style={{ background: opt.darkPreviewGradient }}
                      title={bgCopy.darkPreview}
                    >
                      <span
                        className="h-2 w-2 rounded-full ring-1 ring-white/50"
                        style={{ backgroundColor: opt.accentDot }}
                      />
                    </div>
                    {!opt.darkOnly && (
                      <div
                        className="flex w-9 items-center justify-center border-l border-slate-300 dark:border-slate-700"
                        style={{ background: opt.lightPreviewGradient }}
                        title={bgCopy.lightPreview}
                      >
                        <span
                          className="h-2 w-2 rounded-full ring-1 ring-slate-900/20"
                          style={{ backgroundColor: opt.accentDot }}
                        />
                      </div>
                    )}
                  </div>

                  {isLocked ? (
                    <span className="inline-flex items-center gap-1 rounded border border-slate-400/50 bg-slate-500/15 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                      <Lock className="h-2.5 w-2.5" aria-hidden="true" />
                      {bgCopy.darkOnlyBadge}
                    </span>
                  ) : isSelected ? (
                    <span className="inline-flex items-center gap-1 rounded bg-[var(--nein-accent)] px-2 py-0.5 text-[11px] font-bold text-[var(--nein-accent-contrast)]">
                      <Check className="h-3 w-3" aria-hidden="true" />
                      {m.settings.colorApplied}
                    </span>
                  ) : opt.darkOnly ? (
                    <span className="inline-flex items-center gap-1 rounded border border-violet-400/40 bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:text-violet-200">
                      <Moon className="h-2.5 w-2.5" aria-hidden="true" />
                      {bgCopy.darkOnlyBadge}
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {m.settings.colorSelect}
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-slate-100">
                    {renderMotionIcon(opt.id)}
                    <span>{opt.label[lang] ?? opt.label.ja}</span>
                  </div>
                  <div className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                    {isLocked ? bgCopy.darkModeHint : (opt.description[lang] ?? opt.description.ja)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Operational Settings (Notifications, Sound, Polling) */}
      <div className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-surface)] p-5 sm:p-6">
        <h2 className="border-b border-[var(--nein-border-subtle)] pb-3 text-sm font-bold text-slate-900 dark:text-slate-100">
          {m.settings.opsTitle}
        </h2>

        <div className="mt-3 divide-y divide-[var(--nein-border-subtle)]">
          {/* Browser Push Notification */}
          <div className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                {m.settings.pushTitle}
              </div>
              <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                {m.settings.pushDesc}
              </p>
              {notificationHint && (
                <p className="mt-1 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                  {notificationHint}
                </p>
              )}
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={notificationEnabled}
              onClick={onToggleNotification}
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                notificationEnabled
                  ? 'border-emerald-600/40 bg-emerald-500/15 text-emerald-800 dark:border-emerald-500/40 dark:text-emerald-200'
                  : 'border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-700 dark:text-slate-300'
              }`}
            >
              {notificationEnabled ? (
                <Bell className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              ) : (
                <BellOff className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
              )}
              <span>{notificationEnabled ? m.toolbar.notifyOn : m.toolbar.notifyOff}</span>
            </button>
          </div>

          {/* EEW Chime */}
          <div className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                {m.settings.soundTitle}
              </div>
              <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                {m.settings.soundDesc}
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={soundEnabled}
              onClick={onToggleSound}
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                soundEnabled
                  ? 'border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] text-[var(--nein-accent-text)]'
                  : 'border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-700 dark:text-slate-300'
              }`}
            >
              {soundEnabled ? (
                <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <VolumeX className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
              )}
              <span>{soundEnabled ? m.toolbar.soundOn : m.toolbar.soundOff}</span>
            </button>
          </div>

          {/* Auto Update */}
          <div className="flex flex-col gap-3 pt-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                {m.settings.pollingTitle}
              </div>
              <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                {m.settings.pollingDesc}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                role="switch"
                aria-checked={autoUpdateEnabled}
                onClick={onToggleAutoUpdate}
                className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  autoUpdateEnabled
                    ? 'border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] text-[var(--nein-accent-text)]'
                    : 'border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-700 dark:text-slate-300'
                }`}
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{autoUpdateEnabled ? m.toolbar.autoOn : m.toolbar.autoOff}</span>
              </button>

              <label htmlFor="settings-poll-interval" className="sr-only">
                {m.settings.pollingTitle}
              </label>
              <select
                id="settings-poll-interval"
                value={pollIntervalSec}
                disabled={!autoUpdateEnabled}
                onChange={(e) => onChangePollInterval(Number(e.target.value))}
                className="rounded-md border border-[var(--nein-border)] bg-[var(--nein-sub)] px-2.5 py-1.5 font-mono text-xs tabular-nums text-slate-900 dark:text-slate-100 disabled:opacity-45 cursor-pointer"
              >
                <option value={10}>10{m.toolbar.intervalUnitSec}</option>
                <option value={30}>30{m.toolbar.intervalUnitSec}</option>
                <option value={60}>60{m.toolbar.intervalUnitSec}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Registered Regions Watchlist */}
      <div className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-surface)] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--nein-border-subtle)] pb-3.5">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {ext.regions.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleRequestGeolocation}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--nein-accent-text)] cursor-pointer"
          >
            <LocateFixed className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{ext.regions.geolocateBtn}</span>
          </button>
        </div>

        <p className="mt-2.5 text-xs text-slate-600 dark:text-slate-400">
          {ext.regions.subtitle}
        </p>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          {ext.regions.geolocatePermissionNote}
        </p>
        {geoStatus && (
          <p className="mt-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
            {geoStatus}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select
            aria-label={ext.regions.addRegion}
            value={selectedAddOffice}
            onChange={(e) => setSelectedAddOffice(e.target.value)}
            className="min-w-[200px] flex-1 rounded-md border border-[var(--nein-border)] bg-[var(--nein-sub)] px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 cursor-pointer"
          >
            {JAPAN_WEATHER_OFFICES.map((o) => (
              <option key={o.officeCode} value={o.officeCode}>
                {o.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onAddRegion(selectedAddOffice)}
            className="inline-flex items-center gap-1 rounded-md bg-[var(--nein-accent)] px-3 py-1.5 text-xs font-semibold text-[var(--nein-accent-contrast)] cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{ext.regions.addRegion}</span>
          </button>
        </div>

        <div className="mt-3 space-y-2">
          {registeredRegions.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">{ext.regions.empty}</p>
          ) : (
            registeredRegions.map((reg, idx) => (
              <div
                key={reg.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] px-3 py-2 text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{reg.label}</span>
                  <span className="ml-2 font-mono text-[11px] text-slate-500">
                    ({reg.officeCode})
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={onOpenWeatherForRegion}
                    className="rounded border border-[var(--nein-border)] bg-[var(--nein-surface)] px-2 py-1 text-[11px] font-medium text-[var(--nein-accent-text)] cursor-pointer"
                  >
                    {ext.regions.openWeather}
                  </button>
                  <button
                    type="button"
                    disabled={idx === 0}
                    aria-label={ext.regions.moveUp}
                    onClick={() => onMoveRegion(reg.id, -1)}
                    className="rounded border border-[var(--nein-border)] bg-[var(--nein-surface)] p-1 text-slate-600 disabled:opacity-40 cursor-pointer"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === registeredRegions.length - 1}
                    aria-label={ext.regions.moveDown}
                    onClick={() => onMoveRegion(reg.id, 1)}
                    className="rounded border border-[var(--nein-border)] bg-[var(--nein-surface)] p-1 text-slate-600 disabled:opacity-40 cursor-pointer"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    aria-label={ext.regions.remove}
                    onClick={() => onRemoveRegion(reg.id)}
                    className="rounded border border-red-400/50 bg-red-500/10 p-1 text-red-600 dark:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 6. Expanded Multi-Hazard Notification Matrix & History */}
      <div className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-surface)] p-5 sm:p-6">
        <div className="border-b border-[var(--nein-border-subtle)] pb-3.5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {ext.notifyExt.title}
          </h2>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            {ext.notifyExt.subtitle}
          </p>
        </div>

        <div className="mt-4">
          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-2">
            {ext.notifyExt.categoriesLabel}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {categoryKeys.map((key) => {
              const checked = Boolean(notificationPrefs.enabledCategories[key]);
              return (
                <label
                  key={key}
                  className="flex items-center gap-2 rounded border border-[var(--nein-border)] bg-[var(--nein-sub)] px-2.5 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      onChangeNotificationPrefs({
                        ...notificationPrefs,
                        enabledCategories: {
                          ...notificationPrefs.enabledCategories,
                          [key]: !checked,
                        },
                      })
                    }
                    className="h-3.5 w-3.5 accent-[var(--nein-accent)] cursor-pointer"
                  />
                  <span>{ext.notifyExt.categories[key]}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label
              htmlFor="notify-min-scale"
              className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1"
            >
              {ext.notifyExt.minScaleLabel}
            </label>
            <select
              id="notify-min-scale"
              value={notificationPrefs.minQuakeScale}
              onChange={(e) =>
                onChangeNotificationPrefs({
                  ...notificationPrefs,
                  minQuakeScale: Number(e.target.value),
                })
              }
              className="w-full rounded-md border border-[var(--nein-border)] bg-[var(--nein-sub)] px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 cursor-pointer"
            >
              <option value={10}>1+</option>
              <option value={20}>2+</option>
              <option value={30}>3+</option>
              <option value={40}>4+</option>
              <option value={45}>5-+</option>
              <option value={50}>5++</option>
              <option value={55}>6-+</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="notify-warning-filter"
              className="block text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1"
            >
              {ext.notifyExt.warningFilterLabel}
            </label>
            <select
              id="notify-warning-filter"
              value={notificationPrefs.warningLevelFilter}
              onChange={(e) =>
                onChangeNotificationPrefs({
                  ...notificationPrefs,
                  warningLevelFilter: e.target.value as 'all' | 'warning_only' | 'special_only',
                })
              }
              className="w-full rounded-md border border-[var(--nein-border)] bg-[var(--nein-sub)] px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 cursor-pointer"
            >
              <option value="all">All (Special + Warning + Advisory)</option>
              <option value="warning_only">Warning + Special</option>
              <option value="special_only">Special Warning Only</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1">
              <label htmlFor="notify-chime-volume">{ext.notifyExt.volumeLabel}</label>
              <span className="font-mono">{Math.round(notificationPrefs.chimeVolume * 100)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="notify-chime-volume"
                type="range"
                min={0}
                max={100}
                value={Math.round(notificationPrefs.chimeVolume * 100)}
                onChange={(e) =>
                  onChangeNotificationPrefs({
                    ...notificationPrefs,
                    chimeVolume: Number(e.target.value) / 100,
                  })
                }
                className="flex-1 accent-[var(--nein-accent)] cursor-pointer"
              />
              <button
                type="button"
                onClick={() => playChimeWithVolume(notificationPrefs.chimeVolume, false)}
                className="rounded border border-[var(--nein-border)] bg-[var(--nein-sub)] px-2.5 py-1 text-[11px] font-medium text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                {ext.notifyExt.testChimeBtn}
              </button>
            </div>
          </div>
        </div>

        <label className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer">
          <input
            type="checkbox"
            checked={notificationPrefs.inAppToasts}
            onChange={() =>
              onChangeNotificationPrefs({
                ...notificationPrefs,
                inAppToasts: !notificationPrefs.inAppToasts,
              })
            }
            className="h-4 w-4 accent-[var(--nein-accent)] cursor-pointer"
          />
          <span>{ext.notifyExt.inAppLabel}</span>
        </label>

        <p className="mt-3 rounded border border-amber-400/50 bg-amber-500/10 p-2.5 text-[11px] text-amber-900 dark:text-amber-200">
          {ext.notifyExt.deliveryCaveat}
        </p>

        {/* Notification History */}
        <div className="mt-4 border-t border-[var(--nein-border-subtle)] pt-3.5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {ext.notifyExt.historyTitle} ({notificationHistory.length})
            </h3>
            {notificationHistory.length > 0 && (
              <button
                type="button"
                onClick={onClearNotificationHistory}
                className="text-[11px] font-medium text-red-600 dark:text-red-400 hover:underline cursor-pointer"
              >
                {ext.notifyExt.clearHistory}
              </button>
            )}
          </div>

          {notificationHistory.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {ext.notifyExt.emptyHistory}
            </p>
          ) : (
            <div className="mt-2 max-h-48 space-y-1.5 overflow-y-auto">
              {notificationHistory.slice(0, 15).map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border border-[var(--nein-border-subtle)] bg-[var(--nein-sub)] px-2.5 py-1.5 text-xs"
                >
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {item.title} {item.isTest ? `[${ext.common.testSimulationWarning}]` : ''}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">
                    {formatJstTimestamp(item.timestampIso)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
