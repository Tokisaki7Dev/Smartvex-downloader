import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractYouTubeId,
  isValidYouTubeUrl,
  normalizeYouTubeUrl,
  formatDuration,
  formatBytes,
  buildVideoFormatOptions,
  detectAudioProfileAndNativeFormats,
  buildMp3Presets,
  sanitizeFilename,
} from './youtube';

test('extractYouTubeId handles standard, short, shorts, music, and raw IDs', () => {
  assert.equal(extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ?t=42'), 'dQw4w9WgXcQ');
  assert.equal(extractYouTubeId('https://www.youtube.com/shorts/aqz-KE-bpKQ'), 'aqz-KE-bpKQ');
  assert.equal(extractYouTubeId('https://music.youtube.com/watch?v=kJQP7kiw5Fk'), 'kJQP7kiw5Fk');
  assert.equal(extractYouTubeId('youtube.com/watch?v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(extractYouTubeId('dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
});

test('isValidYouTubeUrl rejects invalid hosts and malformed links', () => {
  assert.equal(isValidYouTubeUrl(''), false);
  assert.equal(isValidYouTubeUrl('https://vimeo.com/123456'), false);
  assert.equal(isValidYouTubeUrl('https://www.youtube.com/watch?v=short'), false);
  assert.equal(isValidYouTubeUrl('not a url'), false);
  assert.equal(normalizeYouTubeUrl('https://youtu.be/dQw4w9WgXcQ'), 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
});

test('formatDuration and formatBytes produce clean tabular strings', () => {
  assert.equal(formatDuration(213), '3:33');
  assert.equal(formatDuration(3661), '1:01:01');
  assert.equal(formatDuration(0), '0:00');
  assert.equal(formatBytes(0), '—');
  assert.equal(formatBytes(1048576 * 42.5), '42.5 MB');
  assert.equal(formatBytes(1073741824 * 1.4), '1.4 GB');
});

test('buildVideoFormatOptions never invents 4K on a 1080p-only video and returns empty on empty input', () => {
  assert.deepEqual(buildVideoFormatOptions([], 200), []);

  const options1080 = buildVideoFormatOptions(
    [
      { itag: 137, height: 1080, fps: 30, mime_type: 'video/mp4; codecs="avc1"', content_length: '50000000' },
      { itag: 136, height: 720, fps: 30, mime_type: 'video/mp4; codecs="avc1"', content_length: '25000000' },
      { itag: 18, height: 360, fps: 30, mime_type: 'video/mp4', content_length: '12000000' },
    ],
    213
  );

  assert.equal(options1080[0].height, 1080);
  assert.equal(options1080[0].qualityLabel, '1080p');
  assert.equal(options1080.some((o) => o.height >= 1440), false);
});

test('buildVideoFormatOptions deduplicates 4K resolutions and detects vp09', () => {
  const options = buildVideoFormatOptions(
    [
      { itag: 137, height: 1080, fps: 30, mime_type: 'video/mp4; codecs="avc1"', content_length: '50000000' },
      { itag: 313, height: 2160, fps: 30, mime_type: 'video/mp4; codecs="vp09.00.51"', content_length: '250000000' },
      { itag: 315, height: 2160, fps: 60, mime_type: 'video/webm; codecs="vp9"', content_length: '320000000' },
      { itag: 18, height: 360, fps: 30, mime_type: 'video/mp4', content_length: '12000000' },
      { itag: 160, height: 144, fps: 30, mime_type: 'video/mp4' },
    ],
    213
  );

  assert.equal(options[0].height, 2160);
  assert.equal(options[0].qualityLabel, '2160p60');
  assert.equal(options[0].badgeTag, '4K UHD');
  assert.ok(options[0].codec.startsWith('VP9'));
  assert.equal(options.some((o) => o.height === 144), false);
});

test('detectAudioProfileAndNativeFormats auto-detects audio codec/bitrate and adapts MP3 presets', () => {
  const { detectedAudio, nativeAudioFormats } = detectAudioProfileAndNativeFormats(
    [
      { itag: 139, mime_type: 'audio/mp4; codecs="mp4a.40.5"', bitrate: 50152, audio_sample_rate: 22050, audio_channels: 2 },
      { itag: 140, mime_type: 'audio/mp4; codecs="mp4a.40.2"', bitrate: 131000, audio_sample_rate: 44100, audio_channels: 2 },
    ],
    213
  );

  assert.equal(detectedAudio.codec, 'AAC');
  assert.equal(detectedAudio.bitrateKbps, 131);
  assert.equal(detectedAudio.sampleRate, '44.1 kHz');
  assert.equal(detectedAudio.channelsLabel, 'Stereo');
  assert.equal(nativeAudioFormats.length, 2);

  const mp3For131 = buildMp3Presets(180, 131);
  assert.deepEqual(mp3For131.map((p) => p.bitrateKbps), [192, 128]);

  const mp3For256 = buildMp3Presets(180, 256);
  assert.deepEqual(mp3For256.map((p) => p.bitrateKbps), [320, 256, 192, 128]);

  assert.equal(sanitizeFilename('Hello: World? / 4K*', 'mp3'), 'Hello World 4K.mp3');
});
