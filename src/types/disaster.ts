import type { AppLanguage } from '../utils/i18n';

export type FeedHealthStatus =
  | 'normal'
  | 'connecting'
  | 'updating'
  | 'delayed'
  | 'disconnected'
  | 'fetch_failed'
  | 'unfetched'
  | 'unsupported'
  | 'maintenance'
  | 'expired';

export interface SourceHealthRecord {
  id: string;
  name: Record<AppLanguage, string>;
  provider: string;
  category:
    | 'quake_tsunami'
    | 'weather'
    | 'radar_satellite'
    | 'hazard_volcano'
    | 'marine_env'
    | 'map_shelter';
  status: FeedHealthStatus;
  lastFetchedAt: Date | null;
  publishedAt: string | null;
  intervalSec: number | null;
  latencyMs: number | null;
  cacheHit: boolean;
  errorMessage: string | null;
  officialUrl: string;
  attribution: string;
  note?: Record<AppLanguage, string>;
}

export type JmaQuakeSubKind =
  | 'domestic'
  | 'distant'
  | 'long_period'
  | 'nankai_trough'
  | 'hokkaido_sanriku'
  | 'intensity_summary'
  | 'other';

export interface JmaQuakeSummaryItem {
  id: string;
  eventId: string;
  title: string;
  enTitle: string;
  issueType: string;
  serial: string;
  reportDatetime: string;
  originDatetime: string;
  epicenter: string;
  enEpicenter: string;
  coordinatesRaw: string;
  latitude: number | null;
  longitude: number | null;
  depthKm: number | null;
  magnitude: number | null;
  maxIntensity: string;
  subKind: JmaQuakeSubKind;
  isCorrected: boolean;
  isCancelled: boolean;
  jsonFile: string;
  headlineText?: string;
  commentsText?: string;
  maxLgScale?: string;
}

export type TsunamiSeverity = 'major_warning' | 'warning' | 'watch' | 'forecast' | 'lifted';

export interface TsunamiForecastAreaItem {
  areaCode: string;
  areaName: string;
  enAreaName: string;
  kindName: string;
  enKindName: string;
  kindCode: string;
  severity: TsunamiSeverity;
  maxHeight: string | null;
  arrivalTime: string | null;
  condition: string | null;
  lat: number | null;
  lon: number | null;
}

export interface TsunamiObservationPointItem {
  stationName: string;
  areaName: string;
  maxHeight: string | null;
  observedAt: string | null;
  isOffshore: boolean;
}

export interface JmaTsunamiSummaryItem {
  id: string;
  eventId: string;
  title: string;
  enTitle: string;
  issueType: string;
  reportDatetime: string;
  validDatetime: string | null;
  originDatetime: string | null;
  epicenter: string;
  enEpicenter: string;
  magnitude: number | null;
  jsonFile: string;
  headlineText: string;
  highestSeverity: TsunamiSeverity;
  areas: TsunamiForecastAreaItem[];
  observations: TsunamiObservationPointItem[];
}

export type JmaXmlFeedChannel = 'eqvol' | 'extra' | 'other' | 'regular';

export type JmaXmlBulletinCategory =
  | 'quake_special'
  | 'volcano'
  | 'typhoon'
  | 'landslide'
  | 'heavy_rain'
  | 'flood_river'
  | 'tornado'
  | 'marine'
  | 'early_warning'
  | 'general_weather'
  | 'seasonal'
  | 'environment'
  | 'other';

export interface JmaXmlBulletin {
  id: string;
  channel: JmaXmlFeedChannel;
  category: JmaXmlBulletinCategory;
  title: string;
  updatedAt: string;
  author: string;
  headline: string;
  link: string;
}

export interface VolcanoLocationEntry {
  code: string;
  nameJp: string;
  nameEn: string;
  lat: number;
  lon: number;
  latestBulletin: JmaXmlBulletin | null;
  alertLevelText: string | null;
  alertLevelNum: number | null;
}

export interface TyphoonForecastCircle {
  validTime: string;
  lat: number;
  lon: number;
  radiusKm: number | null;
  centralPressureHpa: number | null;
  maxWindMs: number | null;
  gustMs: number | null;
}

export interface TyphoonActiveInfo {
  id: string;
  eventId: string;
  typhoonNumber: string;
  nameJp: string;
  nameEn: string;
  headTitle: string;
  reportDatetime: string;
  infoType: string;
  isTropicalDepression: boolean;
  isDissipated: boolean;
  isExpired: boolean;
  currentLat: number | null;
  currentLon: number | null;
  centralPressureHpa: number | null;
  maxWindMs: number | null;
  gustMs: number | null;
  movementDir: string | null;
  movementSpeedKmh: number | null;
  stormRadiusKm: number | null;
  galeRadiusKm: number | null;
  forecastTrack: TyphoonForecastCircle[];
  rawXmlLink?: string;
}

export interface JmaTileTimeEntry {
  basetime: string;
  validtime: string;
  member: string;
  elements: string[];
  labelJst: string;
}

export interface JmaWeatherMapCatalog {
  nearNow: string[];
  nearFt24: string[];
  nearFt48: string[];
  asiaNow: string[];
  asiaFt24: string[];
  asiaFt48: string[];
}

export interface AmedasStationPoint {
  id: string;
  nameJp: string;
  nameEn: string;
  lat: number;
  lon: number;
  tempC: number | null;
  windMs: number | null;
  precip1hMm: number | null;
  snowCm: number | null;
}

export interface EvacuationShelterFeature {
  id: string;
  name: string;
  address: string;
  remarks: string;
  lat: number;
  lon: number;
  disasters: {
    flood: boolean;
    landslide: boolean;
    stormSurge: boolean;
    earthquake: boolean;
    tsunami: boolean;
    fire: boolean;
    inlandFlood: boolean;
    volcano: boolean;
  };
}

export interface OpenMeteoAirQualityData {
  publishedAt: string | null;
  fetchedAt: Date;
  isError: boolean;
  errorMessage: string | null;
  pm25: number | null;
  pm10: number | null;
  dust: number | null;
  uvIndex: number | null;
  europeanAqi: number | null;
}

export interface OpenMeteoMarineData {
  publishedAt: string | null;
  fetchedAt: Date;
  isError: boolean;
  errorMessage: string | null;
  waveHeightM: number | null;
  waveDirectionDeg: number | null;
  wavePeriodSec: number | null;
  seaSurfaceTempC: number | null;
  oceanCurrentVelocityMs: number | null;
  oceanCurrentDirectionDeg: number | null;
  hourlyWaves: Array<{
    timeIso: string;
    label: string;
    waveHeightM: number | null;
    seaSurfaceTempC: number | null;
  }>;
}

export interface RegisteredRegion {
  id: string;
  officeCode: string;
  areaCode: string;
  label: string;
  prefectureName: string;
  lat: number;
  lon: number;
  notifyEnabled: boolean;
}

export type NotificationCategoryKey =
  | 'quake'
  | 'eew'
  | 'tsunami'
  | 'weather_warning'
  | 'typhoon'
  | 'landslide_flood'
  | 'volcano'
  | 'heatstroke';

export interface NotificationHistoryEntry {
  id: string;
  category: NotificationCategoryKey;
  title: string;
  body: string;
  timestampIso: string;
  isTest: boolean;
  statusTag: 'issued' | 'updated' | 'corrected' | 'cancelled' | 'lifted';
  severity: 'critical' | 'warning' | 'info';
}

export interface NotificationPreferences {
  enabledCategories: Record<NotificationCategoryKey, boolean>;
  targetOfficeCodes: string[]; // empty = all nationwide
  minQuakeScale: number; // 0, 10, 20, 30, 40, 45, 50, 55, 60, 70
  warningLevelFilter: 'all' | 'warning_only' | 'special_only';
  chimeVolume: number; // 0.0 - 1.0
  desktopNotifications: boolean;
  inAppToasts: boolean;
}

export type MapLayerId =
  | 'quake_epicenters'
  | 'quake_intensity'
  | 'tsunami_areas'
  | 'weather_warnings'
  | 'rain_radar'
  | 'precip_forecast'
  | 'lightning_nowcast'
  | 'tornado_nowcast'
  | 'himawari_sat'
  | 'typhoon_track'
  | 'amedas_stations'
  | 'kikikuru_landslide'
  | 'kikikuru_inundation'
  | 'kikikuru_flood'
  | 'gsi_flood_hazard'
  | 'volcanoes'
  | 'evacuation_shelters';

export interface IntegratedMapConfig {
  baseStyle: 'gsi_std' | 'gsi_pale';
  centerLat: number;
  centerLon: number;
  zoom: number;
  enabledLayers: Record<MapLayerId, boolean>;
  layerOpacity: Record<MapLayerId, number>;
}

export type DashboardCardId =
  | 'urgent_alerts'
  | 'latest_quake'
  | 'tsunami_status'
  | 'weather_warnings'
  | 'registered_regions'
  | 'radar_preview'
  | 'typhoon_status'
  | 'volcano_status'
  | 'landslide_flood'
  | 'heat_environment'
  | 'timeline_preview'
  | 'api_health';

export interface DashboardCardSetting {
  id: DashboardCardId;
  visible: boolean;
  size: 'compact' | 'wide';
}

export interface UnifiedTimelineEvent {
  id: string;
  timestampIso: string;
  category: NotificationCategoryKey | 'info';
  sourceName: string;
  title: string;
  rawJapaneseTitle: string;
  summary: string;
  severity: 'critical' | 'warning' | 'advisory' | 'info';
  isTest: boolean;
  officialUrl?: string;
  jumpView?: string;
}
