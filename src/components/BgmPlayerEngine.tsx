import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Music2,
  Pause,
  Play,
  Power,
  Radio,
  Repeat,
  Volume2,
  VolumeX,
  Youtube,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  type BgmSettings,
  type BuiltinBgmPresetId,
  buildYoutubeEmbedUrl,
  getYoutubePlayerErrorCodeHint,
  loadBgmMediaBlob,
  resolveSelectedBgmTrack,
} from '../utils/bgmManager';
import type { AppLanguage } from '../utils/i18n';

interface BgmPlayerEngineProps {
  lang: AppLanguage;
  settings: BgmSettings;
  isEmergencyDucking: boolean;
  onToggleEnabled: () => void;
  onToggleMute: () => void;
  onChangeVolume: (vol: number) => void;
}

interface YTPlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unMute: () => void;
  getPlayerState: () => number;
  getIframe: () => HTMLIFrameElement;
  destroy: () => void;
}

interface YTGlobal {
  Player: new (
    element: HTMLElement,
    options: {
      width?: string | number;
      height?: string | number;
      host?: string;
      videoId?: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (event: { target: YTPlayerInstance }) => void;
        onStateChange?: (event: { target: YTPlayerInstance; data: number }) => void;
        onError?: (event: { target: YTPlayerInstance; data: number }) => void;
      };
    },
  ) => YTPlayerInstance;
  PlayerState?: {
    UNSTARTED: number;
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
    CUED: number;
  };
}

let ytApiPromise: Promise<YTGlobal | null> | null = null;

function loadYoutubeIframeApi(): Promise<YTGlobal | null> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve(null);
  }
  const win = window as unknown as {
    YT?: YTGlobal;
    onYouTubeIframeAPIReady?: () => void;
  };
  if (win.YT?.Player) {
    return Promise.resolve(win.YT);
  }
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise<YTGlobal | null>((resolve) => {
    let settled = false;
    const finish = (yt: YTGlobal | null) => {
      if (settled) return;
      settled = true;
      resolve(yt);
    };

    const timeoutId = window.setTimeout(() => {
      finish(win.YT?.Player ? win.YT : null);
    }, 3_000);

    const prevReady = win.onYouTubeIframeAPIReady;
    win.onYouTubeIframeAPIReady = () => {
      try {
        prevReady?.();
      } catch {
        // Ignore chained callback error
      }
      window.clearTimeout(timeoutId);
      finish(win.YT?.Player ? win.YT : null);
    };

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]',
    );
    if (!existing) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.onerror = () => {
        window.clearTimeout(timeoutId);
        finish(null);
      };
      document.head.appendChild(script);
    }
  });

  return ytApiPromise;
}

const DOCK_COPY: Record<
  AppLanguage,
  {
    playing: string;
    paused: string;
    ready: string;
    buffering: string;
    looping: string;
    tapToResume: string;
    playBtn: string;
    pauseBtn: string;
    minimize: string;
    expand: string;
    turnOff: string;
    mute: string;
    unmute: string;
    fileMissing: string;
    filePlaybackError: string;
    spotifyHint: string;
    ytTapHint: string;
    ytErrEmbedBlocked: string;
    ytErrNotFound: string;
    ytErrGeneric: string;
    openYoutube: string;
  }
> = {
  ja: {
    playing: 'BGM再生中',
    paused: '一時停止中',
    ready: '再生準備完了',
    buffering: '読み込み中...',
    looping: 'ループ',
    tapToResume: 'クリックして再生開始',
    playBtn: '再生',
    pauseBtn: '一時停止',
    minimize: '折りたたむ',
    expand: 'プレーヤーを開く',
    turnOff: 'BGM OFF',
    mute: 'ミュート',
    unmute: 'ミュート解除',
    fileMissing: '音声ファイルが見つかりません（再追加してください）',
    filePlaybackError: 'このメディアファイルはブラウザで再生できませんでした',
    spotifyHint: 'Spotify埋め込みプレーヤーで再生できます',
    ytTapHint: 'プレーヤーの再生ボタンをクリックして開始（終了時は自動でループ再生します）',
    ytErrEmbedBlocked:
      'この動画は投稿者またはYouTube側の設定により外部埋め込み再生が制限されています。別の動画URLをお試しください。',
    ytErrNotFound: '動画が見つからないか、非公開・終了済みライブのため再生できません。',
    ytErrGeneric: 'YouTube動画の読み込みに失敗しました。URLまたは再生可否をご確認ください。',
    openYoutube: 'YouTubeで開く',
  },
  en: {
    playing: 'BGM Playing',
    paused: 'Paused',
    ready: 'Ready to play',
    buffering: 'Buffering...',
    looping: 'Loop',
    tapToResume: 'Click to start audio',
    playBtn: 'Play',
    pauseBtn: 'Pause',
    minimize: 'Collapse',
    expand: 'Expand player',
    turnOff: 'Turn BGM Off',
    mute: 'Mute',
    unmute: 'Unmute',
    fileMissing: 'Audio file unavailable (please re-upload)',
    filePlaybackError: 'This media file could not be decoded by the browser.',
    spotifyHint: 'Control playback directly in the Spotify embed',
    ytTapHint: 'Click Play on the player to start (loops automatically when finished)',
    ytErrEmbedBlocked:
      'Embedding is restricted by the video owner or YouTube. Please try another embeddable video URL.',
    ytErrNotFound: 'Video not found, private, or an ended live stream that cannot be embedded.',
    ytErrGeneric: 'Failed to load YouTube playback. Please check the URL.',
    openYoutube: 'Open on YouTube',
  },
  zh: {
    playing: 'BGM播放中',
    paused: '已暂停',
    ready: '准备就绪',
    buffering: '缓冲中...',
    looping: '循环',
    tapToResume: '点击开始播放',
    playBtn: '播放',
    pauseBtn: '暂停',
    minimize: '收起',
    expand: '展开播放器',
    turnOff: '关闭BGM',
    mute: '静音',
    unmute: '取消静音',
    fileMissing: '未找到本地音频文件（请重新添加）',
    filePlaybackError: '浏览器无法播放此媒体文件',
    spotifyHint: '可在 Spotify 嵌入式播放器中直接播放',
    ytTapHint: '若自动播放被浏览器阻止，请点击播放按钮',
    ytErrEmbedBlocked: '该视频因发布者或 YouTube 限制无法外部嵌入播放，请更换其他视频链接。',
    ytErrNotFound: '找不到该视频，或为私密/已结束的直播无法嵌入。',
    ytErrGeneric: 'YouTube 播放加载失败，请检查链接。',
    openYoutube: '在 YouTube 打开',
  },
  ko: {
    playing: 'BGM 재생 중',
    paused: '일시정지',
    ready: '재생 준비됨',
    buffering: '버퍼링 중...',
    looping: '반복',
    tapToResume: '클릭하여 재생 시작',
    playBtn: '재생',
    pauseBtn: '일시정지',
    minimize: '접기',
    expand: '플레이어 펼치기',
    turnOff: 'BGM 끄기',
    mute: '음소거',
    unmute: '음소거 해제',
    fileMissing: '오디오 파일을 찾을 수 없습니다 (다시 추가해 주세요)',
    filePlaybackError: '브라우저에서 이 미디어 파일을 재생할 수 없습니다.',
    spotifyHint: 'Spotify 임베드 플레이어에서 바로 재생할 수 있습니다',
    ytTapHint: '자동 재생이 차단된 경우 재생 버튼을 클릭해 주세요',
    ytErrEmbedBlocked:
      '게시자 또는 YouTube 설정으로 외부 임베드 재생이 제한된 영상입니다. 다른 영상 URL을 사용해 주세요.',
    ytErrNotFound: '영상을 찾을 수 없거나 비공개/종료된 라이브입니다.',
    ytErrGeneric: 'YouTube 재생을 불러오지 못했습니다. URL을 확인해 주세요.',
    openYoutube: 'YouTube에서 열기',
  },
};

interface AmbientSynthNodes {
  ctx: AudioContext;
  masterGain: GainNode;
  stop: () => void;
}

function createAmbientSynth(preset: BuiltinBgmPresetId, initialGain: number): AmbientSynthNodes | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;

  try {
    const ctx = new AudioCtx();
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(
      Math.max(0.0001, initialGain * 0.24),
      ctx.currentTime + 0.9,
    );
    masterGain.connect(ctx.destination);

    const stoppers: Array<() => void> = [];

    const addPadVoice = (
      freq: number,
      type: OscillatorType,
      gainLevel: number,
      detuneCents: number,
      lfoRate: number,
      lfoDepth: number,
    ) => {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const voiceGain = ctx.createGain();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.detune.setValueAtTime(detuneCents, ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(preset === 'night_observatory' ? 520 : 920, ctx.currentTime);
      filter.Q.setValueAtTime(0.9, ctx.currentTime);

      voiceGain.gain.setValueAtTime(gainLevel, ctx.currentTime);

      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(lfoRate, ctx.currentTime);
      lfoGain.gain.setValueAtTime(lfoDepth, ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      osc.connect(filter);
      filter.connect(voiceGain);
      voiceGain.connect(masterGain);

      osc.start();
      lfo.start();
      stoppers.push(() => {
        try {
          osc.stop();
          lfo.stop();
          osc.disconnect();
          lfo.disconnect();
          filter.disconnect();
          voiceGain.disconnect();
        } catch {
          // Ignore teardown errors
        }
      });
    };

    if (preset === 'calm_horizon') {
      addPadVoice(130.81, 'sine', 0.34, -3, 0.08, 180);
      addPadVoice(196.0, 'triangle', 0.16, 4, 0.11, 220);
      addPadVoice(246.94, 'sine', 0.14, -5, 0.07, 160);
      addPadVoice(293.66, 'sine', 0.1, 6, 0.05, 140);
    } else if (preset === 'night_observatory') {
      addPadVoice(73.42, 'sine', 0.36, 0, 0.05, 120);
      addPadVoice(146.83, 'triangle', 0.15, -6, 0.09, 190);
      addPadVoice(220.0, 'sine', 0.12, 5, 0.06, 140);
      addPadVoice(329.63, 'sine', 0.07, 8, 0.04, 100);
    } else if (preset === 'aurora_pad') {
      addPadVoice(174.61, 'sine', 0.28, -4, 0.09, 260);
      addPadVoice(261.63, 'triangle', 0.14, 5, 0.13, 300);
      addPadVoice(329.63, 'sine', 0.12, -3, 0.07, 220);
      addPadVoice(392.0, 'sine', 0.08, 7, 0.11, 180);
    } else {
      const bufferSize = ctx.sampleRate * 4;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.997 * b0 + white * 0.029;
        b1 = 0.985 * b1 + white * 0.032;
        b2 = 0.95 * b2 + white * 0.048;
        output[i] = (b0 + b1 + b2 + white * 0.015) * 0.32;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(980, ctx.currentTime);
      bandpass.Q.setValueAtTime(0.65, ctx.currentTime);

      const rainGain = ctx.createGain();
      rainGain.gain.setValueAtTime(0.45, ctx.currentTime);

      noise.connect(bandpass);
      bandpass.connect(rainGain);
      rainGain.connect(masterGain);
      noise.start();

      stoppers.push(() => {
        try {
          noise.stop();
          noise.disconnect();
          bandpass.disconnect();
          rainGain.disconnect();
        } catch {
          // Ignore teardown errors
        }
      });

      addPadVoice(110.0, 'sine', 0.18, 0, 0.06, 90);
      addPadVoice(164.81, 'sine', 0.1, 4, 0.08, 120);
    }

    return {
      ctx,
      masterGain,
      stop: () => {
        try {
          const now = ctx.currentTime;
          masterGain.gain.cancelScheduledValues(now);
          masterGain.gain.setValueAtTime(masterGain.gain.value, now);
          masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.15);
        } catch {
          // Ignore
        }
        window.setTimeout(() => {
          stoppers.forEach((fn) => fn());
          void ctx.close().catch(() => {});
        }, 180);
      },
    };
  } catch {
    return null;
  }
}

export function BgmPlayerEngine({
  lang,
  settings,
  isEmergencyDucking,
  onToggleEnabled,
  onToggleMute,
  onChangeVolume,
}: BgmPlayerEngineProps) {
  const copy = DOCK_COPY[lang] ?? DOCK_COPY.ja;
  const activeTrack = resolveSelectedBgmTrack(settings);
  const effectiveVolume = settings.muted || isEmergencyDucking ? 0 : settings.volume;
  const effectiveGain = effectiveVolume / 100;

  const [collapsed, setCollapsed] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [localMediaUrl, setLocalMediaUrl] = useState<string | null>(null);
  const [localFileMissing, setLocalFileMissing] = useState(false);
  const [localMediaError, setLocalMediaError] = useState(false);

  // YouTube IFrame Player API state
  const [ytStatus, setYtStatus] = useState<'loading' | 'ready' | 'buffering' | 'playing' | 'paused' | 'error'>('loading');
  const [ytPlayerReady, setYtPlayerReady] = useState(false);
  const [ytErrorCode, setYtErrorCode] = useState<number | null>(null);

  const synthRef = useRef<AmbientSynthNodes | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const ytContainerRef = useRef<HTMLDivElement | null>(null);
  const ytPlayerRef = useRef<YTPlayerInstance | null>(null);
  const ytReadyRef = useRef(false);
  const loopRef = useRef(settings.loop);
  const volumeRef = useRef(effectiveVolume);

  loopRef.current = settings.loop;
  volumeRef.current = effectiveVolume;

  // 1. Built-in Web Audio Ambient Synth Engine
  useEffect(() => {
    if (!settings.enabled || activeTrack.source !== 'builtin') {
      if (synthRef.current) {
        synthRef.current.stop();
        synthRef.current = null;
      }
      setAutoplayBlocked(false);
      return;
    }

    const synth = createAmbientSynth(activeTrack.presetId ?? 'calm_horizon', volumeRef.current / 100);
    synthRef.current = synth;

    if (synth && synth.ctx.state === 'suspended') {
      void synth.ctx
        .resume()
        .then(() => {
          setAutoplayBlocked(synth.ctx.state === 'suspended');
        })
        .catch(() => {
          setAutoplayBlocked(true);
        });
    } else {
      setAutoplayBlocked(false);
    }

    return () => {
      if (synthRef.current === synth) {
        synth?.stop();
        synthRef.current = null;
      }
    };
  }, [settings.enabled, activeTrack.id, activeTrack.source, activeTrack.presetId]);

  // Live gain update for Web Audio synth
  useEffect(() => {
    const synth = synthRef.current;
    if (!synth) return;
    try {
      const now = synth.ctx.currentTime;
      synth.masterGain.gain.cancelScheduledValues(now);
      synth.masterGain.gain.setTargetAtTime(Math.max(0.0001, effectiveGain * 0.24), now, 0.08);
    } catch {
      // Ignore
    }
  }, [effectiveGain]);

  // 2. Local .mp3 / .mp4 Blob Loading from IndexedDB
  useEffect(() => {
    if (activeTrack.source !== 'mp3' && activeTrack.source !== 'mp4') {
      setLocalMediaUrl(null);
      setLocalFileMissing(false);
      setLocalMediaError(false);
      return;
    }

    let cancelled = false;
    let createdUrl: string | null = null;
    setLocalFileMissing(false);
    setLocalMediaError(false);

    void loadBgmMediaBlob(activeTrack.id).then((blob) => {
      if (cancelled) return;
      if (!blob) {
        setLocalMediaUrl(null);
        setLocalFileMissing(true);
        return;
      }
      createdUrl = URL.createObjectURL(blob);
      setLocalMediaUrl(createdUrl);
    });

    return () => {
      cancelled = true;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [activeTrack.id, activeTrack.source]);

  // Local media playback trigger (separate from volume slider so dragging volume never restarts audio)
  useEffect(() => {
    const isMp3 = activeTrack.source === 'mp3';
    const isMp4 = activeTrack.source === 'mp4';
    const el = isMp3 ? audioRef.current : isMp4 ? videoRef.current : null;

    if (audioRef.current && (!isMp3 || !settings.enabled)) {
      audioRef.current.pause();
    }
    if (videoRef.current && (!isMp4 || !settings.enabled)) {
      videoRef.current.pause();
    }

    if (!el || !settings.enabled || !localMediaUrl) {
      return;
    }

    el.loop = loopRef.current;
    el.volume = Math.max(0, Math.min(1, volumeRef.current / 100));
    el.muted = volumeRef.current === 0;

    const playPromise = el.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise
        .then(() => setAutoplayBlocked(false))
        .catch(() => setAutoplayBlocked(true));
    }
  }, [activeTrack.source, localMediaUrl, settings.enabled]);

  // Live volume, mute & loop sync for local .mp3 / .mp4
  useEffect(() => {
    const el =
      activeTrack.source === 'mp3'
        ? audioRef.current
        : activeTrack.source === 'mp4'
          ? videoRef.current
          : null;
    if (!el) return;
    el.loop = settings.loop;
    el.volume = Math.max(0, Math.min(1, effectiveGain));
    el.muted = settings.muted || isEmergencyDucking;
  }, [activeTrack.source, effectiveGain, isEmergencyDucking, settings.loop, settings.muted]);

  // Resume suspended Web Audio or HTML media automatically on next user gesture if blocked
  useEffect(() => {
    if (!autoplayBlocked || !settings.enabled) return;
    const handleUnlock = () => {
      if (synthRef.current && synthRef.current.ctx.state === 'suspended') {
        void synthRef.current.ctx
          .resume()
          .then(() => setAutoplayBlocked(false))
          .catch(() => {});
      }
      const mediaEl =
        activeTrack.source === 'mp3'
          ? audioRef.current
          : activeTrack.source === 'mp4'
            ? videoRef.current
            : null;
      if (mediaEl) {
        void mediaEl
          .play()
          .then(() => setAutoplayBlocked(false))
          .catch(() => {});
      }
    };
    window.addEventListener('pointerdown', handleUnlock, { once: true });
    window.addEventListener('keydown', handleUnlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', handleUnlock);
      window.removeEventListener('keydown', handleUnlock);
    };
  }, [autoplayBlocked, settings.enabled, activeTrack.source]);

  // 3. Official YouTube IFrame Player API bound to a pre-configured <iframe>
  // Creating the <iframe> with referrerPolicy="strict-origin-when-cross-origin" + origin
  // AFTER YT API resolves ensures YT.Player attaches before the iframe handshake completes,
  // avoiding YouTube Error 153 and missed onReady/onStateChange callbacks.
  // Keep loop decoupled from URL so toggling Loop never reloads the playing video.
  const youtubeEmbedSrc =
    settings.enabled && activeTrack.source === 'youtube'
      ? buildYoutubeEmbedUrl(activeTrack.youtubeVideoId, activeTrack.youtubePlaylistId, {
          autoplay: false,
          loop: true,
        }) || activeTrack.embedUrl || ''
      : '';

  useEffect(() => {
    const isYoutubeActive = settings.enabled && activeTrack.source === 'youtube' && Boolean(youtubeEmbedSrc);
    if (!isYoutubeActive) {
      ytReadyRef.current = false;
      setYtPlayerReady(false);
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {
          // Ignore destroy errors
        }
        ytPlayerRef.current = null;
      }
      setYtStatus('loading');
      setYtErrorCode(null);
      return;
    }

    let cancelled = false;
    ytReadyRef.current = false;
    setYtPlayerReady(false);
    setYtStatus('ready');
    setYtErrorCode(null);

    const mountHost = ytContainerRef.current;
    if (!mountHost) return;
    mountHost.innerHTML = '';

    void loadYoutubeIframeApi().then((YT) => {
      if (cancelled || !mountHost) return;
      mountHost.innerHTML = '';

      const iframe = document.createElement('iframe');
      iframe.id = `nein-yt-player-${activeTrack.id.replace(/[^a-zA-Z0-9_-]/g, '')}`;
      iframe.title = activeTrack.title;
      iframe.width = '100%';
      iframe.height = '180';
      iframe.className = 'h-[180px] w-full border-0';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.setAttribute('data-testid', 'bgm-youtube-embed-iframe');
      iframe.setAttribute(
        'allow',
        'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
      );
      iframe.allowFullscreen = true;
      iframe.src = youtubeEmbedSrc;
      mountHost.appendChild(iframe);

      if (!YT?.Player) return;
      try {
        const player = new YT.Player(iframe, {
          events: {
            onReady: (ev) => {
              if (cancelled) return;
              ytReadyRef.current = true;
              setYtPlayerReady(true);
              setYtStatus('ready');
              try {
                if (volumeRef.current === 0) {
                  ev.target.mute();
                } else {
                  ev.target.unMute();
                  ev.target.setVolume(volumeRef.current);
                }
              } catch {
                // Ignore
              }
            },
            onStateChange: (ev) => {
              if (cancelled) return;
              // 0 = ENDED, 1 = PLAYING, 2 = PAUSED, 3 = BUFFERING
              if (ev.data === 0) {
                if (loopRef.current) {
                  try {
                    ev.target.seekTo(0, true);
                    ev.target.playVideo();
                  } catch {
                    setYtStatus('paused');
                  }
                } else {
                  setYtStatus('paused');
                }
              } else if (ev.data === 1) {
                setYtStatus('playing');
                setYtErrorCode(null);
              } else if (ev.data === 2) {
                setYtStatus('paused');
              } else if (ev.data === 3) {
                setYtStatus('buffering');
              }
            },
            onError: (ev) => {
              if (cancelled) return;
              setYtStatus('error');
              setYtErrorCode(typeof ev.data === 'number' ? ev.data : -1);
            },
          },
        });
        ytPlayerRef.current = player;
      } catch {
        // Iframe still renders natively even if YT.Player binding throws
      }
    });

    return () => {
      cancelled = true;
      ytReadyRef.current = false;
      setYtPlayerReady(false);
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {
          // Ignore
        }
        ytPlayerRef.current = null;
      }
      if (mountHost) {
        mountHost.innerHTML = '';
      }
    };
  }, [
    settings.enabled,
    activeTrack.id,
    activeTrack.source,
    activeTrack.title,
    youtubeEmbedSrc,
  ]);

  // Live volume & mute sync for active YT.Player
  useEffect(() => {
    const player = ytPlayerRef.current;
    if (!player || !ytReadyRef.current || !settings.enabled || activeTrack.source !== 'youtube') return;
    try {
      if (effectiveVolume === 0) {
        if (typeof player.mute === 'function') player.mute();
      } else {
        if (typeof player.unMute === 'function') player.unMute();
        if (typeof player.setVolume === 'function') player.setVolume(effectiveVolume);
      }
    } catch {
      // Player may still be initializing
    }
  }, [effectiveVolume, settings.enabled, activeTrack.source]);

  const handleToggleYoutubePlayPause = () => {
    const player = ytPlayerRef.current;
    if (!player || !ytReadyRef.current) return;
    try {
      if (ytStatus === 'playing') {
        if (typeof player.pauseVideo === 'function') player.pauseVideo();
      } else {
        if (effectiveVolume === 0) {
          if (typeof player.mute === 'function') player.mute();
        } else {
          if (typeof player.unMute === 'function') player.unMute();
          if (typeof player.setVolume === 'function') player.setVolume(effectiveVolume);
        }
        if (typeof player.playVideo === 'function') player.playVideo();
      }
    } catch {
      // Ignore
    }
  };

  const spotifySrc =
    settings.enabled && activeTrack.source === 'spotify' ? activeTrack.embedUrl || '' : '';

  const showFloatingDock =
    settings.enabled &&
    (activeTrack.source === 'youtube' ||
      activeTrack.source === 'spotify' ||
      autoplayBlocked ||
      localFileMissing ||
      localMediaError);

  const handleManualResume = () => {
    if (synthRef.current && synthRef.current.ctx.state === 'suspended') {
      void synthRef.current.ctx.resume().then(() => setAutoplayBlocked(false));
    }
    const el =
      activeTrack.source === 'mp3'
        ? audioRef.current
        : activeTrack.source === 'mp4'
          ? videoRef.current
          : null;
    if (el) {
      void el.play().then(() => setAutoplayBlocked(false)).catch(() => {});
    }
  };

  const youtubeErrorMessage =
    ytErrorCode !== null
      ? (() => {
          const hint = getYoutubePlayerErrorCodeHint(ytErrorCode);
          if (hint === 'embed_blocked') return `${copy.ytErrEmbedBlocked} (Code ${ytErrorCode})`;
          if (hint === 'not_found') return `${copy.ytErrNotFound} (Code ${ytErrorCode})`;
          return `${copy.ytErrGeneric}${ytErrorCode > 0 ? ` (Code ${ytErrorCode})` : ''}`;
        })()
      : null;

  const dockStatusLabel =
    activeTrack.source === 'youtube'
      ? ytStatus === 'playing'
        ? copy.playing
        : ytStatus === 'buffering'
          ? copy.buffering
          : ytStatus === 'paused'
            ? copy.paused
            : copy.ready
      : copy.playing;

  return (
    <>
      {/* Hidden native media elements for local .mp3 and .mp4 playback */}
      {activeTrack.source === 'mp3' && localMediaUrl && (
        <audio
          ref={audioRef}
          src={localMediaUrl}
          loop={settings.loop}
          preload="auto"
          onError={() => setLocalMediaError(true)}
          className="hidden"
          data-testid="bgm-local-audio-el"
        />
      )}

      {activeTrack.source === 'mp4' && localMediaUrl && (
        <video
          ref={videoRef}
          src={localMediaUrl}
          loop={settings.loop}
          playsInline
          preload="auto"
          onError={() => setLocalMediaError(true)}
          className="hidden"
          data-testid="bgm-local-video-el"
        />
      )}

      {/* Persistent Floating BGM Dock for YouTube / Spotify Auto-Embeds & Autoplay Resume */}
      {showFloatingDock && (
        <aside
          aria-label="BGM Player"
          data-testid="bgm-floating-dock"
          data-yt-status={activeTrack.source === 'youtube' ? ytStatus : undefined}
          className="fixed bottom-4 right-4 z-40 w-[336px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)]/95 shadow-2xl backdrop-blur-md transition-all"
        >
          {/* Compact Top Bar */}
          <div className="flex items-center justify-between gap-2 border-b border-[var(--nein-border-subtle)] px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              {activeTrack.source === 'youtube' ? (
                <Youtube className="h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
              ) : activeTrack.source === 'spotify' ? (
                <Radio className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
              ) : (
                <Music2 className="h-4 w-4 shrink-0 text-[var(--nein-accent-text)]" aria-hidden="true" />
              )}
              <div className="min-w-0">
                <div className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                  {activeTrack.title}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                  <span>{dockStatusLabel}</span>
                  {settings.loop && (
                    <span className="inline-flex items-center gap-0.5 text-[var(--nein-accent-text)]">
                      <Repeat className="h-2.5 w-2.5" aria-hidden="true" />
                      {copy.looping}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {activeTrack.source === 'youtube' && ytPlayerReady && ytStatus !== 'error' && (
                <button
                  type="button"
                  data-testid="bgm-yt-playpause-btn"
                  onClick={handleToggleYoutubePlayPause}
                  aria-label={ytStatus === 'playing' ? copy.pauseBtn : copy.playBtn}
                  className="rounded-md p-1.5 text-[var(--nein-accent-text)] transition-colors hover:bg-[var(--nein-accent-soft)] cursor-pointer"
                >
                  {ytStatus === 'playing' ? (
                    <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Play className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                </button>
              )}

              {activeTrack.source !== 'spotify' && (
                <button
                  type="button"
                  onClick={onToggleMute}
                  aria-label={settings.muted ? copy.unmute : copy.mute}
                  className="rounded-md p-1.5 text-slate-600 transition-colors hover:bg-[var(--nein-sub)] hover:text-slate-900 dark:text-slate-300 dark:hover:text-white cursor-pointer"
                >
                  {settings.muted || settings.volume === 0 ? (
                    <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                </button>
              )}

              {(activeTrack.source === 'youtube' || activeTrack.source === 'spotify') && (
                <button
                  type="button"
                  onClick={() => setCollapsed((c) => !c)}
                  aria-label={collapsed ? copy.expand : copy.minimize}
                  className="rounded-md p-1.5 text-slate-600 transition-colors hover:bg-[var(--nein-sub)] hover:text-slate-900 dark:text-slate-300 dark:hover:text-white cursor-pointer"
                >
                  {collapsed ? (
                    <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={onToggleEnabled}
                aria-label={copy.turnOff}
                className="rounded-md p-1.5 text-slate-600 transition-colors hover:bg-red-500/15 hover:text-red-500 dark:text-slate-300 cursor-pointer"
              >
                <Power className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Body (stays mounted when collapsed so iframe audio keeps playing!) */}
          <div className={collapsed ? 'h-0 overflow-hidden opacity-0 pointer-events-none' : 'p-2.5'}>
            {activeTrack.source === 'youtube' && (
              <div className="space-y-2">
                <div className="overflow-hidden rounded-lg border border-[var(--nein-border-subtle)] bg-black">
                  <div
                    ref={ytContainerRef}
                    className="h-[180px] w-full"
                    data-testid="bgm-youtube-player-host"
                  />
                </div>

                {youtubeErrorMessage ? (
                  <div
                    role="alert"
                    data-testid="bgm-yt-error-banner"
                    className="rounded-lg border border-amber-400/50 bg-amber-500/10 p-2 text-[11px] leading-relaxed text-amber-900 dark:text-amber-200"
                  >
                    <div className="flex items-start gap-1.5">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden="true" />
                      <span>{youtubeErrorMessage}</span>
                    </div>
                    {activeTrack.originalUrl && (
                      <a
                        href={activeTrack.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1.5 inline-flex items-center gap-1 font-semibold text-[var(--nein-accent-text)] hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        <span>{copy.openYoutube}</span>
                      </a>
                    )}
                  </div>
                ) : ytStatus !== 'playing' ? (
                  <p className="px-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                    {copy.ytTapHint}
                  </p>
                ) : null}

                <div className="flex items-center gap-2 px-0.5">
                  <Volume2 className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={settings.muted ? 0 : settings.volume}
                    onChange={(e) => onChangeVolume(Number(e.target.value))}
                    aria-label="BGM Volume"
                    className="flex-1 accent-[var(--nein-accent)] cursor-pointer"
                  />
                  <span className="w-8 text-right font-mono text-[10px] tabular-nums text-slate-600 dark:text-slate-400">
                    {settings.muted ? 0 : settings.volume}%
                  </span>
                </div>
              </div>
            )}

            {activeTrack.source === 'spotify' && spotifySrc && (
              <div className="space-y-1.5">
                <iframe
                  key={activeTrack.id}
                  title={activeTrack.title}
                  src={spotifySrc}
                  referrerPolicy="strict-origin-when-cross-origin"
                  data-testid="bgm-spotify-embed-iframe"
                  className="h-[80px] w-full rounded-lg border-0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                />
                <p className="px-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                  {copy.spotifyHint}
                </p>
              </div>
            )}

            {autoplayBlocked &&
              (activeTrack.source === 'builtin' ||
                activeTrack.source === 'mp3' ||
                activeTrack.source === 'mp4') && (
                <button
                  type="button"
                  onClick={handleManualResume}
                  className="w-full rounded-lg bg-[var(--nein-accent)] px-3 py-2 text-xs font-semibold text-[var(--nein-accent-contrast)] cursor-pointer"
                >
                  {copy.tapToResume}
                </button>
              )}

            {localFileMissing && (
              <p className="text-xs text-amber-700 dark:text-amber-300">{copy.fileMissing}</p>
            )}

            {localMediaError && (
              <p className="text-xs text-amber-700 dark:text-amber-300">{copy.filePlaybackError}</p>
            )}
          </div>
        </aside>
      )}
    </>
  );
}
