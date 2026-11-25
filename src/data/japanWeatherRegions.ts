import type { JapanWeatherOffice, WeatherRegionGroup } from '../types/weather';

export const WEATHER_REGION_LABELS: Array<{ id: WeatherRegionGroup | 'all'; label: string }> = [
  { id: 'all', label: '全国' },
  { id: 'hokkaido', label: '北海道' },
  { id: 'tohoku', label: '東北' },
  { id: 'kanto', label: '関東・甲信' },
  { id: 'chubu', label: '中部・北陸' },
  { id: 'kinki', label: '近畿' },
  { id: 'chugoku', label: '中国' },
  { id: 'shikoku', label: '四国' },
  { id: 'kyushu_okinawa', label: '九州・沖縄' },
];

export const JAPAN_WEATHER_OFFICES: JapanWeatherOffice[] = [
  // 北海道 (8管区)
  { officeCode: '016000', name: '北海道（石狩・空知・後志 / 札幌）', prefectureName: '北海道（札幌）', regionGroup: 'hokkaido', defaultAreaCode: '016010', amedasId: '14163', stationName: '札幌', lat: 43.06, lon: 141.3283 },
  { officeCode: '011000', name: '北海道（宗谷地方 / 稚内）', prefectureName: '北海道（宗谷）', regionGroup: 'hokkaido', defaultAreaCode: '011000', amedasId: '11016', stationName: '稚内', lat: 45.415, lon: 141.6783 },
  { officeCode: '012000', name: '北海道（上川・留萌 / 旭川）', prefectureName: '北海道（上川）', regionGroup: 'hokkaido', defaultAreaCode: '012010', amedasId: '12442', stationName: '旭川', lat: 43.7567, lon: 142.3717 },
  { officeCode: '013000', name: '北海道（網走・北見・紋別）', prefectureName: '北海道（網走）', regionGroup: 'hokkaido', defaultAreaCode: '013010', amedasId: '17341', stationName: '網走', lat: 44.0167, lon: 144.2783 },
  { officeCode: '014030', name: '北海道（十勝地方 / 帯広）', prefectureName: '北海道（十勝）', regionGroup: 'hokkaido', defaultAreaCode: '014030', amedasId: '20432', stationName: '帯広', lat: 42.9217, lon: 143.2117 },
  { officeCode: '014100', name: '北海道（釧路・根室）', prefectureName: '北海道（釧路・根室）', regionGroup: 'hokkaido', defaultAreaCode: '014010', amedasId: '18273', stationName: '根室', lat: 43.33, lon: 145.585 },
  { officeCode: '015000', name: '北海道（胆振・日高 / 室蘭）', prefectureName: '北海道（胆振・日高）', regionGroup: 'hokkaido', defaultAreaCode: '015010', amedasId: '21323', stationName: '室蘭', lat: 42.3117, lon: 140.975 },
  { officeCode: '017000', name: '北海道（渡島・檜山 / 函館）', prefectureName: '北海道（渡島・檜山）', regionGroup: 'hokkaido', defaultAreaCode: '017010', amedasId: '23232', stationName: '函館', lat: 41.8167, lon: 140.7533 },

  // 東北
  { officeCode: '020000', name: '青森県', prefectureName: '青森県', regionGroup: 'tohoku', defaultAreaCode: '020010', amedasId: '31312', stationName: '青森', lat: 40.8217, lon: 140.7683 },
  { officeCode: '030000', name: '岩手県', prefectureName: '岩手県', regionGroup: 'tohoku', defaultAreaCode: '030010', amedasId: '33431', stationName: '盛岡', lat: 39.6983, lon: 141.165 },
  { officeCode: '040000', name: '宮城県', prefectureName: '宮城県', regionGroup: 'tohoku', defaultAreaCode: '040010', amedasId: '34392', stationName: '仙台', lat: 38.2617, lon: 140.8967 },
  { officeCode: '050000', name: '秋田県', prefectureName: '秋田県', regionGroup: 'tohoku', defaultAreaCode: '050010', amedasId: '32402', stationName: '秋田', lat: 39.7167, lon: 140.0983 },
  { officeCode: '060000', name: '山形県', prefectureName: '山形県', regionGroup: 'tohoku', defaultAreaCode: '060010', amedasId: '35426', stationName: '山形', lat: 38.255, lon: 140.345 },
  { officeCode: '070000', name: '福島県', prefectureName: '福島県', regionGroup: 'tohoku', defaultAreaCode: '070010', amedasId: '36127', stationName: '福島', lat: 37.7583, lon: 140.47 },

  // 関東・甲信
  { officeCode: '080000', name: '茨城県', prefectureName: '茨城県', regionGroup: 'kanto', defaultAreaCode: '080010', amedasId: '40201', stationName: '水戸', lat: 36.38, lon: 140.4667 },
  { officeCode: '090000', name: '栃木県', prefectureName: '栃木県', regionGroup: 'kanto', defaultAreaCode: '090010', amedasId: '41277', stationName: '宇都宮', lat: 36.5483, lon: 139.8683 },
  { officeCode: '100000', name: '群馬県', prefectureName: '群馬県', regionGroup: 'kanto', defaultAreaCode: '100010', amedasId: '42251', stationName: '前橋', lat: 36.405, lon: 139.06 },
  { officeCode: '110000', name: '埼玉県', prefectureName: '埼玉県', regionGroup: 'kanto', defaultAreaCode: '110010', amedasId: '43241', stationName: 'さいたま', lat: 35.875, lon: 139.5867 },
  { officeCode: '120000', name: '千葉県', prefectureName: '千葉県', regionGroup: 'kanto', defaultAreaCode: '120010', amedasId: '45212', stationName: '千葉', lat: 35.6017, lon: 140.1033 },
  { officeCode: '130000', name: '東京都', prefectureName: '東京都', regionGroup: 'kanto', defaultAreaCode: '130010', amedasId: '44132', stationName: '東京', lat: 35.6917, lon: 139.75 },
  { officeCode: '140000', name: '神奈川県', prefectureName: '神奈川県', regionGroup: 'kanto', defaultAreaCode: '140010', amedasId: '46106', stationName: '横浜', lat: 35.4383, lon: 139.6517 },
  { officeCode: '190000', name: '山梨県', prefectureName: '山梨県', regionGroup: 'kanto', defaultAreaCode: '190010', amedasId: '49142', stationName: '甲府', lat: 35.6667, lon: 138.5533 },
  { officeCode: '200000', name: '長野県', prefectureName: '長野県', regionGroup: 'kanto', defaultAreaCode: '200010', amedasId: '48156', stationName: '長野', lat: 36.6617, lon: 138.1917 },

  // 中部・北陸
  { officeCode: '150000', name: '新潟県', prefectureName: '新潟県', regionGroup: 'chubu', defaultAreaCode: '150010', amedasId: '54232', stationName: '新潟', lat: 37.8933, lon: 139.0183 },
  { officeCode: '160000', name: '富山県', prefectureName: '富山県', regionGroup: 'chubu', defaultAreaCode: '160010', amedasId: '55102', stationName: '富山', lat: 36.7083, lon: 137.2017 },
  { officeCode: '170000', name: '石川県', prefectureName: '石川県', regionGroup: 'chubu', defaultAreaCode: '170010', amedasId: '56227', stationName: '金沢', lat: 36.5883, lon: 136.6333 },
  { officeCode: '180000', name: '福井県', prefectureName: '福井県', regionGroup: 'chubu', defaultAreaCode: '180010', amedasId: '57066', stationName: '福井', lat: 36.055, lon: 136.2217 },
  { officeCode: '210000', name: '岐阜県', prefectureName: '岐阜県', regionGroup: 'chubu', defaultAreaCode: '210010', amedasId: '52586', stationName: '岐阜', lat: 35.4, lon: 136.7617 },
  { officeCode: '220000', name: '静岡県', prefectureName: '静岡県', regionGroup: 'chubu', defaultAreaCode: '220010', amedasId: '50331', stationName: '静岡', lat: 34.975, lon: 138.4033 },
  { officeCode: '230000', name: '愛知県', prefectureName: '愛知県', regionGroup: 'chubu', defaultAreaCode: '230010', amedasId: '51106', stationName: '名古屋', lat: 35.1667, lon: 136.965 },
  { officeCode: '240000', name: '三重県', prefectureName: '三重県', regionGroup: 'chubu', defaultAreaCode: '240010', amedasId: '53133', stationName: '津', lat: 34.7333, lon: 136.5183 },

  // 近畿
  { officeCode: '250000', name: '滋賀県', prefectureName: '滋賀県', regionGroup: 'kinki', defaultAreaCode: '250010', amedasId: '60216', stationName: '大津', lat: 34.9917, lon: 135.9117 },
  { officeCode: '260000', name: '京都府', prefectureName: '京都府', regionGroup: 'kinki', defaultAreaCode: '260010', amedasId: '61286', stationName: '京都', lat: 35.0133, lon: 135.7317 },
  { officeCode: '270000', name: '大阪府', prefectureName: '大阪府', regionGroup: 'kinki', defaultAreaCode: '270000', amedasId: '62078', stationName: '大阪', lat: 34.6817, lon: 135.5183 },
  { officeCode: '280000', name: '兵庫県', prefectureName: '兵庫県', regionGroup: 'kinki', defaultAreaCode: '280010', amedasId: '63518', stationName: '神戸', lat: 34.6967, lon: 135.2117 },
  { officeCode: '290000', name: '奈良県', prefectureName: '奈良県', regionGroup: 'kinki', defaultAreaCode: '290010', amedasId: '64036', stationName: '奈良', lat: 34.6733, lon: 135.8367 },
  { officeCode: '300000', name: '和歌山県', prefectureName: '和歌山県', regionGroup: 'kinki', defaultAreaCode: '300010', amedasId: '65042', stationName: '和歌山', lat: 34.2283, lon: 135.1633 },

  // 中国
  { officeCode: '310000', name: '鳥取県', prefectureName: '鳥取県', regionGroup: 'chugoku', defaultAreaCode: '310010', amedasId: '69122', stationName: '鳥取', lat: 35.4867, lon: 134.2383 },
  { officeCode: '320000', name: '島根県', prefectureName: '島根県', regionGroup: 'chugoku', defaultAreaCode: '320010', amedasId: '68132', stationName: '松江', lat: 35.4567, lon: 133.065 },
  { officeCode: '330000', name: '岡山県', prefectureName: '岡山県', regionGroup: 'chugoku', defaultAreaCode: '330010', amedasId: '66408', stationName: '岡山', lat: 34.685, lon: 133.925 },
  { officeCode: '340000', name: '広島県', prefectureName: '広島県', regionGroup: 'chugoku', defaultAreaCode: '340010', amedasId: '67437', stationName: '広島', lat: 34.3983, lon: 132.4617 },
  { officeCode: '350000', name: '山口県', prefectureName: '山口県', regionGroup: 'chugoku', defaultAreaCode: '350010', amedasId: '81428', stationName: '下関', lat: 33.9483, lon: 130.925 },

  // 四国
  { officeCode: '360000', name: '徳島県', prefectureName: '徳島県', regionGroup: 'shikoku', defaultAreaCode: '360010', amedasId: '71106', stationName: '徳島', lat: 34.0667, lon: 134.5733 },
  { officeCode: '370000', name: '香川県', prefectureName: '香川県', regionGroup: 'shikoku', defaultAreaCode: '370000', amedasId: '72086', stationName: '高松', lat: 34.3183, lon: 134.0533 },
  { officeCode: '380000', name: '愛媛県', prefectureName: '愛媛県', regionGroup: 'shikoku', defaultAreaCode: '380010', amedasId: '73166', stationName: '松山', lat: 33.8433, lon: 132.7767 },
  { officeCode: '390000', name: '高知県', prefectureName: '高知県', regionGroup: 'shikoku', defaultAreaCode: '390010', amedasId: '74182', stationName: '高知', lat: 33.5667, lon: 133.5483 },

  // 九州・沖縄
  { officeCode: '400000', name: '福岡県', prefectureName: '福岡県', regionGroup: 'kyushu_okinawa', defaultAreaCode: '400010', amedasId: '82182', stationName: '福岡', lat: 33.5817, lon: 130.375 },
  { officeCode: '410000', name: '佐賀県', prefectureName: '佐賀県', regionGroup: 'kyushu_okinawa', defaultAreaCode: '410010', amedasId: '85142', stationName: '佐賀', lat: 33.265, lon: 130.305 },
  { officeCode: '420000', name: '長崎県', prefectureName: '長崎県', regionGroup: 'kyushu_okinawa', defaultAreaCode: '420010', amedasId: '84496', stationName: '長崎', lat: 32.7333, lon: 129.8667 },
  { officeCode: '430000', name: '熊本県', prefectureName: '熊本県', regionGroup: 'kyushu_okinawa', defaultAreaCode: '430010', amedasId: '86141', stationName: '熊本', lat: 32.8133, lon: 130.7067 },
  { officeCode: '440000', name: '大分県', prefectureName: '大分県', regionGroup: 'kyushu_okinawa', defaultAreaCode: '440010', amedasId: '83216', stationName: '大分', lat: 33.235, lon: 131.6183 },
  { officeCode: '450000', name: '宮崎県', prefectureName: '宮崎県', regionGroup: 'kyushu_okinawa', defaultAreaCode: '450010', amedasId: '87376', stationName: '宮崎', lat: 31.9383, lon: 131.4133 },
  { officeCode: '460100', name: '鹿児島県（本土）', prefectureName: '鹿児島県', regionGroup: 'kyushu_okinawa', defaultAreaCode: '460010', amedasId: '88317', stationName: '鹿児島', lat: 31.555, lon: 130.5467 },
  { officeCode: '460040', name: '鹿児島県（奄美地方）', prefectureName: '奄美地方', regionGroup: 'kyushu_okinawa', defaultAreaCode: '460040', amedasId: '88837', stationName: '名瀬', lat: 28.385, lon: 129.4933 },
  { officeCode: '471000', name: '沖縄県（沖縄本島地方）', prefectureName: '沖縄本島', regionGroup: 'kyushu_okinawa', defaultAreaCode: '471010', amedasId: '91197', stationName: '那覇', lat: 26.2067, lon: 127.6867 },
  { officeCode: '472000', name: '沖縄県（大東島地方）', prefectureName: '大東島', regionGroup: 'kyushu_okinawa', defaultAreaCode: '472000', amedasId: '92011', stationName: '南大東', lat: 25.8283, lon: 131.2283 },
  { officeCode: '473000', name: '沖縄県（宮古島地方）', prefectureName: '宮古島', regionGroup: 'kyushu_okinawa', defaultAreaCode: '473000', amedasId: '93041', stationName: '宮古島', lat: 24.7933, lon: 125.2783 },
  { officeCode: '474000', name: '沖縄県（八重山地方）', prefectureName: '八重山', regionGroup: 'kyushu_okinawa', defaultAreaCode: '474010', amedasId: '94081', stationName: '石垣島', lat: 24.3367, lon: 124.1633 },
];

export function getWeatherOfficeByCode(officeCode: string): JapanWeatherOffice {
  return (
    JAPAN_WEATHER_OFFICES.find((o) => o.officeCode === officeCode) ??
    JAPAN_WEATHER_OFFICES.find((o) => o.officeCode === '130000')!
  );
}
