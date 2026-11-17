import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { SmartvexLogo } from './SmartvexLogo';
import type { TranslationBundle } from '../utils/i18n';

interface HeaderProps {
  t: TranslationBundle;
  onPrimaryAction: () => void;
}

export function Header({ t, onPrimaryAction }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '#downloader', label: t.nav.downloader },
    { href: '#about', label: t.nav.about },
    { href: '#faq', label: t.nav.faq },
  ];

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single clean brand wordmark */}
        <a
          href="#downloader"
          className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 rounded-lg whitespace-nowrap shrink-0"
          aria-label="smartvex home"
        >
          <SmartvexLogo />
        </a>

        {/* Zone 2: 4 concise single-line nav links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300"
        >
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="hover:text-blue-600 dark:hover:text-sky-400 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: Single primary action CTA (+ mobile menu button on small screens) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onPrimaryAction}
            className="hidden sm:inline-flex items-center justify-center min-h-[40px] px-4 py-2 text-sm font-semibold text-white smartvex-gradient rounded-xl shadow-sm hover:opacity-95 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.nav.primaryCta}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3">
          <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className="min-h-[44px] flex items-center px-3 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                {item.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onPrimaryAction();
              }}
              className="mt-2 min-h-[44px] w-full flex items-center justify-center px-4 text-sm font-semibold text-white smartvex-gradient rounded-xl cursor-pointer"
            >
              {t.nav.primaryCta}
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
