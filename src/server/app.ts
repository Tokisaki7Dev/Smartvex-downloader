import express from 'express';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { createRequire } from 'node:module';
import { Innertube } from 'youtubei.js';
import {
  extractYouTubeId,
  buildVideoFormatOptions,
  detectAudioProfileAndNativeFormats,
  buildMp3Presets,
  sanitizeFilename,
  type RawAdaptiveFormat,
  type VideoInfoResult,
} from '../utils/youtube.ts';
import {
  mapCountryToLocale,
  resolveLocaleFromAcceptLanguage,
  type LocaleInfo,
} from '../utils/i18n.ts';

const require = createRequire(import.meta.url);
let bundledFfmpegPath: string | null = null;
try {
  bundledFfmpegPath = require('ffmpeg-static') as string | null;
} catch {
  bundledFfmpegPath = null;
}

const FFMPEG_BIN =
  process.env.FFMPEG_PATH ||
  (bundledFfmpegPath && fs.existsSync(bundledFfmpegPath) ? bundledFfmpegPath : 'ffmpeg');

const IOS_UA =
  'com.google.ios.youtube/19.29.1 (iPhone16,2; U; CPU iOS 17_5_1 like Mac OS X;)';

let ytClientPromise: Promise<Innertube> | null = null;
const ipCountryCache = new Map<string, { country: string; expiresAt: number }>();

interface PreparedFileEntry {
  filePath: string;
  filename: string;
  mimeType: string;
  size: number;
  expiresAt: number;
}

const preparedFiles = new Map<string, PreparedFileEntry>();

setInterval(() => {
  const now = Date.now();
  for (const [token, entry] of preparedFiles.entries()) {
    if (entry.expiresAt <= now) {
      preparedFiles.delete(token);
      fs.unlink(entry.filePath, () => {});
    }
  }
}, 60_000).unref();

function getInnertube(): Promise<Innertube> {
  if (!ytClientPromise) {
    const cookie = process.env.YOUTUBE_COOKIE?.trim() || undefined;
    ytClientPromise = Innertube.create({ cookie }).catch((err) => {
      ytClientPromise = null;
      throw err;
    });
  }
  return ytClientPromise;
}

function getClientIp(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim();
  }
  return req.socket.remoteAddress ?? '';
}

function isPrivateIp(ip: string): boolean {
  if (!ip) return true;
  const clean = ip.replace(/^::ffff:/, '');
  return (
    clean === '127.0.0.1' ||
    clean === '::1' ||
    clean.startsWith('10.') ||
    clean.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(clean)
  );
}

async function lookupCountryByIp(ip: string): Promise<string | null> {
  if (isPrivateIp(ip)) return null;

  const cached = ipCountryCache.get(ip);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.country;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1600);
    const res = await fetch(
      `https://ipwho.is/${encodeURIComponent(ip)}?fields=success,country_code`,
      { signal: controller.signal }
    );
    clearTimeout(timer);

    if (!res.ok) return null;
    const data = (await res.json()) as { success?: boolean; country_code?: string };
    if (data.success && data.country_code) {
      ipCountryCache.set(ip, {
        country: data.country_code,
        expiresAt: Date.now() + 1000 * 60 * 60 * 6,
      });
      return data.country_code;
    }
  } catch {
    return null;
  }
  return null;
}

class MediaResolutionError extends Error {
  code: 'YOUTUBE_BOT_CHECK' | 'NO_STREAMS';
  constructor(code: 'YOUTUBE_BOT_CHECK' | 'NO_STREAMS', message: string) {
    super(message);
    this.code = code;
  }
}

async function fetchPlayableBasicInfo(videoId: string) {
  const yt = await getInnertube();

  for (const client of ['IOS', 'ANDROID'] as const) {
    try {
      const info = await yt.getBasicInfo(videoId, { client });
      const adaptive = (info.streaming_data?.adaptive_formats ?? []) as RawAdaptiveFormat[];
      const muxed = (info.streaming_data?.formats ?? []) as RawAdaptiveFormat[];
      const allFormats = [...adaptive, ...muxed].filter((f) => Boolean(f.url));

      if (allFormats.length > 0) {
        return { info, allFormats };
      }

      const status = info.playability_status?.status;
      if (status === 'LOGIN_REQUIRED') {
        continue;
      }
    } catch {
      // try next client
    }
  }

  throw new MediaResolutionError(
    'YOUTUBE_BOT_CHECK',
    'YouTube blocked automated access from this server IP for this video.'
  );
}

async function resolveVideoInfo(videoId: string): Promise<VideoInfoResult> {
  const { info, allFormats } = await fetchPlayableBasicInfo(videoId);
  const basic = info.basic_info;

  const durationSeconds = Number(basic?.duration ?? 180) || 180;
  const videoFormats = buildVideoFormatOptions(allFormats, durationSeconds);
  const { detectedAudio, nativeAudioFormats } = detectAudioProfileAndNativeFormats(
    allFormats,
    durationSeconds
  );
  const mp3Presets = buildMp3Presets(durationSeconds, detectedAudio.bitrateKbps);

  if (videoFormats.length === 0 && nativeAudioFormats.length === 0) {
    throw new MediaResolutionError('NO_STREAMS', 'No playable video or audio streams detected.');
  }

  const thumbs = basic?.thumbnail ?? [];
  const bestThumb =
    thumbs[0]?.url || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
  const maxHeight = videoFormats[0]?.height ?? 0;

  return {
    id: videoId,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    title: basic?.title || 'YouTube Video',
    author: basic?.author || 'YouTube Channel',
    durationSeconds,
    thumbnail: bestThumb,
    viewCount: typeof basic?.view_count === 'number' ? basic.view_count : undefined,
    watermarkFree: true,
    maxQuality: videoFormats[0]?.qualityLabel || 'Audio',
    maxHeight,
    detectedAudio,
    videoFormats,
    nativeAudioFormats,
    mp3Presets,
    sourceMode: 'live',
  };
}

function selectVideoFormat(
  formats: RawAdaptiveFormat[],
  targetHeight: number
): RawAdaptiveFormat | null {
  const videoOnly = formats.filter((f) => {
    const mime = (f.mime_type ?? '').toLowerCase();
    return Boolean(f.url) && (f.height ?? 0) >= 240 && mime.includes('video');
  });

  if (videoOnly.length === 0) return null;

  const exactOrLower = videoOnly
    .filter((f) => (f.height ?? 0) <= targetHeight)
    .sort((a, b) => {
      const hDiff = (b.height ?? 0) - (a.height ?? 0);
      if (hDiff !== 0) return hDiff;
      const aMp4 = (a.mime_type ?? '').includes('mp4') ? 1 : 0;
      const bMp4 = (b.mime_type ?? '').includes('mp4') ? 1 : 0;
      if (bMp4 !== aMp4) return bMp4 - aMp4;
      return (b.fps ?? 30) - (a.fps ?? 30);
    });

  return exactOrLower[0] ?? videoOnly[0] ?? null;
}

function selectAudioFormat(
  formats: RawAdaptiveFormat[],
  preferContainer?: 'm4a' | 'webm'
): RawAdaptiveFormat | null {
  const audioFormats = formats
    .filter((f) => {
      const mime = (f.mime_type ?? '').toLowerCase();
      return Boolean(f.url) && mime.includes('audio');
    })
    .sort((a, b) => {
      if (preferContainer === 'webm') {
        const aWebm = (a.mime_type ?? '').includes('webm') ? 1 : 0;
        const bWebm = (b.mime_type ?? '').includes('webm') ? 1 : 0;
        if (bWebm !== aWebm) return bWebm - aWebm;
      } else {
        const aMp4 = (a.mime_type ?? '').includes('mp4') ? 1 : 0;
        const bMp4 = (b.mime_type ?? '').includes('mp4') ? 1 : 0;
        if (bMp4 !== aMp4) return bMp4 - aMp4;
      }
      return (b.bitrate ?? 0) - (a.bitrate ?? 0);
    });

  return audioFormats[0] ?? null;
}

async function downloadFormatFast(
  fmt: RawAdaptiveFormat,
  destPath: string
): Promise<void> {
  const url = fmt.url;
  if (!url) throw new Error('Missing media stream URL');

  const totalBytes = Number(fmt.content_length ?? 0);
  if (!Number.isFinite(totalBytes) || totalBytes <= 0) {
    const res = await fetch(url, { headers: { 'User-Agent': IOS_UA } });
    if (!res.ok || !res.body) {
      throw new Error(`Stream fetch failed (${res.status})`);
    }
    const readable = Readable.fromWeb(res.body as unknown as import('node:stream/web').ReadableStream);
    await pipeline(readable, fs.createWriteStream(destPath));
    return;
  }

  const chunkSize = 2 * 1024 * 1024;
  const ranges: Array<{ index: number; start: number; end: number }> = [];
  for (let start = 0, index = 0; start < totalBytes; start += chunkSize, index += 1) {
    ranges.push({
      index,
      start,
      end: Math.min(start + chunkSize - 1, totalBytes - 1),
    });
  }

  const buffers = new Array<Buffer>(ranges.length);
  const concurrency = Math.min(6, ranges.length);
  let cursor = 0;

  const worker = async () => {
    while (cursor < ranges.length) {
      const job = ranges[cursor];
      cursor += 1;
      const sep = url.includes('?') ? '&' : '?';
      const chunkUrl = `${url}${sep}range=${job.start}-${job.end}`;
      const res = await fetch(chunkUrl, { headers: { 'User-Agent': IOS_UA } });
      if (!res.ok) {
        throw new Error(`Chunk fetch failed (${res.status})`);
      }
      buffers[job.index] = Buffer.from(await res.arrayBuffer());
    }
  };

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  const fd = await fs.promises.open(destPath, 'w');
  try {
    for (const buf of buffers) {
      await fd.write(buf);
    }
  } finally {
    await fd.close();
  }
}

async function runFfmpegToFile(args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const proc = spawn(FFMPEG_BIN, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    proc.on('error', (err) => reject(err));
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}: ${stderr.slice(-400)}`));
      }
    });
  });
}

async function prepareMediaFile(params: {
  videoId: string;
  type: 'mp4' | 'mp3' | 'm4a' | 'webm';
  quality: number;
  title: string;
}): Promise<{ token: string; entry: PreparedFileEntry }> {
  const { info, allFormats } = await fetchPlayableBasicInfo(params.videoId);
  const resolvedTitle = info.basic_info?.title || params.title;
  const token = randomUUID();
  const ext = params.type;
  const outPath = path.join(os.tmpdir(), `smartvex-ready-${token}.${ext}`);
  const tempFiles: string[] = [];

  const cleanupTemps = () => {
    for (const file of tempFiles) {
      fs.unlink(file, () => {});
    }
  };

  try {
    if (params.type === 'mp3') {
      const bitrate = [320, 256, 192, 128].includes(params.quality) ? params.quality : 192;
      const audioFmt = selectAudioFormat(allFormats);
      if (!audioFmt) throw new Error('No audio stream available for this video');

      const audioTemp = path.join(os.tmpdir(), `smartvex-a-${token}.bin`);
      tempFiles.push(audioTemp);
      await downloadFormatFast(audioFmt, audioTemp);

      await runFfmpegToFile([
        '-y',
        '-loglevel',
        'error',
        '-i',
        audioTemp,
        '-vn',
        '-acodec',
        'libmp3lame',
        '-b:a',
        `${bitrate}k`,
        '-ar',
        '44100',
        '-f',
        'mp3',
        outPath,
      ]);
      cleanupTemps();

      const stat = await fs.promises.stat(outPath);
      const entry: PreparedFileEntry = {
        filePath: outPath,
        filename: sanitizeFilename(resolvedTitle, 'mp3'),
        mimeType: 'audio/mpeg',
        size: stat.size,
        expiresAt: Date.now() + 10 * 60_000,
      };
      preparedFiles.set(token, entry);
      return { token, entry };
    }

    if (params.type === 'm4a' || params.type === 'webm') {
      const audioFmt = selectAudioFormat(allFormats, params.type);
      if (!audioFmt) throw new Error('No native audio stream available');

      const audioTemp = path.join(os.tmpdir(), `smartvex-na-${token}.bin`);
      tempFiles.push(audioTemp);
      await downloadFormatFast(audioFmt, audioTemp);

      if (params.type === 'm4a') {
        await runFfmpegToFile([
          '-y',
          '-loglevel',
          'error',
          '-i',
          audioTemp,
          '-vn',
          '-c:a',
          'copy',
          '-movflags',
          '+faststart',
          '-f',
          'ipod',
          outPath,
        ]);
      } else {
        await fs.promises.rename(audioTemp, outPath);
      }
      cleanupTemps();

      const stat = await fs.promises.stat(outPath);
      const entry: PreparedFileEntry = {
        filePath: outPath,
        filename: sanitizeFilename(resolvedTitle, params.type),
        mimeType: params.type === 'm4a' ? 'audio/mp4' : 'audio/webm',
        size: stat.size,
        expiresAt: Date.now() + 10 * 60_000,
      };
      preparedFiles.set(token, entry);
      return { token, entry };
    }

    const targetHeight = [2160, 1440, 1080, 720, 480, 360, 240].includes(params.quality)
      ? params.quality
      : 1080;

    const videoFmt = selectVideoFormat(allFormats, targetHeight);
    const audioFmt = selectAudioFormat(allFormats, 'm4a');

    if (!videoFmt || !audioFmt) {
      throw new Error('No downloadable video/audio streams available');
    }

    const videoTemp = path.join(os.tmpdir(), `smartvex-v-${token}.bin`);
    const audioTemp = path.join(os.tmpdir(), `smartvex-a-${token}.bin`);
    tempFiles.push(videoTemp, audioTemp);

    await Promise.all([
      downloadFormatFast(videoFmt, videoTemp),
      downloadFormatFast(audioFmt, audioTemp),
    ]);

    const audioIsMp4 = (audioFmt.mime_type ?? '').toLowerCase().includes('mp4');
    await runFfmpegToFile([
      '-y',
      '-loglevel',
      'error',
      '-i',
      videoTemp,
      '-i',
      audioTemp,
      '-map',
      '0:v:0',
      '-map',
      '1:a:0',
      '-c:v',
      'copy',
      '-c:a',
      audioIsMp4 ? 'copy' : 'aac',
      ...(audioIsMp4 ? [] : ['-b:a', '192k']),
      '-movflags',
      '+faststart',
      '-f',
      'mp4',
      outPath,
    ]);
    cleanupTemps();

    const stat = await fs.promises.stat(outPath);
    const entry: PreparedFileEntry = {
      filePath: outPath,
      filename: sanitizeFilename(resolvedTitle, 'mp4'),
      mimeType: 'video/mp4',
      size: stat.size,
      expiresAt: Date.now() + 10 * 60_000,
    };
    preparedFiles.set(token, entry);
    return { token, entry };
  } catch (err) {
    cleanupTemps();
    fs.unlink(outPath, () => {});
    throw err;
  }
}

export function createApiApp() {
  const app = express();
  app.set('trust proxy', true);
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'smartvex' });
  });

  app.get('/api/locale', async (req, res) => {
    const headerCountry =
      (req.headers['cf-ipcountry'] as string | undefined) ||
      (req.headers['x-appengine-country'] as string | undefined) ||
      (req.headers['x-vercel-ip-country'] as string | undefined) ||
      (req.headers['x-country-code'] as string | undefined) ||
      null;

    let country = headerCountry && headerCountry !== 'XX' ? headerCountry.toUpperCase() : null;
    let source: LocaleInfo['source'] = 'default';

    if (country) {
      const mapped = mapCountryToLocale(country);
      if (mapped) {
        source = 'ip';
        res.json({ locale: mapped, country, source } satisfies LocaleInfo);
        return;
      }
    }

    const clientIp = getClientIp(req);
    const ipCountry = await lookupCountryByIp(clientIp);
    if (ipCountry) {
      country = ipCountry.toUpperCase();
      const mapped = mapCountryToLocale(country);
      if (mapped) {
        source = 'ip';
        res.json({ locale: mapped, country, source } satisfies LocaleInfo);
        return;
      }
    }

    const headerLocale = resolveLocaleFromAcceptLanguage(req.headers['accept-language']);
    source = req.headers['accept-language'] ? 'header' : 'default';
    res.json({
      locale: headerLocale,
      country: country || 'AUTO',
      source,
    } satisfies LocaleInfo);
  });

  app.get('/api/info', async (req, res) => {
    const urlParam = typeof req.query.url === 'string' ? req.query.url : '';
    const videoId = extractYouTubeId(urlParam);

    if (!videoId) {
      res.status(400).json({ errorCode: 'INVALID_URL', error: 'Invalid YouTube URL' });
      return;
    }

    try {
      const info = await resolveVideoInfo(videoId);
      res.json(info);
    } catch (err) {
      if (err instanceof MediaResolutionError) {
        res.status(422).json({ errorCode: err.code, error: err.message });
        return;
      }
      const message = err instanceof Error ? err.message : 'Failed to inspect video';
      res.status(502).json({ errorCode: 'FETCH_FAILED', error: message });
    }
  });

  app.post('/api/prepare', async (req, res) => {
    const body = req.body as {
      id?: string;
      type?: string;
      quality?: number;
      title?: string;
    };

    const videoId = typeof body.id === 'string' ? extractYouTubeId(body.id) : null;
    if (!videoId) {
      res.status(400).json({ error: 'Invalid video ID' });
      return;
    }

    const type: 'mp4' | 'mp3' | 'm4a' | 'webm' =
      body.type === 'mp3'
        ? 'mp3'
        : body.type === 'm4a'
          ? 'm4a'
          : body.type === 'webm'
            ? 'webm'
            : 'mp4';

    try {
      const { token, entry } = await prepareMediaFile({
        videoId,
        type,
        quality: Number(body.quality) || (type === 'mp3' ? 192 : 1080),
        title: typeof body.title === 'string' ? body.title : 'smartvex-media',
      });
      res.json({
        token,
        filename: entry.filename,
        size: entry.size,
        mimeType: entry.mimeType,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process media';
      res.status(502).json({ error: message });
    }
  });

  app.get('/api/file/:token', (req, res) => {
    const token = req.params.token;
    const entry = preparedFiles.get(token);

    if (!entry || !fs.existsSync(entry.filePath)) {
      res.status(404).json({ error: 'Prepared file expired or not found' });
      return;
    }

    res.setHeader('Content-Type', entry.mimeType);
    res.setHeader('Content-Length', String(entry.size));
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(entry.filename)}`
    );

    const stream = fs.createReadStream(entry.filePath);
    stream.on('error', () => {
      if (!res.headersSent) res.status(500).end();
    });
    stream.pipe(res);
  });

  app.get('/api/download', async (req, res) => {
    const videoId = typeof req.query.id === 'string' ? extractYouTubeId(req.query.id) : null;
    const type: 'mp4' | 'mp3' | 'm4a' | 'webm' =
      req.query.type === 'mp3'
        ? 'mp3'
        : req.query.type === 'm4a'
          ? 'm4a'
          : req.query.type === 'webm'
            ? 'webm'
            : 'mp4';
    const qualityRaw = Number(req.query.quality);
    const rawTitle = typeof req.query.title === 'string' ? req.query.title : 'smartvex-media';

    if (!videoId) {
      res.status(400).json({ error: 'Invalid video ID' });
      return;
    }

    try {
      const { token, entry } = await prepareMediaFile({
        videoId,
        type,
        quality: qualityRaw || (type === 'mp3' ? 192 : 1080),
        title: rawTitle,
      });

      res.setHeader('Content-Type', entry.mimeType);
      res.setHeader('Content-Length', String(entry.size));
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename*=UTF-8''${encodeURIComponent(entry.filename)}`
      );

      const cleanup = () => {
        preparedFiles.delete(token);
        fs.unlink(entry.filePath, () => {});
      };

      const stream = fs.createReadStream(entry.filePath);
      stream.on('close', cleanup);
      stream.on('error', cleanup);
      res.on('close', cleanup);
      stream.pipe(res);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Download processing failed';
      if (!res.headersSent) {
        res.status(502).json({ error: message });
      }
    }
  });

  return app;
}
