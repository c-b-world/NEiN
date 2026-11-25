import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  EEW556,
  EEWDetection554,
  P2PQuakeRecord,
  QuakeFilter,
  TestEEWPreset,
} from '../types/quake';
import {
  FALLBACK_SAMPLE_RECORDS,
  HISTORY_PAGE_LIMIT,
  INITIAL_HISTORY_PAGES,
  MAX_HISTORY_RECORDS,
  P2PQUAKE_WS_URL,
  POLL_HISTORY_LIMIT,
  buildHistoryApiUrl,
  createTestEEWPayload,
  isEEWRecord,
  matchesQuakeSearch,
  mergeQuakeRecords,
  normalizeQuakeRecord,
} from '../utils/quakeParser';
import {
  buildJmaQuakeArchiveUrl,
  buildJmaTsunamiArchiveUrl,
} from '../utils/archiveApi';
import { playEEWAlertChime } from '../utils/alertSound';
import {
  type BrowserNotificationPermission,
  dispatchEEWBrowserNotification,
  getBrowserNotificationPermission,
  loadNotificationEnabled,
  requestBrowserNotificationPermission,
  saveNotificationEnabled,
} from '../utils/browserNotification';

export type WsStatus = 'connecting' | 'connected' | 'reconnecting' | 'offline';

export interface UseQuakeFeedResult {
  records: P2PQuakeRecord[];
  filteredRecords: P2PQuakeRecord[];
  selectedRecord: P2PQuakeRecord | null;
  selectedId: string | null;
  setSelectedId: (id: string) => void;
  filter: QuakeFilter;
  setFilter: (filter: QuakeFilter) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  dateFrom: string;
  setDateFrom: (ymd: string) => void;
  dateTo: string;
  setDateTo: (ymd: string) => void;
  minScale: number;
  setMinScale: (scale: number) => void;
  minMagnitude: number | null;
  setMinMagnitude: (mag: number | null) => void;
  resetSearchFilters: () => void;
  hasActiveFilters: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  canLoadMore: boolean;
  loadMoreHistory: () => Promise<void>;
  error: string | null;
  lastUpdated: Date | null;
  autoUpdateEnabled: boolean;
  setAutoUpdateEnabled: (enabled: boolean) => void;
  pollIntervalSec: number;
  setPollIntervalSec: (sec: number) => void;
  nextRefreshIn: number;
  wsStatus: WsStatus;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  notificationEnabled: boolean;
  notificationPermission: BrowserNotificationPermission;
  notificationHint: string | null;
  dismissNotificationHint: () => void;
  toggleNotificationEnabled: () => Promise<void>;
  activeEEW: EEW556 | EEWDetection554 | null;
  dismissEEW: () => void;
  refreshNow: () => Promise<void>;
  triggerTestEEW: (preset: TestEEWPreset) => void;
  clearTestRecords: () => void;
  hasTestRecords: boolean;
  archiveDate: string | null;
  selectArchiveDate: (ymd: string) => Promise<void>;
  exitArchiveMode: () => void;
  counts: {
    all: number;
    quake: number;
    eew: number;
    other: number;
  };
}

async function fetchHistoryPage(limit: number, offset: number): Promise<P2PQuakeRecord[]> {
  const endpoint = buildHistoryApiUrl(limit, offset);
  const res = await fetch(endpoint, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`API応答エラー (HTTP ${res.status})`);
  }

  const rawData = (await res.json()) as P2PQuakeRecord[];
  if (!Array.isArray(rawData)) {
    throw new Error('地震データの形式が不正です');
  }
  return rawData.map((item, idx) => normalizeQuakeRecord(item, offset + idx));
}

export function useQuakeFeed(): UseQuakeFeedResult {
  const [records, setRecords] = useState<P2PQuakeRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<QuakeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minScale, setMinScale] = useState(0);
  const [minMagnitude, setMinMagnitude] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [canLoadMore, setCanLoadMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true);
  const [pollIntervalSec, setPollIntervalSec] = useState(10);
  const [nextRefreshIn, setNextRefreshIn] = useState(10);
  const [wsStatus, setWsStatus] = useState<WsStatus>('connecting');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [notificationPermission, setNotificationPermission] =
    useState<BrowserNotificationPermission>(() => getBrowserNotificationPermission());
  const [notificationEnabled, setNotificationEnabled] = useState<boolean>(
    () => loadNotificationEnabled() && getBrowserNotificationPermission() === 'granted'
  );
  const [notificationHint, setNotificationHint] = useState<string | null>(null);

  const [activeEEW, setActiveEEW] = useState<EEW556 | EEWDetection554 | null>(null);

  const [archiveDate, setArchiveDate] = useState<string | null>(null);
  const [archiveRecords, setArchiveRecords] = useState<P2PQuakeRecord[]>([]);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);

  const seenIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef(false);
  const nextOffsetRef = useRef(0);
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;
  const notificationEnabledRef = useRef(notificationEnabled);
  notificationEnabledRef.current = notificationEnabled;
  const archiveDateRef = useRef<string | null>(null);
  archiveDateRef.current = archiveDate;

  const raiseEEWAlert = useCallback((eew: EEW556 | EEWDetection554) => {
    setActiveEEW(eew);
    if (soundEnabledRef.current) {
      playEEWAlertChime(eew.code === 556 && eew.cancelled);
    }
    dispatchEEWBrowserNotification(eew, notificationEnabledRef.current);
  }, []);

  const toggleNotificationEnabled = useCallback(async () => {
    if (notificationEnabledRef.current) {
      setNotificationEnabled(false);
      saveNotificationEnabled(false);
      setNotificationHint(null);
      return;
    }

    const currentPerm = getBrowserNotificationPermission();
    setNotificationPermission(currentPerm);

    if (currentPerm === 'unsupported') {
      setNotificationEnabled(false);
      saveNotificationEnabled(false);
      setNotificationHint('お使いのブラウザまたは表示環境は通知APIに対応していません。');
      return;
    }

    if (currentPerm === 'denied') {
      setNotificationEnabled(false);
      saveNotificationEnabled(false);
      setNotificationHint(
        'ブラウザで通知がブロックされています。サイト設定から通知を許可するとプッシュ通知を受信できます。'
      );
      return;
    }

    if (currentPerm === 'granted') {
      setNotificationEnabled(true);
      saveNotificationEnabled(true);
      setNotificationHint(null);
      return;
    }

    const requested = await requestBrowserNotificationPermission();
    setNotificationPermission(requested);

    if (requested === 'granted') {
      setNotificationEnabled(true);
      saveNotificationEnabled(true);
      setNotificationHint(null);
    } else {
      setNotificationEnabled(false);
      saveNotificationEnabled(false);
      setNotificationHint(
        requested === 'denied'
          ? '通知が拒否されました。ブラウザのサイト設定から許可すると緊急地震速報の通知を受け取れます。'
          : '通知の許可が完了しなかったため、プッシュ通知はOFFのままです。'
      );
    }
  }, []);

  const dismissNotificationHint = useCallback(() => {
    setNotificationHint(null);
  }, []);

  const fetchHistory = useCallback(
    async (isInitial = false) => {
      if (isInitial) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      try {
        let fetchedItems: P2PQuakeRecord[] = [];

        if (isInitial) {
          const offsets = Array.from(
            { length: INITIAL_HISTORY_PAGES },
            (_, idx) => idx * HISTORY_PAGE_LIMIT
          );
          const settled = await Promise.allSettled(
            offsets.map((offset) => fetchHistoryPage(HISTORY_PAGE_LIMIT, offset))
          );

          const firstPage = settled[0];
          if (firstPage.status === 'rejected') {
            throw firstPage.reason;
          }

          let totalFetchedRaw = 0;
          let lastPageWasFull = true;
          for (const result of settled) {
            if (result.status === 'fulfilled') {
              fetchedItems = fetchedItems.concat(result.value);
              totalFetchedRaw += result.value.length;
              lastPageWasFull = result.value.length >= HISTORY_PAGE_LIMIT;
            } else {
              lastPageWasFull = false;
            }
          }
          nextOffsetRef.current = totalFetchedRaw;
          setCanLoadMore(lastPageWasFull && totalFetchedRaw < MAX_HISTORY_RECORDS);
        } else {
          fetchedItems = await fetchHistoryPage(POLL_HISTORY_LIMIT, 0);
        }

        // Detect newly arrived EEW events after initial hydration
        if (initialLoadDoneRef.current) {
          for (const item of fetchedItems) {
            if (!seenIdsRef.current.has(item.id) && isEEWRecord(item)) {
              raiseEEWAlert(item);
              break;
            }
          }
        }

        for (const item of fetchedItems) {
          seenIdsRef.current.add(item.id);
        }
        initialLoadDoneRef.current = true;

        setRecords((prev) => mergeQuakeRecords(fetchedItems, prev, MAX_HISTORY_RECORDS));

        if (!archiveDateRef.current) {
          setSelectedId((prevSelected) => {
            if (prevSelected) return prevSelected;
            const firstQuake = fetchedItems.find((r) => r.code === 551);
            return firstQuake?.id ?? fetchedItems[0]?.id ?? null;
          });
        }

        setLastUpdated(new Date());
        setNextRefreshIn(pollIntervalSec);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : '地震情報の取得に失敗しました';
        setError(msg);
        // Only fall back to deterministic sample if we have zero loaded items
        setRecords((prev) => {
          if (prev.length > 0) return prev;
          return FALLBACK_SAMPLE_RECORDS;
        });
        if (!archiveDateRef.current) {
          setSelectedId((prev) => prev ?? FALLBACK_SAMPLE_RECORDS[0]?.id ?? null);
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [pollIntervalSec, raiseEEWAlert]
  );

  const loadMoreHistory = useCallback(async () => {
    if (isLoadingMore || !canLoadMore || archiveDateRef.current !== null) {
      return;
    }
    setIsLoadingMore(true);
    setError(null);

    try {
      const offset = nextOffsetRef.current;
      const olderItems = await fetchHistoryPage(HISTORY_PAGE_LIMIT, offset);
      for (const item of olderItems) {
        seenIdsRef.current.add(item.id);
      }
      nextOffsetRef.current = offset + olderItems.length;

      setRecords((prev) => {
        const merged = mergeQuakeRecords(olderItems, prev, MAX_HISTORY_RECORDS);
        if (
          olderItems.length < HISTORY_PAGE_LIMIT ||
          nextOffsetRef.current >= MAX_HISTORY_RECORDS ||
          merged.length >= MAX_HISTORY_RECORDS
        ) {
          setCanLoadMore(false);
        }
        return merged;
      });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : '追加履歴の取得に失敗しました';
      setError(msg);
    } finally {
      setIsLoadingMore(false);
    }
  }, [canLoadMore, isLoadingMore]);

  const fetchArchiveDate = useCallback(async (ymd: string) => {
    setArchiveDate(ymd);
    setArchiveLoading(true);
    setArchiveError(null);
    setFilter('all');

    try {
      const quakeUrl = buildJmaQuakeArchiveUrl(ymd, ymd, 100, 0);
      const tsunamiUrl = buildJmaTsunamiArchiveUrl(ymd, ymd, 100, 0);

      const [quakeRes, tsunamiRes] = await Promise.all([
        fetch(quakeUrl, { headers: { Accept: 'application/json' }, cache: 'no-store' }),
        fetch(tsunamiUrl, { headers: { Accept: 'application/json' }, cache: 'no-store' }),
      ]);

      if (!quakeRes.ok) {
        throw new Error(`過去データの取得に失敗しました (HTTP ${quakeRes.status})`);
      }

      const rawQuakes = (await quakeRes.json()) as P2PQuakeRecord[];
      const rawTsunamis = tsunamiRes.ok
        ? ((await tsunamiRes.json()) as P2PQuakeRecord[])
        : [];

      const combined = [
        ...(Array.isArray(rawQuakes) ? rawQuakes : []),
        ...(Array.isArray(rawTsunamis) ? rawTsunamis : []),
      ]
        .map((item, idx) => normalizeQuakeRecord(item, idx))
        .sort((a, b) => (b.time || '').localeCompare(a.time || ''));

      if (archiveDateRef.current !== ymd) return;

      setArchiveRecords(combined);
      setSelectedId(combined[0]?.id ?? null);
    } catch (err) {
      if (archiveDateRef.current !== ymd) return;
      const msg =
        err instanceof Error ? err.message : '過去データの取得に失敗しました';
      setArchiveError(msg);
      setArchiveRecords([]);
      setSelectedId(null);
    } finally {
      if (archiveDateRef.current === ymd) {
        setArchiveLoading(false);
      }
    }
  }, []);

  const exitArchiveMode = useCallback(() => {
    setArchiveDate(null);
    setArchiveRecords([]);
    setArchiveError(null);
    setArchiveLoading(false);
    setFilter('all');
    setSelectedId(
      records.find((r) => r.code === 551)?.id ?? records[0]?.id ?? null
    );
  }, [records]);

  const resetSearchFilters = useCallback(() => {
    setFilter('all');
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
    setMinScale(0);
    setMinMagnitude(null);
  }, []);

  // Initial load
  useEffect(() => {
    void fetchHistory(true);
  }, [fetchHistory]);

  // Countdown + auto-polling interval (paused during archive date inspection)
  useEffect(() => {
    if (!autoUpdateEnabled || archiveDate !== null) {
      return;
    }

    let remaining = pollIntervalSec;
    setNextRefreshIn(remaining);

    const timer = window.setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        remaining = pollIntervalSec;
        setNextRefreshIn(remaining);
        void fetchHistory(false);
      } else {
        setNextRefreshIn(remaining);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [autoUpdateEnabled, pollIntervalSec, fetchHistory, archiveDate]);

  // Real-time WebSocket stream from P2PQuake v2
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    let unmounted = false;

    const connect = () => {
      if (unmounted) return;
      setWsStatus((prev) => (prev === 'offline' ? 'reconnecting' : 'connecting'));

      try {
        ws = new WebSocket(P2PQUAKE_WS_URL);

        ws.onopen = () => {
          if (!unmounted) {
            setWsStatus('connected');
          }
        };

        ws.onmessage = (event) => {
          if (unmounted) return;
          try {
            const rawIncoming = JSON.parse(event.data as string) as P2PQuakeRecord;
            if (!rawIncoming || typeof rawIncoming.code !== 'number') return;
            if (![551, 552, 554, 556, 561].includes(rawIncoming.code)) return;

            const incoming = normalizeQuakeRecord(rawIncoming, Date.now());
            const isNew = !seenIdsRef.current.has(incoming.id);
            seenIdsRef.current.add(incoming.id);

            setRecords((prev) => mergeQuakeRecords([incoming], prev, MAX_HISTORY_RECORDS));
            setLastUpdated(new Date());

            if (isNew && isEEWRecord(incoming)) {
              raiseEEWAlert(incoming);
              setSelectedId(incoming.id);
            } else if (isNew && incoming.code === 551) {
              setSelectedId(incoming.id);
            }
          } catch {
            // Ignore non-JSON or malformed WebSocket frames
          }
        };

        ws.onerror = () => {
          if (!unmounted) {
            setWsStatus('reconnecting');
          }
        };

        ws.onclose = () => {
          if (unmounted) return;
          setWsStatus('reconnecting');
          reconnectTimer = window.setTimeout(connect, 5000);
        };
      } catch {
        setWsStatus('offline');
      }
    };

    connect();

    return () => {
      unmounted = true;
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
      }
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close();
      }
    };
  }, [raiseEEWAlert]);

  const triggerTestEEW = useCallback(
    (preset: TestEEWPreset) => {
      const payload = createTestEEWPayload(preset);
      seenIdsRef.current.add(payload.id);
      setArchiveDate(null);
      setArchiveRecords([]);
      setArchiveError(null);
      setArchiveLoading(false);
      setRecords((prev) => mergeQuakeRecords([payload], prev, MAX_HISTORY_RECORDS));
      setSelectedId(payload.id);
      setLastUpdated(new Date());
      raiseEEWAlert(payload);
    },
    [raiseEEWAlert]
  );

  const clearTestRecords = useCallback(() => {
    setRecords((prev) => {
      const remaining = prev.filter((r) => !r.isTest);
      setSelectedId((cur) => {
        if (cur && remaining.some((r) => r.id === cur)) return cur;
        return remaining.find((r) => r.code === 551)?.id ?? remaining[0]?.id ?? null;
      });
      return remaining;
    });
    setActiveEEW((cur) => (cur?.isTest ? null : cur));
  }, []);

  const dismissEEW = useCallback(() => {
    setActiveEEW(null);
  }, []);

  const refreshNow = useCallback(async () => {
    if (archiveDateRef.current) {
      await fetchArchiveDate(archiveDateRef.current);
    } else {
      await fetchHistory(false);
    }
  }, [fetchArchiveDate, fetchHistory]);

  const activeRecords = archiveDate !== null ? archiveRecords : records;

  const counts = useMemo(() => {
    let quake = 0;
    let eew = 0;
    let other = 0;
    for (const r of activeRecords) {
      if (r.code === 551) quake++;
      else if (r.code === 554 || r.code === 556) eew++;
      else other++;
    }
    return {
      all: activeRecords.length,
      quake,
      eew,
      other,
    };
  }, [activeRecords]);

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filter !== 'all' ||
        searchQuery.trim() ||
        dateFrom ||
        dateTo ||
        minScale > 0 ||
        (minMagnitude !== null && minMagnitude > 0)
    );
  }, [dateFrom, dateTo, filter, minMagnitude, minScale, searchQuery]);

  const filteredRecords = useMemo(() => {
    const criteria = {
      filter,
      searchQuery,
      dateFrom,
      dateTo,
      minScale,
      minMagnitude,
    };
    return activeRecords.filter((r) => matchesQuakeSearch(r, criteria));
  }, [activeRecords, dateFrom, dateTo, filter, minMagnitude, minScale, searchQuery]);

  const selectedRecord = useMemo(() => {
    if (!activeRecords.length) return null;
    const inFiltered = filteredRecords.find((r) => r.id === selectedId);
    if (inFiltered) return inFiltered;
    if (hasActiveFilters) {
      return filteredRecords[0] ?? null;
    }
    return activeRecords.find((r) => r.id === selectedId) ?? activeRecords[0];
  }, [activeRecords, filteredRecords, hasActiveFilters, selectedId]);

  const hasTestRecords = useMemo(() => records.some((r) => r.isTest), [records]);

  return {
    records: activeRecords,
    filteredRecords,
    selectedRecord,
    selectedId: selectedRecord?.id ?? null,
    setSelectedId,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    minScale,
    setMinScale,
    minMagnitude,
    setMinMagnitude,
    resetSearchFilters,
    hasActiveFilters,
    isLoading: archiveDate !== null ? archiveLoading : isLoading,
    isRefreshing: archiveDate !== null ? archiveLoading : isRefreshing,
    isLoadingMore,
    canLoadMore: archiveDate === null && canLoadMore,
    loadMoreHistory,
    error: archiveDate !== null ? archiveError : error,
    lastUpdated,
    autoUpdateEnabled,
    setAutoUpdateEnabled,
    pollIntervalSec,
    setPollIntervalSec,
    nextRefreshIn,
    wsStatus,
    soundEnabled,
    setSoundEnabled,
    notificationEnabled,
    notificationPermission,
    notificationHint,
    dismissNotificationHint,
    toggleNotificationEnabled,
    activeEEW,
    dismissEEW,
    refreshNow,
    triggerTestEEW,
    clearTestRecords,
    hasTestRecords,
    archiveDate,
    selectArchiveDate: fetchArchiveDate,
    exitArchiveMode,
    counts,
  };
}
