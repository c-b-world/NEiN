import {
  AlertTriangle,
  Check,
  Copy,
  MapPin,
  Megaphone,
  Square,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { EEW556, EEWDetection554 } from '../types/quake';
import { copyTextToClipboard } from '../utils/clipboard';
import type { LocalEewImpactAnalysis } from '../utils/eewSpeech';
import { localizeJapanesePlaceName } from '../utils/eewSpeechLocale';
import { type AppLanguage, LANGUAGE_OPTIONS, getMessages } from '../utils/i18n';
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
  lang: AppLanguage;
  speechLang?: AppLanguage;
  alert: EEW556 | EEWDetection554 | null;
  onDismiss: () => void;
  localImpact?: LocalEewImpactAnalysis | null;
  isSpeaking?: boolean;
  speechSupported?: boolean;
  bgmDucked?: boolean;
  spokenScript?: string | null;
  speechError?: string | null;
  onReplaySpeech?: () => void;
  onStopSpeech?: () => void;
  onSwitchSpeechLang?: (nextLang: AppLanguage) => void;
}

const MODAL_SPEECH_COPY: Record<
  AppLanguage,
  {
    sectionTitle: string;
    targetedBadge: string;
    outsideBadge: string;
    distancePrefix: string;
    distanceUnit: string;
    tsunamiCaution: string;
    bgmMutedBadge: string;
    speakingNow: string;
    replayBtn: string;
    stopBtn: string;
    unsupportedHint: string;
  }
> = {
  ja: {
    sectionTitle: '現在地向け防災アナウンス（音声合成）',
    targetedBadge: '警報対象エリア',
    outsideBadge: '対象エリア外（念のため注意）',
    distancePrefix: '震源から約',
    distanceUnit: 'km',
    tsunamiCaution: '津波警戒あり',
    bgmMutedBadge: 'BGM自動消音中',
    speakingNow: '音声読み上げ中',
    replayBtn: '音声で読み上げ',
    stopBtn: '読み上げ停止',
    unsupportedHint: 'このブラウザは音声合成（Web Speech API）に非対応です',
  },
  en: {
    sectionTitle: 'Local Disaster Voice Broadcast',
    targetedBadge: 'Warning Zone',
    outsideBadge: 'Outside Core Zone',
    distancePrefix: 'Approx.',
    distanceUnit: 'km from epicenter',
    tsunamiCaution: 'Tsunami Risk',
    bgmMutedBadge: 'BGM Auto-Muted',
    speakingNow: 'Speaking Alert',
    replayBtn: 'Read Aloud',
    stopBtn: 'Stop Voice',
    unsupportedHint: 'Web Speech API voice readout is unavailable in this browser.',
  },
  zh: {
    sectionTitle: '当前位置防灾语音播报',
    targetedBadge: '强震预警区域内',
    outsideBadge: '核心预警区外（请留意）',
    distancePrefix: '距震中约',
    distanceUnit: '公里',
    tsunamiCaution: '注意海啸风险',
    bgmMutedBadge: 'BGM已自动静音',
    speakingNow: '正在语音播报',
    replayBtn: '语音播报',
    stopBtn: '停止播报',
    unsupportedHint: '当前浏览器不支持 Web Speech API 语音合成。',
  },
  ko: {
    sectionTitle: '현재 위치 재난 음성 안내',
    targetedBadge: '경보 대상 지역',
    outsideBadge: '경보 구역 외 (주의 필요)',
    distancePrefix: '진원에서 약',
    distanceUnit: 'km',
    tsunamiCaution: '쓰나미 주의',
    bgmMutedBadge: 'BGM 자동 음소거 중',
    speakingNow: '음성 안내 중',
    replayBtn: '음성으로 듣기',
    stopBtn: '음성 중지',
    unsupportedHint: '이 브라우저는 Web Speech API 음성 합성을 지원하지 않습니다.',
  },
};

export function EEWWarningModal({
  lang,
  speechLang,
  alert,
  onDismiss,
  localImpact = null,
  isSpeaking = false,
  speechSupported = false,
  bgmDucked = false,
  spokenScript = null,
  speechError = null,
  onReplaySpeech,
  onStopSpeech,
  onSwitchSpeechLang,
}: EEWWarningModalProps) {
  const m = getMessages(lang);
  const activeSpeechLang = speechLang ?? lang;
  const speechCopy = MODAL_SPEECH_COPY[lang] ?? MODAL_SPEECH_COPY.ja;
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
  const scalePresentation = maxScale > 0 ? getScalePresentation(maxScale, lang) : null;

  const handleCopyAlert = async () => {
    const ok = await copyTextToClipboard(formatQuakeForClipboard(alert, lang));
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4"
      data-testid="eew-warning-overlay"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="eew-modal-title"
        className={`flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border shadow-2xl ${
          isCancelled
            ? 'border-slate-600 bg-[#111827]'
            : 'border-red-500 bg-[#130A0D]'
        }`}
      >
        {/* Top Emergency Header */}
        <div
          className={`flex shrink-0 items-center justify-between gap-4 px-5 py-4 ${
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
                    ? m.eewModal.cancelledTitle
                    : alert.code === 554
                    ? m.eewModal.detectTitle
                    : m.eewModal.warningTitle}
                </h2>
                {alert.isTest && (
                  <span className="shrink-0 whitespace-nowrap rounded bg-amber-400 px-2 py-0.5 text-xs font-bold text-slate-950">
                    {m.eewModal.testBadge}
                  </span>
                )}
              </div>
              <p className="mt-0.5 font-mono text-xs tabular-nums text-white/85">
                {alert.code === 556
                  ? `${lang === 'en' ? `#${alert.issue.serial}` : `第${alert.issue.serial}報`} · ${formatTimestamp(alert.issue.time)}`
                  : formatTimestamp(alert.time)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            aria-label={m.eewModal.closeBtn}
            className="rounded-md p-2 text-white/80 transition-colors hover:bg-black/20 hover:text-white cursor-pointer focus-visible:outline-2 focus-visible:outline-white"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 overflow-y-auto p-5 sm:p-6">
          {isCancelled ? (
            <div className="rounded-md border border-slate-700 bg-slate-900 p-4 text-sm text-slate-200">
              {m.eewModal.cancelledDesc}
            </div>
          ) : alert.code === 554 ? (
            <div className="space-y-3">
              <p className="text-lg font-bold text-red-100">
                {m.eewModal.detectHeadline}
              </p>
              <p className="text-sm leading-relaxed text-slate-300">
                {m.eewModal.detectDescPrefix}
                {alert.type}）— {m.eewModal.safetyNotice}
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-xs font-medium text-red-300">
                    {m.eewModal.hypocenterLabel}
                  </div>
                  <div className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">
                    {alert.earthquake?.hypocenter.name || m.eewModal.analyzing}
                  </div>
                  <div className="mt-1.5 font-mono text-xs tabular-nums text-red-200/80">
                    {formatMagnitude(alert.earthquake?.hypocenter.magnitude, lang)} ·{' '}
                    {formatDepth(alert.earthquake?.hypocenter.depth, lang)}
                    {alert.earthquake?.condition
                      ? ` · ${alert.earthquake.condition}`
                      : ''}
                  </div>
                </div>

                {scalePresentation && (
                  <div className="shrink-0 rounded-md border border-red-500/60 bg-red-950/90 px-4 py-3 text-center">
                    <div className="text-[11px] font-medium text-red-200">
                      {m.eewModal.predictedMaxScale}
                    </div>
                    <div className="mt-0.5 font-mono text-2xl font-extrabold tabular-nums text-white">
                      {scalePresentation.label}
                      <span className="ml-1 text-xs font-medium text-red-200">
                        {m.eewModal.orHigher}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {alert.areas && alert.areas.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-red-200">
                    {m.eewModal.targetAreas}
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
                          {formatScaleRange(area.scaleFrom, area.scaleTo, lang)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-100">
                {m.eewModal.safetyNotice}
              </div>
            </>
          )}

          {/* Local Disaster Impact & Web Speech API Voice Broadcast Panel */}
          {localImpact && (
            <div
              data-testid="eew-modal-speech-panel"
              className="rounded-md border border-sky-400/35 bg-slate-900/90 p-3.5 text-slate-100"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Megaphone className="h-4 w-4 shrink-0 text-sky-400" aria-hidden="true" />
                  <span className="text-xs font-bold text-sky-100">
                    {speechCopy.sectionTitle}
                  </span>
                  {bgmDucked && (
                    <span
                      data-testid="eew-modal-bgm-ducked-badge"
                      className="inline-flex items-center gap-1 rounded border border-amber-400/45 bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200"
                    >
                      <VolumeX className="h-3 w-3" aria-hidden="true" />
                      <span>{speechCopy.bgmMutedBadge}</span>
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {onSwitchSpeechLang && (
                    <div
                      role="group"
                      aria-label={speechCopy.sectionTitle}
                      className="inline-flex items-center overflow-hidden rounded-md border border-slate-700 bg-slate-950/80"
                    >
                      {LANGUAGE_OPTIONS.map((opt) => {
                        const isSelected = activeSpeechLang === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            data-testid={`eew-modal-speech-lang-${opt.id}`}
                            title={opt.nativeName}
                            aria-pressed={isSelected}
                            onClick={() => onSwitchSpeechLang(opt.id)}
                            className={`px-2 py-1 font-mono text-[10px] font-bold transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-sky-500/30 text-sky-100'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                            }`}
                          >
                            {opt.codeLabel}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {speechSupported ? (
                    isSpeaking ? (
                      <button
                        type="button"
                        data-testid="eew-modal-stop-speech-btn"
                        onClick={onStopSpeech}
                        className="inline-flex items-center gap-1.5 rounded-md border border-red-400/60 bg-red-600/90 px-2.5 py-1 text-[11px] font-bold text-white transition-colors hover:bg-red-500 cursor-pointer"
                      >
                        <Square className="h-3 w-3 fill-current" aria-hidden="true" />
                        <span>{speechCopy.stopBtn}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        data-testid="eew-modal-replay-speech-btn"
                        onClick={onReplaySpeech}
                        className="inline-flex items-center gap-1.5 rounded-md border border-sky-400/50 bg-sky-500/20 px-2.5 py-1 text-[11px] font-bold text-sky-100 transition-colors hover:bg-sky-500/35 cursor-pointer"
                      >
                        <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{speechCopy.replayBtn}</span>
                      </button>
                    )
                  ) : (
                    <span className="text-[10px] text-slate-400">
                      {speechCopy.unsupportedHint}
                    </span>
                  )}
                </div>
              </div>

              {/* Current Location Summary Metrics */}
              <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px]">
                <span className="inline-flex items-center gap-1 font-semibold text-white">
                  <MapPin className="h-3.5 w-3.5 text-sky-400" aria-hidden="true" />
                  <span data-testid="eew-modal-location-label">
                    {activeSpeechLang === 'ja'
                      ? localImpact.location.label
                      : localizeJapanesePlaceName(localImpact.location.prefectureName, activeSpeechLang)}
                  </span>
                </span>

                {!isCancelled && alert.code === 556 && (
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      localImpact.isTargeted
                        ? 'bg-red-500/25 text-red-200 border border-red-400/45'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {localImpact.isTargeted
                      ? `${speechCopy.targetedBadge} · ${formatScaleRange(
                          localImpact.localScaleFrom,
                          localImpact.localScaleTo,
                          lang,
                        )}`
                      : speechCopy.outsideBadge}
                  </span>
                )}

                {localImpact.distanceKm !== null && (
                  <span className="font-mono text-slate-300 tabular-nums">
                    {speechCopy.distancePrefix} {localImpact.distanceKm} {speechCopy.distanceUnit}
                  </span>
                )}

                {localImpact.hasTsunamiRisk && !isCancelled && (
                  <span className="rounded border border-amber-400/50 bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-200">
                    {speechCopy.tsunamiCaution}
                  </span>
                )}

                {isSpeaking && (
                  <span
                    data-testid="eew-modal-speaking-indicator"
                    className="inline-flex items-center gap-1 font-semibold text-emerald-300"
                  >
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                    <span>{speechCopy.speakingNow}</span>
                  </span>
                )}
              </div>

              {spokenScript && (
                <p
                  data-testid="eew-modal-spoken-script"
                  className="mt-2 rounded border border-slate-700/80 bg-slate-950/75 px-3 py-2 text-[11px] leading-relaxed text-slate-200"
                >
                  {spokenScript}
                </p>
              )}

              {speechError && (
                <p
                  role="status"
                  data-testid="eew-modal-speech-error"
                  className="mt-2 text-[11px] leading-relaxed text-amber-300"
                >
                  {speechError}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-slate-800/80 bg-[#0B0F17] px-6 py-4">
          <button
            type="button"
            onClick={() => void handleCopyAlert()}
            className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-700 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-sky-400"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                <span>{m.detail.copied}</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{m.eewModal.copyAlert}</span>
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
            {m.eewModal.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
}

