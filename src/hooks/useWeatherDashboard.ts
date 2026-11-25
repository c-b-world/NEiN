import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getWeatherOfficeByCode,
  JAPAN_WEATHER_OFFICES,
} from '../data/japanWeatherRegions';
import type {
  AmedasObservation,
  JmaForecastBundle,
  JmaWarningBundle,
  OpenMeteoBundle,
  PrefectureOverviewRow,
  WeatherRegionGroup,
} from '../types/weather';
import {
  fetchOfficeWeatherDetail,
  hydrateRegionOverviewOffices,
} from '../utils/weatherApi';

const REFRESH_COOLDOWN_SEC = 10;

export function useWeatherDashboard(isActive: boolean) {
  const [selectedOfficeCode, setSelectedOfficeCode] = useState<string>('130000');
  const [selectedAreaCode, setSelectedAreaCode] = useState<string>('130010');
  const [overviewRegionGroup, setOverviewRegionGroup] = useState<
    WeatherRegionGroup | 'all'
  >('kanto');

  const [forecast, setForecast] = useState<JmaForecastBundle | null>(null);
  const [warning, setWarning] = useState<JmaWarningBundle | null>(null);
  const [amedas, setAmedas] = useState<AmedasObservation | null>(null);
  const [openMeteo, setOpenMeteo] = useState<OpenMeteoBundle | null>(null);

  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);
  const [refreshCooldownSec, setRefreshCooldownSec] = useState<number>(0);

  const [overviewRows, setOverviewRows] = useState<PrefectureOverviewRow[]>([]);
  const [isLoadingOverview, setIsLoadingOverview] = useState<boolean>(false);

  const selectedOffice = useMemo(
    () => getWeatherOfficeByCode(selectedOfficeCode),
    [selectedOfficeCode],
  );

  const overviewOffices = useMemo(() => {
    if (overviewRegionGroup === 'all') {
      return JAPAN_WEATHER_OFFICES;
    }
    return JAPAN_WEATHER_OFFICES.filter(
      (office) => office.regionGroup === overviewRegionGroup,
    );
  }, [overviewRegionGroup]);

  const detailReqSeq = useRef(0);

  const loadSelectedOffice = useCallback(
    async (
      officeCode: string,
      areaCode?: string,
      forceRefresh = false,
    ) => {
      const seq = ++detailReqSeq.current;
      const office = getWeatherOfficeByCode(officeCode);
      setIsLoadingDetail(true);
      try {
        const result = await fetchOfficeWeatherDetail(
          office,
          areaCode ?? office.defaultAreaCode,
          forceRefresh,
        );
        if (detailReqSeq.current !== seq) return;
        setForecast(result.forecast);
        setWarning(result.warning);
        setAmedas(result.amedas);
        setOpenMeteo(result.openMeteo);
        setLastFetchedAt(result.fetchedAt);
        if (result.forecast.activeAreaCode) {
          setSelectedAreaCode(result.forecast.activeAreaCode);
        }
      } finally {
        if (detailReqSeq.current === seq) {
          setIsLoadingDetail(false);
        }
      }
    },
    [],
  );

  // Initial & office/area switch fetch when weather tab becomes active
  useEffect(() => {
    if (!isActive) return;
    void loadSelectedOffice(selectedOfficeCode, selectedAreaCode, false);
  }, [isActive, selectedOfficeCode, selectedAreaCode, loadSelectedOffice]);

  // Regional prefecture overview hydration with bounded concurrency
  useEffect(() => {
    if (!isActive) return;
    const controller = new AbortController();
    setIsLoadingOverview(true);

    hydrateRegionOverviewOffices(overviewOffices, {
      forceRefresh: false,
      maxConcurrency: 3,
      signal: controller.signal,
      onProgress: (rows) => {
        if (!controller.signal.aborted) {
          setOverviewRows(rows);
        }
      },
    })
      .catch(() => {
        // Individual row errors are captured inside buildOverviewRowFromCache
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoadingOverview(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [isActive, overviewOffices]);

  // Rate-limit countdown timer
  useEffect(() => {
    if (refreshCooldownSec <= 0) return;
    const timer = setInterval(() => {
      setRefreshCooldownSec((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [refreshCooldownSec]);

  const selectOffice = useCallback((officeCode: string) => {
    const nextOffice = getWeatherOfficeByCode(officeCode);
    setSelectedOfficeCode(nextOffice.officeCode);
    setSelectedAreaCode(nextOffice.defaultAreaCode);
  }, []);

  const selectSubArea = useCallback((areaCode: string) => {
    setSelectedAreaCode(areaCode);
  }, []);

  const refreshNow = useCallback(async () => {
    if (refreshCooldownSec > 0 || isLoadingDetail) return;
    setRefreshCooldownSec(REFRESH_COOLDOWN_SEC);
    await loadSelectedOffice(selectedOfficeCode, selectedAreaCode, true);
  }, [
    refreshCooldownSec,
    isLoadingDetail,
    loadSelectedOffice,
    selectedOfficeCode,
    selectedAreaCode,
  ]);

  return {
    selectedOffice,
    selectedOfficeCode,
    selectedAreaCode,
    selectOffice,
    selectSubArea,
    forecast,
    warning,
    amedas,
    openMeteo,
    isLoadingDetail,
    lastFetchedAt,
    refreshCooldownSec,
    refreshNow,
    overviewRegionGroup,
    setOverviewRegionGroup,
    overviewRows,
    isLoadingOverview,
  };
}
