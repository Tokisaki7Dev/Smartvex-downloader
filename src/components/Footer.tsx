import { SmartvexLogo } from './SmartvexLogo';
import type { TranslationBundle } from '../utils/i18n';

interface FooterProps {
  t: TranslationBundle;
}

export function Footer({ t }: FooterProps) {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <SmartvexLogo size="sm" />
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md">
            {t.footer.tagline}
          </p>
        </div>

        <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 md:text-right">
          <p>{t.footer.legal}</p>
          <p>{t.footer.rights}</p>
        </div>
      </div>
    </footer>
  );
}
