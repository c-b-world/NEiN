import { BellRing, X } from 'lucide-react';
import { useEffect } from 'react';
import type { TestEEWPreset } from '../types/quake';
import { type AppLanguage, getMessages } from '../utils/i18n';

interface TestDispatchModalProps {
  lang: AppLanguage;
  isOpen: boolean;
  onClose: () => void;
  onDispatch: (preset: TestEEWPreset) => void;
}

export function TestDispatchModal({
  lang,
  isOpen,
  onClose,
  onDispatch,
}: TestDispatchModalProps) {
  const m = getMessages(lang);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const presets: Array<{
    id: TestEEWPreset;
    title: string;
    subtitle: string;
    meta: string;
  }> = [
    {
      id: 'kanto_alert',
      title: m.testModal.kantoTitle,
      subtitle: m.testModal.kantoSub,
      meta: 'Code 556 / M6.9 / 40km',
    },
    {
      id: 'nankai_alert',
      title: m.testModal.nankaiTitle,
      subtitle: m.testModal.nankaiSub,
      meta: 'Code 556 / M7.8 / 20km',
    },
    {
      id: 'eew_detection',
      title: m.testModal.detectTitle,
      subtitle: m.testModal.detectSub,
      meta: 'Code 554 / Full',
    },
    {
      id: 'eew_cancelled',
      title: m.testModal.cancelTitle,
      subtitle: m.testModal.cancelSub,
      meta: 'Code 556 / cancelled: true',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 dark:bg-black/75 p-4"
      data-testid="test-dispatch-modal"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="test-dispatch-title"
        className="w-full max-w-lg overflow-hidden rounded-lg border border-[var(--nein-border)] bg-[var(--nein-surface)] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--nein-border-subtle)] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <BellRing className="h-4 w-4 text-amber-500 dark:text-amber-400" aria-hidden="true" />
            <h2
              id="test-dispatch-title"
              className="text-base font-bold text-slate-900 dark:text-slate-50"
            >
              {m.testModal.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={m.testModal.cancel}
            className="rounded p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            {m.testModal.desc}
          </p>

          <div className="mt-4 space-y-2.5">
            {presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  onClose();
                  onDispatch(preset.id);
                }}
                className="w-full rounded-md border border-[var(--nein-border)] bg-[var(--nein-sub)] px-4 py-3 text-left transition-colors hover:border-amber-500/60 hover:bg-amber-500/5 dark:hover:bg-slate-900 cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-500"
              >
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {preset.title}
                </div>
                <div className="mt-1 text-xs text-slate-700 dark:text-slate-300">
                  {preset.subtitle}
                </div>
                <div className="mt-1 font-mono text-[11px] text-slate-500">
                  {preset.meta}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end border-t border-[var(--nein-border-subtle)] bg-[var(--nein-sub)] px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[var(--nein-border)] bg-[var(--nein-surface)] px-4 py-2 text-xs font-medium text-slate-800 hover:bg-slate-200/70 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer"
          >
            {m.testModal.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
