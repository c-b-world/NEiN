import type {
  AmedasObservation,
  HourlyWeatherPoint,
  JapanWeatherOffice,
  JmaForecastBundle,
  JmaPopSlot,
  JmaShortForecastDay,
  JmaSubAreaOption,
  JmaWarningAreaGroup,
  JmaWarningBundle,
  JmaWeeklyForecastDay,
  OpenMeteoBundle,
  OpenMeteoDailyPoint,
  SourceMeta,
  WeatherWarningItem,
} from '../types/weather';
import {
  decodeJmaWarningCode,
  describeJmaWeatherCode,
  describeWmoWeatherCode,
  formatAmedasWindDirection,
  formatDegreesToCompass,
} from './weatherCodes';

export interface FreshnessResult {
  isStale: boolean;
  ageHours: number | null;
  reason: string | null;
}

export interface ModelAdvisoryNote {
  id: string;
  title: string;
  detail: string;
  severity: 'info' | 'caution';
}

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function formatJstTimestamp(isoOrDate: string | Date | null | undefined): string {
  if (!isoOrDate) return '--';
  const date = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(date.getTime())) return '--';
  const jst = new Date(date.getTime() + JST_OFFSET_MS);
  const y = jst.getUTCFullYear();
  const m = String(jst.getUTCMonth() + 1).padStart(2, '0');
  const d = String(jst.getUTCDate()).padStart(2, '0');
  const hh = String(jst.getUTCHours()).padStart(2, '0');
  const mm = String(jst.getUTCMinutes()).padStart(2, '0');
  return `${y}/${m}/${d} ${hh}:${mm} JST`;
}

export function formatJstClock(isoOrDate: string | Date | null | undefined): string {
  if (!isoOrDate) return '--:--:--';
  const date = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(date.getTime())) return '--:--:--';
  const jst = new Date(date.getTime() + JST_OFFSET_MS);
  const hh = String(jst.getUTCHours()).padStart(2, '0');
  const mm = String(jst.getUTCMinutes()).padStart(2, '0');
  const ss = String(jst.getUTCSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export function formatShortDateJst(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(5, 10);
  const jst = new Date(date.getTime() + JST_OFFSET_MS);
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const m = jst.getUTCMonth() + 1;
  const d = jst.getUTCDate();
  const w = weekdays[jst.getUTCDay()];
  return `${m}/${d}(${w})`;
}

export function evaluateFreshness(
  publishedAtIso: string | null | undefined,
  maxAgeHours: number,
  nowMs: number = Date.now(),
): FreshnessResult {
  if (!publishedAtIso) {
    return {
      isStale: true,
      ageHours: null,
      reason: '発表・観測時刻が取得できないため鮮度を確認できません。',
    };
  }
  const parsedMs = Date.parse(publishedAtIso);
  if (!Number.isFinite(parsedMs)) {
    return {
      isStale: true,
      ageHours: null,
      reason: '発表・観測時刻の形式が不正なため鮮度を確認できません。',
    };
  }

  const diffHours = (nowMs - parsedMs) / (1000 * 60 * 60);
  if (diffHours > maxAgeHours) {
    const roundedHours = Math.floor(diffHours);
    const ageText =
      roundedHours >= 48
        ? `約${Math.floor(roundedHours / 24)}日前`
        : `約${roundedHours}時間前`;
    return {
      isStale: true,
      ageHours: diffHours,
      reason: `最終更新が${ageText}（${formatJstTimestamp(publishedAtIso)}）のため、情報期限切れまたは更新停止の可能性があります。`,
    };
  }

  return {
    isStale: false,
    ageHours: Math.max(0, diffHours),
    reason: null,
  };
}

function toNullableNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  const num = Number(val);
  return Number.isFinite(num) ? num : null;
}

/**
 * AMeDAS values are typically [value, qualityFlag] where qualityFlag === 0 means valid/normal observation.
 * Some stations may omit quality flag or use non-zero when missing/stopped.
 */
function readAmedasTuple(tuple: unknown): number | null {
  if (!Array.isArray(tuple) || tuple.length === 0) return null;
  const value = toNullableNumber(tuple[0]);
  if (value === null) return null;
  const flag = tuple.length > 1 ? toNullableNumber(tuple[1]) : 0;
  if (flag !== null && flag !== 0) return null;
  return value;
}

export function createErrorMeta(
  sourceName: string,
  dataKind: SourceMeta['dataKind'],
  errorMessage: string,
  fetchedAt: Date | null = new Date(),
): SourceMeta {
  return {
    status: 'error',
    sourceName,
    publishedAt: null,
    fetchedAt,
    isStale: false,
    staleReason: null,
    errorMessage,
    dataKind,
  };
}

export function parseJmaForecast(
  rawJson: unknown,
  office: JapanWeatherOffice,
  preferredAreaCode?: string,
  fetchedAt: Date = new Date(),
  nowMs: number = Date.now(),
): JmaForecastBundle {
  const sourceName = '気象庁 防災情報JSON（天気予報）';
  if (!Array.isArray(rawJson) || rawJson.length === 0) {
    return {
      meta: createErrorMeta(sourceName, 'official_forecast', '予報データの形式が不正です。', fetchedAt),
      publishingOffice: office.name,
      subAreas: [],
      activeAreaCode: preferredAreaCode || office.defaultAreaCode,
      activeAreaName: office.prefectureName,
      shortDays: [],
      popSlots: [],
      weeklyDays: [],
    };
  }

  const shortBlock = rawJson[0] as Record<string, unknown>;
  const weeklyBlock = (rawJson[1] as Record<string, unknown> | undefined) ?? undefined;
  const publishedAt =
    typeof shortBlock?.reportDatetime === 'string' ? shortBlock.reportDatetime : null;
  const publishingOffice =
    typeof shortBlock?.publishingOffice === 'string'
      ? shortBlock.publishingOffice
      : office.name;

  const freshness = evaluateFreshness(publishedAt, 24, nowMs);
  const meta: SourceMeta = {
    status: freshness.isStale ? 'stale' : 'ok',
    sourceName,
    publishedAt,
    fetchedAt,
    isStale: freshness.isStale,
    staleReason: freshness.reason,
    errorMessage: null,
    dataKind: 'official_forecast',
  };

  const shortTimeSeries = Array.isArray(shortBlock?.timeSeries)
    ? (shortBlock.timeSeries as Array<Record<string, unknown>>)
    : [];

  // Series 0: weatherCodes, weathers, winds, waves per class10 area
  const tsWeather = shortTimeSeries[0] ?? {};
  const weatherAreas = Array.isArray(tsWeather.areas)
    ? (tsWeather.areas as Array<Record<string, unknown>>)
    : [];

  const subAreas: JmaSubAreaOption[] = weatherAreas
    .map((entry) => {
      const areaObj = entry.area as Record<string, unknown> | undefined;
      return {
        code: typeof areaObj?.code === 'string' ? areaObj.code : '',
        name: typeof areaObj?.name === 'string' ? areaObj.name : '',
      };
    })
    .filter((item) => item.code !== '' && item.name !== '');

  const targetCode = preferredAreaCode || office.defaultAreaCode;
  const selectedWeatherArea =
    weatherAreas.find((a) => (a.area as Record<string, unknown>)?.code === targetCode) ??
    weatherAreas[0];

  const activeAreaObj = (selectedWeatherArea?.area as Record<string, unknown> | undefined) ?? {};
  const activeAreaCode =
    typeof activeAreaObj.code === 'string' ? activeAreaObj.code : targetCode;
  const activeAreaName =
    typeof activeAreaObj.name === 'string' ? activeAreaObj.name : office.prefectureName;

  // Series 2: short-term min/max temps per AMeDAS point
  const tsShortTemps = shortTimeSeries[2] ?? {};
  const shortTempDefines = Array.isArray(tsShortTemps.timeDefines)
    ? (tsShortTemps.timeDefines as string[])
    : [];
  const shortTempAreas = Array.isArray(tsShortTemps.areas)
    ? (tsShortTemps.areas as Array<Record<string, unknown>>)
    : [];
  const selectedShortTempArea =
    shortTempAreas.find((a) => (a.area as Record<string, unknown>)?.code === office.amedasId) ??
    shortTempAreas[0];
  const shortTempsRaw = Array.isArray(selectedShortTempArea?.temps)
    ? (selectedShortTempArea.temps as unknown[])
    : [];

  const weatherTimeDefines = Array.isArray(tsWeather.timeDefines)
    ? (tsWeather.timeDefines as string[])
    : [];
  const weatherCodesArr = Array.isArray(selectedWeatherArea?.weatherCodes)
    ? (selectedWeatherArea.weatherCodes as string[])
    : [];
  const weathersArr = Array.isArray(selectedWeatherArea?.weathers)
    ? (selectedWeatherArea.weathers as string[])
    : [];
  const windsArr = Array.isArray(selectedWeatherArea?.winds)
    ? (selectedWeatherArea.winds as string[])
    : [];
  const wavesArr = Array.isArray(selectedWeatherArea?.waves)
    ? (selectedWeatherArea.waves as string[])
    : [];

  const shortDays: JmaShortForecastDay[] = weatherTimeDefines.map((timeIso, idx) => {
    const dayDate = timeIso.slice(0, 10);
    const dayTemps: number[] = [];
    shortTempDefines.forEach((tIso, tIdx) => {
      if (tIso.slice(0, 10) === dayDate) {
        const val = toNullableNumber(shortTempsRaw[tIdx]);
        if (val !== null) dayTemps.push(val);
      }
    });
    const tempMin = dayTemps.length > 0 ? Math.min(...dayTemps) : null;
    const tempMax = dayTemps.length > 0 ? Math.max(...dayTemps) : null;

    return {
      dateIso: timeIso,
      label: idx === 0 ? '今日' : idx === 1 ? '明日' : idx === 2 ? '明後日' : formatShortDateJst(timeIso),
      weatherCode: weatherCodesArr[idx] ?? '',
      weatherText: (weathersArr[idx] ?? '').replace(/　+/g, ' ').trim() || describeJmaWeatherCode(weatherCodesArr[idx] ?? '').label,
      windText: (windsArr[idx] ?? '').replace(/　+/g, ' ').trim(),
      waveText: (wavesArr[idx] ?? '').replace(/　+/g, ' ').trim(),
      tempMin,
      tempMax,
    };
  });

  // Series 1: 6-hour PoPs
  const tsPops = shortTimeSeries[1] ?? {};
  const popDefines = Array.isArray(tsPops.timeDefines) ? (tsPops.timeDefines as string[]) : [];
  const popAreas = Array.isArray(tsPops.areas)
    ? (tsPops.areas as Array<Record<string, unknown>>)
    : [];
  const selectedPopArea =
    popAreas.find((a) => (a.area as Record<string, unknown>)?.code === activeAreaCode) ??
    popAreas[0];
  const popsRaw = Array.isArray(selectedPopArea?.pops) ? (selectedPopArea.pops as unknown[]) : [];
  const popSlots: JmaPopSlot[] = popDefines.map((timeIso, idx) => {
    const jst = new Date(Date.parse(timeIso) + JST_OFFSET_MS);
    const startH = Number.isFinite(jst.getTime()) ? jst.getUTCHours() : 0;
    const endH = (startH + 6) % 24;
    const pad = (n: number) => String(n).padStart(2, '0');
    return {
      timeIso,
      label: `${formatShortDateJst(timeIso)} ${pad(startH)}-${pad(endH)}時`,
      pop: toNullableNumber(popsRaw[idx]),
    };
  });

  // Weekly block
  const weeklyDays: JmaWeeklyForecastDay[] = [];
  if (weeklyBlock && Array.isArray(weeklyBlock.timeSeries)) {
    const wSeries = weeklyBlock.timeSeries as Array<Record<string, unknown>>;
    const wWeatherTs = wSeries[0] ?? {};
    const wTempTs = wSeries[1] ?? {};

    const wDates = Array.isArray(wWeatherTs.timeDefines)
      ? (wWeatherTs.timeDefines as string[])
      : [];
    const wWeatherAreas = Array.isArray(wWeatherTs.areas)
      ? (wWeatherTs.areas as Array<Record<string, unknown>>)
      : [];
    const selectedWeeklyArea =
      wWeatherAreas.find((a) => (a.area as Record<string, unknown>)?.code === activeAreaCode) ??
      wWeatherAreas[0];

    const wCodes = Array.isArray(selectedWeeklyArea?.weatherCodes)
      ? (selectedWeeklyArea.weatherCodes as string[])
      : [];
    const wPops = Array.isArray(selectedWeeklyArea?.pops)
      ? (selectedWeeklyArea.pops as unknown[])
      : [];
    const wRel = Array.isArray(selectedWeeklyArea?.reliabilities)
      ? (selectedWeeklyArea.reliabilities as string[])
      : [];

    const wTempAreas = Array.isArray(wTempTs.areas)
      ? (wTempTs.areas as Array<Record<string, unknown>>)
      : [];
    const selectedWeeklyTempArea =
      wTempAreas.find((a) => (a.area as Record<string, unknown>)?.code === office.amedasId) ??
      wTempAreas[0];
    const wTempMin = Array.isArray(selectedWeeklyTempArea?.tempsMin)
      ? (selectedWeeklyTempArea.tempsMin as unknown[])
      : [];
    const wTempMax = Array.isArray(selectedWeeklyTempArea?.tempsMax)
      ? (selectedWeeklyTempArea.tempsMax as unknown[])
      : [];

    wDates.forEach((dateIso, idx) => {
      const code = wCodes[idx] ?? '';
      weeklyDays.push({
        dateIso,
        label: formatShortDateJst(dateIso),
        weatherCode: code,
        weatherLabel: describeJmaWeatherCode(code).label,
        pop: toNullableNumber(wPops[idx]),
        tempMin: toNullableNumber(wTempMin[idx]),
        tempMax: toNullableNumber(wTempMax[idx]),
        reliability: wRel[idx] ?? '',
      });
    });
  }

  return {
    meta,
    publishingOffice,
    subAreas,
    activeAreaCode,
    activeAreaName,
    shortDays,
    popSlots,
    weeklyDays,
  };
}

function classifyAndAppendWarningItem(
  item: WeatherWarningItem,
  activeSpecialWarnings: WeatherWarningItem[],
  activeWarnings: WeatherWarningItem[],
  activeAdvisories: WeatherWarningItem[],
) {
  const isActive = item.status !== '解除';
  if (!isActive) return;
  if (item.level === 'special') activeSpecialWarnings.push(item);
  else if (item.level === 'warning') activeWarnings.push(item);
  else activeAdvisories.push(item);
}

/**
 * Parses JMAXML VPWW53/VPWW54 XML string into the unified JmaWarningBundle.
 * Used as an independent secondary fallback if the bosai JSON endpoint fails.
 */
export function parseJmaxmlWarningXml(
  xmlText: string,
  office: JapanWeatherOffice,
  areaNameMap: Record<string, string> = {},
  fetchedAt: Date = new Date(),
  nowMs: number = Date.now(),
): JmaWarningBundle {
  const sourceName = '気象庁 防災情報XML（JMAXML VPWW53）';
  if (!xmlText || !xmlText.includes('<Report')) {
    return {
      meta: createErrorMeta(
        sourceName,
        'official_warning',
        'JMAXML警報XMLの解析に失敗しました（警報なしとは断定できません）。',
        fetchedAt,
      ),
      publishingOffice: office.name,
      headlineText: '',
      areaGroups: [],
      activeSpecialWarnings: [],
      activeWarnings: [],
      activeAdvisories: [],
    };
  }

  const publishedAt =
    xmlText.match(/<ReportDateTime>([^<]+)<\/ReportDateTime>/)?.[1]?.trim() ?? null;
  const publishingOffice =
    xmlText.match(/<PublishingOffice>([^<]+)<\/PublishingOffice>/)?.[1]?.trim() ?? office.name;
  const headlineText =
    xmlText.match(/<Headline>[\s\S]*?<Text>([\s\S]*?)<\/Text>/)?.[1]?.trim() ?? '';

  const class10WarningBlock =
    xmlText.match(
      /<Warning\s+type="気象警報・注意報（一次細分区域等）">([\s\S]*?)<\/Warning>/,
    )?.[1] ?? '';

  const areaGroups: JmaWarningAreaGroup[] = [];
  const activeSpecialWarnings: WeatherWarningItem[] = [];
  const activeWarnings: WeatherWarningItem[] = [];
  const activeAdvisories: WeatherWarningItem[] = [];

  for (const itemMatch of class10WarningBlock.matchAll(/<Item>([\s\S]*?)<\/Item>/g)) {
    const itemXml = itemMatch[1];
    const areaBlock = itemXml.match(/<Area>([\s\S]*?)<\/Area>/)?.[1] ?? '';
    const areaCode = areaBlock.match(/<Code>([^<]+)<\/Code>/)?.[1]?.trim() ?? '';
    const areaName =
      areaBlock.match(/<Name>([^<]+)<\/Name>/)?.[1]?.trim() ||
      areaNameMap[areaCode] ||
      office.prefectureName;
    if (!areaCode) continue;

    const items: WeatherWarningItem[] = [];
    let hasNoWarningsFlag = false;

    for (const kindMatch of itemXml.matchAll(/<Kind>([\s\S]*?)<\/Kind>/g)) {
      const kindXml = kindMatch[1];
      const code = kindXml.match(/<Code>([^<]+)<\/Code>/)?.[1]?.trim() ?? '';
      const status = kindXml.match(/<Status>([^<]+)<\/Status>/)?.[1]?.trim() ?? '';
      const rawName = kindXml.match(/<Name>([^<]+)<\/Name>/)?.[1]?.trim() ?? '';

      if (!code && status.includes('なし')) {
        hasNoWarningsFlag = true;
        continue;
      }
      if (!code) continue;

      const decoded = decodeJmaWarningCode(code);
      const item: WeatherWarningItem = {
        code: decoded.code,
        name: rawName || decoded.name,
        level: decoded.level,
        status: status || '発表',
        areaCode,
        areaName,
      };
      items.push(item);
      classifyAndAppendWarningItem(item, activeSpecialWarnings, activeWarnings, activeAdvisories);
    }

    if (items.length === 0) hasNoWarningsFlag = true;
    areaGroups.push({
      areaCode,
      areaName,
      items,
      hasNoWarningsFlag,
    });
  }

  if (areaGroups.length === 0) {
    return {
      meta: createErrorMeta(
        sourceName,
        'official_warning',
        'JMAXML警報XMLに一次細分区域データが含まれていません。',
        fetchedAt,
      ),
      publishingOffice,
      headlineText,
      areaGroups: [],
      activeSpecialWarnings: [],
      activeWarnings: [],
      activeAdvisories: [],
    };
  }

  const freshness = evaluateFreshness(publishedAt, 24, nowMs);
  return {
    meta: {
      status: freshness.isStale ? 'stale' : 'ok',
      sourceName,
      publishedAt,
      fetchedAt,
      isStale: freshness.isStale,
      staleReason: freshness.reason,
      errorMessage: null,
      dataKind: 'official_warning',
    },
    publishingOffice,
    headlineText,
    areaGroups,
    activeSpecialWarnings,
    activeWarnings,
    activeAdvisories,
  };
}

export function parseJmaWarning(
  rawJson: unknown,
  office: JapanWeatherOffice,
  areaNameMap: Record<string, string> = {},
  fetchedAt: Date = new Date(),
  nowMs: number = Date.now(),
  systemControlDatetimeIso: string | null = null,
): JmaWarningBundle {
  const sourceName = '気象庁 防災情報JSON（R8警報・注意報）';

  if (typeof rawJson === 'string') {
    return parseJmaxmlWarningXml(rawJson, office, areaNameMap, fetchedAt, nowMs);
  }

  // Reiwa 8 (2026+) JMA warning JSON format: array of hazard-category blocks
  if (Array.isArray(rawJson)) {
    if (rawJson.length === 0) {
      return {
        meta: createErrorMeta(
          sourceName,
          'official_warning',
          '警報・注意報データの取得結果が空でした（警報なしとは断定できません）。',
          fetchedAt,
        ),
        publishingOffice: office.name,
        headlineText: '',
        areaGroups: [],
        activeSpecialWarnings: [],
        activeWarnings: [],
        activeAdvisories: [],
      };
    }

    let latestReportIso: string | null = null;
    let latestControlIso: string | null = null;
    let publishingOffice = office.name;
    const activeHeadlines: string[] = [];
    const fallbackHeadlines: string[] = [];

    const areaMap = new Map<
      string,
      {
        areaCode: string;
        areaName: string;
        itemsByCode: Map<string, WeatherWarningItem>;
        sawClearOrNone: boolean;
      }
    >();

    for (const blockRaw of rawJson) {
      if (!blockRaw || typeof blockRaw !== 'object') continue;
      const block = blockRaw as Record<string, unknown>;
      const repDt = typeof block.reportDatetime === 'string' ? block.reportDatetime : null;
      const ctrlDt = typeof block.controlDatetime === 'string' ? block.controlDatetime : null;
      if (typeof block.publishingOffice === 'string' && block.publishingOffice) {
        publishingOffice = block.publishingOffice;
      }
      if (repDt && (!latestReportIso || Date.parse(repDt) > Date.parse(latestReportIso))) {
        latestReportIso = repDt;
      }
      if (ctrlDt && (!latestControlIso || Date.parse(ctrlDt) > Date.parse(latestControlIso))) {
        latestControlIso = ctrlDt;
      }

      const warningObj = block.warning as Record<string, unknown> | undefined;
      const class10Items = Array.isArray(warningObj?.class10Items)
        ? (warningObj.class10Items as Array<Record<string, unknown>>)
        : [];

      let blockHasActiveItem = false;
      for (const areaEntry of class10Items) {
        const areaCode = typeof areaEntry.areaCode === 'string' ? areaEntry.areaCode : '';
        if (!areaCode) continue;
        const areaName =
          areaNameMap[areaCode] ??
          (areaCode === office.defaultAreaCode ? office.prefectureName : `地域 ${areaCode}`);

        let acc = areaMap.get(areaCode);
        if (!acc) {
          acc = {
            areaCode,
            areaName,
            itemsByCode: new Map(),
            sawClearOrNone: false,
          };
          areaMap.set(areaCode, acc);
        }

        const kinds = Array.isArray(areaEntry.kinds)
          ? (areaEntry.kinds as Array<Record<string, unknown>>)
          : [];

        for (const k of kinds) {
          const status = typeof k.status === 'string' ? k.status : '';
          const code = typeof k.code === 'string' ? k.code : '';
          if (!code && status.includes('なし')) {
            acc.sawClearOrNone = true;
            continue;
          }
          if (!code) continue;

          const decoded = decodeJmaWarningCode(code);
          const item: WeatherWarningItem = {
            code: decoded.code,
            name: decoded.name,
            level: decoded.level,
            status: status || '発表',
            areaCode,
            areaName,
          };

          if (item.status !== '解除') {
            blockHasActiveItem = true;
            acc.itemsByCode.set(decoded.code, item);
          } else {
            // Only keep cleared badge if the block is reasonably recent (<= 24h) and not already active
            const isRecentBlock =
              repDt !== null &&
              Number.isFinite(Date.parse(repDt)) &&
              nowMs - Date.parse(repDt) <= 24 * 60 * 60 * 1000;
            if (isRecentBlock && !acc.itemsByCode.has(decoded.code)) {
              acc.itemsByCode.set(decoded.code, item);
            }
            acc.sawClearOrNone = true;
          }
        }
      }

      const hl = typeof block.headlineText === 'string' ? block.headlineText.trim() : '';
      if (hl) {
        if (blockHasActiveItem) {
          if (!activeHeadlines.includes(hl)) activeHeadlines.push(hl);
        } else {
          if (!fallbackHeadlines.includes(hl)) fallbackHeadlines.push(hl);
        }
      }
    }

    if (areaMap.size === 0) {
      return {
        meta: createErrorMeta(
          sourceName,
          'official_warning',
          '警報・注意報の細分区域データが含まれていません。',
          fetchedAt,
        ),
        publishingOffice,
        headlineText: '',
        areaGroups: [],
        activeSpecialWarnings: [],
        activeWarnings: [],
        activeAdvisories: [],
      };
    }

    const areaGroups: JmaWarningAreaGroup[] = [];
    const activeSpecialWarnings: WeatherWarningItem[] = [];
    const activeWarnings: WeatherWarningItem[] = [];
    const activeAdvisories: WeatherWarningItem[] = [];

    for (const acc of areaMap.values()) {
      const items = Array.from(acc.itemsByCode.values());
      const hasActive = items.some((it) => it.status !== '解除');
      for (const item of items) {
        classifyAndAppendWarningItem(item, activeSpecialWarnings, activeWarnings, activeAdvisories);
      }
      areaGroups.push({
        areaCode: acc.areaCode,
        areaName: acc.areaName,
        items,
        hasNoWarningsFlag: !hasActive && acc.sawClearOrNone,
      });
    }

    // Use systemControlDatetimeIso (from r8/map_time.json) to evaluate pipeline liveness when available,
    // because calm prefectures do not emit new bulletins every day.
    const freshnessTarget = systemControlDatetimeIso ?? latestReportIso ?? latestControlIso;
    const freshness = evaluateFreshness(freshnessTarget, 24, nowMs);

    return {
      meta: {
        status: freshness.isStale ? 'stale' : 'ok',
        sourceName,
        publishedAt: latestReportIso,
        fetchedAt,
        isStale: freshness.isStale,
        staleReason: freshness.reason,
        errorMessage: null,
        dataKind: 'official_warning',
      },
      publishingOffice,
      headlineText:
        activeHeadlines.length > 0
          ? activeHeadlines.join(' ')
          : fallbackHeadlines[fallbackHeadlines.length - 1] ?? '',
      areaGroups,
      activeSpecialWarnings,
      activeWarnings,
      activeAdvisories,
    };
  }

  // Legacy single-object JMA warning JSON schema (kept for compatibility)
  if (!rawJson || typeof rawJson !== 'object') {
    return {
      meta: createErrorMeta(
        sourceName,
        'official_warning',
        '警報・注意報データの取得または解析に失敗しました（警報なしとは断定できません）。',
        fetchedAt,
      ),
      publishingOffice: office.name,
      headlineText: '',
      areaGroups: [],
      activeSpecialWarnings: [],
      activeWarnings: [],
      activeAdvisories: [],
    };
  }

  const obj = rawJson as Record<string, unknown>;
  const publishedAt = typeof obj.reportDatetime === 'string' ? obj.reportDatetime : null;
  const publishingOffice =
    typeof obj.publishingOffice === 'string' ? obj.publishingOffice : office.name;
  const headlineText = typeof obj.headlineText === 'string' ? obj.headlineText : '';

  if (!Array.isArray(obj.areaTypes) || obj.areaTypes.length === 0) {
    return {
      meta: createErrorMeta(
        sourceName,
        'official_warning',
        '警報・注意報の細分区域データが含まれていません。',
        fetchedAt,
      ),
      publishingOffice,
      headlineText,
      areaGroups: [],
      activeSpecialWarnings: [],
      activeWarnings: [],
      activeAdvisories: [],
    };
  }

  const primaryAreaType = obj.areaTypes[0] as Record<string, unknown>;
  const rawAreas = Array.isArray(primaryAreaType?.areas)
    ? (primaryAreaType.areas as Array<Record<string, unknown>>)
    : [];

  const areaGroups: JmaWarningAreaGroup[] = [];
  const activeSpecialWarnings: WeatherWarningItem[] = [];
  const activeWarnings: WeatherWarningItem[] = [];
  const activeAdvisories: WeatherWarningItem[] = [];

  for (const areaEntry of rawAreas) {
    const areaCode = typeof areaEntry.code === 'string' ? areaEntry.code : '';
    const areaName =
      areaNameMap[areaCode] ??
      (areaCode === office.defaultAreaCode ? office.prefectureName : `地域 ${areaCode}`);
    const warningsList = Array.isArray(areaEntry.warnings)
      ? (areaEntry.warnings as Array<Record<string, unknown>>)
      : [];

    const items: WeatherWarningItem[] = [];
    let hasNoWarningsFlag = false;

    for (const w of warningsList) {
      const status = typeof w.status === 'string' ? w.status : '';
      const code = typeof w.code === 'string' ? w.code : '';
      if (!code && status.includes('なし')) {
        hasNoWarningsFlag = true;
        continue;
      }
      if (!code) continue;

      const decoded = decodeJmaWarningCode(code);
      const item: WeatherWarningItem = {
        code: decoded.code,
        name: decoded.name,
        level: decoded.level,
        status: status || '発表',
        areaCode,
        areaName,
      };
      items.push(item);
      classifyAndAppendWarningItem(item, activeSpecialWarnings, activeWarnings, activeAdvisories);
    }

    areaGroups.push({
      areaCode,
      areaName,
      items,
      hasNoWarningsFlag,
    });
  }

  const freshness = evaluateFreshness(systemControlDatetimeIso ?? publishedAt, 24, nowMs);
  const meta: SourceMeta = {
    status: freshness.isStale ? 'stale' : 'ok',
    sourceName,
    publishedAt,
    fetchedAt,
    isStale: freshness.isStale,
    staleReason: freshness.reason,
    errorMessage: null,
    dataKind: 'official_warning',
  };

  return {
    meta,
    publishingOffice,
    headlineText,
    areaGroups,
    activeSpecialWarnings,
    activeWarnings,
    activeAdvisories,
  };
}

export function parseAmedasObservation(
  mapJson: unknown,
  office: JapanWeatherOffice,
  observedAtIso: string | null,
  fetchedAt: Date = new Date(),
  nowMs: number = Date.now(),
): AmedasObservation {
  const sourceName = '気象庁 アメダス実測値';
  if (!mapJson || typeof mapJson !== 'object' || Array.isArray(mapJson)) {
    return {
      meta: createErrorMeta(sourceName, 'observation', 'アメダス観測データを取得できませんでした。', fetchedAt),
      stationId: office.amedasId,
      stationName: office.stationName,
      observedAtIso: null,
      tempC: null,
      humidityPct: null,
      pressureHpa: null,
      stationPressureHpa: null,
      windSpeedMs: null,
      windDirectionText: null,
      precipitation1hMm: null,
      precipitation24hMm: null,
    };
  }

  const dict = mapJson as Record<string, unknown>;
  const stationRaw = dict[office.amedasId] as Record<string, unknown> | undefined;
  if (!stationRaw) {
    return {
      meta: createErrorMeta(
        sourceName,
        'observation',
        `観測所「${office.stationName} (${office.amedasId})」の実測データが見つかりませんでした。`,
        fetchedAt,
      ),
      stationId: office.amedasId,
      stationName: office.stationName,
      observedAtIso,
      tempC: null,
      humidityPct: null,
      pressureHpa: null,
      stationPressureHpa: null,
      windSpeedMs: null,
      windDirectionText: null,
      precipitation1hMm: null,
      precipitation24hMm: null,
    };
  }

  const freshness = evaluateFreshness(observedAtIso, 2, nowMs);
  const windDirIndex = readAmedasTuple(stationRaw.windDirection);

  return {
    meta: {
      status: freshness.isStale ? 'stale' : 'ok',
      sourceName,
      publishedAt: observedAtIso,
      fetchedAt,
      isStale: freshness.isStale,
      staleReason: freshness.reason,
      errorMessage: null,
      dataKind: 'observation',
    },
    stationId: office.amedasId,
    stationName: office.stationName,
    observedAtIso,
    tempC: readAmedasTuple(stationRaw.temp),
    humidityPct: readAmedasTuple(stationRaw.humidity),
    pressureHpa: readAmedasTuple(stationRaw.normalPressure),
    stationPressureHpa: readAmedasTuple(stationRaw.pressure),
    windSpeedMs: readAmedasTuple(stationRaw.wind),
    windDirectionText: windDirIndex !== null ? formatAmedasWindDirection(windDirIndex) : null,
    precipitation1hMm: readAmedasTuple(stationRaw.precipitation1h),
    precipitation24hMm: readAmedasTuple(stationRaw.precipitation24h),
    snowDepthCm: readAmedasTuple(stationRaw.snow),
    snow1hCm: readAmedasTuple(stationRaw.snow1h),
    snow24hCm: readAmedasTuple(stationRaw.snow24h),
    sunshine1hMin: readAmedasTuple(stationRaw.sun10m) !== null ? (readAmedasTuple(stationRaw.sun1h) ?? null) : readAmedasTuple(stationRaw.sun1h),
    maxGustMs: readAmedasTuple(stationRaw.gust),
  };
}

function normalizeOpenMeteoIsoToJstMs(timeStr: string): number {
  if (timeStr.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(timeStr)) {
    return Date.parse(timeStr);
  }
  return Date.parse(`${timeStr}+09:00`);
}

export function parseOpenMeteoBundle(
  rawJson: unknown,
  fetchedAt: Date = new Date(),
  nowMs: number = Date.now(),
): OpenMeteoBundle {
  const sourceName = 'Open-Meteo 気象モデル予測';
  if (!rawJson || typeof rawJson !== 'object' || Array.isArray(rawJson)) {
    return {
      meta: createErrorMeta(sourceName, 'model_forecast', 'Open-Meteo予測データの解析に失敗しました。', fetchedAt),
      current: null,
      hourly24h: [],
      daily7d: [],
    };
  }

  const obj = rawJson as Record<string, unknown>;
  const currentRaw = obj.current as Record<string, unknown> | undefined;
  const hourlyRaw = obj.hourly as Record<string, unknown> | undefined;
  const dailyRaw = obj.daily as Record<string, unknown> | undefined;

  const currentTimeRaw = typeof currentRaw?.time === 'string' ? currentRaw.time : null;
  const publishedAtIso = currentTimeRaw
    ? currentTimeRaw.endsWith('+09:00')
      ? currentTimeRaw
      : `${currentTimeRaw}:00+09:00`.replace(/:00:00\+09:00$/, ':00+09:00')
    : null;

  const currentWmo = toNullableNumber(currentRaw?.weather_code);
  const currentWindDeg = toNullableNumber(currentRaw?.wind_direction_10m);

  const current = currentRaw
    ? {
        timeIso: currentTimeRaw ?? '',
        tempC: toNullableNumber(currentRaw.temperature_2m),
        humidityPct: toNullableNumber(currentRaw.relative_humidity_2m),
        pressureMslHpa: toNullableNumber(currentRaw.pressure_msl),
        surfacePressureHpa: toNullableNumber(currentRaw.surface_pressure),
        windSpeedMs: toNullableNumber(currentRaw.wind_speed_10m),
        windDirectionDeg: currentWindDeg,
        windDirectionText:
          currentWindDeg !== null ? formatDegreesToCompass(currentWindDeg) : null,
        precipitationMm: toNullableNumber(currentRaw.precipitation),
        weatherCode: currentWmo,
        weatherLabel: describeWmoWeatherCode(currentWmo).label,
        windGustMs: toNullableNumber(currentRaw.wind_gusts_10m),
        visibilityM: toNullableNumber(currentRaw.visibility),
        uvIndex: toNullableNumber(currentRaw.uv_index),
        apparentTempC: toNullableNumber(currentRaw.apparent_temperature),
        snowfallCm: toNullableNumber(currentRaw.snowfall),
      }
    : null;

  // Hourly 24h starting from current JST hour
  const hourly24h: HourlyWeatherPoint[] = [];
  if (hourlyRaw && Array.isArray(hourlyRaw.time)) {
    const hTimes = hourlyRaw.time as string[];
    const hTemps = Array.isArray(hourlyRaw.temperature_2m) ? (hourlyRaw.temperature_2m as unknown[]) : [];
    const hPops = Array.isArray(hourlyRaw.precipitation_probability)
      ? (hourlyRaw.precipitation_probability as unknown[])
      : [];
    const hPrecip = Array.isArray(hourlyRaw.precipitation)
      ? (hourlyRaw.precipitation as unknown[])
      : [];
    const hCodes = Array.isArray(hourlyRaw.weather_code) ? (hourlyRaw.weather_code as unknown[]) : [];

    // Align start index to the first point >= nowMs - 59m so the current hour is included
    const thresholdMs = nowMs - 59 * 60 * 1000;
    let startIdx = hTimes.findIndex((t) => normalizeOpenMeteoIsoToJstMs(t) >= thresholdMs);
    if (startIdx < 0) startIdx = 0;

    const sliceEnd = Math.min(hTimes.length, startIdx + 24);
    for (let i = startIdx; i < sliceEnd; i++) {
      const t = hTimes[i];
      const tempVal = toNullableNumber(hTemps[i]);
      if (tempVal === null) continue;
      const hourPart = t.length >= 16 ? t.slice(11, 16) : t;
      hourly24h.push({
        timeIso: t,
        hourLabel: hourPart,
        tempC: tempVal,
        popPct: toNullableNumber(hPops[i]) ?? 0,
        precipitationMm: toNullableNumber(hPrecip[i]) ?? 0,
        weatherCode: toNullableNumber(hCodes[i]) ?? 0,
      });
    }
  }

  // Daily 7d
  const daily7d: OpenMeteoDailyPoint[] = [];
  if (dailyRaw && Array.isArray(dailyRaw.time)) {
    const dTimes = dailyRaw.time as string[];
    const dCodes = Array.isArray(dailyRaw.weather_code) ? (dailyRaw.weather_code as unknown[]) : [];
    const dMax = Array.isArray(dailyRaw.temperature_2m_max)
      ? (dailyRaw.temperature_2m_max as unknown[])
      : [];
    const dMin = Array.isArray(dailyRaw.temperature_2m_min)
      ? (dailyRaw.temperature_2m_min as unknown[])
      : [];
    const dPrecip = Array.isArray(dailyRaw.precipitation_sum)
      ? (dailyRaw.precipitation_sum as unknown[])
      : [];
    const dPopMax = Array.isArray(dailyRaw.precipitation_probability_max)
      ? (dailyRaw.precipitation_probability_max as unknown[])
      : [];

    dTimes.slice(0, 8).forEach((dIso, idx) => {
      const wCode = toNullableNumber(dCodes[idx]) ?? 0;
      daily7d.push({
        dateIso: dIso,
        label: formatShortDateJst(`${dIso}T00:00:00+09:00`),
        weatherCode: wCode,
        weatherLabel: describeWmoWeatherCode(wCode).label,
        tempMaxC: toNullableNumber(dMax[idx]),
        tempMinC: toNullableNumber(dMin[idx]),
        precipitationSumMm: toNullableNumber(dPrecip[idx]),
        popMaxPct: toNullableNumber(dPopMax[idx]),
      });
    });
  }

  if (!current && hourly24h.length === 0) {
    return {
      meta: createErrorMeta(sourceName, 'model_forecast', '有効な予測データが空です。', fetchedAt),
      current: null,
      hourly24h: [],
      daily7d: [],
    };
  }

  const freshness = evaluateFreshness(publishedAtIso, 3, nowMs);
  return {
    meta: {
      status: freshness.isStale ? 'stale' : 'ok',
      sourceName,
      publishedAt: publishedAtIso,
      fetchedAt,
      isStale: freshness.isStale,
      staleReason: freshness.reason,
      errorMessage: null,
      dataKind: 'model_forecast',
    },
    current,
    hourly24h,
    daily7d,
  };
}

/**
 * Generates model-derived reference notes from Open-Meteo numerical forecast.
 * Strictly separated from official JMA warnings and advisories.
 */
export function deriveModelAdvisoryNotes(bundle: OpenMeteoBundle | null): ModelAdvisoryNote[] {
  if (!bundle || bundle.meta.status === 'error') return [];
  const notes: ModelAdvisoryNote[] = [];
  const maxPop = bundle.hourly24h.reduce((m, p) => Math.max(m, p.popPct), 0);
  const totalPrecip24 = bundle.hourly24h.reduce((sum, p) => sum + p.precipitationMm, 0);
  const maxWind = bundle.current?.windSpeedMs ?? 0;

  if (totalPrecip24 >= 20 || maxPop >= 70) {
    notes.push({
      id: 'model_rain',
      title: 'モデル予測：まとまった降水の見込み',
      detail: `Open-Meteo数値予測では今後24時間で最大降水確率 ${maxPop}%・積算降水量 ${totalPrecip24.toFixed(1)}mm が試算されています（公式警報ではありません）。`,
      severity: 'caution',
    });
  }

  if (maxWind >= 10) {
    notes.push({
      id: 'model_wind',
      title: 'モデル予測：やや強い風',
      detail: `Open-Meteo予測風速 ${maxWind.toFixed(1)} m/s。公式の気象庁「強風注意報」等の発表状況とあわせてご確認ください。`,
      severity: 'caution',
    });
  }

  if (notes.length === 0 && bundle.hourly24h.length > 0) {
    const temps = bundle.hourly24h.map((p) => p.tempC);
    const minT = Math.min(...temps);
    const maxT = Math.max(...temps);
    notes.push({
      id: 'model_range',
      title: 'モデル予測：今後24時間の気温レンジ',
      detail: `予測気温 ${minT.toFixed(1)}℃ ～ ${maxT.toFixed(1)}℃（気象モデルによる参考予測値）。`,
      severity: 'info',
    });
  }

  return notes;
}
