import { useState, type FormEvent, type RefObject } from 'react';
import {
  AlertCircle,
  ClipboardPaste,
  Globe,
  Loader2,
  Monitor,
  Moon,
  Search,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import {
  isValidYouTubeUrl,
  type DownloadHistoryItem,
  type VideoInfoResult,
} from '../utils/youtube';
import {
  LOCALE_NAMES,
  type LocaleInfo,
  type SupportedLocale,
  type TranslationBundle,
} from '../utils/i18n';
import type { ThemeMode } from '../utils/theme';
import { AdSlot } from './AdSlot';
import { VideoResultCard } from './VideoResultCard';

interface ConverterWorkspaceProps {
  t: TranslationBundle;
  localeInfo: LocaleInfo;
  onChangeLocale: (locale: SupportedLocale) => void;
  themeMode: ThemeMode;
  onChangeTheme: (mode: ThemeMode) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  history: DownloadHistoryItem[];
  onAddHistory: (item: DownloadHistoryItem) => void;
  onClearHistory: () => void;
}

const SAMPLE_VIDEOS = [
  {
    key: 'sample4k' as const,
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
  {
    key: 'sampleMusic' as const,
    url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
  },
  {
    key: 'sampleShort' as const,
    url: 'https://www.youtube.com/shorts/aqz-KE-bpKQ',
  },
];

export function ConverterWorkspace({
  t,
  localeInfo,
  onChangeLocale,
  themeMode,
  onChangeTheme,
  inputRef,
  history,
  onAddHistory,
  onClearHistory,
}: ConverterWorkspaceProps) {
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<VideoInfoResult | null>(null);

  const inspectUrl = async (rawUrl: string) => {
    const trimmed = rawUrl.trim();
    if (!trimmed) {
      setErrorMsg(t.workspace.errorEmpty);
      return;
    }

    if (!isValidYouTubeUrl(trimmed)) {
      setErrorMsg(t.workspace.errorInvalid);
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/info?url=${encodeURIComponent(trimmed)}`, {
        credentials: 'same-origin',
      });
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(t.workspace.errorFetch);
      }
      const payload = (await response.json()) as VideoInfoResult & {
        errorCode?: string;
        error?: string;
      };
      if (!response.ok) {
        if (payload.errorCode === 'YOUTUBE_BOT_CHECK') {
          setErrorMsg(t.workspace.errorBotCheck);
          return;
        }
        throw new Error(payload.error || t.workspace.errorFetch);
      }
      setVideoInfo(payload);
    } catch (err) {
      setErrorMsg(err instanceof Error && err.message ? err.message : t.workspace.errorFetch);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void inspectUrl(urlInput);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrlInput(text);
        setErrorMsg(null);
        if (isValidYouTubeUrl(text)) {
          void inspectUrl(text);
        }
      }
    } catch {
      inputRef.current?.focus();
    }
  };

  const handleSampleClick = (sampleUrl: string) => {
    setUrlInput(sampleUrl);
    void inspectUrl(sampleUrl);
  };

  return (
    <section id="downloader" className="pt-6 pb-12 sm:pt-10 sm:pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Top Monetization Leaderboard */}
        <AdSlot variant="leaderboard" t={t} />

        {/* Workspace Controls Bar: Language Selector + Auto Dark Mode */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            <Globe className="w-4 h-4 text-blue-600 dark:text-sky-400 shrink-0" aria-hidden="true" />
            <label htmlFor="smartvex-locale-select" className="sr-only">
              {t.workspace.languageLabel}
            </label>
            <select
              id="smartvex-locale-select"
              value={localeInfo.locale}
              onChange={(e) => onChangeLocale(e.target.value as SupportedLocale)}
              className="min-h-[36px] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-medium focus:outline-2 focus:outline-blue-600 cursor-pointer"
            >
              {(Object.keys(LOCALE_NAMES) as SupportedLocale[]).map((loc) => (
                <option key={loc} value={loc}>
                  {LOCALE_NAMES[loc]}
                </option>
              ))}
            </select>
          </div>

          <div
            role="group"
            aria-label={t.workspace.themeLabel}
            className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
            {(
              [
                { id: 'auto', label: t.workspace.themeAuto, Icon: Monitor },
                { id: 'light', label: t.workspace.themeLight, Icon: Sun },
                { id: 'dark', label: t.workspace.themeDark, Icon: Moon },
              ] as const
            ).map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => onChangeTheme(id)}
                aria-pressed={themeMode === id}
                className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  themeMode === id
                    ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-sky-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Hero Typography & Primary Converter Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-8 lg:p-10 shadow-sm space-y-5 sm:space-y-6">
          <div className="max-w-3xl space-y-2.5 sm:space-y-3">
            <h1
              className="text-2xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]"
              style={{ textWrap: 'balance' }}
            >
              {t.workspace.heroTitle}
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              {t.workspace.heroSubtitle}
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-3">
            <label htmlFor="youtube-url-input" className="sr-only">
              {t.workspace.inputLabel}
            </label>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1 flex items-center">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
                <input
                  ref={inputRef}
                  id="youtube-url-input"
                  type="url"
                  inputMode="url"
                  autoComplete="off"
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder={t.workspace.inputPlaceholder}
                  className="w-full min-h-[54px] pl-11 pr-24 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow"
                />
                <div className="absolute right-2 flex items-center gap-1">
                  {urlInput ? (
                    <button
                      type="button"
                      onClick={() => {
                        setUrlInput('');
                        setErrorMsg(null);
                        inputRef.current?.focus();
                      }}
                      aria-label={t.workspace.clearBtn}
                      className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePaste}
                      className="min-h-[40px] px-3 inline-flex items-center gap-1.5 rounded-xl text-xs font-semibold text-blue-700 dark:text-sky-400 bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <ClipboardPaste className="w-3.5 h-3.5" />
                      <span>{t.workspace.pasteBtn}</span>
                    </button>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="min-h-[54px] px-7 rounded-2xl smartvex-gradient text-white text-sm sm:text-base font-bold inline-flex items-center justify-center gap-2 shadow-sm hover:opacity-95 active:scale-[0.99] disabled:opacity-60 transition-all whitespace-nowrap shrink-0 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t.workspace.analyzingBtn}</span>
                  </>
                ) : (
                  <span>{t.workspace.analyzeBtn}</span>
                )}
              </button>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </form>

          {/* Interactive quick-sample buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">
              {t.workspace.samplesTitle}
            </span>
            {SAMPLE_VIDEOS.map((sample) => (
              <button
                key={sample.key}
                type="button"
                onClick={() => handleSampleClick(sample.url)}
                className="min-h-[36px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-blue-500/50 hover:text-blue-700 dark:hover:text-sky-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {t.workspace[sample.key]}
              </button>
            ))}
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div
            aria-busy="true"
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 animate-pulse grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            <div className="lg:col-span-5 aspect-video rounded-xl bg-slate-200 dark:bg-slate-800" />
            <div className="lg:col-span-7 space-y-3">
              <div className="h-11 rounded-xl bg-slate-200 dark:bg-slate-800" />
              <div className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800/60" />
              <div className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800/60" />
              <div className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800/60" />
            </div>
          </div>
        )}

        {/* Active Video Results + High-Viewability In-Feed Ad */}
        {!loading && videoInfo && (
          <div className="space-y-6">
            <VideoResultCard
              video={videoInfo}
              t={t}
              onDownloadCompleted={onAddHistory}
            />
            <AdSlot variant="in-feed" t={t} />
          </div>
        )}

        {/* Session Download History */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {t.results.historyTitle}
            </h2>
            {history.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                className="min-h-[36px] px-3 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.results.clearHistory}</span>
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {t.results.noHistory}
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {history.map((item) => (
                <li
                  key={item.id}
                  className="py-3 flex items-center justify-between gap-4 text-xs sm:text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {item.title}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5 font-mono-tabular">
                      {item.formatLabel} · {item.sizeText}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSampleClick(`https://www.youtube.com/watch?v=${item.videoId}`)}
                    className="min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-blue-700 dark:text-sky-400 hover:bg-blue-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {t.results.downloadBtn}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
