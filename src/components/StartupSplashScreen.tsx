import { SkipForward } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppLanguage } from '../utils/i18n';
import {
  STARTUP_EXIT_FADE_MS,
  STARTUP_TOTAL_DURATION_MS,
  type StartupSplashState,
  computeStartupSplashState,
  getStartupSplashCopy,
} from '../utils/startupSplash';

interface StartupSplashScreenProps {
  lang: AppLanguage;
  onComplete: () => void;
}

export function StartupSplashScreen({ lang, onComplete }: StartupSplashScreenProps) {
  const [splashState, setSplashState] = useState<StartupSplashState>(() =>
    computeStartupSplashState(0),
  );
  const [isExiting, setIsExiting] = useState(false);
  const completedRef = useRef(false);
  const exitTimerRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const copy = getStartupSplashCopy(lang);

  const triggerFinish = useCallback((immediate: boolean) => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsExiting(true);

    const delay = immediate ? 160 : STARTUP_EXIT_FADE_MS;
    exitTimerRef.current = window.setTimeout(() => {
      onCompleteRef.current();
    }, delay);
  }, []);

  useEffect(() => {
    completedRef.current = false;
    let rafId = 0;
    const getNow = () =>
      typeof performance !== 'undefined' && typeof performance.now === 'function'
        ? performance.now()
        : Date.now();
    const startTs = getNow();

    // Hard failsafe timer so background tabs or throttled iframes never hang on the splash screen
    const failsafeTimer = window.setTimeout(() => {
      if (!completedRef.current) {
        setSplashState(computeStartupSplashState(STARTUP_TOTAL_DURATION_MS));
        triggerFinish(false);
      }
    }, STARTUP_TOTAL_DURATION_MS + 120);

    const tick = () => {
      if (completedRef.current) return;
      const elapsed = Math.max(0, getNow() - startTs);
      const next = computeStartupSplashState(elapsed);
      setSplashState((prev) => {
        if (
          prev.phase === next.phase &&
          prev.progress === next.progress &&
          prev.loadingStepIndex === next.loadingStepIndex
        ) {
          return prev;
        }
        return next;
      });

      if (elapsed >= STARTUP_TOTAL_DURATION_MS) {
        triggerFinish(false);
        return;
      }

      if (typeof window.requestAnimationFrame === 'function') {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    if (typeof window.requestAnimationFrame === 'function') {
      rafId = window.requestAnimationFrame(tick);
    }

    return () => {
      window.clearTimeout(failsafeTimer);
      if (rafId && typeof window.cancelAnimationFrame === 'function') {
        window.cancelAnimationFrame(rafId);
      }
      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
    };
  }, [triggerFinish]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        triggerFinish(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerFinish]);

  const isLoadingPhase = splashState.phase === 'loading' || splashState.phase === 'done';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={copy.loadingAriaLabel}
      data-testid="startup-splash-overlay"
      data-phase={splashState.phase}
      data-exiting={isExiting}
      className={`fixed inset-0 z-[65] flex flex-col items-center justify-center overflow-hidden bg-[var(--nein-canvas)] px-6 text-slate-900 transition-opacity dark:text-slate-50 ${
        isExiting
          ? 'pointer-events-none opacity-0 duration-200'
          : 'opacity-100 duration-150'
      }`}
    >
      {/* Subtle concentric radar/horizon geometry anchored at screen center */}
      <svg
        aria-hidden="true"
        viewBox="0 0 600 600"
        className="pointer-events-none absolute h-[min(78vw,520px)] w-[min(78vw,520px)] opacity-85"
      >
        <circle
          cx="300"
          cy="300"
          r="118"
          fill="none"
          stroke="var(--nein-accent)"
          strokeOpacity="0.16"
          strokeWidth="1"
          className="nein-splash-ring"
        />
        <circle
          cx="300"
          cy="300"
          r="192"
          fill="none"
          stroke="var(--nein-accent)"
          strokeOpacity="0.10"
          strokeWidth="1"
          strokeDasharray="4 6"
        />
        <circle
          cx="300"
          cy="300"
          r="268"
          fill="none"
          stroke="var(--nein-border)"
          strokeOpacity="0.45"
          strokeWidth="1"
        />
        <line
          x1="40"
          y1="300"
          x2="560"
          y2="300"
          stroke="var(--nein-border)"
          strokeOpacity="0.28"
          strokeWidth="1"
        />
        <line
          x1="300"
          y1="40"
          x2="300"
          y2="560"
          stroke="var(--nein-border)"
          strokeOpacity="0.22"
          strokeWidth="1"
        />
      </svg>

      {/* Center Brand & Loading Sequence */}
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center text-center">
        <div
          className={`flex flex-col items-center transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isLoadingPhase ? '-translate-y-2' : 'translate-y-2'
          }`}
        >
          <h1
            data-testid="startup-splash-brand"
            className="nein-splash-logo select-none text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 sm:text-7xl"
          >
            NEiN
          </h1>

          <div
            aria-hidden="true"
            className="nein-splash-rule mt-3.5 h-[2px] w-16 rounded-full bg-[var(--nein-accent)]"
          />

          <p className="mt-3 text-xs font-medium tracking-wide text-slate-600 dark:text-slate-400 sm:text-sm">
            {copy.subtitle}
          </p>
        </div>

        {/* Loading Bar Stage (unfolds smoothly after centered NEiN brand intro) */}
        <div
          data-testid="startup-splash-loading"
          aria-hidden={!isLoadingPhase}
          className={`mt-7 w-full transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isLoadingPhase
              ? 'translate-y-0 opacity-100'
              : 'pointer-events-none translate-y-3 opacity-0'
          }`}
        >
          <div
            role="progressbar"
            aria-label={copy.loadingAriaLabel}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={splashState.progress}
            data-testid="startup-splash-progressbar"
            className="h-1.5 w-full overflow-hidden rounded-full border border-[var(--nein-border)] bg-[var(--nein-sub)]"
          >
            <div
              className="h-full origin-left rounded-full bg-[var(--nein-accent)] transition-transform duration-75 ease-linear"
              style={{
                transform: `scaleX(${Math.max(0.02, splashState.progress / 100)})`,
              }}
            />
          </div>

          <div className="mt-2.5 flex items-center justify-between gap-3 text-xs">
            <span className="truncate text-slate-600 dark:text-slate-400">
              {copy.steps[splashState.loadingStepIndex]}
            </span>
            <span
              data-testid="startup-splash-percent"
              className="shrink-0 font-mono text-xs font-semibold tabular-nums text-[var(--nein-accent-text)]"
            >
              {splashState.progress}%
            </span>
          </div>
        </div>
      </div>

      {/* Skip Button (always accessible from t=0) */}
      <div className="fixed right-5 bottom-6 z-20 sm:right-8 sm:bottom-8">
        <button
          type="button"
          data-testid="startup-skip-btn"
          aria-label={copy.skipAriaLabel}
          onClick={() => triggerFinish(true)}
          className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-[var(--nein-border)] bg-[var(--nein-surface)] px-4 py-2 text-xs font-semibold text-slate-800 shadow-xs transition-colors hover:border-[var(--nein-accent-border)] hover:bg-[var(--nein-accent-soft)] hover:text-[var(--nein-accent-text)] dark:text-slate-100 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nein-accent)]"
        >
          <span>{copy.skipLabel}</span>
          <SkipForward className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
