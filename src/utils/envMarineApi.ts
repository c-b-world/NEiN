import type {
  OpenMeteoAirQualityData,
  OpenMeteoMarineData,
} from '../types/disaster';
import type { JapanWeatherOffice } from '../types/weather';
import { setSourceStatus } from './sourceHealthTracker';

const envCache = new Map<string, { value: unknown; expiresAt: number }>();

function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function fetchJsonTimed(url: string): Promise<{ data: unknown; latencyMs: number }> {
  const t0 = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 11_000);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    const latencyMs = Math.round(performance.now() - t0);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { data: await res.json(), latencyMs };
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchOpenMeteoAirQuality(
  office: JapanWeatherOffice,
  forceRefresh = false,
): Promise<OpenMeteoAirQualityData> {
  const key = `aq:${office.officeCode}`;
  const hit = envCache.get(key);
  if (!forceRefresh && hit && hit.expiresAt > Date.now()) {
    return hit.value as OpenMeteoAirQualityData;
  }

  const url =
    `https://air-quality-api.open-meteo.com/v1/air-quality` +
    `?latitude=${office.lat}&longitude=${office.lon}` +
    `&current=pm2_5,pm10,dust,uv_index,european_aqi&timezone=Asia%2FTokyo`;

  try {
    const { data, latencyMs } = await fetchJsonTimed(url);
    const obj = data as { current?: Record<string, unknown> };
    const cur = obj.current ?? {};
    const result: OpenMeteoAirQualityData = {
      publishedAt: typeof cur.time === 'string' ? `${cur.time}+09:00` : null,
      fetchedAt: new Date(),
      isError: false,
      errorMessage: null,
      pm25: numOrNull(cur.pm2_5),
      pm10: numOrNull(cur.pm10),
      dust: numOrNull(cur.dust),
      uvIndex: numOrNull(cur.uv_index),
      europeanAqi: numOrNull(cur.european_aqi),
    };
    envCache.set(key, { value: result, expiresAt: Date.now() + 5 * 60 * 1000 });
    setSourceStatus('openmeteo_suite', 'normal', {
      lastFetchedAt: result.fetchedAt,
      publishedAt: result.publishedAt,
      latencyMs,
      cacheHit: false,
      errorMessage: null,
    });
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : '大気質データ取得失敗';
    setSourceStatus('openmeteo_suite', 'fetch_failed', {
      lastFetchedAt: new Date(),
      errorMessage: msg,
    });
    return {
      publishedAt: null,
      fetchedAt: new Date(),
      isError: true,
      errorMessage: msg,
      pm25: null,
      pm10: null,
      dust: null,
      uvIndex: null,
      europeanAqi: null,
    };
  }
}

export async function fetchOpenMeteoMarine(
  lat: number,
  lon: number,
  forceRefresh = false,
): Promise<OpenMeteoMarineData> {
  const key = `marine:${lat.toFixed(2)},${lon.toFixed(2)}`;
  const hit = envCache.get(key);
  if (!forceRefresh && hit && hit.expiresAt > Date.now()) {
    return hit.value as OpenMeteoMarineData;
  }

  const url =
    `https://marine-api.open-meteo.com/v1/marine` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=wave_height,wave_direction,wave_period,sea_surface_temperature,ocean_current_velocity,ocean_current_direction` +
    `&hourly=wave_height,sea_surface_temperature&timezone=Asia%2FTokyo&forecast_days=2`;

  try {
    const { data, latencyMs } = await fetchJsonTimed(url);
    const obj = data as {
      current?: Record<string, unknown>;
      hourly?: Record<string, unknown>;
    };
    const cur = obj.current ?? {};
    const hourly = obj.hourly ?? {};
    const times = Array.isArray(hourly.time) ? (hourly.time as string[]) : [];
    const waves = Array.isArray(hourly.wave_height) ? (hourly.wave_height as unknown[]) : [];
    const ssts = Array.isArray(hourly.sea_surface_temperature)
      ? (hourly.sea_surface_temperature as unknown[])
      : [];

    const hourlyWaves = times.slice(0, 24).map((t, i) => ({
      timeIso: t,
      label: t.length >= 16 ? t.slice(11, 16) : t,
      waveHeightM: numOrNull(waves[i]),
      seaSurfaceTempC: numOrNull(ssts[i]),
    }));

    const result: OpenMeteoMarineData = {
      publishedAt: typeof cur.time === 'string' ? `${cur.time}+09:00` : null,
      fetchedAt: new Date(),
      isError: false,
      errorMessage: null,
      waveHeightM: numOrNull(cur.wave_height),
      waveDirectionDeg: numOrNull(cur.wave_direction),
      wavePeriodSec: numOrNull(cur.wave_period),
      seaSurfaceTempC: numOrNull(cur.sea_surface_temperature),
      oceanCurrentVelocityMs: numOrNull(cur.ocean_current_velocity),
      oceanCurrentDirectionDeg: numOrNull(cur.ocean_current_direction),
      hourlyWaves,
    };
    envCache.set(key, { value: result, expiresAt: Date.now() + 5 * 60 * 1000 });
    setSourceStatus('openmeteo_suite', 'normal', {
      lastFetchedAt: result.fetchedAt,
      publishedAt: result.publishedAt,
      latencyMs,
      cacheHit: false,
      errorMessage: null,
    });
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : '海洋気象データ取得失敗';
    return {
      publishedAt: null,
      fetchedAt: new Date(),
      isError: true,
      errorMessage: msg,
      waveHeightM: null,
      waveDirectionDeg: null,
      wavePeriodSec: null,
      seaSurfaceTempC: null,
      oceanCurrentVelocityMs: null,
      oceanCurrentDirectionDeg: null,
      hourlyWaves: [],
    };
  }
}
