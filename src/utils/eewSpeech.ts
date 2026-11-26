import type { JmaTsunamiSummaryItem, RegisteredRegion } from '../types/disaster';
import type { EEW556, EEWArea, EEWDetection554 } from '../types/quake';
import type { PrefectureOverviewRow } from '../types/weather';
import { getEarthquakeSeverityTier } from './earthquakeAdvice';
import {
  formatSpokenIntensity,
  formatSpokenIntensityRange,
  formatSpokenMagnitude,
  localizeJapanesePlaceName,
} from './eewSpeechLocale';
import { type AppLanguage, isValidLanguage } from './i18n';
import { getEEWMaxScale } from './quakeParser';
import { haversineDistanceKm } from './regionWatchlist';

export const EEW_SPEECH_SETTINGS_STORAGE_KEY = 'nein_eew_speech_settings_v1';

export type EewSpeechLanguageSetting = 'auto' | AppLanguage;

export interface EewSpeechSettings {
  enabled: boolean;
  duckBgmDuringSpeech: boolean;
  rate: number; // 0.8 .. 1.4
  pitch: number; // 0.85 .. 1.15
  volume: number; // 0.2 .. 1.0
  includePreparednessAdvice: boolean;
  speechLanguage: EewSpeechLanguageSetting;
  preferredVoiceName: string; // '' = auto-select highest-fluency voice
}

export const DEFAULT_EEW_SPEECH_SETTINGS: EewSpeechSettings = {
  enabled: true,
  duckBgmDuringSpeech: true,
  rate: 1.02,
  pitch: 1.0,
  volume: 1.0,
  includePreparednessAdvice: true,
  speechLanguage: 'auto',
  preferredVoiceName: '',
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

export type SpeechSegmentRole =
  | 'test_prefix'
  | 'alert_header'
  | 'quake_summary'
  | 'local_impact'
  | 'tsunami_warning'
  | 'action_guidance'
  | 'secondary_hazard';

export interface SpeechSegment {
  role: SpeechSegmentRole;
  text: string;
  pauseBeforeMs: number;
  rateMultiplier: number;
  pitchOffset: number;
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

export function clampSpeechPitch(pitch: number): number {
  if (!Number.isFinite(pitch)) return DEFAULT_EEW_SPEECH_SETTINGS.pitch;
  return Math.round(Math.max(0.85, Math.min(1.15, pitch)) * 100) / 100;
}

export function clampSpeechVolume(volume: number): number {
  if (!Number.isFinite(volume)) return DEFAULT_EEW_SPEECH_SETTINGS.volume;
  return Math.round(Math.max(0.2, Math.min(1.0, volume)) * 100) / 100;
}

export function isValidSpeechLanguageSetting(value: unknown): value is EewSpeechLanguageSetting {
  return value === 'auto' || isValidLanguage(value);
}

export function resolveEffectiveSpeechLanguage(
  setting: EewSpeechLanguageSetting,
  appLang: AppLanguage,
): AppLanguage {
  return setting === 'auto' ? appLang : setting;
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
      pitch: clampSpeechPitch(
        typeof parsed.pitch === 'number' ? parsed.pitch : DEFAULT_EEW_SPEECH_SETTINGS.pitch,
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
      speechLanguage: isValidSpeechLanguageSetting(parsed.speechLanguage)
        ? parsed.speechLanguage
        : DEFAULT_EEW_SPEECH_SETTINGS.speechLanguage,
      preferredVoiceName:
        typeof parsed.preferredVoiceName === 'string' ? parsed.preferredVoiceName.trim() : '',
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

/**
 * Builds structured, naturally-paced broadcast speech segments tailored to
 * the user's current location across all 4 app languages (ja, en, zh, ko).
 */
export function buildEewSpeechSegments(
  alert: EEW556 | EEWDetection554,
  impact: LocalEewImpactAnalysis,
  lang: AppLanguage = 'ja',
  includePreparednessAdvice = true,
): SpeechSegment[] {
  const rawLocName = impact.location.prefectureName || impact.location.label;
  const locName = localizeJapanesePlaceName(rawLocName, lang);
  const segments: SpeechSegment[] = [];

  const pushSeg = (
    role: SpeechSegmentRole,
    text: string,
    pauseBeforeMs: number,
    rateMultiplier = 1.0,
    pitchOffset = 0,
  ) => {
    const cleaned = text.trim();
    if (!cleaned) return;
    segments.push({
      role,
      text: cleaned,
      pauseBeforeMs: segments.length === 0 ? 0 : pauseBeforeMs,
      rateMultiplier,
      pitchOffset,
    });
  };

  if (alert.isTest) {
    if (lang === 'en') {
      pushSeg('test_prefix', 'Attention. This is a drill broadcast.', 0, 0.96, 0.02);
    } else if (lang === 'zh') {
      pushSeg('test_prefix', '请注意，这是一次防灾演练播报。', 0, 0.96, 0.02);
    } else if (lang === 'ko') {
      pushSeg('test_prefix', '안내 말씀드립니다. 훈련 방송입니다.', 0, 0.96, 0.02);
    } else {
      pushSeg('test_prefix', '訓練放送です。', 0, 0.95, 0.02);
    }
  }

  // Cancelled EEW 556
  if (alert.code === 556 && alert.cancelled) {
    if (lang === 'en') {
      pushSeg('alert_header', 'The previous Earthquake Early Warning has been cancelled.', 220, 0.98, 0);
      pushSeg('local_impact', `Please stay calm and check your surroundings in ${locName}.`, 240, 0.98, -0.01);
    } else if (lang === 'zh') {
      pushSeg('alert_header', '先前的紧急地震速报已经取消。', 220, 0.98, 0);
      pushSeg('local_impact', `请在${locName}保持冷静，并确认周围环境安全。`, 240, 0.98, -0.01);
    } else if (lang === 'ko') {
      pushSeg('alert_header', '방금 발표된 긴급지진속보는 취소되었습니다.', 220, 0.98, 0);
      pushSeg('local_impact', `${locName} 주변에서는 차분히 안전을 확인해 주세요.`, 240, 0.98, -0.01);
    } else {
      pushSeg('alert_header', '先ほどの緊急地震速報は、取り消されました。', 220, 0.98, 0);
      pushSeg('local_impact', `${locName}周辺では、念のため落ち着いて周囲の安全をご確認ください。`, 240, 0.98, -0.01);
    }
    return segments;
  }

  // EEW Detection 554 (pre-detail alert)
  if (alert.code === 554) {
    if (lang === 'en') {
      pushSeg('alert_header', 'Earthquake Early Warning detected.', 200, 0.95, 0.04);
      pushSeg(
        'local_impact',
        `Prepare for possible shaking in ${locName}, and protect your head immediately.`,
        240,
        0.96,
        0.02,
      );
    } else if (lang === 'zh') {
      pushSeg('alert_header', '检测到紧急地震速报。', 200, 0.95, 0.04);
      pushSeg(
        'local_impact',
        `请做好${locName}附近可能发生摇晃的准备，立即保护好头部。`,
        240,
        0.96,
        0.02,
      );
    } else if (lang === 'ko') {
      pushSeg('alert_header', '긴급지진속보가 감지되었습니다.', 200, 0.95, 0.04);
      pushSeg(
        'local_impact',
        `현재 위치인 ${locName} 부근의 흔들림에 대비해, 즉시 머리를 보호해 주세요.`,
        240,
        0.96,
        0.02,
      );
    } else {
      pushSeg('alert_header', '緊急地震速報を検知しました。', 200, 0.95, 0.04);
      pushSeg(
        'local_impact',
        `現在地の${locName}付近での揺れに備え、直ちに頭を保護してください。`,
        240,
        0.96,
        0.02,
      );
    }
    return segments;
  }

  // Active EEW 556
  const rawHypoName = alert.earthquake?.hypocenter?.name?.trim() || '';
  const hypoName = rawHypoName ? localizeJapanesePlaceName(rawHypoName, lang) : '';
  const magText = formatSpokenMagnitude(alert.earthquake?.hypocenter?.magnitude, lang);
  const maxScale = Math.max(getEEWMaxScale(alert), impact.localMaxScale);
  const maxScaleText = maxScale > 0 ? formatSpokenIntensity(maxScale, lang) : '';

  if (lang === 'en') {
    pushSeg(
      'alert_header',
      impact.isTargeted || maxScale >= 45
        ? 'Earthquake Early Warning. Prepare for strong shaking.'
        : 'Earthquake Early Warning.',
      200,
      0.95,
      0.04,
    );

    const enPlacePhrase = hypoName
      ? /^(off |near |in |inland )/i.test(hypoName)
        ? hypoName
        : `in ${hypoName}`
      : '';
    const summary = enPlacePhrase
      ? `An earthquake has occurred ${enPlacePhrase}${magText ? `, ${magText}` : ''}${maxScaleText ? `, with a maximum predicted ${maxScaleText}` : ''}.`
      : maxScaleText
        ? `A strong earthquake is underway, with a maximum predicted ${maxScaleText}.`
        : 'A strong earthquake is underway.';
    pushSeg('quake_summary', summary, 250, 1.0, 0);

    if (impact.isTargeted) {
      const localRange = formatSpokenIntensityRange(impact.localScaleFrom, impact.localScaleTo, 'en');
      const dist =
        impact.distanceKm !== null
          ? `, about ${impact.distanceKm} kilometers from the epicenter.`
          : '.';
      pushSeg(
        'local_impact',
        `In your current location, ${locName}, strong shaking of ${localRange} is expected${dist}`,
        270,
        0.98,
        0.01,
      );
    } else {
      const dist =
        impact.distanceKm !== null
          ? ` approximately ${impact.distanceKm} kilometers from the epicenter.`
          : '.';
      pushSeg(
        'local_impact',
        `Your current location, ${locName}, is outside the primary warning zone,${dist} Please remain alert for possible shaking.`,
        270,
        0.99,
        0,
      );
    }

    if (includePreparednessAdvice) {
      if (impact.hasTsunamiRisk) {
        pushSeg(
          'tsunami_warning',
          'If you are near the coast or a river mouth, evacuate to higher ground immediately.',
          270,
          0.94,
          0.03,
        );
      }
      if (impact.isTargeted || maxScale >= 45) {
        pushSeg(
          'action_guidance',
          'Drop, take cover under a sturdy table, and protect your head from falling objects.',
          250,
          0.95,
          0.01,
        );
      } else {
        pushSeg(
          'action_guidance',
          'Step away from windows and tall shelves, and follow official updates calmly.',
          250,
          0.97,
          0,
        );
      }
      if (impact.activeLocalSpecialWarnings > 0 || impact.activeLocalWarnings > 0) {
        const warnCount = impact.activeLocalSpecialWarnings + impact.activeLocalWarnings;
        pushSeg(
          'secondary_hazard',
          `Please also note that ${warnCount} weather ${warnCount === 1 ? 'warning is' : 'warnings are'} currently active in ${locName}. Watch for landslides and secondary hazards.`,
          260,
          0.98,
          0,
        );
      }
    }
  } else if (lang === 'zh') {
    pushSeg(
      'alert_header',
      impact.isTargeted || maxScale >= 45
        ? '紧急地震速报，请立即防范强烈摇晃。'
        : '紧急地震速报。',
      200,
      0.95,
      0.04,
    );

    const summary = hypoName
      ? `${hypoName}发生地震${magText ? `，${magText}` : ''}${maxScaleText ? `，最大预测为${maxScaleText}` : ''}。`
      : maxScaleText
        ? `监测到较强地震，最大预测为${maxScaleText}。`
        : '监测到地震发生。';
    pushSeg('quake_summary', summary, 250, 1.0, 0);

    if (impact.isTargeted) {
      const localRange = formatSpokenIntensityRange(impact.localScaleFrom, impact.localScaleTo, 'zh');
      const dist = impact.distanceKm !== null ? `，距离震中约${impact.distanceKm}公里` : '';
      pushSeg(
        'local_impact',
        `您所在的${locName}，预计将出现${localRange}的强烈摇晃${dist}。`,
        270,
        0.98,
        0.01,
      );
    } else {
      const dist = impact.distanceKm !== null ? `，距离震中约${impact.distanceKm}公里` : '';
      pushSeg(
        'local_impact',
        `您所在的${locName}不在强震预警核心区内${dist}，但仍请留意可能发生的摇晃。`,
        270,
        0.99,
        0,
      );
    }

    if (includePreparednessAdvice) {
      if (impact.hasTsunamiRisk) {
        pushSeg(
          'tsunami_warning',
          '如您身处沿海或河口附近，请立即向高处或海啸避难建筑撤离。',
          270,
          0.94,
          0.03,
        );
      }
      if (impact.isTargeted || maxScale >= 45) {
        pushSeg(
          'action_guidance',
          '请立即蹲下，躲在坚固的桌子下方，并保护好头部，防范高处坠物。',
          250,
          0.95,
          0.01,
        );
      } else {
        pushSeg(
          'action_guidance',
          '请保持冷静，远离玻璃窗与高处物品，并关注官方最新通报。',
          250,
          0.97,
          0,
        );
      }
      if (impact.activeLocalSpecialWarnings > 0 || impact.activeLocalWarnings > 0) {
        const warnCount = impact.activeLocalSpecialWarnings + impact.activeLocalWarnings;
        pushSeg(
          'secondary_hazard',
          `此外，${locName}目前生效有${warnCount}项气象警报，请注意防范山体滑坡等次生灾害。`,
          260,
          0.98,
          0,
        );
      }
    }
  } else if (lang === 'ko') {
    pushSeg(
      'alert_header',
      impact.isTargeted || maxScale >= 45
        ? '긴급지진속보입니다. 강한 흔들림에 대비해 주세요.'
        : '긴급지진속보입니다.',
      200,
      0.95,
      0.04,
    );

    const summary = hypoName
      ? `${hypoName}에서 지진이 발생했습니다.${magText ? ` ${magText},` : ''}${maxScaleText ? ` 최대 예상 진도는 ${maxScaleText}입니다.` : ''}`
      : maxScaleText
        ? `최대 예상 진도는 ${maxScaleText}입니다.`
        : '지진이 발생했습니다.';
    pushSeg('quake_summary', summary, 250, 1.0, 0);

    if (impact.isTargeted) {
      const localRange = formatSpokenIntensityRange(impact.localScaleFrom, impact.localScaleTo, 'ko');
      const dist =
        impact.distanceKm !== null
          ? ` 진원까지의 거리는 약 ${impact.distanceKm}킬로미터입니다.`
          : '';
      pushSeg(
        'local_impact',
        `현재 위치인 ${locName}에서는 ${localRange}의 강한 흔들림이 예상됩니다.${dist}`,
        270,
        0.98,
        0.01,
      );
    } else {
      const dist =
        impact.distanceKm !== null
          ? ` 진원에서 약 ${impact.distanceKm}킬로미터 떨어져 있지만,`
          : '';
      pushSeg(
        'local_impact',
        `현재 위치인 ${locName}은 주요 경보 구역 밖이며,${dist} 만약을 위해 흔들림에 주의해 주세요.`,
        270,
        0.99,
        0,
      );
    }

    if (includePreparednessAdvice) {
      if (impact.hasTsunamiRisk) {
        pushSeg(
          'tsunami_warning',
          '해안이나 하천 근처에 계신 분은 즉시 높은 곳이나 쓰나미 대피 건물로 대피해 주세요.',
          270,
          0.94,
          0.03,
        );
      }
      if (impact.isTargeted || maxScale >= 45) {
        pushSeg(
          'action_guidance',
          '튼튼한 책상 아래로 몸을 피하고, 낙하물로부터 머리를 보호해 주세요.',
          250,
          0.95,
          0.01,
        );
      } else {
        pushSeg(
          'action_guidance',
          '선반과 창가에서 떨어져, 차분히 공식 정보를 확인해 주세요.',
          250,
          0.97,
          0,
        );
      }
      if (impact.activeLocalSpecialWarnings > 0 || impact.activeLocalWarnings > 0) {
        const warnCount = impact.activeLocalSpecialWarnings + impact.activeLocalWarnings;
        pushSeg(
          'secondary_hazard',
          `또한 현재 ${locName}에 기상 경보 ${warnCount}건이 발표 중이므로, 산사태 등 2차 재해에도 주의해 주세요.`,
          260,
          0.98,
          0,
        );
      }
    }
  } else {
    // Japanese (ja) — NHK-inspired crisp emergency broadcast cadence
    pushSeg(
      'alert_header',
      impact.isTargeted || maxScale >= 45
        ? '緊急地震速報です。強い揺れに警戒してください。'
        : '緊急地震速報です。',
      200,
      0.95,
      0.04,
    );

    const summary = hypoName
      ? `${hypoName}で地震が発生しました。${magText ? `${magText}、` : ''}${maxScaleText ? `最大予測震度は、${maxScaleText}です。` : ''}`
      : maxScaleText
        ? `最大予測震度は、${maxScaleText}です。`
        : '地震が発生しました。';
    pushSeg('quake_summary', summary, 250, 1.0, 0);

    if (impact.isTargeted) {
      const localRange = formatSpokenIntensityRange(impact.localScaleFrom, impact.localScaleTo, 'ja');
      const dist =
        impact.distanceKm !== null
          ? `震源までの距離は、およそ${impact.distanceKm}キロメートルです。`
          : '';
      pushSeg(
        'local_impact',
        `現在地の${locName}では、${localRange}の強い揺れが予測されています。${dist}`,
        270,
        0.98,
        0.01,
      );
    } else {
      const dist =
        impact.distanceKm !== null
          ? `震源からおよそ${impact.distanceKm}キロメートル離れていますが、`
          : '';
      pushSeg(
        'local_impact',
        `現在地の${locName}は、強い揺れの警報対象外です。${dist}念のため揺れにご注意ください。`,
        270,
        0.99,
        0,
      );
    }

    if (includePreparednessAdvice) {
      if (impact.hasTsunamiRisk) {
        pushSeg(
          'tsunami_warning',
          '沿岸部や河口付近にいる方は、揺れが収まり次第、直ちに高台や津波避難ビルへ避難してください。',
          270,
          0.94,
          0.03,
        );
      }
      if (impact.isTargeted || maxScale >= 45) {
        pushSeg(
          'action_guidance',
          '頭を守り、頑丈な机の下など安全な場所で身を守ってください。揺れが収まったら、火の元と避難経路を確認してください。',
          250,
          0.95,
          0.01,
        );
      } else {
        pushSeg(
          'action_guidance',
          '落ち着いて棚や窓際から離れ、最新の公式情報をご確認ください。',
          250,
          0.97,
          0,
        );
      }
      if (impact.activeLocalSpecialWarnings > 0 || impact.activeLocalWarnings > 0) {
        const warnCount = impact.activeLocalSpecialWarnings + impact.activeLocalWarnings;
        pushSeg(
          'secondary_hazard',
          `なお、${locName}には現在、気象警報が${warnCount}件発表されています。土砂災害などの二次災害にもご注意ください。`,
          260,
          0.98,
          0,
        );
      }
    }
  }

  return segments;
}

export function buildEewSpeechScript(
  alert: EEW556 | EEWDetection554,
  impact: LocalEewImpactAnalysis,
  lang: AppLanguage = 'ja',
  includePreparednessAdvice = true,
): string {
  const segments = buildEewSpeechSegments(alert, impact, lang, includePreparednessAdvice);
  const joiner = lang === 'en' ? ' ' : ' ';
  return segments.map((s) => s.text).join(joiner);
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

const HIGH_FLUENCY_VOICE_PATTERNS: Record<AppLanguage, RegExp[]> = {
  ja: [/nanami/i, /keita/i, /shiori/i, /google.*日本|google.*ja/i, /kyoko.*enhanced|kyoko.*premium/i, /otoya.*enhanced|otoya/i, /o-ren/i, /hattori/i, /kyoko/i, /natural|neural|online/i],
  en: [/aria.*natural|jenny.*natural|guy.*natural/i, /google us english|google uk english/i, /samantha.*enhanced|ava.*premium|allison.*enhanced|zoe.*premium/i, /siri/i, /samantha|daniel|karen/i, /natural|neural|online/i],
  zh: [/xiaoxiao|yunxi|yunyang|xiaoyi/i, /google.*普通话|google.*中文|google.*zh/i, /tingting.*enhanced|ting-ting.*enhanced|meijia.*enhanced/i, /siri/i, /tingting|ting-ting/i, /natural|neural|online/i],
  ko: [/sunhi|injoon|seo-?hyeon/i, /google.*한국|google.*ko/i, /yuna.*enhanced|sora.*enhanced/i, /siri/i, /yuna|sora/i, /natural|neural|online/i],
};

const ROBOTIC_VOICE_PATTERN = /espeak|compact|fred|zarvox|trinoids|whisper|bad news|bells|boing|bubbles|cellos|deranged|hysterical|pipe organ|albert/i;

/**
 * Scores a SpeechSynthesisVoice for fluency and language accuracy.
 * Strongly prefers Neural / Natural / Enhanced / Google / Apple studio voices over legacy robotic voices.
 */
export function scoreSpeechVoice(voice: SpeechVoiceLike, lang: AppLanguage): number {
  const targetLocale = mapAppLangToSpeechLocale(lang).toLowerCase();
  const targetPrefix = targetLocale.split('-')[0];
  const vLang = (voice.lang || '').toLowerCase().replace('_', '-');
  const vName = voice.name || '';

  let score = 0;

  // 1. Language & regional locale match
  if (vLang === targetLocale) {
    score += 100;
  } else if (vLang.startsWith(`${targetPrefix}-`) || vLang === targetPrefix) {
    score += 78;
    // Slight preference for standard broadcast variants
    if (lang === 'en' && (vLang === 'en-gb' || vLang === 'en-au')) score += 6;
    if (lang === 'zh' && (vLang === 'zh-sg' || vLang === 'zh-tw')) score += 4;
  } else {
    return -100; // Wrong language
  }

  // 2. Neural / Natural / Enhanced / Studio voice bonus
  if (/natural|neural/i.test(vName)) score += 55;
  else if (/premium|enhanced|siri/i.test(vName)) score += 48;
  else if (/google/i.test(vName)) score += 44;
  else if (/online/i.test(vName)) score += 38;

  const langPatterns = HIGH_FLUENCY_VOICE_PATTERNS[lang] ?? [];
  for (let i = 0; i < langPatterns.length; i++) {
    if (langPatterns[i].test(vName)) {
      score += Math.max(8, 30 - i * 3);
      break;
    }
  }

  // 3. Penalize known robotic / novelty voices
  if (ROBOTIC_VOICE_PATTERN.test(vName)) {
    score -= 60;
  }

  // 4. Tie-breakers
  if (voice.default) score += 4;
  if (voice.localService) score += 2;

  return score;
}

export function rankSpeechVoices<T extends SpeechVoiceLike>(
  voices: readonly T[],
  lang: AppLanguage,
): T[] {
  return voices
    .map((voice) => ({ voice, score: scoreSpeechVoice(voice, lang) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.voice);
}

export function selectBestSpeechVoice<T extends SpeechVoiceLike>(
  voices: readonly T[],
  lang: AppLanguage,
  preferredVoiceName?: string,
): T | null {
  if (!voices.length) return null;

  if (preferredVoiceName) {
    const exactPreferred = voices.find((v) => v.name === preferredVoiceName);
    if (exactPreferred && scoreSpeechVoice(exactPreferred, lang) > 0) {
      return exactPreferred;
    }
  }

  const ranked = rankSpeechVoices(voices, lang);
  if (ranked.length > 0) return ranked[0];

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

export function getAvailableSpeechVoices(lang: AppLanguage): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisSupported()) return [];
  try {
    const all = window.speechSynthesis.getVoices?.() ?? [];
    return rankSpeechVoices(all, lang);
  } catch {
    return [];
  }
}

export function subscribeSpeechVoicesChanged(listener: () => void): () => void {
  if (!isSpeechSynthesisSupported()) return () => {};
  const synth = window.speechSynthesis;
  try {
    synth.addEventListener?.('voiceschanged', listener);
    return () => {
      synth.removeEventListener?.('voiceschanged', listener);
    };
  } catch {
    return () => {};
  }
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
let activePauseTimer: number | null = null;
let activeSpeakSessionId = 0;

function clearActiveTimers(): void {
  if (typeof window === 'undefined') return;
  if (activeFallbackTimer !== null) {
    window.clearTimeout(activeFallbackTimer);
    activeFallbackTimer = null;
  }
  if (activePauseTimer !== null) {
    window.clearTimeout(activePauseTimer);
    activePauseTimer = null;
  }
}

export function stopDisasterAnnouncement(): void {
  activeSpeakSessionId += 1;
  clearActiveTimers();
  if (!isSpeechSynthesisSupported()) return;
  try {
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
    }
  } catch {
    // Ignore speech synthesis cancellation errors in restricted browsers
  }
}

export interface SpeakDisasterOptions {
  lang: AppLanguage;
  rate: number;
  pitch?: number;
  volume: number;
  preferredVoiceName?: string;
  onStart?: () => void;
  onSegmentStart?: (index: number, total: number, segment: SpeechSegment) => void;
  onEnd?: () => void;
  onError?: (reason: SpeechErrorReason) => void;
}

/**
 * Speaks structured broadcast segments sequentially with natural breathing pauses
 * and role-based prosody tuning, preventing Chrome's long-utterance cutoff bug.
 */
export function speakDisasterSegments(
  segments: readonly SpeechSegment[],
  options: SpeakDisasterOptions,
): boolean {
  const validSegments = segments.filter((s) => s.text.trim().length > 0);
  if (validSegments.length === 0) return false;
  if (!isSpeechSynthesisSupported()) {
    options.onError?.('unsupported');
    return false;
  }

  stopDisasterAnnouncement();
  const sessionId = activeSpeakSessionId;

  let finished = false;
  const finalize = (errReason: SpeechErrorReason | null = null) => {
    if (finished || sessionId !== activeSpeakSessionId) return;
    finished = true;
    clearActiveTimers();
    if (errReason) options.onError?.(errReason);
    options.onEnd?.();
  };

  const baseRate = clampSpeechRate(options.rate);
  const basePitch = clampSpeechPitch(options.pitch ?? DEFAULT_EEW_SPEECH_SETTINGS.pitch);
  const baseVolume = clampSpeechVolume(options.volume);
  const locale = mapAppLangToSpeechLocale(options.lang);

  const voices = window.speechSynthesis.getVoices?.() ?? [];
  const selectedVoice = selectBestSpeechVoice(voices, options.lang, options.preferredVoiceName);

  const speakSegmentAt = (index: number, allowCustomVoice = true) => {
    if (finished || sessionId !== activeSpeakSessionId) return;
    if (index >= validSegments.length) {
      finalize(null);
      return;
    }

    const segment = validSegments[index];
    const startUtterance = () => {
      if (finished || sessionId !== activeSpeakSessionId) return;
      try {
        const utterance = new SpeechSynthesisUtterance(segment.text);
        utterance.lang = locale;
        utterance.rate = Math.round(Math.max(0.75, Math.min(1.5, baseRate * segment.rateMultiplier)) * 100) / 100;
        utterance.pitch = Math.round(Math.max(0.8, Math.min(1.25, basePitch + segment.pitchOffset)) * 100) / 100;
        utterance.volume = baseVolume;

        let appliedVoice = false;
        if (allowCustomVoice && selectedVoice) {
          try {
            utterance.voice = selectedVoice;
            appliedVoice = true;
          } catch {
            // Some browsers/polyfills reject custom voice objects; rely on utterance.lang
          }
        }

        let retriedWithoutVoice = false;
        utterance.onstart = () => {
          if (sessionId === activeSpeakSessionId) {
            options.onSegmentStart?.(index, validSegments.length, segment);
          }
        };
        utterance.onend = () => {
          if (sessionId !== activeSpeakSessionId) return;
          speakSegmentAt(index + 1, allowCustomVoice);
        };
        utterance.onerror = (ev) => {
          if (sessionId !== activeSpeakSessionId) return;
          const errCode = (ev as SpeechSynthesisErrorEvent | undefined)?.error ?? '';
          if (
            appliedVoice &&
            !retriedWithoutVoice &&
            (errCode === 'voice-unavailable' || errCode === 'language-unavailable')
          ) {
            retriedWithoutVoice = true;
            speakSegmentAt(index, false);
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
      } catch {
        finalize('synthesis-unavailable');
      }
    };

    if (index > 0 && segment.pauseBeforeMs > 0) {
      activePauseTimer = window.setTimeout(() => {
        activePauseTimer = null;
        startUtterance();
      }, segment.pauseBeforeMs);
    } else {
      startUtterance();
    }
  };

  try {
    // Notify listeners immediately so BGM ducks before the first syllable
    options.onStart?.();

    // Safety guard so BGM never remains stuck ducked if a browser drops onend
    const totalChars = validSegments.reduce((sum, s) => sum + s.text.length, 0);
    const totalPauses = validSegments.reduce((sum, s) => sum + s.pauseBeforeMs, 0);
    const estimatedMs = Math.max(
      6_000,
      Math.min(45_000, Math.round((totalChars * 175) / baseRate) + totalPauses + 4_500),
    );
    activeFallbackTimer = window.setTimeout(() => finalize(null), estimatedMs);

    speakSegmentAt(0, true);
    return true;
  } catch {
    finalize('synthesis-unavailable');
    return false;
  }
}

export function speakDisasterAnnouncement(
  text: string,
  options: SpeakDisasterOptions,
): boolean {
  const cleaned = text.trim();
  if (!cleaned) return false;
  const rawParts = cleaned
    .split(/(?<=[。.!?！？])\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const segments: SpeechSegment[] = (rawParts.length > 0 ? rawParts : [cleaned]).map((part, idx) => ({
    role: idx === 0 ? 'alert_header' : 'local_impact',
    text: part,
    pauseBeforeMs: idx === 0 ? 0 : 220,
    rateMultiplier: idx === 0 ? 0.96 : 1.0,
    pitchOffset: idx === 0 ? 0.02 : 0,
  }));
  return speakDisasterSegments(segments, options);
}
