import { AlertTriangle, Check, Copy, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { EEW556, EEWDetection554 } from '../types/quake';
import { copyTextToClipboard } from '../utils/clipboard';
import {
  formatDepth,
  formatMagnitude,
  formatQuakeForClipboard,
  formatScaleRange,
  formatTimestamp,
  getEEWMaxScale,
  getScalePresentation,
} from '../utils/quakeParser';

interface EEWWarningModalProps {
  alert: EEW556 | EEWDetection554 | null;
  onDismiss: () => void;
}

export function EEWWarningModal({ alert, onDismiss }: EEWWarningModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCopied(false);
  }, [alert?.id]);

  useEffect(() => {
    if (!alert) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [alert, onDismiss]);

  if (!alert) return null;

  const isCancelled = alert.code === 556 && alert.cancelled;
  const maxScale = alert.code === 556 ? getEEWMaxScale(alert) : -1;
  const scalePresentation = maxScale > 0 ? getScalePresentation(maxScale) : null;

  const handleCopyAlert = async () => {
    const ok = await copyTextToClipboard(formatQuakeForClipboard(alert));
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      data-testid="eew-warning-overlay"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="eew-modal-title"
        className={`w-full max-w-2xl overflow-hidden rounded-lg border shadow-2xl ${
          isCancelled
            ? 'border-slate-600 bg-[#111827]'
            : 'border-red-500 bg-[#130A0D]'
        }`}
      >
        {/* Top Emergency Header */}
        <div
          className={`flex items-center justify-between gap-4 px-5 py-4 ${
            isCancelled ? 'bg-slate-800' : 'bg-red-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle
              className={`h-6 w-6 shrink-0 ${
                isCancelled ? 'text-slate-200' : 'text-white'
              }`}
              aria-hidden="true"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="eew-modal-title"
                  className="text-base font-bold tracking-tight text-white sm:text-xl"
                >
                  {isCancelled
                    ? '緊急地震速報（取消）'
                    : alert.code === 554
                    ? '緊急地震速報（発表検出）'
                    : '緊急地震速報（警報）'}
                </h2>
                {alert.isTest && (
                  <span className="shrink-0 whitespace-nowrap rounded bg-amber-400 px-2 py-0.5 text-xs font-bold text-slate-950">
                    テスト送信
                  </span>
                )}
              </div>
              <p className="mt-0.5 font-mono text-xs tabular-nums text-white/85">
                {alert.code === 556
                  ? `第${alert.issue.serial}報 · ${formatTimestamp(alert.issue.time)}`
                  : `検出時刻 ${formatTimestamp(alert.time)}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            aria-label="緊急地震速報の警告を閉じる"
            className="rounded-md p-2 text-white/80 transition-colors hover:bg-black/20 hover:text-white cursor-pointer focus-visible:outline-2 focus-visible:outline-white"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 p-6">
          {isCancelled ? (
            <div className="rounded-md border border-slate-700 bg-slate-900 p-4 text-sm text-slate-200">
              先ほど発表された緊急地震速報は取り消されました。最新の地震情報にご注意ください。
            </div>
          ) : alert.code === 554 ? (
            <div className="space-y-3">
              <p className="text-lg font-bold text-red-100">
                強い揺れが到達する可能性があります
              </p>
              <p className="text-sm leading-relaxed text-slate-300">
                P2P地震情報ネットワークが緊急地震速報の発表を検出しました（種別：{alert.type}）。周囲の状況を確認し、頭を守って安全な姿勢をとってください。
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-xs font-medium text-red-300">
                    震源地（推定）
                  </div>
                  <div className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">
                    {alert.earthquake?.hypocenter.name || '解析中'}
                  </div>
                  <div className="mt-1.5 font-mono text-xs tabular-nums text-red-200/80">
                    規模 {formatMagnitude(alert.earthquake?.hypocenter.magnitude)} · 深さ{' '}
                    {formatDepth(alert.earthquake?.hypocenter.depth)}
                    {alert.earthquake?.condition
                      ? ` · ${alert.earthquake.condition}`
                      : ''}
                  </div>
                </div>

                {scalePresentation && (
                  <div className="shrink-0 rounded-md border border-red-500/60 bg-red-950/90 px-4 py-3 text-center">
                    <div className="text-[11px] font-medium text-red-200">
                      予想最大震度
                    </div>
                    <div className="mt-0.5 font-mono text-2xl font-extrabold tabular-nums text-white">
                      {scalePresentation.label}
                      <span className="ml-1 text-xs font-medium text-red-200">
                        程度以上
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {alert.areas && alert.areas.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-red-200">
                    強い揺れに警戒が必要な地域
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {alert.areas.map((area, idx) => (
                      <div
                        key={`${area.pref}-${area.name}-${idx}`}
                        className="flex items-center justify-between rounded border border-red-900/80 bg-red-950/40 px-3 py-2 text-xs"
                      >
                        <span className="font-semibold text-red-50">
                          {area.name}
                        </span>
                        <span className="font-mono tabular-nums text-red-200">
                          {formatScaleRange(area.scaleFrom, area.scaleTo)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-100">
                慌てず、机の下に入る・頭を守るなど、身の安全を最優先に行動してください。
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-800/80 bg-[#0B0F17] px-6 py-4">
          <button
            type="button"
            onClick={() => void handleCopyAlert()}
            className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-700 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-400"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                <span>コピーしました</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                <span>警報情報をコピー</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onDismiss}
            className={`rounded-md px-5 py-2 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-white ${
              isCancelled
                ? 'bg-slate-100 text-slate-950 hover:bg-white'
                : 'bg-red-600 text-white hover:bg-red-500'
            }`}
          >
            確認して閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
