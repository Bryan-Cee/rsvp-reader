import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import SettingsConfiguration from './pages/settings-configuration';
import MainReaderInterface from './pages/main-reader-interface';
import RSVPReaderView from './pages/rsvp-reader-view';

const Routes = () => {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ErrorBoundary>
      <ScrollToTop />
      <RouterRoutes>
        {/* Define your route here */}
        <Route path="/" element={<MainReaderInterface />} />
        <Route path="/settings-configuration" element={<SettingsConfiguration />} />
        <Route path="/main-reader-interface" element={<MainReaderInterface />} />
        <Route path="/rsvp-reader-view" element={<RSVPReaderView />} />
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
