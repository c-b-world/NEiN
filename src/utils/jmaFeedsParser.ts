import { resolveTsunamiAreaCoord } from '../data/tsunamiAreaCoords';
import type {
  JmaQuakeSubKind,
  JmaQuakeSummaryItem,
  JmaTsunamiSummaryItem,
  JmaXmlBulletin,
  JmaXmlBulletinCategory,
  JmaXmlFeedChannel,
  TsunamiForecastAreaItem,
  TsunamiObservationPointItem,
  TsunamiSeverity,
  TyphoonActiveInfo,
  VolcanoLocationEntry,
} from '../types/disaster';

/**
 * Parses JMA compact ISO6709 coordinate strings like "+32.3+130.5-10000/" or "+35.0+142.2-10000/".
 */
export function parseJmaIso6709(coord: string | null | undefined): {
  latitude: number | null;
  longitude: number | null;
  depthKm: number | null;
} {
  if (!coord || typeof coord !== 'string') {
    return { latitude: null, longitude: null, depthKm: null };
  }
  const m = coord.trim().match(/^([+-]\d+(?:\.\d+)?)([+-]\d+(?:\.\d+)?)([+-]\d+(?:\.\d+)?)?\/?$/);
  if (!m) {
    return { latitude: null, longitude: null, depthKm: null };
  }
  const lat = Number(m[1]);
  const lon = Number(m[2]);
  const depthMeters = m[3] !== undefined ? Number(m[3]) : null;
  const depthKm =
    depthMeters !== null && Number.isFinite(depthMeters)
      ? Math.round(Math.abs(depthMeters) / 1000)
      : null;

  return {
    latitude: Number.isFinite(lat) ? lat : null,
    longitude: Number.isFinite(lon) ? lon : null,
    depthKm,
  };
}

export function classifyJmaQuakeKind(
  title: string,
  enTitle: string,
): JmaQuakeSubKind {
  const combined = `${title} ${enTitle}`;
  if (combined.includes('南海トラフ')) return 'nankai_trough';
  if (combined.includes('北海道・三陸沖後発地震')) return 'hokkaido_sanriku';
  if (combined.includes('長周期地震動')) return 'long_period';
  if (combined.includes('遠地地震') || combined.toLowerCase().includes('distant')) {
    return 'distant';
  }
  if (combined.includes('震度速報')) return 'intensity_summary';
  if (combined.includes('震源')) return 'domestic';
  return 'other';
}

export function parseJmaQuakeList(raw: unknown): JmaQuakeSummaryItem[] {
  if (!Array.isArray(raw)) return [];
  const items: JmaQuakeSummaryItem[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < raw.length; i++) {
    const r = raw[i] as Record<string, unknown>;
    if (!r || typeof r !== 'object') continue;
    const eid = typeof r.eid === 'string' ? r.eid : '';
    const jsonFile = typeof r.json === 'string' ? r.json : '';
    const ctt = typeof r.ctt === 'string' ? r.ctt : '';
    const id = jsonFile || `${eid}-${ctt}-${i}`;
    if (seen.has(id)) continue;
    seen.add(id);

    const title = typeof r.ttl === 'string' ? r.ttl : '地震情報';
    const enTitle = typeof r.en_ttl === 'string' ? r.en_ttl : '';
    const issueType = typeof r.ift === 'string' ? r.ift : '発表';
    const coords = parseJmaIso6709(typeof r.cod === 'string' ? r.cod : '');
    const magNum = r.mag !== undefined && r.mag !== null && r.mag !== '' ? Number(r.mag) : null;

    items.push({
      id,
      eventId: eid,
      title,
      enTitle,
      issueType,
      serial: r.ser !== undefined && r.ser !== null ? String(r.ser) : '',
      reportDatetime: typeof r.rdt === 'string' ? r.rdt : '',
      originDatetime: typeof r.at === 'string' ? r.at : typeof r.rdt === 'string' ? r.rdt : '',
      epicenter: typeof r.anm === 'string' ? r.anm : '',
      enEpicenter: typeof r.en_anm === 'string' ? r.en_anm : '',
      coordinatesRaw: typeof r.cod === 'string' ? r.cod : '',
      latitude: coords.latitude,
      longitude: coords.longitude,
      depthKm: coords.depthKm,
      magnitude: magNum !== null && Number.isFinite(magNum) ? magNum : null,
      maxIntensity: typeof r.maxi === 'string' ? r.maxi : '',
      subKind: classifyJmaQuakeKind(title, enTitle),
      isCorrected: issueType.includes('訂正'),
      isCancelled: issueType.includes('取消'),
      jsonFile,
    });
  }

  return items;
}

export function classifyTsunamiKindCode(kindNameOrCode: string): TsunamiSeverity {
  const s = kindNameOrCode.trim();
  if (s.includes('大津波警報') || s === '52' || s === '53') return 'major_warning';
  if (s.includes('津波警報') || s === '51') return 'warning';
  if (s.includes('津波注意報') || s === '62') return 'watch';
  if (s.includes('解除') || s.includes('津波なし') || s === '00') return 'lifted';
  return 'forecast';
}

const SEVERITY_RANK: Record<TsunamiSeverity, number> = {
  major_warning: 5,
  warning: 4,
  watch: 3,
  forecast: 2,
  lifted: 1,
};

export function parseJmaTsunamiList(raw: unknown): JmaTsunamiSummaryItem[] {
  if (!Array.isArray(raw)) return [];
  const list: JmaTsunamiSummaryItem[] = [];

  for (let i = 0; i < raw.length; i++) {
    const r = raw[i] as Record<string, unknown>;
    if (!r || typeof r !== 'object') continue;
    const jsonFile = typeof r.json === 'string' ? r.json : '';
    const eid = typeof r.eid === 'string' ? r.eid : '';
    const kinds = Array.isArray(r.kind) ? (r.kind as Array<Record<string, unknown>>) : [];

    let highest: TsunamiSeverity = 'forecast';
    for (const k of kinds) {
      const sev = classifyTsunamiKindCode(
        typeof k.kind === 'string' ? k.kind : typeof k.code === 'string' ? k.code : '',
      );
      if (SEVERITY_RANK[sev] > SEVERITY_RANK[highest]) {
        highest = sev;
      }
    }

    const magNum = r.mag !== undefined && r.mag !== null && r.mag !== '' ? Number(r.mag) : null;

    list.push({
      id: jsonFile || `${eid}-${i}`,
      eventId: eid,
      title: typeof r.ttl === 'string' ? r.ttl : '津波情報',
      enTitle: typeof r.en_ttl === 'string' ? r.en_ttl : 'Tsunami Information',
      issueType: typeof r.ift === 'string' ? r.ift : '発表',
      reportDatetime: typeof r.rdt === 'string' ? r.rdt : '',
      validDatetime: null,
      originDatetime: typeof r.at === 'string' ? r.at : null,
      epicenter: typeof r.anm === 'string' ? r.anm : '',
      enEpicenter: typeof r.en_anm === 'string' ? r.en_anm : '',
      magnitude: magNum !== null && Number.isFinite(magNum) ? magNum : null,
      jsonFile,
      headlineText: kinds.map((k) => String(k.kind ?? '')).filter(Boolean).join(' / '),
      highestSeverity: highest,
      areas: [],
      observations: [],
    });
  }

  return list;
}

export function mergeTsunamiDetail(
  base: JmaTsunamiSummaryItem,
  detailRaw: unknown,
): JmaTsunamiSummaryItem {
  if (!detailRaw || typeof detailRaw !== 'object') return base;
  const obj = detailRaw as Record<string, unknown>;
  const head = (obj.Head ?? {}) as Record<string, unknown>;
  const body = (obj.Body ?? {}) as Record<string, unknown>;
  const tsunami = (body.Tsunami ?? {}) as Record<string, unknown>;
  const headlineObj = (head.Headline ?? {}) as Record<string, unknown>;

  const forecastBlock = (tsunami.Forecast ?? {}) as Record<string, unknown>;
  const forecastItems = Array.isArray(forecastBlock.Item)
    ? (forecastBlock.Item as Array<Record<string, unknown>>)
    : [];

  let highest: TsunamiSeverity = base.highestSeverity;
  const areas: TsunamiForecastAreaItem[] = [];

  for (const it of forecastItems) {
    const areaObj = (it.Area ?? {}) as Record<string, unknown>;
    const catObj = (it.Category ?? {}) as Record<string, unknown>;
    const kindObj = (catObj.Kind ?? {}) as Record<string, unknown>;
    const maxHeightObj = (it.MaxHeight ?? {}) as Record<string, unknown>;
    const firstHeightObj = (it.FirstHeight ?? {}) as Record<string, unknown>;

    const areaName = typeof areaObj.Name === 'string' ? areaObj.Name : '';
    const areaCode = typeof areaObj.Code === 'string' ? areaObj.Code : '';
    const enAreaName = typeof areaObj.enName === 'string' ? areaObj.enName : '';
    const kindName = typeof kindObj.Name === 'string' ? kindObj.Name : '';
    const enKindName = typeof kindObj.enName === 'string' ? kindObj.enName : '';
    const kindCode = typeof kindObj.Code === 'string' ? kindObj.Code : '';

    const sev = classifyTsunamiKindCode(kindName || kindCode);
    if (SEVERITY_RANK[sev] > SEVERITY_RANK[highest]) {
      highest = sev;
    }

    const coord = resolveTsunamiAreaCoord(areaName);
    areas.push({
      areaCode,
      areaName,
      enAreaName,
      kindName,
      enKindName,
      kindCode,
      severity: sev,
      maxHeight:
        typeof maxHeightObj.TsunamiHeight === 'string'
          ? maxHeightObj.TsunamiHeight
          : typeof maxHeightObj.Condition === 'string'
          ? maxHeightObj.Condition
          : null,
      arrivalTime:
        typeof firstHeightObj.ArrivalTime === 'string' ? firstHeightObj.ArrivalTime : null,
      condition:
        typeof firstHeightObj.Condition === 'string' ? firstHeightObj.Condition : null,
      lat: coord?.lat ?? null,
      lon: coord?.lon ?? null,
    });
  }

  const obsBlock = (tsunami.Observation ?? {}) as Record<string, unknown>;
  const obsItems = Array.isArray(obsBlock.Item)
    ? (obsBlock.Item as Array<Record<string, unknown>>)
    : [];
  const observations: TsunamiObservationPointItem[] = [];

  for (const ob of obsItems) {
    const areaObj = (ob.Area ?? {}) as Record<string, unknown>;
    const areaName = typeof areaObj.Name === 'string' ? areaObj.Name : '';
    const stations = Array.isArray(ob.Station)
      ? (ob.Station as Array<Record<string, unknown>>)
      : [];
    for (const st of stations) {
      const stationName = typeof st.Name === 'string' ? st.Name : areaName;
      const maxH = (st.MaxHeight ?? {}) as Record<string, unknown>;
      const heightVal =
        typeof maxH.TsunamiHeight === 'string'
          ? maxH.TsunamiHeight
          : typeof maxH.Condition === 'string'
          ? maxH.Condition
          : null;
      const observedAt =
        typeof maxH.DateTime === 'string' ? maxH.DateTime : null;
      observations.push({
        stationName,
        areaName,
        maxHeight: heightVal,
        observedAt,
        isOffshore: stationName.includes('沖') || areaName.includes('沖合'),
      });
    }
  }

  return {
    ...base,
    validDatetime: typeof head.ValidDateTime === 'string' ? head.ValidDateTime : base.validDatetime,
    headlineText:
      typeof headlineObj.Text === 'string' && headlineObj.Text
        ? headlineObj.Text
        : base.headlineText,
    highestSeverity: highest,
    areas,
    observations,
  };
}

function stripXmlTags(input: string): string {
  return input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

export function classifyXmlBulletinCategory(title: string): JmaXmlBulletinCategory {
  if (title.includes('南海トラフ') || title.includes('後発地震') || title.includes('長周期地震動')) {
    return 'quake_special';
  }
  if (
    title.includes('火山') ||
    title.includes('噴火') ||
    title.includes('降灰')
  ) {
    return 'volcano';
  }
  if (title.includes('台風') || title.includes('熱帯低気圧')) {
    return 'typhoon';
  }
  if (title.includes('土砂災害警戒情報') || title.includes('（土砂）')) {
    return 'landslide';
  }
  if (
    title.includes('記録的短時間大雨') ||
    title.includes('顕著な大雨') ||
    title.includes('線状降水帯')
  ) {
    return 'heavy_rain';
  }
  if (title.includes('洪水予報') || title.includes('氾濫')) {
    return 'flood_river';
  }
  if (title.includes('竜巻注意')) {
    return 'tornado';
  }
  if (
    title.includes('海上警報') ||
    title.includes('海上予報') ||
    title.includes('高潮') ||
    title.includes('波浪') ||
    title.includes('海面水温')
  ) {
    return 'marine';
  }
  if (title.includes('早期注意情報')) {
    return 'early_warning';
  }
  if (title.includes('季節予報') || title.includes('異常天候')) {
    return 'seasonal';
  }
  if (title.includes('スモッグ') || title.includes('黄砂') || title.includes('紫外線')) {
    return 'environment';
  }
  if (
    title.includes('全般気象情報') ||
    title.includes('地方気象情報') ||
    title.includes('府県気象情報') ||
    title.includes('気象特別警報') ||
    title.includes('気象警報')
  ) {
    return 'general_weather';
  }
  return 'other';
}

/**
 * Dependency-free Atom feed parser that works in both Node.js (unit tests) and browser.
 */
export function parseJmaAtomFeed(
  xmlText: string,
  channel: JmaXmlFeedChannel,
  maxItems = 80,
): JmaXmlBulletin[] {
  if (!xmlText || typeof xmlText !== 'string') return [];
  const entries = xmlText.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];
  const results: JmaXmlBulletin[] = [];

  for (let i = 0; i < entries.length && results.length < maxItems; i++) {
    const entry = entries[i];
    const titleMatch = entry.match(/<title[^>]*>([\s\S]*?)<\/title>/);
    const idMatch = entry.match(/<id[^>]*>([\s\S]*?)<\/id>/);
    const updatedMatch = entry.match(/<updated[^>]*>([\s\S]*?)<\/updated>/);
    const authorMatch = entry.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/);
    const contentMatch = entry.match(/<content[^>]*>([\s\S]*?)<\/content>/);
    const linkMatch = entry.match(/<link[^>]*href="([^"]+)"/);

    const title = titleMatch ? stripXmlTags(titleMatch[1]) : '気象庁電文';
    const id = idMatch ? stripXmlTags(idMatch[1]) : `${channel}-${i}`;
    const updatedAt = updatedMatch ? stripXmlTags(updatedMatch[1]) : '';
    const author = authorMatch ? stripXmlTags(authorMatch[1]) : '気象庁';
    const headline = contentMatch ? stripXmlTags(contentMatch[1]) : '';
    const link = linkMatch ? linkMatch[1] : id.startsWith('http') ? id : '';

    results.push({
      id,
      channel,
      category: classifyXmlBulletinCategory(title),
      title,
      updatedAt,
      author,
      headline,
      link,
    });
  }

  return results;
}

export function parseVolcanoListJson(
  raw: unknown,
  volcanoBulletins: JmaXmlBulletin[] = [],
): VolcanoLocationEntry[] {
  if (!Array.isArray(raw)) return [];
  const entries: VolcanoLocationEntry[] = [];

  for (const item of raw) {
    const r = item as Record<string, unknown>;
    if (!r || typeof r !== 'object') continue;
    const code = typeof r.code === 'string' ? r.code : String(r.code ?? '');
    const nameJp = typeof r.name_jp === 'string' ? r.name_jp : '';
    const nameEn = typeof r.name_en === 'string' ? r.name_en : nameJp;
    const latlon = Array.isArray(r.latlon) ? r.latlon : [];
    const lat = Number(latlon[0]);
    const lon = Number(latlon[1]);
    if (!nameJp || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    const matched =
      volcanoBulletins.find(
        (b) => b.headline.includes(nameJp) || b.title.includes(nameJp),
      ) ?? null;

    let alertLevelText: string | null = null;
    let alertLevelNum: number | null = null;
    if (matched) {
      const lvlMatch = matched.headline.match(/レベル([1-5１-５])/);
      if (lvlMatch) {
        const normalizedDigit = lvlMatch[1].replace(/[１-５]/g, (ch) =>
          String.fromCharCode(ch.charCodeAt(0) - 0xfee0),
        );
        alertLevelNum = Number(normalizedDigit);
        alertLevelText = `噴火警戒レベル${alertLevelNum}`;
      } else {
        alertLevelText = matched.title;
      }
    }

    entries.push({
      code,
      nameJp,
      nameEn,
      lat,
      lon,
      latestBulletin: matched,
      alertLevelText,
      alertLevelNum,
    });
  }

  return entries;
}

export function parseTyphoonListJson(
  raw: unknown,
  xmlBulletins: JmaXmlBulletin[] = [],
  nowMs: number = Date.now(),
): TyphoonActiveInfo[] {
  const results: TyphoonActiveInfo[] = [];
  const seenEvents = new Set<string>();

  if (Array.isArray(raw)) {
    for (let i = 0; i < raw.length; i++) {
      const r = raw[i] as Record<string, unknown>;
      if (!r || typeof r !== 'object') continue;
      const headTitle = typeof r.headTitle === 'string' ? r.headTitle : '';
      const eventId = typeof r.eventId === 'string' ? r.eventId : `typhoon-${i}`;
      const reportDatetime =
        typeof r.reportDatetime === 'string'
          ? r.reportDatetime
          : typeof r.datetime === 'string'
          ? r.datetime
          : '';
      if (seenEvents.has(eventId)) continue;
      seenEvents.add(eventId);

      const numMatch = headTitle.match(/台風第?(\d+)号/);
      const typhoonNumber = numMatch ? numMatch[1] : eventId.replace(/^TC/, '');
      const parsedMs = Date.parse(reportDatetime);
      const isExpired = !Number.isFinite(parsedMs) || nowMs - parsedMs > 24 * 60 * 60 * 1000;

      results.push({
        id: eventId,
        eventId,
        typhoonNumber: typhoonNumber || '--',
        nameJp: headTitle || '台風情報',
        nameEn: eventId ? `Typhoon ${eventId}` : 'Tropical Cyclone',
        headTitle,
        reportDatetime,
        infoType: typeof r.infoType === 'string' ? r.infoType : '発表',
        isTropicalDepression: headTitle.includes('熱帯低気圧'),
        isDissipated: headTitle.includes('消滅') || headTitle.includes('温帯低気圧'),
        isExpired,
        currentLat: null,
        currentLon: null,
        centralPressureHpa: null,
        maxWindMs: null,
        gustMs: null,
        movementDir: null,
        movementSpeedKmh: null,
        stormRadiusKm: null,
        galeRadiusKm: null,
        forecastTrack: [],
      });
    }
  }

  for (const b of xmlBulletins) {
    if (b.category !== 'typhoon') continue;
    const key = b.id;
    if (seenEvents.has(key)) continue;
    const parsedMs = Date.parse(b.updatedAt);
    const isExpired = !Number.isFinite(parsedMs) || nowMs - parsedMs > 24 * 60 * 60 * 1000;
    const numMatch = `${b.title} ${b.headline}`.match(/台風第?(\d+)号/);
    results.push({
      id: key,
      eventId: key,
      typhoonNumber: numMatch ? numMatch[1] : '--',
      nameJp: b.title,
      nameEn: numMatch ? `Typhoon #${numMatch[1]}` : 'Typhoon Bulletin',
      headTitle: b.headline || b.title,
      reportDatetime: b.updatedAt,
      infoType: 'XML電文',
      isTropicalDepression: b.headline.includes('熱帯低気圧'),
      isDissipated: b.headline.includes('消滅') || b.headline.includes('温帯低気圧'),
      isExpired,
      currentLat: null,
      currentLon: null,
      centralPressureHpa: null,
      maxWindMs: null,
      gustMs: null,
      movementDir: null,
      movementSpeedKmh: null,
      stormRadiusKm: null,
      galeRadiusKm: null,
      forecastTrack: [],
      rawXmlLink: b.link,
    });
  }

  return results;
}
