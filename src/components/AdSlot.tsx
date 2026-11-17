import { useState } from 'react';
import { ArrowUpRight, CheckCircle2 } from 'lucide-react';
import type { TranslationBundle } from '../utils/i18n';

export type AdVariant = 'leaderboard' | 'in-feed' | 'companion';

interface AdSlotProps {
  variant: AdVariant;
  t: TranslationBundle;
}

export function AdSlot({ variant, t }: AdSlotProps) {
  const [engaged, setEngaged] = useState(false);

  const copy =
    variant === 'leaderboard'
      ? {
          title: t.ads.leaderboardTitle,
          body: t.ads.leaderboardBody,
          cta: t.ads.leaderboardCta,
        }
      : variant === 'in-feed'
        ? {
            title: t.ads.inFeedTitle,
            body: t.ads.inFeedBody,
            cta: t.ads.inFeedCta,
          }
        : {
            title: t.ads.companionTitle,
            body: t.ads.companionBody,
            cta: t.ads.companionCta,
          };

  const containerClasses =
    variant === 'leaderboard'
      ? 'min-h-[72px] p-3.5 sm:px-6 sm:py-4 rounded-2xl border border-blue-200/70 dark:border-blue-900/50 bg-blue-50/60 dark:bg-slate-900/90'
      : variant === 'in-feed'
        ? 'min-h-[112px] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
        : 'min-h-[96px] p-4 rounded-xl border border-blue-200/70 dark:border-blue-900/60 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-slate-900 dark:to-blue-950/40';

  return (
    <aside
      aria-label={t.ads.sponsoredLabel}
      data-ad-slot={variant}
      className={containerClasses}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0 space-y-0.5 sm:space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium text-blue-700 dark:text-sky-400">
            <span>{t.ads.sponsoredLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-500 dark:text-slate-400">smartvex Partner Network</span>
          </div>
          <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 leading-snug">
            {copy.title}
          </p>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2 sm:line-clamp-none">
            {copy.body}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setEngaged((prev) => !prev)}
          aria-pressed={engaged}
          className="inline-flex items-center justify-center gap-1.5 min-h-[42px] sm:min-h-[44px] px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-blue-600/25 dark:border-sky-400/30 bg-white dark:bg-slate-800 text-blue-700 dark:text-sky-300 hover:bg-blue-600 hover:text-white dark:hover:bg-sky-500 dark:hover:text-slate-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {engaged ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>{copy.cta}</span>
            </>
          ) : (
            <>
              <span>{copy.cta}</span>
              <ArrowUpRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
