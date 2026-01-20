import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from '../ui/Button';

const ReadingSessionHeader = ({ onSettingsOpen, readingProgress = 0 }) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleReturnToLibrary = () => {
    navigate('/main-reader-interface');
  };

  const handleOpenSettings = () => {
    if (onSettingsOpen) {
      onSettingsOpen();
    }
  };

  return (
    <header className={`reading-session-header ${!isVisible ? 'hidden' : ''}`}>
      <div className="reading-session-header-content">
        <div className="reading-session-logo">
          <div className="reading-session-logo-icon">
            <Icon name="Zap" size={20} color="var(--color-primary)" />
          </div>
          <span className="reading-session-logo-text">SpeedReader</span>
        </div>

        <div className="flex items-center gap-4 flex-1 max-w-md mx-8">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${readingProgress}%` }}
            />
          </div>
          <span className="font-data text-sm text-muted-foreground min-w-[3rem] text-right">
            {readingProgress}%
          </span>
        </div>

        <div className="reading-session-actions">
          <Button
            variant="ghost"
            size="sm"
            iconName="Settings"
            iconPosition="left"
            onClick={handleOpenSettings}
          >
            Settings
          </Button>
          <Button
            variant="outline"
            size="sm"
            iconName="ArrowLeft"
            iconPosition="left"
            onClick={handleReturnToLibrary}
          >
            Library
          </Button>
        </div>
      </div>
    </header>
  );
};

export default ReadingSessionHeader;