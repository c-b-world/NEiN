import {
  Check,
  ChevronDown,
  FileAudio,
  Film,
  Link2,
  Music2,
  Plus,
  Radio,
  Repeat,
  Sparkles,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
  Youtube,
} from 'lucide-react';
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from 'react';
import {
  BUILTIN_BGM_TRACKS,
  type BgmSettings,
  type BgmSourceType,
  type BgmTrack,
  createLocalMediaBgmTrack,
  deleteBgmMediaBlob,
  parseExternalBgmUrl,
  resolveSelectedBgmTrack,
  saveBgmMediaBlob,
} from '../utils/bgmManager';
import type { AppLanguage } from '../utils/i18n';

interface BgmSettingsSectionProps {
  lang: AppLanguage;
  bgmSettings: BgmSettings;
  onChangeBgmSettings: (updater: (prev: BgmSettings) => BgmSettings) => void;
}

const BGM_COPY: Record<
  AppLanguage,
  {
    title: string;
    subtitle: string;
    statusOn: string;
    statusOff: string;
    selectTrackLabel: string;
    builtinGroup: string;
    customGroup: string;
    volumeLabel: string;
    loopLabel: string;
    loopOn: string;
    loopOff: string;
    uploadTitle: string;
    uploadDesc: string;
    uploadBtn: string;
    embedTitle: string;
    embedDesc: string;
    urlPlaceholder: string;
    titlePlaceholder: string;
    addEmbedBtn: string;
    detectedYoutube: string;
    detectedSpotify: string;
    errEmpty: string;
    errInvalidUrl: string;
    errUnsupportedProvider: string;
    errUnsupportedFile: string;
    addedSuccess: string;
    spotifyVolumeNote: string;
    youtubeEmbedActive: string;
    spotifyEmbedActive: string;
    deleteTrack: string;
    muteLabel: string;
    unmuteLabel: string;
  }
> = {
  ja: {
    title: 'BGM設定',
    subtitle:
      '画面を見ながら落ち着いたBGMをループ再生できます。.mp3 / .mp4 の追加や、YouTube・SpotifyのURL貼り付けによる自動埋め込み再生に対応しています。',
    statusOn: 'BGM ON',
    statusOff: 'BGM OFF',
    selectTrackLabel: '再生するBGMを選択',
    builtinGroup: '内蔵アンビエント（ループ対応）',
    customGroup: '追加したBGM（ファイル / 埋め込み）',
    volumeLabel: '音量調整',
    loopLabel: 'ループ再生',
    loopOn: 'ループ ON',
    loopOff: '1回のみ',
    uploadTitle: '.mp3 / .mp4 からBGMを追加',
    uploadDesc: '端末内の .mp3 音声や .mp4 動画ファイルを選択すると、ブラウザ内に保存してループ再生できます。',
    uploadBtn: '.mp3 / .mp4 ファイルを選択',
    embedTitle: 'YouTube / Spotify URL 自動埋め込み',
    embedDesc: 'YouTubeやSpotifyの共有URLを貼るだけで自動的に埋め込みプレーヤーとして登録・再生します。',
    urlPlaceholder: 'https://www.youtube.com/watch?v=... または https://open.spotify.com/track/...',
    titlePlaceholder: '曲名・メモ（任意）',
    addEmbedBtn: '埋め込みを追加',
    detectedYoutube: 'YouTube URL を検出（自動ループ埋め込み対応）',
    detectedSpotify: 'Spotify URL を検出（自動埋め込み対応）',
    errEmpty: 'YouTube または Spotify のURLを入力してください。',
    errInvalidUrl: 'URLの形式が正しくないか、動画・トラックIDを認識できませんでした。',
    errUnsupportedProvider: 'YouTube または Spotify のURLのみ自動埋め込みに対応しています。',
    errUnsupportedFile: '.mp3 または .mp4 ファイルを選択してください。',
    addedSuccess: 'BGMを追加して選択しました',
    spotifyVolumeNote:
      '※ Spotify埋め込みはブラウザ仕様上、右下プレーヤー内の音量・再生ボタンで操作します。内蔵BGM・.mp3/.mp4・YouTubeはこの音量バーに連動します。',
    youtubeEmbedActive: 'YouTube 自動ループ埋め込みが有効です（右下のプレーヤーから操作可能）',
    spotifyEmbedActive: 'Spotify 自動埋め込みが有効です（右下のプレーヤーから再生できます）',
    deleteTrack: '削除',
    muteLabel: 'ミュート',
    unmuteLabel: 'ミュート解除',
  },
  en: {
    title: 'BGM Settings',
    subtitle:
      'Play ambient background music on a loop while monitoring. Supports uploading .mp3 / .mp4 files and automatic YouTube or Spotify embeds.',
    statusOn: 'BGM ON',
    statusOff: 'BGM OFF',
    selectTrackLabel: 'Select BGM Track',
    builtinGroup: 'Built-in Ambient Loops',
    customGroup: 'Added BGM (Files & Embeds)',
    volumeLabel: 'Volume',
    loopLabel: 'Loop Playback',
    loopOn: 'Loop ON',
    loopOff: 'Play Once',
    uploadTitle: 'Add from .mp3 / .mp4',
    uploadDesc: 'Choose local .mp3 audio or .mp4 media files. Stored in your browser for looped playback.',
    uploadBtn: 'Choose .mp3 / .mp4 File',
    embedTitle: 'YouTube / Spotify Auto-Embed',
    embedDesc: 'Paste any YouTube or Spotify link to automatically embed and play it.',
    urlPlaceholder: 'https://www.youtube.com/watch?v=... or https://open.spotify.com/track/...',
    titlePlaceholder: 'Custom title (optional)',
    addEmbedBtn: 'Add Embed',
    detectedYoutube: 'YouTube URL detected (auto-loop embed ready)',
    detectedSpotify: 'Spotify URL detected (auto-embed ready)',
    errEmpty: 'Please enter a YouTube or Spotify URL.',
    errInvalidUrl: 'Invalid URL format or media ID could not be parsed.',
    errUnsupportedProvider: 'Only YouTube and Spotify URLs are supported for auto-embed.',
    errUnsupportedFile: 'Please select a .mp3 or .mp4 file.',
    addedSuccess: 'BGM track added and selected',
    spotifyVolumeNote:
      'Note: Spotify embeds use their own internal player controls due to browser cross-origin rules. Built-in, MP3/MP4, and YouTube sync directly with this volume bar.',
    youtubeEmbedActive: 'YouTube auto-loop embed is active (docked at bottom-right)',
    spotifyEmbedActive: 'Spotify auto-embed is active (docked at bottom-right)',
    deleteTrack: 'Delete',
    muteLabel: 'Mute',
    unmuteLabel: 'Unmute',
  },
  zh: {
    title: 'BGM 背景音乐设置',
    subtitle: '可开启背景音乐循环播放，支持添加本地 .mp3 / .mp4 文件及自动嵌入 YouTube、Spotify 链接。',
    statusOn: 'BGM 开启',
    statusOff: 'BGM 关闭',
    selectTrackLabel: '选择背景音乐',
    builtinGroup: '内置环境音（循环）',
    customGroup: '已添加的 BGM（文件 / 嵌入）',
    volumeLabel: '音量调节',
    loopLabel: '循环播放',
    loopOn: '循环开启',
    loopOff: '单次播放',
    uploadTitle: '从 .mp3 / .mp4 添加',
    uploadDesc: '选择本地 .mp3 或 .mp4 文件，保存至浏览器并自动循环播放。',
    uploadBtn: '选择 .mp3 / .mp4 文件',
    embedTitle: 'YouTube / Spotify 自动嵌入',
    embedDesc: '粘贴 YouTube 或 Spotify 链接即可自动生成嵌入式播放器。',
    urlPlaceholder: 'https://www.youtube.com/watch?v=... 或 https://open.spotify.com/track/...',
    titlePlaceholder: '曲目名称（可选）',
    addEmbedBtn: '添加嵌入',
    detectedYoutube: '已识别 YouTube 链接（支持自动循环嵌入）',
    detectedSpotify: '已识别 Spotify 链接（支持自动嵌入）',
    errEmpty: '请输入 YouTube 或 Spotify 链接。',
    errInvalidUrl: '链接格式无效或无法解析曲目 ID。',
    errUnsupportedProvider: '仅支持自动嵌入 YouTube 或 Spotify 链接。',
    errUnsupportedFile: '请选择 .mp3 或 .mp4 文件。',
    addedSuccess: '已添加并选中该 BGM',
    spotifyVolumeNote: '提示：Spotify 嵌入式播放器受浏览器跨域限制，请使用右下角播放器内控制；内置音频、MP3/MP4 和 YouTube 与此音量条同步。',
    youtubeEmbedActive: 'YouTube 自动循环嵌入已启用（位于右下角播放器）',
    spotifyEmbedActive: 'Spotify 自动嵌入已启用（位于右下角播放器）',
    deleteTrack: '删除',
    muteLabel: '静音',
    unmuteLabel: '取消静音',
  },
  ko: {
    title: 'BGM 설정',
    subtitle: '배경음악을 반복 재생할 수 있습니다. .mp3 / .mp4 파일 추가 및 YouTube・Spotify URL 자동 임베드 재생을 지원합니다.',
    statusOn: 'BGM ON',
    statusOff: 'BGM OFF',
    selectTrackLabel: 'BGM 트랙 선택',
    builtinGroup: '내장 앰비언트 (반복)',
    customGroup: '추가된 BGM (파일 / 임베드)',
    volumeLabel: '볼륨 조절',
    loopLabel: '반복 재생',
    loopOn: '반복 ON',
    loopOff: '1회 재생',
    uploadTitle: '.mp3 / .mp4 파일에서 추가',
    uploadDesc: '로컬 .mp3 또는 .mp4 파일을 선택하면 브라우저에 저장되어 반복 재생됩니다.',
    uploadBtn: '.mp3 / .mp4 파일 선택',
    embedTitle: 'YouTube / Spotify URL 자동 임베드',
    embedDesc: 'YouTube 또는 Spotify 링크를 붙여넣으면 자동으로 임베드 플레이어로 재생됩니다.',
    urlPlaceholder: 'https://www.youtube.com/watch?v=... 또는 https://open.spotify.com/track/...',
    titlePlaceholder: '제목 메모 (선택)',
    addEmbedBtn: '임베드 추가',
    detectedYoutube: 'YouTube URL 감지됨 (자동 반복 임베드)',
    detectedSpotify: 'Spotify URL 감지됨 (자동 임베드)',
    errEmpty: 'YouTube 또는 Spotify URL을 입력해 주세요.',
    errInvalidUrl: 'URL 형식이 올바르지 않거나 ID를 인식할 수 없습니다.',
    errUnsupportedProvider: 'YouTube 또는 Spotify URL만 자동 임베드를 지원합니다.',
    errUnsupportedFile: '.mp3 또는 .mp4 파일을 선택해 주세요.',
    addedSuccess: 'BGM을 추가하고 선택했습니다',
    spotifyVolumeNote: '참고: Spotify 임베드는 브라우저 정책상 우측 하단 플레이어에서 제어합니다. 내장 BGM・MP3/MP4・YouTube는 이 볼륨 바와 연동됩니다.',
    youtubeEmbedActive: 'YouTube 자동 반복 임베드 활성화됨 (우측 하단 플레이어)',
    spotifyEmbedActive: 'Spotify 자동 임베드 활성화됨 (우측 하단 플레이어)',
    deleteTrack: '삭제',
    muteLabel: '음소거',
    unmuteLabel: '음소거 해제',
  },
};

function renderSourceIcon(source: BgmSourceType, className = 'h-4 w-4') {
  switch (source) {
    case 'mp3':
      return <FileAudio className={`${className} text-teal-600 dark:text-teal-300`} aria-hidden="true" />;
    case 'mp4':
      return <Film className={`${className} text-indigo-600 dark:text-indigo-300`} aria-hidden="true" />;
    case 'youtube':
      return <Youtube className={`${className} text-red-600 dark:text-red-400`} aria-hidden="true" />;
    case 'spotify':
      return <Radio className={`${className} text-emerald-600 dark:text-emerald-400`} aria-hidden="true" />;
    default:
      return <Sparkles className={`${className} text-[var(--nein-accent-text)]`} aria-hidden="true" />;
  }
}

function getSourceTag(source: BgmSourceType): string {
  switch (source) {
    case 'mp3':
      return 'MP3';
    case 'mp4':
      return 'MP4';
    case 'youtube':
      return 'YouTube';
    case 'spotify':
      return 'Spotify';
    default:
      return 'AMBIENT';
  }
}

export function BgmSettingsSection({
  lang,
  bgmSettings,
  onChangeBgmSettings,
}: BgmSettingsSectionProps) {
  const copy = BGM_COPY[lang] ?? BGM_COPY.ja;
  const selectedTrack = resolveSelectedBgmTrack(bgmSettings);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    const onOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDropdownOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onOutside);
      window.removeEventListener('keydown', onKey);
    };
  }, [dropdownOpen]);

  const liveUrlPreview = urlInput.trim() ? parseExternalBgmUrl(urlInput) : null;

  const handleSelectTrack = (track: BgmTrack) => {
    onChangeBgmSettings((prev) => ({
      ...prev,
      selectedTrackId: track.id,
    }));
    setDropdownOpen(false);
  };

  const handleDeleteCustomTrack = (track: BgmTrack) => {
    if (track.source === 'mp3' || track.source === 'mp4') {
      void deleteBgmMediaBlob(track.id);
    }
    onChangeBgmSettings((prev) => {
      const nextCustom = prev.customTracks.filter((t) => t.id !== track.id);
      const nextSelected =
        prev.selectedTrackId === track.id ? BUILTIN_BGM_TRACKS[0].id : prev.selectedTrackId;
      return {
        ...prev,
        customTracks: nextCustom,
        selectedTrackId: nextSelected,
      };
    });
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;

    const addedTracks: BgmTrack[] = [];
    for (const file of files) {
      const track = createLocalMediaBgmTrack(file);
      if (!track) {
        setFeedback({ kind: 'error', text: copy.errUnsupportedFile });
        return;
      }
      await saveBgmMediaBlob(track.id, file);
      addedTracks.push(track);
    }

    const lastAdded = addedTracks[addedTracks.length - 1];
    onChangeBgmSettings((prev) => ({
      ...prev,
      enabled: true,
      selectedTrackId: lastAdded.id,
      customTracks: [...prev.customTracks, ...addedTracks],
    }));
    setFeedback({ kind: 'success', text: `${copy.addedSuccess}: ${lastAdded.title}` });
  };

  const handleAddEmbedUrl = (e: FormEvent) => {
    e.preventDefault();
    const res = parseExternalBgmUrl(urlInput, titleInput);
    if (!res.ok) {
      const msg =
        res.errorCode === 'empty'
          ? copy.errEmpty
          : res.errorCode === 'unsupported_provider'
            ? copy.errUnsupportedProvider
            : copy.errInvalidUrl;
      setFeedback({ kind: 'error', text: msg });
      return;
    }

    onChangeBgmSettings((prev) => ({
      ...prev,
      enabled: true,
      selectedTrackId: res.track.id,
      customTracks: [...prev.customTracks, res.track],
    }));
    setUrlInput('');
    setTitleInput('');
    setFeedback({ kind: 'success', text: `${copy.addedSuccess}: ${res.track.title}` });
  };

  const effectiveVolume = bgmSettings.muted ? 0 : bgmSettings.volume;

  const renderTrackRow = (track: BgmTrack, removable: boolean) => {
    const isSelected = track.id === selectedTrack.id;
    return (
      <div
        key={track.id}
        className={`group flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 transition-colors ${
          isSelected
            ? 'bg-[var(--nein-accent-soft)] text-[var(--nein-accent-text)]'
            : 'text-slate-800 hover:bg-[var(--nein-sub)] dark:text-slate-100'
        }`}
      >
        <button
          type="button"
          role="option"
          aria-selected={isSelected}
          data-testid={`bgm-option-${track.id}`}
          onClick={() => handleSelectTrack(track)}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left cursor-pointer"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[var(--nein-border-subtle)] bg-[var(--nein-surface)]">
            {renderSourceIcon(track.source)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              <span className="truncate text-xs font-bold">{track.title}</span>
              <span className="shrink-0 rounded border border-[var(--nein-border)] bg-[var(--nein-surface)] px-1.5 py-0.2 font-mono text-[9px] font-bold tracking-wider text-slate-600 dark:text-slate-300">
                {getSourceTag(track.source)}
              </span>
            </span>
            {track.subtitle && (
              <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">
                {track.subtitle}
              </span>
            )}
          </span>
          {isSelected && <Check className="h-4 w-4 shrink-0 text-[var(--nein-accent-text)]" aria-hidden="true" />}
        </button>

        {removable && (
          <button
            type="button"
            aria-label={`${copy.deleteTrack} ${track.title}`}
            data-testid={`bgm-delete-${track.id}`}
            onClick={(ev) => {
              ev.stopPropagation();
              handleDeleteCustomTrack(track);
            }}
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-500/15 hover:text-red-500 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div
      data-testid="bgm-settings-section"
      className="rounded-lg border border-[var(--nein-border)] bg-[var(--nein-surface)] p-5 sm:p-6"
    >
      {/* Header + Master ON/OFF Toggle */}
      <div className="flex flex-col gap-4 border-b border-[var(--nein-border-subtle)] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)]">
            <Music2 className="h-5 w-5 text-[var(--nein-accent-text)]" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">{copy.title}</h2>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{copy.subtitle}</p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={bgmSettings.enabled}
          aria-label={copy.title}
          data-testid="bgm-enabled-switch"
          onClick={() =>
            onChangeBgmSettings((prev) => ({
              ...prev,
              enabled: !prev.enabled,
            }))
          }
          className="inline-flex min-h-[42px] items-center justify-between gap-3 rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] px-4 py-2 text-xs font-semibold text-slate-900 transition-colors hover:border-[var(--nein-accent-border)] dark:text-slate-100 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nein-accent)]"
        >
          <span className="flex items-center gap-2">
            <Music2
              className={`h-4 w-4 ${
                bgmSettings.enabled ? 'text-[var(--nein-accent-text)]' : 'text-slate-500'
              }`}
              aria-hidden="true"
            />
            <span>{bgmSettings.enabled ? copy.statusOn : copy.statusOff}</span>
          </span>

          <span
            aria-hidden="true"
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              bgmSettings.enabled ? 'bg-[var(--nein-accent)]' : 'bg-slate-400'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                bgmSettings.enabled ? 'translate-x-4.5' : 'translate-x-1'
              }`}
            />
          </span>
        </button>
      </div>

      {/* Stylish Custom Dropdown Selector + Loop + Volume Bar */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Custom Stylish Dropdown */}
        <div ref={dropdownRef} className="relative lg:col-span-7">
          <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>{copy.selectTrackLabel}</span>
            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
              {BUILTIN_BGM_TRACKS.length + bgmSettings.customTracks.length} tracks
            </span>
          </div>

          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={dropdownOpen}
            data-testid="bgm-track-dropdown-trigger"
            onClick={() => setDropdownOpen((open) => !open)}
            className={`group flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nein-accent)] ${
              dropdownOpen
                ? 'border-[var(--nein-accent)] bg-[var(--nein-accent-soft)] shadow-md'
                : 'border-[var(--nein-border)] bg-[var(--nein-sub)] hover:border-[var(--nein-accent-border)]'
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--nein-border)] bg-[var(--nein-surface)] shadow-xs">
                {renderSourceIcon(selectedTrack.source, 'h-4 w-4')}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    data-testid="bgm-selected-track-title"
                    className="truncate text-sm font-bold text-slate-900 dark:text-slate-50"
                  >
                    {selectedTrack.title}
                  </span>
                  <span className="shrink-0 rounded border border-[var(--nein-accent-border)] bg-[var(--nein-surface)] px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-[var(--nein-accent-text)]">
                    {getSourceTag(selectedTrack.source)}
                  </span>
                </div>
                <div className="truncate text-[11px] text-slate-600 dark:text-slate-400">
                  {selectedTrack.subtitle ?? selectedTrack.originalUrl ?? selectedTrack.fileName}
                </div>
              </div>
            </div>

            <ChevronDown
              className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${
                dropdownOpen ? 'rotate-180 text-[var(--nein-accent-text)]' : ''
              }`}
              aria-hidden="true"
            />
          </button>

          {dropdownOpen && (
            <div
              role="listbox"
              aria-label={copy.selectTrackLabel}
              data-testid="bgm-track-dropdown-menu"
              className="nein-dropdown-panel absolute left-0 right-0 z-30 mt-2 max-h-[320px] overflow-y-auto rounded-xl border border-[var(--nein-border)] bg-[var(--nein-surface)] p-2 shadow-2xl"
            >
              <div className="px-2.5 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {copy.builtinGroup}
              </div>
              <div className="space-y-0.5">
                {BUILTIN_BGM_TRACKS.map((track) => renderTrackRow(track, false))}
              </div>

              {bgmSettings.customTracks.length > 0 && (
                <>
                  <div className="my-2 border-t border-[var(--nein-border-subtle)]" />
                  <div className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {copy.customGroup}
                  </div>
                  <div className="space-y-0.5">
                    {bgmSettings.customTracks.map((track) => renderTrackRow(track, true))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Volume Slider Bar & Loop Control */}
        <div className="flex flex-col justify-between gap-3 rounded-xl border border-[var(--nein-border)] bg-[var(--nein-sub)] p-3.5 lg:col-span-5">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
              <label htmlFor="bgm-volume-range">{copy.volumeLabel}</label>
              <span
                data-testid="bgm-volume-readout"
                className="font-mono text-xs font-bold tabular-nums text-[var(--nein-accent-text)]"
              >
                {effectiveVolume}%
              </span>
            </div>

            <div className="mt-2.5 flex items-center gap-2.5">
              <button
                type="button"
                data-testid="bgm-mute-btn"
                aria-label={bgmSettings.muted ? copy.unmuteLabel : copy.muteLabel}
                onClick={() =>
                  onChangeBgmSettings((prev) => ({
                    ...prev,
                    muted: !prev.muted,
                  }))
                }
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[var(--nein-border)] bg-[var(--nein-surface)] text-slate-700 transition-colors hover:border-[var(--nein-accent-border)] dark:text-slate-200 cursor-pointer"
              >
                {bgmSettings.muted || bgmSettings.volume === 0 ? (
                  <VolumeX className="h-4 w-4 text-slate-500" aria-hidden="true" />
                ) : (
                  <Volume2 className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
                )}
              </button>

              <input
                id="bgm-volume-range"
                type="range"
                min={0}
                max={100}
                value={effectiveVolume}
                data-testid="bgm-volume-slider"
                onChange={(e) => {
                  const nextVal = Number(e.target.value);
                  onChangeBgmSettings((prev) => ({
                    ...prev,
                    volume: nextVal,
                    muted: nextVal === 0 ? true : false,
                  }));
                }}
                className="h-2 flex-1 accent-[var(--nein-accent)] cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[var(--nein-border-subtle)] pt-2.5">
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
              {copy.loopLabel}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={bgmSettings.loop}
              data-testid="bgm-loop-toggle"
              onClick={() =>
                onChangeBgmSettings((prev) => ({
                  ...prev,
                  loop: !prev.loop,
                }))
              }
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                bgmSettings.loop
                  ? 'border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] text-[var(--nein-accent-text)]'
                  : 'border-[var(--nein-border)] bg-[var(--nein-surface)] text-slate-600 dark:text-slate-400'
              }`}
            >
              <Repeat className="h-3 w-3" aria-hidden="true" />
              <span>{bgmSettings.loop ? copy.loopOn : copy.loopOff}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Embed Notice */}
      {bgmSettings.enabled && selectedTrack.source === 'youtube' && (
        <div
          data-testid="bgm-active-youtube-status"
          className="mt-3 flex items-center gap-2 rounded-lg border border-red-400/35 bg-red-500/10 px-3 py-2 text-xs text-red-900 dark:text-red-200"
        >
          <Youtube className="h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />
          <span>{copy.youtubeEmbedActive}</span>
        </div>
      )}

      {selectedTrack.source === 'spotify' && (
        <div
          data-testid="bgm-active-spotify-status"
          className="mt-3 flex flex-col gap-1 rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-950 dark:text-emerald-200"
        >
          {bgmSettings.enabled && (
            <div className="flex items-center gap-2 font-semibold">
              <Radio className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
              <span>{copy.spotifyEmbedActive}</span>
            </div>
          )}
          <p className="text-[11px] opacity-90">{copy.spotifyVolumeNote}</p>
        </div>
      )}

      {/* Add BGM: .mp3 / .mp4 File Upload + YouTube / Spotify Auto-Embed */}
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Card A: Upload .mp3 / .mp4 */}
        <div className="flex flex-col justify-between rounded-xl border border-[var(--nein-border)] bg-[var(--nein-sub)] p-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
              <Upload className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
              <span>{copy.uploadTitle}</span>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
              {copy.uploadDesc}
            </p>
          </div>

          <div className="mt-3.5">
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.mp4,audio/mpeg,video/mp4,audio/mp4"
              multiple
              data-testid="bgm-file-input"
              onChange={(e) => void handleFileUpload(e)}
              className="hidden"
            />
            <button
              type="button"
              data-testid="bgm-file-upload-btn"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--nein-accent-border)] bg-[var(--nein-surface)] px-3.5 py-2.5 text-xs font-semibold text-[var(--nein-accent-text)] transition-colors hover:bg-[var(--nein-accent-soft)] cursor-pointer"
            >
              <FileAudio className="h-4 w-4" aria-hidden="true" />
              <span>{copy.uploadBtn}</span>
            </button>
          </div>
        </div>

        {/* Card B: YouTube / Spotify URL Auto-Embed */}
        <form
          onSubmit={handleAddEmbedUrl}
          className="flex flex-col justify-between rounded-xl border border-[var(--nein-border)] bg-[var(--nein-sub)] p-4"
        >
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
              <Link2 className="h-4 w-4 text-[var(--nein-accent-text)]" aria-hidden="true" />
              <span>{copy.embedTitle}</span>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
              {copy.embedDesc}
            </p>
          </div>

          <div className="mt-3 space-y-2">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                if (feedback) setFeedback(null);
              }}
              placeholder={copy.urlPlaceholder}
              aria-label={copy.embedTitle}
              data-testid="bgm-url-input"
              className="w-full rounded-md border border-[var(--nein-border)] bg-[var(--nein-surface)] px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[var(--nein-accent)] focus:outline-none dark:text-slate-100"
            />

            {liveUrlPreview?.ok && (
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                {renderSourceIcon(liveUrlPreview.track.source, 'h-3.5 w-3.5')}
                <span>
                  {liveUrlPreview.track.source === 'youtube'
                    ? copy.detectedYoutube
                    : copy.detectedSpotify}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder={copy.titlePlaceholder}
                aria-label={copy.titlePlaceholder}
                data-testid="bgm-url-title-input"
                className="min-w-0 flex-1 rounded-md border border-[var(--nein-border)] bg-[var(--nein-surface)] px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[var(--nein-accent)] focus:outline-none dark:text-slate-100"
              />
              <button
                type="submit"
                data-testid="bgm-url-add-btn"
                className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[var(--nein-accent)] px-3 py-1.5 text-xs font-semibold text-[var(--nein-accent-contrast)] transition-opacity hover:opacity-90 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{copy.addEmbedBtn}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          role={feedback.kind === 'error' ? 'alert' : 'status'}
          data-testid="bgm-feedback-message"
          className={`mt-3 rounded-lg border px-3 py-2 text-xs font-medium ${
            feedback.kind === 'error'
              ? 'border-red-400/60 bg-red-500/10 text-red-700 dark:text-red-300'
              : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
          }`}
        >
          {feedback.text}
        </div>
      )}
    </div>
  );
}
