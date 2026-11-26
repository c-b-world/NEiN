import { JAPAN_WEATHER_OFFICES } from '../data/japanWeatherRegions';
import type { RegisteredRegion } from '../types/disaster';
import type { JapanWeatherOffice } from '../types/weather';

const STORAGE_KEY = 'nein_registered_regions_v1';

const DEFAULT_REGIONS: RegisteredRegion[] = [
  {
    id: '130000',
    officeCode: '130000',
    areaCode: '130010',
    label: '東京都（東京）',
    prefectureName: '東京都',
    lat: 35.6895,
    lon: 139.6917,
    notifyEnabled: true,
  },
  {
    id: '270000',
    officeCode: '270000',
    areaCode: '270000',
    label: '大阪府（大阪）',
    prefectureName: '大阪府',
    lat: 34.6937,
    lon: 135.5023,
    notifyEnabled: true,
  },
];

export function loadRegisteredRegions(): RegisteredRegion[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return DEFAULT_REGIONS;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_REGIONS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_REGIONS;
    return parsed.filter(
      (r): r is RegisteredRegion =>
        Boolean(r && typeof r.officeCode === 'string' && typeof r.lat === 'number'),
    );
  } catch {
    return DEFAULT_REGIONS;
  }
}

export function saveRegisteredRegions(regions: RegisteredRegion[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(regions));
  } catch {
    // Ignore storage errors
  }
}

export function createRegionFromOffice(office: JapanWeatherOffice): RegisteredRegion {
  return {
    id: office.officeCode,
    officeCode: office.officeCode,
    areaCode: office.defaultAreaCode,
    label: office.name,
    prefectureName: office.prefectureName,
    lat: office.lat,
    lon: office.lon,
    notifyEnabled: true,
  };
}

export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Pure local nearest-observatory resolver.
 * Never transmits user coordinates to any external tracking endpoint.
 */
export function findNearestWeatherOffice(
  lat: number,
  lon: number,
): JapanWeatherOffice {
  let best = JAPAN_WEATHER_OFFICES[0];
  let bestDist = Infinity;
  for (const office of JAPAN_WEATHER_OFFICES) {
    const dist = haversineDistanceKm(lat, lon, office.lat, office.lon);
    if (dist < bestDist) {
      bestDist = dist;
      best = office;
    }
  }
  return best;
}
