import type { EEW556, EEWDetection554 } from '../types/quake';
import { formatDepth, formatMagnitude, getEEWMaxScale, getScalePresentation } from './quakeParser';

const STORAGE_KEY = 'nein_eew_push_notifications';

export type BrowserNotificationPermission = NotificationPermission | 'unsupported';

export interface EEWNotificationPayload {
  title: string;
  body: string;
  tag: string;
  requireInteraction: boolean;
}

export function isBrowserNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getBrowserNotificationPermission(): BrowserNotificationPermission {
  if (!isBrowserNotificationSupported()) {
    return 'unsupported';
  }
  return window.Notification.permission;
}

export function loadNotificationEnabled(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function saveNotificationEnabled(enabled: boolean): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
    }
  } catch {
    // Ignore storage quota / privacy mode errors
  }
}

export async function requestBrowserNotificationPermission(): Promise<BrowserNotificationPermission> {
  if (!isBrowserNotificationSupported()) {
    return 'unsupported';
  }
  try {
    const permission = await window.Notification.requestPermission();
    return permission;
  } catch {
    return getBrowserNotificationPermission();
  }
}

export function buildEEWNotificationPayload(
  record: EEW556 | EEWDetection554,
): EEWNotificationPayload {
  const testTag = record.isTest ? '【テスト】' : '';

  if (record.code === 554) {
    return {
      title: `${testTag}緊急地震速報（発表検出）`,
      body: `緊急地震速報の発表を検出しました（${record.time}）。今後の情報にご注意ください。`,
      tag: record.id,
      requireInteraction: true,
    };
  }

  if (record.cancelled) {
    return {
      title: `${testTag}緊急地震速報（取消）`,
      body: `緊急地震速報 第${record.issue.serial}報は取り消されました。`,
      tag: record.id,
      requireInteraction: false,
    };
  }

  const hypo = record.earthquake?.hypocenter;
  const hypoName = hypo?.name || '震源調査中';
  const maxScale = getEEWMaxScale(record);
  const scaleLabel = maxScale > 0 ? getScalePresentation(maxScale).label : '推定中';
  const mag = formatMagnitude(hypo?.magnitude);
  const depth = formatDepth(hypo?.depth);
  const areaNames = (record.areas ?? [])
    .slice(0, 4)
    .map((a) => a.name)
    .join('・');
  const moreSuffix = (record.areas?.length ?? 0) > 4 ? ` ほか${record.areas!.length - 4}地域` : '';

  return {
    title: `${testTag}緊急地震速報：${hypoName}（最大予測 ${scaleLabel}）`,
    body: `${mag} / 深さ ${depth}${areaNames ? ` / 対象: ${areaNames}${moreSuffix}` : ''}。強い揺れに警戒してください。`,
    tag: record.id,
    requireInteraction: true,
  };
}

export function dispatchEEWBrowserNotification(
  record: EEW556 | EEWDetection554,
  enabled: boolean,
): boolean {
  if (!enabled || !isBrowserNotificationSupported()) {
    return false;
  }
  if (window.Notification.permission !== 'granted') {
    return false;
  }

  try {
    const payload = buildEEWNotificationPayload(record);
    const notification = new window.Notification(payload.title, {
      body: payload.body,
      tag: payload.tag,
      requireInteraction: payload.requireInteraction,
    });
    notification.onclick = () => {
      try {
        window.focus();
        notification.close();
      } catch {
        // Ignore window focus restrictions
      }
    };
    return true;
  } catch {
    return false;
  }
}
