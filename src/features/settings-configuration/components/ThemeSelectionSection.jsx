import Icon from "../../../components/AppIcon";

const ThemeSelectionSection = ({ settings, onSettingChange }) => {
  const themes = [
    {
      id: "light",
      name: "Light",
      icon: "Sun",
      description: "Clean and bright interface",
      preview: {
        background: "#FDFEFE",
        card: "#FFFFFF",
        text: "#111827",
        accent: "#FF6B35",
      },
    },
    {
      id: "dark",
      name: "Dark",
      icon: "Moon",
      description: "Easy on the eyes in low light",
      preview: {
        background: "#0F0F0F",
        card: "#1A1A1A",
        text: "#E5E7EB",
        accent: "#FF8C5A",
      },
    },
    {
      id: "sepia",
      name: "Sepia",
      icon: "BookOpen",
      description: "Warm paper-like experience",
      preview: {
        background: "#FDF5E6", // cream
        card: "#FFF8E9",
        text: "#3B2A20", // coffee text
        accent: "#C47A3D", // coffee accent
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">
          Theme Selection
        </h3>
        <p className="text-sm md:text-base text-muted-foreground">
          Choose a color scheme that suits your reading environment
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {themes?.map((theme) => (
          <button
            key={theme?.id}
            onClick={() => onSettingChange("theme", theme?.id)}
            className={`group relative p-6 rounded-xl md:rounded-2xl border-2 transition-all duration-300 text-left ${
              settings?.theme === theme?.id
                ? "border-primary shadow-lg shadow-primary/20"
                : "border-border/60 hover:border-primary/30"
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center transition-colors duration-200 ${
                  settings?.theme === theme?.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground group-hover:bg-primary/10"
                }`}
              >
                <Icon name={theme?.icon} size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">{theme?.name}</h4>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {theme?.description}
                </p>
              </div>
            </div>

            <div
              className="h-24 md:h-32 rounded-lg overflow-hidden border border-border/60"
              style={{ backgroundColor: theme?.preview?.background }}
            >
              <div className="p-3 md:p-4 h-full flex flex-col justify-between">
                <div
                  className="p-2 md:p-3 rounded-md"
                  style={{ backgroundColor: theme?.preview?.card }}
                >
                  <div
                    className="h-2 w-3/4 rounded mb-2"
                    style={{
                      backgroundColor: theme?.preview?.text,
                      opacity: 0.8,
                    }}
                  />
                  <div
                    className="h-2 w-1/2 rounded"
                    style={{
                      backgroundColor: theme?.preview?.text,
                      opacity: 0.5,
                    }}
                  />
                </div>
                <div
                  className="h-6 md:h-8 rounded flex items-center justify-center text-xs font-medium"
                  style={{
                    backgroundColor: theme?.preview?.accent,
                    color: "#FFFFFF",
                  }}
                >
                  Sample Button
                </div>
              </div>
            </div>

            {settings?.theme === theme?.id && (
              <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <Icon name="Check" size={14} color="#FFFFFF" />
              </div>
            )}
          </button>
        ))}
      </div>
      <div className="p-4 md:p-6 bg-muted/30 rounded-lg md:rounded-xl border border-border/60">
        <div className="flex items-start gap-3">
          <Icon
            name="Info"
            size={20}
            className="text-primary flex-shrink-0 mt-0.5"
          />
          <div>
            <p className="text-sm md:text-base text-foreground font-medium mb-1">
              Theme applies instantly
            </p>
            <p className="text-xs md:text-sm text-muted-foreground">
              Your selected theme will be applied immediately across all screens
              and saved automatically for future sessions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeSelectionSection;
