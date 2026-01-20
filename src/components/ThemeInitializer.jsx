"use client";

import { useEffect } from "react";
import {
  applyThemeFromSettings,
  loadReaderSettings,
} from "../utils/readerSettings";
import { migrateLegacyStorage } from "../utils/storage/indexedDb";

const ThemeInitializer = () => {
  useEffect(() => {
    let isMounted = true;

    const hydrateTheme = async () => {
      try {
        await migrateLegacyStorage();
        const settings = await loadReaderSettings();
        if (!isMounted) return;
        applyThemeFromSettings(settings?.theme);
      } catch (error) {
        console.error("Failed to initialize theme", error);
      }
    };

    hydrateTheme();

    return () => {
      isMounted = false;
    };
  }, []);

  return null;
};

export default ThemeInitializer;
