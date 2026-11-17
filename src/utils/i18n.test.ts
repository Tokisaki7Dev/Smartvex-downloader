import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mapCountryToLocale,
  resolveLocaleFromAcceptLanguage,
  TRANSLATIONS,
  type SupportedLocale,
} from './i18n';
import { resolveEffectiveTheme } from './theme';

test('mapCountryToLocale maps IP country codes accurately', () => {
  assert.equal(mapCountryToLocale('BR'), 'pt');
  assert.equal(mapCountryToLocale('pt'), 'pt');
  assert.equal(mapCountryToLocale('US'), 'en');
  assert.equal(mapCountryToLocale('GB'), 'en');
  assert.equal(mapCountryToLocale('MX'), 'es');
  assert.equal(mapCountryToLocale('ES'), 'es');
  assert.equal(mapCountryToLocale('FR'), 'fr');
  assert.equal(mapCountryToLocale('DE'), 'de');
  assert.equal(mapCountryToLocale('JP'), null);
});

test('resolveLocaleFromAcceptLanguage picks first supported language or defaults to en', () => {
  assert.equal(resolveLocaleFromAcceptLanguage('pt-BR,pt;q=0.9,en-US;q=0.8'), 'pt');
  assert.equal(resolveLocaleFromAcceptLanguage('es-MX,es;q=0.9'), 'es');
  assert.equal(resolveLocaleFromAcceptLanguage('ja-JP,zh;q=0.8'), 'en');
  assert.equal(resolveLocaleFromAcceptLanguage(undefined), 'en');
});

test('all supported locales have complete translation bundles', () => {
  const locales: SupportedLocale[] = ['pt', 'en', 'es', 'fr', 'de'];
  for (const loc of locales) {
    assert.ok(TRANSLATIONS[loc].workspace.heroTitle.length > 10);
    assert.ok(TRANSLATIONS[loc].results.tabVideo.length > 5);
    assert.ok(TRANSLATIONS[loc].ads.sponsoredLabel.length > 2);
  }
});

test('resolveEffectiveTheme follows system preference when auto', () => {
  assert.equal(resolveEffectiveTheme('auto', true), 'dark');
  assert.equal(resolveEffectiveTheme('auto', false), 'light');
  assert.equal(resolveEffectiveTheme('light', true), 'light');
  assert.equal(resolveEffectiveTheme('dark', false), 'dark');
});
