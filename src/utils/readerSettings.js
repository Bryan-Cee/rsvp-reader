import {
  getReaderSettingsRecord,
  putReaderSettingsRecord,
} from "./storage/indexedDb";

export const DEFAULT_READER_SETTINGS = {
  readingSpeed: 350,
  fontSize: 16,
  fontFamily: "source-sans",
  theme: "light",
  wordsPerFrame: 1,
  pauseOnPunctuation: false,
  pauseOnLongWords: false,
  showFocalPoint: true,
  smartHighlighting: true,
};

export async function loadReaderSettings() {
  if (typeof window === "undefined") return DEFAULT_READER_SETTINGS;

  try {
    const record = await getReaderSettingsRecord();
    if (!record) return DEFAULT_READER_SETTINGS;
    return {
      ...DEFAULT_READER_SETTINGS,
      ...record,
    };
  } catch (error) {
    console.error("Failed to load reader settings from IndexedDB", error);
    return DEFAULT_READER_SETTINGS;
  }
}

export async function saveReaderSettings(settings) {
  if (typeof window === "undefined") return;

  try {
    await putReaderSettingsRecord(settings);
  } catch (error) {
    console.error("Failed to save reader settings to IndexedDB", error);
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
