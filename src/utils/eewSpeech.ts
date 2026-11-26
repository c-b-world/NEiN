import type { JmaTsunamiSummaryItem, RegisteredRegion } from '../types/disaster';
import type { EEW556, EEWArea, EEWDetection554 } from '../types/quake';
import type { PrefectureOverviewRow } from '../types/weather';
import { getEarthquakeSeverityTier } from './earthquakeAdvice';
import type { AppLanguage } from './i18n';
import {
  formatScaleRange,
  getEEWMaxScale,
  getScalePresentation,
} from './quakeParser';
import { haversineDistanceKm } from './regionWatchlist';

export const EEW_SPEECH_SETTINGS_STORAGE_KEY = 'nein_eew_speech_settings_v1';

export interface EewSpeechSettings {
  enabled: boolean;
  duckBgmDuringSpeech: boolean;
  rate: number; // 0.8 .. 1.4
  volume: number; // 0.2 .. 1.0
  includePreparednessAdvice: boolean;
}

export const DEFAULT_EEW_SPEECH_SETTINGS: EewSpeechSettings = {
  enabled: true,
  duckBgmDuringSpeech: true,
  rate: 1.08,
  volume: 1.0,
  includePreparednessAdvice: true,
};

export interface CurrentLocationContext {
  label: string;
  prefectureName: string;
  officeCode: string;
  lat: number;
  lon: number;
  source: 'geolocation' | 'registered' | 'fallback';
}

export interface LocalEewImpactAnalysis {
  location: CurrentLocationContext;
  isTargeted: boolean;
  matchedAreas: EEWArea[];
  localMaxScale: number;
  localScaleFrom: number;
  localScaleTo: number;
  distanceKm: number | null;
  hasTsunamiRisk: boolean;
  activeLocalSpecialWarnings: number;
  activeLocalWarnings: number;
}

export interface SpeechVoiceLike {
  name: string;
  lang: string;
  localService?: boolean;
  default?: boolean;
}

const FALLBACK_LOCATION: CurrentLocationContext = {
  label: '東京都（東京）',
  prefectureName: '東京都',
  officeCode: '130000',
  lat: 35.6895,
  lon: 139.6917,
  source: 'fallback',
};

export function clampSpeechRate(rate: number): number {
  if (!Number.isFinite(rate)) return DEFAULT_EEW_SPEECH_SETTINGS.rate;
  return Math.round(Math.max(0.8, Math.min(1.4, rate)) * 100) / 100;
}

export function clampSpeechVolume(volume: number): number {
  if (!Number.isFinite(volume)) return DEFAULT_EEW_SPEECH_SETTINGS.volume;
  return Math.round(Math.max(0.2, Math.min(1.0, volume)) * 100) / 100;
}

export function loadEewSpeechSettings(): EewSpeechSettings {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { ...DEFAULT_EEW_SPEECH_SETTINGS };
  }
  try {
    const raw = window.localStorage.getItem(EEW_SPEECH_SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_EEW_SPEECH_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<EewSpeechSettings>;
    return {
      enabled:
        typeof parsed.enabled === 'boolean'
          ? parsed.enabled
          : DEFAULT_EEW_SPEECH_SETTINGS.enabled,
      duckBgmDuringSpeech:
        typeof parsed.duckBgmDuringSpeech === 'boolean'
          ? parsed.duckBgmDuringSpeech
          : DEFAULT_EEW_SPEECH_SETTINGS.duckBgmDuringSpeech,
      rate: clampSpeechRate(
        typeof parsed.rate === 'number' ? parsed.rate : DEFAULT_EEW_SPEECH_SETTINGS.rate,
      ),
      volume: clampSpeechVolume(
        typeof parsed.volume === 'number'
          ? parsed.volume
          : DEFAULT_EEW_SPEECH_SETTINGS.volume,
      ),
      includePreparednessAdvice:
        typeof parsed.includePreparednessAdvice === 'boolean'
          ? parsed.includePreparednessAdvice
          : DEFAULT_EEW_SPEECH_SETTINGS.includePreparednessAdvice,
    };
  } catch {
    return { ...DEFAULT_EEW_SPEECH_SETTINGS };
  }
}

export function saveEewSpeechSettings(settings: EewSpeechSettings): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(EEW_SPEECH_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage errors
  }
}

export function normalizePrefectureStem(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, '');
  if (!trimmed) return '';
  if (trimmed === '北海道' || trimmed === '北海') return '北海道';
  return trimmed.replace(/(東京都|大阪府|京都府)$/, (m) => m.slice(0, -1)).replace(/[都府県]$/, '');
}

export function isPrefectureMatch(prefA: string, prefB: string): boolean {
  const a = normalizePrefectureStem(prefA);
  const b = normalizePrefectureStem(prefB);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

export function resolveCurrentLocationContext(
  detectedLocation: RegisteredRegion | null,
  registeredRegions: RegisteredRegion[],
): CurrentLocationContext {
  if (detectedLocation) {
    return {
      label: detectedLocation.label,
      prefectureName: detectedLocation.prefectureName,
      officeCode: detectedLocation.officeCode,
      lat: detectedLocation.lat,
      lon: detectedLocation.lon,
      source: 'geolocation',
    };
  }
  const primary = registeredRegions[0];
  if (primary) {
    return {
      label: primary.label,
      prefectureName: primary.prefectureName,
      officeCode: primary.officeCode,
      lat: primary.lat,
      lon: primary.lon,
      source: 'registered',
    };
  }
  return FALLBACK_LOCATION;
}

export function analyzeLocalEewImpact(
  alert: EEW556 | EEWDetection554,
  location: CurrentLocationContext,
  options: {
    regionSnapshots?: PrefectureOverviewRow[];
    jmaTsunamis?: JmaTsunamiSummaryItem[];
  } = {},
): LocalEewImpactAnalysis {
  const snapshot = options.regionSnapshots?.find(
    (row) => row.office.officeCode === location.officeCode,
  );
  const activeLocalSpecialWarnings = snapshot?.specialCount ?? 0;
  const activeLocalWarnings = snapshot?.warningCount ?? 0;

  const hasActiveJmaTsunami = Boolean(
    options.jmaTsunamis?.some(
      (item) =>
        item.highestSeverity === 'major_warning' ||
        item.highestSeverity === 'warning' ||
        item.highestSeverity === 'watch',
    ),
  );

  if (alert.code === 554) {
    return {
      location,
      isTargeted: false,
      matchedAreas: [],
      localMaxScale: -1,
      localScaleFrom: -1,
      localScaleTo: -1,
      distanceKm: null,
      hasTsunamiRisk: hasActiveJmaTsunami,
      activeLocalSpecialWarnings,
      activeLocalWarnings,
    };
  }

  const matchedAreas = (alert.areas ?? []).filter(
    (area) =>
      isPrefectureMatch(area.pref, location.prefectureName) ||
      isPrefectureMatch(area.name, location.prefectureName),
  );

  let localScaleFrom = -1;
  let localScaleTo = -1;
  let localMaxScale = -1;
  for (const area of matchedAreas) {
    if (area.scaleFrom > localScaleFrom) localScaleFrom = area.scaleFrom;
    const effectiveTo = area.scaleTo === 99 ? area.scaleFrom : area.scaleTo;
    if (effectiveTo > localScaleTo) localScaleTo = effectiveTo;
    const candidate = Math.max(area.scaleFrom, effectiveTo);
    if (candidate > localMaxScale) localMaxScale = candidate;
  }

  const hypo = alert.earthquake?.hypocenter;
  const hasValidCoords =
    hypo != null &&
    Number.isFinite(hypo.latitude) &&
    Number.isFinite(hypo.longitude) &&
    (hypo.latitude !== 0 || hypo.longitude !== 0) &&
    hypo.latitude >= -90 &&
    hypo.latitude <= 90 &&
    hypo.longitude >= -180 &&
    hypo.longitude <= 180;

  const distanceKm = hasValidCoords
    ? Math.round(haversineDistanceKm(location.lat, location.lon, hypo.latitude, hypo.longitude))
    : null;

  const severity = getEarthquakeSeverityTier(alert);

  return {
    location,
    isTargeted: matchedAreas.length > 0,
    matchedAreas,
    localMaxScale,
    localScaleFrom,
    localScaleTo,
    distanceKm,
    hasTsunamiRisk: severity.hasTsunamiRisk || hasActiveJmaTsunami,
    activeLocalSpecialWarnings,
    activeLocalWarnings,
  };
}

function formatSpokenMagnitude(mag: number | undefined, lang: AppLanguage): string {
  if (typeof mag !== 'number' || !Number.isFinite(mag) || mag < 0) return '';
  const fixed = mag.toFixed(1);
  if (lang === 'en') return `magnitude ${fixed}`;
  if (lang === 'zh') return `震级 ${fixed} 级`;
  if (lang === 'ko') return `규모 ${fixed}`;
  return `マグニチュード ${fixed}`;
}

export function buildEewSpeechScript(
  alert: EEW556 | EEWDetection554,
  impact: LocalEewImpactAnalysis,
  lang: AppLanguage = 'ja',
  includePreparednessAdvice = true,
): string {
  const locName = impact.location.prefectureName || impact.location.label;
  const parts: string[] = [];

  if (alert.isTest) {
    if (lang === 'en') parts.push('This is a test drill broadcast.');
    else if (lang === 'zh') parts.push('这是演练测试广播。');
    else if (lang === 'ko') parts.push('훈련 방송입니다.');
    else parts.push('訓練放送です。');
  }

  if (alert.code === 556 && alert.cancelled) {
    if (lang === 'en') {
      parts.push(
        `The previous Earthquake Early Warning has been cancelled. Please check your surroundings calmly in ${locName}.`,
      );
    } else if (lang === 'zh') {
      parts.push(`先前的紧急地震速报已取消。请在${locName}保持冷静并确认周围安全。`);
    } else if (lang === 'ko') {
      parts.push(
        `방금 발표된 긴급지진속보는 취소되었습니다. ${locName} 주변의 안전을 차분히 확인해 주세요.`,
      );
    } else {
      parts.push(
        `先ほどの緊急地震速報は取り消されました。${locName}周辺では、念のため周囲の安全をご確認ください。`,
      );
    }
    return parts.join(' ');
  }

  if (alert.code === 554) {
    if (lang === 'en') {
      parts.push(
        `Earthquake Early Warning detected. Prepare for shaking near ${locName} and protect your head immediately.`,
      );
    } else if (lang === 'zh') {
      parts.push(`检测到紧急地震速报。请做好${locName}附近摇晃准备，立即保护头部。`);
    } else if (lang === 'ko') {
      parts.push(
        `긴급지진속보가 감지되었습니다. ${locName} 부근의 흔들림에 대비해 즉시 머리를 보호하세요.`,
      );
    } else {
      parts.push(
        `緊急地震速報を検知しました。現在地、${locName}付近での揺れに備え、直ちに頭を保護してください。`,
      );
    }
    return parts.join(' ');
  }

  // Active EEW 556
  const hypoName = alert.earthquake?.hypocenter?.name?.trim() || '';
  const magText = formatSpokenMagnitude(alert.earthquake?.hypocenter?.magnitude, lang);
  const maxScale = Math.max(getEEWMaxScale(alert), impact.localMaxScale);
  const maxScaleText = maxScale > 0 ? getScalePresentation(maxScale, lang).label : '';

  if (lang === 'en') {
    const core = hypoName
      ? `Earthquake Early Warning. An earthquake occurred in ${hypoName}${magText ? `, ${magText}` : ''}${maxScaleText ? `, maximum predicted ${maxScaleText}` : ''}.`
      : `Earthquake Early Warning.${maxScaleText ? ` Maximum predicted ${maxScaleText}.` : ''}`;
    parts.push(core);

    if (impact.isTargeted) {
      const localRange = formatScaleRange(impact.localScaleFrom, impact.localScaleTo, 'en');
      const dist = impact.distanceKm !== null ? ` about ${impact.distanceKm} kilometers from the epicenter.` : '.';
      parts.push(
        `For your current location ${locName}, strong shaking of ${localRange} is predicted,${dist}`,
      );
    } else {
      const dist =
        impact.distanceKm !== null
          ? ` approximately ${impact.distanceKm} kilometers from the epicenter.`
          : '.';
      parts.push(
        `Your current location ${locName} is outside the primary warning zone,${dist} Please remain alert for possible shaking.`,
      );
    }

    if (includePreparednessAdvice) {
      if (impact.hasTsunamiRisk) {
        parts.push('If you are near the coast or river mouths, evacuate to high ground immediately.');
      }
      if (impact.isTargeted || maxScale >= 45) {
        parts.push('Drop, take cover under a sturdy table, and protect your head from falling objects.');
      } else {
        parts.push('Step away from shelves and windows and follow official updates.');
      }
      if (impact.activeLocalSpecialWarnings > 0 || impact.activeLocalWarnings > 0) {
        parts.push(
          `Weather warnings are also active in ${locName}; stay alert for landslides and secondary hazards.`,
        );
      }
    }
  } else if (lang === 'zh') {
    const core = hypoName
      ? `紧急地震速报。${hypoName}发生地震${magText ? `，${magText}` : ''}${maxScaleText ? `，最大预测${maxScaleText}` : ''}。`
      : `紧急地震速报。${maxScaleText ? `最大预测${maxScaleText}。` : ''}`;
    parts.push(core);

    if (impact.isTargeted) {
      const localRange = formatScaleRange(impact.localScaleFrom, impact.localScaleTo, 'zh');
      const dist = impact.distanceKm !== null ? `距震中约${impact.distanceKm}公里。` : '';
      parts.push(`当前所在地${locName}预计将出现${localRange}的强烈摇晃，${dist}`);
    } else {
      const dist = impact.distanceKm !== null ? `，距震中约${impact.distanceKm}公里` : '';
      parts.push(`当前所在地${locName}不在强震预警核心区内${dist}，但仍请留意可能的摇晃。`);
    }

    if (includePreparednessAdvice) {
      if (impact.hasTsunamiRisk) {
        parts.push('如身处沿海或河口附近，请立即向高地或海啸避难建筑撤离。');
      }
      if (impact.isTargeted || maxScale >= 45) {
        parts.push('请立即躲到坚固桌下，保护头部，防范高空坠物。');
      } else {
        parts.push('请保持冷静，远离玻璃窗与高处物品，关注官方最新通报。');
      }
      if (impact.activeLocalSpecialWarnings > 0 || impact.activeLocalWarnings > 0) {
        parts.push(`另外，${locName}目前发布有气象警报，请注意防范山体滑坡等次生灾害。`);
      }
    }
  } else if (lang === 'ko') {
    const core = hypoName
      ? `긴급지진속보입니다. ${hypoName}에서 지진이 발생했습니다.${magText ? ` ${magText},` : ''}${maxScaleText ? ` 최대 예상 ${maxScaleText}입니다.` : ''}`
      : `긴급지진속보입니다.${maxScaleText ? ` 최대 예상 ${maxScaleText}입니다.` : ''}`;
    parts.push(core);

    if (impact.isTargeted) {
      const localRange = formatScaleRange(impact.localScaleFrom, impact.localScaleTo, 'ko');
      const dist = impact.distanceKm !== null ? ` 진원까지의 거리는 약 ${impact.distanceKm}킬로미터입니다.` : '';
      parts.push(`현재 위치 ${locName}에서는 ${localRange}의 강한 흔들림이 예상됩니다.${dist}`);
    } else {
      const dist = impact.distanceKm !== null ? ` 진원에서 약 ${impact.distanceKm}킬로미터 떨어져 있지만,` : '';
      parts.push(`현재 위치 ${locName}은 주요 경보 구역 밖이며${dist} 만약을 위해 흔들림에 주의해 주세요.`);
    }

    if (includePreparednessAdvice) {
      if (impact.hasTsunamiRisk) {
        parts.push('해안이나 하천 근처에 계신 분은 즉시 고지대나 쓰나미 대피 건물로 대피하세요.');
      }
      if (impact.isTargeted || maxScale >= 45) {
        parts.push('튼튼한 책상 아래로 몸을 숨기고 낙하물로부터 머리를 보호하세요.');
      } else {
        parts.push('선반과 창가에서 떨어져 차분히 공식 정보를 확인해 주세요.');
      }
      if (impact.activeLocalSpecialWarnings > 0 || impact.activeLocalWarnings > 0) {
        parts.push(`현재 ${locName}에 기상 경보가 발표 중이므로 산사태 등 2차 재해에도 주의해 주세요.`);
      }
    }
  } else {
    // Japanese (ja)
    const core = hypoName
      ? `緊急地震速報です。${hypoName}で地震が発生しました。${magText ? `${magText}、` : ''}${maxScaleText ? `最大予測震度は${maxScaleText}です。` : ''}`
      : `緊急地震速報です。${maxScaleText ? `最大予測震度は${maxScaleText}です。` : ''}`;
    parts.push(core);

    if (impact.isTargeted) {
      const localRange = formatScaleRange(impact.localScaleFrom, impact.localScaleTo, 'ja');
      const dist =
        impact.distanceKm !== null
          ? `震源までの距離はおよそ${impact.distanceKm}キロメートルです。`
          : '';
      parts.push(`現在地、${locName}では、${localRange}の強い揺れが予測されています。${dist}`);
    } else {
      const dist =
        impact.distanceKm !== null
          ? `震源からおよそ${impact.distanceKm}キロメートル離れていますが、`
          : '';
      parts.push(
        `現在地、${locName}は強い揺れの警報対象外で、${dist}念のため揺れにご注意ください。`,
      );
    }

    if (includePreparednessAdvice) {
      if (impact.hasTsunamiRisk) {
        parts.push('沿岸部や河口付近にいる方は、直ちに高台や津波避難ビルへ避難してください。');
      }
      if (impact.isTargeted || maxScale >= 45) {
        parts.push(
          '頑丈な机の下など安全な場所に身を隠し、落下物から頭を守ってください。揺れが収まったら火の元と避難経路を確認してください。',
        );
      } else {
        parts.push('落ち着いて棚や窓際から離れ、最新の公式情報をご確認ください。');
      }
      if (impact.activeLocalSpecialWarnings > 0 || impact.activeLocalWarnings > 0) {
        const warnCount = impact.activeLocalSpecialWarnings + impact.activeLocalWarnings;
        parts.push(
          `なお、${locName}には現在、気象警報が${warnCount}件発表されています。土砂災害などの二次災害にもご注意ください。`,
        );
      }
    }
  }

  return parts.filter(Boolean).join(' ');
}

export function mapAppLangToSpeechLocale(lang: AppLanguage): string {
  switch (lang) {
    case 'en':
      return 'en-US';
    case 'zh':
      return 'zh-CN';
    case 'ko':
      return 'ko-KR';
    default:
      return 'ja-JP';
  }
}

export function selectBestSpeechVoice<T extends SpeechVoiceLike>(
  voices: readonly T[],
  lang: AppLanguage,
): T | null {
  if (!voices.length) return null;
  const targetLocale = mapAppLangToSpeechLocale(lang).toLowerCase();
  const targetPrefix = targetLocale.split('-')[0];

  const exactLocal = voices.find(
    (v) => v.lang.toLowerCase() === targetLocale && v.localService,
  );
  if (exactLocal) return exactLocal;

  const exactAny = voices.find((v) => v.lang.toLowerCase() === targetLocale);
  if (exactAny) return exactAny;

  const prefixLocal = voices.find(
    (v) => v.lang.toLowerCase().startsWith(targetPrefix) && v.localService,
  );
  if (prefixLocal) return prefixLocal;

  const prefixAny = voices.find((v) => v.lang.toLowerCase().startsWith(targetPrefix));
  if (prefixAny) return prefixAny;

  return voices.find((v) => v.default) ?? voices[0] ?? null;
}

export function isSpeechSynthesisSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof window.speechSynthesis?.speak === 'function' &&
    typeof SpeechSynthesisUtterance !== 'undefined'
  );
}

export type SpeechErrorReason =
  | 'unsupported'
  | 'not-allowed'
  | 'synthesis-unavailable'
  | 'interrupted';

export function getSpeechErrorMessage(
  reason: SpeechErrorReason,
  lang: AppLanguage,
): string {
  if (reason === 'not-allowed') {
    if (lang === 'en') {
      return 'Browser autoplay policy blocked automatic speech. Click "Read Aloud" to start voice playback.';
    }
    if (lang === 'zh') {
      return '浏览器自动播放策略阻止了自动语音播报，请点击「语音播报」按钮手动播放。';
    }
    if (lang === 'ko') {
      return '브라우저 자동 재생 정책으로 자동 음성이 차단되었습니다. 「음성으로 듣기」 버튼을 눌러 주세요.';
    }
    return 'ブラウザの自動再生制限により自動読み上げがブロックされました。「音声で読み上げ」ボタンを押して再生してください。';
  }

  if (reason === 'unsupported') {
    if (lang === 'en') return 'Web Speech API (speechSynthesis) is not supported in this browser.';
    if (lang === 'zh') return '当前浏览器不支持 Web Speech API（speechSynthesis）。';
    if (lang === 'ko') return '이 브라우저는 Web Speech API(speechSynthesis)를 지원하지 않습니다.';
    return 'このブラウザは音声合成（Web Speech API）に対応していません。';
  }

  if (reason === 'interrupted') {
    if (lang === 'en') return 'Voice announcement was interrupted.';
    if (lang === 'zh') return '语音播报已中断。';
    if (lang === 'ko') return '음성 안내가 중단되었습니다.';
    return '音声読み上げが中断されました。';
  }

  // synthesis-unavailable
  if (lang === 'en') {
    return 'No system TTS voice engine is available on this device; displaying the alert script and muting BGM instead.';
  }
  if (lang === 'zh') {
    return '当前设备未检测到可用的系统语音合成引擎，已切换为文本展示并保持 BGM 静音联动。';
  }
  if (lang === 'ko') {
    return '이 기기에서 사용 가능한 음성 합성 엔진을 찾지 못해 텍스트 안내와 BGM 음소거로 전환했습니다.';
  }
  return 'この端末・ブラウザで利用可能な音声合成エンジン（TTS音声）が見つからないため、読み上げ文の画面表示で案内しています。';
}

let activeFallbackTimer: number | null = null;
let activeSpeakSessionId = 0;

function clearActiveFallbackTimer(): void {
  if (activeFallbackTimer !== null && typeof window !== 'undefined') {
    window.clearTimeout(activeFallbackTimer);
    activeFallbackTimer = null;
  }
}

export function stopDisasterAnnouncement(): void {
  activeSpeakSessionId += 1;
  clearActiveFallbackTimer();
  if (!isSpeechSynthesisSupported()) return;
  try {
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
    }
  } catch {
    // Ignore speech synthesis cancellation errors in restricted browsers
  }
}

export function speakDisasterAnnouncement(
  text: string,
  options: {
    lang: AppLanguage;
    rate: number;
    volume: number;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (reason: SpeechErrorReason) => void;
  },
): boolean {
  const cleaned = text.trim();
  if (!cleaned) return false;
  if (!isSpeechSynthesisSupported()) {
    options.onError?.('unsupported');
    return false;
  }

  stopDisasterAnnouncement();
  const sessionId = activeSpeakSessionId;

  let finished = false;
  let retriedWithoutVoice = false;

  const finalize = (errReason: SpeechErrorReason | null = null) => {
    if (finished || sessionId !== activeSpeakSessionId) return;
    finished = true;
    clearActiveFallbackTimer();
    if (errReason) options.onError?.(errReason);
    options.onEnd?.();
  };

  const enqueueUtterance = (useSelectedVoice: boolean) => {
    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.lang = mapAppLangToSpeechLocale(options.lang);
    utterance.rate = clampSpeechRate(options.rate);
    utterance.volume = clampSpeechVolume(options.volume);
    utterance.pitch = 1.0;

    let appliedVoice = false;
    if (useSelectedVoice) {
      const voices = window.speechSynthesis.getVoices?.() ?? [];
      const voice = selectBestSpeechVoice(voices, options.lang);
      if (voice) {
        try {
          utterance.voice = voice;
          appliedVoice = true;
        } catch {
          // Some browsers/polyfills reject custom voice objects; rely on utterance.lang
        }
      }
    }

    utterance.onstart = () => {
      if (sessionId === activeSpeakSessionId) {
        options.onStart?.();
      }
    };
    utterance.onend = () => finalize(null);
    utterance.onerror = (ev) => {
      if (sessionId !== activeSpeakSessionId) return;
      const errCode = (ev as SpeechSynthesisErrorEvent | undefined)?.error ?? '';
      if (
        appliedVoice &&
        !retriedWithoutVoice &&
        (errCode === 'voice-unavailable' || errCode === 'language-unavailable')
      ) {
        retriedWithoutVoice = true;
        enqueueUtterance(false);
        return;
      }
      if (errCode === 'not-allowed') {
        finalize('not-allowed');
      } else if (errCode === 'canceled' || errCode === 'interrupted') {
        finalize('interrupted');
      } else {
        finalize('synthesis-unavailable');
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  try {
    // Notify listeners immediately so BGM ducks before the first syllable
    options.onStart?.();

    // Safety guard so BGM never remains stuck ducked if a browser drops onend
    const clampedRate = clampSpeechRate(options.rate);
    const estimatedMs = Math.max(
      4_500,
      Math.min(35_000, Math.round((cleaned.length * 165) / clampedRate) + 3_000),
    );
    activeFallbackTimer = window.setTimeout(() => finalize(null), estimatedMs);

    enqueueUtterance(true);
    return true;
  } catch {
    finalize('synthesis-unavailable');
    return false;
  }
}
