import { BellRing, X } from 'lucide-react';
import { useEffect } from 'react';
import type { TestEEWPreset } from '../types/quake';

interface TestDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDispatch: (preset: TestEEWPreset) => void;
}

const TEST_PRESETS: Array<{
  id: TestEEWPreset;
  title: string;
  subtitle: string;
  meta: string;
}> = [
  {
    id: 'kanto_alert',
    title: '緊急地震速報（警報）— 首都圏想定',
    subtitle: '震源：東京湾 · 予想最大震度 6弱程度以上',
    meta: 'コード 556 / M6.9 / 深さ 約40km',
  },
  {
    id: 'nankai_alert',
    title: '緊急地震速報（警報）— 南海トラフ想定',
    subtitle: '震源：和歌山県南方沖 · 予想最大震度 6強程度以上',
    meta: 'コード 556 / M7.8 / 深さ 約20km',
  },
  {
    id: 'eew_detection',
    title: '緊急地震速報（発表検出）',
    subtitle: '速報第1報到達前の発表検出イベントをシミュレート',
    meta: 'コード 554 / 種別 Full',
  },
  {
    id: 'eew_cancelled',
    title: '緊急地震速報（取消報）',
    subtitle: '誤報等による緊急地震速報の取消通知をシミュレート',
    meta: 'コード 556 / cancelled: true',
  },
];

export function TestDispatchModal({
  isOpen,
  onClose,
  onDispatch,
}: TestDispatchModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4"
      data-testid="test-dispatch-modal"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="test-dispatch-title"
        className="w-full max-w-lg overflow-hidden rounded-lg border border-slate-700 bg-[#0D131F] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <BellRing className="h-4 w-4 text-amber-400" aria-hidden="true" />
            <h2
              id="test-dispatch-title"
              className="text-base font-bold text-slate-50"
            >
              緊急地震速報 テスト送信
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="テスト送信ダイアログを閉じる"
            className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100 cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-xs leading-relaxed text-slate-400">
            送信するシナリオを選択すると、即座に緊急地震速報を受信した状態になり、画面中央の警告表示と警報音・履歴リストへの追加を確認できます。
          </p>

          <div className="mt-4 space-y-2.5">
            {TEST_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  onClose();
                  onDispatch(preset.id);
                }}
                className="w-full rounded-md border border-slate-800 bg-[#090D16] px-4 py-3 text-left transition-colors hover:border-amber-500/60 hover:bg-slate-900 cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-400"
              >
                <div className="text-sm font-semibold text-slate-100">
                  {preset.title}
                </div>
                <div className="mt-1 text-xs text-slate-300">
                  {preset.subtitle}
                </div>
                <div className="mt-1 font-mono text-[11px] text-slate-500">
                  {preset.meta}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-800 bg-[#090D16] px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 cursor-pointer"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}
