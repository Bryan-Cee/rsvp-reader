"use client";

import { useEffect } from "react";
import {
  applyThemeFromSettings,
  loadReaderSettings,
} from "../utils/readerSettings";

const ThemeInitializer = () => {
  useEffect(() => {
    const settings = loadReaderSettings();
    applyThemeFromSettings(settings?.theme);
  }, []);

  return null;
};

export default ThemeInitializer;
