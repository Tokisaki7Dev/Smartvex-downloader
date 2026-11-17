import { useEffect, useRef, useState } from 'react';
import { Header } from './components/Header';
import { ConverterWorkspace } from './components/ConverterWorkspace';
import { FeatureSections } from './components/FeatureSections';
import { Footer } from './components/Footer';
import {
  resolveLocaleFromAcceptLanguage,
  TRANSLATIONS,
  type LocaleInfo,
  type SupportedLocale,
} from './utils/i18n';
import { resolveEffectiveTheme, type ThemeMode } from './utils/theme';
import type { DownloadHistoryItem } from './utils/youtube';

const LOCALE_STORAGE_KEY = 'smartvex_locale_override';
const THEME_STORAGE_KEY = 'smartvex_theme_mode';
const HISTORY_STORAGE_KEY = 'smartvex_download_history';

function readStoredLocale(): SupportedLocale | null {
  try {
    const val = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (val === 'pt' || val === 'en' || val === 'es' || val === 'fr' || val === 'de') {
      return val;
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

function readStoredTheme(): ThemeMode {
  try {
    const val = localStorage.getItem(THEME_STORAGE_KEY);
    if (val === 'auto' || val === 'light' || val === 'dark') {
      return val;
    }
  } catch {
    // ignore storage errors
  }
  return 'auto';
}

function readStoredHistory(): DownloadHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DownloadHistoryItem[];
    return Array.isArray(parsed) ? parsed.slice(0, 12) : [];
  } catch {
    return [];
  }
}

export default function App() {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [localeInfo, setLocaleInfo] = useState<LocaleInfo>(() => {
    const stored = readStoredLocale();
    if (stored) {
      return { locale: stored, country: 'MANUAL', source: 'manual' };
    }
    const browserLang =
      typeof navigator !== 'undefined'
        ? resolveLocaleFromAcceptLanguage(navigator.language)
        : 'en';
    return { locale: browserLang, country: 'AUTO', source: 'default' };
  });

  const [themeMode, setThemeMode] = useState<ThemeMode>(() => readStoredTheme());
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [history, setHistory] = useState<DownloadHistoryItem[]>(() => readStoredHistory());

  // IP-based automatic language detection on load
  useEffect(() => {
    const stored = readStoredLocale();
    let active = true;

    fetch('/api/locale')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: LocaleInfo | null) => {
        if (!active || !data) return;
        if (stored) {
          setLocaleInfo({
            locale: stored,
            country: data.country || 'AUTO',
            source: 'manual',
          });
        } else {
          setLocaleInfo(data);
        }
      })
      .catch(() => {
        // keep browser default if network unavailable
      });

    return () => {
      active = false;
    };
  }, []);

  // Keep <html lang="..."> synced
  useEffect(() => {
    document.documentElement.lang = localeInfo.locale;
  }, [localeInfo.locale]);

  // Listen to OS dark mode changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);

    setSystemPrefersDark(media.matches);
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  // Apply Tailwind v4 .dark class on <html>
  useEffect(() => {
    const effective = resolveEffectiveTheme(themeMode, systemPrefersDark);
    document.documentElement.classList.toggle('dark', effective === 'dark');
  }, [themeMode, systemPrefersDark]);

  const handleChangeLocale = (nextLocale: SupportedLocale) => {
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    } catch {
      // ignore storage errors
    }
    setLocaleInfo((prev) => ({
      locale: nextLocale,
      country: prev.country,
      source: 'manual',
    }));
  };

  const handleChangeTheme = (nextTheme: ThemeMode) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // ignore storage errors
    }
    setThemeMode(nextTheme);
  };

  const handleAddHistory = (item: DownloadHistoryItem) => {
    setHistory((prev) => {
      const next = [item, ...prev].slice(0, 12);
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
  };

  const handlePrimaryAction = () => {
    const el = document.getElementById('downloader');
    el?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => inputRef.current?.focus(), 180);
  };

  const t = TRANSLATIONS[localeInfo.locale];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Header t={t} onPrimaryAction={handlePrimaryAction} />
      <main className="flex-1">
        <ConverterWorkspace
          t={t}
          localeInfo={localeInfo}
          onChangeLocale={handleChangeLocale}
          themeMode={themeMode}
          onChangeTheme={handleChangeTheme}
          inputRef={inputRef}
          history={history}
          onAddHistory={handleAddHistory}
          onClearHistory={handleClearHistory}
        />
        <FeatureSections t={t} />
      </main>
      <Footer t={t} />
    </div>
  );
}
