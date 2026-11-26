import type {
  EvacuationShelterFeature,
  JmaTileTimeEntry,
  JmaWeatherMapCatalog,
} from '../types/disaster';
import { setSourceStatus } from './sourceHealthTracker';

const TILE_SIZE = 256;

export function jmaCompactUtcToIso(compact: string): string | null {
  if (!/^\d{14}$/.test(compact)) return null;
  const y = compact.slice(0, 4);
  const m = compact.slice(4, 6);
  const d = compact.slice(6, 8);
  const hh = compact.slice(8, 10);
  const mm = compact.slice(10, 12);
  const ss = compact.slice(12, 14);
  return `${y}-${m}-${d}T${hh}:${mm}:${ss}Z`;
}

/**
 * Formats JMA compact UTC timestamp "YYYYMMDDHHmmSS" into "MM/DD HH:mm JST".
 */
export function formatJmaCompactUtcToJst(compact: string): string {
  if (!/^\d{14}$/.test(compact)) return compact;
  const y = Number(compact.slice(0, 4));
  const m = Number(compact.slice(4, 6)) - 1;
  const d = Number(compact.slice(6, 8));
  const hh = Number(compact.slice(8, 10));
  const mm = Number(compact.slice(10, 12));
  const ss = Number(compact.slice(12, 14));
  const utcMs = Date.UTC(y, m, d, hh, mm, ss);
  const jst = new Date(utcMs + 9 * 60 * 60 * 1000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(jst.getUTCMonth() + 1)}/${p(jst.getUTCDate())} ${p(jst.getUTCHours())}:${p(jst.getUTCMinutes())} JST`;
}

/**
 * Returns the index of the latest live observation frame (basetime === validtime)
 * so merged observation+forecast lists open on live data instead of +60m forecast frames.
 */
export function findLiveObservationIndex(entries: JmaTileTimeEntry[]): number {
  if (entries.length === 0) return 0;
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].basetime === entries[i].validtime) {
      return i;
    }
  }
  return entries.length - 1;
}

export function lonToWorldX(lon: number, zoom: number): number {
  const n = 2 ** zoom;
  return ((lon + 180) / 360) * n * TILE_SIZE;
}

export function latToWorldY(lat: number, zoom: number): number {
  const clamped = Math.max(-85.0511, Math.min(85.0511, lat));
  const rad = (clamped * Math.PI) / 180;
  const n = 2 ** zoom;
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n * TILE_SIZE;
}

export function worldXYToLonLat(worldX: number, worldY: number, zoom: number): {
  lon: number;
  lat: number;
} {
  const n = 2 ** zoom;
  const lon = (worldX / (n * TILE_SIZE)) * 360 - 180;
  const mercN = Math.PI - (2 * Math.PI * worldY) / (n * TILE_SIZE);
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(mercN) - Math.exp(-mercN)));
  return { lon, lat };
}

export function computeVisibleTiles(
  centerLat: number,
  centerLon: number,
  zoom: number,
  viewportW: number,
  viewportH: number,
): Array<{ x: number; y: number; z: number; screenX: number; screenY: number }> {
  const z = Math.max(3, Math.min(16, Math.round(zoom)));
  const maxTile = 2 ** z;
  const cx = lonToWorldX(centerLon, z);
  const cy = latToWorldY(centerLat, z);
  const left = cx - viewportW / 2;
  const top = cy - viewportH / 2;
  const right = cx + viewportW / 2;
  const bottom = cy + viewportH / 2;

  const minTx = Math.floor(left / TILE_SIZE);
  const maxTx = Math.floor(right / TILE_SIZE);
  const minTy = Math.max(0, Math.floor(top / TILE_SIZE));
  const maxTy = Math.min(maxTile - 1, Math.floor(bottom / TILE_SIZE));

  const tiles: Array<{ x: number; y: number; z: number; screenX: number; screenY: number }> = [];
  for (let ty = minTy; ty <= maxTy; ty++) {
    for (let tx = minTx; tx <= maxTx; tx++) {
      const wrappedX = ((tx % maxTile) + maxTile) % maxTile;
      tiles.push({
        x: wrappedX,
        y: ty,
        z,
        screenX: tx * TILE_SIZE - left,
        screenY: ty * TILE_SIZE - top,
      });
    }
  }
  return tiles;
}

export function buildGsiTileUrl(
  style: 'gsi_std' | 'gsi_pale',
  z: number,
  x: number,
  y: number,
): string {
  const layer = style === 'gsi_pale' ? 'pale' : 'std';
  return `https://cyberjapandata.gsi.go.jp/xyz/${layer}/${z}/${x}/${y}.png`;
}

export function tileToLatLonBounds(z: number, x: number, y: number): {
  north: number;
  south: number;
  west: number;
  east: number;
} {
  const n = 2 ** z;
  const west = (x / n) * 360 - 180;
  const east = ((x + 1) / n) * 360 - 180;
  const toLat = (ty: number) => {
    const merc = Math.PI - (2 * Math.PI * ty) / n;
    return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(merc) - Math.exp(-merc)));
  };
  return {
    north: toLat(y),
    south: toLat(y + 1),
    west,
    east,
  };
}

// Coarse geographic bounding boxes covering Japan's populated islands (Hokkaido, Honshu/Shikoku/Kyushu, Okinawa/Nansei)
const JAPAN_LAND_BOXES: ReadonlyArray<{ north: number; south: number; west: number; east: number }> = [
  { south: 41.3, north: 45.6, west: 139.3, east: 145.9 }, // Hokkaido
  { south: 34.4, north: 41.6, west: 136.5, east: 142.2 }, // Tohoku / Kanto / Chubu
  { south: 32.7, north: 36.2, west: 129.0, east: 137.0 }, // Kinki / Chugoku / Shikoku / N. Kyushu
  { south: 30.8, north: 33.2, west: 128.5, east: 132.2 }, // S. Kyushu
  { south: 24.0, north: 30.9, west: 122.9, east: 131.3 }, // Nansei / Okinawa
];

export function isTileOverJapanLand(z: number, x: number, y: number): boolean {
  const b = tileToLatLonBounds(z, x, y);
  return JAPAN_LAND_BOXES.some(
    (box) => b.west <= box.east && b.east >= box.west && b.south <= box.north && b.north >= box.south,
  );
}

export function buildGsiFloodHazardTileUrl(z: number, x: number, y: number): string | null {
  // GSI Disaster Portal flood L2 depth raster supports zoom 2..17 and omits non-Japan ocean tiles (404)
  if (z < 2 || z > 17) return null;
  if (!isTileOverJapanLand(z, x, y)) return null;
  return `https://disaportaldata.gsi.go.jp/raster/01_flood_l2_shinsuishin_data/${z}/${x}/${y}.png`;
}

export function entrySupportsElement(entry: JmaTileTimeEntry, element: string): boolean {
  if (!entry.elements || entry.elements.length === 0) return true;
  return entry.elements.includes(element);
}

export function buildJmaNowcTileUrl(
  entry: JmaTileTimeEntry,
  element: 'hrpns' | 'thns' | 'trns',
  z: number,
  x: number,
  y: number,
): string | null {
  if (!entrySupportsElement(entry, element)) return null;
  const clampedZ = Math.min(10, Math.max(4, z));
  const shift = z - clampedZ;
  const tx = shift > 0 ? Math.floor(x / 2 ** shift) : x;
  const ty = shift > 0 ? Math.floor(y / 2 ** shift) : y;
  return `https://www.jma.go.jp/bosai/jmatile/data/nowc/${entry.basetime}/${entry.member || 'none'}/${entry.validtime}/surf/${element}/${clampedZ}/${tx}/${ty}.png`;
}

export function buildJmaRasrfTileUrl(
  entry: JmaTileTimeEntry,
  z: number,
  x: number,
  y: number,
): string | null {
  if (!entrySupportsElement(entry, 'rasrf')) return null;
  const clampedZ = Math.min(10, Math.max(4, z));
  const shift = z - clampedZ;
  const tx = shift > 0 ? Math.floor(x / 2 ** shift) : x;
  const ty = shift > 0 ? Math.floor(y / 2 ** shift) : y;
  return `https://www.jma.go.jp/bosai/jmatile/data/rasrf/${entry.basetime}/${entry.member || 'none'}/${entry.validtime}/surf/rasrf/${clampedZ}/${tx}/${ty}.png`;
}

export function buildJmaKikikuruTileUrl(
  entry: JmaTileTimeEntry,
  element: 'land' | 'inund' | 'flood_mesh',
  z: number,
  x: number,
  y: number,
): string | null {
  if (!entrySupportsElement(entry, element)) return null;
  const clampedZ = Math.min(10, Math.max(4, z));
  const shift = z - clampedZ;
  const tx = shift > 0 ? Math.floor(x / 2 ** shift) : x;
  const ty = shift > 0 ? Math.floor(y / 2 ** shift) : y;
  return `https://www.jma.go.jp/bosai/jmatile/data/risk/${entry.basetime}/${entry.member || 'none'}/${entry.validtime}/surf/${element}/${clampedZ}/${tx}/${ty}.png`;
}

export function buildHimawariTileUrl(
  entry: JmaTileTimeEntry,
  band: 'B13' | 'REP',
  z: number,
  x: number,
  y: number,
): string {
  const satZoom = Math.min(6, Math.max(3, z));
  const shift = z - satZoom;
  const sx = shift > 0 ? Math.floor(x / 2 ** shift) : x;
  const sy = shift > 0 ? Math.floor(y / 2 ** shift) : y;
  const prod = band === 'B13' ? 'TBB' : 'ETC';
  return `https://www.jma.go.jp/bosai/himawari/data/satimg/${entry.basetime}/fd/${entry.validtime}/${band}/${prod}/${satZoom}/${sx}/${sy}.jpg`;
}

export function filterEntriesByElement(
  entries: JmaTileTimeEntry[],
  element: string,
): JmaTileTimeEntry[] {
  const matched = entries.filter((e) => entrySupportsElement(e, element));
  return matched.length > 0 ? matched : entries;
}

function normalizeTimeList(raw: unknown, defaultMember = 'none'): JmaTileTimeEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const r = item as Record<string, unknown>;
      const basetime = typeof r.basetime === 'string' ? r.basetime : '';
      const validtime = typeof r.validtime === 'string' ? r.validtime : '';
      const member = typeof r.member === 'string' && r.member ? r.member : defaultMember;
      const elements = Array.isArray(r.elements)
        ? (r.elements as unknown[]).map((e) => String(e))
        : [];
      if (!basetime || !validtime) return null;
      return {
        basetime,
        validtime,
        member,
        elements,
        labelJst: formatJmaCompactUtcToJst(validtime),
      };
    })
    .filter((v): v is JmaTileTimeEntry => v !== null)
    .sort((a, b) => a.validtime.localeCompare(b.validtime));
}

export interface RadarTimelinesBundle {
  hrpns: JmaTileTimeEntry[];
  rasrf: JmaTileTimeEntry[];
  lightningTornado: JmaTileTimeEntry[];
  kikikuru: JmaTileTimeEntry[];
  himawari: JmaTileTimeEntry[];
  weatherMaps: JmaWeatherMapCatalog;
  fetchedAt: Date;
}

const tileCache = new Map<string, { data: RadarTimelinesBundle; expiresAt: number }>();

async function fetchJsonSafe(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchAllRadarTimelines(forceRefresh = false): Promise<RadarTimelinesBundle> {
  const cached = tileCache.get('all');
  if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
    setSourceStatus('jma_radar_kikikuru', 'normal', { cacheHit: true });
    return cached.data;
  }

  setSourceStatus('jma_radar_kikikuru', 'updating');
  const t0 = performance.now();

  const [n1, n2, n3, rasrf, risk, sat, wmap] = await Promise.allSettled([
    fetchJsonSafe('https://www.jma.go.jp/bosai/jmatile/data/nowc/targetTimes_N1.json'),
    fetchJsonSafe('https://www.jma.go.jp/bosai/jmatile/data/nowc/targetTimes_N2.json'),
    fetchJsonSafe('https://www.jma.go.jp/bosai/jmatile/data/nowc/targetTimes_N3.json'),
    fetchJsonSafe('https://www.jma.go.jp/bosai/jmatile/data/rasrf/targetTimes.json'),
    fetchJsonSafe('https://www.jma.go.jp/bosai/jmatile/data/risk/targetTimes.json'),
    fetchJsonSafe('https://www.jma.go.jp/bosai/himawari/data/satimg/targetTimes_fd.json'),
    fetchJsonSafe('https://www.jma.go.jp/bosai/weather_map/data/list.json'),
  ]);

  const anyOk = [n1, n2, n3, rasrf, risk, sat, wmap].some((r) => r.status === 'fulfilled');
  const latencyMs = Math.round(performance.now() - t0);
  const now = new Date();

  if (!anyOk) {
    setSourceStatus('jma_radar_kikikuru', 'fetch_failed', {
      lastFetchedAt: now,
      latencyMs,
      errorMessage: '気象庁レーダー・衛星・キキクルのタイムライン取得に失敗しました',
    });
    throw new Error('気象庁レーダー・衛星タイムラインの取得に失敗しました');
  }

  const hrpnsMerged = new Map<string, JmaTileTimeEntry>();
  for (const item of [
    ...normalizeTimeList(n1.status === 'fulfilled' ? n1.value : []),
    ...normalizeTimeList(n2.status === 'fulfilled' ? n2.value : []),
  ]) {
    if (entrySupportsElement(item, 'hrpns')) {
      hrpnsMerged.set(item.validtime, item);
    }
  }
  const hrpns = Array.from(hrpnsMerged.values()).sort((a, b) =>
    a.validtime.localeCompare(b.validtime),
  );

  const rasrfNormalized = filterEntriesByElement(
    normalizeTimeList(rasrf.status === 'fulfilled' ? rasrf.value : []),
    'rasrf',
  );

  // targetTimes_N3.json mixes 5-min liden-only frames with 10-min thns/trns frames;
  // keep frames that actually include thns/trns so lightning & tornado tiles never 404.
  const n3Normalized = normalizeTimeList(n3.status === 'fulfilled' ? n3.value : []);
  const lightningTornado = n3Normalized.filter(
    (entry) => entrySupportsElement(entry, 'thns') && entrySupportsElement(entry, 'trns'),
  );

  const riskNormalized = normalizeTimeList(
    risk.status === 'fulfilled' ? risk.value : [],
    'none',
  ).filter((entry) => entrySupportsElement(entry, 'land'));

  const wmapObj = (wmap.status === 'fulfilled' && wmap.value ? wmap.value : {}) as Record<
    string,
    Record<string, unknown>
  >;
  const near = wmapObj.near ?? {};
  const asia = wmapObj.asia ?? {};
  const asArr = (v: unknown) => (Array.isArray(v) ? v.map(String) : []);

  const bundle: RadarTimelinesBundle = {
    hrpns,
    rasrf: rasrfNormalized,
    lightningTornado: lightningTornado.length > 0 ? lightningTornado : n3Normalized,
    kikikuru: riskNormalized,
    himawari: normalizeTimeList(sat.status === 'fulfilled' ? sat.value : []).slice(-24),
    weatherMaps: {
      nearNow: asArr(near.now),
      nearFt24: asArr(near.ft24),
      nearFt48: asArr(near.ft48),
      asiaNow: asArr(asia.now),
      asiaFt24: asArr(asia.ft24),
      asiaFt48: asArr(asia.ft48),
    },
    fetchedAt: now,
  };

  // Use a 60s cache TTL so JMA's 10-min Kikikuru immed0->immed1 member rotation stays fresh.
  tileCache.set('all', { data: bundle, expiresAt: Date.now() + 60 * 1000 });
  const liveHrpns = hrpns[findLiveObservationIndex(hrpns)] ?? hrpns[hrpns.length - 1];
  setSourceStatus('jma_radar_kikikuru', 'normal', {
    lastFetchedAt: now,
    publishedAt: liveHrpns?.validtime ? jmaCompactUtcToIso(liveHrpns.validtime) : null,
    latencyMs,
    cacheHit: false,
    errorMessage: null,
  });

  return bundle;
}

const shelterCache = new Map<string, EvacuationShelterFeature[]>();

/**
 * Fetches GSI Designated Emergency Evacuation Sites (指定緊急避難場所) GeoJSON around lat/lon.
 * Uses zoom 10 tile grid from cyberjapandata.gsi.go.jp/xyz/skhb01/10/{x}/{y}.geojson.
 */
export async function fetchNearbyEvacuationShelters(
  centerLat: number,
  centerLon: number,
): Promise<EvacuationShelterFeature[]> {
  const z = 10;
  const maxT = 2 ** z;
  const tx = Math.floor(lonToWorldX(centerLon, z) / TILE_SIZE);
  const ty = Math.floor(latToWorldY(centerLat, z) / TILE_SIZE);
  const wrappedX = ((tx % maxT) + maxT) % maxT;
  const key = `${z}/${wrappedX}/${ty}`;

  const hit = shelterCache.get(key);
  if (hit) {
    setSourceStatus('gsi_tiles_shelters', 'normal', { cacheHit: true });
    return hit;
  }

  setSourceStatus('gsi_tiles_shelters', 'updating');
  const t0 = performance.now();
  try {
    const res = await fetchJsonSafe(
      `https://cyberjapandata.gsi.go.jp/xyz/skhb01/${z}/${wrappedX}/${ty}.geojson`,
    );
    const fc = res as { features?: Array<Record<string, unknown>> };
    const features = Array.isArray(fc?.features) ? fc.features : [];
    const parsed: EvacuationShelterFeature[] = [];

    for (let i = 0; i < features.length; i++) {
      const f = features[i];
      const geom = (f.geometry ?? {}) as { coordinates?: unknown[] };
      const coords = Array.isArray(geom.coordinates) ? geom.coordinates : [];
      const lon = Number(coords[0]);
      const lat = Number(coords[1]);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
      const p = (f.properties ?? {}) as Record<string, unknown>;
      parsed.push({
        id: `${key}-${i}`,
        name: typeof p.name === 'string' ? p.name : '避難場所',
        address: typeof p.address === 'string' ? p.address : '',
        remarks: typeof p.remarks === 'string' ? p.remarks : '',
        lat,
        lon,
        disasters: {
          flood: Boolean(p.disaster1),
          landslide: Boolean(p.disaster2),
          stormSurge: Boolean(p.disaster3),
          earthquake: Boolean(p.disaster4),
          tsunami: Boolean(p.disaster5),
          fire: Boolean(p.disaster6),
          inlandFlood: Boolean(p.disaster7),
          volcano: Boolean(p.disaster8),
        },
      });
    }

    shelterCache.set(key, parsed);
    setSourceStatus('gsi_tiles_shelters', 'normal', {
      lastFetchedAt: new Date(),
      latencyMs: Math.round(performance.now() - t0),
      cacheHit: false,
      errorMessage: null,
    });
    return parsed;
  } catch (err) {
    setSourceStatus('gsi_tiles_shelters', 'fetch_failed', {
      lastFetchedAt: new Date(),
      errorMessage: err instanceof Error ? err.message : '避難場所データ取得失敗',
    });
    return [];
  }
}
