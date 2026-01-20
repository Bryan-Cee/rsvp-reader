import React, { useEffect } from "react";
import Routes from "./Routes";
import {
  loadReaderSettings,
  applyThemeFromSettings,
} from "./utils/readerSettings";

function App() {
  useEffect(() => {
    const settings = loadReaderSettings();
    applyThemeFromSettings(settings?.theme);
  }, []);

  return <Routes />;
}

export default App;
