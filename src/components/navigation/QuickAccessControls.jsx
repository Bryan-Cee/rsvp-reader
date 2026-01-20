import { useState } from 'react';
import Icon from '../AppIcon';
import Button from '../ui/Button';

const QuickAccessControls = ({
  isPlaying = false,
  currentSpeed = 250,
  fontSize = 16,
  onPlayPause,
  onSpeedChange,
  onFontSizeChange,
  onSettingsOpen
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  const speedPresets = [
    { label: 'Slow', value: 150 },
    { label: 'Normal', value: 250 },
    { label: 'Fast', value: 400 },
    { label: 'Rapid', value: 600 }
  ];

  const handleSpeedPreset = (speed) => {
    if (onSpeedChange) {
      onSpeedChange(speed);
    }
  };

  const handleSpeedAdjust = (delta) => {
    const newSpeed = Math.max(100, Math.min(1000, currentSpeed + delta));
    if (onSpeedChange) {
      onSpeedChange(newSpeed);
    }
  };

  const handleFontAdjust = (delta) => {
    const newSize = Math.max(12, Math.min(32, fontSize + delta));
    if (onFontSizeChange) {
      onFontSizeChange(newSize);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <div className={`quick-access-controls ${isMinimized ? 'minimized' : ''}`}>
      <div className="quick-access-header" onClick={toggleMinimize}>
        <div className="flex items-center gap-2">
          <Icon
            name={isMinimized ? 'ChevronUp' : 'ChevronDown'}
            size={20}
            className="text-muted-foreground"
          />
          <span className="text-sm font-medium text-foreground">
            Reading Controls
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-data text-sm text-muted-foreground">
            {currentSpeed} WPM
          </span>
          <Button
            variant={isPlaying ? 'default' : 'outline'}
            size="sm"
            iconName={isPlaying ? 'Pause' : 'Play'}
            onClick={(e) => {
              e?.stopPropagation();
              if (onPlayPause) onPlayPause();
            }}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
        </div>
      </div>
      {!isMinimized && (
        <div className="quick-access-body">
          <div className="quick-access-grid">
            <div className="quick-access-section">
              <label className="quick-access-label">Reading Speed</label>
              <div className="flex items-center gap-2 mb-3">
                <Button
                  variant="outline"
                  size="icon"
                  iconName="Minus"
                  onClick={() => handleSpeedAdjust(-25)}
                />
                <div className="flex-1 text-center">
                  <span className="font-data text-lg font-semibold text-foreground">
                    {currentSpeed}
                  </span>
                  <span className="text-sm text-muted-foreground ml-1">WPM</span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  iconName="Plus"
                  onClick={() => handleSpeedAdjust(25)}
                />
              </div>
              <div className="flex gap-2">
                {speedPresets?.map((preset) => (
                  <Button
                    key={preset?.value}
                    variant={currentSpeed === preset?.value ? 'default' : 'outline'}
                    size="xs"
                    onClick={() => handleSpeedPreset(preset?.value)}
                    className="flex-1"
                  >
                    {preset?.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="quick-access-section">
              <label className="quick-access-label">Font Size</label>
              <div className="flex items-center gap-2 mb-3">
                <Button
                  variant="outline"
                  size="icon"
                  iconName="Minus"
                  onClick={() => handleFontAdjust(-2)}
                />
                <div className="flex-1 text-center">
                  <span className="font-data text-lg font-semibold text-foreground">
                    {fontSize}
                  </span>
                  <span className="text-sm text-muted-foreground ml-1">px</span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  iconName="Plus"
                  onClick={() => handleFontAdjust(2)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Type"
                  onClick={() => handleFontAdjust(-4)}
                  className="flex-1"
                >
                  Smaller
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Type"
                  onClick={() => handleFontAdjust(4)}
                  className="flex-1"
                >
                  Larger
                </Button>
              </div>
            </div>

            <div className="quick-access-section">
              <label className="quick-access-label">Quick Actions</label>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  iconName="RotateCcw"
                  fullWidth
                >
                  Restart Chapter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Settings"
                  fullWidth
                  onClick={onSettingsOpen}
                >
                  All Settings
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickAccessControls;