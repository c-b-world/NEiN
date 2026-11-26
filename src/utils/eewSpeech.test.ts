import assert from 'node:assert/strict';
import test from 'node:test';
import type { RegisteredRegion } from '../types/disaster';
import type { EEW556, EEWDetection554 } from '../types/quake';
import type { PrefectureOverviewRow } from '../types/weather';
import {
  DEFAULT_EEW_SPEECH_SETTINGS,
  analyzeLocalEewImpact,
  buildEewSpeechScript,
  clampSpeechRate,
  clampSpeechVolume,
  isPrefectureMatch,
  normalizePrefectureStem,
  resolveCurrentLocationContext,
  selectBestSpeechVoice,
} from './eewSpeech';
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

test('clampSpeechRate and clampSpeechVolume enforce safe ranges', () => {
  assert.equal(clampSpeechRate(0.2), 0.8);
  assert.equal(clampSpeechRate(2.5), 1.4);
  assert.equal(clampSpeechRate(1.15), 1.15);
  assert.equal(clampSpeechRate(Number.NaN), DEFAULT_EEW_SPEECH_SETTINGS.rate);

  assert.equal(clampSpeechVolume(0.05), 0.2);
  assert.equal(clampSpeechVolume(2.0), 1.0);
  assert.equal(clampSpeechVolume(0.75), 0.75);
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

test('buildEewSpeechScript generates localized location-aware announcements for active, cancelled, and 554 EEW', () => {
  const nankaiAlert = createTestEEWPayload('nankai_alert') as EEW556;
  const osakaLoc = resolveCurrentLocationContext(OSAKA_REGION, []);
  const osakaImpact = analyzeLocalEewImpact(nankaiAlert, osakaLoc);

  const jaScript = buildEewSpeechScript(nankaiAlert, osakaImpact, 'ja', true);
  assert.match(jaScript, /訓練放送です/);
  assert.match(jaScript, /緊急地震速報です/);
  assert.match(jaScript, /大阪府/);
  assert.match(jaScript, /高台や津波避難ビル/);

  const enScript = buildEewSpeechScript(nankaiAlert, osakaImpact, 'en', true);
  assert.match(enScript, /test drill broadcast/i);
  assert.match(enScript, /Earthquake Early Warning/);
  assert.match(enScript, /high ground/i);

  const cancelledAlert = createTestEEWPayload('eew_cancelled') as EEW556;
  const cancelledScript = buildEewSpeechScript(cancelledAlert, osakaImpact, 'ja', true);
  assert.match(cancelledScript, /取り消されました/);

  const detectionAlert = createTestEEWPayload('eew_detection') as EEWDetection554;
  const detectionImpact = analyzeLocalEewImpact(detectionAlert, osakaLoc);
  const detectionScript = buildEewSpeechScript(detectionAlert, detectionImpact, 'ja', true);
  assert.match(detectionScript, /検知しました/);
});

test('selectBestSpeechVoice prefers local matching locale then prefix fallback', () => {
  const voices = [
    { name: 'English US', lang: 'en-US', localService: true, default: true },
    { name: 'Google Japanese', lang: 'ja-JP', localService: false },
    { name: 'Kyoko', lang: 'ja-JP', localService: true },
    { name: 'Korean', lang: 'ko-KR', localService: true },
  ];
  assert.equal(selectBestSpeechVoice(voices, 'ja')?.name, 'Kyoko');
  assert.equal(selectBestSpeechVoice(voices, 'en')?.name, 'English US');
  assert.equal(selectBestSpeechVoice(voices, 'ko')?.name, 'Korean');
  assert.equal(selectBestSpeechVoice([], 'ja'), null);
});

test('getSpeechErrorMessage returns clear localized guidance for each failure reason', async () => {
  const { getSpeechErrorMessage } = await import('./eewSpeech');
  assert.match(getSpeechErrorMessage('not-allowed', 'ja'), /自動再生制限/);
  assert.match(getSpeechErrorMessage('synthesis-unavailable', 'ja'), /音声合成エンジン/);
  assert.match(getSpeechErrorMessage('not-allowed', 'en'), /autoplay/i);
  assert.match(getSpeechErrorMessage('unsupported', 'zh'), /Web Speech API/);
  assert.match(getSpeechErrorMessage('interrupted', 'ko'), /중단/);
});

