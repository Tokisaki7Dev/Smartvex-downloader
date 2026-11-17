import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { TranslationBundle } from '../utils/i18n';

interface FeatureSectionsProps {
  t: TranslationBundle;
}

export function FeatureSections({ t }: FeatureSectionsProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    { q: t.features.faq1Q, a: t.features.faq1A },
    { q: t.features.faq2Q, a: t.features.faq2A },
    { q: t.features.faq3Q, a: t.features.faq3A },
    { q: t.features.faq4Q, a: t.features.faq4A },
  ];

  return (
    <div className="space-y-12 pb-16">
      {/* Minimalist About & 3-Step Summary */}
      <section id="about" className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="border-t border-slate-200 dark:border-slate-800 pt-10 space-y-8">
          <div className="max-w-3xl space-y-2.5">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {t.features.aboutTitle}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              {t.features.aboutBody}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {t.features.stepsTitle}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: t.features.step1Title, body: t.features.step1Body },
                { title: t.features.step2Title, body: t.features.step2Body },
                { title: t.features.step3Title, body: t.features.step3Body },
              ].map((step) => (
                <div
                  key={step.title}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5"
                >
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {step.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Minimalist FAQ Accordion */}
      <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 space-y-5">
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {t.features.faqTitle}
        </h2>
        <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden">
          {faqs.map((item, idx) => {
            const expanded = openFaq === idx;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setOpenFaq(expanded ? null : idx)}
                  className="w-full min-h-[52px] px-5 py-3.5 flex items-center justify-between gap-4 text-left text-sm sm:text-base font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-500 shrink-0 transition-transform duration-200 ${
                      expanded ? 'rotate-180 text-blue-600 dark:text-sky-400' : ''
                    }`}
                  />
                </button>
                {expanded && (
                  <div className="px-5 pb-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
