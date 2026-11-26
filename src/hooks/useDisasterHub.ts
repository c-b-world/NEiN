import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { JAPAN_WEATHER_OFFICES, getWeatherOfficeByCode } from '../data/japanWeatherRegions';
import type {
  AmedasStationPoint,
  DashboardCardId,
  DashboardCardSetting,
  IntegratedMapConfig,
  JmaQuakeSummaryItem,
  JmaTsunamiSummaryItem,
  JmaXmlBulletin,
  NotificationHistoryEntry,
  NotificationPreferences,
  OpenMeteoAirQualityData,
  OpenMeteoMarineData,
  RegisteredRegion,
  SourceHealthRecord,
  TyphoonActiveInfo,
  UnifiedTimelineEvent,
  VolcanoLocationEntry,
} from '../types/disaster';
import type { P2PQuakeRecord } from '../types/quake';
import type { PrefectureOverviewRow } from '../types/weather';
import {
  DEFAULT_DASHBOARD_CARDS,
  DEFAULT_MAP_CONFIG,
  buildUnifiedTimeline,
  loadDashboardCards,
  loadMapConfig,
  saveDashboardCards,
  saveMapConfig,
} from '../utils/disasterConfigStorage';
import {
  fetchOpenMeteoAirQuality,
  fetchOpenMeteoMarine,
} from '../utils/envMarineApi';
import type { AppLanguage } from '../utils/i18n';
import {
  fetchJmaQuakeFeed,
  fetchJmaTsunamiDetail,
  fetchJmaTsunamiFeed,
  fetchJmaXmlAllChannels,
  fetchNationwideAmedasPoints,
  fetchTyphoonFeed,
  fetchVolcanoDirectory,
} from '../utils/jmaFeedsApi';
import {
  type RadarTimelinesBundle,
  fetchAllRadarTimelines,
} from '../utils/jmaTilesApi';
import {
  loadNotificationHistory,
  loadNotificationPrefs,
  saveNotificationHistory,
  saveNotificationPrefs,
} from '../utils/notificationCenter';
import {
  createRegionFromOffice,
  findNearestWeatherOffice,
  loadRegisteredRegions,
  saveRegisteredRegions,
} from '../utils/regionWatchlist';
import {
  getAllSourceHealth,
  subscribeSourceHealth,
} from '../utils/sourceHealthTracker';
import { hydrateRegionOverviewOffices } from '../utils/weatherApi';

export function useDisasterHub(lang: AppLanguage, p2pRecords: P2PQuakeRecord[]) {
  const [jmaQuakes, setJmaQuakes] = useState<JmaQuakeSummaryItem[]>([]);
  const [jmaTsunamis, setJmaTsunamis] = useState<JmaTsunamiSummaryItem[]>([]);
  const [xmlBulletins, setXmlBulletins] = useState<JmaXmlBulletin[]>([]);
  const [volcanoes, setVolcanoes] = useState<VolcanoLocationEntry[]>([]);
  const [typhoons, setTyphoons] = useState<TyphoonActiveInfo[]>([]);
  const [radarTimelines, setRadarTimelines] = useState<RadarTimelinesBundle | null>(null);
  const [amedasPoints, setAmedasPoints] = useState<AmedasStationPoint[]>([]);
  const [amedasObservedAt, setAmedasObservedAt] = useState<string>('');

  const [registeredRegions, setRegisteredRegions] = useState<RegisteredRegion[]>(() =>
    loadRegisteredRegions(),
  );
  const [regionSnapshots, setRegionSnapshots] = useState<PrefectureOverviewRow[]>([]);
  const [activeRegionOfficeCode, setActiveRegionOfficeCode] = useState<string>(
    () => loadRegisteredRegions()[0]?.officeCode ?? '130000',
  );

  const [airQuality, setAirQuality] = useState<OpenMeteoAirQualityData | null>(null);
  const [marine, setMarine] = useState<OpenMeteoMarineData | null>(null);

  const [dashboardCards, setDashboardCards] = useState<DashboardCardSetting[]>(() =>
    loadDashboardCards(),
  );
  const [mapConfig, setMapConfig] = useState<IntegratedMapConfig>(() => loadMapConfig());
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(() =>
    loadNotificationPrefs(),
  );
  const [notificationHistory, setNotificationHistory] = useState<NotificationHistoryEntry[]>(() =>
    loadNotificationHistory(),
  );
  const [sourceHealth, setSourceHealth] = useState<SourceHealthRecord[]>(() =>
    getAllSourceHealth(),
  );

  const [isLoadingFeeds, setIsLoadingFeeds] = useState(false);
  const [feedErrors, setFeedErrors] = useState<Record<string, string>>({});
  const lastEnvOfficeRef = useRef<string>('');

  useEffect(() => {
    const unsub = subscribeSourceHealth(() => {
      setSourceHealth(getAllSourceHealth());
    });
    return unsub;
  }, []);

  useEffect(() => {
    saveRegisteredRegions(registeredRegions);
  }, [registeredRegions]);

  useEffect(() => {
    saveDashboardCards(dashboardCards);
  }, [dashboardCards]);

  useEffect(() => {
    saveMapConfig(mapConfig);
  }, [mapConfig]);

  useEffect(() => {
    saveNotificationPrefs(notificationPrefs);
  }, [notificationPrefs]);

  const refreshCoreFeeds = useCallback(async (forceRefresh = false) => {
    setIsLoadingFeeds(true);
    const errors: Record<string, string> = {};

    const [qRes, tRes, xRes, tyRes, rRes] = await Promise.allSettled([
      fetchJmaQuakeFeed(forceRefresh),
      fetchJmaTsunamiFeed(forceRefresh),
      fetchJmaXmlAllChannels(forceRefresh),
      fetchTyphoonFeed(forceRefresh),
      fetchAllRadarTimelines(forceRefresh),
    ]);

    if (qRes.status === 'fulfilled') setJmaQuakes(qRes.value);
    else errors.jmaQuake = qRes.reason instanceof Error ? qRes.reason.message : '取得失敗';

    if (tRes.status === 'fulfilled') setJmaTsunamis(tRes.value);
    else errors.jmaTsunami = tRes.reason instanceof Error ? tRes.reason.message : '取得失敗';

    if (xRes.status === 'fulfilled') setXmlBulletins(xRes.value);
    else errors.jmaXml = xRes.reason instanceof Error ? xRes.reason.message : '取得失敗';

    if (tyRes.status === 'fulfilled') setTyphoons(tyRes.value);
    else errors.typhoon = tyRes.reason instanceof Error ? tyRes.reason.message : '取得失敗';

    if (rRes.status === 'fulfilled') setRadarTimelines(rRes.value);
    else errors.radar = rRes.reason instanceof Error ? rRes.reason.message : '取得失敗';

    setFeedErrors((prev) => ({ ...prev, ...errors }));
    setIsLoadingFeeds(false);
  }, []);

  const loadVolcanoes = useCallback(async (forceRefresh = false) => {
    try {
      const list = await fetchVolcanoDirectory(forceRefresh);
      setVolcanoes(list);
    } catch (err) {
      setFeedErrors((prev) => ({
        ...prev,
        volcano: err instanceof Error ? err.message : '火山データ取得失敗',
      }));
    }
  }, []);

  const loadNationwideAmedas = useCallback(async (forceRefresh = false) => {
    try {
      const res = await fetchNationwideAmedasPoints(forceRefresh);
      setAmedasPoints(res.points);
      setAmedasObservedAt(res.observedAtIso);
    } catch {
      // Captured in sourceHealthTracker
    }
  }, []);

  const loadEnvAndMarineForOffice = useCallback(
    async (officeCode: string, forceRefresh = false) => {
      const office = getWeatherOfficeByCode(officeCode);
      lastEnvOfficeRef.current = office.officeCode;
      const [aq, mr] = await Promise.all([
        fetchOpenMeteoAirQuality(office, forceRefresh),
        fetchOpenMeteoMarine(office.lat, office.lon, forceRefresh),
      ]);
      if (lastEnvOfficeRef.current === office.officeCode) {
        setAirQuality(aq);
        setMarine(mr);
      }
    },
    [],
  );

  // Initial core feed hydration + volcano catalog + active region env/marine
  useEffect(() => {
    void refreshCoreFeeds(false);
    void loadVolcanoes(false);
  }, [refreshCoreFeeds, loadVolcanoes]);

  useEffect(() => {
    void loadEnvAndMarineForOffice(activeRegionOfficeCode, false);
  }, [activeRegionOfficeCode, loadEnvAndMarineForOffice]);

  // Hydrate weather & warning summaries for registered watchlist regions
  useEffect(() => {
    if (registeredRegions.length === 0) {
      setRegionSnapshots([]);
      return;
    }
    const offices = registeredRegions
      .map((r) => JAPAN_WEATHER_OFFICES.find((o) => o.officeCode === r.officeCode))
      .filter((o): o is NonNullable<typeof o> => Boolean(o));
    if (offices.length === 0) return;

    const controller = new AbortController();
    void hydrateRegionOverviewOffices(offices, {
      forceRefresh: false,
      maxConcurrency: 2,
      signal: controller.signal,
      onProgress: (rows) => {
        if (!controller.signal.aborted) {
          setRegionSnapshots(rows);
        }
      },
    }).catch(() => {});

    return () => controller.abort();
  }, [registeredRegions]);

  const loadTsunamiEventDetail = useCallback(async (item: JmaTsunamiSummaryItem) => {
    try {
      const detailed = await fetchJmaTsunamiDetail(item);
      setJmaTsunamis((prev) => prev.map((x) => (x.id === detailed.id ? detailed : x)));
      return detailed;
    } catch {
      return item;
    }
  }, []);

  const addRegisteredRegion = useCallback((officeCode: string) => {
    const office = getWeatherOfficeByCode(officeCode);
    setRegisteredRegions((prev) => {
      if (prev.some((r) => r.officeCode === office.officeCode)) return prev;
      return [...prev, createRegionFromOffice(office)];
    });
  }, []);

  const removeRegisteredRegion = useCallback((id: string) => {
    setRegisteredRegions((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const moveRegisteredRegion = useCallback((id: string, dir: -1 | 1) => {
    setRegisteredRegions((prev) => {
      const idx = prev.findIndex((r) => r.id === id);
      if (idx < 0) return prev;
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.splice(target, 0, item);
      return copy;
    });
  }, []);

  const addNearestRegionByCoords = useCallback((lat: number, lon: number) => {
    const office = findNearestWeatherOffice(lat, lon);
    setRegisteredRegions((prev) => {
      if (prev.some((r) => r.officeCode === office.officeCode)) return prev;
      return [createRegionFromOffice(office), ...prev];
    });
    setActiveRegionOfficeCode(office.officeCode);
    return office;
  }, []);

  const moveDashboardCard = useCallback((id: DashboardCardId, dir: -1 | 1) => {
    setDashboardCards((prev) => {
      const idx = prev.findIndex((c) => c.id === id);
      if (idx < 0) return prev;
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.splice(target, 0, item);
      return copy;
    });
  }, []);

  const toggleDashboardCardVisible = useCallback((id: DashboardCardId) => {
    setDashboardCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c)),
    );
  }, []);

  const toggleDashboardCardSize = useCallback((id: DashboardCardId) => {
    setDashboardCards((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, size: c.size === 'wide' ? 'compact' : 'wide' } : c,
      ),
    );
  }, []);

  const resetDashboardCards = useCallback(() => {
    setDashboardCards(DEFAULT_DASHBOARD_CARDS);
  }, []);

  const resetMapConfig = useCallback(() => {
    setMapConfig(DEFAULT_MAP_CONFIG);
  }, []);

  const clearNotificationHistory = useCallback(() => {
    saveNotificationHistory([]);
    setNotificationHistory([]);
  }, []);

  const refreshNotificationHistory = useCallback(() => {
    setNotificationHistory(loadNotificationHistory());
  }, []);

  const refreshEverything = useCallback(async () => {
    await Promise.all([
      refreshCoreFeeds(true),
      loadVolcanoes(true),
      loadEnvAndMarineForOffice(activeRegionOfficeCode, true),
    ]);
  }, [
    activeRegionOfficeCode,
    loadEnvAndMarineForOffice,
    loadVolcanoes,
    refreshCoreFeeds,
  ]);

  const timelineEvents: UnifiedTimelineEvent[] = useMemo(
    () =>
      buildUnifiedTimeline({
        p2pRecords,
        jmaQuakes,
        jmaTsunamis,
        xmlBulletins,
        lang,
      }),
    [jmaQuakes, jmaTsunamis, lang, p2pRecords, xmlBulletins],
  );

  return {
    jmaQuakes,
    jmaTsunamis,
    xmlBulletins,
    volcanoes,
    typhoons,
    radarTimelines,
    amedasPoints,
    amedasObservedAt,
    loadNationwideAmedas,
    loadTsunamiEventDetail,
    registeredRegions,
    regionSnapshots,
    activeRegionOfficeCode,
    setActiveRegionOfficeCode,
    addRegisteredRegion,
    removeRegisteredRegion,
    moveRegisteredRegion,
    addNearestRegionByCoords,
    airQuality,
    marine,
    loadEnvAndMarineForOffice,
    dashboardCards,
    moveDashboardCard,
    toggleDashboardCardVisible,
    toggleDashboardCardSize,
    resetDashboardCards,
    mapConfig,
    setMapConfig,
    resetMapConfig,
    notificationPrefs,
    setNotificationPrefs,
    notificationHistory,
    clearNotificationHistory,
    refreshNotificationHistory,
    sourceHealth,
    timelineEvents,
    isLoadingFeeds,
    feedErrors,
    refreshCoreFeeds,
    refreshEverything,
  };
}
