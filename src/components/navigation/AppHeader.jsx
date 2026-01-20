import Icon from "../AppIcon";
import Button from "../ui/Button";
import { cn } from "../../utils/cn";

const AppHeader = ({
  subtitle = "Read faster, comprehend better",
  actions = null,
  navigationItems = [],
}) => {
  const hasNavigation =
    Array.isArray(navigationItems) && navigationItems.length > 0;

  const renderNavigation = () => (
    <div className="flex items-center gap-2 flex-shrink-0">
      {navigationItems.map((item, index) => {
        const {
          key,
          label,
          iconName,
          onClick,
          variant = "outline",
          size = "sm",
          className,
          ariaLabel,
          ...rest
        } = item || {};

        if (!label && !iconName) return null;

        return (
          <Button
            key={key || label || index}
            variant={variant}
            size={size}
            iconName={iconName}
            onClick={onClick}
            aria-label={ariaLabel || label}
            className={cn("px-2 sm:px-3", className)}
            {...rest}
          >
            <span className="hidden sm:inline whitespace-nowrap">{label}</span>
          </Button>
        );
      })}
    </div>
  );

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon name="Zap" size={24} color="var(--color-primary)" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-semibold text-foreground">
                SpeedReader
              </h1>
              {subtitle ? (
                <p className="text-xs md:text-sm text-muted-foreground">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>

          {hasNavigation
            ? renderNavigation()
            : actions && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  {actions}
                </div>
              )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
