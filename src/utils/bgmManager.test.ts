import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BUILTIN_BGM_TRACKS,
  DEFAULT_BGM_SETTINGS,
  buildSpotifyEmbedUrl,
  buildYoutubeEmbedUrl,
  clampBgmVolume,
  createLocalMediaBgmTrack,
  getAllBgmTracks,
  getYoutubePlayerErrorCodeHint,
  isEmbeddableYoutubePlaylistId,
  parseExternalBgmUrl,
  resolveSelectedBgmTrack,
  validateBgmMediaFile,
} from './bgmManager';

test('parseExternalBgmUrl parses standard YouTube watch URL cleanly without unembeddable RD mix lists', () => {
  const res = parseExternalBgmUrl(
    'https://www.youtube.com/watch?v=aqz-KE-bpKQ&list=RDaqz-KE-bpKQ&start_radio=1',
    'Big Buck Bunny',
  );
  assert.equal(res.ok, true);
  if (!res.ok) return;
  assert.equal(res.track.source, 'youtube');
  assert.equal(res.track.title, 'Big Buck Bunny');
  assert.equal(res.track.youtubeVideoId, 'aqz-KE-bpKQ');
  assert.equal(res.track.youtubePlaylistId, undefined);
  assert.ok(res.track.embedUrl?.startsWith('https://www.youtube.com/embed/aqz-KE-bpKQ?'));
  assert.ok(!res.track.embedUrl?.includes('RDaqz-KE-bpKQ'));
  assert.ok(res.track.embedUrl?.includes('enablejsapi=1'));
});

test('parseExternalBgmUrl supports youtu.be, shorts, live, music.youtube.com, and pasted iframe HTML', () => {
  const shortRes = parseExternalBgmUrl('https://youtu.be/dQw4w9WgXcQ?t=12');
  assert.equal(shortRes.ok, true);
  if (shortRes.ok) {
    assert.equal(shortRes.track.youtubeVideoId, 'dQw4w9WgXcQ');
  }

  const shortsRes = parseExternalBgmUrl('https://www.youtube.com/shorts/aqz-KE-bpKQ');
  assert.equal(shortsRes.ok, true);
  if (shortsRes.ok) {
    assert.equal(shortsRes.track.youtubeVideoId, 'aqz-KE-bpKQ');
  }

  const musicRes = parseExternalBgmUrl('music.youtube.com/watch?v=5qap5aO4i9A');
  assert.equal(musicRes.ok, true);
  if (musicRes.ok) {
    assert.equal(musicRes.track.youtubeVideoId, '5qap5aO4i9A');
  }

  const iframeRes = parseExternalBgmUrl(
    '<iframe width="560" height="315" src="https://www.youtube.com/embed/aqz-KE-bpKQ?si=abc" allowfullscreen></iframe>',
  );
  assert.equal(iframeRes.ok, true);
  if (iframeRes.ok) {
    assert.equal(iframeRes.track.youtubeVideoId, 'aqz-KE-bpKQ');
  }
});

test('isEmbeddableYoutubePlaylistId accepts PL playlists and rejects RD/WL/LL mixes', () => {
  assert.equal(isEmbeddableYoutubePlaylistId('PL1234567890abcdef'), true);
  assert.equal(isEmbeddableYoutubePlaylistId('RDaqz-KE-bpKQ'), false);
  assert.equal(isEmbeddableYoutubePlaylistId('WL'), false);
  assert.equal(isEmbeddableYoutubePlaylistId('LL'), false);
  assert.equal(getYoutubePlayerErrorCodeHint(150), 'embed_blocked');
  assert.equal(getYoutubePlayerErrorCodeHint(153), 'embed_blocked');
  assert.equal(getYoutubePlayerErrorCodeHint(100), 'not_found');
});

test('parseExternalBgmUrl parses Spotify track, playlist, intl-ja URL, iframe HTML, and spotify URI', () => {
  const trackRes = parseExternalBgmUrl(
    'https://open.spotify.com/intl-ja/track/4cOdK2wGLETKBW3PvgPWqT?si=12345',
    'Calm Track',
  );
  assert.equal(trackRes.ok, true);
  if (trackRes.ok) {
    assert.equal(trackRes.track.source, 'spotify');
    assert.equal(trackRes.track.spotifyKind, 'track');
    assert.equal(trackRes.track.spotifyId, '4cOdK2wGLETKBW3PvgPWqT');
    assert.equal(
      trackRes.track.embedUrl,
      buildSpotifyEmbedUrl('track', '4cOdK2wGLETKBW3PvgPWqT'),
    );
  }

  const uriRes = parseExternalBgmUrl('spotify:playlist:37i9dQZF1DX4WYpdgoIcn6');
  assert.equal(uriRes.ok, true);
  if (uriRes.ok) {
    assert.equal(uriRes.track.source, 'spotify');
    assert.equal(uriRes.track.spotifyKind, 'playlist');
    assert.equal(
      uriRes.track.embedUrl,
      'https://open.spotify.com/embed/playlist/37i9dQZF1DX4WYpdgoIcn6?utm_source=generator&theme=0',
    );
  }
});

test('parseExternalBgmUrl rejects empty, invalid, and unsupported URLs', () => {
  assert.deepEqual(parseExternalBgmUrl('   '), { ok: false, errorCode: 'empty' });
  assert.deepEqual(parseExternalBgmUrl('https://example.com/music.mp3'), {
    ok: false,
    errorCode: 'unsupported_provider',
  });
  assert.deepEqual(parseExternalBgmUrl('https://www.youtube.com/watch?v=short'), {
    ok: false,
    errorCode: 'invalid_url',
  });
});

test('validateBgmMediaFile & createLocalMediaBgmTrack accept .mp3 and .mp4 and reject others', () => {
  assert.deepEqual(validateBgmMediaFile({ name: 'ambient.mp3', type: 'audio/mpeg' }), {
    ok: true,
    source: 'mp3',
    cleanTitle: 'ambient',
  });
  assert.deepEqual(validateBgmMediaFile({ name: 'CityNight.MP4', type: 'video/mp4' }), {
    ok: true,
    source: 'mp4',
    cleanTitle: 'CityNight',
  });
  assert.deepEqual(validateBgmMediaFile({ name: 'photo.png', type: 'image/png' }), {
    ok: false,
    errorCode: 'unsupported_format',
  });

  const track = createLocalMediaBgmTrack({
    name: 'rain_loop.mp3',
    type: 'audio/mpeg',
    size: 2_621_440,
  });
  assert.ok(track);
  assert.equal(track?.source, 'mp3');
  assert.equal(track?.title, 'rain_loop');
  assert.equal(track?.subtitle, 'MP3 · 2.5 MB');
});

test('clampBgmVolume & resolveSelectedBgmTrack enforce safe defaults', () => {
  assert.equal(clampBgmVolume(-10), 0);
  assert.equal(clampBgmVolume(140), 100);
  assert.equal(clampBgmVolume(52.6), 53);
  assert.equal(clampBgmVolume(Number.NaN), DEFAULT_BGM_SETTINGS.volume);

  const fallback = resolveSelectedBgmTrack({
    ...DEFAULT_BGM_SETTINGS,
    selectedTrackId: 'non-existent-id',
  });
  assert.equal(fallback.id, BUILTIN_BGM_TRACKS[0].id);
  assert.equal(getAllBgmTracks(DEFAULT_BGM_SETTINGS).length, BUILTIN_BGM_TRACKS.length);
  assert.ok(
    buildYoutubeEmbedUrl('aqz-KE-bpKQ', undefined, { origin: 'https://example.com' }).includes(
      'origin=https%3A%2F%2Fexample.com',
    ),
  );
});
