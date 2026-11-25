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
  P2PQUAKE_WS_URL,
  REQUESTED_API_URL,
  createTestEEWPayload,
  isEEWRecord,
  matchesFilter,
  mergeQuakeRecords,
  normalizeP2PQuakeUrl,
  normalizeQuakeRecord,
} from '../utils/quakeParser';
import { playEEWAlertChime } from '../utils/alertSound';

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
  isLoading: boolean;
  isRefreshing: boolean;
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
  activeEEW: EEW556 | EEWDetection554 | null;
  dismissEEW: () => void;
  refreshNow: () => Promise<void>;
  triggerTestEEW: (preset: TestEEWPreset) => void;
  clearTestRecords: () => void;
  hasTestRecords: boolean;
  counts: {
    all: number;
    quake: number;
    eew: number;
    other: number;
  };
}

export function useQuakeFeed(): UseQuakeFeedResult {
  const [records, setRecords] = useState<P2PQuakeRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<QuakeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true);
  const [pollIntervalSec, setPollIntervalSec] = useState(10);
  const [nextRefreshIn, setNextRefreshIn] = useState(10);
  const [wsStatus, setWsStatus] = useState<WsStatus>('connecting');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeEEW, setActiveEEW] = useState<EEW556 | EEWDetection554 | null>(null);

  const seenIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef(false);
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  const raiseEEWAlert = useCallback((eew: EEW556 | EEWDetection554) => {
    setActiveEEW(eew);
    if (soundEnabledRef.current) {
      playEEWAlertChime(eew.code === 556 && eew.cancelled);
    }
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
        const endpoint = normalizeP2PQuakeUrl(REQUESTED_API_URL);
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
        const data = rawData.map((item, idx) => normalizeQuakeRecord(item, idx));

        // Detect newly arrived EEW events after initial hydration
        if (initialLoadDoneRef.current) {
          for (const item of data) {
            if (!seenIdsRef.current.has(item.id) && isEEWRecord(item)) {
              raiseEEWAlert(item);
              break;
            }
          }
        }

        for (const item of data) {
          seenIdsRef.current.add(item.id);
        }
        initialLoadDoneRef.current = true;

        setRecords((prev) => mergeQuakeRecords(data, prev, 30));

        setSelectedId((prevSelected) => {
          if (prevSelected) return prevSelected;
          const firstQuake = data.find((r) => r.code === 551);
          return firstQuake?.id ?? data[0]?.id ?? null;
        });

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
        setSelectedId((prev) => prev ?? FALLBACK_SAMPLE_RECORDS[0]?.id ?? null);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [pollIntervalSec, raiseEEWAlert]
  );

  // Initial load
  useEffect(() => {
    void fetchHistory(true);
  }, [fetchHistory]);

  // Countdown + auto-polling interval (no side effects inside state updater)
  useEffect(() => {
    if (!autoUpdateEnabled) {
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
  }, [autoUpdateEnabled, pollIntervalSec, fetchHistory]);

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

            setRecords((prev) => mergeQuakeRecords([incoming], prev, 30));
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
      setRecords((prev) => mergeQuakeRecords([payload], prev, 30));
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
    await fetchHistory(false);
  }, [fetchHistory]);

  const counts = useMemo(() => {
    let quake = 0;
    let eew = 0;
    let other = 0;
    for (const r of records) {
      if (r.code === 551) quake++;
      else if (r.code === 554 || r.code === 556) eew++;
      else other++;
    }
    return {
      all: records.length,
      quake,
      eew,
      other,
    };
  }, [records]);

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return records.filter((r) => {
      if (!matchesFilter(r, filter)) return false;
      if (!q) return true;
      if (r.code === 551) {
        const name = r.earthquake.hypocenter.name?.toLowerCase() ?? '';
        const prefs = r.points?.map((p) => `${p.pref}${p.addr}`.toLowerCase()).join(' ') ?? '';
        return name.includes(q) || prefs.includes(q);
      }
      if (r.code === 556) {
        const name = r.earthquake?.hypocenter.name?.toLowerCase() ?? '';
        const areas = r.areas?.map((a) => `${a.pref}${a.name}`.toLowerCase()).join(' ') ?? '';
        return name.includes(q) || areas.includes(q) || '緊急地震速報'.includes(q);
      }
      if (r.code === 554) {
        return '緊急地震速報'.includes(q) || '発表検出'.includes(q);
      }
      if (r.code === 552) {
        return '津波予報'.includes(q);
      }
      return `地域コード ${r.area}`.includes(q) || '地震感知'.includes(q);
    });
  }, [records, filter, searchQuery]);

  const selectedRecord = useMemo(() => {
    if (!records.length) return null;
    return records.find((r) => r.id === selectedId) ?? filteredRecords[0] ?? records[0];
  }, [records, filteredRecords, selectedId]);

  const hasTestRecords = useMemo(() => records.some((r) => r.isTest), [records]);

  return {
    records,
    filteredRecords,
    selectedRecord,
    selectedId: selectedRecord?.id ?? null,
    setSelectedId,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    isLoading,
    isRefreshing,
    error,
    lastUpdated,
    autoUpdateEnabled,
    setAutoUpdateEnabled,
    pollIntervalSec,
    setPollIntervalSec,
    nextRefreshIn,
    wsStatus,
    soundEnabled,
    setSoundEnabled,
    activeEEW,
    dismissEEW,
    refreshNow,
    triggerTestEEW,
    clearTestRecords,
    hasTestRecords,
    counts,
  };
}
