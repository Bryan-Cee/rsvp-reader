import { useState, useEffect } from 'react';
import Icon from '../AppIcon';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { Checkbox } from '../ui/Checkbox';

const SettingsModal = ({ isOpen, onClose, currentSettings, onSave }) => {
  const [activeSection, setActiveSection] = useState('reading');
  const [settings, setSettings] = useState({
    readingSpeed: 250,
    fontSize: 16,
    fontFamily: 'source-sans',
    theme: 'light',
    autoPlay: false,
    showProgress: true,
    highlightWords: true,
    soundEffects: false,
    ...currentSettings
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const navigationSections = [
    { id: 'reading', label: 'Reading', icon: 'BookOpen' },
    { id: 'display', label: 'Display', icon: 'Monitor' },
    { id: 'behavior', label: 'Behavior', icon: 'Settings' },
    { id: 'accessibility', label: 'Accessibility', icon: 'Eye' }
  ];

  const fontOptions = [
    { value: 'source-sans', label: 'Source Sans 3' },
    { value: 'crimson', label: 'Crimson Text' },
    { value: 'ibm-plex', label: 'IBM Plex Sans' },
    { value: 'jetbrains', label: 'JetBrains Mono' }
  ];

  const themeOptions = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'sepia', label: 'Sepia' }
  ];

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave(settings);
    }
    onClose();
  };

  const handleCancel = () => {
    setSettings({ ...currentSettings });
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e?.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="settings-modal-overlay animate-fade-in"
      onClick={handleCancel}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div
        className="settings-modal-content animate-slide-up"
        onClick={(e) => e?.stopPropagation()}
      >
        <div className="settings-modal-header">
          <h2 id="settings-title" className="settings-modal-title">
            Settings
          </h2>
          <Button
            variant="ghost"
            size="icon"
            iconName="X"
            onClick={handleCancel}
          />
        </div>

        <div className="settings-modal-body">
          <nav className="settings-nav-sidebar">
            <ul className="settings-nav-list">
              {navigationSections?.map((section) => (
                <li
                  key={section?.id}
                  className={`settings-nav-item ${activeSection === section?.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(section?.id)}
                >
                  <Icon name={section?.icon} size={18} />
                  <span>{section?.label}</span>
                </li>
              ))}
            </ul>
          </nav>

          <div className="settings-content-area">
            {activeSection === 'reading' && (
              <div className="settings-section">
                <h3 className="settings-section-title">Reading Preferences</h3>
                <p className="settings-section-description">
                  Customize your reading speed and text presentation
                </p>

                <div className="space-y-6">
                  <div>
                    <label className="quick-access-label">
                      Reading Speed (words per minute)
                    </label>
                    <Input
                      type="number"
                      value={settings?.readingSpeed}
                      onChange={(e) => handleSettingChange('readingSpeed', parseInt(e?.target?.value))}
                      min={100}
                      max={1000}
                      description={`Current: ${settings?.readingSpeed} WPM`}
                    />
                  </div>

                  <Checkbox
                    label="Auto-play on book open"
                    description="Automatically start reading when opening a book"
                    checked={settings?.autoPlay}
                    onChange={(e) => handleSettingChange('autoPlay', e?.target?.checked)}
                  />

                  <Checkbox
                    label="Highlight current word"
                    description="Emphasize the word being displayed"
                    checked={settings?.highlightWords}
                    onChange={(e) => handleSettingChange('highlightWords', e?.target?.checked)}
                  />
                </div>
              </div>
            )}

            {activeSection === 'display' && (
              <div className="settings-section">
                <h3 className="settings-section-title">Display Settings</h3>
                <p className="settings-section-description">
                  Adjust visual appearance and theme
                </p>

                <div className="space-y-6">
                  <Select
                    label="Theme"
                    options={themeOptions}
                    value={settings?.theme}
                    onChange={(value) => handleSettingChange('theme', value)}
                    description="Choose your preferred color scheme"
                  />

                  <Select
                    label="Font Family"
                    options={fontOptions}
                    value={settings?.fontFamily}
                    onChange={(value) => handleSettingChange('fontFamily', value)}
                    description="Select reading font"
                  />

                  <div>
                    <label className="quick-access-label">
                      Font Size
                    </label>
                    <Input
                      type="number"
                      value={settings?.fontSize}
                      onChange={(e) => handleSettingChange('fontSize', parseInt(e?.target?.value))}
                      min={12}
                      max={32}
                      description={`Current: ${settings?.fontSize}px`}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'behavior' && (
              <div className="settings-section">
                <h3 className="settings-section-title">Behavior Settings</h3>
                <p className="settings-section-description">
                  Control application behavior and feedback
                </p>

                <div className="space-y-6">
                  <Checkbox
                    label="Show progress indicator"
                    description="Display reading progress in header"
                    checked={settings?.showProgress}
                    onChange={(e) => handleSettingChange('showProgress', e?.target?.checked)}
                  />

                  <Checkbox
                    label="Sound effects"
                    description="Play audio feedback for actions"
                    checked={settings?.soundEffects}
                    onChange={(e) => handleSettingChange('soundEffects', e?.target?.checked)}
                  />
                </div>
              </div>
            )}

            {activeSection === 'accessibility' && (
              <div className="settings-section">
                <h3 className="settings-section-title">Accessibility</h3>
                <p className="settings-section-description">
                  Features to improve reading accessibility
                </p>

                <div className="space-y-6">
                  <div className="p-6 bg-muted/30 rounded-lg border border-border/60">
                    <h4 className="text-base font-semibold text-foreground mb-2">
                      Keyboard Shortcuts
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex justify-between">
                        <span>Play/Pause</span>
                        <kbd className="px-2 py-1 bg-card rounded border border-border font-data">Space</kbd>
                      </li>
                      <li className="flex justify-between">
                        <span>Increase Speed</span>
                        <kbd className="px-2 py-1 bg-card rounded border border-border font-data">+</kbd>
                      </li>
                      <li className="flex justify-between">
                        <span>Decrease Speed</span>
                        <kbd className="px-2 py-1 bg-card rounded border border-border font-data">-</kbd>
                      </li>
                      <li className="flex justify-between">
                        <span>Open Settings</span>
                        <kbd className="px-2 py-1 bg-card rounded border border-border font-data">S</kbd>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-8 py-6 border-t border-border/60">
          <Button
            variant="outline"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;