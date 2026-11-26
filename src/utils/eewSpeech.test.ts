import assert from 'node:assert/strict';
import test from 'node:test';
import type { RegisteredRegion } from '../types/disaster';
import type { EEW556, EEWDetection554 } from '../types/quake';
import type { PrefectureOverviewRow } from '../types/weather';
import {
  DEFAULT_EEW_SPEECH_SETTINGS,
  analyzeLocalEewImpact,
  buildEewSpeechScript,
  buildEewSpeechSegments,
  clampSpeechPitch,
  clampSpeechRate,
  clampSpeechVolume,
  getSpeechErrorMessage,
  isPrefectureMatch,
  isValidSpeechLanguageSetting,
  normalizePrefectureStem,
  rankSpeechVoices,
  resolveCurrentLocationContext,
  resolveEffectiveSpeechLanguage,
  scoreSpeechVoice,
  selectBestSpeechVoice,
} from './eewSpeech';
import {
  formatSpokenIntensity,
  formatSpokenIntensityRange,
  formatSpokenMagnitude,
  localizeJapanesePlaceName,
} from './eewSpeechLocale';
import { createTestEEWPayload } from './quakeParser';

const TOKYO_REGION: RegisteredRegion = {
  id: '130000',
  officeCode: '130000',
  areaCode: '130010',
  label: '東京都（東京）',
  prefectureName: '東京都',
  lat: 35.6895,
  lon: 139.6917,
  notifyEnabled: true,
};

const OSAKA_REGION: RegisteredRegion = {
  id: '270000',
  officeCode: '270000',
  areaCode: '270000',
  label: '大阪府（大阪）',
  prefectureName: '大阪府',
  lat: 34.6937,
  lon: 135.5023,
  notifyEnabled: true,
};

test('clampSpeechRate, clampSpeechPitch, and clampSpeechVolume enforce safe ranges', () => {
  assert.equal(clampSpeechRate(0.2), 0.8);
  assert.equal(clampSpeechRate(2.5), 1.4);
  assert.equal(clampSpeechRate(1.15), 1.15);
  assert.equal(clampSpeechRate(Number.NaN), DEFAULT_EEW_SPEECH_SETTINGS.rate);

  assert.equal(clampSpeechPitch(0.5), 0.85);
  assert.equal(clampSpeechPitch(1.8), 1.15);
  assert.equal(clampSpeechPitch(1.05), 1.05);
  assert.equal(clampSpeechPitch(Number.NaN), DEFAULT_EEW_SPEECH_SETTINGS.pitch);

  assert.equal(clampSpeechVolume(0.05), 0.2);
  assert.equal(clampSpeechVolume(2.0), 1.0);
  assert.equal(clampSpeechVolume(0.75), 0.75);
});

test('resolveEffectiveSpeechLanguage and isValidSpeechLanguageSetting cover all 4 languages plus auto', () => {
  assert.equal(isValidSpeechLanguageSetting('auto'), true);
  assert.equal(isValidSpeechLanguageSetting('ja'), true);
  assert.equal(isValidSpeechLanguageSetting('en'), true);
  assert.equal(isValidSpeechLanguageSetting('zh'), true);
  assert.equal(isValidSpeechLanguageSetting('ko'), true);
  assert.equal(isValidSpeechLanguageSetting('fr'), false);

  assert.equal(resolveEffectiveSpeechLanguage('auto', 'zh'), 'zh');
  assert.equal(resolveEffectiveSpeechLanguage('ko', 'ja'), 'ko');
  assert.equal(resolveEffectiveSpeechLanguage('en', 'ko'), 'en');
});

test('localizeJapanesePlaceName translates prefectures, coastal suffixes, and seismic zones across ja/en/zh/ko', () => {
  assert.equal(localizeJapanesePlaceName('東京都', 'ja'), '東京都');
  assert.equal(localizeJapanesePlaceName('東京都', 'en'), 'Tokyo');
  assert.equal(localizeJapanesePlaceName('東京都', 'zh'), '东京都');
  assert.equal(localizeJapanesePlaceName('東京都', 'ko'), '도쿄도');

  assert.equal(localizeJapanesePlaceName('宮城県沖', 'en'), 'off the coast of Miyagi');
  assert.equal(localizeJapanesePlaceName('宮城県沖', 'zh'), '宫城县近海');
  assert.equal(localizeJapanesePlaceName('宮城県沖', 'ko'), '미야기현 앞바다');

  assert.equal(localizeJapanesePlaceName('東京都近海', 'en'), 'near the coast of Tokyo');
  assert.equal(localizeJapanesePlaceName('東京都近海', 'zh'), '东京都近海');
  assert.equal(localizeJapanesePlaceName('東京都近海', 'ko'), '도쿄도 근해');

  assert.equal(localizeJapanesePlaceName('和歌山県南方沖', 'en'), 'off the southern coast of Wakayama');

  assert.equal(localizeJapanesePlaceName('東京湾', 'en'), 'Tokyo Bay');
  assert.equal(localizeJapanesePlaceName('東京湾', 'zh'), '东京湾');
  assert.equal(localizeJapanesePlaceName('東京湾', 'ko'), '도쿄만');

  assert.equal(localizeJapanesePlaceName('南海トラフ', 'en'), 'the Nankai Trough');
  assert.equal(localizeJapanesePlaceName('南海トラフ', 'zh'), '南海海槽');
  assert.equal(localizeJapanesePlaceName('南海トラフ', 'ko'), '난카이 해구');

  assert.equal(localizeJapanesePlaceName('能登半島沖', 'en'), 'off the coast of the Noto Peninsula');
  assert.equal(localizeJapanesePlaceName('北海道（札幌）', 'en'), 'Sapporo, Hokkaido');
});

test('formatSpokenIntensity, formatSpokenIntensityRange, and formatSpokenMagnitude avoid harsh punctuation across all 4 languages', () => {
  assert.equal(formatSpokenIntensity(45, 'ja'), '震度5弱');
  assert.equal(formatSpokenIntensity(50, 'ja'), '震度5強');
  assert.equal(formatSpokenIntensity(45, 'en'), 'seismic intensity 5 lower');
  assert.equal(formatSpokenIntensity(50, 'en'), 'seismic intensity 5 upper');
  assert.equal(formatSpokenIntensity(45, 'zh'), '震度5弱');
  assert.equal(formatSpokenIntensity(50, 'zh'), '震度5强');
  assert.equal(formatSpokenIntensity(45, 'ko'), '진도 5약');
  assert.equal(formatSpokenIntensity(50, 'ko'), '진도 5강');

  for (const lang of ['ja', 'en', 'zh', 'ko'] as const) {
    const range = formatSpokenIntensityRange(45, 50, lang);
    assert.ok(range.length > 0);
    assert.equal(/[〜～–—-]/.test(range), false, `Spoken range in ${lang} should not contain raw dashes/tildes: ${range}`);
  }

  assert.equal(formatSpokenIntensityRange(45, 50, 'ja'), '震度5弱から、震度5強');
  assert.equal(formatSpokenIntensityRange(45, 50, 'en'), 'seismic intensity 5 lower to 5 upper');
  assert.equal(formatSpokenIntensityRange(45, 50, 'zh'), '震度5弱至5强');
  assert.equal(formatSpokenIntensityRange(45, 50, 'ko'), '진도 5약에서 5강');

  assert.equal(formatSpokenMagnitude(6.4, 'ja'), 'マグニチュード6.4');
  assert.equal(formatSpokenMagnitude(6.4, 'en'), 'magnitude 6.4');
  assert.equal(formatSpokenMagnitude(6.4, 'zh'), '震级6.4级');
  assert.equal(formatSpokenMagnitude(6.4, 'ko'), '규모 6.4');
});

test('normalizePrefectureStem and isPrefectureMatch handle Tokyo, Osaka, Kyoto, Hokkaido, and prefectures', () => {
  assert.equal(normalizePrefectureStem('東京都'), '東京');
  assert.equal(normalizePrefectureStem('大阪府'), '大阪');
  assert.equal(normalizePrefectureStem('神奈川県'), '神奈川');
  assert.equal(normalizePrefectureStem('北海道'), '北海道');

  assert.equal(isPrefectureMatch('東京都', '東京'), true);
  assert.equal(isPrefectureMatch('東京23区', '東京都'), true);
  assert.equal(isPrefectureMatch('大阪府', '京都府'), false);
});

test('resolveCurrentLocationContext prefers geolocation over registered regions and falls back safely', () => {
  const fromGeo = resolveCurrentLocationContext(OSAKA_REGION, [TOKYO_REGION]);
  assert.equal(fromGeo.source, 'geolocation');
  assert.equal(fromGeo.prefectureName, '大阪府');

  const fromReg = resolveCurrentLocationContext(null, [TOKYO_REGION, OSAKA_REGION]);
  assert.equal(fromReg.source, 'registered');
  assert.equal(fromReg.prefectureName, '東京都');

  const fallback = resolveCurrentLocationContext(null, []);
  assert.equal(fallback.source, 'fallback');
  assert.equal(fallback.prefectureName, '東京都');
});

test('analyzeLocalEewImpact identifies targeted vs non-targeted prefectures, distance, and local weather warnings', () => {
  const kantoAlert = createTestEEWPayload('kanto_alert') as EEW556;
  const tokyoLoc = resolveCurrentLocationContext(TOKYO_REGION, []);
  const osakaLoc = resolveCurrentLocationContext(OSAKA_REGION, []);

  const mockSnapshot: PrefectureOverviewRow = {
    office: {
      officeCode: '130000',
      name: '東京都（東京）',
      prefectureName: '東京都',
      regionGroup: 'kanto',
      defaultAreaCode: '130010',
      amedasId: '44132',
      stationName: '東京',
      lat: 35.6895,
      lon: 139.6917,
    },
    amedasTempC: 18,
    amedasWindMs: 4,
    amedasWindDir: '東',
    amedasPrecip1h: 2,
    forecastStatus: 'ok',
    weatherCode: '300',
    weatherText: '雨',
    popMaxPct: 80,
    tempMinC: 12,
    tempMaxC: 19,
    warningStatus: 'ok',
    specialCount: 0,
    warningCount: 2,
    advisoryCount: 1,
  };

  const tokyoImpact = analyzeLocalEewImpact(kantoAlert, tokyoLoc, {
    regionSnapshots: [mockSnapshot],
  });
  assert.equal(tokyoImpact.isTargeted, true);
  assert.ok(tokyoImpact.localMaxScale >= 50);
  assert.ok(tokyoImpact.distanceKm !== null && tokyoImpact.distanceKm < 120);
  assert.equal(tokyoImpact.activeLocalWarnings, 2);

  const osakaImpact = analyzeLocalEewImpact(kantoAlert, osakaLoc);
  assert.equal(osakaImpact.isTargeted, false);
  assert.equal(osakaImpact.matchedAreas.length, 0);
  assert.ok(osakaImpact.distanceKm !== null && osakaImpact.distanceKm > 300);
});

test('buildEewSpeechSegments produces fluent multi-segment broadcast prosody across all 4 languages', () => {
  const nankaiAlert = createTestEEWPayload('nankai_alert') as EEW556;
  const osakaLoc = resolveCurrentLocationContext(OSAKA_REGION, []);
  const osakaImpact = analyzeLocalEewImpact(nankaiAlert, osakaLoc);

  for (const lang of ['ja', 'en', 'zh', 'ko'] as const) {
    const segments = buildEewSpeechSegments(nankaiAlert, osakaImpact, lang, true);
    assert.ok(segments.length >= 5, `Expected >= 5 segments for ${lang}, got ${segments.length}`);
    assert.equal(segments[0].role, 'test_prefix');
    assert.equal(segments[0].pauseBeforeMs, 0);
    assert.ok(segments.slice(1).every((s) => s.pauseBeforeMs >= 180));
    assert.ok(segments.some((s) => s.role === 'tsunami_warning'));
    assert.ok(segments.some((s) => s.role === 'action_guidance'));
  }

  // English readout must contain localized Osaka / Wakayama phrasing with zero Japanese Kanji and clean grammar
  const enScript = buildEewSpeechScript(nankaiAlert, osakaImpact, 'en', true);
  assert.match(enScript, /occurred off the southern coast of Wakayama/);
  assert.match(enScript, /Osaka/);
  assert.match(enScript, /Earthquake Early Warning/);
  assert.match(enScript, /higher ground/i);
  assert.equal(/[\u4E00-\u9FFF\u3040-\u30FF]/.test(enScript), false, `English speech should not contain raw Japanese characters: ${enScript}`);

  // Simplified Chinese readout
  const zhScript = buildEewSpeechScript(nankaiAlert, osakaImpact, 'zh', true);
  assert.match(zhScript, /演练播报/);
  assert.match(zhScript, /紧急地震速报/);
  assert.match(zhScript, /大阪府/);
  assert.match(zhScript, /海啸避难建筑/);

  // Korean readout must contain localized Korean phrasing with zero raw Japanese Kanji/Kana
  const koScript = buildEewSpeechScript(nankaiAlert, osakaImpact, 'ko', true);
  assert.match(koScript, /훈련 방송/);
  assert.match(koScript, /긴급지진속보/);
  assert.match(koScript, /오사카부/);
  assert.match(koScript, /쓰나미 대피 건물/);
  assert.equal(/[\u4E00-\u9FFF\u3040-\u30FF]/.test(koScript), false, `Korean speech should not contain raw Japanese characters: ${koScript}`);

  // Japanese readout
  const jaScript = buildEewSpeechScript(nankaiAlert, osakaImpact, 'ja', true);
  assert.match(jaScript, /訓練放送です/);
  assert.match(jaScript, /緊急地震速報です/);
  assert.match(jaScript, /大阪府/);
  assert.match(jaScript, /高台や津波避難ビル/);

  // Cancelled & 554 Detection across languages
  const cancelledAlert = createTestEEWPayload('eew_cancelled') as EEW556;
  assert.match(buildEewSpeechScript(cancelledAlert, osakaImpact, 'ja', true), /取り消されました/);
  assert.match(buildEewSpeechScript(cancelledAlert, osakaImpact, 'en', true), /cancelled/i);
  assert.match(buildEewSpeechScript(cancelledAlert, osakaImpact, 'zh', true), /取消/);
  assert.match(buildEewSpeechScript(cancelledAlert, osakaImpact, 'ko', true), /취소/);

  const detectionAlert = createTestEEWPayload('eew_detection') as EEWDetection554;
  const detectionImpact = analyzeLocalEewImpact(detectionAlert, osakaLoc);
  assert.match(buildEewSpeechScript(detectionAlert, detectionImpact, 'ja', true), /検知しました/);
  assert.match(buildEewSpeechScript(detectionAlert, detectionImpact, 'en', true), /detected/i);
  assert.match(buildEewSpeechScript(detectionAlert, detectionImpact, 'zh', true), /检测到/);
  assert.match(buildEewSpeechScript(detectionAlert, detectionImpact, 'ko', true), /감지/);
});

test('scoreSpeechVoice, rankSpeechVoices, and selectBestSpeechVoice prioritize Neural/Natural voices over robotic voices', () => {
  const voices = [
    { name: 'eSpeak Japanese', lang: 'ja-JP', localService: true },
    { name: 'Kyoko', lang: 'ja-JP', localService: true },
    { name: 'Microsoft Nanami Online (Natural) - Japanese (Japan)', lang: 'ja-JP', localService: false },
    { name: 'Google 日本語', lang: 'ja-JP', localService: false },
    { name: 'Fred', lang: 'en-US', localService: true },
    { name: 'Microsoft Aria Online (Natural) - English (United States)', lang: 'en-US', localService: false },
    { name: 'Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)', lang: 'zh-CN', localService: false },
    { name: 'Microsoft SunHi Online (Natural) - Korean (Korea)', lang: 'ko-KR', localService: false },
  ];

  assert.equal(selectBestSpeechVoice(voices, 'ja')?.name, 'Microsoft Nanami Online (Natural) - Japanese (Japan)');
  assert.equal(selectBestSpeechVoice(voices, 'en')?.name, 'Microsoft Aria Online (Natural) - English (United States)');
  assert.equal(selectBestSpeechVoice(voices, 'zh')?.name, 'Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)');
  assert.equal(selectBestSpeechVoice(voices, 'ko')?.name, 'Microsoft SunHi Online (Natural) - Korean (Korea)');

  // Preferred voice override when matching language
  assert.equal(selectBestSpeechVoice(voices, 'ja', 'Google 日本語')?.name, 'Google 日本語');
  // Wrong-language preferred voice is ignored in favor of target language
  assert.equal(
    selectBestSpeechVoice(voices, 'ko', 'Google 日本語')?.name,
    'Microsoft SunHi Online (Natural) - Korean (Korea)',
  );

  // Robotic voices score far lower than Natural voices
  const naturalScore = scoreSpeechVoice(voices[2], 'ja');
  const roboticScore = scoreSpeechVoice(voices[0], 'ja');
  assert.ok(naturalScore > roboticScore + 80);

  const rankedJa = rankSpeechVoices(voices, 'ja');
  assert.equal(rankedJa[0].name, 'Microsoft Nanami Online (Natural) - Japanese (Japan)');
  assert.equal(rankedJa[rankedJa.length - 1].name, 'eSpeak Japanese');
  assert.equal(selectBestSpeechVoice([], 'ja'), null);
});

test('getSpeechErrorMessage returns clear localized guidance for each failure reason', () => {
  assert.match(getSpeechErrorMessage('not-allowed', 'ja'), /自動再生制限/);
  assert.match(getSpeechErrorMessage('synthesis-unavailable', 'ja'), /音声合成エンジン/);
  assert.match(getSpeechErrorMessage('not-allowed', 'en'), /autoplay/i);
  assert.match(getSpeechErrorMessage('unsupported', 'zh'), /Web Speech API/);
  assert.match(getSpeechErrorMessage('interrupted', 'ko'), /중단/);
});
