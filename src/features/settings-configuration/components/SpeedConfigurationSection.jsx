import { useState } from 'react';
import Button from '../../../components/ui/Button';


const SpeedConfigurationSection = ({ settings, onSettingChange }) => {
  const [localSpeed, setLocalSpeed] = useState(settings?.readingSpeed || 350);

  const speedPresets = [
    { label: 'Slow', value: 150, description: 'Beginner friendly' },
    { label: 'Normal', value: 250, description: 'Average reading pace' },
    { label: 'Fast', value: 400, description: 'Experienced readers' },
    { label: 'Rapid', value: 600, description: 'Advanced speed reading' }
  ];

  const wordsPerFrameOptions = [
    { value: 1, label: '1 Word', description: 'Maximum focus' },
    { value: 2, label: '2 Words', description: 'Balanced approach' },
    { value: 3, label: '3 Words', description: 'Faster reading' }
  ];

  const handleSpeedChange = (e) => {
    const value = parseInt(e?.target?.value);
    setLocalSpeed(value);
    onSettingChange('readingSpeed', value);
  };

  const handlePresetClick = (value) => {
    setLocalSpeed(value);
    onSettingChange('readingSpeed', value);
  };

  const adjustSpeed = (delta) => {
    const newSpeed = Math.max(50, Math.min(1000, localSpeed + delta));
    setLocalSpeed(newSpeed);
    onSettingChange('readingSpeed', newSpeed);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">
          Speed Configuration
        </h3>
        <p className="text-sm md:text-base text-muted-foreground">
          Control reading speed and word display settings
        </p>
      </div>
      <div className="space-y-6">
        <div className="p-6 md:p-8 bg-card rounded-lg md:rounded-xl border border-border/60">
          <div className="flex items-center justify-between mb-6">
            <label className="text-sm font-medium text-foreground">
              Reading Speed (WPM)
            </label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                iconName="Minus"
                onClick={() => adjustSpeed(-25)}
                disabled={localSpeed <= 50}
              />
              <span className="font-mono text-2xl md:text-3xl font-bold text-primary min-w-[80px] md:min-w-[100px] text-center">
                {localSpeed}
              </span>
              <Button
                variant="outline"
                size="icon"
                iconName="Plus"
                onClick={() => adjustSpeed(25)}
                disabled={localSpeed >= 1000}
              />
            </div>
          </div>

          <input
            type="range"
            min="50"
            max="1000"
            step="25"
            value={localSpeed}
            onChange={handleSpeedChange}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            style={{
              background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${((localSpeed - 50) / 950) * 100}%, var(--color-muted) ${((localSpeed - 50) / 950) * 100}%, var(--color-muted) 100%)`
            }}
          />

          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>50 WPM</span>
            <span>1000 WPM</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Speed Presets
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {speedPresets?.map((preset) => (
              <Button
                key={preset?.value}
                variant={localSpeed === preset?.value ? 'default' : 'outline'}
                onClick={() => handlePresetClick(preset?.value)}
                className="h-auto py-4 flex flex-col items-center gap-1"
              >
                <span className="font-semibold">{preset?.label}</span>
                <span className="text-xs opacity-70">{preset?.value} WPM</span>
              </Button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Words Per Frame
          </label>
          <p className="text-xs md:text-sm text-muted-foreground mb-4">
            Number of words displayed simultaneously during reading
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {wordsPerFrameOptions?.map((option) => (
              <button
                key={option?.value}
                onClick={() => onSettingChange('wordsPerFrame', option?.value)}
                className={`p-4 md:p-5 rounded-lg md:rounded-xl border-2 transition-all duration-200 text-left ${
                  settings?.wordsPerFrame === option?.value
                    ? 'border-primary bg-primary/10' :'border-border/60 bg-card hover:border-primary/30'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center font-bold ${
                    settings?.wordsPerFrame === option?.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}>
                    {option?.value}
                  </div>
                  <span className="font-semibold text-foreground">{option?.label}</span>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {option?.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeedConfigurationSection;