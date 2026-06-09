export type Theme = 'light' | 'dark';

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem('theme') as Theme | null;
  if (stored === 'dark' || stored === 'light') return stored;
  // Default to system preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  localStorage.setItem('theme', theme);
}

export function toggleTheme(): Theme {
  const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  const next: Theme = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}
