import { create } from 'zustand';

const THEME_QUERY = '(prefers-color-scheme: dark)';

const getSystemTheme = () => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return window.matchMedia(THEME_QUERY).matches ? 'dark' : 'light';
};

const applyTheme = (theme) => {
  if (typeof window === 'undefined') {
    return;
  }

  const htmlElement = document.documentElement;
  htmlElement.classList.toggle('dark', theme === 'dark');
  htmlElement.style.colorScheme = theme;
};

const useThemeStore = create((set, get) => ({
  // Theme strictly follows the operating system preference.
  theme: getSystemTheme(),

  // Backward-compatible API: refresh from system preference.
  toggleTheme: () => {
    const theme = getSystemTheme();
    applyTheme(theme);
    set({ theme });
  },

  // Backward-compatible API: keep following system preference.
  setTheme: () => {
    const theme = getSystemTheme();
    applyTheme(theme);
    set({ theme });
  },

  // Initialize theme and subscribe to system theme changes.
  // Returns a cleanup function for removing the media query listener.
  initTheme: () => {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const mediaQuery = window.matchMedia(THEME_QUERY);

    const syncTheme = (isDark) => {
      const theme = isDark ? 'dark' : 'light';
      applyTheme(theme);
      set({ theme });
    };

    syncTheme(mediaQuery.matches);

    const handleChange = (event) => {
      syncTheme(event.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  },
}));

export default useThemeStore;
