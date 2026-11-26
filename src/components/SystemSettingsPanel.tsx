import {
  Bell,
  BellOff,
  Check,
  Globe,
  Moon,
  Palette,
  RefreshCw,
  RotateCcw,
  Sun,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  type AppLanguage,
  LANGUAGE_OPTIONS,
  getMessages,
} from '../utils/i18n';
import {
  COLOR_THEME_OPTIONS,
  type ColorThemeId,
  type ThemeMode,
} from '../utils/themeSettings';

interface SystemSettingsPanelProps {
  lang: AppLanguage;
  onChangeLang: (lang: AppLanguage) => void;
  themeMode: ThemeMode;
  onToggleThemeMode: () => void;
  colorTheme: ColorThemeId;
  onSelectColorTheme: (id: ColorThemeId) => void;
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
}

export function SystemSettingsPanel({
  lang,
  onChangeLang,
  themeMode,
  onToggleThemeMode,
  colorTheme,
  onSelectColorTheme,
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
}: SystemSettingsPanelProps) {
  const m = getMessages(lang);
  const isDark = themeMode === 'dark';
  const activeThemeOption =
    COLOR_THEME_OPTIONS.find((opt) => opt.id === colorTheme) ?? COLOR_THEME_OPTIONS[0];
  const activeLangOption =
    LANGUAGE_OPTIONS.find((opt) => opt.id === lang) ?? LANGUAGE_OPTIONS[0];

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
    </section>
  );
}
