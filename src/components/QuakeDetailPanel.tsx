import { Backpack, Check, Copy, FileDown, Loader2, ShieldAlert } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { formatP2PAreaLabel } from '../data/p2pAreaCodes';
import type { P2PQuakeRecord } from '../types/quake';
import { copyTextToClipboard } from '../utils/clipboard';
import { buildEarthquakePreparednessAdvice } from '../utils/earthquakeAdvice';
import { type AppLanguage, getMessages } from '../utils/i18n';
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
import type { ColorThemeId, ThemeMode } from '../utils/themeSettings';
import { EpicenterD3Map } from './EpicenterD3Map';
import { ScaleDistributionChart } from './ScaleDistributionChart';

interface QuakeDetailPanelProps {
  lang: AppLanguage;
  records: P2PQuakeRecord[];
  selectedRecord: P2PQuakeRecord | null;
  onSelectRecord: (id: string) => void;
  themeMode: ThemeMode;
  colorTheme: ColorThemeId;
}

export function QuakeDetailPanel({
  lang,
  records,
  selectedRecord,
  onSelectRecord,
  themeMode,
  colorTheme,
}: QuakeDetailPanelProps) {
  const m = getMessages(lang);
  const [copied, setCopied] = useState(false);
  const [pdfStatus, setPdfStatus] = useState<'idle' | 'exporting' | 'done' | 'error'>('idle');

  const formattedCopyText = useMemo(() => {
    if (!selectedRecord) return '';
    return formatQuakeForClipboard(selectedRecord, lang);
  }, [selectedRecord, lang]);

  const advice = useMemo(() => {
    if (!selectedRecord) return null;
    return buildEarthquakePreparednessAdvice(selectedRecord, lang);
  }, [selectedRecord, lang]);

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

  if (!selectedRecord || !advice) {
    return (
      <section className="flex flex-1 flex-col items-center justify-center rounded-lg border border-[var(--nein-border)] bg-[var(--nein-surface)] p-10 text-center">
        <p className="text-base font-medium text-slate-800 dark:text-slate-300">
          {m.detail.emptyTitle}
        </p>
        <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-500">
          {m.detail.emptyDesc}
        </p>
      </section>
    );
  }

  const title = getRecordTitle(selectedRecord, lang);
  const category = getRecordCategoryLabel(selectedRecord, lang);

  const groupedPoints =
    selectedRecord.code === 551
      ? groupPointsByPrefAndScale(selectedRecord.points)
      : [];

  let scaleDisplay = '-';
  let magnitudeDisplay = '--';
  let depthDisplay = '--';
  let subInfoLabel = m.detail.metricSource;
  let subInfoValue = lang === 'en' ? 'P2PQuake' : 'P2P地震情報';

  if (selectedRecord.code === 551) {
    scaleDisplay = getScalePresentation(selectedRecord.earthquake.maxScale, lang).label;
    magnitudeDisplay = formatMagnitude(selectedRecord.earthquake.hypocenter.magnitude, lang);
    depthDisplay = formatDepth(selectedRecord.earthquake.hypocenter.depth, lang);
    subInfoLabel = m.detail.metricTsunami;
    subInfoValue = translateTsunamiShort(selectedRecord.earthquake.domesticTsunami, lang);
  } else if (selectedRecord.code === 556) {
    const maxScale = getEEWMaxScale(selectedRecord);
    scaleDisplay = selectedRecord.cancelled
      ? lang === 'en'
        ? 'Cancelled'
        : lang === 'ko'
        ? '취소'
        : '取消'
      : maxScale > 0
      ? lang === 'en'
        ? `${getScalePresentation(maxScale, lang).label}+`
        : lang === 'ko'
        ? `${getScalePresentation(maxScale, lang).label} 이상`
        : `${getScalePresentation(maxScale, lang).label}以上`
      : m.eewModal.analyzing;
    magnitudeDisplay = formatMagnitude(selectedRecord.earthquake?.hypocenter.magnitude, lang);
    depthDisplay = formatDepth(selectedRecord.earthquake?.hypocenter.depth, lang);
    subInfoLabel = m.detail.metricIssueSerial;
    subInfoValue =
      lang === 'en'
        ? `#${selectedRecord.issue.serial} (${selectedRecord.cancelled ? 'Cancelled' : 'Warning'})`
        : `第${selectedRecord.issue.serial}報 (${selectedRecord.cancelled ? '取消報' : '警報'})`;
  } else if (selectedRecord.code === 554) {
    scaleDisplay =
      lang === 'en' ? 'Detected' : lang === 'zh' ? '发布检测' : lang === 'ko' ? '감지' : '発表検出';
    subInfoLabel = m.detail.metricDetectionType;
    subInfoValue = selectedRecord.type;
  } else if (selectedRecord.code === 552) {
    scaleDisplay = selectedRecord.cancelled
      ? lang === 'en'
        ? 'Lifted'
        : lang === 'ko'
        ? '해제'
        : '解除'
      : lang === 'en'
      ? 'Active'
      : lang === 'zh'
      ? '发布中'
      : lang === 'ko'
      ? '발표 중'
      : '発表中';
    subInfoLabel = m.detail.metricSource;
    subInfoValue = selectedRecord.issue.source;
  } else if (selectedRecord.code === 561) {
    scaleDisplay =
      lang === 'en' ? 'Felt' : lang === 'zh' ? '体感' : lang === 'ko' ? '체감' : '感知';
    subInfoLabel = m.detail.metricRegion;
    subInfoValue = `${formatP2PAreaLabel(selectedRecord.area, lang)} (${selectedRecord.area})`;
  }

  const tierBadgeClass =
    advice.tier === 'critical'
      ? 'border-red-500/50 bg-red-500/15 text-red-700 dark:text-red-300'
      : advice.tier === 'strong'
      ? 'border-amber-500/50 bg-amber-500/15 text-amber-800 dark:text-amber-200'
      : advice.tier === 'moderate'
      ? 'border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] text-[var(--nein-accent-text)]'
      : 'border-emerald-600/35 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300';

  const getChipToneClass = (priority: 'urgent' | 'high' | 'normal') => {
    if (priority === 'urgent') {
      return 'border-red-500/45 bg-red-500/10 text-slate-900 dark:text-slate-100';
    }
    if (priority === 'high') {
      return 'border-amber-500/40 bg-amber-500/10 text-slate-900 dark:text-slate-100';
    }
    return 'border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-900 dark:text-slate-100';
  };

  return (
    <section
      aria-label={title}
      className="flex min-w-0 flex-1 flex-col gap-5"
    >
      {/* Top Detail Summary & One-Click Copy */}
      <div className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-surface)] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-[var(--nein-accent-text)]">{category}</span>
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
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    {m.detail.testPayloadTag}
                  </span>
                </>
              )}
            </div>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-50 sm:text-3xl">
              {title}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => void handleDownloadPdf()}
              disabled={pdfStatus === 'exporting'}
              data-testid="download-pdf-btn"
              className={`inline-flex min-h-[42px] items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nein-accent)] ${
                pdfStatus === 'done'
                  ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200'
                  : pdfStatus === 'error'
                  ? 'border-red-500/60 bg-red-500/15 text-red-800 dark:text-red-200'
                  : 'border-[var(--nein-border)] bg-[var(--nein-sub)] text-slate-800 hover:bg-slate-200/70 dark:bg-slate-800/90 dark:text-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {pdfStatus === 'exporting' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>{m.detail.pdfGenerating}</span>
                </>
              ) : pdfStatus === 'done' ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  <span>{m.detail.pdfDone}</span>
                </>
              ) : pdfStatus === 'error' ? (
                <>
                  <FileDown className="h-4 w-4 text-red-600 dark:text-red-400" aria-hidden="true" />
                  <span>{m.detail.pdfError}</span>
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
                  <span>{m.detail.pdfDownload}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => void handleCopy()}
              data-testid="copy-selected-quake-btn"
              className={`inline-flex min-h-[42px] items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nein-accent)] ${
                copied
                  ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950'
                  : 'bg-[var(--nein-accent)] text-[var(--nein-accent-contrast)] hover:bg-[var(--nein-accent-hover)]'
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" aria-hidden="true" />
                  <span>{m.detail.copied}</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  <span>{m.detail.copyQuake}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 4-column Key Metrics Strip */}
        <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-[var(--nein-border)] bg-[var(--nein-border)] sm:grid-cols-4">
          <div className="bg-[var(--nein-sub)] px-4 py-3">
            <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
              {m.detail.metricScaleOrType}
            </div>
            <div className="mt-1 font-mono text-lg font-bold tabular-nums text-slate-950 dark:text-slate-50">
              {scaleDisplay}
            </div>
          </div>
          <div className="bg-[var(--nein-sub)] px-4 py-3">
            <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
              {m.detail.metricMagnitude}
            </div>
            <div className="mt-1 font-mono text-lg font-bold tabular-nums text-slate-950 dark:text-slate-50">
              {magnitudeDisplay}
            </div>
          </div>
          <div className="bg-[var(--nein-sub)] px-4 py-3">
            <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
              {m.detail.metricDepth}
            </div>
            <div className="mt-1 font-mono text-lg font-bold tabular-nums text-slate-950 dark:text-slate-50">
              {depthDisplay}
            </div>
          </div>
          <div className="bg-[var(--nein-sub)] px-4 py-3">
            <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
              {subInfoLabel}
            </div>
            <div className="mt-1 text-xs font-medium leading-snug text-slate-800 dark:text-slate-200">
              {subInfoValue}
            </div>
          </div>
        </div>
      </div>

      {/* Scale-Based Evacuation Mindset & Emergency Stockpile Advice Chips */}
      <section
        aria-label={m.detail.adviceHeading}
        data-testid="quake-advice-chips"
        className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-surface)] p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--nein-border-subtle)] pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {m.detail.adviceHeading}
            </h2>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              {advice.summary}
            </p>
          </div>
          <span
            data-testid="advice-tier-badge"
            className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold ${tierBadgeClass}`}
          >
            {advice.tierLabel}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Evacuation Mindset Chips */}
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <ShieldAlert className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
              <span>{m.detail.adviceMindsetTitle}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {advice.evacuationMindset.map((chip) => (
                <div
                  key={chip.id}
                  data-testid={`advice-chip-${chip.id}`}
                  className={`flex-1 min-w-[210px] rounded-md border px-3 py-2.5 ${getChipToneClass(chip.priority)}`}
                >
                  <div className="text-xs font-bold leading-snug">{chip.title}</div>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                    {chip.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Stockpile Chips */}
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <Backpack className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
              <span>{m.detail.adviceStockpileTitle}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {advice.stockpileAdvice.map((chip) => (
                <div
                  key={chip.id}
                  data-testid={`advice-chip-${chip.id}`}
                  className={`flex-1 min-w-[210px] rounded-md border px-3 py-2.5 ${getChipToneClass(chip.priority)}`}
                >
                  <div className="text-xs font-bold leading-snug">{chip.title}</div>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                    {chip.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
          {m.detail.adviceDisclaimer}
        </p>
      </section>

      {/* Balanced 2-Column Stage: D3.js Epicenter Map + Formatted Copy Preview */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 items-stretch">
        <EpicenterD3Map
          lang={lang}
          records={records}
          selectedRecord={selectedRecord}
          onSelectRecord={onSelectRecord}
          themeMode={themeMode}
          colorTheme={colorTheme}
        />

        <div className="flex flex-col rounded-lg border border-[var(--nein-border)] bg-[var(--nein-surface)]">
          <div className="flex items-center justify-between border-b border-[var(--nein-border-subtle)] px-4 py-2.5">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {m.detail.copyPreviewTitle}
            </span>
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium text-[var(--nein-accent-text)] hover:bg-[var(--nein-accent-soft)] cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  <span className="text-emerald-700 dark:text-emerald-300">{m.detail.copied}</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{m.detail.copyTextBtn}</span>
                </>
              )}
            </button>
          </div>
          <pre
            data-testid="copy-preview-text"
            className="max-h-[380px] flex-1 overflow-auto whitespace-pre-wrap break-words bg-[var(--nein-sub)] p-4 font-mono text-xs leading-relaxed text-slate-800 dark:text-slate-300"
          >
            {formattedCopyText}
          </pre>
        </div>
      </div>

      {/* Seismic Intensity Distribution Bar Chart (Recharts) */}
      <ScaleDistributionChart lang={lang} record={selectedRecord} themeMode={themeMode} />

      {/* Observation Points / EEW Areas / Tsunami Areas */}
      {selectedRecord.code === 551 && groupedPoints.length > 0 && (
        <div className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-surface)] p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {m.detail.pointsHeading}
          </h3>
          <div className="mt-4 divide-y divide-[var(--nein-border-subtle)]">
            {groupedPoints.map((group) => {
              const pres = getScalePresentation(group.scale, lang);
              return (
                <div
                  key={group.scale}
                  className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start"
                >
                  <div
                    className={`inline-flex min-w-20 shrink-0 items-center justify-center rounded border px-2 py-1 font-mono text-xs font-bold tabular-nums ${pres.bgClass} ${pres.borderClass} ${pres.textClass}`}
                  >
                    {pres.label}
                  </div>
                  <div className="flex-1 space-y-1.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    {group.prefectures.map((p) => (
                      <div key={p.pref}>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {p.pref}：
                        </span>
                        <span className="text-slate-600 dark:text-slate-400">
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
          <div className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-surface)] p-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {m.detail.eewAreasHeading}
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {selectedRecord.areas.map((area, idx) => (
                <div
                  key={`${area.pref}-${area.name}-${idx}`}
                  className="flex items-center justify-between rounded-md border border-[var(--nein-border)] bg-[var(--nein-sub)] px-3 py-2 text-xs"
                >
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {area.name}
                  </span>
                  <span className="font-mono tabular-nums text-red-700 dark:text-red-300">
                    {formatScaleRange(area.scaleFrom, area.scaleTo, lang)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      {selectedRecord.code === 552 &&
        selectedRecord.areas &&
        selectedRecord.areas.length > 0 && (
          <div className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-surface)] p-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {m.detail.tsunamiAreasHeading}
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {selectedRecord.areas.map((area, idx) => (
                <div
                  key={`${area.name}-${idx}`}
                  className="flex items-center justify-between rounded-md border border-[var(--nein-border)] bg-[var(--nein-sub)] px-3 py-2 text-xs"
                >
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {area.name}
                  </span>
                  <span className="text-cyan-700 dark:text-cyan-300">
                    {translateTsunamiGrade(area.grade, lang)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
    </section>
  );
}
