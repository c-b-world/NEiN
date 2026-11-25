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

export const REQUESTED_API_URL =
  'https://api.p2pquake.net/v2/history?codes=551,552,554,556,561&limit=30&offset=0';

export const P2PQUAKE_WS_URL = 'wss://api.p2pquake.net/v2/ws';

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

export function getScalePresentation(scale: number): ScalePresentation {
  switch (scale) {
    case 10:
      return {
        short: '1',
        label: '震度1',
        bgClass: 'bg-slate-800',
        textClass: 'text-slate-200',
        borderClass: 'border-slate-700',
        severity: 1,
      };
    case 20:
      return {
        short: '2',
        label: '震度2',
        bgClass: 'bg-sky-950',
        textClass: 'text-sky-200',
        borderClass: 'border-sky-800',
        severity: 2,
      };
    case 30:
      return {
        short: '3',
        label: '震度3',
        bgClass: 'bg-emerald-950',
        textClass: 'text-emerald-200',
        borderClass: 'border-emerald-800',
        severity: 3,
      };
    case 40:
      return {
        short: '4',
        label: '震度4',
        bgClass: 'bg-amber-950',
        textClass: 'text-amber-200',
        borderClass: 'border-amber-700',
        severity: 4,
      };
    case 45:
      return {
        short: '5弱',
        label: '震度5弱',
        bgClass: 'bg-orange-950',
        textClass: 'text-orange-200',
        borderClass: 'border-orange-700',
        severity: 5,
      };
    case 50:
      return {
        short: '5強',
        label: '震度5強',
        bgClass: 'bg-orange-900',
        textClass: 'text-orange-100',
        borderClass: 'border-orange-600',
        severity: 6,
      };
    case 55:
      return {
        short: '6弱',
        label: '震度6弱',
        bgClass: 'bg-red-950',
        textClass: 'text-red-200',
        borderClass: 'border-red-700',
        severity: 7,
      };
    case 60:
      return {
        short: '6強',
        label: '震度6強',
        bgClass: 'bg-red-900',
        textClass: 'text-red-100',
        borderClass: 'border-red-600',
        severity: 8,
      };
    case 70:
      return {
        short: '7',
        label: '震度7',
        bgClass: 'bg-fuchsia-950',
        textClass: 'text-fuchsia-100',
        borderClass: 'border-fuchsia-600',
        severity: 9,
      };
    default:
      return {
        short: '-',
        label: '震度不明',
        bgClass: 'bg-slate-900',
        textClass: 'text-slate-400',
        borderClass: 'border-slate-800',
        severity: 0,
      };
  }
}

export function formatScaleRange(scaleFrom: number, scaleTo: number): string {
  const from = getScalePresentation(scaleFrom).label;
  if (scaleTo === 99) {
    return `${from}程度以上`;
  }
  if (scaleTo <= 0 || scaleTo === scaleFrom) {
    return from;
  }
  const to = getScalePresentation(scaleTo).label;
  return `${from}〜${to}`;
}

export function translateTsunamiStatus(code?: string): string {
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

export function translateTsunamiShort(code?: string): string {
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

export function translateIssueType(type?: string): string {
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

export function translateTsunamiGrade(grade: string): string {
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

export function formatDepth(depth?: number): string {
  if (depth === undefined || depth === null || depth < 0) {
    return '不明';
  }
  if (depth === 0) {
    return 'ごく浅い';
  }
  return `約${depth}km`;
}

export function formatMagnitude(magnitude?: number): string {
  if (magnitude === undefined || magnitude === null || magnitude < 0) {
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

export function getRecordTitle(record: P2PQuakeRecord): string {
  switch (record.code) {
    case 551:
      return record.earthquake.hypocenter.name || translateIssueType(record.issue.type);
    case 552:
      if (record.cancelled) return '津波予報 解除';
      return record.areas?.length
        ? `津波予報 (${record.areas.map((a) => a.name).slice(0, 2).join('・')})`
        : '津波予報';
    case 554:
      return '緊急地震速報（発表検出）';
    case 556: {
      if (record.cancelled) {
        return '緊急地震速報（取消）';
      }
      const hypo = record.earthquake?.hypocenter.name;
      return hypo ? `緊急地震速報・${hypo}` : '緊急地震速報（警報）';
    }
    case 561:
      return `地震感知情報（地域コード ${record.area}）`;
  }
}

export function getRecordCategoryLabel(record: P2PQuakeRecord): string {
  switch (record.code) {
    case 551:
      return translateIssueType(record.issue.type);
    case 552:
      return '津波予報';
    case 554:
      return '緊急地震速報 検出';
    case 556:
      return record.cancelled ? '緊急地震速報 取消' : '緊急地震速報 警報';
    case 561:
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

export function formatQuakeForClipboard(record: P2PQuakeRecord): string {
  const testPrefix = record.isTest ? '【テスト配信】' : '';

  if (record.code === 551) {
    const eq = record.earthquake;
    const maxScale = getScalePresentation(eq.maxScale).label;
    const lines = [
      `${testPrefix}【地震情報】${translateIssueType(record.issue.type)}`,
      `発生時刻：${formatTimestamp(eq.time)}`,
      `震源地：${eq.hypocenter.name || '調査中'}`,
      `最大震度：${maxScale}`,
      `規模：${formatMagnitude(eq.hypocenter.magnitude)}`,
      `深さ：${formatDepth(eq.hypocenter.depth)}`,
      `津波：${translateTsunamiStatus(eq.domesticTsunami)}`,
    ];

    const grouped = groupPointsByPrefAndScale(record.points);
    if (grouped.length > 0) {
      lines.push('', '■ 各地の震度');
      for (const group of grouped.slice(0, 4)) {
        const prefSummary = group.prefectures
          .map((p) => `${p.pref}（${p.addrs.slice(0, 5).join('・')}${p.addrs.length > 5 ? ' 他' : ''}）`)
          .join(' / ');
        lines.push(`${group.scaleLabel}：${prefSummary}`);
      }
    }

    if (record.comments?.freeFormComment) {
      lines.push('', `備考：${record.comments.freeFormComment}`);
    }
    lines.push('', '情報提供：NEiN (P2P地震情報)');
    return lines.join('\n');
  }

  if (record.code === 556) {
    if (record.cancelled) {
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
    const lines = [
      `${testPrefix}【緊急地震速報（警報）】第${record.issue.serial}報`,
      `発表時刻：${formatTimestamp(record.issue.time)}`,
      `震源地：${eq?.hypocenter.name || '解析中'}`,
      `規模：${formatMagnitude(eq?.hypocenter.magnitude)} / 深さ：${formatDepth(eq?.hypocenter.depth)}`,
      maxAreaScale > 0
        ? `予想最大震度：${getScalePresentation(maxAreaScale).label}程度以上`
        : '強い揺れに警戒してください',
    ];
    if (record.areas && record.areas.length > 0) {
      lines.push(
        `警報対象地域：${record.areas.map((a) => a.name).join('・')}`
      );
    }
    lines.push('', '情報提供：NEiN (P2P地震情報)');
    return lines.join('\n');
  }

  if (record.code === 554) {
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
    const lines = [
      `${testPrefix}【津波予報】`,
      `発表時刻：${formatTimestamp(record.issue.time)}`,
      record.cancelled
        ? '津波予報はすべて解除されました。'
        : `対象地域：${record.areas?.map((a) => `${a.name}（${translateTsunamiGrade(a.grade)}）`).join('・') || '確認中'}`,
      '',
      '情報提供：NEiN (P2P地震情報)',
    ];
    return lines.join('\n');
  }

  return [
    `${testPrefix}【地震感知情報】`,
    `受信時刻：${formatTimestamp(record.time)}`,
    `地域コード：${record.area}`,
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
  limit = 30
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
