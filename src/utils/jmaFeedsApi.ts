import type {
  AmedasStationPoint,
  JmaQuakeSummaryItem,
  JmaTsunamiSummaryItem,
  JmaXmlBulletin,
  JmaXmlFeedChannel,
  TyphoonActiveInfo,
  VolcanoLocationEntry,
} from '../types/disaster';
import {
  mergeTsunamiDetail,
  parseJmaAtomFeed,
  parseJmaQuakeList,
  parseJmaTsunamiList,
  parseTyphoonListJson,
  parseVolcanoListJson,
} from './jmaFeedsParser';
import { setSourceStatus } from './sourceHealthTracker';
import { fetchAmedasMapSnapshot } from './weatherApi';

const REQUEST_TIMEOUT_MS = 12_000;

interface CacheItem<T> {
  value: T;
  fetchedAtMs: number;
  expiresAtMs: number;
}

const feedCache = new Map<string, CacheItem<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

async function fetchWithTiming(
  url: string,
  asText = false,
): Promise<{ payload: unknown; latencyMs: number }> {
  const start = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
    });
    const latencyMs = Math.round(performance.now() - start);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const payload = asText ? await res.text() : await res.json();
    return { payload, latencyMs };
  } finally {
    clearTimeout(timer);
  }
}

async function cachedCall<T>(
  key: string,
  ttlMs: number,
  sourceHealthId: string,
  fetcher: () => Promise<{ value: T; latencyMs: number; publishedAt: string | null }>,
  forceRefresh = false,
): Promise<T> {
  const now = Date.now();
  if (!forceRefresh) {
    const hit = feedCache.get(key) as CacheItem<T> | undefined;
    if (hit && hit.expiresAtMs > now) {
      setSourceStatus(sourceHealthId, 'normal', { cacheHit: true });
      return hit.value;
    }
  }

  const running = inflight.get(key) as Promise<T> | undefined;
  if (running && !forceRefresh) return running;

  setSourceStatus(sourceHealthId, 'updating');
  const promise = (async () => {
    try {
      const res = await fetcher();
      const fetchedAt = new Date();
      feedCache.set(key, {
        value: res.value,
        fetchedAtMs: fetchedAt.getTime(),
        expiresAtMs: fetchedAt.getTime() + ttlMs,
      });
      setSourceStatus(sourceHealthId, 'normal', {
        lastFetchedAt: fetchedAt,
        publishedAt: res.publishedAt,
        latencyMs: res.latencyMs,
        cacheHit: false,
        errorMessage: null,
      });
      return res.value;
    } catch (err) {
      const msg = err instanceof Error ? err.message : '通信エラー';
      setSourceStatus(sourceHealthId, 'fetch_failed', {
        lastFetchedAt: new Date(),
        errorMessage: msg,
        cacheHit: false,
      });
      throw err;
    }
  })().finally(() => {
    inflight.delete(key);
  });

  inflight.set(key, promise);
  return promise;
}

export async function fetchJmaQuakeFeed(forceRefresh = false): Promise<JmaQuakeSummaryItem[]> {
  return cachedCall(
    'jma:quake:list',
    2 * 60 * 1000,
    'jma_quake',
    async () => {
      const { payload, latencyMs } = await fetchWithTiming(
        'https://www.jma.go.jp/bosai/quake/data/list.json',
      );
      const parsed = parseJmaQuakeList(payload);
      return {
        value: parsed,
        latencyMs,
        publishedAt: parsed[0]?.reportDatetime ?? null,
      };
    },
    forceRefresh,
  );
}

export async function fetchJmaQuakeDetailRaw(jsonFile: string): Promise<unknown> {
  if (!jsonFile) return null;
  const key = `jma:quake:detail:${jsonFile}`;
  const hit = feedCache.get(key) as CacheItem<unknown> | undefined;
  if (hit && hit.expiresAtMs > Date.now()) return hit.value;
  const { payload } = await fetchWithTiming(
    `https://www.jma.go.jp/bosai/quake/data/${jsonFile}`,
  );
  feedCache.set(key, {
    value: payload,
    fetchedAtMs: Date.now(),
    expiresAtMs: Date.now() + 30 * 60 * 1000,
  });
  return payload;
}

export async function fetchJmaTsunamiFeed(forceRefresh = false): Promise<JmaTsunamiSummaryItem[]> {
  return cachedCall(
    'jma:tsunami:list',
    2 * 60 * 1000,
    'jma_tsunami',
    async () => {
      const { payload, latencyMs } = await fetchWithTiming(
        'https://www.jma.go.jp/bosai/tsunami/data/list.json',
      );
      const baseList = parseJmaTsunamiList(payload).slice(0, 12);
      // Hydrate the top 3 tsunami records with full area/arrival/height/observation details
      const hydrated = await Promise.all(
        baseList.map(async (item, idx) => {
          if (idx < 3 && item.jsonFile) {
            try {
              const detailRes = await fetchWithTiming(
                `https://www.jma.go.jp/bosai/tsunami/data/${item.jsonFile}`,
              );
              return mergeTsunamiDetail(item, detailRes.payload);
            } catch {
              return item;
            }
          }
          return item;
        }),
      );
      return {
        value: hydrated,
        latencyMs,
        publishedAt: hydrated[0]?.reportDatetime ?? null,
      };
    },
    forceRefresh,
  );
}

export async function fetchJmaTsunamiDetail(
  base: JmaTsunamiSummaryItem,
): Promise<JmaTsunamiSummaryItem> {
  if (!base.jsonFile) return base;
  const { payload } = await fetchWithTiming(
    `https://www.jma.go.jp/bosai/tsunami/data/${base.jsonFile}`,
  );
  return mergeTsunamiDetail(base, payload);
}

export async function fetchJmaXmlAllChannels(forceRefresh = false): Promise<JmaXmlBulletin[]> {
  return cachedCall(
    'jma:xml:allChannels',
    3 * 60 * 1000,
    'jma_xml_feeds',
    async () => {
      const channels: JmaXmlFeedChannel[] = ['eqvol', 'extra', 'other', 'regular'];
      let maxLatency = 0;
      const settled = await Promise.allSettled(
        channels.map(async (ch) => {
          const { payload, latencyMs } = await fetchWithTiming(
            `https://www.data.jma.go.jp/developer/xml/feed/${ch}.xml`,
            true,
          );
          maxLatency = Math.max(maxLatency, latencyMs);
          return parseJmaAtomFeed(String(payload), ch, 60);
        }),
      );

      const combined: JmaXmlBulletin[] = [];
      let anySuccess = false;
      for (const s of settled) {
        if (s.status === 'fulfilled') {
          anySuccess = true;
          combined.push(...s.value);
        }
      }
      if (!anySuccess) {
        throw new Error('JMAXML全フィードの取得に失敗しました');
      }
      combined.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      return {
        value: combined,
        latencyMs: maxLatency,
        publishedAt: combined[0]?.updatedAt ?? null,
      };
    },
    forceRefresh,
  );
}

export async function fetchVolcanoDirectory(forceRefresh = false): Promise<VolcanoLocationEntry[]> {
  const xmlBulletins = await fetchJmaXmlAllChannels(false).catch(() => []);
  const volcanoBulletins = xmlBulletins.filter((b) => b.category === 'volcano');

  return cachedCall(
    'jma:volcano:directory',
    10 * 60 * 1000,
    'jma_typhoon_volcano',
    async () => {
      const { payload, latencyMs } = await fetchWithTiming(
        'https://www.jma.go.jp/bosai/volcano/const/volcano_list.json',
      );
      const list = parseVolcanoListJson(payload, volcanoBulletins);
      return {
        value: list,
        latencyMs,
        publishedAt: volcanoBulletins[0]?.updatedAt ?? null,
      };
    },
    forceRefresh,
  );
}

export async function fetchTyphoonFeed(forceRefresh = false): Promise<TyphoonActiveInfo[]> {
  const xmlBulletins = await fetchJmaXmlAllChannels(false).catch(() => []);
  return cachedCall(
    'jma:typhoon:list',
    5 * 60 * 1000,
    'jma_typhoon_volcano',
    async () => {
      const { payload, latencyMs } = await fetchWithTiming(
        'https://www.jma.go.jp/bosai/information/data/typhoon.json',
      );
      const list = parseTyphoonListJson(payload, xmlBulletins);
      return {
        value: list,
        latencyMs,
        publishedAt: list[0]?.reportDatetime ?? null,
      };
    },
    forceRefresh,
  );
}

export async function fetchWeatherOverviewText(officeCode: string): Promise<{
  headlineText: string;
  text: string;
  reportDatetime: string;
} | null> {
  try {
    const code = officeCode === '014030' ? '014100' : officeCode === '460040' ? '460100' : officeCode;
    const key = `jma:overview:${code}`;
    const hit = feedCache.get(key) as CacheItem<{
      headlineText: string;
      text: string;
      reportDatetime: string;
    }> | undefined;
    if (hit && hit.expiresAtMs > Date.now()) return hit.value;

    const { payload } = await fetchWithTiming(
      `https://www.jma.go.jp/bosai/forecast/data/overview_forecast/${code}.json`,
    );
    const r = payload as Record<string, unknown>;
    const val = {
      headlineText: typeof r?.headlineText === 'string' ? r.headlineText : '',
      text: typeof r?.text === 'string' ? r.text : '',
      reportDatetime: typeof r?.reportDatetime === 'string' ? r.reportDatetime : '',
    };
    feedCache.set(key, {
      value: val,
      fetchedAtMs: Date.now(),
      expiresAtMs: Date.now() + 10 * 60 * 1000,
    });
    return val;
  } catch {
    return null;
  }
}

export async function fetchNationwideAmedasPoints(
  forceRefresh = false,
): Promise<{ observedAtIso: string; points: AmedasStationPoint[] }> {
  const [tableRes, snapshot] = await Promise.all([
    cachedCall(
      'jma:amedas:table',
      60 * 60 * 1000,
      'jma_amedas',
      async () => {
        const { payload, latencyMs } = await fetchWithTiming(
          'https://www.jma.go.jp/bosai/amedas/const/amedastable.json',
        );
        return {
          value: payload as Record<string, Record<string, unknown>>,
          latencyMs,
          publishedAt: null,
        };
      },
      false,
    ),
    fetchAmedasMapSnapshot(forceRefresh),
  ]);

  const points: AmedasStationPoint[] = [];
  const mapJson = snapshot.mapJson as Record<string, Record<string, unknown>>;

  const readVal = (t: unknown): number | null => {
    if (!Array.isArray(t) || t.length === 0) return null;
    const v = Number(t[0]);
    const f = t.length > 1 ? Number(t[1]) : 0;
    if (!Number.isFinite(v) || (Number.isFinite(f) && f !== 0)) return null;
    return v;
  };

  for (const [id, meta] of Object.entries(tableRes)) {
    const latArr = Array.isArray(meta.lat) ? meta.lat : [];
    const lonArr = Array.isArray(meta.lon) ? meta.lon : [];
    const lat = Number(latArr[0]) + Number(latArr[1] ?? 0) / 60;
    const lon = Number(lonArr[0]) + Number(lonArr[1] ?? 0) / 60;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const obs = mapJson[id];
    points.push({
      id,
      nameJp: typeof meta.kjName === 'string' ? meta.kjName : id,
      nameEn: typeof meta.enName === 'string' ? meta.enName : id,
      lat,
      lon,
      tempC: obs ? readVal(obs.temp) : null,
      windMs: obs ? readVal(obs.wind) : null,
      precip1hMm: obs ? readVal(obs.precipitation1h) : null,
      snowCm: obs ? readVal(obs.snow) : null,
    });
  }

  setSourceStatus('jma_amedas', 'normal', {
    lastFetchedAt: snapshot.fetchedAt,
    publishedAt: snapshot.observedAtIso,
  });

  return { observedAtIso: snapshot.observedAtIso, points };
}
