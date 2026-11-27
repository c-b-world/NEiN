import { Bell, Clock, Flag, Globe, Pause, Play, RotateCcw, Timer } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { AppLanguage } from '../../utils/i18n';
import {
  WORLD_CLOCK_CITIES,
  formatCityClock,
  formatCountdownSec,
  formatStopwatchMs,
  playGentleTimerChime,
} from '../../utils/lifeTools';

interface TimerClockToolProps {
  lang: AppLanguage;
}

type PomodoroPhase = 'focus' | 'short_break' | 'long_break';

const COPY: Record<
  AppLanguage,
  {
    countdownTitle: string;
    pomodoroTitle: string;
    stopwatchTitle: string;
    worldClockTitle: string;
    start: string;
    pause: string;
    reset: string;
    lap: string;
    customMin: string;
    customSec: string;
    applyCustom: string;
    finishedNotice: string;
    soundOn: string;
    soundOff: string;
    phaseFocus: string;
    phaseShort: string;
    phaseLong: string;
    sessionsDone: string;
    lapsEmpty: string;
    lapHeader: string;
    minSuffix: string;
  }
> = {
  ja: {
    countdownTitle: 'カウントダウンタイマー',
    pomodoroTitle: 'ポモドーロ集中タイマー',
    stopwatchTitle: 'ストップウォッチ',
    worldClockTitle: '世界時計',
    start: 'スタート',
    pause: '一時停止',
    reset: 'リセット',
    lap: 'ラップ記録',
    customMin: '分',
    customSec: '秒',
    applyCustom: 'セット',
    finishedNotice: 'タイマーが完了しました',
    soundOn: '完了音 ON',
    soundOff: '完了音 OFF',
    phaseFocus: '集中 (25分)',
    phaseShort: '小休憩 (5分)',
    phaseLong: '長休憩 (15分)',
    sessionsDone: '完了セット数',
    lapsEmpty: '計測中に「ラップ記録」を押すとここに記録されます',
    lapHeader: 'ラップタイム',
    minSuffix: '分',
  },
  en: {
    countdownTitle: 'Countdown Timer',
    pomodoroTitle: 'Pomodoro Focus Timer',
    stopwatchTitle: 'Stopwatch',
    worldClockTitle: 'World Clock',
    start: 'Start',
    pause: 'Pause',
    reset: 'Reset',
    lap: 'Lap',
    customMin: 'Min',
    customSec: 'Sec',
    applyCustom: 'Set',
    finishedNotice: 'Timer finished',
    soundOn: 'Chime ON',
    soundOff: 'Chime OFF',
    phaseFocus: 'Focus (25m)',
    phaseShort: 'Short Break (5m)',
    phaseLong: 'Long Break (15m)',
    sessionsDone: 'Completed Sessions',
    lapsEmpty: 'Press "Lap" while running to record split times',
    lapHeader: 'Recorded Laps',
    minSuffix: 'm',
  },
  zh: {
    countdownTitle: '倒计时器',
    pomodoroTitle: '番茄专注钟',
    stopwatchTitle: '秒表',
    worldClockTitle: '世界时钟',
    start: '开始',
    pause: '暂停',
    reset: '重置',
    lap: '计次',
    customMin: '分',
    customSec: '秒',
    applyCustom: '设定',
    finishedNotice: '倒计时已结束',
    soundOn: '提示音开启',
    soundOff: '提示音关闭',
    phaseFocus: '专注 (25分钟)',
    phaseShort: '短休 (5分钟)',
    phaseLong: '长休 (15分钟)',
    sessionsDone: '已完成番茄数',
    lapsEmpty: '计时期间点击「计次」可记录分段用时',
    lapHeader: '计次记录',
    minSuffix: '分',
  },
  ko: {
    countdownTitle: '카운트다운 타이머',
    pomodoroTitle: '포모도로 집중 타이머',
    stopwatchTitle: '스톱워치',
    worldClockTitle: '세계 시계',
    start: '시작',
    pause: '일시정지',
    reset: '초기화',
    lap: '랩 기록',
    customMin: '분',
    customSec: '초',
    applyCustom: '설정',
    finishedNotice: '타이머가 완료되었습니다',
    soundOn: '알림음 ON',
    soundOff: '알림음 OFF',
    phaseFocus: '집중 (25분)',
    phaseShort: '짧은 휴식 (5분)',
    phaseLong: '긴 휴식 (15분)',
    sessionsDone: '완료 세트',
    lapsEmpty: '측정 중 「랩 기록」을 누르면 구간 시간이 기록됩니다',
    lapHeader: '랩 타임',
    minSuffix: '분',
  },
};

const COUNTDOWN_PRESETS_MIN = [1, 3, 5, 10, 15, 30];
const POMODORO_DURATIONS: Record<PomodoroPhase, number> = {
  focus: 25 * 60,
  short_break: 5 * 60,
  long_break: 15 * 60,
};

export function TimerClockTool({ lang }: TimerClockToolProps) {
  const c = COPY[lang] ?? COPY.ja;

  // Countdown state
  const [countdownInitialSec, setCountdownInitialSec] = useState(180);
  const [countdownLeftSec, setCountdownLeftSec] = useState(180);
  const [countdownRunning, setCountdownRunning] = useState(false);
  const [countdownDone, setCountdownDone] = useState(false);
  const [chimeEnabled, setChimeEnabled] = useState(true);
  const [customMin, setCustomMin] = useState('3');
  const [customSec, setCustomSec] = useState('0');

  // Pomodoro state
  const [pomoPhase, setPomoPhase] = useState<PomodoroPhase>('focus');
  const [pomoLeftSec, setPomoLeftSec] = useState(POMODORO_DURATIONS.focus);
  const [pomoRunning, setPomoRunning] = useState(false);
  const [pomoSessions, setPomoSessions] = useState(0);

  // Stopwatch state
  const [swElapsedMs, setSwElapsedMs] = useState(0);
  const [swRunning, setSwRunning] = useState(false);
  const [swLaps, setSwLaps] = useState<number[]>([]);
  const swStartRef = useRef<number>(0);

  // World clock state
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Countdown tick
  useEffect(() => {
    if (!countdownRunning) return;
    const id = window.setInterval(() => {
      setCountdownLeftSec((prev) => {
        if (prev <= 1) {
          setCountdownRunning(false);
          setCountdownDone(true);
          if (chimeEnabled) playGentleTimerChime();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [countdownRunning, chimeEnabled]);

  // Pomodoro tick
  useEffect(() => {
    if (!pomoRunning) return;
    const id = window.setInterval(() => {
      setPomoLeftSec((prev) => {
        if (prev <= 1) {
          setPomoRunning(false);
          if (chimeEnabled) playGentleTimerChime();
          if (pomoPhase === 'focus') {
            setPomoSessions((s) => {
              const nextCount = s + 1;
              const nextPhase: PomodoroPhase = nextCount % 4 === 0 ? 'long_break' : 'short_break';
              setPomoPhase(nextPhase);
              setPomoLeftSec(POMODORO_DURATIONS[nextPhase]);
              return nextCount;
            });
          } else {
            setPomoPhase('focus');
            setPomoLeftSec(POMODORO_DURATIONS.focus);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [pomoRunning, pomoPhase, chimeEnabled]);

  // Stopwatch tick
  useEffect(() => {
    if (!swRunning) return;
    swStartRef.current = performance.now() - swElapsedMs;
    const id = window.setInterval(() => {
      setSwElapsedMs(performance.now() - swStartRef.current);
    }, 33);
    return () => window.clearInterval(id);
  }, [swRunning]);

  const selectCountdownPreset = (minutes: number) => {
    const sec = minutes * 60;
    setCountdownRunning(false);
    setCountdownDone(false);
    setCountdownInitialSec(sec);
    setCountdownLeftSec(sec);
    setCustomMin(String(minutes));
    setCustomSec('0');
  };

  const applyCustomCountdown = () => {
    const m = Math.max(0, Math.min(599, Number(customMin) || 0));
    const s = Math.max(0, Math.min(59, Number(customSec) || 0));
    const total = Math.max(1, m * 60 + s);
    setCountdownRunning(false);
    setCountdownDone(false);
    setCountdownInitialSec(total);
    setCountdownLeftSec(total);
  };

  const switchPomoPhase = (phase: PomodoroPhase) => {
    setPomoRunning(false);
    setPomoPhase(phase);
    setPomoLeftSec(POMODORO_DURATIONS[phase]);
  };

  const countdownProgress =
    countdownInitialSec > 0
      ? Math.max(0, Math.min(100, ((countdownInitialSec - countdownLeftSec) / countdownInitialSec) * 100))
      : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* 1. Countdown Timer */}
        <section
          data-testid="life-timer-countdown"
          className="flex flex-col justify-between rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)] p-5"
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                <Timer className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
                <span>{c.countdownTitle}</span>
              </h2>
              <button
                type="button"
                onClick={() => setChimeEnabled((v) => !v)}
                className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                  chimeEnabled
                    ? 'border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] text-[var(--nein-accent-text)]'
                    : 'border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-500 dark:text-slate-400'
                }`}
              >
                <Bell className="h-3 w-3" aria-hidden="true" />
                <span>{chimeEnabled ? c.soundOn : c.soundOff}</span>
              </button>
            </div>

            <div className="mt-4 text-center">
              <div
                data-testid="countdown-display"
                className="font-mono text-4xl font-extrabold tracking-tight tabular-nums text-slate-900 dark:text-white"
              >
                {formatCountdownSec(countdownLeftSec)}
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--nein-sub)]">
                <div
                  className="h-full bg-[var(--nein-accent)] transition-all duration-300"
                  style={{ width: `${countdownProgress}%` }}
                />
              </div>
              {countdownDone && (
                <p role="status" className="mt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {c.finishedNotice}
                </p>
              )}
            </div>

            {/* Quick Presets */}
            <div className="mt-4 grid grid-cols-3 gap-1.5">
              {COUNTDOWN_PRESETS_MIN.map((min) => (
                <button
                  key={min}
                  type="button"
                  data-testid={`countdown-preset-${min}`}
                  onClick={() => selectCountdownPreset(min)}
                  className={`rounded-md border py-1.5 font-mono text-xs font-semibold tabular-nums transition-colors cursor-pointer ${
                    countdownInitialSec === min * 60
                      ? 'border-[var(--nein-accent)] bg-[var(--nein-accent-soft)] text-[var(--nein-accent-text)]'
                      : 'border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-700 hover:border-[var(--nein-accent-border)] dark:text-slate-200'
                  }`}
                >
                  {min}{c.minSuffix}
                </button>
              ))}
            </div>

            {/* Custom Min/Sec */}
            <div className="mt-3 flex items-center gap-1.5">
              <input
                type="number"
                min={0}
                max={599}
                value={customMin}
                aria-label={c.customMin}
                onChange={(e) => setCustomMin(e.target.value)}
                className="w-16 rounded-md border border-[var(--nein-border)] bg-[var(--nein-sub)] px-2 py-1.5 text-center font-mono text-xs font-bold tabular-nums text-slate-900 dark:text-slate-100"
              />
              <span className="text-xs text-slate-500">{c.customMin}</span>
              <input
                type="number"
                min={0}
                max={59}
                value={customSec}
                aria-label={c.customSec}
                onChange={(e) => setCustomSec(e.target.value)}
                className="w-16 rounded-md border border-[var(--nein-border)] bg-[var(--nein-sub)] px-2 py-1.5 text-center font-mono text-xs font-bold tabular-nums text-slate-900 dark:text-slate-100"
              />
              <span className="text-xs text-slate-500">{c.customSec}</span>
              <button
                type="button"
                onClick={applyCustomCountdown}
                className="ml-auto rounded-md border border-[var(--nein-border)] bg-[var(--nein-sub)] px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-[var(--nein-accent-border)] dark:text-slate-200 cursor-pointer"
              >
                {c.applyCustom}
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 border-t border-[var(--nein-border-subtle)] pt-4">
            <button
              type="button"
              data-testid="countdown-toggle-btn"
              onClick={() => {
                setCountdownDone(false);
                if (countdownLeftSec === 0) setCountdownLeftSec(countdownInitialSec);
                setCountdownRunning((r) => !r);
              }}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[var(--nein-accent)] px-3 py-2 text-xs font-bold text-[var(--nein-accent-contrast)] transition-opacity hover:opacity-90 cursor-pointer"
            >
              {countdownRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              <span>{countdownRunning ? c.pause : c.start}</span>
            </button>
            <button
              type="button"
              data-testid="countdown-reset-btn"
              onClick={() => {
                setCountdownRunning(false);
                setCountdownDone(false);
                setCountdownLeftSec(countdownInitialSec);
              }}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] px-3 py-2 text-xs font-semibold text-slate-700 hover:border-[var(--nein-accent-border)] dark:text-slate-200 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{c.reset}</span>
            </button>
          </div>
        </section>

        {/* 2. Pomodoro Focus Timer */}
        <section
          data-testid="life-timer-pomodoro"
          className="flex flex-col justify-between rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)] p-5"
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                <Clock className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
                <span>{c.pomodoroTitle}</span>
              </h2>
              <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                {c.sessionsDone}: {pomoSessions}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-1 rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-1 text-[11px]">
              {(
                [
                  { id: 'focus' as PomodoroPhase, label: c.phaseFocus },
                  { id: 'short_break' as PomodoroPhase, label: c.phaseShort },
                  { id: 'long_break' as PomodoroPhase, label: c.phaseLong },
                ]
              ).map((phase) => (
                <button
                  key={phase.id}
                  type="button"
                  data-testid={`pomo-phase-${phase.id}`}
                  onClick={() => switchPomoPhase(phase.id)}
                  className={`rounded-md px-2 py-1.5 font-semibold transition-colors cursor-pointer ${
                    pomoPhase === phase.id
                      ? 'bg-[var(--nein-accent)] text-[var(--nein-accent-contrast)]'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {phase.label}
                </button>
              ))}
            </div>

            <div className="mt-6 text-center">
              <div
                data-testid="pomo-display"
                className="font-mono text-4xl font-extrabold tracking-tight tabular-nums text-slate-900 dark:text-white"
              >
                {formatCountdownSec(pomoLeftSec)}
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--nein-sub)]">
                <div
                  className="h-full bg-[var(--nein-accent)] transition-all duration-300"
                  style={{
                    width: `${((POMODORO_DURATIONS[pomoPhase] - pomoLeftSec) / POMODORO_DURATIONS[pomoPhase]) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2 border-t border-[var(--nein-border-subtle)] pt-4">
            <button
              type="button"
              data-testid="pomo-toggle-btn"
              onClick={() => setPomoRunning((r) => !r)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[var(--nein-accent)] px-3 py-2 text-xs font-bold text-[var(--nein-accent-contrast)] transition-opacity hover:opacity-90 cursor-pointer"
            >
              {pomoRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              <span>{pomoRunning ? c.pause : c.start}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPomoRunning(false);
                setPomoLeftSec(POMODORO_DURATIONS[pomoPhase]);
              }}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] px-3 py-2 text-xs font-semibold text-slate-700 hover:border-[var(--nein-accent-border)] dark:text-slate-200 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{c.reset}</span>
            </button>
          </div>
        </section>

        {/* 3. Stopwatch */}
        <section
          data-testid="life-timer-stopwatch"
          className="flex flex-col justify-between rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)] p-5"
        >
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
              <Flag className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
              <span>{c.stopwatchTitle}</span>
            </h2>

            <div className="mt-5 text-center">
              <div
                data-testid="stopwatch-display"
                className="font-mono text-4xl font-extrabold tracking-tight tabular-nums text-slate-900 dark:text-white"
              >
                {formatStopwatchMs(swElapsedMs)}
              </div>
            </div>

            <div className="mt-4 max-h-32 overflow-y-auto border-t border-[var(--nein-border-subtle)] pt-2.5">
              {swLaps.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">{c.lapsEmpty}</p>
              ) : (
                <ul className="divide-y divide-[var(--nein-border-subtle)] text-xs">
                  {swLaps.map((lapMs, idx) => (
                    <li key={`${lapMs}-${idx}`} className="flex items-center justify-between py-1 font-mono tabular-nums">
                      <span className="text-slate-500 dark:text-slate-400">
                        #{swLaps.length - idx}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {formatStopwatchMs(lapMs)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 border-t border-[var(--nein-border-subtle)] pt-4">
            <button
              type="button"
              data-testid="stopwatch-toggle-btn"
              onClick={() => setSwRunning((r) => !r)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[var(--nein-accent)] px-3 py-2 text-xs font-bold text-[var(--nein-accent-contrast)] transition-opacity hover:opacity-90 cursor-pointer"
            >
              {swRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              <span>{swRunning ? c.pause : c.start}</span>
            </button>
            <button
              type="button"
              data-testid="stopwatch-lap-btn"
              disabled={!swRunning}
              onClick={() => setSwLaps((prev) => [swElapsedMs, ...prev.slice(0, 19)])}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] px-3 py-2 text-xs font-semibold text-slate-700 hover:border-[var(--nein-accent-border)] disabled:opacity-45 dark:text-slate-200 cursor-pointer"
            >
              <Flag className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{c.lap}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSwRunning(false);
                setSwElapsedMs(0);
                setSwLaps([]);
              }}
              className="inline-flex items-center justify-center rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] p-2 text-slate-700 hover:border-[var(--nein-accent-border)] dark:text-slate-200 cursor-pointer"
              aria-label={c.reset}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </section>
      </div>

      {/* 4. World Clock Strip */}
      <section
        data-testid="life-world-clock"
        className="rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)] p-5"
      >
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
          <Globe className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
          <span>{c.worldClockTitle}</span>
        </h2>
        <div className="mt-3.5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {WORLD_CLOCK_CITIES.map((city) => {
            const { timeText, dateText } = formatCityClock(now, city.timeZone, lang);
            return (
              <div
                key={city.id}
                className="rounded-lg border border-[var(--nein-border-subtle)] bg-[var(--nein-sub)] px-3.5 py-2.5"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-100">{city.labels[lang]}</span>
                  <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                    {city.regionCode}
                  </span>
                </div>
                <div className="mt-1 font-mono text-xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                  {timeText}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{dateText}</div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
