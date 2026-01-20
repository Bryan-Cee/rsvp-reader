"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "../../components/navigation/AppHeader";
import Button from "../../components/ui/Button";
import Icon from "../../components/AppIcon";
import ReadingBehaviourSection from "./components/ReadingBehaviourSection";
import TypographySection from "./components/TypographySection";
import SpeedConfigurationSection from "./components/SpeedConfigurationSection";
import ThemeSelectionSection from "./components/ThemeSelectionSection";
import SettingsSummaryCard from "./components/SettingsSummaryCard";
import {
  DEFAULT_READER_SETTINGS,
  loadReaderSettings,
  saveReaderSettings,
  applyThemeFromSettings,
} from "../../utils/readerSettings";

const SettingsConfiguration = () => {
  const router = useRouter();
  const defaultSettings = DEFAULT_READER_SETTINGS;

  const [settings, setSettings] = useState(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [isPersisting, setIsPersisting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const hydrateSettings = async () => {
      try {
        const savedSettings = await loadReaderSettings();
        if (!isMounted) return;
        setSettings(savedSettings);
        applyThemeFromSettings(savedSettings?.theme);
      } catch (error) {
        console.error("Failed to load reader settings", error);
      }
    };

    hydrateSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    if (key === "theme") {
      applyThemeFromSettings(value);
    }
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    if (isPersisting) return;
    setIsPersisting(true);
    try {
      await saveReaderSettings(settings);
      applyThemeFromSettings(settings?.theme);
      setHasChanges(false);

      const notification = document.createElement("div");
      notification.className =
        "fixed top-20 right-4 md:right-8 bg-success text-success-foreground px-6 py-3 rounded-lg shadow-lg z-[100] animate-slide-down";
      notification.innerHTML = `
        <div class="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span class="font-medium">Settings saved successfully</span>
        </div>
      `;
      document.body?.appendChild(notification);
      setTimeout(() => notification?.remove(), 3000);
    } catch (error) {
      console.error("Failed to save reader settings", error);
    } finally {
      setIsPersisting(false);
    }
  };

  const handleResetSettings = () => {
    setSettings(defaultSettings);
    setHasChanges(true);
    applyThemeFromSettings(defaultSettings?.theme);
  };

  const handleReturnToReader = async () => {
    if (hasChanges) {
      const confirmLeave = window.confirm(
        "You have unsaved changes. Do you want to save before leaving?",
      );
      if (confirmLeave) {
        await handleSaveSettings();
      }
    }
    router.push("/rsvp-reader-view");
  };

  const handleReturnToLibrary = async () => {
    if (hasChanges) {
      const confirmLeave = window.confirm(
        "You have unsaved changes. Do you want to save before leaving?",
      );
      if (confirmLeave) {
        await handleSaveSettings();
      }
    }
    router.push("/main-reader-interface");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        navigationItems={[
          {
            key: "library",
            label: "Library",
            iconName: "ArrowLeft",
            variant: "outline",
            onClick: handleReturnToLibrary,
          },
          {
            key: "reader",
            label: "Reader",
            iconName: "BookOpen",
            variant: "outline",
            onClick: handleReturnToReader,
          },
        ]}
      />

      <main className="pt-20 pb-8 px-4 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 md:mb-12">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-2">
                  Settings Configuration
                </h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  Customize your reading experience with personalized
                  preferences
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  iconName="ArrowLeft"
                  iconPosition="left"
                  onClick={handleReturnToLibrary}
                >
                  Library
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  iconName="BookOpen"
                  iconPosition="left"
                  onClick={handleReturnToReader}
                >
                  Reader
                </Button>
              </div>
            </div>

            <SettingsSummaryCard
              settings={settings}
              onReset={handleResetSettings}
            />
          </div>

          <div className="space-y-8 md:space-y-12">
            <div className="p-6 md:p-8 bg-card rounded-xl md:rounded-2xl border border-border/60 shadow-sm">
              <ReadingBehaviourSection
                settings={settings}
                onSettingChange={handleSettingChange}
              />
            </div>

            <div className="p-6 md:p-8 bg-card rounded-xl md:rounded-2xl border border-border/60 shadow-sm">
              <TypographySection
                settings={settings}
                onSettingChange={handleSettingChange}
              />
            </div>

            <div className="p-6 md:p-8 bg-card rounded-xl md:rounded-2xl border border-border/60 shadow-sm">
              <SpeedConfigurationSection
                settings={settings}
                onSettingChange={handleSettingChange}
              />
            </div>

            <div className="p-6 md:p-8 bg-card rounded-xl md:rounded-2xl border border-border/60 shadow-sm">
              <ThemeSelectionSection
                settings={settings}
                onSettingChange={handleSettingChange}
              />
            </div>
          </div>

          <div className="sticky bottom-0 mt-8 p-4 md:p-6 bg-card/95 backdrop-blur-sm rounded-xl md:rounded-2xl border border-border/60 shadow-lg">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Icon name="Info" size={20} className="text-primary" />
                <p className="text-sm text-muted-foreground">
                  {hasChanges
                    ? "You have unsaved changes"
                    : "All changes are saved"}
                </p>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <Button
                  variant="outline"
                  onClick={handleResetSettings}
                  className="flex-1 md:flex-initial"
                >
                  Reset to Defaults
                </Button>
                <Button
                  variant="default"
                  iconName="Save"
                  iconPosition="left"
                  onClick={handleSaveSettings}
                  disabled={!hasChanges || isPersisting}
                  className="flex-1 md:flex-initial"
                >
                  {isPersisting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsConfiguration;
