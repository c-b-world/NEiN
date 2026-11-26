import {
  ChevronDown,
  ChevronUp,
  Music2,
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

const DOCK_COPY: Record<
  AppLanguage,
  {
    playing: string;
    looping: string;
    tapToResume: string;
    minimize: string;
    expand: string;
    turnOff: string;
    mute: string;
    unmute: string;
    fileMissing: string;
    spotifyHint: string;
  }
> = {
  ja: {
    playing: 'BGM再生中',
    looping: 'ループ',
    tapToResume: 'クリックして再生開始',
    minimize: '折りたたむ',
    expand: 'プレーヤーを開く',
    turnOff: 'BGM OFF',
    mute: 'ミュート',
    unmute: 'ミュート解除',
    fileMissing: '音声ファイルが見つかりません（再追加してください）',
    spotifyHint: 'Spotify埋め込みプレーヤーで再生できます',
  },
  en: {
    playing: 'BGM Active',
    looping: 'Loop',
    tapToResume: 'Click to start audio',
    minimize: 'Collapse',
    expand: 'Expand player',
    turnOff: 'Turn BGM Off',
    mute: 'Mute',
    unmute: 'Unmute',
    fileMissing: 'Audio file unavailable (please re-upload)',
    spotifyHint: 'Control playback directly in the Spotify embed',
  },
  zh: {
    playing: 'BGM播放中',
    looping: '循环',
    tapToResume: '点击开始播放',
    minimize: '收起',
    expand: '展开播放器',
    turnOff: '关闭BGM',
    mute: '静音',
    unmute: '取消静音',
    fileMissing: '未找到本地音频文件（请重新添加）',
    spotifyHint: '可在 Spotify 嵌入式播放器中直接播放',
  },
  ko: {
    playing: 'BGM 재생 중',
    looping: '반복',
    tapToResume: '클릭하여 재생 시작',
    minimize: '접기',
    expand: '플레이어 펼치기',
    turnOff: 'BGM 끄기',
    mute: '음소거',
    unmute: '음소거 해제',
    fileMissing: '오디오 파일을 찾을 수 없습니다 (다시 추가해 주세요)',
    spotifyHint: 'Spotify 임베드 플레이어에서 바로 재생할 수 있습니다',
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
    masterGain.gain.linearRampToValueAtTime(Math.max(0.0001, initialGain * 0.24), ctx.currentTime + 0.9);
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
      // Warm Cmaj9 ambient pad
      addPadVoice(130.81, 'sine', 0.34, -3, 0.08, 180);
      addPadVoice(196.0, 'triangle', 0.16, 4, 0.11, 220);
      addPadVoice(246.94, 'sine', 0.14, -5, 0.07, 160);
      addPadVoice(293.66, 'sine', 0.1, 6, 0.05, 140);
    } else if (preset === 'night_observatory') {
      // Deep D minor spacey drone
      addPadVoice(73.42, 'sine', 0.36, 0, 0.05, 120);
      addPadVoice(146.83, 'triangle', 0.15, -6, 0.09, 190);
      addPadVoice(220.0, 'sine', 0.12, 5, 0.06, 140);
      addPadVoice(329.63, 'sine', 0.07, 8, 0.04, 100);
    } else if (preset === 'aurora_pad') {
      // Airy Fmaj7 shimmer
      addPadVoice(174.61, 'sine', 0.28, -4, 0.09, 260);
      addPadVoice(261.63, 'triangle', 0.14, 5, 0.13, 300);
      addPadVoice(329.63, 'sine', 0.12, -3, 0.07, 220);
      addPadVoice(392.0, 'sine', 0.08, 7, 0.11, 180);
    } else {
      // Quiet Rain & Glass: pink-ish filtered rainfall loop + warm low sine
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

  const synthRef = useRef<AmbientSynthNodes | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const ytIframeRef = useRef<HTMLIFrameElement | null>(null);

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

    const synth = createAmbientSynth(activeTrack.presetId ?? 'calm_horizon', effectiveGain);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      return;
    }

    let cancelled = false;
    let createdUrl: string | null = null;
    setLocalFileMissing(false);

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

  // Control <audio> (mp3) and <video> (mp4) playback, loop & volume
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

    el.loop = settings.loop;
    el.volume = Math.max(0, Math.min(1, effectiveGain));
    el.muted = settings.muted || isEmergencyDucking;

    const playPromise = el.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise
        .then(() => setAutoplayBlocked(false))
        .catch(() => setAutoplayBlocked(true));
    }
  }, [
    activeTrack.source,
    effectiveGain,
    isEmergencyDucking,
    localMediaUrl,
    settings.enabled,
    settings.loop,
    settings.muted,
  ]);

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

  // 3. YouTube IFrame postMessage volume & mute sync
  const sendYoutubeCommand = (func: string, args: unknown[] = []) => {
    const win = ytIframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage(
        JSON.stringify({
          event: 'command',
          func,
          args,
        }),
        '*',
      );
    } catch {
      // Ignore cross-origin postMessage failures
    }
  };

  useEffect(() => {
    if (!settings.enabled || activeTrack.source !== 'youtube') return;
    if (effectiveVolume === 0) {
      sendYoutubeCommand('mute');
    } else {
      sendYoutubeCommand('unMute');
      sendYoutubeCommand('setVolume', [effectiveVolume]);
    }
  }, [settings.enabled, activeTrack.source, effectiveVolume]);

  const youtubeSrc =
    settings.enabled && activeTrack.source === 'youtube'
      ? buildYoutubeEmbedUrl(activeTrack.youtubeVideoId, activeTrack.youtubePlaylistId, {
          autoplay: true,
          loop: settings.loop,
        }) || activeTrack.embedUrl || ''
      : '';

  const spotifySrc =
    settings.enabled && activeTrack.source === 'spotify' ? activeTrack.embedUrl || '' : '';

  const showFloatingDock =
    settings.enabled &&
    (activeTrack.source === 'youtube' ||
      activeTrack.source === 'spotify' ||
      autoplayBlocked ||
      localFileMissing);

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

  return (
    <>
      {/* Hidden native media elements for local .mp3 and .mp4 playback */}
      {activeTrack.source === 'mp3' && localMediaUrl && (
        <audio
          ref={audioRef}
          src={localMediaUrl}
          loop={settings.loop}
          preload="auto"
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
          className="hidden"
          data-testid="bgm-local-video-el"
        />
      )}

      {/* Persistent Floating BGM Dock for YouTube / Spotify Auto-Embeds & Autoplay Resume */}
      {showFloatingDock && (
        <aside
          aria-label="BGM Player"
          data-testid="bgm-floating-dock"
          className="fixed bottom-4 right-4 z-40 w-[332px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)]/95 shadow-2xl backdrop-blur-md transition-all"
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
                  <span>{copy.playing}</span>
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
            {activeTrack.source === 'youtube' && youtubeSrc && (
              <div className="space-y-2">
                <div className="overflow-hidden rounded-lg border border-[var(--nein-border-subtle)] bg-black">
                  <iframe
                    ref={ytIframeRef}
                    key={`${activeTrack.id}-${settings.loop ? 'loop' : 'once'}`}
                    title={activeTrack.title}
                    src={youtubeSrc}
                    data-testid="bgm-youtube-embed-iframe"
                    className="h-[156px] w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    onLoad={() => {
                      window.setTimeout(() => {
                        if (effectiveVolume === 0) {
                          sendYoutubeCommand('mute');
                        } else {
                          sendYoutubeCommand('unMute');
                          sendYoutubeCommand('setVolume', [effectiveVolume]);
                        }
                        if (settings.loop) {
                          sendYoutubeCommand('setLoop', [true]);
                        }
                      }, 450);
                    }}
                  />
                </div>
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
          </div>
        </aside>
      )}
    </>
  );
}
