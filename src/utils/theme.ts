export type ThemeMode = 'auto' | 'light' | 'dark';

export function resolveEffectiveTheme(mode: ThemeMode, systemPrefersDark: boolean): 'light' | 'dark' {
  if (mode === 'auto') {
    return systemPrefersDark ? 'dark' : 'light';
  }
  return mode;
}
