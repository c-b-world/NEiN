export type P2PCode = 551 | 552 | 554 | 556 | 561;

export interface QuakeHypocenter {
  depth: number;
  latitude: number;
  longitude: number;
  magnitude: number;
  name: string;
  reduceName?: string;
}

export interface QuakePoint {
  addr: string;
  isArea: boolean;
  pref: string;
  scale: number;
}

export interface JMAQuake551 {
  id: string;
  code: 551;
  time: string;
  comments?: {
    freeFormComment?: string;
  };
  earthquake: {
    domesticTsunami?: string;
    foreignTsunami?: string;
    hypocenter: QuakeHypocenter;
    maxScale: number;
    time: string;
  };
  issue: {
    correct?: string;
    source: string;
    time: string;
    type: string;
  };
  points?: QuakePoint[];
  isTest?: boolean;
}

export interface JMATsunami552 {
  id: string;
  code: 552;
  time: string;
  cancelled: boolean;
  areas?: Array<{
    grade: 'MajorWarning' | 'Warning' | 'Watch' | 'Unknown' | string;
    immediate: boolean;
    name: string;
  }>;
  issue: {
    source: string;
    time: string;
    type: string;
  };
  isTest?: boolean;
}

export interface EEWDetection554 {
  id: string;
  code: 554;
  time: string;
  type: 'Full' | 'Chime' | string;
  isTest?: boolean;
}

export interface EEWArea {
  arrivalTime?: string;
  kindCode?: string;
  name: string;
  pref: string;
  scaleFrom: number;
  scaleTo: number;
}

export interface EEW556 {
  id: string;
  code: 556;
  time: string;
  cancelled: boolean;
  areas?: EEWArea[];
  earthquake?: {
    arrivalTime?: string;
    condition?: string;
    hypocenter: QuakeHypocenter;
    originTime: string;
  };
  issue: {
    eventId: string;
    serial: string;
    time: string;
  };
  isTest?: boolean;
}

export interface Userquake561 {
  id: string;
  code: 561;
  time: string;
  area: number;
  hop?: number;
  uid?: string;
  isTest?: boolean;
}

export type P2PQuakeRecord =
  | JMAQuake551
  | JMATsunami552
  | EEWDetection554
  | EEW556
  | Userquake561;

export type QuakeFilter = 'all' | 'quake' | 'eew' | 'other';

export type TestEEWPreset = 'kanto_alert' | 'nankai_alert' | 'eew_detection' | 'eew_cancelled';

export interface ScalePresentation {
  short: string;
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  severity: number;
}
