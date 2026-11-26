import {
  Check,
  ChevronDown,
  FileAudio,
  Film,
  Languages,
  Link2,
  LocateFixed,
  MapPin,
  Megaphone,
  Mic,
  Music2,
  Plus,
  Radio,
  Repeat,
  Sparkles,
  Square,
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
import {
  type CurrentLocationContext,
  type EewSpeechLanguageSetting,
  type EewSpeechSettings,
  clampSpeechPitch,
  clampSpeechRate,
  getAvailableSpeechVoices,
  isSpeechSynthesisSupported,
  resolveEffectiveSpeechLanguage,
  selectBestSpeechVoice,
  subscribeSpeechVoicesChanged,
} from '../utils/eewSpeech';
import { localizeJapanesePlaceName } from '../utils/eewSpeechLocale';
import { type AppLanguage, LANGUAGE_OPTIONS } from '../utils/i18n';

interface BgmSettingsSectionProps {
  lang: AppLanguage;
  bgmSettings: BgmSettings;
  onChangeBgmSettings: (updater: (prev: BgmSettings) => BgmSettings) => void;
  eewSpeechSettings: EewSpeechSettings;
  onChangeEewSpeechSettings: (updater: (prev: EewSpeechSettings) => EewSpeechSettings) => void;
  currentLocation: CurrentLocationContext;
  isEewSpeaking: boolean;
  lastSpokenScript: string | null;
  speechError: string | null;
  onTestEewSpeech: () => void;
  onStopEewSpeech: () => void;
  onDetectCurrentLocation: (lat: number, lon: number) => void;
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

const EEW_SPEECH_UI_COPY: Record<
  AppLanguage,
  {
    title: string;
    subtitle: string;
    enabledOn: string;
    enabledOff: string;
    locationLabel: string;
    sourceGps: string;
    sourceRegistered: string;
    sourceFallback: string;
    detectGpsBtn: string;
    gpsDenied: string;
    speechLangLabel: string;
    speechLangAuto: string;
    voiceModelLabel: string;
    voiceAutoOption: string;
    voiceFallbackNote: string;
    duckLabel: string;
    duckDesc: string;
    adviceLabel: string;
    adviceDesc: string;
    rateLabel: string;
    pitchLabel: string;
    testBtn: string;
    stopBtn: string;
    speakingBadge: string;
    bgmDuckingBadge: string;
    previewLabel: string;
    previewPlaceholder: string;
    unsupportedNotice: string;
  }
> = {
  ja: {
    title: '緊急地震速報・現在地防災アナウンス（多言語・流暢音声 × BGM連携）',
    subtitle:
      '緊急地震速報の発表時に、日本語・English・简体中文・한국語の全4言語で自然な間の取り方と抑揚をつけた防災アナウンスを自動読み上げします。再生中のBGMは自動で一時消音されます。',
    enabledOn: '音声読み上げ ON',
    enabledOff: '音声読み上げ OFF',
    locationLabel: '読み上げ対象の現在地',
    sourceGps: 'GPS現在地',
    sourceRegistered: '優先登録地域',
    sourceFallback: '既定地域',
    detectGpsBtn: '現在地を取得',
    gpsDenied: '位置情報の取得が許可されなかったか、ブラウザで利用できませんでした。',
    speechLangLabel: '読み上げ言語（導入済み全4言語対応）',
    speechLangAuto: 'アプリ連動',
    voiceModelLabel: '音声モデル（高品質・Neural優先）',
    voiceAutoOption: '自動（最高品質・流暢）',
    voiceFallbackNote: 'この言語の専用音声が端末に未導入のため、標準音声または画面表示で案内します。',
    duckLabel: '読み上げ中にBGMを自動一時消音',
    duckDesc: 'BgmPlayerEngineと連携し、音声読み上げ中は内蔵BGM・MP3/MP4・YouTubeの音量を自動で下げます。',
    adviceLabel: '避難行動・津波/気象警報アドバイスを含める',
    adviceDesc: '現在地が警報対象の場合の安全確保や、発表中の気象警報・津波リスクもあわせて読み上げます。',
    rateLabel: '読み上げ速度',
    pitchLabel: '声の高さ（抑揚ベース）',
    testBtn: 'テスト読み上げ（BGM連携確認）',
    stopBtn: '読み上げ停止',
    speakingBadge: '音声読み上げ中',
    bgmDuckingBadge: 'BGM自動消音中',
    previewLabel: '最新の読み上げ内容',
    previewPlaceholder: '「テスト読み上げ」を押すと、選択言語で現在地向けの流暢な防災アナウンスを確認できます。',
    unsupportedNotice: 'お使いのブラウザは Web Speech API（speechSynthesis）に対応していないため音声出力できません。',
  },
  en: {
    title: 'EEW Multilingual Local Voice Broadcast (Fluent TTS × BGM Link)',
    subtitle:
      'Delivers segmented, natural-cadence disaster voice announcements in all 4 app languages (Japanese, English, Simplified Chinese, Korean) with localized place names while auto-muting BGM.',
    enabledOn: 'Voice Alert ON',
    enabledOff: 'Voice Alert OFF',
    locationLabel: 'Target Current Location',
    sourceGps: 'GPS Location',
    sourceRegistered: 'Primary Region',
    sourceFallback: 'Default Region',
    detectGpsBtn: 'Use Current Location',
    gpsDenied: 'Location access was denied or is unavailable in this browser.',
    speechLangLabel: 'Voice Language (All 4 App Languages)',
    speechLangAuto: 'App Lang',
    voiceModelLabel: 'Voice Model (Neural / Natural Priority)',
    voiceAutoOption: 'Auto (Most Fluent)',
    voiceFallbackNote: 'No dedicated voice for this language was detected on this device; falling back to default speech or on-screen script.',
    duckLabel: 'Auto-mute BGM during voice alerts',
    duckDesc: 'Links with BgmPlayerEngine to mute built-in ambient, MP3/MP4, and YouTube playback while speaking.',
    adviceLabel: 'Include safety & tsunami/weather guidance',
    adviceDesc: 'Adds protective actions, coastal tsunami evacuation prompts, and active local weather warnings.',
    rateLabel: 'Speech Rate',
    pitchLabel: 'Voice Pitch',
    testBtn: 'Test Voice Readout (Check BGM Link)',
    stopBtn: 'Stop Readout',
    speakingBadge: 'Speaking Now',
    bgmDuckingBadge: 'BGM Auto-Muted',
    previewLabel: 'Latest Broadcast Script',
    previewPlaceholder: 'Click "Test Voice Readout" to hear the fluent segmented local disaster broadcast in the selected language.',
    unsupportedNotice: 'Web Speech API (speechSynthesis) is not supported in this browser.',
  },
  zh: {
    title: '紧急地震速报・多语言流畅防灾语音播报（Web Speech API × BGM联动）',
    subtitle:
      '发布紧急地震速报时，支持日语、英语、简体中文、韩语全部4种语言的分段自然语调播报，自动将日本地名转换为自然中文读法并临时静音 BGM。',
    enabledOn: '语音播报开启',
    enabledOff: '语音播报关闭',
    locationLabel: '播报目标当前位置',
    sourceGps: 'GPS定位',
    sourceRegistered: '优先关注地区',
    sourceFallback: '默认地区',
    detectGpsBtn: '获取当前位置',
    gpsDenied: '未能获取定位权限或当前浏览器不支持定位。',
    speechLangLabel: '播报语言（支持全部4种应用语言）',
    speechLangAuto: '跟随应用',
    voiceModelLabel: '语音模型（优先选择自然神经语音）',
    voiceAutoOption: '自动（最流畅音色）',
    voiceFallbackNote: '当前设备未检测到该语言的专用音色，将使用默认语音或文本提示。',
    duckLabel: '播报期间自动临时静音 BGM',
    duckDesc: '与 BgmPlayerEngine 联动，播报语音时自动静音内置环境音、MP3/MP4 与 YouTube。',
    adviceLabel: '包含避难行动与海啸/气象警报提示',
    adviceDesc: '播报当前位置的防护建议、海啸撤离提示及生效中的本地气象警报。',
    rateLabel: '播报语速',
    pitchLabel: '音调高低',
    testBtn: '测试语音播报（验证BGM联动）',
    stopBtn: '停止播报',
    speakingBadge: '正在语音播报',
    bgmDuckingBadge: 'BGM自动静音中',
    previewLabel: '最新播报内容',
    previewPlaceholder: '点击「测试语音播报」即可试听所选语言的流畅防灾语音并确认 BGM 自动静音联动。',
    unsupportedNotice: '当前浏览器不支持 Web Speech API（speechSynthesis）。',
  },
  ko: {
    title: '긴급지진속보・다국어 자연스러운 재난 음성 안내 (Web Speech API × BGM 연동)',
    subtitle:
      '긴급지진속보 발표 시 일본어・영어・중국어・한국어 4개 언어 모두 자연스러운 호흡과 억양으로 현재 위치 재난 정보를 안내하며 BGM을 자동 음소거합니다.',
    enabledOn: '음성 안내 ON',
    enabledOff: '음성 안내 OFF',
    locationLabel: '안내 대상 현재 위치',
    sourceGps: 'GPS 현재 위치',
    sourceRegistered: '우선 등록 지역',
    sourceFallback: '기본 지역',
    detectGpsBtn: '현재 위치 가져오기',
    gpsDenied: '위치 권한이 거부되었거나 브라우저에서 위치 정보를 사용할 수 없습니다.',
    speechLangLabel: '음성 안내 언어 (앱 지원 4개 언어 전체)',
    speechLangAuto: '앱 연동',
    voiceModelLabel: '음성 모델 (고품질・Neural 우선)',
    voiceAutoOption: '자동 (가장 자연스러운 음성)',
    voiceFallbackNote: '이 기기에 해당 언어 전용 음성이 없어 기본 음성 또는 화면 텍스트로 안내합니다.',
    duckLabel: '음성 안내 중 BGM 자동 음소거',
    duckDesc: 'BgmPlayerEngine과 연동되어 음성 안내 중 내장 BGM・MP3/MP4・YouTube 볼륨을 자동 음소거합니다.',
    adviceLabel: '대피 요령 및 쓰나미/기상 경보 안내 포함',
    adviceDesc: '안전 행동 요령, 해안 쓰나미 대피 안내 및 현재 위치 기상 경보를 함께 읽어줍니다.',
    rateLabel: '음성 속도',
    pitchLabel: '목소리 톤 (피치)',
    testBtn: '테스트 음성 안내 (BGM 연동 확인)',
    stopBtn: '안내 중지',
    speakingBadge: '음성 안내 중',
    bgmDuckingBadge: 'BGM 자동 음소거 중',
    previewLabel: '최근 안내 스크립트',
    previewPlaceholder: '「테스트 음성 안내」를 눌러 선택한 언어의 자연스러운 재난 음성 안내와 BGM 연동을 확인하세요.',
    unsupportedNotice: '이 브라우저는 Web Speech API(speechSynthesis)를 지원하지 않습니다.',
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
  eewSpeechSettings,
  onChangeEewSpeechSettings,
  currentLocation,
  isEewSpeaking,
  lastSpokenScript,
  speechError,
  onTestEewSpeech,
  onStopEewSpeech,
  onDetectCurrentLocation,
}: BgmSettingsSectionProps) {
  const copy = BGM_COPY[lang] ?? BGM_COPY.ja;
  const speechCopy = EEW_SPEECH_UI_COPY[lang] ?? EEW_SPEECH_UI_COPY.ja;
  const selectedTrack = resolveSelectedBgmTrack(bgmSettings);
  const speechSupported = isSpeechSynthesisSupported();
  const effectiveSpeechLang = resolveEffectiveSpeechLanguage(eewSpeechSettings.speechLanguage, lang);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>(() =>
    getAvailableSpeechVoices(effectiveSpeechLang),
  );

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const syncVoices = () => {
      setAvailableVoices(getAvailableSpeechVoices(effectiveSpeechLang));
    };
    syncVoices();
    return subscribeSpeechVoicesChanged(syncVoices);
  }, [effectiveSpeechLang]);

  const autoBestVoice = selectBestSpeechVoice(availableVoices, effectiveSpeechLang);
  const localizedLocationLabel =
    effectiveSpeechLang === 'ja'
      ? currentLocation.label
      : localizeJapanesePlaceName(currentLocation.prefectureName, effectiveSpeechLang);
  const activeSpeechLangOption =
    LANGUAGE_OPTIONS.find((opt) => opt.id === effectiveSpeechLang) ?? LANGUAGE_OPTIONS[0];

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

      {/* EEW Voice Readout × BgmPlayerEngine Linkage Subsection */}
      <div
        data-testid="eew-speech-settings-section"
        className="mt-5 border-t border-[var(--nein-border-subtle)] pt-5"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10">
              <Megaphone className="h-5 w-5 text-red-600 dark:text-red-400" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {speechCopy.title}
              </h3>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                {speechCopy.subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={eewSpeechSettings.enabled}
            aria-label={speechCopy.title}
            data-testid="eew-speech-toggle"
            onClick={() =>
              onChangeEewSpeechSettings((prev) => ({
                ...prev,
                enabled: !prev.enabled,
              }))
            }
            className="inline-flex min-h-[42px] items-center justify-between gap-3 rounded-lg border border-[var(--nein-border)] bg-[var(--nein-sub)] px-4 py-2 text-xs font-semibold text-slate-900 transition-colors hover:border-[var(--nein-accent-border)] dark:text-slate-100 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nein-accent)]"
          >
            <span className="flex items-center gap-2">
              <Megaphone
                className={`h-4 w-4 ${
                  eewSpeechSettings.enabled ? 'text-red-600 dark:text-red-400' : 'text-slate-500'
                }`}
                aria-hidden="true"
              />
              <span>
                {eewSpeechSettings.enabled ? speechCopy.enabledOn : speechCopy.enabledOff}
              </span>
            </span>

            <span
              aria-hidden="true"
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                eewSpeechSettings.enabled ? 'bg-[var(--nein-accent)]' : 'bg-slate-400'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                  eewSpeechSettings.enabled ? 'translate-x-4.5' : 'translate-x-1'
                }`}
              />
            </span>
          </button>
        </div>

        {!speechSupported && (
          <div
            role="alert"
            className="mt-3 rounded-lg border border-amber-400/50 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200"
          >
            {speechCopy.unsupportedNotice}
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Location, Language & Linkage Options */}
          <div className="space-y-3.5 rounded-xl border border-[var(--nein-border)] bg-[var(--nein-sub)] p-4 lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  {speechCopy.locationLabel}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-[var(--nein-accent-text)]" aria-hidden="true" />
                  <span
                    data-testid="eew-speech-current-location"
                    className="text-sm font-bold text-slate-900 dark:text-slate-50"
                  >
                    {localizedLocationLabel}
                  </span>
                  <span className="rounded border border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--nein-accent-text)]">
                    {currentLocation.source === 'geolocation'
                      ? speechCopy.sourceGps
                      : currentLocation.source === 'registered'
                        ? speechCopy.sourceRegistered
                        : speechCopy.sourceFallback}
                  </span>
                </div>
              </div>

              <button
                type="button"
                data-testid="eew-speech-gps-btn"
                onClick={() => {
                  if (typeof navigator === 'undefined' || !navigator.geolocation) {
                    setGpsError(speechCopy.gpsDenied);
                    return;
                  }
                  setGpsError(null);
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      onDetectCurrentLocation(pos.coords.latitude, pos.coords.longitude);
                      setGpsError(null);
                    },
                    () => {
                      setGpsError(speechCopy.gpsDenied);
                    },
                    { timeout: 8000 },
                  );
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-[var(--nein-accent-border)] bg-[var(--nein-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--nein-accent-text)] transition-colors hover:bg-[var(--nein-accent-soft)] cursor-pointer"
              >
                <LocateFixed className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{speechCopy.detectGpsBtn}</span>
              </button>
            </div>

            {gpsError && (
              <p className="text-[11px] font-medium text-amber-700 dark:text-amber-300">
                {gpsError}
              </p>
            )}

            {/* 4-Language Speech Language Selector */}
            <div className="border-t border-[var(--nein-border-subtle)] pt-3">
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                <Languages className="h-3.5 w-3.5 text-[var(--nein-accent-text)]" aria-hidden="true" />
                <span>{speechCopy.speechLangLabel}</span>
              </div>
              <div
                role="radiogroup"
                aria-label={speechCopy.speechLangLabel}
                className="flex flex-wrap gap-1.5"
              >
                {(
                  [
                    { id: 'auto' as EewSpeechLanguageSetting, label: speechCopy.speechLangAuto, code: 'AUTO' },
                    ...LANGUAGE_OPTIONS.map((opt) => ({
                      id: opt.id as EewSpeechLanguageSetting,
                      label: opt.nativeName,
                      code: opt.codeLabel,
                    })),
                  ]
                ).map((item) => {
                  const selected = eewSpeechSettings.speechLanguage === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      data-testid={`eew-speech-lang-${item.id}`}
                      onClick={() =>
                        onChangeEewSpeechSettings((prev) => ({
                          ...prev,
                          speechLanguage: item.id,
                          preferredVoiceName: '',
                        }))
                      }
                      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                        selected
                          ? 'border-[var(--nein-accent)] bg-[var(--nein-accent-soft)] text-[var(--nein-accent-text)]'
                          : 'border-[var(--nein-border)] bg-[var(--nein-surface)] text-slate-700 hover:border-[var(--nein-accent-border)] dark:text-slate-200'
                      }`}
                    >
                      <span className="font-mono text-[9px] font-bold opacity-80">{item.code}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2.5 border-t border-[var(--nein-border-subtle)] pt-3">
              {/* Auto-Duck BGM Switch */}
              <label className="flex items-start justify-between gap-3 cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {speechCopy.duckLabel}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                    {speechCopy.duckDesc}
                  </div>
                </div>
                <input
                  type="checkbox"
                  data-testid="eew-speech-duck-toggle"
                  checked={eewSpeechSettings.duckBgmDuringSpeech}
                  onChange={(e) =>
                    onChangeEewSpeechSettings((prev) => ({
                      ...prev,
                      duckBgmDuringSpeech: e.target.checked,
                    }))
                  }
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--nein-accent)] cursor-pointer"
                />
              </label>

              {/* Include Preparedness Advice Switch */}
              <label className="flex items-start justify-between gap-3 cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {speechCopy.adviceLabel}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                    {speechCopy.adviceDesc}
                  </div>
                </div>
                <input
                  type="checkbox"
                  data-testid="eew-speech-advice-toggle"
                  checked={eewSpeechSettings.includePreparednessAdvice}
                  onChange={(e) =>
                    onChangeEewSpeechSettings((prev) => ({
                      ...prev,
                      includePreparednessAdvice: e.target.checked,
                    }))
                  }
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--nein-accent)] cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Voice Model, Rate, Pitch & Test Readout Panel */}
          <div className="flex flex-col justify-between gap-3.5 rounded-xl border border-[var(--nein-border)] bg-[var(--nein-sub)] p-4 lg:col-span-5">
            <div className="space-y-3">
              {/* Voice Model Selector */}
              <div>
                <label
                  htmlFor="eew-speech-voice-select"
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  <Mic className="h-3.5 w-3.5 text-[var(--nein-accent-text)]" aria-hidden="true" />
                  <span>{speechCopy.voiceModelLabel}</span>
                </label>
                <select
                  id="eew-speech-voice-select"
                  data-testid="eew-speech-voice-select"
                  value={eewSpeechSettings.preferredVoiceName}
                  onChange={(e) =>
                    onChangeEewSpeechSettings((prev) => ({
                      ...prev,
                      preferredVoiceName: e.target.value,
                    }))
                  }
                  className="mt-1.5 w-full rounded-md border border-[var(--nein-border)] bg-[var(--nein-surface)] px-2.5 py-1.5 text-xs text-slate-900 focus:border-[var(--nein-accent)] focus:outline-none dark:text-slate-100 cursor-pointer"
                >
                  <option value="">
                    {autoBestVoice
                      ? `${speechCopy.voiceAutoOption} — ${autoBestVoice.name}`
                      : speechCopy.voiceAutoOption}
                  </option>
                  {availableVoices.map((voice) => (
                    <option key={`${voice.name}-${voice.lang}`} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
                {speechSupported && availableVoices.length === 0 && (
                  <p className="mt-1 text-[10px] leading-snug text-slate-500 dark:text-slate-400">
                    {speechCopy.voiceFallbackNote}
                  </p>
                )}
              </div>

              {/* Rate Slider */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <label htmlFor="eew-speech-rate-range">{speechCopy.rateLabel}</label>
                  <span
                    data-testid="eew-speech-rate-readout"
                    className="font-mono text-xs font-bold tabular-nums text-[var(--nein-accent-text)]"
                  >
                    {eewSpeechSettings.rate.toFixed(2)}x
                  </span>
                </div>
                <input
                  id="eew-speech-rate-range"
                  type="range"
                  min={0.8}
                  max={1.4}
                  step={0.05}
                  value={eewSpeechSettings.rate}
                  data-testid="eew-speech-rate-slider"
                  onChange={(e) =>
                    onChangeEewSpeechSettings((prev) => ({
                      ...prev,
                      rate: clampSpeechRate(Number(e.target.value)),
                    }))
                  }
                  className="mt-1.5 h-2 w-full accent-[var(--nein-accent)] cursor-pointer"
                />
              </div>

              {/* Pitch Slider */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <label htmlFor="eew-speech-pitch-range">{speechCopy.pitchLabel}</label>
                  <span
                    data-testid="eew-speech-pitch-readout"
                    className="font-mono text-xs font-bold tabular-nums text-[var(--nein-accent-text)]"
                  >
                    {eewSpeechSettings.pitch.toFixed(2)}
                  </span>
                </div>
                <input
                  id="eew-speech-pitch-range"
                  type="range"
                  min={0.85}
                  max={1.15}
                  step={0.05}
                  value={eewSpeechSettings.pitch}
                  data-testid="eew-speech-pitch-slider"
                  onChange={(e) =>
                    onChangeEewSpeechSettings((prev) => ({
                      ...prev,
                      pitch: clampSpeechPitch(Number(e.target.value)),
                    }))
                  }
                  className="mt-1.5 h-2 w-full accent-[var(--nein-accent)] cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-2">
              {isEewSpeaking ? (
                <button
                  type="button"
                  data-testid="eew-speech-test-btn"
                  onClick={onStopEewSpeech}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/60 bg-red-600 px-3.5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-red-500 cursor-pointer"
                >
                  <Square className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                  <span>{speechCopy.stopBtn}</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!speechSupported}
                  data-testid="eew-speech-test-btn"
                  onClick={onTestEewSpeech}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--nein-accent)] px-3.5 py-2.5 text-xs font-bold text-[var(--nein-accent-contrast)] transition-opacity hover:opacity-90 disabled:opacity-45 cursor-pointer"
                >
                  <Volume2 className="h-4 w-4" aria-hidden="true" />
                  <span>{speechCopy.testBtn}</span>
                </button>
              )}

              {isEewSpeaking && (
                <div
                  role="status"
                  data-testid="eew-speech-active-status"
                  className="flex flex-wrap items-center gap-2 text-[11px] font-semibold"
                >
                  <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                    <span>{speechCopy.speakingBadge}</span>
                  </span>
                  {bgmSettings.enabled && eewSpeechSettings.duckBgmDuringSpeech && (
                    <span className="inline-flex items-center gap-1 rounded border border-red-400/50 bg-red-500/10 px-1.5 py-0.5 text-[10px] text-red-700 dark:text-red-300">
                      <VolumeX className="h-3 w-3" aria-hidden="true" />
                      <span>{speechCopy.bgmDuckingBadge}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Spoken Script Preview */}
        <div className="mt-3 rounded-lg border border-[var(--nein-border-subtle)] bg-[var(--nein-sub)] px-3.5 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {speechCopy.previewLabel}
            </span>
            <span
              data-testid="eew-speech-active-lang-badge"
              className="rounded border border-[var(--nein-accent-border)] bg-[var(--nein-accent-soft)] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[var(--nein-accent-text)]"
            >
              {activeSpeechLangOption.codeLabel} · {activeSpeechLangOption.nativeName}
            </span>
          </div>
          <p
            data-testid="eew-speech-preview"
            className="mt-1 text-xs leading-relaxed text-slate-700 dark:text-slate-200"
          >
            {lastSpokenScript || speechCopy.previewPlaceholder}
          </p>
          {speechError && (
            <p
              role="status"
              data-testid="eew-speech-error-notice"
              className="mt-2 rounded border border-amber-400/45 bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-medium text-amber-900 dark:text-amber-200"
            >
              {speechError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
