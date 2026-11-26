export type WeatherRegionGroup =
  | 'hokkaido'
  | 'tohoku'
  | 'kanto'
  | 'chubu'
  | 'kinki'
  | 'chugoku'
  | 'shikoku'
  | 'kyushu_okinawa';

export interface JapanWeatherOffice {
  officeCode: string;
  name: string;
  prefectureName: string;
  regionGroup: WeatherRegionGroup;
  defaultAreaCode: string;
  amedasId: string;
  stationName: string;
  lat: number;
  lon: number;
}

export type SourceStatus = 'idle' | 'loading' | 'ok' | 'stale' | 'error';

export interface SourceMeta {
  status: SourceStatus;
  sourceName: string;
  publishedAt: string | null; // ISO or formatted timestamp from API
  fetchedAt: Date | null;
  isStale: boolean;
  staleReason: string | null;
  errorMessage: string | null;
  dataKind: 'observation' | 'official_forecast' | 'official_warning' | 'model_forecast';
}

export type WarningLevel = 'special' | 'warning' | 'advisory';

export interface WeatherWarningItem {
  code: string;
  name: string;
  level: WarningLevel;
  status: string; // e.g. '発表' | '継続' | '解除'
  areaCode: string;
  areaName: string;
}

export interface JmaWarningAreaGroup {
  areaCode: string;
  areaName: string;
  items: WeatherWarningItem[];
  hasNoWarningsFlag: boolean;
}

export interface JmaWarningBundle {
  meta: SourceMeta;
  publishingOffice: string;
  headlineText: string;
  areaGroups: JmaWarningAreaGroup[];
  activeSpecialWarnings: WeatherWarningItem[];
  activeWarnings: WeatherWarningItem[];
  activeAdvisories: WeatherWarningItem[];
}

export interface JmaShortForecastDay {
  dateIso: string;
  label: string;
  weatherCode: string;
  weatherText: string;
  windText: string;
  waveText: string;
  tempMin: number | null;
  tempMax: number | null;
}

export interface JmaPopSlot {
  timeIso: string;
  label: string;
  pop: number | null;
}

export interface JmaWeeklyForecastDay {
  dateIso: string;
  label: string;
  weatherCode: string;
  weatherLabel: string;
  pop: number | null;
  tempMin: number | null;
  tempMax: number | null;
  reliability: string;
}

export interface JmaSubAreaOption {
  code: string;
  name: string;
}

export interface JmaForecastBundle {
  meta: SourceMeta;
  publishingOffice: string;
  subAreas: JmaSubAreaOption[];
  activeAreaCode: string;
  activeAreaName: string;
  shortDays: JmaShortForecastDay[];
  popSlots: JmaPopSlot[];
  weeklyDays: JmaWeeklyForecastDay[];
}

export interface AmedasObservation {
  meta: SourceMeta;
  stationId: string;
  stationName: string;
  observedAtIso: string | null;
  tempC: number | null;
  humidityPct: number | null;
  pressureHpa: number | null; // normalPressure (sea-level)
  stationPressureHpa: number | null;
  windSpeedMs: number | null;
  windDirectionText: string | null;
  precipitation1hMm: number | null;
  precipitation24hMm: number | null;
  snowDepthCm?: number | null;
  snow1hCm?: number | null;
  snow24hCm?: number | null;
  sunshine1hMin?: number | null;
  maxGustMs?: number | null;
}

export interface HourlyWeatherPoint {
  timeIso: string;
  hourLabel: string;
  tempC: number;
  popPct: number;
  precipitationMm: number;
  weatherCode: number;
}

export interface OpenMeteoDailyPoint {
  dateIso: string;
  label: string;
  weatherCode: number;
  weatherLabel: string;
  tempMaxC: number | null;
  tempMinC: number | null;
  precipitationSumMm: number | null;
  popMaxPct: number | null;
}

export interface OpenMeteoBundle {
  meta: SourceMeta;
  current: {
    timeIso: string;
    tempC: number | null;
    humidityPct: number | null;
    pressureMslHpa: number | null;
    surfacePressureHpa: number | null;
    windSpeedMs: number | null;
    windDirectionDeg: number | null;
    windDirectionText: string | null;
    precipitationMm: number | null;
    weatherCode: number | null;
    weatherLabel: string;
    windGustMs?: number | null;
    visibilityM?: number | null;
    uvIndex?: number | null;
    apparentTempC?: number | null;
    snowfallCm?: number | null;
  } | null;
  hourly24h: HourlyWeatherPoint[];
  daily7d: OpenMeteoDailyPoint[];
}

export interface PrefectureOverviewRow {
  office: JapanWeatherOffice;
  amedasTempC: number | null;
  amedasWindMs: number | null;
  amedasWindDir: string | null;
  amedasPrecip1h: number | null;
  forecastStatus: SourceStatus;
  weatherCode: string | null;
  weatherText: string | null;
  popMaxPct: number | null;
  tempMinC: number | null;
  tempMaxC: number | null;
  warningStatus: SourceStatus;
  specialCount: number;
  warningCount: number;
  advisoryCount: number;
}
