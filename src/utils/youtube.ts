export interface VideoFormatOption {
  id: string;
  qualityLabel: string;
  height: number;
  fps: number;
  container: 'mp4' | 'webm';
  codec: string;
  estimatedBytes: number;
  hasAudioMuxed: boolean;
  itag?: number;
  badgeTag?: '4K UHD' | '2K QHD' | 'Full HD' | 'HD' | 'SD';
}

export interface NativeAudioOption {
  id: string;
  codec: 'AAC' | 'Opus' | 'Audio';
  container: 'm4a' | 'webm';
  bitrateKbps: number;
  sampleRate: string;
  channelsLabel: 'Stereo' | 'Mono';
  estimatedBytes: number;
  itag?: number;
}

export interface DetectedAudioProfile {
  codec: 'AAC' | 'Opus' | 'Audio';
  bitrateKbps: number;
  sampleRate: string;
  channelsLabel: 'Stereo' | 'Mono';
  summary: string;
}

export interface Mp3PresetOption {
  id: string;
  bitrateKbps: 320 | 256 | 192 | 128;
  container: 'mp3';
  sampleRate: string;
  estimatedBytes: number;
  tierLabel: 'Studio Master' | 'High Fidelity' | 'Balanced' | 'Compact';
  recommended?: boolean;
}

export interface VideoInfoResult {
  id: string;
  url: string;
  title: string;
  author: string;
  durationSeconds: number;
  thumbnail: string;
  viewCount?: number;
  watermarkFree: true;
  maxQuality: string;
  maxHeight: number;
  detectedAudio: DetectedAudioProfile;
  videoFormats: VideoFormatOption[];
  nativeAudioFormats: NativeAudioOption[];
  mp3Presets: Mp3PresetOption[];
  sourceMode: 'live';
}

export interface DownloadHistoryItem {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  formatLabel: string;
  fileType: 'mp4' | 'mp3' | 'm4a';
  sizeText: string;
  timestamp: number;
}

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'www.youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);

const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

export function extractYouTubeId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  if (VIDEO_ID_REGEX.test(trimmed)) {
    return trimmed;
  }

  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }

  const host = parsed.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.has(host)) {
    return null;
  }

  if (host === 'youtu.be' || host === 'www.youtu.be') {
    const slug = parsed.pathname.replace(/^\/+/, '').split('/')[0] ?? '';
    return VIDEO_ID_REGEX.test(slug) ? slug : null;
  }

  const vParam = parsed.searchParams.get('v');
  if (vParam && VIDEO_ID_REGEX.test(vParam)) {
    return vParam;
  }

  const pathParts = parsed.pathname.split('/').filter(Boolean);
  if (pathParts.length >= 2) {
    const prefix = pathParts[0];
    const maybeId = pathParts[1];
    if (
      (prefix === 'shorts' || prefix === 'embed' || prefix === 'live' || prefix === 'v') &&
      VIDEO_ID_REGEX.test(maybeId)
    ) {
      return maybeId;
    }
  }

  return null;
}

export function isValidYouTubeUrl(input: string): boolean {
  return extractYouTubeId(input) !== null;
}

export function normalizeYouTubeUrl(input: string): string | null {
  const id = extractYouTubeId(input);
  return id ? `https://www.youtube.com/watch?v=${id}` : null;
}

export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '—';
  }
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  const precision = value >= 100 || index === 0 ? 0 : 1;
  return `${value.toFixed(precision)} ${units[index]}`;
}

export function estimateBytesFromBitrate(bitrateKbps: number, durationSeconds: number): number {
  const safeDuration = Math.max(10, durationSeconds || 180);
  return Math.round(((bitrateKbps * 1000) / 8) * safeDuration);
}

export interface RawAdaptiveFormat {
  itag?: number;
  height?: number;
  fps?: number;
  quality_label?: string;
  mime_type?: string;
  bitrate?: number;
  content_length?: string | number;
  audio_sample_rate?: number | string;
  audio_channels?: number;
  has_video?: boolean;
  has_audio?: boolean;
  url?: string;
}

function getBadgeForHeight(height: number): VideoFormatOption['badgeTag'] {
  if (height >= 2160) return '4K UHD';
  if (height >= 1440) return '2K QHD';
  if (height >= 1080) return 'Full HD';
  if (height >= 720) return 'HD';
  return 'SD';
}

function defaultBitrateForHeight(height: number): number {
  if (height >= 2160) return 18000;
  if (height >= 1440) return 9500;
  if (height >= 1080) return 4500;
  if (height >= 720) return 2400;
  if (height >= 480) return 1100;
  return 650;
}

export function buildVideoFormatOptions(
  rawFormats: RawAdaptiveFormat[],
  durationSeconds: number
): VideoFormatOption[] {
  const byResolution = new Map<number, VideoFormatOption>();

  for (const fmt of rawFormats) {
    const height = fmt.height ?? 0;
    if (height < 240) continue;

    const mime = (fmt.mime_type ?? '').toLowerCase();
    const isVideo =
      mime.includes('video') ||
      (fmt.has_video !== false && Boolean(fmt.quality_label) && !mime.includes('audio'));
    if (!isVideo) continue;

    const fps = fmt.fps && fmt.fps >= 50 ? 60 : 30;
    const isMp4 = mime.includes('mp4');
    const codec = mime.includes('av01')
      ? 'AV1'
      : mime.includes('vp9') || mime.includes('vp09')
        ? 'VP9'
        : 'H.264';

    const rawBytes = Number(fmt.content_length ?? 0);
    const estimatedBytes =
      Number.isFinite(rawBytes) && rawBytes > 0
        ? rawBytes + estimateBytesFromBitrate(128, durationSeconds)
        : estimateBytesFromBitrate(defaultBitrateForHeight(height), durationSeconds);

    const candidate: VideoFormatOption = {
      id: `mp4-${height}`,
      qualityLabel: `${height}p${fps === 60 ? '60' : ''}`,
      height,
      fps,
      container: 'mp4',
      codec: isMp4 ? `${codec} · MP4` : `${codec} → MP4`,
      estimatedBytes,
      hasAudioMuxed: true,
      itag: fmt.itag,
      badgeTag: getBadgeForHeight(height),
    };

    const existing = byResolution.get(height);
    if (!existing) {
      byResolution.set(height, candidate);
    } else {
      const existingIsH264 = existing.codec.startsWith('H.264');
      const candidateIsH264 = codec === 'H.264';
      const preferCandidate =
        candidate.fps > existing.fps ||
        (candidate.fps === existing.fps && candidateIsH264 && !existingIsH264);
      if (preferCandidate) {
        byResolution.set(height, candidate);
      }
    }
  }

  return Array.from(byResolution.values()).sort((a, b) => b.height - a.height);
}

export function detectAudioProfileAndNativeFormats(
  rawFormats: RawAdaptiveFormat[],
  durationSeconds: number
): {
  detectedAudio: DetectedAudioProfile;
  nativeAudioFormats: NativeAudioOption[];
} {
  const audioCandidates = rawFormats.filter((fmt) => {
    const mime = (fmt.mime_type ?? '').toLowerCase();
    return mime.includes('audio');
  });

  const mapped: NativeAudioOption[] = [];
  const seenKeys = new Set<string>();

  for (const fmt of audioCandidates) {
    const mime = (fmt.mime_type ?? '').toLowerCase();
    const isOpus = mime.includes('opus') || mime.includes('webm');
    const codec: NativeAudioOption['codec'] = isOpus ? 'Opus' : mime.includes('mp4a') ? 'AAC' : 'Audio';
    const container: NativeAudioOption['container'] = isOpus ? 'webm' : 'm4a';
    const bitrateKbps = Math.max(48, Math.round((fmt.bitrate ?? 128000) / 1000));
    const srNum = Number(fmt.audio_sample_rate ?? 44100);
    const sampleRate = srNum >= 48000 ? '48 kHz' : srNum >= 44100 ? '44.1 kHz' : `${(srNum / 1000).toFixed(1)} kHz`;
    const channelsLabel: 'Stereo' | 'Mono' = (fmt.audio_channels ?? 2) === 1 ? 'Mono' : 'Stereo';
    const rawBytes = Number(fmt.content_length ?? 0);
    const estimatedBytes =
      Number.isFinite(rawBytes) && rawBytes > 0
        ? rawBytes
        : estimateBytesFromBitrate(bitrateKbps, durationSeconds);

    const key = `${codec}-${bitrateKbps}`;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);

    mapped.push({
      id: `native-${container}-${bitrateKbps}`,
      codec,
      container,
      bitrateKbps,
      sampleRate,
      channelsLabel,
      estimatedBytes,
      itag: fmt.itag,
    });
  }

  mapped.sort((a, b) => b.bitrateKbps - a.bitrateKbps);

  const primary = mapped[0];
  if (!primary) {
    const fallbackProfile: DetectedAudioProfile = {
      codec: 'AAC',
      bitrateKbps: 128,
      sampleRate: '44.1 kHz',
      channelsLabel: 'Stereo',
      summary: 'AAC · 128 kbps · 44.1 kHz · Stereo',
    };
    return {
      detectedAudio: fallbackProfile,
      nativeAudioFormats: [],
    };
  }

  return {
    detectedAudio: {
      codec: primary.codec,
      bitrateKbps: primary.bitrateKbps,
      sampleRate: primary.sampleRate,
      channelsLabel: primary.channelsLabel,
      summary: `${primary.codec} · ${primary.bitrateKbps} kbps · ${primary.sampleRate} · ${primary.channelsLabel}`,
    },
    nativeAudioFormats: mapped,
  };
}

export function buildMp3Presets(
  durationSeconds: number,
  sourceBitrateKbps = 128
): Mp3PresetOption[] {
  const allPresets: Array<{
    bitrateKbps: 320 | 256 | 192 | 128;
    tierLabel: Mp3PresetOption['tierLabel'];
    minSourceKbps: number;
  }> = [
    { bitrateKbps: 320, tierLabel: 'Studio Master', minSourceKbps: 192 },
    { bitrateKbps: 256, tierLabel: 'High Fidelity', minSourceKbps: 150 },
    { bitrateKbps: 192, tierLabel: 'Balanced', minSourceKbps: 96 },
    { bitrateKbps: 128, tierLabel: 'Compact', minSourceKbps: 0 },
  ];

  const eligible = allPresets.filter((p) => sourceBitrateKbps >= p.minSourceKbps);
  const chosen = eligible.length > 0 ? eligible : [allPresets[allPresets.length - 1]];

  return chosen.map((preset, index) => ({
    id: `mp3-${preset.bitrateKbps}`,
    bitrateKbps: preset.bitrateKbps,
    container: 'mp3',
    sampleRate: '44.1 kHz',
    estimatedBytes: estimateBytesFromBitrate(preset.bitrateKbps, durationSeconds),
    tierLabel: preset.tierLabel,
    recommended: index === 0,
  }));
}

export function sanitizeFilename(title: string, ext: string): string {
  const cleaned = title
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
  const base = cleaned || 'smartvex-media';
  return `${base}.${ext}`;
}
