import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const PlaybackControls = ({
  isPlaying = false,
  currentProgress = 0,
  totalWords = 0,
  currentWordIndex = 0,
  onPlayPause,
  onRewind,
  onForward,
  onProgressChange
}) => {
  const progressPercentage = totalWords > 0 ? (currentWordIndex / totalWords) * 100 : 0;

  const formatTime = (wordIndex, wpm) => {
    const minutes = Math.floor((wordIndex / wpm) * 60);
    const seconds = Math.floor(((wordIndex / wpm) * 60) % 60);
    return `${minutes}:${seconds?.toString()?.padStart(2, '0')}`;
  };

  const handleProgressClick = (e) => {
    if (!onProgressChange || totalWords === 0) return;

    const rect = e?.currentTarget?.getBoundingClientRect();
    const x = e?.clientX - rect?.left;
    const percentage = (x / rect?.width) * 100;
    const newWordIndex = Math.floor((percentage / 100) * totalWords);

    onProgressChange(newWordIndex);
  };

  return (
    <div className="bg-card border-t border-border/60 px-4 md:px-6 lg:px-8 py-4 md:py-5 lg:py-6">
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-5 lg:space-y-6">
        <div className="space-y-2 md:space-y-3">
          <div
            className="relative h-2 md:h-2.5 lg:h-3 bg-muted rounded-full cursor-pointer overflow-hidden group"
            onClick={handleProgressClick}
            role="progressbar"
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Reading progress"
          >
            <div
              className="absolute inset-y-0 left-0 bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
            <div
              className="absolute inset-y-0 left-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{ width: '100%' }}
            />
          </div>

          <div className="flex items-center justify-between text-xs md:text-sm text-muted-foreground font-data">
            <span>{currentWordIndex?.toLocaleString()} / {totalWords?.toLocaleString()} words</span>
            <span>{progressPercentage?.toFixed(1)}%</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 md:gap-3 lg:gap-4">
          <Button
            variant="outline"
            size="icon"
            iconName="RotateCcw"
            onClick={onRewind}
            disabled={currentWordIndex === 0}
            aria-label="Rewind 10 words"
          />

          <Button
            variant={isPlaying ? 'default' : 'outline'}
            size="lg"
            iconName={isPlaying ? 'Pause' : 'Play'}
            onClick={onPlayPause}
            className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24"
            aria-label={isPlaying ? 'Pause reading' : 'Start reading'}
          />

          <Button
            variant="outline"
            size="icon"
            iconName="RotateCw"
            onClick={onForward}
            disabled={currentWordIndex >= totalWords - 1}
            aria-label="Forward 10 words"
          />
        </div>

        <div className="flex items-center justify-center gap-2 md:gap-3">
          <div className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-muted/50 rounded-lg">
            <Icon name="Zap" size={16} className="text-primary" />
            <span className="text-xs md:text-sm font-medium text-foreground">
              Press <kbd className="px-2 py-1 bg-card rounded border border-border font-data text-xs">Space</kbd> to play/pause
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaybackControls;