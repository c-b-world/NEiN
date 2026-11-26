import assert from 'node:assert/strict';
import test from 'node:test';
import {
  classifyJmaQuakeKind,
  classifyTsunamiKindCode,
  classifyXmlBulletinCategory,
  mergeTsunamiDetail,
  parseJmaAtomFeed,
  parseJmaIso6709,
  parseJmaQuakeList,
  parseJmaTsunamiList,
  parseTyphoonListJson,
  parseVolcanoListJson,
} from './jmaFeedsParser';

test('parseJmaIso6709 parses coordinates and depth properly', () => {
  const res = parseJmaIso6709('+35.5+140.2-40000/');
  assert.equal(res.latitude, 35.5);
  assert.equal(res.longitude, 140.2);
  assert.equal(res.depthKm, 40);

  const invalid = parseJmaIso6709('');
  assert.equal(invalid.latitude, null);
  assert.equal(invalid.longitude, null);
});

test('classifyJmaQuakeKind detects domestic, distant, long-period, nankai, and hokkaido-sanriku', () => {
  assert.equal(classifyJmaQuakeKind('南海トラフ地震臨時情報', ''), 'nankai_trough');
  assert.equal(classifyJmaQuakeKind('北海道・三陸沖後発地震注意情報', ''), 'hokkaido_sanriku');
  assert.equal(classifyJmaQuakeKind('長周期地震動に関する観測情報', ''), 'long_period');
  assert.equal(classifyJmaQuakeKind('遠地地震に関する情報', ''), 'distant');
  assert.equal(classifyJmaQuakeKind('震源・震度情報', ''), 'domestic');
});

test('parseJmaQuakeList parses summary records including correction/cancellation flags', () => {
  const parsed = parseJmaQuakeList([
    {
      eid: '20261101120000',
      ttl: '震源・震度情報',
      en_ttl: 'Earthquake Information',
      ift: '訂正',
      ser: '2',
      rdt: '2026-11-01T12:03:00+09:00',
      at: '2026-11-01T12:00:00+09:00',
      anm: '千葉県東方沖',
      en_anm: 'East off Chiba Prefecture',
      cod: '+35.5+140.8-30000/',
      mag: '5.1',
      maxi: '4',
      json: 'test_q.json',
    },
  ]);

  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].isCorrected, true);
  assert.equal(parsed[0].isCancelled, false);
  assert.equal(parsed[0].magnitude, 5.1);
  assert.equal(parsed[0].depthKm, 30);
});

test('parseJmaTsunamiList + mergeTsunamiDetail decodes warnings, heights, arrivals, and coastal coords', () => {
  assert.equal(classifyTsunamiKindCode('大津波警報'), 'major_warning');
  assert.equal(classifyTsunamiKindCode('津波警報'), 'warning');
  assert.equal(classifyTsunamiKindCode('津波注意報'), 'watch');
  assert.equal(classifyTsunamiKindCode('解除'), 'lifted');

  const baseList = parseJmaTsunamiList([
    {
      eid: '20261101120500',
      ttl: '津波警報・注意報',
      ift: '発表',
      rdt: '2026-11-01T12:06:00+09:00',
      anm: '岩手県沖',
      mag: '7.4',
      kind: [{ kind: '津波警報', code: '51' }],
      json: 'tsunami_sample.json',
    },
  ]);
  assert.equal(baseList.length, 1);
  assert.equal(baseList[0].highestSeverity, 'warning');

  const merged = mergeTsunamiDetail(baseList[0], {
    Head: {
      Headline: { Text: '岩手県に津波警報を発表しました。' },
      ValidDateTime: '2026-11-01T15:00:00+09:00',
    },
    Body: {
      Tsunami: {
        Forecast: {
          Item: [
            {
              Area: { Code: '210', Name: '岩手県', enName: 'Iwate' },
              Category: { Kind: { Code: '51', Name: '津波警報', enName: 'Tsunami Warning' } },
              MaxHeight: { TsunamiHeight: '3m' },
              FirstHeight: { ArrivalTime: '2026-11-01T12:30:00+09:00' },
            },
          ],
        },
        Observation: {
          Item: [
            {
              Area: { Name: '岩手県沖合' },
              Station: [{ Name: '釜石沖GPS', MaxHeight: { TsunamiHeight: '0.8m' } }],
            },
          ],
        },
      },
    },
  });

  assert.equal(merged.areas.length, 1);
  assert.equal(merged.areas[0].maxHeight, '3m');
  assert.ok(merged.areas[0].lat !== null && merged.areas[0].lon !== null);
  assert.equal(merged.observations.length, 1);
  assert.equal(merged.observations[0].isOffshore, true);
});

test('parseJmaAtomFeed & classifyXmlBulletinCategory extract bulletins cleanly', () => {
  assert.equal(classifyXmlBulletinCategory('土砂災害警戒情報'), 'landslide');
  assert.equal(classifyXmlBulletinCategory('記録的短時間大雨情報'), 'heavy_rain');
  assert.equal(classifyXmlBulletinCategory('噴火警戒レベル関連'), 'volcano');
  assert.equal(classifyXmlBulletinCategory('台風第10号に関する情報'), 'typhoon');

  const sampleXml = `
    <feed>
      <entry>
        <title>噴火予報（桜島）</title>
        <id>https://www.data.jma.go.jp/developer/xml/data/sample_volcano.xml</id>
        <updated>2026-11-01T10:00:00Z</updated>
        <author><name>福岡管区気象台</name></author>
        <content type="text">火口周辺警報（噴火警戒レベル３、入山規制）継続</content>
      </entry>
    </feed>
  `;
  const bulletins = parseJmaAtomFeed(sampleXml, 'eqvol');
  assert.equal(bulletins.length, 1);
  assert.equal(bulletins[0].category, 'volcano');
  assert.equal(bulletins[0].channel, 'eqvol');
});

test('parseVolcanoListJson associates volcano alerts with catalog coordinates', () => {
  const bulletins = parseJmaAtomFeed(
    `<feed><entry><title>火口周辺警報（桜島）</title><id>v1</id><updated>2026-11-01T00:00:00Z</updated><content>噴火警戒レベル３</content></entry></feed>`,
    'eqvol',
  );
  const volcanoes = parseVolcanoListJson(
    [{ code: '506', name_jp: '桜島', name_en: 'Sakurajima', latlon: [31.59, 130.65] }],
    bulletins,
  );
  assert.equal(volcanoes.length, 1);
  assert.equal(volcanoes[0].alertLevelNum, 3);
});

test('parseTyphoonListJson marks stale/archived >24h entries as isExpired without inventing data', () => {
  const nowMs = Date.parse('2026-11-25T12:00:00Z');
  const list = parseTyphoonListJson(
    [
      {
        eventId: 'TC2612',
        headTitle: '台風第12号に関する情報',
        reportDatetime: '2026-11-20T00:00:00+09:00',
      },
    ],
    [],
    nowMs,
  );
  assert.equal(list.length, 1);
  assert.equal(list[0].isExpired, true);
  assert.equal(list[0].typhoonNumber, '12');
});
