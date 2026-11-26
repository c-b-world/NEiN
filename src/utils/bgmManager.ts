export type BgmSourceType = 'builtin' | 'mp3' | 'mp4' | 'youtube' | 'spotify';

export type BuiltinBgmPresetId =
  | 'calm_horizon'
  | 'night_observatory'
  | 'rain_echo'
  | 'aurora_pad';

export type SpotifyMediaKind = 'track' | 'album' | 'playlist' | 'episode' | 'show';

export interface BgmTrack {
  id: string;
  title: string;
  subtitle?: string;
  source: BgmSourceType;
  presetId?: BuiltinBgmPresetId;
  originalUrl?: string;
  embedUrl?: string;
  youtubeVideoId?: string;
  youtubePlaylistId?: string;
  spotifyKind?: SpotifyMediaKind;
  spotifyId?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  addedAt?: string;
}

export interface BgmSettings {
  enabled: boolean;
  selectedTrackId: string;
  volume: number; // 0..100
  muted: boolean;
  loop: boolean;
  customTracks: BgmTrack[];
}

export const BGM_SETTINGS_STORAGE_KEY = 'nein_bgm_settings_v1';

export const BUILTIN_BGM_TRACKS: readonly BgmTrack[] = [
  {
    id: 'builtin-calm-horizon',
    title: 'Calm Horizon',
    subtitle: '静穏なアンビエント・パッド（内蔵ループ）',
    source: 'builtin',
    presetId: 'calm_horizon',
  },
  {
    id: 'builtin-night-observatory',
    title: 'Night Observatory',
    subtitle: '夜間観測所・ディープアンビエント（内蔵ループ）',
    source: 'builtin',
    presetId: 'night_observatory',
  },
  {
    id: 'builtin-rain-echo',
    title: 'Quiet Rain & Glass',
    subtitle: '穏やかな雨音と残響（内蔵ループ）',
    source: 'builtin',
    presetId: 'rain_echo',
  },
  {
    id: 'builtin-aurora-pad',
    title: 'Aurora Drift',
    subtitle: '柔らかな浮遊感のシンセ・ドローン（内蔵ループ）',
    source: 'builtin',
    presetId: 'aurora_pad',
  },
] as const;

export const DEFAULT_BGM_SETTINGS: BgmSettings = {
  enabled: false,
  selectedTrackId: BUILTIN_BGM_TRACKS[0].id,
  volume: 45,
  muted: false,
  loop: true,
  customTracks: [],
};

export function clampBgmVolume(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_BGM_SETTINGS.volume;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function getAllBgmTracks(settings: BgmSettings): BgmTrack[] {
  return [...BUILTIN_BGM_TRACKS, ...settings.customTracks];
}

export function resolveSelectedBgmTrack(settings: BgmSettings): BgmTrack {
  const all = getAllBgmTracks(settings);
  return all.find((t) => t.id === settings.selectedTrackId) ?? BUILTIN_BGM_TRACKS[0];
}

export function isEmbeddableYoutubePlaylistId(listId?: string): boolean {
  if (!listId) return false;
  // Exclude YouTube auto-mixes (RD*), Watch Later (WL), Liked (LL), and private system lists
  if (/^(RD|WL|LL|LM|FL)/i.test(listId)) return false;
  return /^(PL|OLAK5uy_|UU)[A-Za-z0-9_-]{8,64}$/.test(listId);
}

export function buildYoutubeEmbedUrl(
  videoId?: string,
  playlistId?: string,
  options: { autoplay?: boolean; loop?: boolean; origin?: string } = {},
): string {
  const autoplay = options.autoplay === true ? '1' : '0';
  const validPlaylist = isEmbeddableYoutubePlaylistId(playlistId) ? playlistId : undefined;
  const origin =
    options.origin ||
    (typeof window !== 'undefined' && window.location?.origin?.startsWith('http')
      ? window.location.origin
      : '');

  if (videoId) {
    const params = new URLSearchParams({
      rel: '0',
      playsinline: '1',
      enablejsapi: '1',
    });
    if (autoplay === '1') {
      params.set('autoplay', '1');
    }
    if (validPlaylist) {
      params.set('listType', 'playlist');
      params.set('list', validPlaylist);
      if (options.loop !== false) {
        params.set('loop', '1');
      }
    }
    if (origin) {
      params.set('origin', origin);
    }
    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  }

  if (validPlaylist) {
    const params = new URLSearchParams({
      listType: 'playlist',
      list: validPlaylist,
      rel: '0',
      playsinline: '1',
      enablejsapi: '1',
    });
    if (autoplay === '1') {
      params.set('autoplay', '1');
    }
    if (options.loop !== false) {
      params.set('loop', '1');
    }
    if (origin) {
      params.set('origin', origin);
    }
    return `https://www.youtube.com/embed?${params.toString()}`;
  }

  return '';
}

export function buildSpotifyEmbedUrl(kind: SpotifyMediaKind, id: string): string {
  return `https://open.spotify.com/embed/${kind}/${id}?utm_source=generator&theme=0`;
}

export function getYoutubePlayerErrorCodeHint(code: number): 'embed_blocked' | 'not_found' | 'invalid_param' | 'playback_error' {
  if (code === 101 || code === 150 || code === 153) return 'embed_blocked';
  if (code === 100) return 'not_found';
  if (code === 2) return 'invalid_param';
  return 'playback_error';
}

export type ExternalMediaParseResult =
  | { ok: true; track: BgmTrack }
  | { ok: false; errorCode: 'empty' | 'invalid_url' | 'unsupported_provider' };

const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;
const SPOTIFY_ID_RE = /^[A-Za-z0-9]{10,40}$/;
const SPOTIFY_KINDS: ReadonlySet<string> = new Set<SpotifyMediaKind>([
  'track',
  'album',
  'playlist',
  'episode',
  'show',
]);

function makeTrackId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function extractUrlFromInput(rawInput: string): string {
  const trimmed = rawInput.trim();
  // Support pasting full <iframe ... src="..."> embed HTML from YouTube / Spotify
  if (trimmed.includes('<iframe')) {
    const srcMatch = /src\s*=\s*["']([^"']+)["']/i.exec(trimmed);
    if (srcMatch?.[1]) {
      return srcMatch[1].trim();
    }
  }
  return trimmed;
}

export function parseExternalBgmUrl(
  rawInput: string,
  customTitle?: string,
): ExternalMediaParseResult {
  const trimmed = extractUrlFromInput(rawInput);
  if (!trimmed) {
    return { ok: false, errorCode: 'empty' };
  }

  // Handle spotify:track:XXXX URI syntax
  const spotifyUriMatch = /^spotify:(track|album|playlist|episode|show):([A-Za-z0-9]{10,40})$/i.exec(
    trimmed,
  );
  if (spotifyUriMatch) {
    const kind = spotifyUriMatch[1].toLowerCase() as SpotifyMediaKind;
    const id = spotifyUriMatch[2];
    const cleanTitle = customTitle?.trim() || `Spotify ${kind.toUpperCase()} (${id.slice(0, 8)})`;
    return {
      ok: true,
      track: {
        id: makeTrackId('spotify'),
        title: cleanTitle,
        subtitle: `Spotify Embed · ${kind}`,
        source: 'spotify',
        originalUrl: `https://open.spotify.com/${kind}/${id}`,
        embedUrl: buildSpotifyEmbedUrl(kind, id),
        spotifyKind: kind,
        spotifyId: id,
        addedAt: new Date().toISOString(),
      },
    };
  }

  const normalizedUrl = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(normalizedUrl);
  } catch {
    return { ok: false, errorCode: 'invalid_url' };
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');

  // YouTube (youtube.com, m.youtube.com, music.youtube.com, youtu.be, youtube-nocookie.com)
  if (
    host === 'youtu.be' ||
    host === 'youtube.com' ||
    host === 'm.youtube.com' ||
    host === 'music.youtube.com' ||
    host === 'youtube-nocookie.com'
  ) {
    const segments = parsed.pathname.split('/').filter(Boolean);
    let videoId: string | undefined;
    const rawList = parsed.searchParams.get('list') ?? undefined;
    // Only keep playlists that YouTube actually permits inside embeds (ignore RD* mixes, WL, LL)
    const playlistId = isEmbeddableYoutubePlaylistId(rawList) ? rawList : undefined;

    if (host === 'youtu.be') {
      if (segments[0] && YOUTUBE_ID_RE.test(segments[0])) {
        videoId = segments[0];
      }
    } else {
      const vParam = parsed.searchParams.get('v');
      if (vParam && YOUTUBE_ID_RE.test(vParam)) {
        videoId = vParam;
      } else if (
        segments.length >= 2 &&
        ['embed', 'shorts', 'live', 'v'].includes(segments[0]) &&
        YOUTUBE_ID_RE.test(segments[1])
      ) {
        videoId = segments[1];
      }
    }

    if (!videoId && !playlistId) {
      return { ok: false, errorCode: 'invalid_url' };
    }

    const cleanTitle =
      customTitle?.trim() ||
      (videoId
        ? `YouTube BGM (${videoId})`
        : `YouTube Playlist (${playlistId?.slice(0, 10) ?? ''})`);

    const cleanWatchUrl = videoId
      ? `https://www.youtube.com/watch?v=${videoId}`
      : `https://www.youtube.com/playlist?list=${playlistId}`;

    return {
      ok: true,
      track: {
        id: makeTrackId('yt'),
        title: cleanTitle,
        subtitle: playlistId && !videoId ? 'YouTube Playlist Embed' : 'YouTube Auto-Loop Embed',
        source: 'youtube',
        originalUrl: cleanWatchUrl,
        embedUrl: buildYoutubeEmbedUrl(videoId, playlistId, { autoplay: false, loop: true }),
        youtubeVideoId: videoId,
        youtubePlaylistId: playlistId,
        addedAt: new Date().toISOString(),
      },
    };
  }

  // Spotify (open.spotify.com/[intl-xx/][embed/]{track|album|playlist|episode|show}/{id})
  if (host === 'open.spotify.com' || host === 'play.spotify.com') {
    const segments = parsed.pathname.split('/').filter(Boolean);
    let idx = 0;
    if (segments[idx] && /^intl-[a-z]{2}(-[a-z]{2})?$/i.test(segments[idx])) {
      idx += 1;
    }
    if (segments[idx]?.toLowerCase() === 'embed') {
      idx += 1;
    }
    const kindCandidate = segments[idx]?.toLowerCase() ?? '';
    const idCandidate = segments[idx + 1] ?? '';

    if (!SPOTIFY_KINDS.has(kindCandidate) || !SPOTIFY_ID_RE.test(idCandidate)) {
      return { ok: false, errorCode: 'invalid_url' };
    }

    const kind = kindCandidate as SpotifyMediaKind;
    const cleanTitle =
      customTitle?.trim() || `Spotify ${kind.toUpperCase()} (${idCandidate.slice(0, 8)})`;

    return {
      ok: true,
      track: {
        id: makeTrackId('spotify'),
        title: cleanTitle,
        subtitle: `Spotify Embed · ${kind}`,
        source: 'spotify',
        originalUrl: `https://open.spotify.com/${kind}/${idCandidate}`,
        embedUrl: buildSpotifyEmbedUrl(kind, idCandidate),
        spotifyKind: kind,
        spotifyId: idCandidate,
        addedAt: new Date().toISOString(),
      },
    };
  }

  return { ok: false, errorCode: 'unsupported_provider' };
}

export type MediaFileValidationResult =
  | { ok: true; source: 'mp3' | 'mp4'; cleanTitle: string }
  | { ok: false; errorCode: 'unsupported_format' };

export function validateBgmMediaFile(file: {
  name: string;
  type?: string;
}): MediaFileValidationResult {
  const lowerName = file.name.trim().toLowerCase();
  const mime = (file.type ?? '').trim().toLowerCase();

  const isMp3 =
    lowerName.endsWith('.mp3') || mime === 'audio/mpeg' || mime === 'audio/mp3';
  const isMp4 =
    lowerName.endsWith('.mp4') ||
    mime === 'video/mp4' ||
    mime === 'audio/mp4' ||
    mime === 'application/mp4';

  if (!isMp3 && !isMp4) {
    return { ok: false, errorCode: 'unsupported_format' };
  }

  const baseName = file.name.trim().replace(/\.(mp3|mp4)$/i, '').trim();
  return {
    ok: true,
    source: isMp4 ? 'mp4' : 'mp3',
    cleanTitle: baseName || (isMp4 ? 'Custom MP4 BGM' : 'Custom MP3 BGM'),
  };
}

export function createLocalMediaBgmTrack(file: {
  name: string;
  type?: string;
  size?: number;
}): BgmTrack | null {
  const check = validateBgmMediaFile(file);
  if (!check.ok) return null;
  const sizeKb =
    typeof file.size === 'number' && Number.isFinite(file.size) && file.size > 0
      ? file.size >= 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`
      : null;

  return {
    id: makeTrackId(check.source),
    title: check.cleanTitle,
    subtitle: `${check.source.toUpperCase()}${sizeKb ? ` · ${sizeKb}` : ''}`,
    source: check.source,
    fileName: file.name,
    mimeType: file.type || (check.source === 'mp4' ? 'video/mp4' : 'audio/mpeg'),
    fileSize: file.size,
    addedAt: new Date().toISOString(),
  };
}

function isSafeEmbedUrl(source: BgmSourceType, embedUrl?: string): boolean {
  if (!embedUrl) return false;
  if (source === 'youtube') {
    return (
      embedUrl.startsWith('https://www.youtube.com/embed') ||
      embedUrl.startsWith('https://www.youtube-nocookie.com/embed')
    );
  }
  if (source === 'spotify') {
    return embedUrl.startsWith('https://open.spotify.com/embed/');
  }
  return false;
}

function extractYoutubeVideoIdFromAnyUrl(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    const vParam = parsed.searchParams.get('v');
    if (vParam && YOUTUBE_ID_RE.test(vParam)) return vParam;
    const segments = parsed.pathname.split('/').filter(Boolean);
    if (segments.length >= 2 && ['embed', 'shorts', 'live', 'v'].includes(segments[0]) && YOUTUBE_ID_RE.test(segments[1])) {
      return segments[1];
    }
    if (parsed.hostname.toLowerCase() === 'youtu.be' && segments[0] && YOUTUBE_ID_RE.test(segments[0])) {
      return segments[0];
    }
  } catch {
    // Ignore invalid URL
  }
  return undefined;
}

export function sanitizeCustomTrack(raw: unknown): BgmTrack | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const id = typeof r.id === 'string' && r.id.trim() ? r.id.trim() : null;
  const title = typeof r.title === 'string' && r.title.trim() ? r.title.trim() : null;
  const source = r.source;
  if (
    !id ||
    !title ||
    (source !== 'mp3' && source !== 'mp4' && source !== 'youtube' && source !== 'spotify')
  ) {
    return null;
  }

  if (source === 'youtube') {
    const rawEmbedUrl = typeof r.embedUrl === 'string' ? r.embedUrl : undefined;
    const rawOriginalUrl = typeof r.originalUrl === 'string' ? r.originalUrl : undefined;
    const rawVideoId =
      typeof r.youtubeVideoId === 'string' && YOUTUBE_ID_RE.test(r.youtubeVideoId)
        ? r.youtubeVideoId
        : extractYoutubeVideoIdFromAnyUrl(rawEmbedUrl) ?? extractYoutubeVideoIdFromAnyUrl(rawOriginalUrl);
    const rawPlaylistId = typeof r.youtubePlaylistId === 'string' ? r.youtubePlaylistId : undefined;
    const cleanPlaylistId = isEmbeddableYoutubePlaylistId(rawPlaylistId) ? rawPlaylistId : undefined;

    // Self-heal legacy persisted YouTube tracks (strips RD* mixes, autoplay=1, and youtube-nocookie)
    const rebuiltEmbedUrl = buildYoutubeEmbedUrl(rawVideoId, cleanPlaylistId, {
      autoplay: false,
      loop: true,
    });
    const finalEmbedUrl =
      rebuiltEmbedUrl || (isSafeEmbedUrl('youtube', rawEmbedUrl) ? rawEmbedUrl : undefined);
    if (!finalEmbedUrl) return null;

    const cleanOriginalUrl =
      rawOriginalUrl ||
      (rawVideoId
        ? `https://www.youtube.com/watch?v=${rawVideoId}`
        : cleanPlaylistId
          ? `https://www.youtube.com/playlist?list=${cleanPlaylistId}`
          : undefined);

    return {
      id,
      title,
      subtitle: typeof r.subtitle === 'string' ? r.subtitle : undefined,
      source: 'youtube',
      originalUrl: cleanOriginalUrl,
      embedUrl: finalEmbedUrl,
      youtubeVideoId: rawVideoId,
      youtubePlaylistId: cleanPlaylistId,
      addedAt: typeof r.addedAt === 'string' ? r.addedAt : undefined,
    };
  }

  if (source === 'spotify') {
    const embedUrl = typeof r.embedUrl === 'string' ? r.embedUrl : undefined;
    if (!isSafeEmbedUrl('spotify', embedUrl)) return null;
    return {
      id,
      title,
      subtitle: typeof r.subtitle === 'string' ? r.subtitle : undefined,
      source: 'spotify',
      originalUrl: typeof r.originalUrl === 'string' ? r.originalUrl : undefined,
      embedUrl,
      spotifyKind:
        typeof r.spotifyKind === 'string' && SPOTIFY_KINDS.has(r.spotifyKind)
          ? (r.spotifyKind as SpotifyMediaKind)
          : undefined,
      spotifyId: typeof r.spotifyId === 'string' ? r.spotifyId : undefined,
      addedAt: typeof r.addedAt === 'string' ? r.addedAt : undefined,
    };
  }

  return {
    id,
    title,
    subtitle: typeof r.subtitle === 'string' ? r.subtitle : undefined,
    source,
    fileName: typeof r.fileName === 'string' ? r.fileName : undefined,
    mimeType: typeof r.mimeType === 'string' ? r.mimeType : undefined,
    fileSize: typeof r.fileSize === 'number' && Number.isFinite(r.fileSize) ? r.fileSize : undefined,
    addedAt: typeof r.addedAt === 'string' ? r.addedAt : undefined,
  };
}

export function loadBgmSettings(): BgmSettings {
  if (typeof window === 'undefined') return DEFAULT_BGM_SETTINGS;
  try {
    const raw = window.localStorage.getItem(BGM_SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_BGM_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<BgmSettings>;
    const customTracks = Array.isArray(parsed.customTracks)
      ? parsed.customTracks
          .map(sanitizeCustomTrack)
          .filter((t): t is BgmTrack => t !== null)
      : [];
    const allIds = new Set([...BUILTIN_BGM_TRACKS.map((t) => t.id), ...customTracks.map((t) => t.id)]);
    const selectedTrackId =
      typeof parsed.selectedTrackId === 'string' && allIds.has(parsed.selectedTrackId)
        ? parsed.selectedTrackId
        : BUILTIN_BGM_TRACKS[0].id;

    return {
      enabled: Boolean(parsed.enabled),
      selectedTrackId,
      volume: clampBgmVolume(typeof parsed.volume === 'number' ? parsed.volume : DEFAULT_BGM_SETTINGS.volume),
      muted: Boolean(parsed.muted),
      loop: parsed.loop === undefined ? true : Boolean(parsed.loop),
      customTracks,
    };
  } catch {
    return DEFAULT_BGM_SETTINGS;
  }
}

export function saveBgmSettings(settings: BgmSettings): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(BGM_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage quota errors
  }
}

// IndexedDB persistence + in-memory session fallback for local .mp3 / .mp4 files
const BGM_DB_NAME = 'nein_bgm_media_db';
const BGM_DB_STORE = 'files';
const memoryBlobCache = new Map<string, Blob>();

function openBgmMediaDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(BGM_DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(BGM_DB_STORE)) {
          db.createObjectStore(BGM_DB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function saveBgmMediaBlob(trackId: string, blob: Blob): Promise<boolean> {
  memoryBlobCache.set(trackId, blob);
  const db = await openBgmMediaDb();
  if (!db) return true;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(BGM_DB_STORE, 'readwrite');
      tx.objectStore(BGM_DB_STORE).put(blob, trackId);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(true);
    } catch {
      resolve(true);
    }
  });
}

export async function loadBgmMediaBlob(trackId: string): Promise<Blob | null> {
  const cached = memoryBlobCache.get(trackId);
  if (cached) return cached;
  const db = await openBgmMediaDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(BGM_DB_STORE, 'readonly');
      const req = tx.objectStore(BGM_DB_STORE).get(trackId);
      req.onsuccess = () => {
        const result = req.result instanceof Blob ? req.result : null;
        if (result) {
          memoryBlobCache.set(trackId, result);
        }
        resolve(result);
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function deleteBgmMediaBlob(trackId: string): Promise<void> {
  memoryBlobCache.delete(trackId);
  const db = await openBgmMediaDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(BGM_DB_STORE, 'readwrite');
      tx.objectStore(BGM_DB_STORE).delete(trackId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}
