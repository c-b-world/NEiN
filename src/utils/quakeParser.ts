import { formatP2PAreaLabel, resolveP2PAreaInfo } from '../data/p2pAreaCodes';
import type {
  EEW556,
  EEWDetection554,
  JMAQuake551,
  JMATsunami552,
  P2PQuakeRecord,
  QuakeFilter,
  QuakePoint,
  ScalePresentation,
  TestEEWPreset,
} from '../types/quake';
import type { AppLanguage } from './i18n';

export const HISTORY_PAGE_LIMIT = 100;
export const INITIAL_HISTORY_PAGES = 3; // 300 records on initial load
export const POLL_HISTORY_LIMIT = 50;
export const MAX_HISTORY_RECORDS = 1000;

export const REQUESTED_API_URL =
  'https://api.p2pquake.net/v2/history?codes=551,552,554,556,561&limit=100&offset=0';

export const P2PQUAKE_WS_URL = 'wss://api.p2pquake.net/v2/ws';

export function buildHistoryApiUrl(limit = HISTORY_PAGE_LIMIT, offset = 0): string {
  return normalizeP2PQuakeUrl(
    `https://api.p2pquake.net/v2/history?codes=551,552,554,556,561&limit=${limit}&offset=${offset}`,
  );
}

/**
 * P2PQuake v2 /history requires repeated `codes=` query parameters (OpenAPI array),
 * whereas comma-separated `codes=551,552,...` yields HTTP 400.
 * This helper normalizes the requested API URL so it executes cleanly against P2PQuake.
 */
export function normalizeP2PQuakeUrl(rawUrl: string): string {
  const url = new URL(rawUrl);
  const codesParam = url.searchParams.getAll('codes');
  if (codesParam.length === 1 && codesParam[0].includes(',')) {
    const splitCodes = codesParam[0]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    url.searchParams.delete('codes');
    for (const code of splitCodes) {
      url.searchParams.append('codes', code);
    }
  }
  return url.toString();
}

function localizeScaleText(scale: number, lang: AppLanguage): { short: string; label: string } {
  const isEn = lang === 'en';
  const isKo = lang === 'ko';
  const prefix = isEn ? 'Intensity ' : isKo ? '진도 ' : '震度';
  switch (scale) {
    case 10:
      return { short: '1', label: `${prefix}1` };
    case 20:
      return { short: '2', label: `${prefix}2` };
    case 30:
      return { short: '3', label: `${prefix}3` };
    case 40:
      return { short: '4', label: `${prefix}4` };
    case 45:
      return {
        short: isEn ? '5-' : isKo ? '5약' : '5弱',
        label: isEn ? 'Intensity 5-Lower' : isKo ? '진도 5약' : lang === 'zh' ? '震度5弱' : '震度5弱',
      };
    case 50:
      return {
        short: isEn ? '5+' : isKo ? '5강' : '5強',
        label: isEn ? 'Intensity 5-Upper' : isKo ? '진도 5강' : lang === 'zh' ? '震度5强' : '震度5強',
      };
    case 55:
      return {
        short: isEn ? '6-' : isKo ? '6약' : '6弱',
        label: isEn ? 'Intensity 6-Lower' : isKo ? '진도 6약' : lang === 'zh' ? '震度6弱' : '震度6弱',
      };
    case 60:
      return {
        short: isEn ? '6+' : isKo ? '6강' : '6強',
        label: isEn ? 'Intensity 6-Upper' : isKo ? '진도 6강' : lang === 'zh' ? '震度6强' : '震度6強',
      };
    case 70:
      return { short: '7', label: `${prefix}7` };
    default:
      return {
        short: '-',
        label: isEn ? 'Unknown' : isKo ? '진도 불명' : lang === 'zh' ? '震度不明' : '震度不明',
      };
  }
}

export function getScalePresentation(scale: number, lang: AppLanguage = 'ja'): ScalePresentation {
  const { short, label } = localizeScaleText(scale, lang);
  switch (scale) {
    case 10:
      return {
        short,
        label,
        bgClass: 'bg-slate-800',
        textClass: 'text-slate-200',
        borderClass: 'border-slate-700',
        severity: 1,
      };
    case 20:
      return {
        short,
        label,
        bgClass: 'bg-sky-950',
        textClass: 'text-sky-200',
        borderClass: 'border-sky-800',
        severity: 2,
      };
    case 30:
      return {
        short,
        label,
        bgClass: 'bg-emerald-950',
        textClass: 'text-emerald-200',
        borderClass: 'border-emerald-800',
        severity: 3,
      };
    case 40:
      return {
        short,
        label,
        bgClass: 'bg-amber-950',
        textClass: 'text-amber-200',
        borderClass: 'border-amber-700',
        severity: 4,
      };
    case 45:
      return {
        short,
        label,
        bgClass: 'bg-orange-950',
        textClass: 'text-orange-200',
        borderClass: 'border-orange-700',
        severity: 5,
      };
    case 50:
      return {
        short,
        label,
        bgClass: 'bg-orange-900',
        textClass: 'text-orange-100',
        borderClass: 'border-orange-600',
        severity: 6,
      };
    case 55:
      return {
        short,
        label,
        bgClass: 'bg-red-950',
        textClass: 'text-red-200',
        borderClass: 'border-red-700',
        severity: 7,
      };
    case 60:
      return {
        short,
        label,
        bgClass: 'bg-red-900',
        textClass: 'text-red-100',
        borderClass: 'border-red-600',
        severity: 8,
      };
    case 70:
      return {
        short,
        label,
        bgClass: 'bg-fuchsia-950',
        textClass: 'text-fuchsia-100',
        borderClass: 'border-fuchsia-600',
        severity: 9,
      };
    default:
      return {
        short,
        label,
        bgClass: 'bg-slate-900',
        textClass: 'text-slate-400',
        borderClass: 'border-slate-800',
        severity: 0,
      };
  }
}

export function formatScaleRange(scaleFrom: number, scaleTo: number, lang: AppLanguage = 'ja'): string {
  const from = getScalePresentation(scaleFrom, lang).label;
  if (scaleTo === 99) {
    if (lang === 'en') return `${from} or higher`;
    if (lang === 'zh') return `${from}左右或以上`;
    if (lang === 'ko') return `${from} 이상`;
    return `${from}程度以上`;
  }
  if (scaleTo <= 0 || scaleTo === scaleFrom) {
    return from;
  }
  const to = getScalePresentation(scaleTo, lang).label;
  return `${from}〜${to}`;
}

export function translateTsunamiStatus(code?: string, lang: AppLanguage = 'ja'): string {
  if (lang === 'en') {
    switch (code) {
      case 'None': return 'No tsunami risk from this earthquake';
      case 'Unknown':
      case 'Checking': return 'Tsunami risk under investigation';
      case 'NonEffective': return 'Minor sea-level fluctuations possible; no damage expected';
      case 'Watch': return 'Tsunami Advisory is currently in effect';
      case 'Warning': return 'Tsunami Warning is currently in effect';
      default: return 'No tsunami data';
    }
  }
  if (lang === 'zh') {
    switch (code) {
      case 'None': return '本次地震无需担心海啸风险';
      case 'Unknown':
      case 'Checking': return '正在调查是否存在海啸风险';
      case 'NonEffective': return '可能出现轻微海面波动，无灾害风险';
      case 'Watch': return '海啸注意报正在生效中';
      case 'Warning': return '海啸警报正在生效中';
      default: return '暂无海啸信息';
    }
  }
  if (lang === 'ko') {
    switch (code) {
      case 'None': return '이 지진으로 인한 쓰나미 우려는 없습니다';
      case 'Unknown':
      case 'Checking': return '쓰나미 발생 여부를 조사 중입니다';
      case 'NonEffective': return '약간의 해면 변동 가능성이 있으나 피해 우려는 없습니다';
      case 'Watch': return '쓰나미 주의보가 발령되어 있습니다';
      case 'Warning': return '쓰나미 경보 등이 발령되어 있습니다';
      default: return '쓰나미 정보 없음';
    }
  }
  switch (code) {
    case 'None':
      return 'この地震による津波の心配はありません';
    case 'Unknown':
      return '津波の有無は調査中です';
    case 'Checking':
      return '津波の有無を調査中です';
    case 'NonEffective':
      return '若干の海面変動の可能性がありますが被害の心配はありません';
    case 'Watch':
      return '津波注意報が発表されています';
    case 'Warning':
      return '津波警報等が発表されています';
    default:
      return '津波情報なし';
  }
}

export function translateTsunamiShort(code?: string, lang: AppLanguage = 'ja'): string {
  if (lang === 'en') {
    switch (code) {
      case 'None': return 'No Tsunami';
      case 'Unknown':
      case 'Checking': return 'Checking';
      case 'NonEffective': return 'Minor Ripple';
      case 'Watch': return 'Advisory';
      case 'Warning': return 'Warning';
      default: return 'No Data';
    }
  }
  if (lang === 'zh') {
    switch (code) {
      case 'None': return '无海啸风险';
      case 'Unknown':
      case 'Checking': return '调查中';
      case 'NonEffective': return '轻微海面波动';
      case 'Watch': return '海啸注意报';
      case 'Warning': return '海啸警报';
      default: return '无信息';
    }
  }
  if (lang === 'ko') {
    switch (code) {
      case 'None': return '쓰나미 없음';
      case 'Unknown':
      case 'Checking': return '조사 중';
      case 'NonEffective': return '약한 해면 변동';
      case 'Watch': return '쓰나미 주의보';
      case 'Warning': return '쓰나미 경보';
      default: return '정보 없음';
    }
  }
  switch (code) {
    case 'None':
      return '津波の心配なし';
    case 'Unknown':
    case 'Checking':
      return '調査中';
    case 'NonEffective':
      return '若干の海面変動';
    case 'Watch':
      return '津波注意報';
    case 'Warning':
      return '津波警報等';
    default:
      return '情報なし';
  }
}

export function translateIssueType(type?: string, lang: AppLanguage = 'ja'): string {
  if (lang === 'en') {
    switch (type) {
      case 'ScalePrompt': return 'Intensity Prompt';
      case 'Destination': return 'Hypocenter Report';
      case 'ScaleAndDestination': return 'Hypocenter & Intensity';
      case 'DetailScale': return 'Detailed Intensity Report';
      case 'Foreign': return 'Distant Earthquake Info';
      case 'Focus': return 'Tsunami Forecast';
      default: return 'Earthquake Bulletin';
    }
  }
  if (lang === 'zh') {
    switch (type) {
      case 'ScalePrompt': return '震度速报';
      case 'Destination': return '震源信息';
      case 'ScaleAndDestination': return '震源与震度信息';
      case 'DetailScale': return '各地详细震度信息';
      case 'Foreign': return '远地地震信息';
      case 'Focus': return '海啸预报';
      default: return '地震・防灾信息';
    }
  }
  if (lang === 'ko') {
    switch (type) {
      case 'ScalePrompt': return '진도 속보';
      case 'Destination': return '진원 정보';
      case 'ScaleAndDestination': return '진원・진도 정보';
      case 'DetailScale': return '각지 상세 진도 정보';
      case 'Foreign': return '원거리 지진 정보';
      case 'Focus': return '쓰나미 예보';
      default: return '지진・방재 정보';
    }
  }
  switch (type) {
    case 'ScalePrompt':
      return '震度速報';
    case 'Destination':
      return '震源に関する情報';
    case 'ScaleAndDestination':
      return '震源・震度に関する情報';
    case 'DetailScale':
      return '各地の震度に関する情報';
    case 'Foreign':
      return '遠地地震に関する情報';
    case 'Focus':
      return '津波予報';
    default:
      return '地震・防災情報';
  }
}

export function translateTsunamiGrade(grade: string, lang: AppLanguage = 'ja'): string {
  if (lang === 'en') {
    switch (grade) {
      case 'MajorWarning': return 'Major Tsunami Warning';
      case 'Warning': return 'Tsunami Warning';
      case 'Watch': return 'Tsunami Advisory';
      default: return 'Tsunami Forecast';
    }
  }
  if (lang === 'zh') {
    switch (grade) {
      case 'MajorWarning': return '大海啸警报';
      case 'Warning': return '海啸警报';
      case 'Watch': return '海啸注意报';
      default: return '海啸预报';
    }
  }
  if (lang === 'ko') {
    switch (grade) {
      case 'MajorWarning': return '대쓰나미 경보';
      case 'Warning': return '쓰나미 경보';
      case 'Watch': return '쓰나미 주의보';
      default: return '쓰나미 예보';
    }
  }
  switch (grade) {
    case 'MajorWarning':
      return '大津波警報';
    case 'Warning':
      return '津波警報';
    case 'Watch':
      return '津波注意報';
    default:
      return '津波予報';
  }
}

export function formatDepth(depth?: number, lang: AppLanguage = 'ja'): string {
  if (depth === undefined || depth === null || depth < 0) {
    if (lang === 'en') return 'Unknown';
    if (lang === 'ko') return '불명';
    return '不明';
  }
  if (depth === 0) {
    if (lang === 'en') return 'Very Shallow';
    if (lang === 'zh') return '极浅';
    if (lang === 'ko') return '매우 얕음';
    return 'ごく浅い';
  }
  if (lang === 'en') return `~${depth}km`;
  if (lang === 'zh') return `约${depth}km`;
  if (lang === 'ko') return `약 ${depth}km`;
  return `約${depth}km`;
}

export function formatMagnitude(magnitude?: number, lang: AppLanguage = 'ja'): string {
  if (magnitude === undefined || magnitude === null || magnitude < 0) {
    if (lang === 'en') return 'M Unknown';
    if (lang === 'ko') return 'M 불명';
    return 'M不明';
  }
  return `M${magnitude.toFixed(1)}`;
}

export function formatTimestamp(raw?: string): string {
  if (!raw) return '--';
  // P2PQuake uses "2026/11/25 08:40:00" or "2026/11/25 08:44:35.416"
  return raw.split('.')[0];
}

export function formatShortTime(raw?: string): string {
  if (!raw) return '--:--';
  const cleaned = raw.split('.')[0];
  const parts = cleaned.split(' ');
  if (parts.length === 2) {
    const dateParts = parts[0].split('/');
    const timeParts = parts[1].split(':');
    if (dateParts.length === 3 && timeParts.length >= 2) {
      return `${dateParts[1]}/${dateParts[2]} ${timeParts[0]}:${timeParts[1]}`;
    }
  }
  return cleaned;
}

export function getRecordTitle(record: P2PQuakeRecord, lang: AppLanguage = 'ja'): string {
  switch (record.code) {
    case 551:
      return record.earthquake.hypocenter.name || translateIssueType(record.issue.type, lang);
    case 552:
      if (record.cancelled) {
        if (lang === 'en') return 'Tsunami Forecast Cancelled';
        if (lang === 'zh') return '海啸预报 解除';
        if (lang === 'ko') return '쓰나미 예보 해제';
        return '津波予報 解除';
      }
      if (record.areas?.length) {
        const prefix =
          lang === 'en' ? 'Tsunami Forecast' : lang === 'zh' ? '海啸预报' : lang === 'ko' ? '쓰나미 예보' : '津波予報';
        return `${prefix} (${record.areas.map((a) => a.name).slice(0, 2).join('・')})`;
      }
      return lang === 'en' ? 'Tsunami Forecast' : lang === 'zh' ? '海啸预报' : lang === 'ko' ? '쓰나미 예보' : '津波予報';
    case 554:
      if (lang === 'en') return 'EEW Broadcast Detected';
      if (lang === 'zh') return '紧急地震速报（发布检测）';
      if (lang === 'ko') return '긴급지진속보 (발표 감지)';
      return '緊急地震速報（発表検出）';
    case 556: {
      if (record.cancelled) {
        if (lang === 'en') return 'EEW Cancelled';
        if (lang === 'zh') return '紧急地震速报（取消）';
        if (lang === 'ko') return '긴급지진속보 (취소)';
        return '緊急地震速報（取消）';
      }
      const hypo = record.earthquake?.hypocenter.name;
      if (lang === 'en') return hypo ? `EEW · ${hypo}` : 'Earthquake Early Warning';
      if (lang === 'zh') return hypo ? `紧急地震速报・${hypo}` : '紧急地震速报（警报）';
      if (lang === 'ko') return hypo ? `긴급지진속보・${hypo}` : '긴급지진속보 (경보)';
      return hypo ? `緊急地震速報・${hypo}` : '緊急地震速報（警報）';
    }
    case 561: {
      const areaLabel = formatP2PAreaLabel(record.area, lang);
      if (lang === 'en') return `Felt Report (${areaLabel})`;
      if (lang === 'zh') return `地震体感信息（${areaLabel}）`;
      if (lang === 'ko') return `지진 체감 정보 (${areaLabel})`;
      return `地震感知情報（${areaLabel}）`;
    }
  }
}

export function getRecordCategoryLabel(record: P2PQuakeRecord, lang: AppLanguage = 'ja'): string {
  switch (record.code) {
    case 551:
      return translateIssueType(record.issue.type, lang);
    case 552:
      if (lang === 'en') return 'Tsunami Forecast';
      if (lang === 'zh') return '海啸预报';
      if (lang === 'ko') return '쓰나미 예보';
      return '津波予報';
    case 554:
      if (lang === 'en') return 'EEW Detection';
      if (lang === 'zh') return '紧急地震速报 检测';
      if (lang === 'ko') return '긴급지진속보 감지';
      return '緊急地震速報 検出';
    case 556:
      if (lang === 'en') return record.cancelled ? 'EEW Cancelled' : 'EEW Warning';
      if (lang === 'zh') return record.cancelled ? '紧急地震速报 取消' : '紧急地震速报 警报';
      if (lang === 'ko') return record.cancelled ? '긴급지진속보 취소' : '긴급지진속보 경보';
      return record.cancelled ? '緊急地震速報 取消' : '緊急地震速報 警報';
    case 561:
      if (lang === 'en') return 'Felt Shaking Report';
      if (lang === 'zh') return '地震体感信息';
      if (lang === 'ko') return '지진 체감 정보';
      return '地震感知情報';
  }
}

export function getRecordCoordinates(
  record: P2PQuakeRecord
): { latitude: number; longitude: number } | null {
  if (record.code === 551) {
    const { latitude, longitude } = record.earthquake.hypocenter;
    if (latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180 && (latitude !== -200 && longitude !== -200)) {
      return { latitude, longitude };
    }
  }
  if (record.code === 556 && record.earthquake?.hypocenter) {
    const { latitude, longitude } = record.earthquake.hypocenter;
    if (latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180 && (latitude !== -200 && longitude !== -200)) {
      return { latitude, longitude };
    }
  }
  return null;
}

export function matchesFilter(record: P2PQuakeRecord, filter: QuakeFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'quake') return record.code === 551;
  if (filter === 'eew') return record.code === 554 || record.code === 556;
  return record.code === 552 || record.code === 561;
}

export function groupPointsByPrefAndScale(points?: QuakePoint[]): Array<{
  scale: number;
  scaleLabel: string;
  prefectures: Array<{ pref: string; addrs: string[] }>;
}> {
  if (!points || points.length === 0) return [];
  const scaleMap = new Map<number, Map<string, string[]>>();

  for (const pt of points) {
    if (!scaleMap.has(pt.scale)) {
      scaleMap.set(pt.scale, new Map());
    }
    const prefMap = scaleMap.get(pt.scale)!;
    if (!prefMap.has(pt.pref)) {
      prefMap.set(pt.pref, []);
    }
    const list = prefMap.get(pt.pref)!;
    if (!list.includes(pt.addr)) {
      list.push(pt.addr);
    }
  }

  return Array.from(scaleMap.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([scale, prefMap]) => ({
      scale,
      scaleLabel: getScalePresentation(scale).label,
      prefectures: Array.from(prefMap.entries()).map(([pref, addrs]) => ({
        pref,
        addrs,
      })),
    }));
}

const PREFECTURE_PREFIX_PATTERN =
  '^(?:北海道|青森|岩手|宮城|秋田|山形|福島|茨城|栃木|群馬|埼玉|千葉|東京|神奈川|新潟|富山|石川|福井|山梨|長野|岐阜|静岡|愛知|三重|滋賀|京都|大阪|兵庫|奈良|和歌山|鳥取|島根|岡山|広島|山口|徳島|香川|愛媛|高知|福岡|佐賀|長崎|熊本|大分|宮崎|鹿児島|沖縄)?';

const COMPOUND_MUNICIPALITY_REGEX = new RegExp(
  `${PREFECTURE_PREFIX_PATTERN}(四日市市|廿日市市|野々市市|東村山市|武蔵村山市|市川三郷町|十日町市|市原市|市川市|市川町|市貝町|大町市|大町町|町田市|田村市|大村市|羽村市|村上市|村山市|村田町|玉村町)`
);

export function extractMunicipalityName(addr: string, isArea = false): string {
  const trimmed = addr.trim();
  if (!trimmed || isArea) return trimmed;

  const compoundMatch = trimmed.match(COMPOUND_MUNICIPALITY_REGEX);
  if (compoundMatch) {
    return compoundMatch[0];
  }

  const match = trimmed.match(/^(.+?[市区町村])/);
  return match ? match[1] : trimmed;
}

export function groupMunicipalitiesByPrefAndScale(points?: QuakePoint[]): Array<{
  scale: number;
  scaleLabel: string;
  prefectures: Array<{ pref: string; cities: string[] }>;
}> {
  if (!points || points.length === 0) return [];
  const scaleMap = new Map<number, Map<string, string[]>>();

  for (const pt of points) {
    if (!scaleMap.has(pt.scale)) {
      scaleMap.set(pt.scale, new Map());
    }
    const prefMap = scaleMap.get(pt.scale)!;
    if (!prefMap.has(pt.pref)) {
      prefMap.set(pt.pref, []);
    }
    const list = prefMap.get(pt.pref)!;
    const city = extractMunicipalityName(pt.addr, pt.isArea);
    if (city && !list.includes(city)) {
      list.push(city);
    }
  }

  return Array.from(scaleMap.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([scale, prefMap]) => ({
      scale,
      scaleLabel: getScalePresentation(scale).label,
      prefectures: Array.from(prefMap.entries()).map(([pref, cities]) => ({
        pref,
        cities,
      })),
    }));
}

export function formatQuakeForClipboard(
  record: P2PQuakeRecord,
  lang: AppLanguage = 'ja'
): string {
  const testPrefix = record.isTest
    ? lang === 'en'
      ? '[TEST] '
      : lang === 'zh'
      ? '【测试演练】'
      : lang === 'ko'
      ? '[테스트] '
      : '【テスト配信】'
    : '';

  if (record.code === 551) {
    const eq = record.earthquake;
    const maxScale = getScalePresentation(eq.maxScale, lang).label;
    const lines =
      lang === 'en'
        ? [
            `${testPrefix}[Earthquake Info] ${translateIssueType(record.issue.type, lang)}`,
            `Occurred: ${formatTimestamp(eq.time)}`,
            `Epicenter: ${eq.hypocenter.name || 'Investigating'}`,
            `Max Intensity: ${maxScale}`,
            `Magnitude: ${formatMagnitude(eq.hypocenter.magnitude, lang)}`,
            `Depth: ${formatDepth(eq.hypocenter.depth, lang)}`,
            `Tsunami: ${translateTsunamiStatus(eq.domesticTsunami, lang)}`,
          ]
        : [
            `${testPrefix}【地震情報】${translateIssueType(record.issue.type, lang)}`,
            `発生時刻：${formatTimestamp(eq.time)}`,
            `震源地：${eq.hypocenter.name || '調査中'}`,
            `最大震度：${maxScale}`,
            `規模：${formatMagnitude(eq.hypocenter.magnitude, lang)}`,
            `深さ：${formatDepth(eq.hypocenter.depth, lang)}`,
            `津波：${translateTsunamiStatus(eq.domesticTsunami, lang)}`,
          ];

    const grouped = groupMunicipalitiesByPrefAndScale(record.points);
    if (grouped.length > 0) {
      lines.push('', lang === 'en' ? '■ Observed Intensities' : '■ 各地の震度');
      grouped.forEach((group, groupIndex) => {
        if (groupIndex > 0) {
          lines.push('');
        }
        const localizedGroupScale = getScalePresentation(group.scale, lang).label;
        lines.push(`〔${localizedGroupScale}〕`);
        for (const p of group.prefectures) {
          lines.push(`█ ${p.pref}`);
          lines.push(p.cities.join('　'));
        }
      });
    }

    if (record.comments?.freeFormComment) {
      lines.push('', `${lang === 'en' ? 'Notes: ' : '備考：'}${record.comments.freeFormComment}`);
    }
    lines.push('', lang === 'en' ? 'Source: NEiN (P2PQuake)' : '情報提供：NEiN (P2P地震情報)');
    return lines.join('\n');
  }

  if (record.code === 556) {
    if (record.cancelled) {
      if (lang === 'en') {
        return [
          `${testPrefix}[EEW Cancelled]`,
          `Issued: ${formatTimestamp(record.issue.time)}`,
          `Report #${record.issue.serial}: The previous Earthquake Early Warning has been cancelled.`,
          '',
          'Source: NEiN (P2PQuake)',
        ].join('\n');
      }
      return [
        `${testPrefix}【緊急地震速報（取消）】`,
        `発表時刻：${formatTimestamp(record.issue.time)}`,
        `第${record.issue.serial}報：先ほどの緊急地震速報は取り消されました。`,
        '',
        '情報提供：NEiN (P2P地震情報)',
      ].join('\n');
    }

    const eq = record.earthquake;
    const maxAreaScale = record.areas?.length
      ? Math.max(...record.areas.map((a) => a.scaleFrom))
      : -1;
    const lines =
      lang === 'en'
        ? [
            `${testPrefix}[EEW Warning] Report #${record.issue.serial}`,
            `Issued: ${formatTimestamp(record.issue.time)}`,
            `Epicenter: ${eq?.hypocenter.name || 'Analyzing'}`,
            `Magnitude: ${formatMagnitude(eq?.hypocenter.magnitude, lang)} / Depth: ${formatDepth(eq?.hypocenter.depth, lang)}`,
            maxAreaScale > 0
              ? `Predicted Max Intensity: ${getScalePresentation(maxAreaScale, lang).label} or higher`
              : 'Prepare for strong shaking',
          ]
        : [
            `${testPrefix}【緊急地震速報（警報）】第${record.issue.serial}報`,
            `発表時刻：${formatTimestamp(record.issue.time)}`,
            `震源地：${eq?.hypocenter.name || '解析中'}`,
            `規模：${formatMagnitude(eq?.hypocenter.magnitude, lang)} / 深さ：${formatDepth(eq?.hypocenter.depth, lang)}`,
            maxAreaScale > 0
              ? `予想最大震度：${getScalePresentation(maxAreaScale, lang).label}程度以上`
              : '強い揺れに警戒してください',
          ];
    if (record.areas && record.areas.length > 0) {
      lines.push(
        `${lang === 'en' ? 'Target Areas: ' : '警報対象地域：'}${record.areas.map((a) => a.name).join('・')}`
      );
    }
    lines.push('', lang === 'en' ? 'Source: NEiN (P2PQuake)' : '情報提供：NEiN (P2P地震情報)');
    return lines.join('\n');
  }

  if (record.code === 554) {
    if (lang === 'en') {
      return [
        `${testPrefix}[EEW Broadcast Detected]`,
        `Detected: ${formatTimestamp(record.time)}`,
        `Type: ${record.type}`,
        'Prepare for possible strong shaking and protect yourself.',
        '',
        'Source: NEiN (P2PQuake)',
      ].join('\n');
    }
    return [
      `${testPrefix}【緊急地震速報（発表検出）】`,
      `検出時刻：${formatTimestamp(record.time)}`,
      `種別：${record.type}`,
      '強い揺れに備えて周囲の安全を確認してください。',
      '',
      '情報提供：NEiN (P2P地震情報)',
    ].join('\n');
  }

  if (record.code === 552) {
    if (lang === 'en') {
      return [
        `${testPrefix}[Tsunami Forecast]`,
        `Issued: ${formatTimestamp(record.issue.time)}`,
        record.cancelled
          ? 'All tsunami forecasts have been lifted.'
          : `Target Areas: ${record.areas?.map((a) => `${a.name} (${translateTsunamiGrade(a.grade, lang)})`).join(' / ') || 'Checking'}`,
        '',
        'Source: NEiN (P2PQuake)',
      ].join('\n');
    }
    const lines = [
      `${testPrefix}【津波予報】`,
      `発表時刻：${formatTimestamp(record.issue.time)}`,
      record.cancelled
        ? '津波予報はすべて解除されました。'
        : `対象地域：${record.areas?.map((a) => `${a.name}（${translateTsunamiGrade(a.grade, lang)}）`).join('・') || '確認中'}`,
      '',
      '情報提供：NEiN (P2P地震情報)',
    ];
    return lines.join('\n');
  }

  const resolvedArea = formatP2PAreaLabel(record.area, lang);
  if (lang === 'en') {
    return [
      `${testPrefix}[Felt Shaking Report]`,
      `Received: ${formatTimestamp(record.time)}`,
      `Region: ${resolvedArea} (Code ${record.area})`,
      '',
      'Source: NEiN (P2PQuake)',
    ].join('\n');
  }
  return [
    `${testPrefix}【地震感知情報】`,
    `受信時刻：${formatTimestamp(record.time)}`,
    `地方 / 地域：${resolvedArea}（コード ${record.area}）`,
    '',
    '情報提供：NEiN (P2P地震情報)',
  ].join('\n');
}

export function isEEWRecord(record: P2PQuakeRecord): record is EEW556 | EEWDetection554 {
  return record.code === 556 || record.code === 554;
}

export function getEEWMaxScale(record: EEW556): number {
  if (!record.areas || record.areas.length === 0) return -1;
  return Math.max(...record.areas.map((a) => a.scaleFrom));
}

export function resolveRecordId(raw: unknown, fallbackIndex = 0): string {
  const rec = raw as Record<string, unknown> | null;
  if (!rec || typeof rec !== 'object') {
    return `rec-${fallbackIndex}`;
  }

  if (typeof rec.id === 'string' && rec.id.trim().length > 0) {
    return rec.id.trim();
  }

  const underscoreId = rec._id;
  if (typeof underscoreId === 'string' && underscoreId.trim().length > 0) {
    return underscoreId.trim();
  }
  if (
    underscoreId &&
    typeof underscoreId === 'object' &&
    '$oid' in underscoreId &&
    typeof (underscoreId as { $oid?: unknown }).$oid === 'string'
  ) {
    const oid = (underscoreId as { $oid: string }).$oid.trim();
    if (oid.length > 0) return oid;
  }

  const code = typeof rec.code === 'number' ? rec.code : 'rec';
  const time = typeof rec.time === 'string' ? rec.time : 'notime';
  const uid = typeof rec.uid === 'string' ? rec.uid : '';
  const area = typeof rec.area === 'number' ? String(rec.area) : '';
  const issueTime =
    rec.issue && typeof rec.issue === 'object' && 'time' in rec.issue
      ? String((rec.issue as { time?: unknown }).time ?? '')
      : '';
  const hypoName =
    rec.earthquake &&
    typeof rec.earthquake === 'object' &&
    'hypocenter' in rec.earthquake &&
    rec.earthquake.hypocenter &&
    typeof rec.earthquake.hypocenter === 'object' &&
    'name' in rec.earthquake.hypocenter
      ? String((rec.earthquake.hypocenter as { name?: unknown }).name ?? '')
      : '';

  return `${code}-${time}-${uid || area || hypoName || issueTime || fallbackIndex}`;
}

export function normalizeQuakeRecord(
  raw: P2PQuakeRecord,
  fallbackIndex = 0
): P2PQuakeRecord {
  const id = resolveRecordId(raw, fallbackIndex);
  if (raw.id === id) return raw;
  return { ...raw, id };
}

export function mergeQuakeRecords(
  incoming: P2PQuakeRecord[],
  existing: P2PQuakeRecord[],
  limit = MAX_HISTORY_RECORDS
): P2PQuakeRecord[] {
  const testRecords = existing.filter((r) => r.isTest);
  const byId = new Map<string, P2PQuakeRecord>();

  const combined = [...testRecords, ...incoming, ...existing];
  combined.forEach((rawItem, index) => {
    const item = normalizeQuakeRecord(rawItem, index);
    if (!byId.has(item.id)) {
      byId.set(item.id, item);
    }
  });

  return Array.from(byId.values())
    .sort((a, b) => (b.time || '').localeCompare(a.time || ''))
    .slice(0, limit);
}

export interface QuakeSearchCriteria {
  filter: QuakeFilter;
  searchQuery: string;
  dateFrom: string; // YYYY-MM-DD or ''
  dateTo: string;   // YYYY-MM-DD or ''
  minScale: number; // 0 = all, or 10..70
  minMagnitude: number | null; // null = all
}

export function extractRecordDateYmd(record: P2PQuakeRecord): string | null {
  const rawTime = record.code === 551 ? record.earthquake.time || record.time : record.time;
  if (!rawTime) return null;
  const m = rawTime.match(/^(\d{4})[/-](\d{2})[/-](\d{2})/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

export function getRecordMaxScale(record: P2PQuakeRecord): number {
  if (record.code === 551) {
    return record.earthquake.maxScale ?? 0;
  }
  if (record.code === 556) {
    return getEEWMaxScale(record);
  }
  return 0;
}

export function getRecordMagnitude(record: P2PQuakeRecord): number | null {
  if (record.code === 551) {
    const m = record.earthquake.hypocenter.magnitude;
    return m !== undefined && m !== null && m >= 0 ? m : null;
  }
  if (record.code === 556) {
    const m = record.earthquake?.hypocenter.magnitude;
    return m !== undefined && m !== null && m >= 0 ? m : null;
  }
  return null;
}

export function matchesQuakeText(record: P2PQuakeRecord, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;
  if (record.code === 551) {
    const name = record.earthquake.hypocenter.name?.toLowerCase() ?? '';
    const prefs = record.points?.map((p) => `${p.pref}${p.addr}`.toLowerCase()).join(' ') ?? '';
    return name.includes(q) || prefs.includes(q);
  }
  if (record.code === 556) {
    const name = record.earthquake?.hypocenter.name?.toLowerCase() ?? '';
    const areas = record.areas?.map((a) => `${a.pref}${a.name}`.toLowerCase()).join(' ') ?? '';
    return name.includes(q) || areas.includes(q) || '緊急地震速報'.includes(q);
  }
  if (record.code === 554) {
    return '緊急地震速報'.includes(q) || '発表検出'.includes(q);
  }
  if (record.code === 552) {
    return '津波予報'.includes(q);
  }
  const areaInfo = resolveP2PAreaInfo(record.area);
  const areaLabel = formatP2PAreaLabel(record.area).toLowerCase();
  return (
    areaLabel.includes(q) ||
    (areaInfo?.region.toLowerCase().includes(q) ?? false) ||
    (areaInfo?.pref.toLowerCase().includes(q) ?? false) ||
    (areaInfo?.name.toLowerCase().includes(q) ?? false) ||
    `地域コード ${record.area}`.includes(q) ||
    String(record.area).includes(q) ||
    '地震感知'.includes(q)
  );
}

export function matchesQuakeSearch(
  record: P2PQuakeRecord,
  criteria: QuakeSearchCriteria,
): boolean {
  if (!matchesFilter(record, criteria.filter)) {
    return false;
  }

  if (!matchesQuakeText(record, criteria.searchQuery)) {
    return false;
  }

  if (criteria.dateFrom || criteria.dateTo) {
    const ymd = extractRecordDateYmd(record);
    if (!ymd) return false;
    if (criteria.dateFrom && ymd < criteria.dateFrom) return false;
    if (criteria.dateTo && ymd > criteria.dateTo) return false;
  }

  if (criteria.minScale > 0) {
    const scale = getRecordMaxScale(record);
    if (scale < criteria.minScale) return false;
  }

  if (criteria.minMagnitude !== null && criteria.minMagnitude > 0) {
    const mag = getRecordMagnitude(record);
    if (mag === null || mag < criteria.minMagnitude) return false;
  }

  return true;
}

function formatNowP2P(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '00';

  return `${get('year')}/${get('month')}/${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
}

let testSeq = 0;

export function createTestEEWPayload(
  preset: TestEEWPreset,
  now = new Date()
): EEW556 | EEWDetection554 {
  const timeStr = formatNowP2P(now);
  testSeq += 1;
  const idSuffix = `${now.getTime().toString(36)}-${testSeq}`;

  if (preset === 'eew_detection') {
    return {
      id: `test-eew-554-${idSuffix}`,
      code: 554,
      time: `${timeStr}.000`,
      type: 'Full',
      isTest: true,
    };
  }

  if (preset === 'eew_cancelled') {
    return {
      id: `test-eew-556-cancel-${idSuffix}`,
      code: 556,
      time: `${timeStr}.000`,
      cancelled: true,
      issue: {
        eventId: `test-${now.getTime()}`,
        serial: '2',
        time: timeStr,
      },
      isTest: true,
    };
  }

  if (preset === 'nankai_alert') {
    return {
      id: `test-eew-556-nankai-${idSuffix}`,
      code: 556,
      time: `${timeStr}.000`,
      cancelled: false,
      earthquake: {
        originTime: timeStr,
        arrivalTime: timeStr,
        condition: 'テスト配信（想定震源）',
        hypocenter: {
          name: '和歌山県南方沖',
          reduceName: '紀伊水道沖',
          latitude: 33.4,
          longitude: 135.6,
          depth: 20,
          magnitude: 7.8,
        },
      },
      areas: [
        { name: '和歌山県南部', pref: '和歌山', scaleFrom: 60, scaleTo: 99, arrivalTime: timeStr },
        { name: '高知県東部', pref: '高知', scaleFrom: 55, scaleTo: 99, arrivalTime: timeStr },
        { name: '三重県南部', pref: '三重', scaleFrom: 55, scaleTo: 99, arrivalTime: timeStr },
        { name: '大阪府南部', pref: '大阪', scaleFrom: 50, scaleTo: 99, arrivalTime: timeStr },
        { name: '静岡県西部', pref: '静岡', scaleFrom: 45, scaleTo: 99, arrivalTime: timeStr },
      ],
      issue: {
        eventId: `test-${now.getTime()}`,
        serial: '3',
        time: timeStr,
      },
      isTest: true,
    };
  }

  // Default: kanto_alert
  return {
    id: `test-eew-556-kanto-${idSuffix}`,
    code: 556,
    time: `${timeStr}.000`,
    cancelled: false,
    earthquake: {
      originTime: timeStr,
      arrivalTime: timeStr,
      condition: 'テスト配信（想定震源）',
      hypocenter: {
        name: '東京湾',
        reduceName: '関東地方',
        latitude: 35.5,
        longitude: 139.9,
        depth: 40,
        magnitude: 6.9,
      },
    },
    areas: [
      { name: '東京都２３区', pref: '東京', scaleFrom: 55, scaleTo: 99, arrivalTime: timeStr },
      { name: '神奈川県東部', pref: '神奈川', scaleFrom: 55, scaleTo: 99, arrivalTime: timeStr },
      { name: '千葉県北西部', pref: '千葉', scaleFrom: 50, scaleTo: 99, arrivalTime: timeStr },
      { name: '埼玉県南部', pref: '埼玉', scaleFrom: 45, scaleTo: 99, arrivalTime: timeStr },
    ],
    issue: {
      eventId: `test-${now.getTime()}`,
      serial: '1',
      time: timeStr,
    },
    isTest: true,
  };
}

/**
 * Deterministic fallback sample dataset (used only if live network is unreachable)
 * structured identically to P2PQuake v2 /history responses.
 */
export const FALLBACK_SAMPLE_RECORDS: JMAQuake551[] = [
  {
    id: 'fallback-551-1',
    code: 551,
    time: '2026/11/25 08:44:35.416',
    earthquake: {
      domesticTsunami: 'None',
      foreignTsunami: 'Unknown',
      maxScale: 20,
      time: '2026/11/25 08:40:00',
      hypocenter: {
        name: '熊本県天草・芦北地方',
        latitude: 32.2,
        longitude: 130.4,
        depth: 10,
        magnitude: 2.8,
      },
    },
    issue: {
      source: '気象庁',
      time: '2026/11/25 08:44:35',
      type: 'DetailScale',
    },
    points: [
      { pref: '熊本県', addr: '水俣市陣内', isArea: false, scale: 20 },
      { pref: '熊本県', addr: '芦北町芦北', isArea: false, scale: 10 },
    ],
  },
];
