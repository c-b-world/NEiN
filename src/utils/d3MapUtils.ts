import {
  geoCircle,
  geoDistance,
  geoMercator,
  type GeoPath,
  type GeoPermissibleObjects,
  type GeoProjection,
} from 'd3';
import type { Feature, Geometry } from 'geojson';
import { feature } from 'topojson-client';
import type { Topology } from 'topojson-specification';
import countriesAtlas from 'world-atlas/countries-50m.json';

export type MapViewMode = 'vicinity' | 'national';

export interface JapanCity {
  name: string;
  lat: number;
  lon: number;
}

export interface NearbyCity extends JapanCity {
  distanceKm: number;
}

export const JAPAN_CITIES: JapanCity[] = [
  { name: '札幌', lat: 43.064, lon: 141.347 },
  { name: '函館', lat: 41.769, lon: 140.729 },
  { name: '釧路', lat: 42.985, lon: 144.382 },
  { name: '青森', lat: 40.824, lon: 140.74 },
  { name: '盛岡', lat: 39.704, lon: 141.153 },
  { name: '仙台', lat: 38.269, lon: 140.872 },
  { name: '秋田', lat: 39.719, lon: 140.103 },
  { name: '山形', lat: 38.24, lon: 140.363 },
  { name: '福島', lat: 37.75, lon: 140.468 },
  { name: '水戸', lat: 36.341, lon: 140.447 },
  { name: '宇都宮', lat: 36.566, lon: 139.884 },
  { name: '前橋', lat: 36.391, lon: 139.061 },
  { name: 'さいたま', lat: 35.857, lon: 139.649 },
  { name: '千葉', lat: 35.605, lon: 140.123 },
  { name: '東京', lat: 35.689, lon: 139.692 },
  { name: '横浜', lat: 35.448, lon: 139.643 },
  { name: '新潟', lat: 37.902, lon: 139.023 },
  { name: '富山', lat: 36.695, lon: 137.211 },
  { name: '金沢', lat: 36.595, lon: 136.626 },
  { name: '福井', lat: 36.065, lon: 136.222 },
  { name: '甲府', lat: 35.664, lon: 138.568 },
  { name: '長野', lat: 36.651, lon: 138.181 },
  { name: '岐阜', lat: 35.391, lon: 136.722 },
  { name: '静岡', lat: 34.977, lon: 138.383 },
  { name: '名古屋', lat: 35.18, lon: 136.907 },
  { name: '津', lat: 34.73, lon: 136.509 },
  { name: '大津', lat: 35.004, lon: 135.869 },
  { name: '京都', lat: 35.021, lon: 135.756 },
  { name: '大阪', lat: 34.686, lon: 135.52 },
  { name: '神戸', lat: 34.691, lon: 135.183 },
  { name: '奈良', lat: 34.685, lon: 135.833 },
  { name: '和歌山', lat: 34.226, lon: 135.168 },
  { name: '鳥取', lat: 35.504, lon: 134.238 },
  { name: '松江', lat: 35.472, lon: 133.051 },
  { name: '岡山', lat: 34.662, lon: 133.935 },
  { name: '広島', lat: 34.397, lon: 132.46 },
  { name: '山口', lat: 34.186, lon: 131.471 },
  { name: '徳島', lat: 34.066, lon: 134.559 },
  { name: '高松', lat: 34.34, lon: 134.043 },
  { name: '松山', lat: 33.842, lon: 132.766 },
  { name: '高知', lat: 33.56, lon: 133.531 },
  { name: '福岡', lat: 33.606, lon: 130.418 },
  { name: '佐賀', lat: 33.249, lon: 130.299 },
  { name: '長崎', lat: 32.745, lon: 129.874 },
  { name: '熊本', lat: 32.79, lon: 130.742 },
  { name: '大分', lat: 33.238, lon: 131.613 },
  { name: '宮崎', lat: 31.911, lon: 131.424 },
  { name: '鹿児島', lat: 31.56, lon: 130.558 },
  { name: '那覇', lat: 26.212, lon: 127.681 },
];

const EARTH_RADIUS_KM = 6371;
const NEIGHBOR_IDS = new Set(['410', '408', '158', '156', '643']);

let cachedFeatures: {
  japan: Feature<Geometry> | null;
  neighbors: Feature<Geometry>[];
} | null = null;

export function getJapanAndNeighborFeatures(): {
  japan: Feature<Geometry> | null;
  neighbors: Feature<Geometry>[];
} {
  if (cachedFeatures) return cachedFeatures;

  const topology = countriesAtlas as unknown as Topology;
  const countriesObj = topology.objects.countries;
  const collection = feature(topology, countriesObj);
  const allFeatures =
    collection.type === 'FeatureCollection' ? collection.features : [collection];

  const japan =
    allFeatures.find((f) => String(f.id) === '392') ?? null;
  const neighbors = allFeatures.filter((f) =>
    NEIGHBOR_IDS.has(String(f.id))
  );

  cachedFeatures = { japan, neighbors };
  return cachedFeatures;
}

export function createEpicenterProjection(params: {
  width: number;
  height: number;
  mode: MapViewMode;
  centerLat?: number | null;
  centerLon?: number | null;
}): GeoProjection {
  const { width, height, mode, centerLat, centerLon } = params;
  const hasCenter =
    typeof centerLat === 'number' &&
    typeof centerLon === 'number' &&
    Number.isFinite(centerLat) &&
    Number.isFinite(centerLon);

  if (mode === 'vicinity' && hasCenter) {
    return geoMercator()
      .center([centerLon, centerLat])
      .scale(3800)
      .translate([width / 2, height / 2]);
  }

  return geoMercator()
    .center([137.0, 36.2])
    .scale(1150)
    .translate([width / 2, height / 2]);
}

export function kmToGeoDegrees(km: number): number {
  return (km / EARTH_RADIUS_KM) * (180 / Math.PI);
}

export function buildDistanceRingPath(
  pathGenerator: GeoPath<unknown, GeoPermissibleObjects>,
  lon: number,
  lat: number,
  km: number
): string | null {
  const circle = geoCircle().center([lon, lat]).radius(kmToGeoDegrees(km))();
  return pathGenerator(circle);
}

export function getNearbyCities(
  lat: number,
  lon: number,
  maxCount = 4
): NearbyCity[] {
  return JAPAN_CITIES.map((city) => {
    const rad = geoDistance([lon, lat], [city.lon, city.lat]);
    return {
      ...city,
      distanceKm: Math.round(rad * EARTH_RADIUS_KM),
    };
  })
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, maxCount);
}
