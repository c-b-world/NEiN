import { Check, Copy, FileDown, Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { P2PQuakeRecord } from '../types/quake';
import { copyTextToClipboard } from '../utils/clipboard';
import { exportQuakePdfReport } from '../utils/pdfReport';
import {
  formatDepth,
  formatMagnitude,
  formatQuakeForClipboard,
  formatScaleRange,
  formatTimestamp,
  getEEWMaxScale,
  getRecordCategoryLabel,
  getRecordTitle,
  getScalePresentation,
  groupPointsByPrefAndScale,
  translateTsunamiGrade,
  translateTsunamiShort,
} from '../utils/quakeParser';
import { EpicenterD3Map } from './EpicenterD3Map';
import { ScaleDistributionChart } from './ScaleDistributionChart';

interface QuakeDetailPanelProps {
  records: P2PQuakeRecord[];
  selectedRecord: P2PQuakeRecord | null;
  onSelectRecord: (id: string) => void;
}

export function QuakeDetailPanel({
  records,
  selectedRecord,
  onSelectRecord,
}: QuakeDetailPanelProps) {
  const [copied, setCopied] = useState(false);
  const [pdfStatus, setPdfStatus] = useState<'idle' | 'exporting' | 'done' | 'error'>('idle');

  const formattedCopyText = useMemo(() => {
    if (!selectedRecord) return '';
    return formatQuakeForClipboard(selectedRecord);
  }, [selectedRecord]);

  useEffect(() => {
    setCopied(false);
    setPdfStatus('idle');
  }, [selectedRecord?.id]);

  const handleCopy = async () => {
    if (!formattedCopyText) return;
    const ok = await copyTextToClipboard(formattedCopyText);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    }
  };

  const handleDownloadPdf = async () => {
    if (!selectedRecord || pdfStatus === 'exporting') return;
    setPdfStatus('exporting');
    try {
      await exportQuakePdfReport(selectedRecord);
      setPdfStatus('done');
      window.setTimeout(() => {
        setPdfStatus((cur) => (cur === 'done' ? 'idle' : cur));
      }, 2600);
    } catch {
      setPdfStatus('error');
      window.setTimeout(() => {
        setPdfStatus((cur) => (cur === 'error' ? 'idle' : cur));
      }, 3000);
    }
  };

  if (!selectedRecord) {
    return (
      <section className="flex flex-1 flex-col items-center justify-center rounded-lg border border-slate-800 bg-[#0D131F] p-10 text-center">
        <p className="text-base font-medium text-slate-300">
          地震情報を選択してください
        </p>
        <p className="mt-1.5 text-xs text-slate-500">
          左の一覧から地震情報を選択すると、詳細データとコピー機能が表示されます。
        </p>
      </section>
    );
  }

  const title = getRecordTitle(selectedRecord);
  const category = getRecordCategoryLabel(selectedRecord);

  const groupedPoints =
    selectedRecord.code === 551
      ? groupPointsByPrefAndScale(selectedRecord.points)
      : [];

  let scaleDisplay = '-';
  let magnitudeDisplay = '--';
  let depthDisplay = '--';
  let subInfoLabel = '発信元';
  let subInfoValue = 'P2P地震情報';

  if (selectedRecord.code === 551) {
    scaleDisplay = getScalePresentation(selectedRecord.earthquake.maxScale).label;
    magnitudeDisplay = formatMagnitude(selectedRecord.earthquake.hypocenter.magnitude);
    depthDisplay = formatDepth(selectedRecord.earthquake.hypocenter.depth);
    subInfoLabel = '津波の有無';
    subInfoValue = translateTsunamiShort(selectedRecord.earthquake.domesticTsunami);
  } else if (selectedRecord.code === 556) {
    const maxScale = getEEWMaxScale(selectedRecord);
    scaleDisplay = selectedRecord.cancelled
      ? '取消'
      : maxScale > 0
      ? `${getScalePresentation(maxScale).label}以上`
      : '解析中';
    magnitudeDisplay = formatMagnitude(selectedRecord.earthquake?.hypocenter.magnitude);
    depthDisplay = formatDepth(selectedRecord.earthquake?.hypocenter.depth);
    subInfoLabel = '報番号';
    subInfoValue = `第${selectedRecord.issue.serial}報 (${selectedRecord.cancelled ? '取消報' : '警報'})`;
  } else if (selectedRecord.code === 554) {
    scaleDisplay = '発表検出';
    subInfoLabel = '検出種別';
    subInfoValue = selectedRecord.type;
  } else if (selectedRecord.code === 552) {
    scaleDisplay = selectedRecord.cancelled ? '解除' : '発表中';
    subInfoLabel = '発表元';
    subInfoValue = selectedRecord.issue.source;
  } else if (selectedRecord.code === 561) {
    scaleDisplay = '感知';
    subInfoLabel = '地域コード';
    subInfoValue = String(selectedRecord.area);
  }

  return (
    <section
      aria-label="選択中の地震詳細"
      className="flex min-w-0 flex-1 flex-col gap-5"
    >
      {/* Top Detail Summary & One-Click Copy */}
      <div className="rounded-lg border border-slate-800 bg-[#0D131F] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="font-medium text-sky-400">{category}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {formatTimestamp(
                  selectedRecord.code === 551
                    ? selectedRecord.earthquake.time
                    : selectedRecord.time
                )}
              </span>
              {selectedRecord.isTest && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-medium text-amber-400">テスト配信データ</span>
                </>
              )}
            </div>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
              {title}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => void handleDownloadPdf()}
              disabled={pdfStatus === 'exporting'}
              data-testid="download-pdf-btn"
              className={`inline-flex min-h-[42px] items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
                pdfStatus === 'done'
                  ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-200'
                  : pdfStatus === 'error'
                  ? 'border-red-500/60 bg-red-500/15 text-red-200'
                  : 'border-slate-700 bg-slate-800/90 text-slate-100 hover:bg-slate-700'
              }`}
            >
              {pdfStatus === 'exporting' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>PDF生成中...</span>
                </>
              ) : pdfStatus === 'done' ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                  <span>PDF出力完了</span>
                </>
              ) : pdfStatus === 'error' ? (
                <>
                  <FileDown className="h-4 w-4 text-red-400" aria-hidden="true" />
                  <span>PDF生成に失敗</span>
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4 text-sky-400" aria-hidden="true" />
                  <span>PDFダウンロード</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => void handleCopy()}
              data-testid="copy-selected-quake-btn"
              className={`inline-flex min-h-[42px] items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
                copied
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-sky-500 text-slate-950 hover:bg-sky-400'
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" aria-hidden="true" />
                  <span>コピーしました</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  <span>地震情報をコピー</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 4-column Key Metrics Strip */}
        <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-slate-800 bg-slate-800 sm:grid-cols-4">
          <div className="bg-[#090D16] px-4 py-3">
            <div className="text-[11px] font-medium text-slate-400">
              最大震度 / 種別
            </div>
            <div className="mt-1 font-mono text-lg font-bold tabular-nums text-slate-50">
              {scaleDisplay}
            </div>
          </div>
          <div className="bg-[#090D16] px-4 py-3">
            <div className="text-[11px] font-medium text-slate-400">
              マグニチュード
            </div>
            <div className="mt-1 font-mono text-lg font-bold tabular-nums text-slate-50">
              {magnitudeDisplay}
            </div>
          </div>
          <div className="bg-[#090D16] px-4 py-3">
            <div className="text-[11px] font-medium text-slate-400">
              震源の深さ
            </div>
            <div className="mt-1 font-mono text-lg font-bold tabular-nums text-slate-50">
              {depthDisplay}
            </div>
          </div>
          <div className="bg-[#090D16] px-4 py-3">
            <div className="text-[11px] font-medium text-slate-400">
              {subInfoLabel}
            </div>
            <div className="mt-1 text-xs font-medium leading-snug text-slate-200">
              {subInfoValue}
            </div>
          </div>
        </div>
      </div>

      {/* Balanced 2-Column Stage: D3.js Epicenter Map + Formatted Copy Preview */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 items-stretch">
        <EpicenterD3Map
          records={records}
          selectedRecord={selectedRecord}
          onSelectRecord={onSelectRecord}
        />

        <div className="flex flex-col rounded-lg border border-slate-800 bg-[#0D131F]">
          <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-2.5">
            <span className="text-xs font-medium text-slate-300">
              コピー用フォーマットプレビュー
            </span>
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium text-sky-300 hover:bg-slate-800 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                  <span className="text-emerald-300">コピー完了</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>テキストをコピー</span>
                </>
              )}
            </button>
          </div>
          <pre
            data-testid="copy-preview-text"
            className="max-h-[380px] flex-1 overflow-auto whitespace-pre-wrap break-words bg-[#080C14] p-4 font-mono text-xs leading-relaxed text-slate-300"
          >
            {formattedCopyText}
          </pre>
        </div>
      </div>

      {/* Seismic Intensity Distribution Bar Chart (Recharts) */}
      <ScaleDistributionChart record={selectedRecord} />

      {/* Observation Points / EEW Areas / Tsunami Areas */}
      {selectedRecord.code === 551 && groupedPoints.length > 0 && (
        <div className="rounded-lg border border-slate-800 bg-[#0D131F] p-5">
          <h3 className="text-sm font-semibold text-slate-100">
            各地の震度（観測地点）
          </h3>
          <div className="mt-4 divide-y divide-slate-800/70">
            {groupedPoints.map((group) => {
              const pres = getScalePresentation(group.scale);
              return (
                <div
                  key={group.scale}
                  className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start"
                >
                  <div
                    className={`inline-flex w-20 shrink-0 items-center justify-center rounded border px-2 py-1 font-mono text-xs font-bold tabular-nums ${pres.bgClass} ${pres.borderClass} ${pres.textClass}`}
                  >
                    {group.scaleLabel}
                  </div>
                  <div className="flex-1 space-y-1.5 text-xs leading-relaxed text-slate-300">
                    {group.prefectures.map((p) => (
                      <div key={p.pref}>
                        <span className="font-semibold text-slate-100">
                          {p.pref}：
                        </span>
                        <span className="text-slate-400">
                          {p.addrs.join('、')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedRecord.code === 556 &&
        selectedRecord.areas &&
        selectedRecord.areas.length > 0 && (
          <div className="rounded-lg border border-slate-800 bg-[#0D131F] p-5">
            <h3 className="text-sm font-semibold text-slate-100">
              緊急地震速報 対象地域・予測震度
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {selectedRecord.areas.map((area, idx) => (
                <div
                  key={`${area.pref}-${area.name}-${idx}`}
                  className="flex items-center justify-between rounded-md border border-slate-800 bg-[#090D16] px-3 py-2 text-xs"
                >
                  <span className="font-medium text-slate-100">{area.name}</span>
                  <span className="font-mono tabular-nums text-red-300">
                    {formatScaleRange(area.scaleFrom, area.scaleTo)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      {selectedRecord.code === 552 &&
        selectedRecord.areas &&
        selectedRecord.areas.length > 0 && (
          <div className="rounded-lg border border-slate-800 bg-[#0D131F] p-5">
            <h3 className="text-sm font-semibold text-slate-100">
              津波予報 対象沿岸地域
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {selectedRecord.areas.map((area, idx) => (
                <div
                  key={`${area.name}-${idx}`}
                  className="flex items-center justify-between rounded-md border border-slate-800 bg-[#090D16] px-3 py-2 text-xs"
                >
                  <span className="font-medium text-slate-100">{area.name}</span>
                  <span className="text-cyan-300">
                    {translateTsunamiGrade(area.grade)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
    </section>
  );
}
