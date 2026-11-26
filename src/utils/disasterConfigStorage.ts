import type {
  DashboardCardSetting,
  IntegratedMapConfig,
  JmaQuakeSummaryItem,
  JmaTsunamiSummaryItem,
  JmaXmlBulletin,
  UnifiedTimelineEvent,
} from '../types/disaster';
import type { P2PQuakeRecord } from '../types/quake';
import type { AppLanguage } from './i18n';
import { getRecordTitle } from './quakeParser';

const MAP_CONFIG_KEY = 'nein_integrated_map_config_v1';
const DASHBOARD_CARDS_KEY = 'nein_dashboard_cards_v1';

export const DEFAULT_MAP_CONFIG: IntegratedMapConfig = {
  baseStyle: 'gsi_std',
  centerLat: 36.2,
  centerLon: 138.2,
  zoom: 5,
  enabledLayers: {
    quake_epicenters: true,
    quake_intensity: true,
    tsunami_areas: true,
    weather_warnings: false,
    rain_radar: true,
    precip_forecast: false,
    lightning_nowcast: false,
    tornado_nowcast: false,
    himawari_sat: false,
    typhoon_track: true,
    amedas_stations: false,
    kikikuru_landslide: false,
    kikikuru_inundation: false,
    kikikuru_flood: false,
    gsi_flood_hazard: false,
    volcanoes: true,
    evacuation_shelters: false,
  },
  layerOpacity: {
    quake_epicenters: 1,
    quake_intensity: 1,
    tsunami_areas: 0.9,
    weather_warnings: 0.9,
    rain_radar: 0.72,
    precip_forecast: 0.65,
    lightning_nowcast: 0.8,
    tornado_nowcast: 0.75,
    himawari_sat: 0.55,
    typhoon_track: 0.95,
    amedas_stations: 0.9,
    kikikuru_landslide: 0.7,
    kikikuru_inundation: 0.7,
    kikikuru_flood: 0.7,
    gsi_flood_hazard: 0.65,
    volcanoes: 0.9,
    evacuation_shelters: 0.95,
  },
};

export function loadMapConfig(): IntegratedMapConfig {
  if (typeof window === 'undefined' || !window.localStorage) return DEFAULT_MAP_CONFIG;
  try {
    const raw = window.localStorage.getItem(MAP_CONFIG_KEY);
    if (!raw) return DEFAULT_MAP_CONFIG;
    const parsed = JSON.parse(raw) as Partial<IntegratedMapConfig>;
    return {
      ...DEFAULT_MAP_CONFIG,
      ...parsed,
      enabledLayers: {
        ...DEFAULT_MAP_CONFIG.enabledLayers,
        ...(parsed.enabledLayers ?? {}),
      },
      layerOpacity: {
        ...DEFAULT_MAP_CONFIG.layerOpacity,
        ...(parsed.layerOpacity ?? {}),
      },
    };
  } catch {
    return DEFAULT_MAP_CONFIG;
  }
}

export function saveMapConfig(cfg: IntegratedMapConfig): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(MAP_CONFIG_KEY, JSON.stringify(cfg));
  } catch {
    // Ignore
  }
}

export const DEFAULT_DASHBOARD_CARDS: DashboardCardSetting[] = [
  { id: 'urgent_alerts', visible: true, size: 'wide' },
  { id: 'latest_quake', visible: true, size: 'compact' },
  { id: 'tsunami_status', visible: true, size: 'compact' },
  { id: 'weather_warnings', visible: true, size: 'compact' },
  { id: 'typhoon_status', visible: true, size: 'compact' },
  { id: 'registered_regions', visible: true, size: 'wide' },
  { id: 'radar_preview', visible: true, size: 'wide' },
  { id: 'volcano_status', visible: true, size: 'compact' },
  { id: 'landslide_flood', visible: true, size: 'compact' },
  { id: 'heat_environment', visible: true, size: 'compact' },
  { id: 'api_health', visible: true, size: 'compact' },
  { id: 'timeline_preview', visible: true, size: 'wide' },
];

export function loadDashboardCards(): DashboardCardSetting[] {
  if (typeof window === 'undefined' || !window.localStorage) return DEFAULT_DASHBOARD_CARDS;
  try {
    const raw = window.localStorage.getItem(DASHBOARD_CARDS_KEY);
    if (!raw) return DEFAULT_DASHBOARD_CARDS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_DASHBOARD_CARDS;
    const knownIds = new Set(DEFAULT_DASHBOARD_CARDS.map((c) => c.id));
    const filtered = parsed.filter(
      (c): c is DashboardCardSetting => Boolean(c && knownIds.has(c.id)),
    );
    const present = new Set(filtered.map((c) => c.id));
    return [...filtered, ...DEFAULT_DASHBOARD_CARDS.filter((c) => !present.has(c.id))];
  } catch {
    return DEFAULT_DASHBOARD_CARDS;
  }
}

export function saveDashboardCards(cards: DashboardCardSetting[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(DASHBOARD_CARDS_KEY, JSON.stringify(cards));
  } catch {
    // Ignore
  }
}

export function buildUnifiedTimeline(params: {
  p2pRecords: P2PQuakeRecord[];
  jmaQuakes: JmaQuakeSummaryItem[];
  jmaTsunamis: JmaTsunamiSummaryItem[];
  xmlBulletins: JmaXmlBulletin[];
  lang: AppLanguage;
}): UnifiedTimelineEvent[] {
  const { p2pRecords, jmaQuakes, jmaTsunamis, xmlBulletins, lang } = params;
  const events: UnifiedTimelineEvent[] = [];

  for (const r of p2pRecords.slice(0, 40)) {
    const rawJpTitle = getRecordTitle(r, 'ja');
    const locTitle = getRecordTitle(r, lang);
    const severity: UnifiedTimelineEvent['severity'] =
      r.code === 556 && !r.cancelled
        ? 'critical'
        : r.code === 552 && !r.cancelled
        ? 'warning'
        : r.code === 551 && r.earthquake.maxScale >= 45
        ? 'warning'
        : 'info';

    events.push({
      id: `p2p:${r.id}`,
      timestampIso: r.time,
      category: r.code === 556 || r.code === 554 ? 'eew' : r.code === 552 ? 'tsunami' : 'quake',
      sourceName: 'P2PQuake v2',
      title: locTitle,
      rawJapaneseTitle: rawJpTitle,
      summary:
        r.code === 551
          ? `M${r.earthquake.hypocenter.magnitude > 0 ? r.earthquake.hypocenter.magnitude.toFixed(1) : '--'}`
          : '',
      severity,
      isTest: Boolean(r.isTest),
      jumpView: 'quake',
    });
  }

  for (const jq of jmaQuakes.slice(0, 20)) {
    const isSpecial =
      jq.subKind === 'nankai_trough' || jq.subKind === 'hokkaido_sanriku';
    events.push({
      id: `jmaq:${jq.id}`,
      timestampIso: jq.reportDatetime,
      category: 'quake',
      sourceName: '気象庁 (JMA)',
      title:
        lang === 'en' && jq.enTitle
          ? `${jq.enTitle}: ${jq.enEpicenter || jq.epicenter}`
          : `${jq.title}: ${jq.epicenter}`,
      rawJapaneseTitle: `${jq.title} ${jq.epicenter} (${jq.issueType})`,
      summary: jq.magnitude !== null ? `M${jq.magnitude.toFixed(1)}` : '',
      severity: isSpecial ? 'warning' : 'info',
      isTest: false,
      officialUrl: 'https://www.jma.go.jp/bosai/map.html#contents=earthquake_map',
      jumpView: 'quake',
    });
  }

  for (const ts of jmaTsunamis.slice(0, 10)) {
    events.push({
      id: `jmats:${ts.id}`,
      timestampIso: ts.reportDatetime,
      category: 'tsunami',
      sourceName: '気象庁 津波JSON',
      title:
        lang === 'en' && ts.enTitle
          ? `${ts.enTitle} (${ts.enEpicenter || ts.epicenter})`
          : `${ts.title}（${ts.epicenter}）`,
      rawJapaneseTitle: `${ts.title} ${ts.epicenter}: ${ts.headlineText}`,
      summary: ts.headlineText,
      severity:
        ts.highestSeverity === 'major_warning' || ts.highestSeverity === 'warning'
          ? 'critical'
          : ts.highestSeverity === 'watch'
          ? 'warning'
          : 'info',
      isTest: false,
      officialUrl: 'https://www.jma.go.jp/bosai/map.html#contents=tsunami',
      jumpView: 'tsunami',
    });
  }

  for (const b of xmlBulletins.slice(0, 60)) {
    const category: UnifiedTimelineEvent['category'] =
      b.category === 'volcano'
        ? 'volcano'
        : b.category === 'typhoon'
        ? 'typhoon'
        : b.category === 'landslide' || b.category === 'flood_river' || b.category === 'heavy_rain'
        ? 'landslide_flood'
        : b.category === 'quake_special'
        ? 'quake'
        : 'weather_warning';

    const severity: UnifiedTimelineEvent['severity'] =
      b.title.includes('特別警報') || b.title.includes('噴火速報')
        ? 'critical'
        : b.title.includes('警報') || b.title.includes('警戒') || b.title.includes('氾濫')
        ? 'warning'
        : 'info';

    events.push({
      id: `xml:${b.id}`,
      timestampIso: b.updatedAt,
      category,
      sourceName: `JMAXML (${b.channel})`,
      title: b.title,
      rawJapaneseTitle: `${b.title} — ${b.headline}`,
      summary: b.headline,
      severity,
      isTest: false,
      officialUrl: b.link,
      jumpView:
        b.category === 'volcano'
          ? 'volcano'
          : b.category === 'typhoon' || b.category === 'marine'
          ? 'typhoon'
          : b.category === 'landslide' || b.category === 'flood_river' || b.category === 'heavy_rain'
          ? 'hazards'
          : 'weather',
    });
  }

  return events.sort((a, b) => (b.timestampIso || '').localeCompare(a.timestampIso || ''));
}
