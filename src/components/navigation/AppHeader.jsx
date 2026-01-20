import Icon from "../AppIcon";

const AppHeader = ({
  subtitle = "Read faster, comprehend better",
  actions = null,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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

          {actions ? (
            <div className="flex items-center gap-3 flex-wrap justify-end">
              {actions}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
