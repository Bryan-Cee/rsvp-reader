const STORAGE_KEY = "speedReader:settings";

export const DEFAULT_READER_SETTINGS = {
  readingSpeed: 350,
  fontSize: 16,
  fontFamily: "sans",
  theme: "light",
  wordsPerFrame: 1,
  pauseOnPunctuation: true,
  pauseOnLongWords: false,
  showFocalPoint: true,
  smartHighlighting: false,
};

export function loadReaderSettings() {
  if (typeof window === "undefined") return DEFAULT_READER_SETTINGS;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_READER_SETTINGS;

    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_READER_SETTINGS,
      ...parsed,
    };
  } catch (error) {
    console.error("Failed to load reader settings from localStorage", error);
    return DEFAULT_READER_SETTINGS;
  }
}

export function saveReaderSettings(settings) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save reader settings to localStorage", error);
  }
}

export function applyThemeFromSettings(theme) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}
