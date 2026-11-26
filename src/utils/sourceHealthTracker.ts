import type { FeedHealthStatus, SourceHealthRecord } from '../types/disaster';

const registry = new Map<string, SourceHealthRecord>();
const listeners = new Set<() => void>();

const INITIAL_SOURCES: SourceHealthRecord[] = [
  {
    id: 'p2p_ws',
    name: {
      ja: 'P2P地震情報 WebSocket ストリーム',
      en: 'P2PQuake WebSocket Stream',
      zh: 'P2P地震信息 WebSocket 实时流',
      ko: 'P2P 지진 정보 WebSocket 스트림',
    },
    provider: 'P2PQuake (api.p2pquake.net)',
    category: 'quake_tsunami',
    status: 'connecting',
    lastFetchedAt: null,
    publishedAt: null,
    intervalSec: null,
    latencyMs: null,
    cacheHit: false,
    errorMessage: null,
    officialUrl: 'https://www.p2pquake.net/',
    attribution: 'P2P地震情報 API v2',
  },
  {
    id: 'p2p_rest',
    name: {
      ja: 'P2P地震情報 REST API (履歴・アーカイブ)',
      en: 'P2PQuake REST API (History/Archive)',
      zh: 'P2P地震信息 REST API (历史存档)',
      ko: 'P2P 지진 정보 REST API (이력/아카이브)',
    },
    provider: 'P2PQuake (api.p2pquake.net)',
    category: 'quake_tsunami',
    status: 'unfetched',
    lastFetchedAt: null,
    publishedAt: null,
    intervalSec: 10,
    latencyMs: null,
    cacheHit: false,
    errorMessage: null,
    officialUrl: 'https://www.p2pquake.net/json_api_v2/',
    attribution: 'P2P地震情報 JSON API v2',
  },
  {
    id: 'jma_quake',
    name: {
      ja: '気象庁 防災情報JSON（国内/遠地/長周期/南海トラフ地震）',
      en: 'JMA Bosai Quake JSON (Domestic/Distant/Long-Period/Nankai)',
      zh: '日本气象厅 地震JSON（国内/远地/长周期/南海海槽）',
      ko: '일본 기상청 지진 JSON (국내/원지/장주기/난카이)',
    },
    provider: 'Japan Meteorological Agency',
    category: 'quake_tsunami',
    status: 'unfetched',
    lastFetchedAt: null,
    publishedAt: null,
    intervalSec: 120,
    latencyMs: null,
    cacheHit: false,
    errorMessage: null,
    officialUrl: 'https://www.jma.go.jp/bosai/map.html#contents=earthquake_map',
    attribution: '気象庁 (JMA)',
  },
  {
    id: 'jma_tsunami',
    name: {
      ja: '気象庁 津波情報JSON（警報・注意報・予報・観測）',
      en: 'JMA Tsunami JSON (Warnings/Forecasts/Observations)',
      zh: '日本气象厅 海啸JSON（警报/注意报/预报/观测）',
      ko: '일본 기상청 쓰나미 JSON (경보/주의보/예보/관측)',
    },
    provider: 'Japan Meteorological Agency',
    category: 'quake_tsunami',
    status: 'unfetched',
    lastFetchedAt: null,
    publishedAt: null,
    intervalSec: 120,
    latencyMs: null,
    cacheHit: false,
    errorMessage: null,
    officialUrl: 'https://www.jma.go.jp/bosai/map.html#contents=tsunami',
    attribution: '気象庁 (JMA)',
  },
  {
    id: 'jma_forecast_warning',
    name: {
      ja: '気象庁 天気予報・R8気象警報注意報JSON',
      en: 'JMA Weather Forecast & R8 Warning JSON',
      zh: '日本气象厅 天气预报与R8气象警报JSON',
      ko: '일본 기상청 일기예보・R8 기상특보 JSON',
    },
    provider: 'Japan Meteorological Agency',
    category: 'weather',
    status: 'unfetched',
    lastFetchedAt: null,
    publishedAt: null,
    intervalSec: 300,
    latencyMs: null,
    cacheHit: false,
    errorMessage: null,
    officialUrl: 'https://www.jma.go.jp/bosai/warning/',
    attribution: '気象庁 (JMA)',
  },
  {
    id: 'jma_amedas',
    name: {
      ja: '気象庁 アメダス全国観測データ',
      en: 'JMA Nationwide AMeDAS Observations',
      zh: '日本气象厅 AMeDAS 全国实测数据',
      ko: '일본 기상청 AMeDAS 전국 관측 데이터',
    },
    provider: 'Japan Meteorological Agency',
    category: 'weather',
    status: 'unfetched',
    lastFetchedAt: null,
    publishedAt: null,
    intervalSec: 180,
    latencyMs: null,
    cacheHit: false,
    errorMessage: null,
    officialUrl: 'https://www.jma.go.jp/bosai/amedas/',
    attribution: '気象庁 (JMA)',
  },
  {
    id: 'jma_radar_kikikuru',
    name: {
      ja: '気象庁 高解像度レーダー・雷・竜巻・キキクル・ひまわり衛星',
      en: 'JMA High-Res Radar, Lightning, Tornado, Kikikuru & Himawari',
      zh: '日本气象厅 高分辨率雷达・雷电・龙卷・Kikikuru・向日葵卫星',
      ko: '일본 기상청 고해상도 레이더・낙뢰・토네이도・키키쿠루・히마와리',
    },
    provider: 'Japan Meteorological Agency',
    category: 'radar_satellite',
    status: 'unfetched',
    lastFetchedAt: null,
    publishedAt: null,
    intervalSec: 300,
    latencyMs: null,
    cacheHit: false,
    errorMessage: null,
    officialUrl: 'https://www.jma.go.jp/bosai/nowc/',
    attribution: '気象庁 (JMA)',
  },
  {
    id: 'jma_xml_feeds',
    name: {
      ja: '気象庁防災情報XML Atomフィード (eqvol / extra / other / regular)',
      en: 'JMAXML Atom Feeds (Eq/Volcano, Extra, Marine/Typhoon, Regular)',
      zh: '日本气象厅防灾XML Atom订阅源',
      ko: '일본 기상청 방재정보 XML Atom 피드',
    },
    provider: 'Japan Meteorological Agency (data.jma.go.jp)',
    category: 'hazard_volcano',
    status: 'unfetched',
    lastFetchedAt: null,
    publishedAt: null,
    intervalSec: 180,
    latencyMs: null,
    cacheHit: false,
    errorMessage: null,
    officialUrl: 'https://www.data.jma.go.jp/developer/xml/feed/extra.xml',
    attribution: '気象庁防災情報XML',
  },
  {
    id: 'jma_typhoon_volcano',
    name: {
      ja: '気象庁 台風JSON・全国火山マスター (120火山)',
      en: 'JMA Typhoon JSON & National Volcano Catalog (120)',
      zh: '日本气象厅 台风JSON与全国火山目录 (120座)',
      ko: '일본 기상청 태풍 JSON・전국 화산 목록 (120개)',
    },
    provider: 'Japan Meteorological Agency',
    category: 'hazard_volcano',
    status: 'unfetched',
    lastFetchedAt: null,
    publishedAt: null,
    intervalSec: 300,
    latencyMs: null,
    cacheHit: false,
    errorMessage: null,
    officialUrl: 'https://www.jma.go.jp/bosai/map.html#contents=typhoon',
    attribution: '気象庁 (JMA)',
  },
  {
    id: 'openmeteo_suite',
    name: {
      ja: 'Open-Meteo (気象モデル・大気質PM2.5/黄砂/UV・海洋波浪/海面水温)',
      en: 'Open-Meteo (Forecast, Air Quality/Dust/UV & Marine)',
      zh: 'Open-Meteo (数值预报・PM2.5/黄砂/UV・海洋波浪水温)',
      ko: 'Open-Meteo (수치예보・대기질/황사/UV・해양 파고/수온)',
    },
    provider: 'Open-Meteo (CC BY 4.0)',
    category: 'marine_env',
    status: 'unfetched',
    lastFetchedAt: null,
    publishedAt: null,
    intervalSec: 300,
    latencyMs: null,
    cacheHit: false,
    errorMessage: null,
    officialUrl: 'https://open-meteo.com/',
    attribution: 'Open-Meteo (CC BY 4.0)',
  },
  {
    id: 'gsi_tiles_shelters',
    name: {
      ja: '国土地理院 地理院地図タイル・ハザード・指定緊急避難場所',
      en: 'GSI Map Tiles, Flood Hazard & Emergency Shelters',
      zh: '日本国土地理院 地图瓦片・洪水风险与指定避难场所',
      ko: '일본 국토지리원 지도 타일・침수 위험・지정 긴급대피장소',
    },
    provider: 'Geospatial Information Authority of Japan (GSI)',
    category: 'map_shelter',
    status: 'unfetched',
    lastFetchedAt: null,
    publishedAt: null,
    intervalSec: null,
    latencyMs: null,
    cacheHit: false,
    errorMessage: null,
    officialUrl: 'https://maps.gsi.go.jp/',
    attribution: '国土地理院 (GSI)',
  },
  {
    id: 'moe_wbgt_official',
    name: {
      ja: '環境省 熱中症警戒アラート／特別警戒アラート 公式CSV',
      en: 'MOE Official Heatstroke Alert CSV',
      zh: '日本环境省 中暑警戒警报官方CSV',
      ko: '일본 환경성 열사병 경계 알람 공식 CSV',
    },
    provider: 'Ministry of the Environment (wbgt.env.go.jp)',
    category: 'marine_env',
    status: 'unsupported',
    lastFetchedAt: null,
    publishedAt: null,
    intervalSec: null,
    latencyMs: null,
    cacheHit: false,
    errorMessage: null,
    officialUrl: 'https://www.wbgt.env.go.jp/alert.php',
    attribution: '環境省 熱中症予防情報サイト',
    note: {
      ja: '配信元サーバーがブラウザCORSを許可していないため、静的環境では自動取得未対応（ダミー値表示なし）。',
      en: 'Official CSV endpoint omits browser CORS headers; direct fetch unsupported on static clients.',
      zh: '官方CSV服务器未开启浏览器CORS跨域，静态网页无法直接抓取（绝不显示虚假警报）。',
      ko: '공식 CSV 서버가 브라우저 CORS를 허용하지 않아 정적 환경에서 자동 수신 미지원(가상 값 표시 없음).',
    },
  },
  {
    id: 'mlit_river_official',
    name: {
      ja: '国土交通省 川の防災情報（観測所別リアルタイム水位・ダム数値API）',
      en: 'MLIT Real-Time River Gauge & Dam Level Telemetry',
      zh: '日本国土交通省 实时河流水位与水坝监测API',
      ko: '일본 국토교통성 실시간 하천 수위・댐 수치 API',
    },
    provider: 'Ministry of Land, Infrastructure, Transport and Tourism (river.go.jp)',
    category: 'hazard_volcano',
    status: 'unsupported',
    lastFetchedAt: null,
    publishedAt: null,
    intervalSec: null,
    latencyMs: null,
    cacheHit: false,
    errorMessage: null,
    officialUrl: 'https://www.river.go.jp/',
    attribution: '国土交通省 川の防災情報',
    note: {
      ja: '公開REST JSON仕様およびCORSが未提供のため取得未対応。洪水リスクは気象庁キキクル・指定河川洪水予報XMLで監視可能です。',
      en: 'Public CORS JSON endpoint unavailable for individual river gauges; use JMA Kikikuru flood risk & JMAXML flood forecasts.',
      zh: '未提供公开跨域JSON接口，暂不支持实时水位数值抓取；可通过气象厅Kikikuru和指定河川洪水预报XML查看洪水风险。',
      ko: '공개 CORS JSON API 미제공으로 개별 수위 관측소 수치 직접 수신 미지원(기상청 키키쿠루・홍수 예보 XML 제공).',
    },
  },
];

for (const item of INITIAL_SOURCES) {
  registry.set(item.id, item);
}

function notify(): void {
  for (const fn of listeners) {
    try {
      fn();
    } catch {
      // Ignore subscriber errors
    }
  }
}

export function updateSourceHealth(
  id: string,
  patch: Partial<Omit<SourceHealthRecord, 'id'>>,
): void {
  const existing = registry.get(id);
  if (!existing) return;
  registry.set(id, { ...existing, ...patch });
  notify();
}

export function setSourceStatus(
  id: string,
  status: FeedHealthStatus,
  opts?: {
    publishedAt?: string | null;
    latencyMs?: number | null;
    cacheHit?: boolean;
    errorMessage?: string | null;
    lastFetchedAt?: Date | null;
  },
): void {
  updateSourceHealth(id, {
    status,
    ...(opts?.publishedAt !== undefined ? { publishedAt: opts.publishedAt } : {}),
    ...(opts?.latencyMs !== undefined ? { latencyMs: opts.latencyMs } : {}),
    ...(opts?.cacheHit !== undefined ? { cacheHit: opts.cacheHit } : {}),
    ...(opts?.errorMessage !== undefined ? { errorMessage: opts.errorMessage } : {}),
    ...(opts?.lastFetchedAt !== undefined ? { lastFetchedAt: opts.lastFetchedAt } : {}),
  });
}

export function getAllSourceHealth(): SourceHealthRecord[] {
  return Array.from(registry.values());
}

export function subscribeSourceHealth(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
