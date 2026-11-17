import { useState } from 'react';
import {
  CheckCircle2,
  Download,
  Film,
  Loader2,
  Music,
  AlertCircle,
  Play,
} from 'lucide-react';
import {
  formatBytes,
  formatDuration,
  sanitizeFilename,
  type DownloadHistoryItem,
  type VideoInfoResult,
} from '../utils/youtube';
import type { TranslationBundle } from '../utils/i18n';
import { AdSlot } from './AdSlot';

interface VideoResultCardProps {
  video: VideoInfoResult;
  t: TranslationBundle;
  onDownloadCompleted: (item: DownloadHistoryItem) => void;
}

export function VideoResultCard({ video, t, onDownloadCompleted }: VideoResultCardProps) {
  const [activeTab, setActiveTab] = useState<'video' | 'mp3'>('video');
  const [imgFailed, setImgFailed] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [downloadError, setDownloadError] = useState<string>('');
  const [readyDownload, setReadyDownload] = useState<{
    url: string;
    filename: string;
  } | null>(null);

  const handleDownload = async (
    formatId: string,
    type: 'mp4' | 'mp3' | 'm4a' | 'webm',
    qualityValue: number,
    formatLabel: string,
    estimatedBytes: number
  ) => {
    setDownloadingId(formatId);
    setDownloadStatus('idle');
    setDownloadError('');
    setReadyDownload(null);

    try {
      const params = new URLSearchParams({
        id: video.id,
        type,
        quality: String(qualityValue),
        title: video.title,
      });
      const downloadUrl = `/api/download?${params.toString()}`;
      const fileRes = await fetch(downloadUrl, { credentials: 'same-origin' });
      const fileMime = (fileRes.headers.get('content-type') || '').toLowerCase();

      if (!fileRes.ok || (!fileMime.startsWith('video/') && !fileMime.startsWith('audio/'))) {
        let message = t.workspace.errorFetch;
        if (fileMime.includes('application/json')) {
          try {
            const payload = (await fileRes.json()) as { error?: string };
            if (payload.error) message = payload.error;
          } catch {
            // ignore json parse failure
          }
        }
        throw new Error(message);
      }

      const blob = await fileRes.blob();
      const filename = sanitizeFilename(video.title, type);
      const objectUrl = URL.createObjectURL(blob);

      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = filename;
      anchor.rel = 'noopener';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      setReadyDownload({ url: downloadUrl, filename });
      setDownloadStatus('success');

      onDownloadCompleted({
        id: `${video.id}-${formatId}-${Date.now()}`,
        videoId: video.id,
        title: video.title,
        thumbnail: video.thumbnail,
        formatLabel,
        fileType: type === 'webm' ? 'm4a' : type,
        sizeText: formatBytes(blob.size || estimatedBytes),
        timestamp: Date.now(),
      });

      setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (err) {
      setDownloadStatus('error');
      setDownloadError(err instanceof Error ? err.message : t.workspace.errorFetch);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <section
      aria-label={video.title}
      data-testid="video-result-card"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm"
    >
      <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: Thumbnail & auto-detected media specs */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-sky-900 via-blue-950 to-slate-900 border border-slate-200/60 dark:border-slate-800">
            {!imgFailed ? (
              <img
                src={video.thumbnail}
                alt={video.title}
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 text-sky-200">
                <Play className="w-10 h-10 opacity-80" />
                <span className="text-xs font-medium text-center line-clamp-2">{video.title}</span>
              </div>
            )}
            <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-slate-950/85 text-white text-xs font-mono-tabular">
              {formatDuration(video.durationSeconds)}
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
              {video.title}
            </h2>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <span className="font-medium text-slate-800 dark:text-slate-200">{video.author}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular">{formatDuration(video.durationSeconds)}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular">
                {t.results.maxQualityLabel}: {video.maxQuality}
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-blue-600 dark:text-sky-400 font-medium">
                {t.workspace.watermarkFreeLabel}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-mono-tabular">
              {t.results.detectedAudioLabel}: {video.detectedAudio.summary}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.results.directStreamNote}
            </p>
          </div>
        </div>

        {/* Right column: Auto-detected Video & Audio tabs */}
        <div className="lg:col-span-7 space-y-4">
          <div
            role="tablist"
            aria-label="Download format category"
            className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'video'}
              onClick={() => setActiveTab('video')}
              className={`min-h-[44px] px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'video'
                  ? 'smartvex-gradient text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Film className="w-4 h-4 shrink-0" />
              <span className="truncate">
                {t.results.tabVideo} ({video.maxQuality})
              </span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'mp3'}
              onClick={() => setActiveTab('mp3')}
              className={`min-h-[44px] px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'mp3'
                  ? 'smartvex-gradient text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Music className="w-4 h-4 shrink-0" />
              <span className="truncate">{t.results.tabMp3}</span>
            </button>
          </div>

          <div className="hidden sm:grid grid-cols-12 gap-3 px-3 text-xs font-medium text-slate-500 dark:text-slate-400">
            <div className="col-span-4">{t.results.qualityCol}</div>
            <div className="col-span-3">{t.results.formatCol}</div>
            <div className="col-span-2 text-right">{t.results.sizeCol}</div>
            <div className="col-span-3 text-right">{t.results.actionCol}</div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden">
            {activeTab === 'video' ? (
              video.videoFormats.map((fmt) => {
                const isBusy = downloadingId === fmt.id;
                return (
                  <div
                    key={fmt.id}
                    className="grid grid-cols-1 sm:grid-cols-12 items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="sm:col-span-4 flex items-center justify-between sm:justify-start gap-2">
                      <span className="font-mono-tabular text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        {fmt.qualityLabel}
                      </span>
                      {fmt.badgeTag && (
                        <span className="text-xs font-semibold text-blue-600 dark:text-sky-400">
                          {fmt.badgeTag}
                        </span>
                      )}
                    </div>

                    <div className="sm:col-span-3 flex items-center justify-between sm:block text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                      <span>{fmt.codec}</span>
                      <span className="sm:hidden font-mono-tabular text-slate-500 dark:text-slate-400">
                        {formatBytes(fmt.estimatedBytes)}
                      </span>
                    </div>

                    <div className="hidden sm:block sm:col-span-2 text-xs sm:text-sm font-mono-tabular text-slate-600 dark:text-slate-400 sm:text-right">
                      {formatBytes(fmt.estimatedBytes)}
                    </div>

                    <div className="sm:col-span-3 flex justify-end">
                      <button
                        type="button"
                        disabled={downloadingId !== null}
                        onClick={() =>
                          handleDownload(
                            fmt.id,
                            'mp4',
                            fmt.height,
                            `MP4 ${fmt.qualityLabel}`,
                            fmt.estimatedBytes
                          )
                        }
                        aria-label={`${t.results.downloadBtn} ${fmt.qualityLabel} MP4`}
                        className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-xl smartvex-gradient text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-1.5 hover:opacity-95 disabled:opacity-60 transition-all whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {isBusy ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{t.results.preparingBtn}</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            <span>{t.results.downloadBtn}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <>
                {video.nativeAudioFormats.slice(0, 1).map((nativeFmt) => {
                  const isBusy = downloadingId === nativeFmt.id;
                  return (
                    <div
                      key={nativeFmt.id}
                      className="grid grid-cols-1 sm:grid-cols-12 items-center gap-3 px-4 py-3 bg-blue-50/40 dark:bg-blue-950/20"
                    >
                      <div className="sm:col-span-4 flex items-center justify-between sm:justify-start gap-2">
                        <span className="font-mono-tabular text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                          {nativeFmt.bitrateKbps} kbps
                        </span>
                        <span className="text-xs font-semibold text-blue-600 dark:text-sky-400">
                          {t.results.nativeAudioTag}
                        </span>
                      </div>

                      <div className="sm:col-span-3 flex items-center justify-between sm:block text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                        <span>
                          {nativeFmt.container.toUpperCase()} · {nativeFmt.codec}
                        </span>
                        <span className="sm:hidden font-mono-tabular text-slate-500 dark:text-slate-400">
                          {formatBytes(nativeFmt.estimatedBytes)}
                        </span>
                      </div>

                      <div className="hidden sm:block sm:col-span-2 text-xs sm:text-sm font-mono-tabular text-slate-600 dark:text-slate-400 sm:text-right">
                        {formatBytes(nativeFmt.estimatedBytes)}
                      </div>

                      <div className="sm:col-span-3 flex justify-end">
                        <button
                          type="button"
                          disabled={downloadingId !== null}
                          onClick={() =>
                            handleDownload(
                              nativeFmt.id,
                              nativeFmt.container,
                              nativeFmt.bitrateKbps,
                              `${nativeFmt.container.toUpperCase()} ${nativeFmt.bitrateKbps}kbps`,
                              nativeFmt.estimatedBytes
                            )
                          }
                          aria-label={`${t.results.downloadBtn} ${nativeFmt.bitrateKbps} kbps ${nativeFmt.container.toUpperCase()}`}
                          className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-xl smartvex-gradient text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-1.5 hover:opacity-95 disabled:opacity-60 transition-all whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          {isBusy ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>{t.results.preparingBtn}</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4" />
                              <span>{t.results.downloadBtn}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {video.mp3Presets.map((preset) => {
                  const isBusy = downloadingId === preset.id;
                  return (
                    <div
                      key={preset.id}
                      className="grid grid-cols-1 sm:grid-cols-12 items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="sm:col-span-4 flex items-center justify-between sm:justify-start gap-2">
                        <span className="font-mono-tabular text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                          {preset.bitrateKbps} kbps
                        </span>
                        <span className="text-xs font-medium text-blue-600 dark:text-sky-400">
                          {preset.tierLabel}
                        </span>
                      </div>

                      <div className="sm:col-span-3 flex items-center justify-between sm:block text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                        <span>MP3 · {preset.sampleRate}</span>
                        <span className="sm:hidden font-mono-tabular text-slate-500 dark:text-slate-400">
                          {formatBytes(preset.estimatedBytes)}
                        </span>
                      </div>

                      <div className="hidden sm:block sm:col-span-2 text-xs sm:text-sm font-mono-tabular text-slate-600 dark:text-slate-400 sm:text-right">
                        {formatBytes(preset.estimatedBytes)}
                      </div>

                      <div className="sm:col-span-3 flex justify-end">
                        <button
                          type="button"
                          disabled={downloadingId !== null}
                          onClick={() =>
                            handleDownload(
                              preset.id,
                              'mp3',
                              preset.bitrateKbps,
                              `MP3 ${preset.bitrateKbps}kbps`,
                              preset.estimatedBytes
                            )
                          }
                          aria-label={`${t.results.downloadBtn} ${preset.bitrateKbps} kbps MP3`}
                          className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-xl smartvex-gradient text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-1.5 hover:opacity-95 disabled:opacity-60 transition-all whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          {isBusy ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>{t.results.preparingBtn}</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4" />
                              <span>{t.results.downloadBtn}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {downloadingId !== null && (
            <div className="space-y-3 pt-1">
              <AdSlot variant="companion" t={t} />
            </div>
          )}

          {downloadStatus === 'success' && readyDownload && (
            <div
              role="status"
              className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-sm"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{t.results.readyMessage}</span>
              </div>
              <a
                href={readyDownload.url}
                download={readyDownload.filename}
                className="text-xs font-semibold underline underline-offset-4 hover:opacity-80 whitespace-nowrap"
              >
                {t.results.saveFileBtn}
              </a>
            </div>
          )}

          {downloadStatus === 'error' && (
            <div
              role="alert"
              className="flex items-center gap-2.5 p-3.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{downloadError}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
