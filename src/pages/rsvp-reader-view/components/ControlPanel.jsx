import { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';

const ControlPanel = ({
  readingSpeed = 350,
  wordsPerFrame = 1,
  fontSize = 16,
  fontFamily = 'source-sans',
  onSpeedChange,
  onWordsPerFrameChange,
  onFontSizeChange,
  onFontFamilyChange
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const speedPresets = [
    { value: 150, label: 'Slow (150 WPM)' },
    { value: 250, label: 'Normal (250 WPM)' },
    { value: 350, label: 'Fast (350 WPM)' },
    { value: 500, label: 'Rapid (500 WPM)' },
    { value: 700, label: 'Very Fast (700 WPM)' }
  ];

  const wordsPerFrameOptions = [
    { value: 1, label: '1 Word' },
    { value: 2, label: '2 Words' },
    { value: 3, label: '3 Words' }
  ];

  const fontSizeOptions = [
    { value: 12, label: 'SM (12px)' },
    { value: 16, label: 'MD (16px)' },
    { value: 20, label: 'LG (20px)' },
    { value: 24, label: 'XL (24px)' }
  ];

  const fontFamilyOptions = [
    { value: 'source-sans', label: 'Sans Serif' },
    { value: 'crimson', label: 'Serif' },
    { value: 'jetbrains', label: 'Monospace' }
  ];

  const handleSpeedSliderChange = (e) => {
    if (onSpeedChange) {
      onSpeedChange(parseInt(e?.target?.value));
    }
  };

  const handleSpeedPreset = (speed) => {
    if (onSpeedChange) {
      onSpeedChange(speed);
    }
  };

  const handleSpeedAdjust = (delta) => {
    const newSpeed = Math.max(50, Math.min(1000, readingSpeed + delta));
    if (onSpeedChange) {
      onSpeedChange(newSpeed);
    }
  };

  return (
    <div className="bg-card border-t border-border/60">
      <div className="px-4 md:px-6 lg:px-8 py-3 md:py-4 border-b border-border/60">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between hover:bg-muted/30 rounded-lg px-3 py-2 transition-colors duration-200"
          aria-expanded={isExpanded}
          aria-controls="control-panel-content"
        >
          <div className="flex items-center gap-2 md:gap-3">
            <Icon name="Settings" size={18} className="text-muted-foreground" />
            <span className="text-sm md:text-base font-medium text-foreground">
              Reading Controls
            </span>
          </div>
          <Icon
            name={isExpanded ? 'ChevronUp' : 'ChevronDown'}
            size={20}
            className="text-muted-foreground"
          />
        </button>
      </div>
      {isExpanded && (
        <div
          id="control-panel-content"
          className="px-4 md:px-6 lg:px-8 py-4 md:py-5 lg:py-6 animate-slide-down"
        >
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 lg:gap-6">
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  Reading Speed
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="xs"
                    iconName="Minus"
                    onClick={() => handleSpeedAdjust(-25)}
                    aria-label="Decrease speed by 25 WPM"
                  />
                  <span className="font-data text-base md:text-lg font-semibold text-primary min-w-[4rem] text-center">
                    {readingSpeed} WPM
                  </span>
                  <Button
                    variant="outline"
                    size="xs"
                    iconName="Plus"
                    onClick={() => handleSpeedAdjust(25)}
                    aria-label="Increase speed by 25 WPM"
                  />
                </div>
              </div>

              <input
                type="range"
                min="50"
                max="1000"
                step="25"
                value={readingSpeed}
                onChange={handleSpeedSliderChange}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                aria-label="Reading speed slider"
              />

              <div className="grid grid-cols-2 gap-2">
                {speedPresets?.slice(0, 4)?.map((preset) => (
                  <Button
                    key={preset?.value}
                    variant={readingSpeed === preset?.value ? 'default' : 'outline'}
                    size="xs"
                    onClick={() => handleSpeedPreset(preset?.value)}
                    className="text-xs"
                  >
                    {preset?.value} WPM
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3 md:space-y-4">
              <Select
                label="Words Per Frame"
                options={wordsPerFrameOptions}
                value={wordsPerFrame}
                onChange={onWordsPerFrameChange}
              />

              <div className="pt-2">
                <p className="text-xs text-muted-foreground">
                  Display multiple words simultaneously for faster reading
                </p>
              </div>
            </div>

            <div className="space-y-3 md:space-y-4">
              <Select
                label="Font Size"
                options={fontSizeOptions}
                value={fontSize}
                onChange={onFontSizeChange}
              />

              <div className="pt-2">
                <p className="text-xs text-muted-foreground">
                  Adjust text size for comfortable reading
                </p>
              </div>
            </div>

            <div className="space-y-3 md:space-y-4">
              <Select
                label="Font Family"
                options={fontFamilyOptions}
                value={fontFamily}
                onChange={onFontFamilyChange}
              />

              <div className="pt-2">
                <p className="text-xs text-muted-foreground">
                  Choose your preferred typeface style
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlPanel;