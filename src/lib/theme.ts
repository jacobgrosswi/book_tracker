export type ThemeMode = "light" | "dark" | "auto";

const STORAGE_KEY = "book-tracker-theme";

const getBoundary = (date: Date) => {
  const next = new Date(date);
  if (date.getHours() < 7) {
    next.setHours(7, 0, 0, 0);
  } else if (date.getHours() < 19) {
    next.setHours(19, 0, 0, 0);
  } else {
    next.setDate(date.getDate() + 1);
    next.setHours(7, 0, 0, 0);
  }
  return next;
};

export const getStoredTheme = (): ThemeMode => {
  const value = localStorage.getItem(STORAGE_KEY);
  if (value === "light" || value === "dark" || value === "auto") {
    return value;
  }
  return "auto";
};

export const setStoredTheme = (mode: ThemeMode) => {
  localStorage.setItem(STORAGE_KEY, mode);
};

export const getAutoTheme = (date = new Date()) => {
  const hour = date.getHours();
  return hour >= 19 || hour < 7 ? "dark" : "light";
};

export const applyTheme = (mode: ThemeMode) => {
  const theme = mode === "auto" ? getAutoTheme() : mode;
  document.documentElement.classList.toggle("dark", theme === "dark");
};

export const scheduleThemeUpdate = (callback: () => void) => {
  const now = new Date();
  const nextBoundary = getBoundary(now);
  const delay = nextBoundary.getTime() - now.getTime();
  const id = window.setTimeout(() => {
    callback();
    scheduleThemeUpdate(callback);
  }, delay);
  return () => window.clearTimeout(id);
};
