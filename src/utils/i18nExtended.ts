import type {
  DashboardCardId,
  FeedHealthStatus,
  MapLayerId,
  NotificationCategoryKey,
} from '../types/disaster';
import type { AppLanguage } from './i18n';

export interface ExtendedMessages {
  extNav: {
    dashboard: string;
    weatherMenu: string;
    weatherForecast: string;
    radarSatellite: string;
    typhoonMarine: string;
    hazardsFlood: string;
    volcano: string;
    environment: string;
    integratedMap: string;
    systemMenu: string;
    timeline: string;
    systemStatus: string;
    settings: string;
    quackExtended: string;
    tsunamiMonitor: string;
  };
  statusLabels: Record<FeedHealthStatus, string>;
  common: {
    officialBadge: string;
    modelRefBadge: string;
    rawJapaneseBtn: string;
    hideRawBtn: string;
    openOfficialSite: string;
    viewDetails: string;
    refresh: string;
    refreshing: string;
    loading: string;
    noData: string;
    unsupportedTitle: string;
    sourceAttribution: string;
    publishedTime: string;
    fetchedTime: string;
    latency: string;
    interval: string;
    cacheHit: string;
    cacheMiss: string;
    disclaimerBanner: string;
    translationNotice: string;
    testSimulationWarning: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    customizeBtn: string;
    doneCustomizeBtn: string;
    resetLayoutBtn: string;
    moveUp: string;
    moveDown: string;
    toggleSize: string;
    toggleVisible: string;
    urgentBannerTitle: string;
    noUrgentBanner: string;
    cards: Record<DashboardCardId, string>;
  };
  map: {
    title: string;
    subtitle: string;
    baseStyleLabel: string;
    baseStd: string;
    basePale: string;
    layersHeading: string;
    legendHeading: string;
    regionJumpLabel: string;
    fullscreenEnter: string;
    fullscreenExit: string;
    resetLayers: string;
    playbackTitle: string;
    play: string;
    pause: string;
    speed: string;
    opacity: string;
    shelterZoomHint: string;
    layerLabels: Record<MapLayerId, string>;
    typhoonCircleNote: string;
  };
  quakeExt: {
    subViewP2P: string;
    subViewJmaQuake: string;
    subViewTsunami: string;
    jmaTitle: string;
    jmaSubtitle: string;
    filterAll: string;
    filterDomestic: string;
    filterDistant: string;
    filterLongPeriod: string;
    filterSpecial: string;
    nankaiTag: string;
    sanrikuTag: string;
    distantTag: string;
    longPeriodTag: string;
    correctedTag: string;
    cancelledTag: string;
    tsunamiTitle: string;
    tsunamiSubtitle: string;
    tsunamiMajorWarning: string;
    tsunamiWarning: string;
    tsunamiWatch: string;
    tsunamiForecast: string;
    tsunamiLifted: string;
    arrivalTime: string;
    expectedHeight: string;
    observedHeight: string;
    coastalAreas: string;
    observationsHeading: string;
    noObservations: string;
  };
  radar: {
    title: string;
    subtitle: string;
    tabHrpns: string;
    tabRasrf: string;
    tabLightning: string;
    tabTornado: string;
    tabSatellite: string;
    tabWeatherMap: string;
    satBandIr: string;
    satBandTrueColor: string;
    wmapNow: string;
    wmapFt24: string;
    wmapFt48: string;
    wmapNear: string;
    wmapAsia: string;
    legendRain: string;
    legendLightning: string;
  };
  typhoon: {
    title: string;
    subtitle: string;
    activeListHeading: string;
    noActiveTitle: string;
    noActiveDesc: string;
    expiredNotice: string;
    typhoonNumber: string;
    pressure: string;
    maxWind: string;
    maxGust: string;
    movement: string;
    stormRadius: string;
    galeRadius: string;
    forecastCircleDisclaimer: string;
    marineHeading: string;
    waveHeight: string;
    wavePeriod: string;
    waveDirection: string;
    seaSurfaceTemp: string;
    oceanCurrent: string;
    seaBulletinsHeading: string;
  };
  hazards: {
    title: string;
    subtitle: string;
    kikikuruHeading: string;
    kikikuruLand: string;
    kikikuruInund: string;
    kikikuruFlood: string;
    alertLevelsTitle: string;
    evacuationVsWeatherNote: string;
    mlitUnsupportedTitle: string;
    mlitUnsupportedDesc: string;
    bulletinsHeading: string;
    noActiveBulletins: string;
  };
  volcano: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    totalCount: string;
    activeBulletinsHeading: string;
    volcanoListHeading: string;
    alertLevel: string;
    coordinates: string;
    ashfallNote: string;
  };
  environment: {
    title: string;
    subtitle: string;
    moeUnsupportedTitle: string;
    moeUnsupportedDesc: string;
    uvLabel: string;
    pm25Label: string;
    pm10Label: string;
    dustLabel: string;
    aqiLabel: string;
    apparentTempLabel: string;
    visibilityLabel: string;
    gustLabel: string;
    snowDepthLabel: string;
    sunshineLabel: string;
    weatherBulletinsHeading: string;
  };
  timeline: {
    title: string;
    subtitle: string;
    allCategories: string;
    empty: string;
  };
  statusPanel: {
    title: string;
    subtitle: string;
    recheckAll: string;
    noSafeFallbackWarning: string;
    colSource: string;
    colStatus: string;
    colPublished: string;
    colFetched: string;
    colInterval: string;
    colLatency: string;
  };
  regions: {
    title: string;
    subtitle: string;
    addRegion: string;
    geolocateBtn: string;
    geolocatePermissionNote: string;
    geolocateDenied: string;
    empty: string;
    moveUp: string;
    moveDown: string;
    remove: string;
    openWeather: string;
  };
  notifyExt: {
    title: string;
    subtitle: string;
    categoriesLabel: string;
    minScaleLabel: string;
    warningFilterLabel: string;
    volumeLabel: string;
    testChimeBtn: string;
    inAppLabel: string;
    historyTitle: string;
    clearHistory: string;
    emptyHistory: string;
    deliveryCaveat: string;
    categories: Record<NotificationCategoryKey, string>;
  };
}

const JA_EXT: ExtendedMessages = {
  extNav: {
    dashboard: '総合ダッシュボード',
    weatherMenu: 'NEiN WEATHER',
    weatherForecast: '天気予報・気象警報・アメダス',
    radarSatellite: '気象レーダー・衛星・天気図',
    typhoonMarine: '台風・海洋気象',
    hazardsFlood: 'キキクル・土砂・河川洪水',
    volcano: '火山情報・噴火・降灰',
    environment: '熱中症参考・黄砂・紫外線・全般気象',
    integratedMap: '全国防災マップ',
    systemMenu: '監視・設定',
    timeline: '防災情報タイムライン',
    systemStatus: 'システムステータス',
    settings: 'システム設定・地域登録',
    quackExtended: 'JMA地震・南海トラフ詳細',
    tsunamiMonitor: '津波情報モニター',
  },
  statusLabels: {
    normal: '正常',
    connecting: '接続中',
    updating: '更新中',
    delayed: '遅延',
    disconnected: '接続切断',
    fetch_failed: 'データ取得失敗',
    unfetched: '情報未取得',
    unsupported: '取得未対応',
    maintenance: 'メンテナンス',
    expired: '情報の有効期限切れ',
  },
  common: {
    officialBadge: '公的機関発表',
    modelRefBadge: 'モデル参考値',
    rawJapaneseBtn: '発表原文(日本語)を確認',
    hideRawBtn: '原文を閉じる',
    openOfficialSite: '公式サイトで確認',
    viewDetails: '詳細を見る',
    refresh: '再取得',
    refreshing: '更新中...',
    loading: '読み込み中...',
    noData: '情報なし',
    unsupportedTitle: '静的環境CORS・API制約により自動取得未対応',
    sourceAttribution: '出典・帰属',
    publishedTime: '発表時刻',
    fetchedTime: '取得時刻',
    latency: '通信遅延',
    interval: '更新間隔',
    cacheHit: 'キャッシュ利用',
    cacheMiss: '新規取得',
    disclaimerBanner: 'NEiNは公的防災情報の閲覧を補助するシステムであり、気象庁・自治体等の公式警報・避難指示に代わるものではありません。',
    translationNotice: '外国語表示にはシステム内翻訳およびJMA公式英語名を含みます。意味の確認には「発表原文」をご参照ください。',
    testSimulationWarning: '【訓練・テスト配信】実際の災害情報ではありません。',
  },
  dashboard: {
    title: '総合気象防災ダッシュボード',
    subtitle: '日本全国の地震・津波・気象警報・レーダー・台風・火山・河川土砂危険度を一元監視します。',
    customizeBtn: 'カード配置を編集',
    doneCustomizeBtn: '編集を完了',
    resetLayoutBtn: '初期配置に戻す',
    moveUp: '上へ',
    moveDown: '下へ',
    toggleSize: '幅切替',
    toggleVisible: '表示/非表示',
    urgentBannerTitle: '緊急・重要防災情報（優先表示）',
    noUrgentBanner: '現在、確認された緊急地震速報・津波警報・特別警報はありません（未取得のソースはステータス画面でご確認ください）。',
    cards: {
      urgent_alerts: '重要・緊急アラート概要',
      latest_quake: '最新地震情報 (NEiN QUACK)',
      tsunami_status: '発表中の津波情報',
      weather_warnings: '選択地域の気象警報・注意報',
      registered_regions: '登録地域の天気・警報一覧',
      radar_preview: '全国雨雲レーダー (高解像度ナウキャスト)',
      typhoon_status: '台風・熱帯低気圧状況',
      volcano_status: '全国の火山活動状況',
      landslide_flood: '大雨・土砂災害・指定河川洪水情報',
      heat_environment: '紫外線・PM2.5・黄砂・熱中症参考',
      timeline_preview: '最新防災情報タイムライン',
      api_health: 'API接続ステータス概要',
    },
  },
  map: {
    title: '全国統合防災マップ',
    subtitle: '地理院タイル・気象庁高解像度レーダー・キキクル・震源・火山・避難場所を重ねて監視できます。',
    baseStyleLabel: '背景地図',
    baseStd: '地理院 標準',
    basePale: '地理院 淡色',
    layersHeading: '表示レイヤー・透過度',
    legendHeading: '凡例',
    regionJumpLabel: '地域へ移動',
    fullscreenEnter: '全画面表示',
    fullscreenExit: '全画面解除',
    resetLayers: 'レイヤー初期化',
    playbackTitle: '時系列再生 (過去〜予測)',
    play: '再生',
    pause: '一時停止',
    speed: '速度',
    opacity: '透過度',
    shelterZoomHint: '※ 指定緊急避難場所レイヤーは地図を拡大（Zoom 11以上）すると自動取得・表示されます。',
    layerLabels: {
      quake_epicenters: '地震震源位置 (P2P/JMA)',
      quake_intensity: '最大震度ラベル',
      tsunami_areas: '津波警報・注意報・予報対象',
      weather_warnings: '気象警報・注意報 (観測拠点)',
      rain_radar: '高解像度降水ナウキャスト (雨雲)',
      precip_forecast: '降水短時間予報',
      lightning_nowcast: '雷ナウキャスト',
      tornado_nowcast: '竜巻発生確度ナウキャスト',
      himawari_sat: '気象衛星ひまわり (赤外 B13)',
      typhoon_track: '台風進路・予報円',
      amedas_stations: 'アメダス気温・観測点',
      kikikuru_landslide: 'キキクル (土砂災害危険度)',
      kikikuru_inundation: 'キキクル (浸水害危険度)',
      kikikuru_flood: 'キキクル (洪水害危険度)',
      gsi_flood_hazard: '国土地理院 洪水浸水想定区域',
      volcanoes: '全国の火山位置 (120火山)',
      evacuation_shelters: '国土地理院 指定緊急避難場所',
    },
    typhoonCircleNote: '※ 予報円は台風の中心が入る確率70%の範囲であり、暴風域や被害範囲そのものではありません。',
  },
  quakeExt: {
    subViewP2P: 'P2P地震・速報履歴',
    subViewJmaQuake: '気象庁 公式地震電文（遠地・長周期・南海トラフ）',
    subViewTsunami: '津波情報・到達時刻・観測詳細',
    jmaTitle: '気象庁 公式地震・特別情報モニター',
    jmaSubtitle: '国内地震・遠地地震・長周期地震動・南海トラフ地震臨時情報・北海道・三陸沖後発地震注意情報・訂正/取消を確認します。',
    filterAll: 'すべて',
    filterDomestic: '国内震源・震度',
    filterDistant: '遠地地震',
    filterLongPeriod: '長周期地震動',
    filterSpecial: '南海トラフ・後発地震',
    nankaiTag: '南海トラフ関連',
    sanrikuTag: '北海道・三陸沖後発地震',
    distantTag: '遠地地震',
    longPeriodTag: '長周期地震動',
    correctedTag: '訂正',
    cancelledTag: '取消',
    tsunamiTitle: '津波警報・注意報・予報・観測モニター',
    tsunamiSubtitle: '気象庁津波JSONに基づき、大津波警報・津波警報・注意報・到達予想時刻・予想高さ・観測情報を表示します。',
    tsunamiMajorWarning: '大津波警報',
    tsunamiWarning: '津波警報',
    tsunamiWatch: '津波注意報',
    tsunamiForecast: '津波予報（若干の海面変動）',
    tsunamiLifted: '津波情報 解除',
    arrivalTime: '到達予想時刻 / 状況',
    expectedHeight: '予想される津波の高さ',
    observedHeight: '観測値',
    coastalAreas: '対象津波予報区（沿岸地域）',
    observationsHeading: '津波観測・沖合観測情報',
    noObservations: '現在、当該電文に津波観測地点データは含まれていません。',
  },
  radar: {
    title: '気象レーダー・気象衛星・天気図',
    subtitle: '気象庁公式タイルの時系列再生・速度変更・一時停止・時刻指定・全画面表示に対応しています。',
    tabHrpns: '高解像度降水ナウキャスト',
    tabRasrf: '降水短時間予報',
    tabLightning: '雷ナウキャスト',
    tabTornado: '竜巻発生確度',
    tabSatellite: '気象衛星ひまわり',
    tabWeatherMap: '地上天気図・予想天気図',
    satBandIr: '赤外画像 (B13/TBB)',
    satBandTrueColor: 'トゥルーカラー再現',
    wmapNow: '実況天気図',
    wmapFt24: '24時間予想',
    wmapFt48: '48時間予想',
    wmapNear: '日本周辺',
    wmapAsia: 'アジア太平洋',
    legendRain: '降水強度凡例: 水色(弱) → 青 → 黄 → 橙 → 赤 → 紫(猛烈な雨 80mm/h以上)',
    legendLightning: '活動度凡例: 活動度1(雷の可能性) 〜 活動度4(激しい落雷)',
  },
  typhoon: {
    title: '台風・熱帯低気圧・海洋気象情報',
    subtitle: '気象庁の台風発表情報と、海上警報・予報・Open-Meteo海洋モデル値を確認できます。',
    activeListHeading: '発表中の台風・熱帯低気圧',
    noActiveTitle: '現在、日本の監視域で発表中の有効な台風情報はありません',
    noActiveDesc: '気象庁 typhoon.json / JMAXML に有効な台風電文が存在しないため、台風データは表示していません（オフシーズン等）。',
    expiredNotice: '※ 過去の履歴レコードです（最新発表から24時間以上経過）。現在進行中の台風と誤認しないでください。',
    typhoonNumber: '台風番号',
    pressure: '中心気圧',
    maxWind: '最大風速',
    maxGust: '最大瞬間風速',
    movement: '進行方向・速度',
    stormRadius: '暴風域',
    galeRadius: '強風域',
    forecastCircleDisclaimer: '予報円は台風中心が入る確率70%の範囲です。円の大きさが台風や暴風・被害の範囲を示すものではありません。',
    marineHeading: '選択地点の海洋気象（モデル予測値）＆ 海上警報',
    waveHeight: '有義波高',
    wavePeriod: '波周期',
    waveDirection: '波向',
    seaSurfaceTemp: '海面水温 (SST)',
    oceanCurrent: '海流速度・流向',
    seaBulletinsHeading: '気象庁 地方海上警報・地方海上予報 (JMAXML)',
  },
  hazards: {
    title: '大雨・洪水・土砂災害（キキクル）情報',
    subtitle: '気象庁キキクル（土砂・浸水・洪水危険度）および災害関連気象情報と警戒レベル対応表を表示します。',
    kikikuruHeading: '気象庁 キキクル（危険度分布リアルタイムタイル）',
    kikikuruLand: '土砂災害危険度',
    kikikuruInund: '浸水害危険度',
    kikikuruFlood: '洪水害危険度',
    alertLevelsTitle: '警戒レベルと防災情報・避難行動の区別',
    evacuationVsWeatherNote: '重要：気象庁の警報・キキクル（レベル3・4相当）は気象上の危険度目安であり、実際の「高齢者等避難」「避難指示」「緊急安全確保」は市区町村（自治体）が発令します。',
    mlitUnsupportedTitle: '国土交通省 リアルタイム河川水位・ダム観測値API：ブラウザ直接取得未対応',
    mlitUnsupportedDesc: '「川の防災情報」の観測所別リアルタイム水位・ダム数値APIは静的クライアント（CORS制約）から直接取得できないため、ダミー値は表示しません。公式ポータルより直接ご確認ください。',
    bulletinsHeading: '気象庁 土砂災害警戒情報・記録的短時間大雨・指定河川洪水予報 (JMAXML)',
    noActiveBulletins: '現在、JMAXMLフィード直近分に該当する緊急の土砂・記録的大雨・洪水電文はありません。',
  },
  volcano: {
    title: '火山情報・噴火警戒・降灰予報',
    subtitle: '気象庁登録の全国120火山と、JMAXML地震火山フィードの噴火速報・噴火警報・解説・降灰予報を表示します。',
    searchPlaceholder: '火山名・コードで検索（例：桜島、富士山、阿蘇山）',
    totalCount: '登録火山数',
    activeBulletinsHeading: '直近の火山関連電文（噴火警報・解説・降灰予報）',
    volcanoListHeading: '全国火山一覧・座標',
    alertLevel: '噴火警戒レベル / 発表状況',
    coordinates: '位置座標',
    ashfallNote: '降灰予報および噴火速報の詳細は公式の気象庁「火山情報」ページもあわせてご確認ください。',
  },
  environment: {
    title: '熱中症参考・黄砂・紫外線・全般気象情報',
    subtitle: '紫外線(UV)・PM2.5・黄砂予測・大気汚染指数(Open-Meteo)と気象庁全般・地方気象情報・異常天候情報を表示します。',
    moeUnsupportedTitle: '環境省 熱中症警戒アラート／特別警戒アラート公式CSV：CORS制限により自動取得未対応',
    moeUnsupportedDesc: '環境省予防情報サイトのCSV配信はCORSヘッダを返さないため、静的Web版では直接取得できません。「警戒アラートなし」と誤認せず、公式ページをご確認ください。',
    uvLabel: 'UV指数 (モデル)',
    pm25Label: 'PM2.5',
    pm10Label: 'PM10',
    dustLabel: '黄砂・ダスト濃度',
    aqiLabel: '欧州大気質指数 (AQI)',
    apparentTempLabel: '体感温度 (暑熱参考)',
    visibilityLabel: '視程 (モデル)',
    gustLabel: '最大瞬間風速',
    snowDepthLabel: '積雪深 / 1h降雪',
    sunshineLabel: '日照時間 (1h)',
    weatherBulletinsHeading: '早期注意情報・全般気象情報・地方気象情報・季節予報・竜巻注意情報 (JMAXML)',
  },
  timeline: {
    title: '防災情報統合タイムライン',
    subtitle: 'P2P地震情報・気象庁地震/津波・気象庁XML（火山・台風・警報・土砂・海上・全般）を時系列で統合表示します。',
    allCategories: 'すべて表示',
    empty: 'タイムラインに表示するイベントがありません。',
  },
  statusPanel: {
    title: 'システムステータス・API接続監視',
    subtitle: '各情報提供元の通信状態・発表時刻・取得時刻・遅延・キャッシュ状況および取得未対応理由を厳密に管理します。',
    recheckAll: '全ソース状態を再確認',
    noSafeFallbackWarning: '安全原則：データ取得失敗・接続切断・取得未対応の状態を「警報なし」「異常なし」として表示することは一切ありません。',
    colSource: '情報ソース / 提供元',
    colStatus: '接続・鮮度ステータス',
    colPublished: '情報発表時刻',
    colFetched: '最終取得時刻',
    colInterval: '更新間隔',
    colLatency: '通信遅延',
  },
  regions: {
    title: '登録地域（マイエリア）管理',
    subtitle: '監視したい都道府県・気象観測地域を複数登録・並び替えできます。',
    addRegion: '選択地域を登録に追加',
    geolocateBtn: '現在地から最寄りの気象台を取得（許可制）',
    geolocatePermissionNote: '位置情報はブラウザの明示的許可を得た上で端末内で最寄り観測拠点の判定にのみ使用し、無断で外部へ送信しません。',
    geolocateDenied: '位置情報の取得が許可されなかったか、利用できませんでした。',
    empty: '登録地域がまだありません。',
    moveUp: '上へ',
    moveDown: '下へ',
    remove: '削除',
    openWeather: '天気を表示',
  },
  notifyExt: {
    title: '防災通知システム詳細設定',
    subtitle: '情報種別ごとの通知ON/OFF・最低震度・音量・通知履歴を設定できます（既存設定は保持されます）。',
    categoriesLabel: '通知対象の災害種別',
    minScaleLabel: '地震通知の最低震度',
    warningFilterLabel: '気象警報の通知対象レベル',
    volumeLabel: '警報チャイム音量',
    testChimeBtn: '音量テスト（訓練音）',
    inAppLabel: '画面内トースト通知を表示',
    historyTitle: '最近の通知履歴',
    clearHistory: '履歴をクリア',
    emptyHistory: 'まだ通知履歴はありません。',
    deliveryCaveat: '注意：OSやブラウザの省電力機能・権限設定・タブ状態により、バックグラウンド通知が遅延または届かない場合があり、到達を保証するものではありません。',
    categories: {
      quake: '地震情報',
      eew: '緊急地震速報',
      tsunami: '津波情報',
      weather_warning: '気象警報・特別警報',
      typhoon: '台風情報',
      landslide_flood: '土砂災害・洪水情報',
      volcano: '火山情報',
      heatstroke: '環境・緊急気象注意',
    },
  },
};

const EN_EXT: ExtendedMessages = {
  extNav: {
    dashboard: 'Dashboard',
    weatherMenu: 'NEiN WEATHER',
    weatherForecast: 'Forecast, Warnings & AMeDAS',
    radarSatellite: 'Radar, Satellite & Charts',
    typhoonMarine: 'Typhoons & Marine',
    hazardsFlood: 'Kikikuru, Landslide & Flood',
    volcano: 'Volcanoes & Ashfall',
    environment: 'Heat Ref, Dust, UV & Bulletins',
    integratedMap: 'Disaster Map',
    systemMenu: 'Monitor & Settings',
    timeline: 'Disaster Timeline',
    systemStatus: 'System Status',
    settings: 'Settings & Regions',
    quackExtended: 'JMA Quakes & Nankai Trough',
    tsunamiMonitor: 'Tsunami Monitor',
  },
  statusLabels: {
    normal: 'Normal',
    connecting: 'Connecting',
    updating: 'Updating',
    delayed: 'Delayed',
    disconnected: 'Disconnected',
    fetch_failed: 'Fetch Failed',
    unfetched: 'Unfetched',
    unsupported: 'Unsupported',
    maintenance: 'Maintenance',
    expired: 'Expired',
  },
  common: {
    officialBadge: 'Official Agency',
    modelRefBadge: 'Model Reference',
    rawJapaneseBtn: 'View Official Japanese Text',
    hideRawBtn: 'Hide Original Text',
    openOfficialSite: 'Official Portal',
    viewDetails: 'Open Details',
    refresh: 'Refresh',
    refreshing: 'Updating...',
    loading: 'Loading...',
    noData: 'No Active Bulletins',
    unsupportedTitle: 'Unavailable directly in static browser due to CORS/API policy',
    sourceAttribution: 'Source & Attribution',
    publishedTime: 'Issued At',
    fetchedTime: 'Fetched At',
    latency: 'Latency',
    interval: 'Interval',
    cacheHit: 'Cached',
    cacheMiss: 'Live Fetch',
    disclaimerBanner: 'NEiN assists viewing public disaster data and does NOT replace official warnings or municipal evacuation orders.',
    translationNotice: 'Translated UI includes official JMA English labels and localized summaries. Check the original Japanese text button to confirm exact wording.',
    testSimulationWarning: '[TEST / DRILL] Not a real disaster event.',
  },
  dashboard: {
    title: 'Integrated Meteorological & Disaster Dashboard',
    subtitle: 'Monitor nationwide earthquakes, tsunamis, weather warnings, radar, typhoons, volcanoes, and Kikikuru risk in one hub.',
    customizeBtn: 'Customize Cards',
    doneCustomizeBtn: 'Done Editing',
    resetLayoutBtn: 'Reset Layout',
    moveUp: 'Up',
    moveDown: 'Down',
    toggleSize: 'Width',
    toggleVisible: 'Show/Hide',
    urgentBannerTitle: 'Priority Emergency & Hazard Status',
    noUrgentBanner: 'No active EEW, Tsunami Warning, or JMA Special Warning in loaded feeds (verify feed health in System Status).',
    cards: {
      urgent_alerts: 'Priority Emergency Summary',
      latest_quake: 'Latest Earthquake (NEiN QUACK)',
      tsunami_status: 'Active Tsunami Bulletins',
      weather_warnings: 'Selected Region Warnings',
      registered_regions: 'Registered Regions Overview',
      radar_preview: 'Nationwide Rain Radar Preview',
      typhoon_status: 'Typhoon & Tropical Cyclones',
      volcano_status: 'Volcanic Activity',
      landslide_flood: 'Heavy Rain, Landslide & Flood Risk',
      heat_environment: 'UV, PM2.5, Dust & Heat Reference',
      timeline_preview: 'Latest Disaster Timeline',
      api_health: 'API Health Summary',
    },
  },
  map: {
    title: 'National Integrated Disaster Map',
    subtitle: 'Overlay GSI basemaps with JMA rain radar, lightning, tornado, Kikikuru risk, epicenters, volcanoes, and shelters.',
    baseStyleLabel: 'Basemap',
    baseStd: 'GSI Standard',
    basePale: 'GSI Pale',
    layersHeading: 'Layers & Opacity',
    legendHeading: 'Legend',
    regionJumpLabel: 'Jump to Region',
    fullscreenEnter: 'Fullscreen',
    fullscreenExit: 'Exit Fullscreen',
    resetLayers: 'Reset Layers',
    playbackTitle: 'Time-Series Playback',
    play: 'Play',
    pause: 'Pause',
    speed: 'Speed',
    opacity: 'Opacity',
    shelterZoomHint: 'GSI Evacuation Shelters automatically load when zoomed to level 11+.',
    layerLabels: {
      quake_epicenters: 'Earthquake Epicenters',
      quake_intensity: 'Max Seismic Intensity Labels',
      tsunami_areas: 'Tsunami Coastal Forecast Areas',
      weather_warnings: 'Weather Warnings (Offices)',
      rain_radar: 'High-Res Rain Nowcast',
      precip_forecast: 'Short-Range Rain Forecast',
      lightning_nowcast: 'Lightning Nowcast',
      tornado_nowcast: 'Tornado Probability Nowcast',
      himawari_sat: 'Himawari Satellite (IR B13)',
      typhoon_track: 'Typhoon Track & Forecast Circle',
      amedas_stations: 'AMeDAS Observations',
      kikikuru_landslide: 'Kikikuru (Landslide Risk)',
      kikikuru_inundation: 'Kikikuru (Inundation Risk)',
      kikikuru_flood: 'Kikikuru (Flood Risk)',
      gsi_flood_hazard: 'GSI Flood Inundation Hazard',
      volcanoes: 'Active Volcanoes (120)',
      evacuation_shelters: 'GSI Emergency Shelters',
    },
    typhoonCircleNote: 'Note: The forecast circle indicates the 70% probability area for the cyclone center, NOT the storm wind or damage footprint.',
  },
  quakeExt: {
    subViewP2P: 'P2P Quake & EEW Feed',
    subViewJmaQuake: 'JMA Official Quake & Nankai Trough',
    subViewTsunami: 'Tsunami Monitor & Arrivals',
    jmaTitle: 'JMA Official Earthquake & Special Bulletins',
    jmaSubtitle: 'Inspect domestic quakes, distant earthquakes, long-period ground motion, Nankai Trough advisories, and corrections/cancellations.',
    filterAll: 'All',
    filterDomestic: 'Domestic',
    filterDistant: 'Distant',
    filterLongPeriod: 'Long-Period',
    filterSpecial: 'Nankai / Sanriku',
    nankaiTag: 'Nankai Trough',
    sanrikuTag: 'Hokkaido-Sanriku',
    distantTag: 'Distant Quake',
    longPeriodTag: 'Long-Period Motion',
    correctedTag: 'Corrected',
    cancelledTag: 'Cancelled',
    tsunamiTitle: 'Tsunami Warning, Watch, Forecast & Observation Monitor',
    tsunamiSubtitle: 'Displays JMA tsunami severity grades, coastal target regions, expected arrival times, heights, and coastal/offshore gauges.',
    tsunamiMajorWarning: 'Major Tsunami Warning',
    tsunamiWarning: 'Tsunami Warning',
    tsunamiWatch: 'Tsunami Advisory',
    tsunamiForecast: 'Tsunami Forecast (Slight Sea Level Change)',
    tsunamiLifted: 'Tsunami Alert Lifted',
    arrivalTime: 'Est. Arrival / Status',
    expectedHeight: 'Expected Height',
    observedHeight: 'Observed',
    coastalAreas: 'Target Coastal Forecast Regions',
    observationsHeading: 'Coastal & Offshore Tsunami Observations',
    noObservations: 'No coastal tsunami gauge observations are attached to this bulletin.',
  },
  radar: {
    title: 'Weather Radar, Satellite & Surface Charts',
    subtitle: 'Official JMA tile playback with frame scrubbing, speed control, pause, legend, and fullscreen mode.',
    tabHrpns: 'Precipitation Nowcast',
    tabRasrf: 'Short-Range Precip',
    tabLightning: 'Lightning Nowcast',
    tabTornado: 'Tornado Nowcast',
    tabSatellite: 'Himawari Satellite',
    tabWeatherMap: 'Surface & Forecast Charts',
    satBandIr: 'Infrared (B13/TBB)',
    satBandTrueColor: 'True Color Reproduction',
    wmapNow: 'Surface Analysis',
    wmapFt24: '24h Forecast',
    wmapFt48: '48h Forecast',
    wmapNear: 'Japan Region',
    wmapAsia: 'Asia-Pacific',
    legendRain: 'Rain Legend: Cyan (Light) -> Blue -> Yellow -> Orange -> Red -> Purple (80mm/h+)',
    legendLightning: 'Lightning Legend: Level 1 (Possible) to Level 4 (Severe Strikes)',
  },
  typhoon: {
    title: 'Typhoon, Cyclone & Marine Weather',
    subtitle: 'Official JMA typhoon feeds, JMAXML sea warnings/forecasts, and Open-Meteo Marine coastal parameters.',
    activeListHeading: 'Active Typhoons & Tropical Depressions',
    noActiveTitle: 'No active valid typhoons currently issued for Japan region',
    noActiveDesc: 'JMA typhoon.json / JMAXML currently lists no active cyclone bulletin (or off-season). No synthetic tracks are generated.',
    expiredNotice: 'Archived record (>24h old). Do not interpret as a currently active storm.',
    typhoonNumber: 'Number',
    pressure: 'Center Pressure',
    maxWind: 'Max Wind',
    maxGust: 'Max Gust',
    movement: 'Movement',
    stormRadius: 'Storm Wind Radius',
    galeRadius: 'Gale Wind Radius',
    forecastCircleDisclaimer: 'The forecast circle marks the 70% probability zone for the storm center, not the physical extent of damaging winds.',
    marineHeading: 'Marine Conditions (Model Reference) & JMA Sea Bulletins',
    waveHeight: 'Wave Height',
    wavePeriod: 'Wave Period',
    waveDirection: 'Wave Direction',
    seaSurfaceTemp: 'Sea Surface Temp',
    oceanCurrent: 'Ocean Current',
    seaBulletinsHeading: 'JMA Regional Sea Warnings & Forecasts (JMAXML)',
  },
  hazards: {
    title: 'Heavy Rain, Flood & Landslide Risk (Kikikuru)',
    subtitle: 'Real-time JMA Kikikuru risk maps, JMAXML hazard bulletins, and Alert Level 1–5 correspondence.',
    kikikuruHeading: 'JMA Kikikuru Real-Time Hazard Distribution',
    kikikuruLand: 'Landslide Risk',
    kikikuruInund: 'Inundation Risk',
    kikikuruFlood: 'Flood Risk',
    alertLevelsTitle: 'Alert Levels (1–5) & Agency Distinction',
    evacuationVsWeatherNote: 'Important: JMA warnings & Kikikuru levels describe meteorological risk; municipal governments issue Evacuation Orders (Levels 3–5).',
    mlitUnsupportedTitle: 'MLIT Real-Time River Gauge & Dam Telemetry API: Direct Browser Fetch Unsupported',
    mlitUnsupportedDesc: 'MLIT river.go.jp real-time gauge JSON APIs are unavailable for direct cross-origin static browser requests. Check the official portal directly.',
    bulletinsHeading: 'Landslide Warnings, Record Rain & River Flood Bulletins (JMAXML)',
    noActiveBulletins: 'No urgent landslide, record rainfall, or flood bulletins in current JMAXML feed window.',
  },
  volcano: {
    title: 'Volcano Activity, Eruption & Ashfall Information',
    subtitle: 'All 120 JMA-monitored volcanoes paired with live JMAXML eruption alerts, forecasts, and ashfall advisories.',
    searchPlaceholder: 'Search volcano name or code (e.g. Sakurajima, Fuji, Aso)',
    totalCount: 'Registered Volcanoes',
    activeBulletinsHeading: 'Recent Volcano Bulletins (Eruption / Ashfall)',
    volcanoListHeading: 'National Volcano Directory',
    alertLevel: 'Alert Level / Latest Bulletin',
    coordinates: 'Coordinates',
    ashfallNote: 'Always verify eruption rapid alerts and ashfall exclusion zones on the official JMA Volcano portal.',
  },
  environment: {
    title: 'Heat Stress Ref, Dust (Kosa), UV & Bulletins',
    subtitle: 'Open-Meteo Air Quality (UV, PM2.5, Dust) & AMeDAS snow/sunshine alongside JMA Early Warning & General Bulletins.',
    moeUnsupportedTitle: 'MOE Official Heatstroke Alert CSV: CORS Restricted in Static Browser',
    moeUnsupportedDesc: 'The Ministry of Environment WBGT CSV lacks CORS headers for static web clients. Do not assume "No Alert" — check the official MOE site.',
    uvLabel: 'UV Index (Model)',
    pm25Label: 'PM2.5',
    pm10Label: 'PM10',
    dustLabel: 'Dust / Yellow Sand',
    aqiLabel: 'European AQI',
    apparentTempLabel: 'Apparent Temp (Ref)',
    visibilityLabel: 'Visibility (Model)',
    gustLabel: 'Max Gust',
    snowDepthLabel: 'Snow Depth / 1h',
    sunshineLabel: 'Sunshine (1h)',
    weatherBulletinsHeading: 'Early Warnings, General/Regional Weather & Seasonal Info (JMAXML)',
  },
  timeline: {
    title: 'Unified Disaster Information Timeline',
    subtitle: 'Chronological stream aggregating P2PQuake, JMA Quake/Tsunami, and JMAXML Weather/Volcano/Typhoon/Hazard alerts.',
    allCategories: 'All Events',
    empty: 'No timeline events loaded yet.',
  },
  statusPanel: {
    title: 'System Status & API Health Monitor',
    subtitle: 'Tracks exact connection status, issued timestamps, fetch timestamps, latency, caching, and unsupported sources.',
    recheckAll: 'Recheck All Sources',
    noSafeFallbackWarning: 'Safety Guarantee: Failed, disconnected, or unsupported feeds are NEVER reported as "No Warnings" or "Safe".',
    colSource: 'Data Source / Provider',
    colStatus: 'Status',
    colPublished: 'Issued At',
    colFetched: 'Fetched At',
    colInterval: 'Interval',
    colLatency: 'Latency',
  },
  regions: {
    title: 'Registered Regions (Watchlist)',
    subtitle: 'Save, prioritize, and monitor multiple prefectures/observatories.',
    addRegion: 'Add Selected Region',
    geolocateBtn: 'Detect Nearest Observatory (Opt-In)',
    geolocatePermissionNote: 'Location requires explicit permission and is used strictly locally to match the nearest observatory—never transmitted silently.',
    geolocateDenied: 'Geolocation permission was denied or unavailable.',
    empty: 'No regions registered yet.',
    moveUp: 'Move Up',
    moveDown: 'Move Down',
    remove: 'Remove',
    openWeather: 'View Weather',
  },
  notifyExt: {
    title: 'Disaster Notification Preferences',
    subtitle: 'Configure category toggles, minimum seismic intensity, alert chime volume, and notification logs (preserves existing toggle).',
    categoriesLabel: 'Enabled Alert Categories',
    minScaleLabel: 'Minimum Earthquake Intensity',
    warningFilterLabel: 'Weather Warning Threshold',
    volumeLabel: 'Alert Chime Volume',
    testChimeBtn: 'Test Chime (Drill)',
    inAppLabel: 'Show In-App Alert Toasts',
    historyTitle: 'Recent Notification Log',
    clearHistory: 'Clear Log',
    emptyHistory: 'No notifications recorded yet.',
    deliveryCaveat: 'Caveat: OS power saving, browser permissions, and background suspension can delay or block notifications; delivery cannot be guaranteed.',
    categories: {
      quake: 'Earthquakes',
      eew: 'EEW Alerts',
      tsunami: 'Tsunami',
      weather_warning: 'Weather Warnings',
      typhoon: 'Typhoons',
      landslide_flood: 'Landslide & Flood',
      volcano: 'Volcanoes',
      heatstroke: 'Env & Special Alerts',
    },
  },
};

const ZH_EXT: ExtendedMessages = {
  extNav: {
    dashboard: '综合仪表盘',
    weatherMenu: 'NEiN WEATHER',
    weatherForecast: '天气预报・气象警报・AMeDAS',
    radarSatellite: '气象雷达・卫星・天气图',
    typhoonMarine: '台风・海洋气象',
    hazardsFlood: 'Kikikuru・滑坡・河川洪水',
    volcano: '火山・喷发・降灰',
    environment: '中暑参考・沙尘・紫外线・概览',
    integratedMap: '全国防灾地图',
    systemMenu: '监控与设置',
    timeline: '防灾信息时间线',
    systemStatus: '系统状态监控',
    settings: '系统设置・地区管理',
    quackExtended: '气象厅地震・南海海槽',
    tsunamiMonitor: '海啸详情监控',
  },
  statusLabels: {
    normal: '正常',
    connecting: '连接中',
    updating: '更新中',
    delayed: '延迟',
    disconnected: '连接断开',
    fetch_failed: '获取失败',
    unfetched: '尚未获取',
    unsupported: '暂不支持获取',
    maintenance: '维护中',
    expired: '信息已过期',
  },
  common: {
    officialBadge: '官方发布',
    modelRefBadge: '模型参考值',
    rawJapaneseBtn: '查看日文官方原文',
    hideRawBtn: '收起原文',
    openOfficialSite: '访问官方网站',
    viewDetails: '查看详情',
    refresh: '重新获取',
    refreshing: '更新中...',
    loading: '加载中...',
    noData: '暂无有效通告',
    unsupportedTitle: '受静态网页跨域(CORS)或官方API限制，无法直接获取',
    sourceAttribution: '数据来源与归属',
    publishedTime: '发布时间',
    fetchedTime: '获取时间',
    latency: '延迟',
    interval: '更新间隔',
    cacheHit: '缓存命中',
    cacheMiss: '实时拉取',
    disclaimerBanner: 'NEiN 仅辅助浏览公开防灾数据，不能替代气象厅或地方政府发布的官方警报与避难指令。',
    translationNotice: '多语言界面含官方英文及参考译文；确认准确含义请点击查看“日文官方原文”。',
    testSimulationWarning: '【演练测试】非真实灾害警报。',
  },
  dashboard: {
    title: '综合气象防灾仪表盘',
    subtitle: '集中监控日本全国地震、海啸、气象警报、雷达、台风、火山及地质洪水危险度。',
    customizeBtn: '编辑卡片布局',
    doneCustomizeBtn: '完成编辑',
    resetLayoutBtn: '恢复默认布局',
    moveUp: '上移',
    moveDown: '下移',
    toggleSize: '切换宽度',
    toggleVisible: '显示/隐藏',
    urgentBannerTitle: '紧急重要防灾状态（优先显示）',
    noUrgentBanner: '当前已获取源中未检测到紧急地震速报、海啸警报或气象特别警报（请核对系统状态页面）。',
    cards: {
      urgent_alerts: '紧急警报摘要',
      latest_quake: '最新地震信息 (NEiN QUACK)',
      tsunami_status: '当前海啸信息',
      weather_warnings: '所选地区气象警报',
      registered_regions: '已关注地区天气与警报',
      radar_preview: '全国雨云雷达预览',
      typhoon_status: '台风・热带气旋状态',
      volcano_status: '全国火山活动情况',
      landslide_flood: '暴雨・泥石流・洪水风险',
      heat_environment: '紫外线・PM2.5・沙尘・高温参考',
      timeline_preview: '最新防灾信息时间线',
      api_health: 'API 连接状态概览',
    },
  },
  map: {
    title: '全国综合防灾地图',
    subtitle: '集成国土地理院底图、气象厅降水雷达、雷电龙卷、Kikikuru危险度、震中、火山与避难场所。',
    baseStyleLabel: '地图底图',
    baseStd: '地理院 标准',
    basePale: '地理院 浅色',
    layersHeading: '图层开关与透明度',
    legendHeading: '图例',
    regionJumpLabel: '跳转至地区',
    fullscreenEnter: '全屏显示',
    fullscreenExit: '退出全屏',
    resetLayers: '重置图层',
    playbackTitle: '时间序列播放',
    play: '播放',
    pause: '暂停',
    speed: '倍速',
    opacity: '透明度',
    shelterZoomHint: '提示：放大地图至缩放级别 11 及以上时，将自动加载指定紧急避难场所。',
    layerLabels: {
      quake_epicenters: '地震震中位置',
      quake_intensity: '最大震度标注',
      tsunami_areas: '海啸预报沿岸区域',
      weather_warnings: '气象警报・注意报',
      rain_radar: '高分辨率降水雷达',
      precip_forecast: '短时降水预报',
      lightning_nowcast: '雷电临近预报',
      tornado_nowcast: '龙卷风概率预报',
      himawari_sat: '向日葵气象卫星 (红外)',
      typhoon_track: '台风路径・预报圆',
      amedas_stations: 'AMeDAS 实测站点',
      kikikuru_landslide: 'Kikikuru (泥石流滑坡风险)',
      kikikuru_inundation: 'Kikikuru (内涝浸水风险)',
      kikikuru_flood: 'Kikikuru (河川洪水风险)',
      gsi_flood_hazard: '国土地理院 洪水淹没想定',
      volcanoes: '全国活火山 (120座)',
      evacuation_shelters: '指定紧急避难场所',
    },
    typhoonCircleNote: '注：预报圆仅表示台风中心进入概率为70%的范围，并非暴风圈或受灾范围大小。',
  },
  quakeExt: {
    subViewP2P: 'P2P地震・速报记录',
    subViewJmaQuake: '气象厅地震・南海海槽专题',
    subViewTsunami: '海啸详情・到达时间监控',
    jmaTitle: '气象厅官方地震与特别信息监控',
    jmaSubtitle: '涵盖日本国内地震、远地地震、长周期地震动、南海海槽临时信息及更正/取消报文。',
    filterAll: '全部',
    filterDomestic: '国内地震',
    filterDistant: '远地地震',
    filterLongPeriod: '长周期地震动',
    filterSpecial: '南海海槽/三陆海域',
    nankaiTag: '南海海槽相关',
    sanrikuTag: '北海道・三陆后续地震',
    distantTag: '远地地震',
    longPeriodTag: '长周期地震动',
    correctedTag: '更正',
    cancelledTag: '取消',
    tsunamiTitle: '海啸警报・注意报・预报・实测监控',
    tsunamiSubtitle: '基于气象厅海啸JSON展示海啸等级、预计到达时间、波高及沿岸/近海观测值。',
    tsunamiMajorWarning: '大海啸警报',
    tsunamiWarning: '海啸警报',
    tsunamiWatch: '海啸注意报',
    tsunamiForecast: '海啸预报（轻微海面变动）',
    tsunamiLifted: '海啸信息已解除',
    arrivalTime: '预计到达时间/状态',
    expectedHeight: '预计海啸高度',
    observedHeight: '实测高度',
    coastalAreas: '海啸预报沿岸区域',
    observationsHeading: '沿岸及近海海啸实测站',
    noObservations: '当前报文中暂未附带海啸观测站数据。',
  },
  radar: {
    title: '气象雷达・向日葵卫星・天气图',
    subtitle: '支持气象厅官方瓦片图的时间轴播放、倍速调整、暂停、时刻指定与全屏模式。',
    tabHrpns: '高分辨率降水雷达',
    tabRasrf: '短时降水预报',
    tabLightning: '雷电临近预报',
    tabTornado: '龙卷发生概率',
    tabSatellite: '向日葵气象卫星',
    tabWeatherMap: '地面及预报天气图',
    satBandIr: '红外云图 (B13/TBB)',
    satBandTrueColor: '真彩色复原图',
    wmapNow: '地面实况天气图',
    wmapFt24: '24小时预报图',
    wmapFt48: '48小时预报图',
    wmapNear: '日本周边',
    wmapAsia: '亚太地区',
    legendRain: '降水强度图例：浅蓝(弱) → 蓝 → 黄 → 橙 → 红 → 紫(强降雨 80mm/h+)',
    legendLightning: '雷电活动度图例：1级(可能) ～ 4级(强雷电)',
  },
  typhoon: {
    title: '台风・热带气旋・海洋气象信息',
    subtitle: '提供气象厅台风通告、地方海上警报预报以及 Open-Meteo 海洋波浪/水温模型参数。',
    activeListHeading: '当前生效的台风・热带气旋',
    noActiveTitle: '日本周边监控域当前无生效的台风发布',
    noActiveDesc: '气象厅 typhoon.json / JMAXML 中暂无当前生效的台风报文，系统不会生成虚假路径。',
    expiredNotice: '注意：该记录发布已超过24小时（历史归档），请勿误认为当前实时台风。',
    typhoonNumber: '台风编号',
    pressure: '中心气压',
    maxWind: '最大风速',
    maxGust: '最大瞬时阵风',
    movement: '移动方向与速度',
    stormRadius: '暴风圈半径',
    galeRadius: '强风圈半径',
    forecastCircleDisclaimer: '预报圆仅代表台风中心70%概率进入的范围，切勿将其误认为暴风半径或灾害范围。',
    marineHeading: '所选地区海洋气象（模型参考）与海上警报',
    waveHeight: '有效波高',
    wavePeriod: '波浪周期',
    waveDirection: '波向',
    seaSurfaceTemp: '海面温度 (SST)',
    oceanCurrent: '海流速度・流向',
    seaBulletinsHeading: '气象厅 地方海上警报・预报 (JMAXML)',
  },
  hazards: {
    title: '暴雨・洪水・泥石流危险度 (Kikikuru)',
    subtitle: '展示气象厅 Kikikuru 实时危险度地图、JMAXML灾害通报及警戒等级对应说明。',
    kikikuruHeading: '气象厅 Kikikuru 实时危险度分布',
    kikikuruLand: '泥石流灾害危险度',
    kikikuruInund: '城市内涝危险度',
    kikikuruFlood: '河川洪水危险度',
    alertLevelsTitle: '警戒等级 (1-5) 与官方发布主体区分',
    evacuationVsWeatherNote: '重要提示：气象厅警报与 Kikikuru 仅表示气象危险度；实际避难指示（等级3-5）由市区町村地方政府发布。',
    mlitUnsupportedTitle: '国土交通省 实时河流水位与水坝API：静态浏览器暂不支持直接获取',
    mlitUnsupportedDesc: '受 CORS 限制，静态网页版无法直接读取日本国土交通省河流水位实时数值接口，请前往官方防灾门户查看。',
    bulletinsHeading: '泥石流警戒・创纪录短时强降雨・指定河川洪水预报 (JMAXML)',
    noActiveBulletins: '当前 JMAXML 数据窗口内无紧急滑坡、创纪录暴雨或洪水预报报文。',
  },
  volcano: {
    title: '火山活动・喷发预警与降灰预报',
    subtitle: '整合日本气象厅120座活火山坐标与 JMAXML 喷发警报、火山解说及降灰预报。',
    searchPlaceholder: '搜索火山名称或代码（如：樱岛、富士山、阿苏山）',
    totalCount: '已登录火山数',
    activeBulletinsHeading: '最新火山相关报文（喷发警报・解说・降灰）',
    volcanoListHeading: '全国火山名录与坐标',
    alertLevel: '喷发警戒等级 / 最新通报',
    coordinates: '地理坐标',
    ashfallNote: '降灰范围及喷发速报详情请以日本气象厅官方火山页面为准。',
  },
  environment: {
    title: '中暑参考・沙尘(黄砂)・紫外线・综合公报',
    subtitle: '提供 Open-Meteo 空气质量（UV、PM2.5、黄砂）及 AMeDAS 积雪日照与气象厅早期注意/全般信息。',
    moeUnsupportedTitle: '日本环境省 中暑警戒警报官方CSV：受CORS限制无法自动获取',
    moeUnsupportedDesc: '环境省接口未开放浏览器跨域访问，静态客户端无法直接获取；切勿误判为“无警报”，请通过官网链接核对。',
    uvLabel: 'UV 紫外线指数(模型)',
    pm25Label: 'PM2.5 浓度',
    pm10Label: 'PM10 浓度',
    dustLabel: '黄砂・扬尘浓度',
    aqiLabel: '欧洲空气质量指数',
    apparentTempLabel: '体感温度 (高温参考)',
    visibilityLabel: '能见度 (模型)',
    gustLabel: '最大瞬时阵风',
    snowDepthLabel: '积雪深度 / 1h降雪',
    sunshineLabel: '日照时间 (1h)',
    weatherBulletinsHeading: '早期注意信息・全般与地方气象信息・季节预报・龙卷注意信息 (JMAXML)',
  },
  timeline: {
    title: '综合防灾信息时间线',
    subtitle: '按时间倒序汇总 P2P地震、气象厅地震海啸以及各类气象/火山/台风/洪水XML报文。',
    allCategories: '全部显示',
    empty: '暂无时间线事件。',
  },
  statusPanel: {
    title: '系统状态与 API 连接监控',
    subtitle: '独立监控每个数据源的连接状态、发布时间、拉取时间、通信延迟、缓存状态及不支持原因。',
    recheckAll: '重新检测全部源',
    noSafeFallbackWarning: '安全原则：连接失败、断开或受限不支持的接口，绝不会被误显示为“无警报”或“安全”。',
    colSource: '数据源 / 提供方',
    colStatus: '当前状态',
    colPublished: '官方发布时间',
    colFetched: '最后获取时间',
    colInterval: '更新周期',
    colLatency: '通信延迟',
  },
  regions: {
    title: '关注地区（我的地区）管理',
    subtitle: '支持添加多个都道府县观测点并调整显示优先级。',
    addRegion: '添加当前所选地区',
    geolocateBtn: '获取当前位置最近气象台（需授权）',
    geolocatePermissionNote: '位置信息仅在您点击同意后在本地用于匹配最近的气象站，绝不擅自上传至其他服务器。',
    geolocateDenied: '未能获得定位权限或浏览器不支持定位。',
    empty: '尚未添加关注地区。',
    moveUp: '上移',
    moveDown: '下移',
    remove: '删除',
    openWeather: '查看天气',
  },
  notifyExt: {
    title: '防灾通知系统高级设置',
    subtitle: '支持按灾害类型开关通知、设定最低震度阈值、调整提示音量及查看通知记录（保留原有设置）。',
    categoriesLabel: '启用的通知类别',
    minScaleLabel: '地震通知最低震度',
    warningFilterLabel: '气象警报通知级别',
    volumeLabel: '警报提示音量',
    testChimeBtn: '音量测试（演练音）',
    inAppLabel: '显示应用内顶部弹窗提醒',
    historyTitle: '最近通知记录',
    clearHistory: '清空记录',
    emptyHistory: '暂无通知记录。',
    deliveryCaveat: '提示：受操作系统省电策略、浏览器通知权限及后台挂起限制，系统不保证通知一定实时送达。',
    categories: {
      quake: '地震信息',
      eew: '紧急地震速报',
      tsunami: '海啸信息',
      weather_warning: '气象警报',
      typhoon: '台风信息',
      landslide_flood: '滑坡与洪水',
      volcano: '火山信息',
      heatstroke: '环境与特别提醒',
    },
  },
};

const KO_EXT: ExtendedMessages = {
  extNav: {
    dashboard: '종합 대시보드',
    weatherMenu: 'NEiN WEATHER',
    weatherForecast: '날씨 예보・기상 특보・AMeDAS',
    radarSatellite: '기상 레이더・위성・일기도',
    typhoonMarine: '태풍・해양 기상',
    hazardsFlood: '키키쿠루・산사태・하천 홍수',
    volcano: '화산・분화・화산재',
    environment: '열사병 참고・황사・자외선・개황',
    integratedMap: '전국 방재 지도',
    systemMenu: '모니터링・설정',
    timeline: '방재 정보 타임라인',
    systemStatus: '시스템 상태',
    settings: '시스템 설정・관심 지역',
    quackExtended: '기상청 지진・난카이 트로프',
    tsunamiMonitor: '쓰나미 상세 모니터',
  },
  statusLabels: {
    normal: '정상',
    connecting: '연결 중',
    updating: '업데이트 중',
    delayed: '지연',
    disconnected: '연결 끊김',
    fetch_failed: '수신 실패',
    unfetched: '미수신',
    unsupported: '수신 미지원',
    maintenance: '점검 중',
    expired: '정보 유효기간 만료',
  },
  common: {
    officialBadge: '공식 기관 발표',
    modelRefBadge: '모델 참고치',
    rawJapaneseBtn: '발표 원문(일본어) 보기',
    hideRawBtn: '원문 닫기',
    openOfficialSite: '공식 사이트 확인',
    viewDetails: '상세 보기',
    refresh: '새로고침',
    refreshing: '갱신 중...',
    loading: '불러오는 중...',
    noData: '발표 정보 없음',
    unsupportedTitle: '정적 웹 환경 CORS 및 API 정책으로 자동 수신 미지원',
    sourceAttribution: '출처 및 제공',
    publishedTime: '발표 시각',
    fetchedTime: '수신 시각',
    latency: '응답 지연',
    interval: '갱신 주기',
    cacheHit: '캐시 사용',
    cacheMiss: '실시간 조회',
    disclaimerBanner: 'NEiN은 공공 방재 정보 열람을 보조하는 시스템이며, 기상청 및 지자체의 공식 특보・대피 명령을 대체하지 않습니다.',
    translationNotice: '다국어 UI에는 공식 영문 표기 및 참고 번역이 포함됩니다. 정확한 의미 확인은 "발표 원문 보기"를 확인하세요.',
    testSimulationWarning: '[훈련・테스트 발신] 실제 재난 정보가 아닙니다.',
  },
  dashboard: {
    title: '종합 기상・방재 대시보드',
    subtitle: '일본 전국 지진, 쓰나미, 기상 특보, 레이더, 태풍, 화산, 산사태/홍수 위험도를 한눈에 확인합니다.',
    customizeBtn: '카드 배치 편집',
    doneCustomizeBtn: '편집 완료',
    resetLayoutBtn: '기본 배치로 초기화',
    moveUp: '위로',
    moveDown: '아래로',
    toggleSize: '너비 전환',
    toggleVisible: '표시/숨김',
    urgentBannerTitle: '긴급・중요 방재 현황 (우선 표시)',
    noUrgentBanner: '현재 수신된 피드에서 긴급지진속보, 쓰나미 경보 또는 특별경보가 확인되지 않았습니다(시스템 상태 화면 확인).',
    cards: {
      urgent_alerts: '긴급 경보 요약',
      latest_quake: '최신 지진 정보 (NEiN QUACK)',
      tsunami_status: '발표 중인 쓰나미 정보',
      weather_warnings: '선택 지역 기상 경보・주의보',
      registered_regions: '등록 지역 날씨 및 특보',
      radar_preview: '전국 비구름 레이더 미리보기',
      typhoon_status: '태풍・열대저기압 현황',
      volcano_status: '전국 화산 활동 현황',
      landslide_flood: '호우・산사태・하천 홍수 정보',
      heat_environment: '자외선・PM2.5・황사・폭염 참고',
      timeline_preview: '최신 방재 정보 타임라인',
      api_health: 'API 연결 상태 요약',
    },
  },
  map: {
    title: '전국 통합 방재 지도',
    subtitle: '국토지리원 지도 위에 기상청 비구름 레이더, 낙뢰, 키키쿠루, 진원, 화산, 대피소 레이어를 중첩 표시합니다.',
    baseStyleLabel: '배경 지도',
    baseStd: '지리원 표준',
    basePale: '지리원 담색',
    layersHeading: '레이어 및 투명도',
    legendHeading: '범례',
    regionJumpLabel: '지역 이동',
    fullscreenEnter: '전체 화면',
    fullscreenExit: '전체 화면 종료',
    resetLayers: '레이어 초기화',
    playbackTitle: '시계열 재생',
    play: '재생',
    pause: '일시정지',
    speed: '배속',
    opacity: '투명도',
    shelterZoomHint: '안내: 지정 긴급 대피장소 레이어는 지도를 줌 11 이상으로 확대하면 자동으로 로드됩니다.',
    layerLabels: {
      quake_epicenters: '지진 진원 위치',
      quake_intensity: '최대 진도 라벨',
      tsunami_areas: '쓰나미 예보 연안 지역',
      weather_warnings: '기상 경보・주의보',
      rain_radar: '고해상도 강수 나우캐스트',
      precip_forecast: '단시간 강수 예보',
      lightning_nowcast: '낙뢰 나우캐스트',
      tornado_nowcast: '토네이도 발생 확률',
      himawari_sat: '히마와리 기상위성 (적외)',
      typhoon_track: '태풍 경로・예보원',
      amedas_stations: 'AMeDAS 관측소',
      kikikuru_landslide: '키키쿠루 (산사태 위험도)',
      kikikuru_inundation: '키키쿠루 (침수 위험도)',
      kikikuru_flood: '키키쿠루 (홍수 위험도)',
      gsi_flood_hazard: '지리원 홍수 침수 상정 구역',
      volcanoes: '전국 활화산 (120개)',
      evacuation_shelters: '지정 긴급 대피장소',
    },
    typhoonCircleNote: '참고: 예보원은 태풍 중심이 위치할 70% 확률 범위이며, 폭풍역이나 피해 범위의 크기가 아닙니다.',
  },
  quakeExt: {
    subViewP2P: 'P2P 지진・속보 이력',
    subViewJmaQuake: '기상청 공식 지진・난카이 트로프',
    subViewTsunami: '쓰나미 정보・도달 시각',
    jmaTitle: '기상청 공식 지진 및 특별 정보 모니터',
    jmaSubtitle: '국내 지진, 원지 지진, 장주기 지진동, 난카이 트로프 임시 정보, 정정/취소 전문을 확인합니다.',
    filterAll: '전체',
    filterDomestic: '국내 지진',
    filterDistant: '원지 지진',
    filterLongPeriod: '장주기 지진동',
    filterSpecial: '난카이/산리쿠 주의',
    nankaiTag: '난카이 트로프',
    sanrikuTag: '홋카이도・산리쿠 후발지진',
    distantTag: '원지 지진',
    longPeriodTag: '장주기 지진동',
    correctedTag: '정정',
    cancelledTag: '취소',
    tsunamiTitle: '쓰나미 경보・주의보・예보 및 관측 모니터',
    tsunamiSubtitle: '기상청 쓰나미 JSON을 기반으로 대쓰나미경보/경보/주의보, 예상 도달 시각, 높이, 관측치를 표시합니다.',
    tsunamiMajorWarning: '대쓰나미 경보',
    tsunamiWarning: '쓰나미 경보',
    tsunamiWatch: '쓰나미 주의보',
    tsunamiForecast: '쓰나미 예보 (약간의 해면 변동)',
    tsunamiLifted: '쓰나미 정보 해제',
    arrivalTime: '예상 도달 시각 / 상태',
    expectedHeight: '예상 쓰나미 높이',
    observedHeight: '관측 높이',
    coastalAreas: '대상 쓰나미 예보구 (연안)',
    observationsHeading: '연안 및 근해 쓰나미 관측 지점',
    noObservations: '현재 전문에 포함된 쓰나미 관측 지점 데이터가 없습니다.',
  },
  radar: {
    title: '기상 레이더・위성・일기도',
    subtitle: '기상청 공식 타일의 시계열 재생, 배속 변경, 일시정지, 시각 지정 및 전체 화면을 지원합니다.',
    tabHrpns: '고해상도 강수 나우캐스트',
    tabRasrf: '강수 단시간 예보',
    tabLightning: '낙뢰 나우캐스트',
    tabTornado: '토네이도 발생 확률',
    tabSatellite: '히마와리 기상위성',
    tabWeatherMap: '지상・예상 일기도',
    satBandIr: '적외 영상 (B13/TBB)',
    satBandTrueColor: '트루컬러 재현',
    wmapNow: '실황 일기도',
    wmapFt24: '24시간 예상도',
    wmapFt48: '48시간 예상도',
    wmapNear: '일본 주변',
    wmapAsia: '아시아 태평양',
    legendRain: '강수 강도 범례: 하늘색(약) → 파랑 → 노랑 → 주황 → 빨강 → 보라(80mm/h+)',
    legendLightning: '낙뢰 활동도: 1단계(가능성) ~ 4단계(격렬한 낙뢰)',
  },
  typhoon: {
    title: '태풍・열대저기압 및 해양 기상',
    subtitle: '기상청 태풍 정보, 지방 해상 경보・예보 및 Open-Meteo 해양 모델 데이터를 표시합니다.',
    activeListHeading: '발표 중인 태풍 및 열대저기압',
    noActiveTitle: '현재 일본 감시 구역에 유효한 태풍 발표가 없습니다',
    noActiveDesc: '기상청 typhoon.json / JMAXML에 현재 유효한 태풍 전문이 없어 가상 경로를 생성하지 않습니다.',
    expiredNotice: '주의: 24시간 이상 경과한 과거 기록입니다. 현재 진행 중인 태풍으로 오인하지 마세요.',
    typhoonNumber: '태풍 번호',
    pressure: '중심 기압',
    maxWind: '최대 풍속',
    maxGust: '최대 순간 풍속',
    movement: '이동 방향・속도',
    stormRadius: '폭풍 반경',
    galeRadius: '강풍 반경',
    forecastCircleDisclaimer: '예보원은 태풍 중심이 위치할 70% 확률 범위이며, 태풍이나 피해 범위의 크기를 뜻하지 않습니다.',
    marineHeading: '선택 지점 해양 기상(모델 참고) 및 해상 경보',
    waveHeight: '유의 파고',
    wavePeriod: '파 주기',
    waveDirection: '파향',
    seaSurfaceTemp: '해수면 온도 (SST)',
    oceanCurrent: '해류 속도・방향',
    seaBulletinsHeading: '기상청 지방 해상 경보・예보 (JMAXML)',
  },
  hazards: {
    title: '호우・홍수・산사태 위험도 (키키쿠루)',
    subtitle: '기상청 키키쿠루 실시간 위험도 타일, JMAXML 재해 특보 및 경계 레벨 1~5 대응표를 제공합니다.',
    kikikuruHeading: '기상청 키키쿠루 실시간 위험도 분포',
    kikikuruLand: '산사태 위험도',
    kikikuruInund: '침수 위험도',
    kikikuruFlood: '홍수 위험도',
    alertLevelsTitle: '경계 레벨 (1~5) 및 발표 주체 구분',
    evacuationVsWeatherNote: '중요: 기상청 경보와 키키쿠루는 기상 위험도 기준이며, 실제 대피 지시(레벨 3~5)는 시구정촌 지자체가 발령합니다.',
    mlitUnsupportedTitle: '국토교통성 실시간 하천 수위・댐 API: 정적 브라우저 직접 수신 미지원',
    mlitUnsupportedDesc: 'CORS 제한으로 정적 웹 클라이언트에서 실시간 하천 수위 수치 API를 직접 조회할 수 없습니다. 공식 포털을 이용하세요.',
    bulletinsHeading: '산사태 경계・기록적 단시간 호우・지정하천 홍수 예보 (JMAXML)',
    noActiveBulletins: '현재 JMAXML 피드 내 긴급 산사태・기록적 호우・홍수 전문이 없습니다.',
  },
  volcano: {
    title: '화산 활동・분화 경보・강회 예보',
    subtitle: '기상청 등록 전국 120개 활화산 좌표와 JMAXML 분화 경보・화산 해설・강회 예보를 제공합니다.',
    searchPlaceholder: '화산명 또는 코드 검색 (예: 사쿠라지마, 후지산, 아소산)',
    totalCount: '등록 화산 수',
    activeBulletinsHeading: '최근 화산 관련 전문 (분화 경보・해설・강회)',
    volcanoListHeading: '전국 화산 목록 및 좌표',
    alertLevel: '분화 경계 레벨 / 최신 전문',
    coordinates: '좌표',
    ashfallNote: '강회 예보 및 분화 속보의 상세 통제 구역은 기상청 공식 화산 포털을 확인하세요.',
  },
  environment: {
    title: '열사병 참고・황사・자외선・전반 기상 정보',
    subtitle: 'Open-Meteo 대기질(UV, PM2.5, 황사) 및 AMeDAS 적설/일조와 기상청 전반・지방 기상 정보를 표시합니다.',
    moeUnsupportedTitle: '일본 환경성 열사병 경계 알람 공식 CSV: CORS 제한으로 자동 수신 미지원',
    moeUnsupportedDesc: '환경성 사이트가 CORS 헤더를 반환하지 않아 정적 웹 버전에서 직접 수신할 수 없습니다. "알람 없음"으로 오해하지 말고 공식 사이트를 확인하세요.',
    uvLabel: 'UV 지수 (모델)',
    pm25Label: 'PM2.5',
    pm10Label: 'PM10',
    dustLabel: '황사・먼지 농도',
    aqiLabel: '유럽 대기질 지수',
    apparentTempLabel: '체감 온도 (더위 참고)',
    visibilityLabel: '가시거리 (모델)',
    gustLabel: '최대 순간 풍속',
    snowDepthLabel: '적설 깊이 / 1h 강설',
    sunshineLabel: '일조 시간 (1h)',
    weatherBulletinsHeading: '조기 주의 정보・전반/지방 기상・계절 예보・토네이도 주의 (JMAXML)',
  },
  timeline: {
    title: '방재 정보 통합 타임라인',
    subtitle: 'P2P 지진, 기상청 지진/쓰나미, JMAXML 기상/화산/태풍/홍수 전문을 시간순으로 통합 표시합니다.',
    allCategories: '전체 보기',
    empty: '타임라인에 표시할 이벤트가 없습니다.',
  },
  statusPanel: {
    title: '시스템 상태 및 API 연결 모니터',
    subtitle: '각 데이터 제공원의 연결 상태, 발표 시각, 수신 시각, 지연 시간, 캐시 여부 및 미지원 사유를 관리합니다.',
    recheckAll: '전체 소스 재확인',
    noSafeFallbackWarning: '안전 원칙: 수신 실패, 연결 끊김, 미지원 상태는 절대 "경보 없음" 또는 "안전"으로 표시하지 않습니다.',
    colSource: '데이터 소스 / 제공원',
    colStatus: '상태',
    colPublished: '발표 시각',
    colFetched: '수신 시각',
    colInterval: '갱신 주기',
    colLatency: '지연 시간',
  },
  regions: {
    title: '관심 지역 관리',
    subtitle: '모니터링할 도도부현 기상 관측 지역을 여러 개 등록하고 순서를 변경할 수 있습니다.',
    addRegion: '선택 지역 추가',
    geolocateBtn: '현재 위치에서 가까운 기상대 찾기 (권한 요청)',
    geolocatePermissionNote: '위치 정보는 명시적 동의 후 기기 내에서 가까운 관측소 매칭에만 사용되며 외부로 전송되지 않습니다.',
    geolocateDenied: '위치 권한이 거부되었거나 지원되지 않습니다.',
    empty: '등록된 지역이 없습니다.',
    moveUp: '위로',
    moveDown: '아래로',
    remove: '삭제',
    openWeather: '날씨 보기',
  },
  notifyExt: {
    title: '방재 알림 세부 설정',
    subtitle: '재난 유형별 알림, 최소 진도, 경보음 볼륨, 알림 기록을 설정합니다(기존 설정 유지).',
    categoriesLabel: '알림 수신 대상 유형',
    minScaleLabel: '지진 알림 최소 진도',
    warningFilterLabel: '기상 특보 필터',
    volumeLabel: '경보음 볼륨',
    testChimeBtn: '볼륨 테스트 (훈련음)',
    inAppLabel: '앱 내 알림 토스트 표시',
    historyTitle: '최근 알림 기록',
    clearHistory: '기록 삭제',
    emptyHistory: '아직 기록된 알림이 없습니다.',
    deliveryCaveat: '안내: OS 절전 모드, 브라우저 권한, 백그라운드 제한으로 인해 알림 수신이 지연되거나 누락될 수 있으며 도달을 보장하지 않습니다.',
    categories: {
      quake: '지진 정보',
      eew: '긴급지진속보',
      tsunami: '쓰나미 정보',
      weather_warning: '기상 경보・특별경보',
      typhoon: '태풍 정보',
      landslide_flood: '산사태・홍수',
      volcano: '화산 정보',
      heatstroke: '환경・긴급 주의',
    },
  },
};

const EXT_TABLE: Record<AppLanguage, ExtendedMessages> = {
  ja: JA_EXT,
  en: EN_EXT,
  zh: ZH_EXT,
  ko: KO_EXT,
};

export function getExtendedMessages(lang: AppLanguage): ExtendedMessages {
  return EXT_TABLE[lang] ?? JA_EXT;
}

/**
 * Recursively collects leaf dot-paths of an object for i18n completeness validation.
 */
export function collectMessageKeys(obj: unknown, prefix = ''): string[] {
  if (!obj || typeof obj !== 'object') {
    return prefix ? [prefix] : [];
  }
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const next = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...collectMessageKeys(v, next));
    } else {
      keys.push(next);
    }
  }
  return keys.sort();
}

export function findMissingExtendedI18nKeys(): Record<AppLanguage, string[]> {
  const baseline = new Set(collectMessageKeys(JA_EXT));
  const result: Record<AppLanguage, string[]> = { ja: [], en: [], zh: [], ko: [] };
  for (const lang of ['ja', 'en', 'zh', 'ko'] as const) {
    const present = new Set(collectMessageKeys(EXT_TABLE[lang]));
    result[lang] = [...baseline].filter((k) => !present.has(k));
  }
  return result;
}
