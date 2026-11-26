import { JAPAN_WEATHER_OFFICES } from '../data/japanWeatherRegions';
import type {
  AmedasObservation,
  JapanWeatherOffice,
  JmaForecastBundle,
  JmaWarningBundle,
  OpenMeteoBundle,
  PrefectureOverviewRow,
} from '../types/weather';
import {
  createErrorMeta,
  parseAmedasObservation,
  parseJmaForecast,
  parseJmaWarning,
  parseOpenMeteoBundle,
} from './weatherParser';
import { setSourceStatus } from './sourceHealthTracker';

const CACHE_TTL_MS = {
  areaConst: 60 * 60 * 1000, // 60 min
  amedasMap: 3 * 60 * 1000, // 3 min
  forecast: 5 * 60 * 1000, // 5 min
  warning: 5 * 60 * 1000, // 5 min
  openMeteo: 5 * 60 * 1000, // 5 min
};

const REQUEST_TIMEOUT_MS = 12_000;

interface CacheEntry<T> {
  value: T;
  fetchedAtMs: number;
  expiresAtMs: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();
const inflightMap = new Map<string, Promise<unknown>>();

export interface AmedasMapSnapshot {
  observedAtIso: string;
  mapJson: Record<string, unknown>;
  fetchedAt: Date;
}

export interface OfficeWeatherDetailResult {
  forecast: JmaForecastBundle;
  warning: JmaWarningBundle;
  amedas: AmedasObservation;
  openMeteo: OpenMeteoBundle;
  fetchedAt: Date;
}

async function fetchJsonWithTimeout(url: string, acceptText = false): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return acceptText ? await res.text() : await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function cachedFetch<T>(
  cacheKey: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
  forceRefresh = false,
): Promise<{ data: T; fetchedAt: Date }> {
  const now = Date.now();
  if (!forceRefresh) {
    const hit = memoryCache.get(cacheKey) as CacheEntry<T> | undefined;
    if (hit && hit.expiresAtMs > now) {
      return { data: hit.value, fetchedAt: new Date(hit.fetchedAtMs) };
    }
  }

  const existing = inflightMap.get(cacheKey) as Promise<{ data: T; fetchedAt: Date }> | undefined;
  if (existing && !forceRefresh) {
    return existing;
  }

  const promise = (async () => {
    const value = await fetcher();
    const fetchedAtMs = Date.now();
    memoryCache.set(cacheKey, {
      value,
      fetchedAtMs,
      expiresAtMs: fetchedAtMs + ttlMs,
    });
    return { data: value, fetchedAt: new Date(fetchedAtMs) };
  })().finally(() => {
    inflightMap.delete(cacheKey);
  });

  inflightMap.set(cacheKey, promise);
  return promise;
}

export function formatAmedasLatestTimestampToKey(isoText: string): string {
  const ms = Date.parse(isoText.trim());
  if (!Number.isFinite(ms)) {
    throw new Error('アメダス最新時刻の形式が不正です。');
  }
  const jst = new Date(ms + 9 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${jst.getUTCFullYear()}` +
    `${pad(jst.getUTCMonth() + 1)}` +
    `${pad(jst.getUTCDate())}` +
    `${pad(jst.getUTCHours())}` +
    `${pad(jst.getUTCMinutes())}` +
    `${pad(jst.getUTCSeconds())}`
  );
}

export async function fetchJmaAreaNameMap(forceRefresh = false): Promise<Record<string, string>> {
  try {
    const { data } = await cachedFetch<Record<string, string>>(
      'jma:areaNameMap',
      CACHE_TTL_MS.areaConst,
      async () => {
        const raw = (await fetchJsonWithTimeout(
          'https://www.jma.go.jp/bosai/common/const/area.json',
        )) as Record<string, Record<string, { name?: string }>>;

        const map: Record<string, string> = {};
        for (const groupKey of ['offices', 'class10s', 'class15s', 'class20s']) {
          const group = raw?.[groupKey];
          if (group && typeof group === 'object') {
            for (const [code, entry] of Object.entries(group)) {
              if (entry?.name) {
                map[code] = entry.name;
              }
            }
          }
        }
        return map;
      },
      forceRefresh,
    );
    return data;
  } catch {
    return {};
  }
}

export async function fetchAmedasMapSnapshot(forceRefresh = false): Promise<AmedasMapSnapshot> {
  const { data, fetchedAt } = await cachedFetch<{
    observedAtIso: string;
    mapJson: Record<string, unknown>;
  }>(
    'jma:amedasMap',
    CACHE_TTL_MS.amedasMap,
    async () => {
      const latestTxt = (await fetchJsonWithTimeout(
        'https://www.jma.go.jp/bosai/amedas/data/latest_time.txt',
        true,
      )) as string;
      const observedAtIso = latestTxt.trim();
      const timeKey = formatAmedasLatestTimestampToKey(observedAtIso);
      const mapJson = (await fetchJsonWithTimeout(
        `https://www.jma.go.jp/bosai/amedas/data/map/${timeKey}.json`,
      )) as Record<string, unknown>;
      return { observedAtIso, mapJson };
    },
    forceRefresh,
  );

  return {
    observedAtIso: data.observedAtIso,
    mapJson: data.mapJson,
    fetchedAt,
  };
}

const FORECAST_OFFICE_OVERRIDES: Record<string, string> = {
  // 十勝地方 (014030) の天気予報JSONは釧路・根室・十勝まとめ (014100.json) に格納されている
  '014030': '014100',
  // 奄美地方 (460040) の天気予報JSONは鹿児島県まとめ (460100.json) に格納されている
  '460040': '460100',
};

export function resolveJmaForecastFileCode(officeCode: string): string {
  return FORECAST_OFFICE_OVERRIDES[officeCode] ?? officeCode;
}

export async function fetchJmaForecastRaw(
  officeCode: string,
  forceRefresh = false,
): Promise<{ data: unknown; fetchedAt: Date }> {
  const fileCode = resolveJmaForecastFileCode(officeCode);
  return cachedFetch(
    `jma:forecast:${fileCode}`,
    CACHE_TTL_MS.forecast,
    () =>
      fetchJsonWithTimeout(
        `https://www.jma.go.jp/bosai/forecast/data/forecast/${fileCode}.json`,
      ),
    forceRefresh,
  );
}

export async function fetchJmaWarningSystemTime(
  forceRefresh = false,
): Promise<string | null> {
  try {
    const { data } = await cachedFetch<string | null>(
      'jma:warningMapTime',
      2 * 60 * 1000,
      async () => {
        const raw = (await fetchJsonWithTimeout(
          'https://www.jma.go.jp/bosai/warning/data/r8/map_time.json',
        )) as Record<string, unknown>;
        return typeof raw?.latestControlDatetime === 'string'
          ? raw.latestControlDatetime
          : null;
      },
      forceRefresh,
    );
    return data;
  } catch {
    return null;
  }
}

async function fetchJmaxmlExtraIndex(
  longFeed = false,
  forceRefresh = false,
): Promise<Map<string, string>> {
  const url = longFeed
    ? 'https://www.data.jma.go.jp/developer/xml/feed/extra_l.xml'
    : 'https://www.data.jma.go.jp/developer/xml/feed/extra.xml';
  const cacheKey = longFeed ? 'jma:xmlExtraLongIndex' : 'jma:xmlExtraIndex';

  const { data } = await cachedFetch<Map<string, string>>(
    cacheKey,
    longFeed ? 5 * 60 * 1000 : 3 * 60 * 1000,
    async () => {
      const xml = (await fetchJsonWithTimeout(url, true)) as string;
      const officeToUrl = new Map<string, string>();
      for (const match of xml.matchAll(/<id>(https:\/\/www\.data\.jma\.go\.jp\/developer\/xml\/data\/[^<]+_VPWW5[34]_(\d{6})\.xml)<\/id>/g)) {
        const entryUrl = match[1];
        const officeCode = match[2];
        // Prefer VPWW53 over VPWW54 when both appear; feed is ordered newest first
        if (!officeToUrl.has(officeCode) || entryUrl.includes('_VPWW53_')) {
          if (!officeToUrl.get(officeCode)?.includes('_VPWW53_')) {
            officeToUrl.set(officeCode, entryUrl);
          }
        }
      }
      return officeToUrl;
    },
    forceRefresh,
  );
  return data;
}

async function fetchJmaxmlWarningFallback(
  officeCode: string,
  forceRefresh = false,
): Promise<string> {
  const shortIndex = await fetchJmaxmlExtraIndex(false, forceRefresh);
  let detailUrl = shortIndex.get(officeCode);
  if (!detailUrl) {
    const longIndex = await fetchJmaxmlExtraIndex(true, forceRefresh);
    detailUrl = longIndex.get(officeCode);
  }
  if (!detailUrl) {
    throw new Error(`JMAXMLフィード内に管区 ${officeCode} の警報電文が見つかりませんでした。`);
  }
  return (await fetchJsonWithTimeout(detailUrl, true)) as string;
}

export async function fetchJmaWarningRaw(
  officeCode: string,
  forceRefresh = false,
): Promise<{ data: unknown; fetchedAt: Date }> {
  return cachedFetch(
    `jma:warning:${officeCode}`,
    CACHE_TTL_MS.warning,
    async () => {
      try {
        return await fetchJsonWithTimeout(
          `https://www.jma.go.jp/bosai/warning/data/r8/${officeCode}.json`,
        );
      } catch {
        // Fallback to JMAXML official XML feed if r8 JSON endpoint fails
        return await fetchJmaxmlWarningFallback(officeCode, forceRefresh);
      }
    },
    forceRefresh,
  );
}

export async function fetchOpenMeteoRaw(
  office: JapanWeatherOffice,
  forceRefresh = false,
): Promise<{ data: unknown; fetchedAt: Date }> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${office.lat}&longitude=${office.lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation,snowfall,weather_code,visibility,uv_index` +
    `&hourly=temperature_2m,precipitation_probability,precipitation,weather_code` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max` +
    `&wind_speed_unit=ms&timezone=Asia%2FTokyo&forecast_days=8`;

  return cachedFetch(
    `openmeteo:${office.officeCode}`,
    CACHE_TTL_MS.openMeteo,
    () => fetchJsonWithTimeout(url),
    forceRefresh,
  );
}

export async function fetchOfficeWeatherDetail(
  office: JapanWeatherOffice,
  preferredAreaCode?: string,
  forceRefresh = false,
): Promise<OfficeWeatherDetailResult> {
  const [areaRes, mapTimeRes, forecastRes, warningRes, amedasRes, openMeteoRes] =
    await Promise.allSettled([
      fetchJmaAreaNameMap(false),
      fetchJmaWarningSystemTime(forceRefresh),
      fetchJmaForecastRaw(office.officeCode, forceRefresh),
      fetchJmaWarningRaw(office.officeCode, forceRefresh),
      fetchAmedasMapSnapshot(forceRefresh),
      fetchOpenMeteoRaw(office, forceRefresh),
    ]);

  const areaNameMap = areaRes.status === 'fulfilled' ? areaRes.value : {};
  const systemControlDatetimeIso = mapTimeRes.status === 'fulfilled' ? mapTimeRes.value : null;
  const nowDate = new Date();

  const forecast: JmaForecastBundle =
    forecastRes.status === 'fulfilled'
      ? parseJmaForecast(
          forecastRes.value.data,
          office,
          preferredAreaCode,
          forecastRes.value.fetchedAt,
        )
      : {
          meta: createErrorMeta(
            '気象庁 防災情報JSON（天気予報）',
            'official_forecast',
            `取得エラー: ${forecastRes.reason instanceof Error ? forecastRes.reason.message : '通信に失敗しました'}`,
            nowDate,
          ),
          publishingOffice: office.name,
          subAreas: [],
          activeAreaCode: preferredAreaCode || office.defaultAreaCode,
          activeAreaName: office.prefectureName,
          shortDays: [],
          popSlots: [],
          weeklyDays: [],
        };

  const warning: JmaWarningBundle =
    warningRes.status === 'fulfilled'
      ? parseJmaWarning(
          warningRes.value.data,
          office,
          areaNameMap,
          warningRes.value.fetchedAt,
          Date.now(),
          systemControlDatetimeIso,
        )
      : {
          meta: createErrorMeta(
            '気象庁 防災情報JSON（R8警報・注意報）',
            'official_warning',
            `警報データの取得に失敗しました（${warningRes.reason instanceof Error ? warningRes.reason.message : '通信エラー'}）。警報なしとは断定できません。`,
            nowDate,
          ),
          publishingOffice: office.name,
          headlineText: '',
          areaGroups: [],
          activeSpecialWarnings: [],
          activeWarnings: [],
          activeAdvisories: [],
        };

  const amedas: AmedasObservation =
    amedasRes.status === 'fulfilled'
      ? parseAmedasObservation(
          amedasRes.value.mapJson,
          office,
          amedasRes.value.observedAtIso,
          amedasRes.value.fetchedAt,
        )
      : {
          meta: createErrorMeta(
            '気象庁 アメダス実測値',
            'observation',
            `アメダス取得エラー: ${amedasRes.reason instanceof Error ? amedasRes.reason.message : '通信に失敗しました'}`,
            nowDate,
          ),
          stationId: office.amedasId,
          stationName: office.stationName,
          observedAtIso: null,
          tempC: null,
          humidityPct: null,
          pressureHpa: null,
          stationPressureHpa: null,
          windSpeedMs: null,
          windDirectionText: null,
          precipitation1hMm: null,
          precipitation24hMm: null,
        };

  const openMeteo: OpenMeteoBundle =
    openMeteoRes.status === 'fulfilled'
      ? parseOpenMeteoBundle(openMeteoRes.value.data, openMeteoRes.value.fetchedAt)
      : {
          meta: createErrorMeta(
            'Open-Meteo 気象モデル予測',
            'model_forecast',
            `Open-Meteo取得エラー: ${openMeteoRes.reason instanceof Error ? openMeteoRes.reason.message : '通信に失敗しました'}`,
            nowDate,
          ),
          current: null,
          hourly24h: [],
          daily7d: [],
        };

  setSourceStatus(
    'jma_forecast_warning',
    warning.meta.status === 'error' && forecast.meta.status === 'error'
      ? 'fetch_failed'
      : warning.meta.isStale || forecast.meta.isStale
      ? 'expired'
      : 'normal',
    {
      lastFetchedAt: nowDate,
      publishedAt: warning.meta.publishedAt ?? forecast.meta.publishedAt,
      errorMessage:
        warning.meta.status === 'error'
          ? warning.meta.errorMessage
          : forecast.meta.errorMessage,
    },
  );
  setSourceStatus(
    'jma_amedas',
    amedas.meta.status === 'error'
      ? 'fetch_failed'
      : amedas.meta.isStale
      ? 'expired'
      : 'normal',
    {
      lastFetchedAt: nowDate,
      publishedAt: amedas.observedAtIso,
      errorMessage: amedas.meta.errorMessage,
    },
  );
  setSourceStatus(
    'openmeteo_suite',
    openMeteo.meta.status === 'error' ? 'fetch_failed' : 'normal',
    {
      lastFetchedAt: nowDate,
      publishedAt: openMeteo.meta.publishedAt,
      errorMessage: openMeteo.meta.errorMessage,
    },
  );

  return {
    forecast,
    warning,
    amedas,
    openMeteo,
    fetchedAt: nowDate,
  };
}

export function buildOverviewRowFromCache(
  office: JapanWeatherOffice,
  amedasSnapshot: AmedasMapSnapshot | null,
  areaNameMap: Record<string, string>,
  systemControlDatetimeIso: string | null = null,
): PrefectureOverviewRow {
  const amedas = amedasSnapshot
    ? parseAmedasObservation(
        amedasSnapshot.mapJson,
        office,
        amedasSnapshot.observedAtIso,
        amedasSnapshot.fetchedAt,
      )
    : null;

  const forecastFileCode = resolveJmaForecastFileCode(office.officeCode);
  const forecastEntry = memoryCache.get(`jma:forecast:${forecastFileCode}`) as
    | CacheEntry<unknown>
    | undefined;
  const warningEntry = memoryCache.get(`jma:warning:${office.officeCode}`) as
    | CacheEntry<unknown>
    | undefined;

  const forecast = forecastEntry
    ? parseJmaForecast(
        forecastEntry.value,
        office,
        office.defaultAreaCode,
        new Date(forecastEntry.fetchedAtMs),
      )
    : null;
  const warning = warningEntry
    ? parseJmaWarning(
        warningEntry.value,
        office,
        areaNameMap,
        new Date(warningEntry.fetchedAtMs),
        Date.now(),
        systemControlDatetimeIso,
      )
    : null;

  const todayForecast = forecast?.shortDays[0] ?? null;
  const popMaxPct = forecast
    ? forecast.popSlots
        .map((p) => p.pop)
        .filter((v): v is number => v !== null)
        .reduce<number | null>((acc, v) => (acc === null ? v : Math.max(acc, v)), null)
    : null;

  return {
    office,
    amedasTempC: amedas?.tempC ?? null,
    amedasWindMs: amedas?.windSpeedMs ?? null,
    amedasWindDir: amedas?.windDirectionText ?? null,
    amedasPrecip1h: amedas?.precipitation1hMm ?? null,
    forecastStatus: forecast ? forecast.meta.status : 'idle',
    weatherCode: todayForecast?.weatherCode || null,
    weatherText: todayForecast?.weatherText || null,
    popMaxPct,
    tempMinC: todayForecast?.tempMin ?? null,
    tempMaxC: todayForecast?.tempMax ?? null,
    warningStatus: warning ? warning.meta.status : 'idle',
    specialCount: warning ? warning.activeSpecialWarnings.length : 0,
    warningCount: warning ? warning.activeWarnings.length : 0,
    advisoryCount: warning ? warning.activeAdvisories.length : 0,
  };
}

/**
 * Fetches forecast + warning summaries for a list of offices using bounded concurrency
 * (maxConcurrency = 3) and caches results to avoid excessive API load.
 */
export async function hydrateRegionOverviewOffices(
  offices: JapanWeatherOffice[],
  options: {
    forceRefresh?: boolean;
    maxConcurrency?: number;
    signal?: AbortSignal;
    onProgress?: (rows: PrefectureOverviewRow[]) => void;
  } = {},
): Promise<PrefectureOverviewRow[]> {
  const { forceRefresh = false, maxConcurrency = 3, signal, onProgress } = options;

  const amedasStart = Date.now();
  const [amedasSnapshot, areaNameMap, systemControlDatetimeIso] = await Promise.all([
    fetchAmedasMapSnapshot(forceRefresh).catch(() => null),
    fetchJmaAreaNameMap(false),
    fetchJmaWarningSystemTime(forceRefresh),
  ]);

  if (amedasSnapshot) {
    setSourceStatus('jma_amedas', 'normal', {
      lastFetchedAt: amedasSnapshot.fetchedAt,
      publishedAt: amedasSnapshot.observedAtIso,
      latencyMs: Date.now() - amedasStart,
      errorMessage: null,
    });
  }

  const emitSnapshot = () => {
    const rows = offices.map((office) =>
      buildOverviewRowFromCache(office, amedasSnapshot, areaNameMap, systemControlDatetimeIso),
    );
    onProgress?.(rows);
    return rows;
  };

  // Emit immediately with AMeDAS observation values + any cached forecasts
  emitSnapshot();

  const queue = [...offices];
  const workerCount = Math.min(maxConcurrency, queue.length);
  let forecastWarningSuccessCount = 0;
  let forecastWarningAttemptCount = 0;
  const forecastStart = Date.now();

  const workers = Array.from({ length: workerCount }, async () => {
    while (queue.length > 0) {
      if (signal?.aborted) return;
      const office = queue.shift();
      if (!office) return;
      forecastWarningAttemptCount += 1;
      const [fRes, wRes] = await Promise.allSettled([
        fetchJmaForecastRaw(office.officeCode, forceRefresh),
        fetchJmaWarningRaw(office.officeCode, forceRefresh),
      ]);
      if (fRes.status === 'fulfilled' || wRes.status === 'fulfilled') {
        forecastWarningSuccessCount += 1;
      }
      if (!signal?.aborted) {
        emitSnapshot();
      }
    }
  });

  await Promise.all(workers);

  if (!signal?.aborted && forecastWarningAttemptCount > 0) {
    if (forecastWarningSuccessCount > 0) {
      setSourceStatus('jma_forecast_warning', 'normal', {
        lastFetchedAt: new Date(),
        publishedAt: systemControlDatetimeIso,
        latencyMs: Date.now() - forecastStart,
        errorMessage: null,
      });
    } else {
      setSourceStatus('jma_forecast_warning', 'fetch_failed', {
        lastFetchedAt: new Date(),
        errorMessage: '天気予報・警報JSONの取得に失敗しました',
      });
    }
  }

  return emitSnapshot();
}

export function getAllWeatherOffices(): JapanWeatherOffice[] {
  return JAPAN_WEATHER_OFFICES;
}
