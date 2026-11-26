import assert from 'node:assert/strict';
import test from 'node:test';
import {
  P2P_AREA_LIST,
  formatP2PAreaLabel,
  resolveP2PAreaInfo,
} from '../data/p2pAreaCodes';
import type { Userquake561 } from '../types/quake';
import { formatQuakeForClipboard, getRecordTitle, matchesQuakeText } from './quakeParser';

test('P2P_AREA_LIST contains official EPSP region mappings including 241 and 900', () => {
  assert.ok(P2P_AREA_LIST.length >= 300);

  const chiba = resolveP2PAreaInfo(241);
  assert.ok(chiba);
  assert.equal(chiba.region, '関東');
  assert.equal(chiba.pref, '千葉');
  assert.equal(chiba.name, '千葉北西部');

  const hokkaido = resolveP2PAreaInfo(10);
  assert.ok(hokkaido);
  assert.equal(hokkaido.region, '北海道');

  const unset = resolveP2PAreaInfo(900);
  assert.ok(unset);
  assert.equal(unset.region, '未設定');
});

test('formatP2PAreaLabel formats human-readable regional labels across languages and fallbacks', () => {
  assert.equal(formatP2PAreaLabel(241, 'ja'), '関東 · 千葉北西部');
  assert.equal(formatP2PAreaLabel(241, 'en'), 'Kanto · 千葉北西部');
  assert.equal(formatP2PAreaLabel(241, 'zh'), '关东 · 千葉北西部');
  assert.equal(formatP2PAreaLabel(241, 'ko'), '간토 · 千葉北西部');

  assert.equal(formatP2PAreaLabel(900, 'ja'), '地域未設定');
  assert.equal(formatP2PAreaLabel(900, 'en'), 'Unset Region');

  assert.equal(formatP2PAreaLabel(99999, 'ja'), '地域コード 99999');
  assert.equal(formatP2PAreaLabel(99999, 'en'), 'Region Code 99999');
});

test('code 561 title, clipboard output, and text search use resolved region names', () => {
  const sample561: Userquake561 = {
    id: 'uq-241',
    code: 561,
    time: '2026/11/25 10:00:00',
    area: 241,
  };

  assert.equal(getRecordTitle(sample561, 'ja'), '地震感知情報（関東 · 千葉北西部）');
  assert.equal(getRecordTitle(sample561, 'en'), 'Felt Report (Kanto · 千葉北西部)');

  const clipJa = formatQuakeForClipboard(sample561, 'ja');
  assert.ok(clipJa.includes('関東 · 千葉北西部'));

  assert.equal(matchesQuakeText(sample561, '関東'), true);
  assert.equal(matchesQuakeText(sample561, '千葉北西部'), true);
  assert.equal(matchesQuakeText(sample561, '241'), true);
  assert.equal(matchesQuakeText(sample561, '沖縄'), false);
});
