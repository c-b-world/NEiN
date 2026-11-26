export type AppLanguage = 'ja' | 'en' | 'zh' | 'ko';

export interface LanguageOption {
  id: AppLanguage;
  nativeName: string;
  subLabel: string;
  codeLabel: string;
}

export const LANGUAGE_STORAGE_KEY = 'nein_language';
export const DEFAULT_LANGUAGE: AppLanguage = 'ja';

export const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
  {
    id: 'ja',
    nativeName: '日本語',
    subLabel: '標準表示（日本国内向け）',
    codeLabel: 'JA',
  },
  {
    id: 'en',
    nativeName: 'English',
    subLabel: 'International / Global View',
    codeLabel: 'EN',
  },
  {
    id: 'zh',
    nativeName: '简体中文',
    subLabel: '中文界面（国际通用）',
    codeLabel: 'ZH',
  },
  {
    id: 'ko',
    nativeName: '한국어',
    subLabel: '한국어 인터페이스',
    codeLabel: 'KO',
  },
];

export function isValidLanguage(value: unknown): value is AppLanguage {
  return value === 'ja' || value === 'en' || value === 'zh' || value === 'ko';
}

export function loadLanguage(): AppLanguage {
  if (typeof window === 'undefined' || !window.localStorage) {
    return DEFAULT_LANGUAGE;
  }
  try {
    const raw = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isValidLanguage(raw) ? raw : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export function saveLanguage(lang: AppLanguage): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // Ignore storage quota errors
  }
}

export function applyLanguageToDocument(lang: AppLanguage): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang;
}

export interface AppMessages {
  nav: {
    quack: string;
    quackAll: string;
    quackQuake: string;
    quackEew: string;
    quackOther: string;
    weather: string;
    settings: string;
    testDispatch: string;
    mobileModeSwitcher: string;
    navAria: string;
  };
  toolbar: {
    wsConnected: string;
    wsConnecting: string;
    wsReconnecting: string;
    wsOffline: string;
    archiveLabel: string;
    backToLatest: string;
    lastUpdated: string;
    nextAutoFetch: string;
    quickTestEew: string;
    clearTests: string;
    autoOn: string;
    autoOff: string;
    intervalUnitSec: string;
    soundOn: string;
    soundOff: string;
    notifyOn: string;
    notifyOff: string;
    refreshNow: string;
    refreshing: string;
  };
  list: {
    historyHeading: string;
    archiveHeadingPrefix: string;
    itemsShownSuffix: string;
    pickDate: string;
    changeDate: string;
    archiveBanner: string;
    backToRealtime: string;
    searchPlaceholder: string;
    clearSearchAria: string;
    dateFrom: string;
    dateTo: string;
    maxScale: string;
    magnitude: string;
    allOption: string;
    scaleOverPrefix: string;
    scaleOverSuffix: string;
    matchedPrefix: string;
    resetFilters: string;
    tabAll: string;
    tabQuake: string;
    tabEew: string;
    tabOther: string;
    emptyArchive: string;
    emptyFiltered: string;
    emptyArchiveHint: string;
    emptyFilteredHint: string;
    showAll: string;
    loadMore: string;
    loadingMore: string;
    loadedTotalPrefix: string;
    testTag: string;
    copyRowAria: string;
  };
  detail: {
    emptyTitle: string;
    emptyDesc: string;
    testPayloadTag: string;
    pdfDownload: string;
    pdfGenerating: string;
    pdfDone: string;
    pdfError: string;
    copyQuake: string;
    copied: string;
    metricScaleOrType: string;
    metricMagnitude: string;
    metricDepth: string;
    metricTsunami: string;
    metricIssueSerial: string;
    metricDetectionType: string;
    metricSource: string;
    metricRegion: string;
    mapTitle: string;
    mapVicinity: string;
    mapNational: string;
    mapNoCoordsOverlay: string;
    mapNoCoordsFooter: string;
    mapNearby: string;
    mapLatPrefix: string;
    mapLonPrefix: string;
    copyPreviewTitle: string;
    copyTextBtn: string;
    chartEmpty: string;
    chartUnitPoints: string;
    chartUnitAreas: string;
    chartTotalPrefix: string;
    chartTitle551: string;
    chartTitle556: string;
    chartTitleDefault: string;
    pointsHeading: string;
    eewAreasHeading: string;
    tsunamiAreasHeading: string;
    adviceHeading: string;
    adviceMindsetTitle: string;
    adviceStockpileTitle: string;
    adviceDisclaimer: string;
  };
  calendar: {
    weekdays: readonly string[];
    loadingMonth: string;
    scale12: string;
    scale34: string;
    scale5Plus: string;
    todayBtn: string;
    realtimeBtn: string;
  };
  settings: {
    title: string;
    subtitle: string;
    resetAppearance: string;
    languageTitle: string;
    languageDesc: string;
    languageCurrent: string;
    modeTitle: string;
    modeDesc: string;
    modeOnLabel: string;
    modeOffLabel: string;
    colorTitle: string;
    colorDesc: string;
    colorCurrent: string;
    colorApplied: string;
    colorSelect: string;
    previewLabel: string;
    previewModeDark: string;
    previewModeLight: string;
    previewSampleQuake: string;
    previewTabState: string;
    previewActionBtn: string;
    opsTitle: string;
    pushTitle: string;
    pushDesc: string;
    soundTitle: string;
    soundDesc: string;
    pollingTitle: string;
    pollingDesc: string;
  };
  testModal: {
    title: string;
    desc: string;
    cancel: string;
    kantoTitle: string;
    kantoSub: string;
    nankaiTitle: string;
    nankaiSub: string;
    detectTitle: string;
    detectSub: string;
    cancelTitle: string;
    cancelSub: string;
  };
  eewModal: {
    cancelledTitle: string;
    detectTitle: string;
    warningTitle: string;
    testBadge: string;
    cancelledDesc: string;
    detectHeadline: string;
    detectDescPrefix: string;
    hypocenterLabel: string;
    analyzing: string;
    predictedMaxScale: string;
    orHigher: string;
    targetAreas: string;
    safetyNotice: string;
    copyAlert: string;
    closeBtn: string;
  };
  weather: {
    prefectureLabel: string;
    subAreaLabel: string;
    fetchedAt: string;
    refreshBtn: string;
    fetchingBtn: string;
    waitBtnPrefix: string;
    specialWarningBadge: string;
    staleBadge: string;
    specialWarningAction: string;
    statusOk: string;
    statusStale: string;
    statusError: string;
    statusLoading: string;
    publishedAt: string;
    officialWarningHeading: string;
    modelAdvisoryHeading: string;
    modelAdvisoryNote: string;
    currentConditionsHeading: string;
    chart24hHeading: string;
    shortForecastHeading: string;
    weeklyForecastHeading: string;
    overviewHeading: string;
    tempLabel: string;
    humidityLabel: string;
    pressureLabel: string;
    windLabel: string;
    precipLabel: string;
    popLabel: string;
    disclaimer: string;
  };
  footer: {
    brandLine: string;
    sourceLine: string;
  };
  errorBanner: {
    fetchErrorPrefix: string;
    retry: string;
  };
}

const JA_MESSAGES: AppMessages = {
  nav: {
    quack: 'NEiN QUACK',
    quackAll: '新着履歴',
    quackQuake: '地震情報',
    quackEew: '緊急地震速報',
    quackOther: '津波・感知',
    weather: 'NEiN WEATHER',
    settings: 'システム設定',
    testDispatch: 'テスト送信',
    mobileModeSwitcher: '表示モード切替',
    navAria: '情報カテゴリ',
  },
  toolbar: {
    wsConnected: 'リアルタイム受信中',
    wsConnecting: 'リアルタイム接続中',
    wsReconnecting: '再接続中',
    wsOffline: 'ポーリング待機',
    archiveLabel: 'アーカイブ',
    backToLatest: '最新に戻る',
    lastUpdated: '最終更新',
    nextAutoFetch: '次回自動取得',
    quickTestEew: '即時テスト発報',
    clearTests: 'テスト消去',
    autoOn: '自動更新 ON',
    autoOff: '自動更新 OFF',
    intervalUnitSec: '秒',
    soundOn: '警報音 ON',
    soundOff: '警報音 OFF',
    notifyOn: '通知 ON',
    notifyOff: '通知 OFF',
    refreshNow: '今すぐ更新',
    refreshing: '更新中...',
  },
  list: {
    historyHeading: '地震・防災履歴（新着・過去）',
    archiveHeadingPrefix: '過去データ：',
    itemsShownSuffix: '件表示',
    pickDate: '日付指定',
    changeDate: '日付変更',
    archiveBanner: 'アーカイブ閲覧中（JMA地震・津波）',
    backToRealtime: 'リアルタイムに戻る',
    searchPlaceholder: '震源地・都道府県・市区町村・地方名で検索',
    clearSearchAria: 'キーワード検索をクリア',
    dateFrom: '開始日',
    dateTo: '終了日',
    maxScale: '最大震度',
    magnitude: 'マグニチュード',
    allOption: 'すべて',
    scaleOverPrefix: '',
    scaleOverSuffix: '以上',
    matchedPrefix: '一致: ',
    resetFilters: '条件リセット',
    tabAll: 'すべて',
    tabQuake: '地震',
    tabEew: '速報',
    tabOther: 'その他',
    emptyArchive: 'の記録はありません',
    emptyFiltered: '該当する情報はありません',
    emptyArchiveHint: '別の日付を選択するか、リアルタイム表示に戻してください。',
    emptyFilteredHint: '別の検索条件や日付範囲をお試しください。',
    showAll: 'すべて表示に戻す',
    loadMore: 'さらに過去の履歴を読み込む（+100件）',
    loadingMore: '過去の履歴を読み込み中...',
    loadedTotalPrefix: '取得可能な履歴を読み込み済み（計 ',
    testTag: 'テスト',
    copyRowAria: 'をコピー',
  },
  detail: {
    emptyTitle: '地震情報を選択してください',
    emptyDesc: '左の一覧から地震情報を選択すると、詳細データと防災アドバイス・コピー機能が表示されます。',
    testPayloadTag: 'テスト配信データ',
    pdfDownload: 'PDFダウンロード',
    pdfGenerating: 'PDF生成中...',
    pdfDone: 'PDF出力完了',
    pdfError: 'PDF生成に失敗',
    copyQuake: '地震情報をコピー',
    copied: 'コピーしました',
    metricScaleOrType: '最大震度 / 種別',
    metricMagnitude: 'マグニチュード',
    metricDepth: '震源の深さ',
    metricTsunami: '津波の有無',
    metricIssueSerial: '報番号',
    metricDetectionType: '検出種別',
    metricSource: '発表元',
    metricRegion: '地方 / 地域名',
    mapTitle: '震源地図',
    mapVicinity: '震源周辺',
    mapNational: '全国',
    mapNoCoordsOverlay: '震源座標なし（日本全国を表示中）',
    mapNoCoordsFooter: '座標データなし',
    mapNearby: '近隣：',
    mapLatPrefix: '北緯',
    mapLonPrefix: '東経',
    copyPreviewTitle: 'コピー用フォーマットプレビュー',
    copyTextBtn: 'テキストをコピー',
    chartEmpty: 'この情報には震度分布の地点データが含まれていません。',
    chartUnitPoints: '地点',
    chartUnitAreas: '地域',
    chartTotalPrefix: '合計',
    chartTitle551: '震度別 観測地点分布',
    chartTitle556: '緊急地震速報 予測震度別 対象地域数',
    chartTitleDefault: '震度別 観測地点分布',
    pointsHeading: '各地の震度（観測地点）',
    eewAreasHeading: '緊急地震速報 対象地域・予測震度',
    tsunamiAreasHeading: '津波予報 対象沿岸地域',
    adviceHeading: '地震規模に応じた防災チップ',
    adviceMindsetTitle: '避難の心構え',
    adviceStockpileTitle: '防災備蓄のアドバイス',
    adviceDisclaimer: '※状況により危険は異なります。自治体・気象庁の公式指示に従ってください。',
  },
  calendar: {
    weekdays: ['日', '月', '火', '水', '木', '金', '土'],
    loadingMonth: '月間履歴を確認中...',
    scale12: '震度1-2',
    scale34: '3-4',
    scale5Plus: '5弱+',
    todayBtn: '今日を取得',
    realtimeBtn: 'リアルタイム',
  },
  settings: {
    title: 'システム設定',
    subtitle: '表示言語、表示モード（ダーク／ライト）、カラーテーマ、通知およびデータ取得動作を設定できます。設定は自動で保存されます。',
    resetAppearance: '外観を初期設定に戻す',
    languageTitle: '表示言語 / Language',
    languageDesc: 'インターフェース全体・地震情報タイトル・防災チップの表示言語を切り替えます。',
    languageCurrent: '選択中の言語:',
    modeTitle: '外観モード（ダーク／ライト切り替え）',
    modeDesc: 'ON で夜間や常時監視に適したダークモード、OFF で昼間の視認性に優れたライトモードに切り替わります。',
    modeOnLabel: 'ダークモード ON',
    modeOffLabel: 'ダークモード OFF（ライト）',
    colorTitle: 'カラーテーマ選択（ダーク・ライト両対応）',
    colorDesc: 'ボタンをクリックして全体のアクセントカラーおよび背景トーンを切り替えます。各テーマはダークモード・ライトモードのどちらでも高い視認性を保つように調整されています。',
    colorCurrent: '選択中:',
    colorApplied: '適用中',
    colorSelect: '選択',
    previewLabel: '現在の配色プレビュー',
    previewModeDark: 'ダーク',
    previewModeLight: 'ライト',
    previewSampleQuake: '東京湾 / 深さ 約40km',
    previewTabState: '選択タブ状態',
    previewActionBtn: 'アクションボタン',
    opsTitle: '通知・警報音・データ更新設定',
    pushTitle: '緊急地震速報 ブラウザプッシュ通知',
    pushDesc: '緊急地震速報（発表検出・警報・取消）の受信時にデスクトップ／ブラウザ通知を送信します。',
    soundTitle: '緊急地震速報 警報音',
    soundDesc: '速報発報時のWeb Audioチャイム再生を切り替えます。',
    pollingTitle: '地震情報 自動更新ポーリング',
    pollingDesc: 'WebSocketに加えて定期的に最新地震情報を自動取得します。',
  },
  testModal: {
    title: '緊急地震速報 テスト送信',
    desc: '送信するシナリオを選択すると、即座に緊急地震速報を受信した状態になり、画面中央の警告表示と警報音・履歴リストへの追加を確認できます。',
    cancel: 'キャンセル',
    kantoTitle: '緊急地震速報（警報）— 首都圏想定',
    kantoSub: '震源：東京湾 · 予想最大震度 6弱程度以上',
    nankaiTitle: '緊急地震速報（警報）— 南海トラフ想定',
    nankaiSub: '震源：和歌山県南方沖 · 予想最大震度 6強程度以上',
    detectTitle: '緊急地震速報（発表検出）',
    detectSub: '速報第1報到達前の発表検出イベントをシミュレート',
    cancelTitle: '緊急地震速報（取消報）',
    cancelSub: '誤報等による緊急地震速報の取消通知をシミュレート',
  },
  eewModal: {
    cancelledTitle: '緊急地震速報（取消）',
    detectTitle: '緊急地震速報（発表検出）',
    warningTitle: '緊急地震速報（警報）',
    testBadge: 'テスト送信',
    cancelledDesc: '先ほど発表された緊急地震速報は取り消されました。最新の地震情報にご注意ください。',
    detectHeadline: '強い揺れが到達する可能性があります',
    detectDescPrefix: 'P2P地震情報ネットワークが緊急地震速報の発表を検出しました（種別：',
    hypocenterLabel: '震源地（推定）',
    analyzing: '解析中',
    predictedMaxScale: '予想最大震度',
    orHigher: '程度以上',
    targetAreas: '強い揺れに警戒が必要な地域',
    safetyNotice: '慌てず、机の下に入る・頭を守るなど、身の安全を最優先に行動してください。',
    copyAlert: '警報情報をコピー',
    closeBtn: '確認して閉じる',
  },
  weather: {
    prefectureLabel: '都道府県・気象台を選択',
    subAreaLabel: '細分区域',
    fetchedAt: 'データ取得時刻:',
    refreshBtn: '最新データ取得',
    fetchingBtn: '取得中...',
    waitBtnPrefix: '更新待機',
    specialWarningBadge: '特別警報 発令データあり',
    staleBadge: '情報期限切れ（過去データ）',
    specialWarningAction: '直ちに命を守る行動をとるとともに、気象庁公式サイト・自治体の避難情報を必ず確認してください。',
    statusOk: '正常',
    statusStale: '期限切れ',
    statusError: 'エラー',
    statusLoading: '取得中',
    publishedAt: '発表/観測:',
    officialWarningHeading: '気象庁 公式気象警報・注意報',
    modelAdvisoryHeading: '独自の気象モデル参考情報',
    modelAdvisoryNote: '※ 気象庁発表の公式警報ではありません（Open-Meteo数値予測値からの自動算出）',
    currentConditionsHeading: '現在の気象状況',
    chart24hHeading: '24時間 気温推移・降水確率',
    shortForecastHeading: '気象庁 公式短期予報',
    weeklyForecastHeading: '週間天気予報',
    overviewHeading: '都道府県別 天気・警報一覧',
    tempLabel: '気温',
    humidityLabel: '湿度',
    pressureLabel: '気圧',
    windLabel: '風速・風向',
    precipLabel: '降水量(1h)',
    popLabel: '降水確率',
    disclaimer: '※ 公式の防災情報を代替するものではありません',
  },
  footer: {
    brandLine: 'NEiN 防災 — リアルタイム地震情報・緊急地震速報・気象情報モニター',
    sourceLine: '出典：P2P地震情報 API (v2) ／ 気象庁防災情報JSON ／ Open-Meteo (CC BY 4.0) ※公式の防災情報を代替するものではありません',
  },
  errorBanner: {
    fetchErrorPrefix: '最新データの取得中にエラーが発生しました',
    retry: '再試行',
  },
};

const EN_MESSAGES: AppMessages = {
  nav: {
    quack: 'NEiN QUACK',
    quackAll: 'Latest Feed',
    quackQuake: 'Earthquakes',
    quackEew: 'EEW Alerts',
    quackOther: 'Tsunami / Reports',
    weather: 'NEiN WEATHER',
    settings: 'System Settings',
    testDispatch: 'Test Alert',
    mobileModeSwitcher: 'View Switcher',
    navAria: 'Information Categories',
  },
  toolbar: {
    wsConnected: 'Live Stream Connected',
    wsConnecting: 'Connecting Stream',
    wsReconnecting: 'Reconnecting',
    wsOffline: 'Polling Standby',
    archiveLabel: 'Archive',
    backToLatest: 'Back to Live',
    lastUpdated: 'Last Updated',
    nextAutoFetch: 'Next Poll',
    quickTestEew: 'Quick Test EEW',
    clearTests: 'Clear Tests',
    autoOn: 'Auto Poll ON',
    autoOff: 'Auto Poll OFF',
    intervalUnitSec: 's',
    soundOn: 'Chime ON',
    soundOff: 'Chime OFF',
    notifyOn: 'Push ON',
    notifyOff: 'Push OFF',
    refreshNow: 'Refresh Now',
    refreshing: 'Refreshing...',
  },
  list: {
    historyHeading: 'Earthquake & Disaster Feed',
    archiveHeadingPrefix: 'Archive: ',
    itemsShownSuffix: ' items',
    pickDate: 'Pick Date',
    changeDate: 'Change Date',
    archiveBanner: 'Viewing Archive (JMA Quake / Tsunami)',
    backToRealtime: 'Back to Live',
    searchPlaceholder: 'Search epicenter, prefecture, city, or region',
    clearSearchAria: 'Clear search query',
    dateFrom: 'Start Date',
    dateTo: 'End Date',
    maxScale: 'Max Intensity',
    magnitude: 'Magnitude',
    allOption: 'All',
    scaleOverPrefix: '',
    scaleOverSuffix: '+',
    matchedPrefix: 'Matched: ',
    resetFilters: 'Reset Filters',
    tabAll: 'All',
    tabQuake: 'Quake',
    tabEew: 'EEW',
    tabOther: 'Other',
    emptyArchive: ' — No records found',
    emptyFiltered: 'No matching records found',
    emptyArchiveHint: 'Choose another date or return to the live feed.',
    emptyFilteredHint: 'Try adjusting your search keywords or date/scale filters.',
    showAll: 'Show All',
    loadMore: 'Load Older History (+100)',
    loadingMore: 'Loading older records...',
    loadedTotalPrefix: 'Loaded all available history (Total ',
    testTag: 'TEST',
    copyRowAria: 'Copy ',
  },
  detail: {
    emptyTitle: 'Select an earthquake record',
    emptyDesc: 'Choose a record from the list to inspect detailed seismic data, preparedness tips, and copy tools.',
    testPayloadTag: 'Test Simulation',
    pdfDownload: 'Download PDF',
    pdfGenerating: 'Generating PDF...',
    pdfDone: 'PDF Saved',
    pdfError: 'PDF Failed',
    copyQuake: 'Copy Summary',
    copied: 'Copied',
    metricScaleOrType: 'Max Scale / Type',
    metricMagnitude: 'Magnitude',
    metricDepth: 'Depth',
    metricTsunami: 'Tsunami Risk',
    metricIssueSerial: 'Report No.',
    metricDetectionType: 'Detection Type',
    metricSource: 'Issued By',
    metricRegion: 'Region Name',
    mapTitle: 'Epicenter Map',
    mapVicinity: 'Vicinity',
    mapNational: 'Japan',
    mapNoCoordsOverlay: 'No hypocenter coordinates (Showing Japan)',
    mapNoCoordsFooter: 'No coordinate data',
    mapNearby: 'Nearby:',
    mapLatPrefix: 'Lat',
    mapLonPrefix: 'Lon',
    copyPreviewTitle: 'Formatted Copy Preview',
    copyTextBtn: 'Copy Text',
    chartEmpty: 'No station intensity distribution data is attached to this record.',
    chartUnitPoints: 'stations',
    chartUnitAreas: 'areas',
    chartTotalPrefix: 'Total',
    chartTitle551: 'Station Count by Seismic Intensity',
    chartTitle556: 'EEW Target Areas by Predicted Intensity',
    chartTitleDefault: 'Intensity Distribution',
    pointsHeading: 'Observed Intensities by Station',
    eewAreasHeading: 'EEW Target Areas & Predicted Intensity',
    tsunamiAreasHeading: 'Tsunami Forecast Coastal Areas',
    adviceHeading: 'Scale-Based Preparedness & Stockpile Tips',
    adviceMindsetTitle: 'Evacuation Mindset & Actions',
    adviceStockpileTitle: 'Emergency Stockpile Advice',
    adviceDisclaimer: 'Always follow official instructions from JMA and local authorities.',
  },
  calendar: {
    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    loadingMonth: 'Checking monthly archive...',
    scale12: 'Scale 1-2',
    scale34: '3-4',
    scale5Plus: '5L+',
    todayBtn: 'Today',
    realtimeBtn: 'Live Feed',
  },
  settings: {
    title: 'System Settings',
    subtitle: 'Configure display language, appearance mode (Dark / Light), dual-mode color theme, notifications, and polling behavior. Changes are saved automatically.',
    resetAppearance: 'Reset Appearance',
    languageTitle: 'Language / 表示言語',
    languageDesc: 'Switch the UI language for navigation, seismic telemetry labels, and preparedness tips.',
    languageCurrent: 'Active Language:',
    modeTitle: 'Appearance Mode (Dark / Light Switch)',
    modeDesc: 'Turn ON for low-glare night monitoring (Dark Mode) or OFF for crisp daylight readability (Light Mode).',
    modeOnLabel: 'Dark Mode ON',
    modeOffLabel: 'Dark Mode OFF (Light)',
    colorTitle: 'Color Theme (Dark & Light Compatible)',
    colorDesc: 'Select a color theme button to update accent colors and surface tones with high contrast in both modes.',
    colorCurrent: 'Selected:',
    colorApplied: 'Active',
    colorSelect: 'Select',
    previewLabel: 'Live Palette Preview',
    previewModeDark: 'Dark',
    previewModeLight: 'Light',
    previewSampleQuake: 'Tokyo Bay / Depth ~40km',
    previewTabState: 'Active Tab',
    previewActionBtn: 'Primary Action',
    opsTitle: 'Notifications, Chime & Polling',
    pushTitle: 'EEW Browser Push Notifications',
    pushDesc: 'Send desktop/browser notifications when an Earthquake Early Warning arrives.',
    soundTitle: 'EEW Alert Chime',
    soundDesc: 'Toggle Web Audio alert chime playback on incoming EEW warnings.',
    pollingTitle: 'Auto Refresh Polling',
    pollingDesc: 'Periodically fetch latest earthquake history in addition to the WebSocket stream.',
  },
  testModal: {
    title: 'Send Test EEW Alert',
    desc: 'Select a test scenario to immediately simulate an Earthquake Early Warning modal, chime, and feed entry.',
    cancel: 'Cancel',
    kantoTitle: 'EEW Warning — Tokyo Metropolitan Scenario',
    kantoSub: 'Epicenter: Tokyo Bay · Est. Max Intensity 6-Lower+',
    nankaiTitle: 'EEW Warning — Nankai Trough Scenario',
    nankaiSub: 'Epicenter: Off Wakayama · Est. Max Intensity 6-Upper+',
    detectTitle: 'EEW Detection Event',
    detectSub: 'Simulates initial EEW detection before Report #1',
    cancelTitle: 'EEW Cancellation Notice',
    cancelSub: 'Simulates a false-alarm cancellation notice',
  },
  eewModal: {
    cancelledTitle: 'EEW Cancelled',
    detectTitle: 'EEW Detected',
    warningTitle: 'Earthquake Early Warning',
    testBadge: 'TEST',
    cancelledDesc: 'The previously issued Earthquake Early Warning has been cancelled.',
    detectHeadline: 'Strong shaking may arrive shortly',
    detectDescPrefix: 'P2PQuake detected an EEW broadcast (Type: ',
    hypocenterLabel: 'Estimated Epicenter',
    analyzing: 'Analyzing',
    predictedMaxScale: 'Predicted Max Intensity',
    orHigher: 'or higher',
    targetAreas: 'Areas Expecting Strong Shaking',
    safetyNotice: 'Stay calm, take cover under a sturdy desk, and protect your head immediately.',
    copyAlert: 'Copy Alert',
    closeBtn: 'Acknowledge & Close',
  },
  weather: {
    prefectureLabel: 'Prefecture / Observatory',
    subAreaLabel: 'Sub-Region',
    fetchedAt: 'Fetched At:',
    refreshBtn: 'Refresh Weather',
    fetchingBtn: 'Fetching...',
    waitBtnPrefix: 'Cooldown',
    specialWarningBadge: 'SPECIAL WARNING ACTIVE',
    staleBadge: 'Expired Data',
    specialWarningAction: 'Take life-saving action immediately and check official JMA / municipal evacuation orders.',
    statusOk: 'OK',
    statusStale: 'Stale',
    statusError: 'Error',
    statusLoading: 'Loading',
    publishedAt: 'Issued/Obs:',
    officialWarningHeading: 'JMA Official Weather Warnings & Advisories',
    modelAdvisoryHeading: 'Numerical Model Reference',
    modelAdvisoryNote: '* Not an official JMA warning (auto-derived from Open-Meteo forecast model)',
    currentConditionsHeading: 'Current Weather Conditions',
    chart24hHeading: '24-Hour Temperature & Precipitation Chance',
    shortForecastHeading: 'JMA Official Short-Term Forecast',
    weeklyForecastHeading: 'Weekly Forecast',
    overviewHeading: 'Prefecture Weather & Warnings Overview',
    tempLabel: 'Temperature',
    humidityLabel: 'Humidity',
    pressureLabel: 'Pressure',
    windLabel: 'Wind Speed & Dir',
    precipLabel: 'Precip (1h)',
    popLabel: 'Precip Chance',
    disclaimer: '* Does not replace official disaster prevention advisories.',
  },
  footer: {
    brandLine: 'NEiN Disaster Intelligence — Real-Time Quake, EEW & Weather Monitor',
    sourceLine: 'Sources: P2PQuake API (v2) / JMA Bosai JSON / Open-Meteo (CC BY 4.0) * Not a substitute for official alerts',
  },
  errorBanner: {
    fetchErrorPrefix: 'Error fetching latest earthquake feed',
    retry: 'Retry',
  },
};

const ZH_MESSAGES: AppMessages = {
  nav: {
    quack: 'NEiN QUACK',
    quackAll: '最新动态',
    quackQuake: '地震信息',
    quackEew: '紧急地震速报',
    quackOther: '海啸与体感',
    weather: 'NEiN WEATHER',
    settings: '系统设置',
    testDispatch: '测试发送',
    mobileModeSwitcher: '视图切换',
    navAria: '信息分类',
  },
  toolbar: {
    wsConnected: '实时连接中',
    wsConnecting: '正在连接实时流',
    wsReconnecting: '正在重连',
    wsOffline: '轮询待机',
    archiveLabel: '历史存档',
    backToLatest: '返回实时',
    lastUpdated: '最后更新',
    nextAutoFetch: '下次自动获取',
    quickTestEew: '即时测试预警',
    clearTests: '清除测试',
    autoOn: '自动更新 ON',
    autoOff: '自动更新 OFF',
    intervalUnitSec: '秒',
    soundOn: '警报音 ON',
    soundOff: '警报音 OFF',
    notifyOn: '通知 ON',
    notifyOff: '通知 OFF',
    refreshNow: '立即刷新',
    refreshing: '刷新中...',
  },
  list: {
    historyHeading: '地震与防灾历史记录',
    archiveHeadingPrefix: '历史存档：',
    itemsShownSuffix: '条显示',
    pickDate: '选择日期',
    changeDate: '更改日期',
    archiveBanner: '正在浏览存档（气象厅地震・海啸）',
    backToRealtime: '返回实时',
    searchPlaceholder: '搜索震中、都道府县、市区町村或地区名',
    clearSearchAria: '清除搜索关键字',
    dateFrom: '开始日期',
    dateTo: '结束日期',
    maxScale: '最大震度',
    magnitude: '震级 (M)',
    allOption: '全部',
    scaleOverPrefix: '',
    scaleOverSuffix: '以上',
    matchedPrefix: '匹配: ',
    resetFilters: '重置条件',
    tabAll: '全部',
    tabQuake: '地震',
    tabEew: '速报',
    tabOther: '其他',
    emptyArchive: ' 无记录',
    emptyFiltered: '未找到符合条件的记录',
    emptyArchiveHint: '请选择其他日期或返回实时列表。',
    emptyFilteredHint: '请尝试更换关键词、日期或震度筛选条件。',
    showAll: '显示全部',
    loadMore: '加载更早历史记录 (+100条)',
    loadingMore: '正在加载历史记录...',
    loadedTotalPrefix: '已加载全部可用记录（共 ',
    testTag: '测试',
    copyRowAria: '复制 ',
  },
  detail: {
    emptyTitle: '请选择一条地震信息',
    emptyDesc: '从左侧列表选择地震信息后，将显示详细数据、防灾建议与一键复制功能。',
    testPayloadTag: '测试演练数据',
    pdfDownload: '下载 PDF 报告',
    pdfGenerating: '生成 PDF 中...',
    pdfDone: 'PDF 已导出',
    pdfError: 'PDF 导出失败',
    copyQuake: '复制地震信息',
    copied: '已复制',
    metricScaleOrType: '最大震度 / 类型',
    metricMagnitude: '震级',
    metricDepth: '震源深度',
    metricTsunami: '海啸风险',
    metricIssueSerial: '报数',
    metricDetectionType: '检测类型',
    metricSource: '发布机构',
    metricRegion: '地区 / 地方名',
    mapTitle: '震中地图',
    mapVicinity: '震中周边',
    mapNational: '日本全国',
    mapNoCoordsOverlay: '无震源坐标（显示日本全国）',
    mapNoCoordsFooter: '暂无坐标数据',
    mapNearby: '邻近城市：',
    mapLatPrefix: '北纬',
    mapLonPrefix: '东经',
    copyPreviewTitle: '复制文本预览',
    copyTextBtn: '复制文本',
    chartEmpty: '此记录未包含观测站震度分布数据。',
    chartUnitPoints: '站点',
    chartUnitAreas: '地区',
    chartTotalPrefix: '总计',
    chartTitle551: '各震度观测站数量分布',
    chartTitle556: '紧急地震速报 预计震度区域分布',
    chartTitleDefault: '震度分布图',
    pointsHeading: '各地观测站震度',
    eewAreasHeading: '紧急地震速报 目标地区与预计震度',
    tsunamiAreasHeading: '海啸预报 沿岸目标地区',
    adviceHeading: '按地震规模定制的防灾提示',
    adviceMindsetTitle: '避险行动与心理准备',
    adviceStockpileTitle: '应急物资储备建议',
    adviceDisclaimer: '※ 请务必遵循日本气象厅及当地政府发布的官方避难指令。',
  },
  calendar: {
    weekdays: ['日', '一', '二', '三', '四', '五', '六'],
    loadingMonth: '正在读取月度记录...',
    scale12: '震度1-2',
    scale34: '3-4',
    scale5Plus: '5弱+',
    todayBtn: '获取今日',
    realtimeBtn: '实时模式',
  },
  settings: {
    title: '系统设置',
    subtitle: '可切换显示语言、深色／浅色外观模式、双模式配色主题、推送通知与轮询参数。设置将自动保存。',
    resetAppearance: '恢复默认外观',
    languageTitle: '显示语言 / Language',
    languageDesc: '切换全局界面、地震信息标题及防灾提示的语言显示。',
    languageCurrent: '当前语言:',
    modeTitle: '外观模式（深色／浅色切换）',
    modeDesc: '开启适合夜间全天候监控的深色模式，关闭则切换为日间高对比度浅色模式。',
    modeOnLabel: '深色模式 ON',
    modeOffLabel: '深色模式 OFF（浅色）',
    colorTitle: '配色主题选择（兼容深色与浅色）',
    colorDesc: '点击主题按钮切换全局强调色与背景色调，所有主题均针对深浅双模式优化可读性。',
    colorCurrent: '当前选择:',
    colorApplied: '使用中',
    colorSelect: '选择',
    previewLabel: '当前配色预览',
    previewModeDark: '深色',
    previewModeLight: '浅色',
    previewSampleQuake: '东京湾 / 深度约40km',
    previewTabState: '选中标签状态',
    previewActionBtn: '主要操作按钮',
    opsTitle: '通知・警报音・自动刷新设置',
    pushTitle: '紧急地震速报 浏览器推送通知',
    pushDesc: '收到紧急地震速报（检测・警报・取消）时发送桌面/浏览器通知。',
    soundTitle: '紧急地震速报 警报音',
    soundDesc: '切换速报触发时的 Web Audio 警报提示音。',
    pollingTitle: '地震信息 自动轮询刷新',
    pollingDesc: '除 WebSocket 实时推送外，定时拉取最新地震信息。',
  },
  testModal: {
    title: '紧急地震速报 测试发送',
    desc: '选择演练场景即可立即模拟紧急地震速报弹窗、警报音与列表记录。',
    cancel: '取消',
    kantoTitle: '紧急地震速报（警报）— 首都圈假设',
    kantoSub: '震中：东京湾 · 预计最大震度 6弱以上',
    nankaiTitle: '紧急地震速报（警报）— 南海海槽假设',
    nankaiSub: '震中：和歌山县南方海域 · 预计最大震度 6强以上',
    detectTitle: '紧急地震速报（发布检测）',
    detectSub: '模拟第1报到达前的速报检测事件',
    cancelTitle: '紧急地震速报（取消报）',
    cancelSub: '模拟误报等情况下的紧急地震速报取消通知',
  },
  eewModal: {
    cancelledTitle: '紧急地震速报（取消）',
    detectTitle: '紧急地震速报（发布检测）',
    warningTitle: '紧急地震速报（警报）',
    testBadge: '测试演练',
    cancelledDesc: '此前发布的紧急地震速报已取消，请留意后续地震信息。',
    detectHeadline: '强震波可能即将到达',
    detectDescPrefix: 'P2P地震信息网络检测到紧急地震速报发布（类型：',
    hypocenterLabel: '预估震中',
    analyzing: '解析中',
    predictedMaxScale: '预计最大震度',
    orHigher: '左右或以上',
    targetAreas: '需警惕强震的地区',
    safetyNotice: '请保持冷静，立即躲在坚固桌下并保护头部，确保自身安全。',
    copyAlert: '复制警报信息',
    closeBtn: '确认并关闭',
  },
  weather: {
    prefectureLabel: '选择都道府县 / 气象台',
    subAreaLabel: '细分区域',
    fetchedAt: '数据获取时间:',
    refreshBtn: '获取最新数据',
    fetchingBtn: '获取中...',
    waitBtnPrefix: '冷却中',
    specialWarningBadge: '已发布特别警报',
    staleBadge: '数据已过期',
    specialWarningAction: '请立即采取保全生命的避险行动，并查看气象厅及地方政府的官方避难指示。',
    statusOk: '正常',
    statusStale: '已过期',
    statusError: '错误',
    statusLoading: '获取中',
    publishedAt: '发布/观测:',
    officialWarningHeading: '日本气象厅 官方气象警报・注意报',
    modelAdvisoryHeading: '气象数值模型参考信息',
    modelAdvisoryNote: '※ 非气象厅官方警报（根据 Open-Meteo 数值预测自动生成）',
    currentConditionsHeading: '当前气象实况',
    chart24hHeading: '24小时气温变化与降水概率',
    shortForecastHeading: '气象厅 官方短期预报',
    weeklyForecastHeading: '一周天气预报',
    overviewHeading: '各都道府县天气与警报一览',
    tempLabel: '气温',
    humidityLabel: '湿度',
    pressureLabel: '气压',
    windLabel: '风速・风向',
    precipLabel: '降水量(1h)',
    popLabel: '降水概率',
    disclaimer: '※ 本系统不替代官方防灾预警信息。',
  },
  footer: {
    brandLine: 'NEiN 防灾 — 实时地震信息・紧急地震速报・气象监测平台',
    sourceLine: '数据来源：P2P地震信息 API (v2) ／ 日本气象厅JSON ／ Open-Meteo (CC BY 4.0) ※不替代官方防灾信息',
  },
  errorBanner: {
    fetchErrorPrefix: '获取最新数据时发生错误',
    retry: '重试',
  },
};

const KO_MESSAGES: AppMessages = {
  nav: {
    quack: 'NEiN QUACK',
    quackAll: '최신 이력',
    quackQuake: '지진 정보',
    quackEew: '긴급지진속보',
    quackOther: '쓰나미・체감',
    weather: 'NEiN WEATHER',
    settings: '시스템 설정',
    testDispatch: '테스트 발송',
    mobileModeSwitcher: '화면 전환',
    navAria: '정보 카테고리',
  },
  toolbar: {
    wsConnected: '실시간 수신 중',
    wsConnecting: '실시간 연결 중',
    wsReconnecting: '재연결 중',
    wsOffline: '폴링 대기',
    archiveLabel: '아카이브',
    backToLatest: '최신으로',
    lastUpdated: '최근 업데이트',
    nextAutoFetch: '다음 자동 갱신',
    quickTestEew: '즉시 테스트 발보',
    clearTests: '테스트 삭제',
    autoOn: '자동 갱신 ON',
    autoOff: '자동 갱신 OFF',
    intervalUnitSec: '초',
    soundOn: '경보음 ON',
    soundOff: '경보음 OFF',
    notifyOn: '알림 ON',
    notifyOff: '알림 OFF',
    refreshNow: '지금 갱신',
    refreshing: '갱신 중...',
  },
  list: {
    historyHeading: '지진・방재 이력 (최신・과거)',
    archiveHeadingPrefix: '과거 기록: ',
    itemsShownSuffix: '건 표시',
    pickDate: '날짜 지정',
    changeDate: '날짜 변경',
    archiveBanner: '아카이브 열람 중 (JMA 지진・쓰나미)',
    backToRealtime: '실시간으로 복귀',
    searchPlaceholder: '진원지・도도부현・시구정촌・지방명 검색',
    clearSearchAria: '검색어 지우기',
    dateFrom: '시작일',
    dateTo: '종료일',
    maxScale: '최대 진도',
    magnitude: '규모 (M)',
    allOption: '전체',
    scaleOverPrefix: '',
    scaleOverSuffix: ' 이상',
    matchedPrefix: '일치: ',
    resetFilters: '필터 초기화',
    tabAll: '전체',
    tabQuake: '지진',
    tabEew: '속보',
    tabOther: '기타',
    emptyArchive: ' 기록이 없습니다',
    emptyFiltered: '일치하는 정보가 없습니다',
    emptyArchiveHint: '다른 날짜를 선택하거나 실시간 보기로 돌아가세요.',
    emptyFilteredHint: '검색어나 날짜・진도 조건을 변경해 보세요.',
    showAll: '전체 표시',
    loadMore: '과거 이력 더 불러오기 (+100건)',
    loadingMore: '과거 이력 불러오는 중...',
    loadedTotalPrefix: '불러온 전체 이력 (총 ',
    testTag: '테스트',
    copyRowAria: '복사 ',
  },
  detail: {
    emptyTitle: '지진 정보를 선택하세요',
    emptyDesc: '왼쪽 목록에서 항목을 선택하면 상세 데이터, 규모별 방재 팁, 복사 기능이 표시됩니다.',
    testPayloadTag: '테스트 발신 데이터',
    pdfDownload: 'PDF 다운로드',
    pdfGenerating: 'PDF 생성 중...',
    pdfDone: 'PDF 저장 완료',
    pdfError: 'PDF 생성 실패',
    copyQuake: '지진 정보 복사',
    copied: '복사 완료',
    metricScaleOrType: '최대 진도 / 구분',
    metricMagnitude: '규모',
    metricDepth: '진원 깊이',
    metricTsunami: '쓰나미 여부',
    metricIssueSerial: '발표 회차',
    metricDetectionType: '감지 유형',
    metricSource: '발표 기관',
    metricRegion: '지방 / 지역명',
    mapTitle: '진원 지도',
    mapVicinity: '진원 주변',
    mapNational: '전국',
    mapNoCoordsOverlay: '진원 좌표 없음 (일본 전국 표시)',
    mapNoCoordsFooter: '좌표 데이터 없음',
    mapNearby: '인근:',
    mapLatPrefix: '북위',
    mapLonPrefix: '동경',
    copyPreviewTitle: '복사용 텍스트 미리보기',
    copyTextBtn: '텍스트 복사',
    chartEmpty: '이 정보에는 관측 지점 진도 분포 데이터가 없습니다.',
    chartUnitPoints: '지점',
    chartUnitAreas: '지역',
    chartTotalPrefix: '합계',
    chartTitle551: '진도별 관측 지점 분포',
    chartTitle556: '긴급지진속보 예상 진도별 대상 지역 수',
    chartTitleDefault: '진도 분포 차트',
    pointsHeading: '각지 진도 (관측 지점)',
    eewAreasHeading: '긴급지진속보 대상 지역・예상 진도',
    tsunamiAreasHeading: '쓰나미 예보 대상 연안 지역',
    adviceHeading: '지진 규모별 방재 팁 (대피・비축)',
    adviceMindsetTitle: '대피 마음가짐 및 행동 요령',
    adviceStockpileTitle: '방재 비축품 조언',
    adviceDisclaimer: '※ 실제 상황에서는 일본 기상청 및 지자체의 공식 대피 안내를 우선 따르세요.',
  },
  calendar: {
    weekdays: ['일', '월', '화', '수', '목', '금', '토'],
    loadingMonth: '월간 이력 확인 중...',
    scale12: '진도1-2',
    scale34: '3-4',
    scale5Plus: '5약+',
    todayBtn: '오늘 조회',
    realtimeBtn: '실시간',
  },
  settings: {
    title: '시스템 설정',
    subtitle: '표시 언어, 화면 모드(다크/라이트), 컬러 테마, 알림 및 자동 갱신 동작을 설정합니다. 설정은 자동 저장됩니다.',
    resetAppearance: '외관 초기화',
    languageTitle: '표시 언어 / Language',
    languageDesc: '전체 UI, 지진 정보 제목 및 규모별 방재 팁의 언어를 전환합니다.',
    languageCurrent: '선택된 언어:',
    modeTitle: '화면 모드 (다크 / 라이트 전환)',
    modeDesc: 'ON 시 야간 감시에 적합한 다크 모드, OFF 시 주간 시인성이 뛰어난 라이트 모드로 전환됩니다.',
    modeOnLabel: '다크 모드 ON',
    modeOffLabel: '다크 모드 OFF (라이트)',
    colorTitle: '컬러 테마 선택 (다크・라이트 모두 지원)',
    colorDesc: '버튼을 눌러 전체 포인트 컬러와 배경 톤을 변경합니다. 모든 테마는 다크/라이트 양쪽에서 높은 대비를 유지합니다.',
    colorCurrent: '선택 중:',
    colorApplied: '적용 중',
    colorSelect: '선택',
    previewLabel: '현재 배색 미리보기',
    previewModeDark: '다크',
    previewModeLight: '라이트',
    previewSampleQuake: '도쿄만 / 깊이 약 40km',
    previewTabState: '선택 탭 상태',
    previewActionBtn: '주요 버튼',
    opsTitle: '알림・경보음・데이터 갱신 설정',
    pushTitle: '긴급지진속보 브라우저 푸시 알림',
    pushDesc: '긴급지진속보(감지・경보・취소) 수신 시 데스크톱/브라우저 알림을 보냅니다.',
    soundTitle: '긴급지진속보 경보음',
    soundDesc: '속보 발보 시 Web Audio 경보음 재생 여부를 전환합니다.',
    pollingTitle: '지진 정보 자동 갱신 폴링',
    pollingDesc: 'WebSocket 실시간 스트림과 함께 주기적으로 최신 지진 정보를 가져옵니다.',
  },
  testModal: {
    title: '긴급지진속보 테스트 발송',
    desc: '시나리오를 선택하면 즉시 긴급지진속보 수신 상태를 시뮬레이션하여 경고 창, 경보음, 목록 추가를 확인할 수 있습니다.',
    cancel: '취소',
    kantoTitle: '긴급지진속보 (경보) — 수도권 가정',
    kantoSub: '진원: 도쿄만 · 예상 최대 진도 6약 이상',
    nankaiTitle: '긴급지진속보 (경보) — 난카이 트로프 가정',
    nankaiSub: '진원: 와카야마현 남쪽 해역 · 예상 최대 진도 6강 이상',
    detectTitle: '긴급지진속보 (발표 감지)',
    detectSub: '제1보 도달 전의 발표 감지 이벤트 시뮬레이션',
    cancelTitle: '긴급지진속보 (취소보)',
    cancelSub: '오보 등에 의한 긴급지진속보 취소 알림 시뮬레이션',
  },
  eewModal: {
    cancelledTitle: '긴급지진속보 (취소)',
    detectTitle: '긴급지진속보 (발표 감지)',
    warningTitle: '긴급지진속보 (경보)',
    testBadge: '테스트 발송',
    cancelledDesc: '방금 발표된 긴급지진속보는 취소되었습니다. 최신 지진 정보에 유의하세요.',
    detectHeadline: '강한 흔들림이 도달할 가능성이 있습니다',
    detectDescPrefix: 'P2P지진정보 네트워크가 긴급지진속보 발표를 감지했습니다 (유형: ',
    hypocenterLabel: '예상 진원지',
    analyzing: '분석 중',
    predictedMaxScale: '예상 최대 진도',
    orHigher: '이상',
    targetAreas: '강한 흔들림 경계 지역',
    safetyNotice: '당황하지 말고 튼튼한 책상 아래로 들어가 머리를 보호하는 등 안전을 최우선으로 행동하세요.',
    copyAlert: '경보 정보 복사',
    closeBtn: '확인 및 닫기',
  },
  weather: {
    prefectureLabel: '도도부현・기상대 선택',
    subAreaLabel: '세부 구역',
    fetchedAt: '데이터 수신 시각:',
    refreshBtn: '최신 데이터 조회',
    fetchingBtn: '수신 중...',
    waitBtnPrefix: '대기',
    specialWarningBadge: '특별경보 발령 데이터 있음',
    staleBadge: '정보 만료 (과거 데이터)',
    specialWarningAction: '즉시 생명을 지키는 행동을 취하고 일본 기상청 및 지자체의 공식 대피 정보를 확인하세요.',
    statusOk: '정상',
    statusStale: '만료됨',
    statusError: '오류',
    statusLoading: '조회 중',
    publishedAt: '발표/관측:',
    officialWarningHeading: '일본 기상청 공식 기상 경보・주의보',
    modelAdvisoryHeading: '기상 수치 모델 참고 정보',
    modelAdvisoryNote: '※ 기상청 공식 경보가 아닙니다 (Open-Meteo 예측 모델 자동 산출)',
    currentConditionsHeading: '현재 기상 실황',
    chart24hHeading: '24시간 기온 추이 및 강수 확률',
    shortForecastHeading: '기상청 공식 단기 예보',
    weeklyForecastHeading: '주간 날씨 예보',
    overviewHeading: '도도부현별 날씨・경보 일람',
    tempLabel: '기온',
    humidityLabel: '습도',
    pressureLabel: '기압',
    windLabel: '풍속・풍향',
    precipLabel: '강수량(1h)',
    popLabel: '강수 확률',
    disclaimer: '※ 공식 방재 정보를 대체하지 않습니다.',
  },
  footer: {
    brandLine: 'NEiN 방재 — 실시간 지진 정보・긴급지진속보・기상 모니터',
    sourceLine: '출처: P2P지진정보 API (v2) / 기상청 방재JSON / Open-Meteo (CC BY 4.0) ※공식 방재 정보를 대체하지 않습니다',
  },
  errorBanner: {
    fetchErrorPrefix: '최신 데이터를 가져오는 중 오류가 발생했습니다',
    retry: '재시도',
  },
};

export const MESSAGES: Record<AppLanguage, AppMessages> = {
  ja: JA_MESSAGES,
  en: EN_MESSAGES,
  zh: ZH_MESSAGES,
  ko: KO_MESSAGES,
};

export function getMessages(lang: AppLanguage): AppMessages {
  return MESSAGES[lang] ?? JA_MESSAGES;
}
