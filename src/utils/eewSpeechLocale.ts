import type { AppLanguage } from './i18n';

interface LocalizedPlace {
  ja: string;
  en: string;
  zh: string;
  ko: string;
}

/**
 * Full 4-language (ja/en/zh/ko) lookup for all 47 Japanese prefectures,
 * Hokkaido/Okinawa/Amami sub-offices, and major JMA seismic zones so TTS voices
 * never stumble over untranslated Kanji in English, Chinese, or Korean.
 */
const EXACT_PLACE_MAP: Record<string, LocalizedPlace> = {
  // Major epicenters & seismic zones (longest / most specific first)
  '南海トラフ巨大地震想定震源域': {
    ja: '南海トラフ想定震源域',
    en: 'the Nankai Trough seismic zone',
    zh: '南海海槽想定震源区',
    ko: '난카이 해구 상정 진원역',
  },
  '南海トラフ': {
    ja: '南海トラフ',
    en: 'the Nankai Trough',
    zh: '南海海槽',
    ko: '난카이 해구',
  },
  '東京湾': { ja: '東京湾', en: 'Tokyo Bay', zh: '东京湾', ko: '도쿄만' },
  '相模湾': { ja: '相模湾', en: 'Sagami Bay', zh: '相模湾', ko: '사가미만' },
  '駿河湾': { ja: '駿河湾', en: 'Suruga Bay', zh: '骏河湾', ko: '스루가만' },
  '大阪湾': { ja: '大阪湾', en: 'Osaka Bay', zh: '大阪湾', ko: '오사카만' },
  '伊勢湾': { ja: '伊勢湾', en: 'Ise Bay', zh: '伊势湾', ko: '이세만' },
  '富山湾': { ja: '富山湾', en: 'Toyama Bay', zh: '富山湾', ko: '도야마만' },
  '若狭湾': { ja: '若狭湾', en: 'Wakasa Bay', zh: '若狭湾', ko: '와카사만' },
  '瀬戸内海': { ja: '瀬戸内海', en: 'the Seto Inland Sea', zh: '濑户内海', ko: '세토 내해' },
  '日向灘': { ja: '日向灘', en: 'the Hyuga-nada Sea', zh: '日向滩', ko: '휴가나다 해역' },
  '紀伊水道': { ja: '紀伊水道', en: 'the Kii Channel', zh: '纪伊水道', ko: '기이 수도' },
  '豊後水道': { ja: '豊後水道', en: 'the Bungo Channel', zh: '丰后水道', ko: '분고 수도' },
  '津軽海峡': { ja: '津軽海峡', en: 'the Tsugaru Strait', zh: '津轻海峡', ko: '쓰가루 해협' },
  '三陸沖': { ja: '三陸沖', en: 'off the Sanriku coast', zh: '三陆近海', ko: '산리쿠 앞바다' },
  '能登半島': { ja: '能登半島', en: 'the Noto Peninsula', zh: '能登半岛', ko: '노토 반도' },
  '房総半島': { ja: '房総半島', en: 'the Boso Peninsula', zh: '房总半岛', ko: '보소 반도' },
  '伊豆半島': { ja: '伊豆半島', en: 'the Izu Peninsula', zh: '伊豆半岛', ko: '이즈 반도' },
  '紀伊半島': { ja: '紀伊半島', en: 'the Kii Peninsula', zh: '纪伊半岛', ko: '기이 반도' },
  '伊豆諸島': { ja: '伊豆諸島', en: 'the Izu Islands', zh: '伊豆群岛', ko: '이즈 제도' },
  '小笠原諸島': { ja: '小笠原諸島', en: 'the Ogasawara Islands', zh: '小笠原群岛', ko: '오가사와라 제도' },
  'トカラ列島': { ja: 'トカラ列島', en: 'the Tokara Islands', zh: '吐噶喇列岛', ko: '도카라 열도' },
  '佐渡': { ja: '佐渡', en: 'Sado Island', zh: '佐渡', ko: '사도' },
  '父島': { ja: '父島', en: 'Chichijima', zh: '父岛', ko: '치지시마' },
  '八丈島': { ja: '八丈島', en: 'Hachijojima', zh: '八丈岛', ko: '하치조지마' },
  '与那国島': { ja: '与那国島', en: 'Yonaguni Island', zh: '与那国岛', ko: '요나구니섬' },
  '石垣島': { ja: '石垣島', en: 'Ishigaki Island', zh: '石垣岛', ko: '이시가키섬' },
  '日本海溝': { ja: '日本海溝', en: 'the Japan Trench', zh: '日本海沟', ko: '일본 해구' },
  '千島海溝': { ja: '千島海溝', en: 'the Kuril Trench', zh: '千岛海沟', ko: '쿠릴 해구' },

  // Hokkaido & Okinawa/Amami sub-regions
  '北海道（札幌）': { ja: '北海道、札幌周辺', en: 'Sapporo, Hokkaido', zh: '北海道札幌地区', ko: '홋카이도 삿포로' },
  '北海道（宗谷）': { ja: '北海道、宗谷地方', en: 'Soya, Hokkaido', zh: '北海道宗谷地区', ko: '홋카이도 소야' },
  '北海道（上川）': { ja: '北海道、上川地方', en: 'Kamikawa, Hokkaido', zh: '北海道上川地区', ko: '홋카이도 가미카와' },
  '北海道（網走）': { ja: '北海道、網走地方', en: 'Abashiri, Hokkaido', zh: '北海道网走地区', ko: '홋카이도 아바시리' },
  '北海道（十勝）': { ja: '北海道、十勝地方', en: 'Tokachi, Hokkaido', zh: '北海道十胜地区', ko: '홋카이도 도카치' },
  '北海道（釧路・根室）': { ja: '北海道、釧路・根室地方', en: 'Kushiro and Nemuro, Hokkaido', zh: '北海道钏路与根室地区', ko: '홋카이도 구시로・네무로' },
  '北海道（胆振・日高）': { ja: '北海道、胆振・日高地方', en: 'Iburi and Hidaka, Hokkaido', zh: '北海道胆振与日高地区', ko: '홋카이도 이부리・히다카' },
  '北海道（渡島・檜山）': { ja: '北海道、渡島・檜山地方', en: 'Oshima and Hiyama, Hokkaido', zh: '北海道渡岛与桧山地区', ko: '홋카이도 오시마・히야마' },
  '奄美地方': { ja: '奄美地方', en: 'the Amami Islands', zh: '奄美地区', ko: '아마미 지방' },
  '沖縄本島': { ja: '沖縄本島', en: 'the Okinawa Main Island', zh: '冲绳本岛', ko: '오키나와 본섬' },
  '大東島': { ja: '大東島', en: 'the Daito Islands', zh: '大东岛', ko: '다이토섬' },
  '宮古島': { ja: '宮古島', en: 'Miyakojima', zh: '宫古岛', ko: '미야코섬' },
  '八重山': { ja: '八重山地方', en: 'the Yaeyama Islands', zh: '八重山地区', ko: '야에야마 지방' },

  // All 47 Prefectures
  '北海道': { ja: '北海道', en: 'Hokkaido', zh: '北海道', ko: '홋카이도' },
  '青森': { ja: '青森県', en: 'Aomori', zh: '青森县', ko: '아오모리현' },
  '岩手': { ja: '岩手県', en: 'Iwate', zh: '岩手县', ko: '이와테현' },
  '宮城': { ja: '宮城県', en: 'Miyagi', zh: '宫城县', ko: '미야기현' },
  '秋田': { ja: '秋田県', en: 'Akita', zh: '秋田县', ko: '아키타현' },
  '山形': { ja: '山形県', en: 'Yamagata', zh: '山形县', ko: '야마가타현' },
  '福島': { ja: '福島県', en: 'Fukushima', zh: '福岛县', ko: '후쿠시마현' },
  '茨城': { ja: '茨城県', en: 'Ibaraki', zh: '茨城县', ko: '이바라키현' },
  '栃木': { ja: '栃木県', en: 'Tochigi', zh: '栃木县', ko: '도치기현' },
  '群馬': { ja: '群馬県', en: 'Gunma', zh: '群马县', ko: '군마현' },
  '埼玉': { ja: '埼玉県', en: 'Saitama', zh: '埼玉县', ko: '사이타마현' },
  '千葉': { ja: '千葉県', en: 'Chiba', zh: '千叶县', ko: '지바현' },
  '東京': { ja: '東京都', en: 'Tokyo', zh: '东京都', ko: '도쿄도' },
  '神奈川': { ja: '神奈川県', en: 'Kanagawa', zh: '神奈川县', ko: '가나가와현' },
  '新潟': { ja: '新潟県', en: 'Niigata', zh: '新潟县', ko: '니가타현' },
  '富山': { ja: '富山県', en: 'Toyama', zh: '富山县', ko: '도야마현' },
  '石川': { ja: '石川県', en: 'Ishikawa', zh: '石川县', ko: '이시카와현' },
  '福井': { ja: '福井県', en: 'Fukui', zh: '福井县', ko: '후쿠이현' },
  '山梨': { ja: '山梨県', en: 'Yamanashi', zh: '山梨县', ko: '야마나시현' },
  '長野': { ja: '長野県', en: 'Nagano', zh: '长野县', ko: '나가노현' },
  '岐阜': { ja: '岐阜県', en: 'Gifu', zh: '岐阜县', ko: '기후현' },
  '静岡': { ja: '静岡県', en: 'Shizuoka', zh: '静冈县', ko: '시즈오카현' },
  '愛知': { ja: '愛知県', en: 'Aichi', zh: '爱知县', ko: '아이치현' },
  '三重': { ja: '三重県', en: 'Mie', zh: '三重县', ko: '미에현' },
  '滋賀': { ja: '滋賀県', en: 'Shiga', zh: '滋贺县', ko: '시가현' },
  '京都': { ja: '京都府', en: 'Kyoto', zh: '京都府', ko: '교토부' },
  '大阪': { ja: '大阪府', en: 'Osaka', zh: '大阪府', ko: '오사카부' },
  '兵庫': { ja: '兵庫県', en: 'Hyogo', zh: '兵库县', ko: '효고현' },
  '奈良': { ja: '奈良県', en: 'Nara', zh: '奈良县', ko: '나라현' },
  '和歌山': { ja: '和歌山県', en: 'Wakayama', zh: '和歌山县', ko: '와카야마현' },
  '鳥取': { ja: '鳥取県', en: 'Tottori', zh: '鸟取县', ko: '돗토리현' },
  '島根': { ja: '島根県', en: 'Shimane', zh: '岛根县', ko: '시마네현' },
  '岡山': { ja: '岡山県', en: 'Okayama', zh: '冈山县', ko: '오카야마현' },
  '広島': { ja: '広島県', en: 'Hiroshima', zh: '广岛县', ko: '히로시마현' },
  '山口': { ja: '山口県', en: 'Yamaguchi', zh: '山口县', ko: '야마구치현' },
  '徳島': { ja: '徳島県', en: 'Tokushima', zh: '德岛县', ko: '도쿠시마현' },
  '香川': { ja: '香川県', en: 'Kagawa', zh: '香川县', ko: '가가와현' },
  '愛媛': { ja: '愛媛県', en: 'Ehime', zh: '爱媛县', ko: '에히메현' },
  '高知': { ja: '高知県', en: 'Kochi', zh: '高知县', ko: '고치현' },
  '福岡': { ja: '福岡県', en: 'Fukuoka', zh: '福冈县', ko: '후쿠오카현' },
  '佐賀': { ja: '佐賀県', en: 'Saga', zh: '佐贺县', ko: '사가현' },
  '長崎': { ja: '長崎県', en: 'Nagasaki', zh: '长崎县', ko: '나가사키현' },
  '熊本': { ja: '熊本県', en: 'Kumamoto', zh: '熊本县', ko: '구마모토현' },
  '大分': { ja: '大分県', en: 'Oita', zh: '大分县', ko: '오이타현' },
  '宮崎': { ja: '宮崎県', en: 'Miyazaki', zh: '宮崎县', ko: '미야자키현' },
  '鹿児島': { ja: '鹿児島県', en: 'Kagoshima', zh: '鹿儿岛县', ko: '가고시마현' },
  '沖縄': { ja: '沖縄県', en: 'Okinawa', zh: '冲绳县', ko: '오키나와현' },
};

interface SuffixRule {
  jaSuffix: string;
  format: (base: string, lang: AppLanguage) => string;
}

const GEO_SUFFIX_RULES: readonly SuffixRule[] = [
  {
    jaSuffix: '南東沖',
    format: (base, lang) =>
      lang === 'en'
        ? `southeast off the coast of ${base}`
        : lang === 'zh'
          ? `${base}东南近海`
          : lang === 'ko'
            ? `${base} 남동쪽 앞바다`
            : `${base}南東沖`,
  },
  {
    jaSuffix: '北東沖',
    format: (base, lang) =>
      lang === 'en'
        ? `northeast off the coast of ${base}`
        : lang === 'zh'
          ? `${base}东北近海`
          : lang === 'ko'
            ? `${base} 북동쪽 앞바다`
            : `${base}北東沖`,
  },
  {
    jaSuffix: '南西沖',
    format: (base, lang) =>
      lang === 'en'
        ? `southwest off the coast of ${base}`
        : lang === 'zh'
          ? `${base}西南近海`
          : lang === 'ko'
            ? `${base} 남서쪽 앞바다`
            : `${base}南西沖`,
  },
  {
    jaSuffix: '北西沖',
    format: (base, lang) =>
      lang === 'en'
        ? `off the northwestern coast of ${base}`
        : lang === 'zh'
          ? `${base}西北近海`
          : lang === 'ko'
            ? `${base} 북서쪽 앞바다`
            : `${base}北西沖`,
  },
  {
    jaSuffix: '東方沖',
    format: (base, lang) =>
      lang === 'en'
        ? `off the eastern coast of ${base}`
        : lang === 'zh'
          ? `${base}以东海域`
          : lang === 'ko'
            ? `${base} 동쪽 앞바다`
            : `${base}東方沖`,
  },
  {
    jaSuffix: '南方沖',
    format: (base, lang) =>
      lang === 'en'
        ? `off the southern coast of ${base}`
        : lang === 'zh'
          ? `${base}以南海域`
          : lang === 'ko'
            ? `${base} 남쪽 앞바다`
            : `${base}南方沖`,
  },
  {
    jaSuffix: '西方沖',
    format: (base, lang) =>
      lang === 'en'
        ? `off the western coast of ${base}`
        : lang === 'zh'
          ? `${base}以西海域`
          : lang === 'ko'
            ? `${base} 서쪽 앞바다`
            : `${base}西方沖`,
  },
  {
    jaSuffix: '北方沖',
    format: (base, lang) =>
      lang === 'en'
        ? `off the northern coast of ${base}`
        : lang === 'zh'
          ? `${base}以北海域`
          : lang === 'ko'
            ? `${base} 북쪽 앞바다`
            : `${base}北方沖`,
  },
  {
    jaSuffix: '近海',
    format: (base, lang) =>
      lang === 'en'
        ? `near the coast of ${base}`
        : lang === 'zh'
          ? `${base}近海`
          : lang === 'ko'
            ? `${base} 근해`
            : `${base}近海`,
  },
  {
    jaSuffix: '沖',
    format: (base, lang) =>
      lang === 'en'
        ? `off the coast of ${base}`
        : lang === 'zh'
          ? `${base}近海`
          : lang === 'ko'
            ? `${base} 앞바다`
            : `${base}沖`,
  },
  {
    jaSuffix: '北西部',
    format: (base, lang) =>
      lang === 'en'
        ? `northwestern ${base}`
        : lang === 'zh'
          ? `${base}西北部`
          : lang === 'ko'
            ? `${base} 북서부`
            : `${base}北西部`,
  },
  {
    jaSuffix: '北東部',
    format: (base, lang) =>
      lang === 'en'
        ? `northeastern ${base}`
        : lang === 'zh'
          ? `${base}东北部`
          : lang === 'ko'
            ? `${base} 북동부`
            : `${base}北東部`,
  },
  {
    jaSuffix: '南西部',
    format: (base, lang) =>
      lang === 'en'
        ? `southwestern ${base}`
        : lang === 'zh'
          ? `${base}西南部`
          : lang === 'ko'
            ? `${base} 남서부`
            : `${base}南西部`,
  },
  {
    jaSuffix: '南東部',
    format: (base, lang) =>
      lang === 'en'
        ? `southeastern ${base}`
        : lang === 'zh'
          ? `${base}东南部`
          : lang === 'ko'
            ? `${base} 남동부`
            : `${base}南東部`,
  },
  {
    jaSuffix: '北部',
    format: (base, lang) =>
      lang === 'en'
        ? `northern ${base}`
        : lang === 'zh'
          ? `${base}北部`
          : lang === 'ko'
            ? `${base} 북부`
            : `${base}北部`,
  },
  {
    jaSuffix: '南部',
    format: (base, lang) =>
      lang === 'en'
        ? `southern ${base}`
        : lang === 'zh'
          ? `${base}南部`
          : lang === 'ko'
            ? `${base} 남부`
            : `${base}南部`,
  },
  {
    jaSuffix: '東部',
    format: (base, lang) =>
      lang === 'en'
        ? `eastern ${base}`
        : lang === 'zh'
          ? `${base}东部`
          : lang === 'ko'
            ? `${base} 동부`
            : `${base}東部`,
  },
  {
    jaSuffix: '西部',
    format: (base, lang) =>
      lang === 'en'
        ? `western ${base}`
        : lang === 'zh'
          ? `${base}西部`
          : lang === 'ko'
            ? `${base} 서부`
            : `${base}西部`,
  },
  {
    jaSuffix: '中部',
    format: (base, lang) =>
      lang === 'en'
        ? `central ${base}`
        : lang === 'zh'
          ? `${base}中部`
          : lang === 'ko'
            ? `${base} 중부`
            : `${base}中部`,
  },
  {
    jaSuffix: '内陸',
    format: (base, lang) =>
      lang === 'en'
        ? `inland ${base}`
        : lang === 'zh'
          ? `${base}内陆`
          : lang === 'ko'
            ? `${base} 내륙`
            : `${base}内陸`,
  },
  {
    jaSuffix: '付近',
    format: (base, lang) =>
      lang === 'en'
        ? `near ${base}`
        : lang === 'zh'
          ? `${base}附近`
          : lang === 'ko'
            ? `${base} 부근`
            : `${base}付近`,
  },
  {
    jaSuffix: '地方',
    format: (base, lang) =>
      lang === 'en'
        ? `the ${base} region`
        : lang === 'zh'
          ? `${base}地区`
          : lang === 'ko'
            ? `${base} 지방`
            : `${base}地方`,
  },
];

function lookupExactPlace(raw: string): LocalizedPlace | null {
  if (EXACT_PLACE_MAP[raw]) return EXACT_PLACE_MAP[raw];
  const stripped = raw.replace(/[都府県]$/, '');
  if (stripped && EXACT_PLACE_MAP[stripped]) return EXACT_PLACE_MAP[stripped];
  return null;
}

/**
 * Translates Japanese prefecture names, sub-offices, and JMA epicenter names
 * into fluent spoken text for all 4 app languages (ja, en, zh, ko).
 */
export function localizeJapanesePlaceName(raw: string, lang: AppLanguage): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  const exact = lookupExactPlace(trimmed);
  if (exact) {
    return exact[lang];
  }

  // Strip parenthetical city hints like "東京都（東京）" -> lookup base "東京都"
  const parenIndex = trimmed.indexOf('（');
  if (parenIndex > 0) {
    const beforeParen = trimmed.slice(0, parenIndex).trim();
    const parenMatch = lookupExactPlace(beforeParen);
    if (parenMatch) {
      return parenMatch[lang];
    }
  }

  // Match directional / coastal suffixes (e.g. "宮城県沖", "茨城県北部", "東京都近海", "能登半島沖")
  for (const rule of GEO_SUFFIX_RULES) {
    if (trimmed.endsWith(rule.jaSuffix) && trimmed.length > rule.jaSuffix.length) {
      const stem = trimmed.slice(0, -rule.jaSuffix.length).trim();
      const stemLocalized = lookupExactPlace(stem);
      if (stemLocalized) {
        return rule.format(stemLocalized[lang], lang);
      }
      // Handle double-layered epicenters like "北海道東方沖" or "千葉県東方沖"
      if (lang === 'ja') {
        return trimmed;
      }
    }
  }

  // Clean Japanese parentheses for spoken ja if unmapped
  if (lang === 'ja') {
    return trimmed.replace(/（([^）]+)）/g, '、$1');
  }

  // Fallback for rare unmapped epicenter names: never return raw Japanese to en/ko TTS if possible
  if (lang === 'en') {
    return 'the affected region of Japan';
  }
  if (lang === 'ko') {
    return '일본 진원 지역';
  }
  // Chinese TTS can generally pronounce Kanji geographic names gracefully
  return trimmed.replace(/（([^）]+)）/g, '$1');
}

/**
 * Formats JMA seismic intensity scale cleanly for natural speech synthesis
 * (avoiding dashes/tildes that TTS voices read literally as "dash" or pause awkwardly).
 */
export function formatSpokenIntensity(scale: number, lang: AppLanguage): string {
  if (lang === 'en') {
    switch (scale) {
      case 10:
        return 'seismic intensity 1';
      case 20:
        return 'seismic intensity 2';
      case 30:
        return 'seismic intensity 3';
      case 40:
        return 'seismic intensity 4';
      case 45:
        return 'seismic intensity 5 lower';
      case 50:
        return 'seismic intensity 5 upper';
      case 55:
        return 'seismic intensity 6 lower';
      case 60:
        return 'seismic intensity 6 upper';
      case 70:
        return 'seismic intensity 7';
      default:
        return '';
    }
  }

  if (lang === 'zh') {
    switch (scale) {
      case 10:
        return '震度1级';
      case 20:
        return '震度2级';
      case 30:
        return '震度3级';
      case 40:
        return '震度4级';
      case 45:
        return '震度5弱';
      case 50:
        return '震度5强';
      case 55:
        return '震度6弱';
      case 60:
        return '震度6强';
      case 70:
        return '震度7级';
      default:
        return '';
    }
  }

  if (lang === 'ko') {
    switch (scale) {
      case 10:
        return '진도 1';
      case 20:
        return '진도 2';
      case 30:
        return '진도 3';
      case 40:
        return '진도 4';
      case 45:
        return '진도 5약';
      case 50:
        return '진도 5강';
      case 55:
        return '진도 6약';
      case 60:
        return '진도 6강';
      case 70:
        return '진도 7';
      default:
        return '';
    }
  }

  // Japanese (ja)
  switch (scale) {
    case 10:
      return '震度1';
    case 20:
      return '震度2';
    case 30:
      return '震度3';
    case 40:
      return '震度4';
    case 45:
      return '震度5弱';
    case 50:
      return '震度5強';
    case 55:
      return '震度6弱';
    case 60:
      return '震度6強';
    case 70:
      return '震度7';
    default:
      return '';
  }
}

function formatSpokenScaleShort(scale: number, lang: AppLanguage): string {
  if (lang === 'en') {
    switch (scale) {
      case 10:
        return '1';
      case 20:
        return '2';
      case 30:
        return '3';
      case 40:
        return '4';
      case 45:
        return '5 lower';
      case 50:
        return '5 upper';
      case 55:
        return '6 lower';
      case 60:
        return '6 upper';
      case 70:
        return '7';
      default:
        return '';
    }
  }
  if (lang === 'zh') {
    switch (scale) {
      case 45:
        return '5弱';
      case 50:
        return '5强';
      case 55:
        return '6弱';
      case 60:
        return '6强';
      default:
        return formatSpokenIntensity(scale, 'zh').replace(/^震度/, '');
    }
  }
  if (lang === 'ko') {
    return formatSpokenIntensity(scale, 'ko').replace(/^진도\s*/, '');
  }
  return formatSpokenIntensity(scale, 'ja');
}

export function formatSpokenIntensityRange(
  scaleFrom: number,
  scaleTo: number,
  lang: AppLanguage,
): string {
  const fromFull = formatSpokenIntensity(scaleFrom, lang);
  if (!fromFull) return '';

  if (scaleTo === 99) {
    if (lang === 'en') return `${fromFull} or higher`;
    if (lang === 'zh') return `${fromFull}及以上`;
    if (lang === 'ko') return `${fromFull} 이상`;
    return `${fromFull}以上`;
  }

  if (scaleTo <= 0 || scaleTo === scaleFrom) {
    return fromFull;
  }

  const toShort = formatSpokenScaleShort(scaleTo, lang);
  if (!toShort) return fromFull;

  if (lang === 'en') return `${fromFull} to ${toShort}`;
  if (lang === 'zh') return `${fromFull}至${toShort}`;
  if (lang === 'ko') return `${fromFull}에서 ${toShort}`;
  return `${fromFull}から、${toShort}`;
}

export function formatSpokenMagnitude(
  mag: number | undefined,
  lang: AppLanguage,
): string {
  if (typeof mag !== 'number' || !Number.isFinite(mag) || mag < 0) return '';
  const fixed = mag.toFixed(1);
  if (lang === 'en') return `magnitude ${fixed}`;
  if (lang === 'zh') return `震级${fixed}级`;
  if (lang === 'ko') return `규모 ${fixed}`;
  return `マグニチュード${fixed}`;
}
