export interface ProjectedPoint {
  x: number;
  y: number;
  inBounds: boolean;
}

// Bounding box covering Japan archipelago (Okinawa to Hokkaido)
export const JAPAN_BOUNDS = {
  minLon: 123.5,
  maxLon: 147.5,
  minLat: 24.0,
  maxLat: 46.0,
  width: 640,
  height: 560,
} as const;

/**
 * Projects geographic coordinates (lat, lon) onto SVG viewport coordinates
 * with cosine latitude aspect compensation around Japan's center (~36°N).
 */
export function projectLatLon(lat: number, lon: number): ProjectedPoint {
  const { minLon, maxLon, minLat, maxLat, width, height } = JAPAN_BOUNDS;
  const xRatio = (lon - minLon) / (maxLon - minLon);
  const yRatio = (maxLat - lat) / (maxLat - minLat);
  const x = Number((xRatio * width).toFixed(2));
  const y = Number((yRatio * height).toFixed(2));
  const inBounds = lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat;
  return { x, y, inBounds };
}

/**
 * Simplified geographic coastline polygons [lon, lat] for Japan's major islands,
 * projected through `projectLatLon` so coastline and epicenter pins share the exact coordinate space.
 */
export const JAPAN_ISLANDS_LON_LAT: Array<{
  name: string;
  coords: Array<[number, number]>;
}> = [
  {
    name: 'Hokkaido',
    coords: [
      [140.1, 41.4],
      [139.8, 42.2],
      [140.4, 43.2],
      [141.3, 43.3],
      [141.6, 45.4],
      [142.5, 44.8],
      [144.3, 44.0],
      [145.3, 44.3],
      [145.8, 43.4],
      [144.4, 42.9],
      [143.3, 42.3],
      [142.8, 41.9],
      [141.4, 42.6],
      [140.8, 41.8],
      [140.1, 41.4],
    ],
  },
  {
    name: 'Honshu',
    coords: [
      [140.3, 41.2],
      [141.3, 41.4],
      [141.5, 40.5],
      [142.0, 39.6],
      [141.6, 38.4],
      [141.0, 37.8],
      [141.0, 36.8],
      [140.6, 35.9],
      [140.9, 35.7],
      [140.2, 34.9],
      [139.8, 35.4],
      [139.6, 35.1],
      [139.1, 35.2],
      [138.8, 34.6],
      [138.2, 34.9],
      [137.0, 34.6],
      [136.8, 34.9],
      [136.5, 34.5],
      [135.8, 33.4],
      [135.1, 34.2],
      [135.2, 34.6],
      [134.1, 34.6],
      [132.4, 34.2],
      [130.9, 33.9],
      [130.9, 34.4],
      [132.0, 35.0],
      [133.2, 35.5],
      [134.5, 35.6],
      [135.7, 35.6],
      [136.6, 36.7],
      [137.3, 37.4],
      [136.9, 36.9],
      [137.8, 37.0],
      [139.1, 37.9],
      [139.8, 38.9],
      [140.0, 40.1],
      [140.3, 41.2],
    ],
  },
  {
    name: 'Shikoku',
    coords: [
      [132.3, 33.4],
      [133.0, 34.0],
      [134.0, 34.3],
      [134.7, 34.1],
      [134.6, 33.6],
      [133.6, 33.4],
      [133.0, 32.8],
      [132.5, 32.9],
      [132.3, 33.4],
    ],
  },
  {
    name: 'Kyushu',
    coords: [
      [129.6, 33.4],
      [130.9, 33.9],
      [131.7, 33.5],
      [131.8, 32.6],
      [131.3, 31.4],
      [130.7, 31.0],
      [130.2, 31.3],
      [130.4, 32.3],
      [130.0, 32.8],
      [129.6, 33.4],
    ],
  },
  {
    name: 'Okinawa',
    coords: [
      [127.6, 26.1],
      [127.9, 26.4],
      [128.3, 26.8],
      [128.1, 26.9],
      [127.8, 26.5],
      [127.6, 26.1],
    ],
  },
  {
    name: 'Sado',
    coords: [
      [138.2, 37.8],
      [138.5, 38.3],
      [138.6, 38.0],
      [138.3, 37.7],
      [138.2, 37.8],
    ],
  },
];

export function coordsToSvgPath(coords: Array<[number, number]>): string {
  return (
    coords
      .map(([lon, lat], index) => {
        const { x, y } = projectLatLon(lat, lon);
        return `${index === 0 ? 'M' : 'L'}${x},${y}`;
      })
      .join(' ') + ' Z'
  );
}
