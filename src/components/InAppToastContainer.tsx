import { AlertTriangle, BellRing, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { NotificationHistoryEntry } from '../types/disaster';
import type { AppLanguage } from '../utils/i18n';
import { getExtendedMessages } from '../utils/i18nExtended';
import { subscribeInAppToasts } from '../utils/notificationCenter';

interface InAppToastContainerProps {
  lang: AppLanguage;
  onNewAlertRecorded?: () => void;
}

export function InAppToastContainer({
  lang,
  onNewAlertRecorded,
}: InAppToastContainerProps) {
  const [toasts, setToasts] = useState<NotificationHistoryEntry[]>([]);
  const ext = getExtendedMessages(lang);

  useEffect(() => {
    const unsub = subscribeInAppToasts((item) => {
      setToasts((prev) => [item, ...prev].slice(0, 4));
      onNewAlertRecorded?.();
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== item.id));
      }, 9000);
    });
    return unsub;
  }, [onNewAlertRecorded]);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label="In-app disaster notifications"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 px-3 sm:px-0"
    >
      {toasts.map((toast) => {
        const isCritical = toast.severity === 'critical';
        const isWarning = toast.severity === 'warning';
        const tone = isCritical
          ? 'border-red-500 bg-red-950/95 text-red-50 shadow-xl'
          : isWarning
          ? 'border-amber-500 bg-amber-950/95 text-amber-50 shadow-xl'
          : 'border-[var(--nein-accent)] bg-[var(--nein-surface)] text-slate-900 dark:text-slate-100 shadow-xl';

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-2.5 rounded-lg border p-3 text-xs ${tone}`}
          >
            {isCritical || isWarning ? (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
            ) : (
              <BellRing className="mt-0.5 h-4 w-4 shrink-0 text-[var(--nein-accent-text)]" aria-hidden="true" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 font-bold">
                <span className="truncate">{toast.title}</span>
                {toast.isTest && (
                  <span className="rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-extrabold text-slate-950">
                    {ext.common.testSimulationWarning}
                  </span>
                )}
              </div>
              {toast.body && (
                <p className="mt-0.5 line-clamp-2 text-[11px] opacity-90">{toast.body}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              aria-label="Dismiss notification"
              className="shrink-0 rounded p-0.5 opacity-75 hover:opacity-100 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
