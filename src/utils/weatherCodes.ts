import type { WarningLevel } from '../types/weather';

const JMA_WARNING_DEFS: Record<string, { name: string; level: WarningLevel }> = {
  '02': { name: '暴風雪警報', level: 'warning' },
  '03': { name: '大雨警報', level: 'warning' },
  '04': { name: '洪水警報', level: 'warning' },
  '05': { name: '暴風警報', level: 'warning' },
  '06': { name: '大雪警報', level: 'warning' },
  '07': { name: '波浪警報', level: 'warning' },
  '08': { name: '高潮警報', level: 'warning' },
  '09': { name: '土砂災害警報', level: 'warning' },
  '10': { name: '大雨注意報', level: 'advisory' },
  '12': { name: '大雪注意報', level: 'advisory' },
  '13': { name: '風雪注意報', level: 'advisory' },
  '14': { name: '雷注意報', level: 'advisory' },
  '15': { name: '強風注意報', level: 'advisory' },
  '16': { name: '波浪注意報', level: 'advisory' },
  '17': { name: '融雪注意報', level: 'advisory' },
  '18': { name: '洪水注意報', level: 'advisory' },
  '19': { name: '高潮注意報', level: 'advisory' },
  '20': { name: '濃霧注意報', level: 'advisory' },
  '21': { name: '乾燥注意報', level: 'advisory' },
  '22': { name: 'なだれ注意報', level: 'advisory' },
  '23': { name: '低温注意報', level: 'advisory' },
  '24': { name: '霜注意報', level: 'advisory' },
  '25': { name: '着氷注意報', level: 'advisory' },
  '26': { name: '着雪注意報', level: 'advisory' },
  '27': { name: 'その他の注意報', level: 'advisory' },
  '29': { name: '土砂災害注意報', level: 'advisory' },
  '32': { name: '暴風雪特別警報', level: 'special' },
  '33': { name: '大雨特別警報', level: 'special' },
  '35': { name: '暴風特別警報', level: 'special' },
  '36': { name: '大雪特別警報', level: 'special' },
  '37': { name: '波浪特別警報', level: 'special' },
  '38': { name: '高潮特別警報', level: 'special' },
  '39': { name: '土砂災害特別警報', level: 'special' },
  '43': { name: '大雨危険警報', level: 'warning' },
  '48': { name: '高潮危険警報', level: 'warning' },
  '49': { name: '土砂災害危険警報', level: 'warning' },
};

export function decodeJmaWarningCode(code: string): {
  code: string;
  name: string;
  level: WarningLevel;
} {
  const normalized = code.trim().padStart(2, '0');
  const def = JMA_WARNING_DEFS[normalized];
  if (def) {
    return { code: normalized, ...def };
  }
  return {
    code: normalized,
    name: `気象情報 (コード ${normalized})`,
    level: 'advisory',
  };
}

export type WeatherVisualKind = 'clear' | 'partly' | 'cloudy' | 'rain' | 'snow' | 'thunder';

export function describeJmaWeatherCode(code: string): {
  label: string;
  kind: WeatherVisualKind;
} {
  const c = code.trim();
  const explicit: Record<string, { label: string; kind: WeatherVisualKind }> = {
    '100': { label: '晴れ', kind: 'clear' },
    '101': { label: '晴れ 時々 くもり', kind: 'partly' },
    '102': { label: '晴れ 一時 雨', kind: 'rain' },
    '103': { label: '晴れ 時々 雨', kind: 'rain' },
    '104': { label: '晴れ 一時 雪', kind: 'snow' },
    '110': { label: '晴れ 後 くもり', kind: 'partly' },
    '111': { label: '晴れ 後 くもり', kind: 'partly' },
    '112': { label: '晴れ 後 雨', kind: 'rain' },
    '114': { label: '晴れ 後 雨', kind: 'rain' },
    '115': { label: '晴れ 後 雪', kind: 'snow' },
    '200': { label: 'くもり', kind: 'cloudy' },
    '201': { label: 'くもり 時々 晴れ', kind: 'partly' },
    '202': { label: 'くもり 一時 雨', kind: 'rain' },
    '203': { label: 'くもり 時々 雨', kind: 'rain' },
    '204': { label: 'くもり 一時 雪', kind: 'snow' },
    '205': { label: 'くもり 時々 雪', kind: 'snow' },
    '210': { label: 'くもり 後 晴れ', kind: 'partly' },
    '211': { label: 'くもり 後 晴れ', kind: 'partly' },
    '212': { label: 'くもり 後 雨', kind: 'rain' },
    '214': { label: 'くもり 後 雨', kind: 'rain' },
    '215': { label: 'くもり 後 雪', kind: 'snow' },
    '300': { label: '雨', kind: 'rain' },
    '301': { label: '雨 時々 晴れ', kind: 'rain' },
    '302': { label: '雨 時々 止む', kind: 'rain' },
    '303': { label: '雨 時々 雪', kind: 'snow' },
    '308': { label: '大雨', kind: 'rain' },
    '311': { label: '雨 後 晴れ', kind: 'rain' },
    '313': { label: '雨 後 くもり', kind: 'rain' },
    '314': { label: '雨 後 雪', kind: 'snow' },
    '400': { label: '雪', kind: 'snow' },
    '401': { label: '雪 時々 晴れ', kind: 'snow' },
    '402': { label: '雪 時々 止む', kind: 'snow' },
    '406': { label: '風雪強い', kind: 'snow' },
    '411': { label: '雪 後 晴れ', kind: 'snow' },
    '413': { label: '雪 後 くもり', kind: 'snow' },
    '414': { label: '雪 後 雨', kind: 'snow' },
  };
  if (explicit[c]) return explicit[c];

  if (c.startsWith('1')) return { label: '晴れ基調', kind: 'partly' };
  if (c.startsWith('2')) return { label: 'くもり基調', kind: 'cloudy' };
  if (c.startsWith('3')) return { label: '雨', kind: 'rain' };
  if (c.startsWith('4')) return { label: '雪', kind: 'snow' };
  return { label: '天気情報', kind: 'cloudy' };
}

export function describeWmoWeatherCode(code: number | null | undefined): {
  label: string;
  kind: WeatherVisualKind;
} {
  if (code === null || code === undefined || !Number.isFinite(code)) {
    return { label: '不明', kind: 'cloudy' };
  }
  if (code === 0) return { label: '快晴', kind: 'clear' };
  if (code === 1) return { label: 'おおむね晴れ', kind: 'clear' };
  if (code === 2) return { label: '一部くもり', kind: 'partly' };
  if (code === 3) return { label: 'くもり', kind: 'cloudy' };
  if (code === 45 || code === 48) return { label: '霧', kind: 'cloudy' };
  if (code >= 51 && code <= 57) return { label: '霧雨', kind: 'rain' };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    return { label: code >= 65 || code === 82 ? '強い雨' : '雨', kind: 'rain' };
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return { label: '雪', kind: 'snow' };
  }
  if (code >= 95) return { label: '雷雨', kind: 'thunder' };
  return { label: `気象コード ${code}`, kind: 'cloudy' };
}

const COMPASS_16 = [
  '北',
  '北北東',
  '北東',
  '東北東',
  '東',
  '東南東',
  '南東',
  '南南東',
  '南',
  '南南西',
  '南西',
  '西南西',
  '西',
  '西北西',
  '北西',
  '北北西',
];

/**
 * JMA AMeDAS encodes windDirection as 0 (静穏) or 1..16 (1=北北東, ..., 16=北)
 */
export function formatAmedasWindDirection(dirIndex: number | null | undefined): string {
  if (dirIndex === null || dirIndex === undefined || !Number.isFinite(dirIndex)) {
    return '--';
  }
  if (dirIndex === 0) return '静穏';
  if (dirIndex >= 1 && dirIndex <= 16) {
    return COMPASS_16[dirIndex % 16];
  }
  return '--';
}

export function formatDegreesToCompass(deg: number | null | undefined): string {
  if (deg === null || deg === undefined || !Number.isFinite(deg)) {
    return '--';
  }
  const normalized = ((deg % 360) + 360) % 360;
  const idx = Math.round(normalized / 22.5) % 16;
  return COMPASS_16[idx];
}
