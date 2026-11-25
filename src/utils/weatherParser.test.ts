import assert from 'node:assert/strict';
import test from 'node:test';
import { getWeatherOfficeByCode } from '../data/japanWeatherRegions.ts';
import {
  deriveModelAdvisoryNotes,
  evaluateFreshness,
  parseAmedasObservation,
  parseJmaForecast,
  parseJmaWarning,
  parseOpenMeteoBundle,
} from './weatherParser.ts';

const tokyoOffice = getWeatherOfficeByCode('130000');

test('evaluateFreshness flags expired data and handles invalid/missing timestamps', () => {
  const now = Date.parse('2026-11-25T12:00:00+09:00');
  const fresh = evaluateFreshness('2026-11-25T10:00:00+09:00', 24, now);
  assert.equal(fresh.isStale, false);

  const stale = evaluateFreshness('2026-05-28T10:16:00+09:00', 24, now);
  assert.equal(stale.isStale, true);
  assert.match(stale.reason ?? '', /情報期限切れ|更新停止/);

  const missing = evaluateFreshness(null, 24, now);
  assert.equal(missing.isStale, true);
});

test('parseJmaWarning never treats null/error payload as no warnings', () => {
  const bundle = parseJmaWarning(null, tokyoOffice, {});
  assert.equal(bundle.meta.status, 'error');
  assert.match(bundle.meta.errorMessage ?? '', /警報なしとは断定できません/);
});

test('parseJmaWarning marks stale timestamps and classifies special warnings accurately', () => {
  const now = Date.parse('2026-11-25T12:00:00+09:00');
  const staleWarningPayload = {
    reportDatetime: '2026-05-28T10:16:00+09:00',
    publishingOffice: '気象庁',
    headlineText: '大雨特別警報を発表',
    areaTypes: [
      {
        areas: [
          {
            code: '130010',
            warnings: [
              { code: '33', status: '発表' },
              { code: '03', status: '継続' },
              { code: '20', status: '解除' },
            ],
          },
          {
            code: '130020',
            warnings: [{ status: '発表警報・注意報はなし' }],
          },
        ],
      },
    ],
  };

  const bundle = parseJmaWarning(
    staleWarningPayload,
    tokyoOffice,
    { '130010': '東京地方', '130020': '伊豆諸島北部' },
    new Date(now),
    now,
  );

  assert.equal(bundle.meta.status, 'stale');
  assert.equal(bundle.meta.isStale, true);
  assert.equal(bundle.activeSpecialWarnings.length, 1);
  assert.equal(bundle.activeSpecialWarnings[0].name, '大雨特別警報');
  assert.equal(bundle.activeWarnings.length, 1);
  // 解除 item should remain visible in areaGroups[0].items but NOT in activeAdvisories
  assert.equal(bundle.activeAdvisories.length, 0);
  assert.equal(bundle.areaGroups[0].items.length, 3);
  assert.equal(bundle.areaGroups[1].hasNoWarningsFlag, true);
});

test('parseJmaWarning merges Reiwa 8 hazard blocks and validates liveness via systemControlDatetime', () => {
  const now = Date.parse('2026-11-25T12:50:00+09:00');
  const r8Payload = [
    {
      controlDatetime: '2026-11-05T04:45:15Z',
      reportDatetime: '2026-11-05T13:45:00+09:00',
      publishingOffice: '気象庁',
      headlineText: '注意報を解除します。',
      warning: {
        class10Items: [
          { areaCode: '130010', kinds: [{ status: '発表警報・注意報はなし' }] },
          { areaCode: '130030', kinds: [{ code: '10', status: '解除' }] },
        ],
      },
    },
    {
      controlDatetime: '2026-11-25T02:51:09Z',
      reportDatetime: '2026-11-25T11:51:00+09:00',
      publishingOffice: '気象庁',
      headlineText: '東京地方では、空気の乾燥した状態が続くため、火の取り扱いに注意してください。',
      warning: {
        class10Items: [
          { areaCode: '130010', kinds: [{ code: '21', status: '継続' }] },
          { areaCode: '130030', kinds: [{ code: '15', status: '継続' }] },
        ],
      },
    },
  ];

  const bundle = parseJmaWarning(
    r8Payload,
    tokyoOffice,
    { '130010': '東京地方', '130030': '伊豆諸島南部' },
    new Date(now),
    now,
    '2026-11-25T03:48:06Z',
  );

  assert.equal(bundle.meta.status, 'ok');
  assert.equal(bundle.meta.isStale, false);
  assert.equal(bundle.meta.publishedAt, '2026-11-25T11:51:00+09:00');
  assert.equal(bundle.activeAdvisories.length, 2);
  // Old 2026-11-05 cleared item (code 10) should be omitted from active/recent badges
  assert.equal(bundle.areaGroups[1].items.length, 1);
  assert.equal(bundle.areaGroups[1].items[0].name, '強風注意報');
});

test('parseJmaWarning parses JMAXML VPWW53 XML fallback cleanly', () => {
  const now = Date.parse('2026-11-25T12:50:00+09:00');
  const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
  <Report xmlns="http://xml.kishou.go.jp/jmaxml1/">
    <Control><PublishingOffice>気象庁</PublishingOffice></Control>
    <Head><ReportDateTime>2026-11-25T11:51:00+09:00</ReportDateTime>
      <Headline><Text>東京地方では乾燥注意報を発表中。</Text></Headline>
    </Head>
    <Body>
      <Warning type="気象警報・注意報（一次細分区域等）">
        <Item>
          <Kind><Name>乾燥注意報</Name><Code>21</Code><Status>継続</Status></Kind>
          <Area><Name>東京地方</Name><Code>130010</Code></Area>
        </Item>
      </Warning>
    </Body>
  </Report>`;

  const bundle = parseJmaWarning(sampleXml, tokyoOffice, {}, new Date(now), now);
  assert.equal(bundle.meta.status, 'ok');
  assert.equal(bundle.activeAdvisories.length, 1);
  assert.equal(bundle.activeAdvisories[0].name, '乾燥注意報');
});

test('parseJmaForecast parses short-term, PoP slots, and weekly forecast including empty day-0 temps', () => {
  const now = Date.parse('2026-11-25T12:00:00+09:00');
  const sampleForecast = [
    {
      publishingOffice: '気象庁',
      reportDatetime: '2026-11-25T11:00:00+09:00',
      timeSeries: [
        {
          timeDefines: ['2026-11-25T11:00:00+09:00', '2026-11-26T00:00:00+09:00'],
          areas: [
            {
              area: { name: '東京地方', code: '130010' },
              weatherCodes: ['100', '111'],
              weathers: ['晴れ', '晴れ　夕方　から　くもり'],
              winds: ['南の風', '北の風'],
              waves: ['０．５メートル', '０．５メートル'],
            },
          ],
        },
        {
          timeDefines: ['2026-11-25T12:00:00+09:00', '2026-11-25T18:00:00+09:00'],
          areas: [
            {
              area: { name: '東京地方', code: '130010' },
              pops: ['10', '20'],
            },
          ],
        },
        {
          timeDefines: [
            '2026-11-25T09:00:00+09:00',
            '2026-11-25T00:00:00+09:00',
            '2026-11-26T00:00:00+09:00',
            '2026-11-26T09:00:00+09:00',
          ],
          areas: [
            {
              area: { name: '東京', code: '44132' },
              temps: ['15', '15', '5', '16'],
            },
          ],
        },
      ],
    },
    {
      publishingOffice: '気象庁',
      reportDatetime: '2026-11-25T11:00:00+09:00',
      timeSeries: [
        {
          timeDefines: ['2026-11-26T00:00:00+09:00', '2026-11-27T00:00:00+09:00'],
          areas: [
            {
              area: { name: '東京地方', code: '130010' },
              weatherCodes: ['111', '202'],
              pops: ['', '50'],
              reliabilities: ['', 'B'],
            },
          ],
        },
        {
          timeDefines: ['2026-11-26T00:00:00+09:00', '2026-11-27T00:00:00+09:00'],
          areas: [
            {
              area: { name: '東京', code: '44132' },
              tempsMin: ['', '11'],
              tempsMax: ['', '21'],
            },
          ],
        },
      ],
    },
  ];

  const parsed = parseJmaForecast(sampleForecast, tokyoOffice, '130010', new Date(now), now);
  assert.equal(parsed.meta.status, 'ok');
  assert.equal(parsed.shortDays.length, 2);
  assert.equal(parsed.shortDays[1].tempMin, 5);
  assert.equal(parsed.shortDays[1].tempMax, 16);
  assert.equal(parsed.popSlots[0].pop, 10);
  assert.equal(parsed.weeklyDays[0].tempMin, null);
  assert.equal(parsed.weeklyDays[1].tempMin, 11);
  assert.equal(parsed.weeklyDays[1].tempMax, 21);
});

test('parseAmedasObservation decodes valid observation tuples and ignores flagged bad sensors', () => {
  const now = Date.parse('2026-11-25T12:35:00+09:00');
  const mapJson = {
    '44132': {
      temp: [13.8, 0],
      humidity: [30, 0],
      normalPressure: [1014.2, 0],
      pressure: [1011.3, 0],
      wind: [2.4, 0],
      windDirection: [16, 0],
      precipitation1h: [0, 0],
      precipitation24h: [4, 0],
    },
  };
  const obs = parseAmedasObservation(
    mapJson,
    tokyoOffice,
    '2026-11-25T12:30:00+09:00',
    new Date(now),
    now,
  );
  assert.equal(obs.meta.status, 'ok');
  assert.equal(obs.tempC, 13.8);
  assert.equal(obs.pressureHpa, 1014.2);
  assert.equal(obs.windDirectionText, '北');
});

test('parseOpenMeteoBundle slices 24h hourly points and derives distinct model notes', () => {
  const now = Date.parse('2026-11-25T12:15:00+09:00');
  const times: string[] = [];
  const temps: number[] = [];
  const pops: number[] = [];
  const precip: number[] = [];
  const codes: number[] = [];
  for (let h = 0; h < 36; h++) {
    const day = h < 24 ? '25' : '26';
    const hour = String(h % 24).padStart(2, '0');
    times.push(`2026-11-${day}T${hour}:00`);
    temps.push(10 + (h % 10));
    pops.push(h === 15 ? 80 : 10);
    precip.push(h === 15 ? 22 : 0);
    codes.push(1);
  }

  const bundle = parseOpenMeteoBundle(
    {
      current: {
        time: '2026-11-25T12:00',
        temperature_2m: 14.5,
        relative_humidity_2m: 42,
        pressure_msl: 1015.1,
        surface_pressure: 1012.0,
        wind_speed_10m: 3.1,
        wind_direction_10m: 180,
        precipitation: 0,
        weather_code: 1,
      },
      hourly: {
        time: times,
        temperature_2m: temps,
        precipitation_probability: pops,
        precipitation: precip,
        weather_code: codes,
      },
      daily: {
        time: ['2026-11-25', '2026-11-26'],
        weather_code: [1, 61],
        temperature_2m_max: [16, 14],
        temperature_2m_min: [7, 8],
        precipitation_sum: [0, 12],
        precipitation_probability_max: [10, 80],
      },
    },
    new Date(now),
    now,
  );

  assert.equal(bundle.meta.status, 'ok');
  assert.equal(bundle.hourly24h.length, 24);
  assert.equal(bundle.hourly24h[0].hourLabel, '12:00');
  assert.equal(bundle.current?.windDirectionText, '南');

  const notes = deriveModelAdvisoryNotes(bundle);
  assert.ok(notes.some((n) => n.id === 'model_rain'));
});
