import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";

const FONT_FAMILY_LABELS = {
  "source-sans": "Source Sans 3",
  crimson: "Crimson Text",
  "ibm-plex": "IBM Plex Sans",
  jetbrains: "JetBrains Mono",
};

const SettingsSummaryCard = ({ settings, onReset }) => {
  const fontLabel = FONT_FAMILY_LABELS?.[settings?.fontFamily] || "Sans Serif";
  const getSummaryItems = () => {
    return [
      {
        icon: "Gauge",
        label: "Reading Speed",
        value: `${settings?.readingSpeed || 350} WPM`,
      },
      {
        icon: "Type",
        label: "Font",
        value: `${fontLabel} - ${settings?.fontSize || 16}px`,
      },
      {
        icon: "Layers",
        label: "Words Per Frame",
        value: `${settings?.wordsPerFrame || 1} word${settings?.wordsPerFrame > 1 ? "s" : ""}`,
      },
      {
        icon: "Palette",
        label: "Theme",
        value: settings?.theme
          ? settings?.theme?.charAt(0)?.toUpperCase() +
            settings?.theme?.slice(1)
          : "Light",
      },
    ];
  };

  const getActiveFeatures = () => {
    const features = [];
    if (settings?.pauseOnPunctuation) features?.push("Pause on Punctuation");
    if (settings?.pauseOnLongWords) features?.push("Pause on Long Words");
    if (settings?.showFocalPoint) features?.push("Focal Point");
    if (settings?.smartHighlighting) features?.push("Smart Highlighting");
    return features;
  };

  const summaryItems = getSummaryItems();
  const activeFeatures = getActiveFeatures();

  return (
    <div className="p-6 md:p-8 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl md:rounded-2xl border border-primary/20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon name="Settings" size={20} color="var(--color-primary)" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-semibold text-foreground">
              Current Configuration
            </h3>
            <p className="text-xs md:text-sm text-muted-foreground">
              Your personalized reading settings
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          iconName="RotateCcw"
          iconPosition="left"
          onClick={onReset}
        >
          Reset
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {summaryItems?.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border/60"
          >
            <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon name={item?.icon} size={16} className="text-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">{item?.label}</p>
              <p className="text-sm font-semibold text-foreground truncate">
                {item?.value}
              </p>
            </div>
          </div>
        ))}
      </div>
      {activeFeatures?.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-3">Active Features</p>
          <div className="flex flex-wrap gap-2">
            {activeFeatures?.map((feature, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-full"
              >
                <Icon name="Check" size={12} />
                {feature}
              </span>
            ))}
          </div>
        </div>
      )}
      {activeFeatures?.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Icon name="AlertCircle" size={14} />
          <span>No additional features enabled</span>
        </div>
      )}
    </div>
  );
};

export default SettingsSummaryCard;
