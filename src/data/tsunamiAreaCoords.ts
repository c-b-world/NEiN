/**
 * Representative coastal coordinates for JMA Tsunami Forecast Areas.
 * Used to plot active tsunami advisories/warnings/forecasts accurately on the National Map.
 */
export interface TsunamiCoastalCoord {
  lat: number;
  lon: number;
}

const TSUNAMI_KEYWORD_COORDS: Array<{ keywords: string[]; lat: number; lon: number }> = [
  { keywords: ['北海道太平洋沿岸東部', '根室', '釧路', '十勝'], lat: 43.0, lon: 144.8 },
  { keywords: ['北海道太平洋沿岸中部', '胆振', '日高'], lat: 42.3, lon: 142.0 },
  { keywords: ['北海道太平洋沿岸西部', '渡島'], lat: 41.8, lon: 140.7 },
  { keywords: ['北海道日本海沿岸', '石狩', '留萌', '宗谷'], lat: 43.5, lon: 141.3 },
  { keywords: ['オホーツク海沿岸', '網走', '紋別'], lat: 44.0, lon: 144.3 },
  { keywords: ['青森県太平洋沿岸', '青森県日本海沿岸', '陸奥湾'], lat: 40.6, lon: 141.5 },
  { keywords: ['岩手県'], lat: 39.6, lon: 141.95 },
  { keywords: ['宮城県'], lat: 38.3, lon: 141.4 },
  { keywords: ['秋田県'], lat: 39.7, lon: 140.0 },
  { keywords: ['山形県'], lat: 38.8, lon: 139.8 },
  { keywords: ['福島県'], lat: 37.4, lon: 141.05 },
  { keywords: ['茨城県'], lat: 36.3, lon: 140.6 },
  { keywords: ['千葉県九十九里・外房', '九十九里', '外房'], lat: 35.3, lon: 140.4 },
  { keywords: ['千葉県内房', '東京湾内湾'], lat: 35.35, lon: 139.85 },
  { keywords: ['相模湾・三浦半島', '神奈川県'], lat: 35.25, lon: 139.45 },
  { keywords: ['伊豆諸島'], lat: 34.4, lon: 139.3 },
  { keywords: ['小笠原諸島'], lat: 27.1, lon: 142.2 },
  { keywords: ['静岡県'], lat: 34.8, lon: 138.4 },
  { keywords: ['愛知県外海', '伊勢・三河湾'], lat: 34.7, lon: 137.0 },
  { keywords: ['三重県南部'], lat: 34.0, lon: 136.3 },
  { keywords: ['和歌山県'], lat: 33.7, lon: 135.4 },
  { keywords: ['大阪府', '兵庫県瀬戸内海沿岸', '淡路島'], lat: 34.6, lon: 135.2 },
  { keywords: ['新潟県', '佐渡'], lat: 37.9, lon: 139.0 },
  { keywords: ['富山県'], lat: 36.75, lon: 137.2 },
  { keywords: ['石川県能登', '石川県加賀'], lat: 37.2, lon: 136.9 },
  { keywords: ['福井県'], lat: 35.8, lon: 136.0 },
  { keywords: ['京都府'], lat: 35.6, lon: 135.2 },
  { keywords: ['兵庫県北部', '鳥取県', '島根県'], lat: 35.5, lon: 133.5 },
  { keywords: ['岡山県', '広島県', '山口県瀬戸内海沿岸'], lat: 34.3, lon: 132.5 },
  { keywords: ['徳島県', '香川県'], lat: 34.0, lon: 134.6 },
  { keywords: ['愛媛県', '高知県'], lat: 33.4, lon: 133.5 },
  { keywords: ['福岡県', '佐賀県', '長崎県'], lat: 33.4, lon: 129.9 },
  { keywords: ['熊本県', '有明・八代海'], lat: 32.5, lon: 130.4 },
  { keywords: ['大分県'], lat: 33.2, lon: 131.7 },
  { keywords: ['宮崎県'], lat: 31.9, lon: 131.5 },
  { keywords: ['鹿児島県東部', '種子島・屋久島', '奄美群島'], lat: 30.8, lon: 130.9 },
  { keywords: ['沖縄本島地方', '大東島地方'], lat: 26.2, lon: 127.7 },
  { keywords: ['宮古島・八重山地方'], lat: 24.4, lon: 124.2 },
];

export function resolveTsunamiAreaCoord(areaName: string): TsunamiCoastalCoord | null {
  for (const entry of TSUNAMI_KEYWORD_COORDS) {
    if (entry.keywords.some((kw) => areaName.includes(kw))) {
      return { lat: entry.lat, lon: entry.lon };
    }
  }
  return null;
}
