import type {
  NotificationCategoryKey,
  NotificationHistoryEntry,
  NotificationPreferences,
} from '../types/disaster';

const PREFS_KEY = 'nein_notification_prefs_v1';
const HISTORY_KEY = 'nein_notification_history_v1';

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  enabledCategories: {
    quake: true,
    eew: true,
    tsunami: true,
    weather_warning: true,
    typhoon: true,
    landslide_flood: true,
    volcano: true,
    heatstroke: true,
  },
  targetOfficeCodes: [],
  minQuakeScale: 30,
  warningLevelFilter: 'all',
  chimeVolume: 0.7,
  desktopNotifications: false,
  inAppToasts: true,
};

export function loadNotificationPrefs(): NotificationPreferences {
  if (typeof window === 'undefined' || !window.localStorage) {
    return DEFAULT_NOTIFICATION_PREFS;
  }
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_PREFS;
    const parsed = JSON.parse(raw) as Partial<NotificationPreferences>;
    return {
      ...DEFAULT_NOTIFICATION_PREFS,
      ...parsed,
      enabledCategories: {
        ...DEFAULT_NOTIFICATION_PREFS.enabledCategories,
        ...(parsed.enabledCategories ?? {}),
      },
      targetOfficeCodes: Array.isArray(parsed.targetOfficeCodes)
        ? parsed.targetOfficeCodes
        : [],
    };
  } catch {
    return DEFAULT_NOTIFICATION_PREFS;
  }
}

export function saveNotificationPrefs(prefs: NotificationPreferences): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadNotificationHistory(): NotificationHistoryEntry[] {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveNotificationHistory(items: NotificationHistoryEntry[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 50)));
  } catch {
    // Ignore
  }
}

// In-memory deduplication & active toast subscribers
const dispatchedIds = new Set<string>();
const toastListeners = new Set<(item: NotificationHistoryEntry) => void>();

export function subscribeInAppToasts(
  cb: (item: NotificationHistoryEntry) => void,
): () => void {
  toastListeners.add(cb);
  return () => {
    toastListeners.delete(cb);
  };
}

export function recordAndDispatchNotification(
  entry: NotificationHistoryEntry,
  prefs: NotificationPreferences,
): boolean {
  if (dispatchedIds.has(entry.id)) {
    return false;
  }
  if (!prefs.enabledCategories[entry.category]) {
    return false;
  }
  dispatchedIds.add(entry.id);

  const history = [entry, ...loadNotificationHistory()].slice(0, 50);
  saveNotificationHistory(history);

  if (prefs.inAppToasts) {
    for (const cb of toastListeners) {
      try {
        cb(entry);
      } catch {
        // Ignore subscriber errors
      }
    }
  }
  return true;
}

export function playChimeWithVolume(volume01: number, isCancelled = false): void {
  if (typeof window === 'undefined') return;
  const vol = Math.max(0.01, Math.min(1, volume01)) * 0.25;
  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const now = ctx.currentTime;
    const notes = isCancelled ? [523.25, 392.0] : [880.0, 1174.66, 880.0, 1174.66];
    const step = isCancelled ? 0.16 : 0.14;
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isCancelled ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * step);
      gain.gain.setValueAtTime(0.0001, now + idx * step);
      gain.gain.exponentialRampToValueAtTime(vol, now + idx * step + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * step + step - 0.01);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * step);
      osc.stop(now + idx * step + step);
    });
  } catch {
    // Ignore autoplay blocks
  }
}

export function shouldNotifyForScale(
  scale: number,
  minScale: number,
  category: NotificationCategoryKey,
): boolean {
  if (category === 'eew' || category === 'tsunami') return true;
  return scale >= minScale;
}
