import type { P2PQuakeRecord } from '../types/quake';
import {
  formatDepth,
  formatMagnitude,
  formatScaleRange,
  formatTimestamp,
  getEEWMaxScale,
  getRecordCategoryLabel,
  getRecordCoordinates,
  getRecordTitle,
  getScalePresentation,
  groupMunicipalitiesByPrefAndScale,
  translateTsunamiGrade,
  translateTsunamiShort,
} from './quakeParser';
import {
  type ScaleDistributionBin,
  buildScaleDistribution,
} from './scaleDistribution';

export interface PdfMetricItem {
  label: string;
  value: string;
}

export interface PdfReportModel {
  filename: string;
  title: string;
  categoryLabel: string;
  occurredAt: string;
  issuedAt: string;
  isTest: boolean;
  recordId: string;
  metrics: PdfMetricItem[];
  coordinates: { latitude: number; longitude: number } | null;
  scaleDistribution: {
    title: string;
    totalCount: number;
    unitLabel: '地点' | '地域';
    bins: ScaleDistributionBin[];
  };
  municipalityGroups: Array<{
    scale: number;
    scaleLabel: string;
    prefectures: Array<{ pref: string; cities: string[] }>;
  }>;
  eewAreas: Array<{
    name: string;
    pref: string;
    scaleText: string;
  }>;
  tsunamiAreas: Array<{
    name: string;
    gradeText: string;
  }>;
  comment?: string;
}

function sanitizeFilenamePart(input: string): string {
  return input
    .replace(/[\\/:*?"<>|\s]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 36);
}

function formatFilenameTimestamp(raw?: string): string {
  if (!raw) return 'unknown';
  const cleaned = raw.split('.')[0] ?? raw;
  const digits = cleaned.replace(/[^\d]/g, '');
  if (digits.length >= 12) {
    return `${digits.slice(0, 8)}_${digits.slice(8, 12)}`;
  }
  return digits || 'report';
}

export function buildPdfReportModel(
  record: P2PQuakeRecord,
  generatedAt = new Date()
): PdfReportModel {
  const title = getRecordTitle(record);
  const categoryLabel = getRecordCategoryLabel(record);
  const rawTime =
    record.code === 551 && record.earthquake?.time
      ? record.earthquake.time
      : record.time;
  const occurredAt = formatTimestamp(rawTime);
  const coordinates = getRecordCoordinates(record);
  const distribution = buildScaleDistribution(record);

  let metrics: PdfMetricItem[] = [];
  let municipalityGroups: PdfReportModel['municipalityGroups'] = [];
  let eewAreas: PdfReportModel['eewAreas'] = [];
  let tsunamiAreas: PdfReportModel['tsunamiAreas'] = [];
  let comment: string | undefined;

  if (record.code === 551) {
    metrics = [
      {
        label: '最大震度',
        value: getScalePresentation(record.earthquake.maxScale).label,
      },
      {
        label: 'マグニチュード',
        value: formatMagnitude(record.earthquake.hypocenter.magnitude),
      },
      {
        label: '震源の深さ',
        value: formatDepth(record.earthquake.hypocenter.depth),
      },
      {
        label: '津波の有無',
        value: translateTsunamiShort(record.earthquake.domesticTsunami),
      },
    ];
    municipalityGroups = groupMunicipalitiesByPrefAndScale(record.points);
    comment = record.comments?.freeFormComment || undefined;
  } else if (record.code === 556) {
    const maxScale = getEEWMaxScale(record);
    metrics = [
      {
        label: '種別 / 予想震度',
        value: record.cancelled
          ? '取消'
          : maxScale > 0
          ? `${getScalePresentation(maxScale).label}以上`
          : '解析中',
      },
      {
        label: 'マグニチュード',
        value: formatMagnitude(record.earthquake?.hypocenter.magnitude),
      },
      {
        label: '震源の深さ',
        value: formatDepth(record.earthquake?.hypocenter.depth),
      },
      {
        label: '報番号',
        value: `第${record.issue.serial}報 (${record.cancelled ? '取消' : '警報'})`,
      },
    ];
    eewAreas = (record.areas ?? []).map((a) => ({
      name: a.name,
      pref: a.pref,
      scaleText: formatScaleRange(a.scaleFrom, a.scaleTo),
    }));
  } else if (record.code === 554) {
    metrics = [
      { label: '種別', value: '緊急地震速報 検出' },
      { label: '検出区分', value: record.type },
      { label: 'マグニチュード', value: '--' },
      { label: '震源の深さ', value: '--' },
    ];
  } else if (record.code === 552) {
    metrics = [
      { label: 'ステータス', value: record.cancelled ? '解除' : '発表中' },
      { label: '発表元', value: record.issue.source },
      { label: '対象地域数', value: `${record.areas?.length ?? 0}地域` },
      { label: '発表時刻', value: formatTimestamp(record.issue.time) },
    ];
    tsunamiAreas = (record.areas ?? []).map((a) => ({
      name: a.name,
      gradeText: translateTsunamiGrade(a.grade),
    }));
  } else {
    metrics = [
      { label: '種別', value: '地震感知情報' },
      { label: '地域コード', value: String(record.area) },
      { label: '受信時刻', value: occurredAt },
      { label: '出典', value: 'P2P地震情報' },
    ];
  }

  const issuedParts = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(generatedAt);
  const g = (t: Intl.DateTimeFormatPartTypes) =>
    issuedParts.find((p) => p.type === t)?.value ?? '00';
  const issuedAt = `${g('year')}/${g('month')}/${g('day')} ${g('hour')}:${g('minute')}:${g('second')} JST`;

  const tsPart = formatFilenameTimestamp(rawTime);
  const titlePart = sanitizeFilenamePart(title) || 'report';
  const filename = `NEiN_${tsPart}_${titlePart}.pdf`;

  return {
    filename,
    title,
    categoryLabel,
    occurredAt,
    issuedAt,
    isTest: Boolean(record.isTest),
    recordId: record.id,
    metrics,
    coordinates,
    scaleDistribution: distribution,
    municipalityGroups,
    eewAreas,
    tsunamiAreas,
    comment,
  };
}
