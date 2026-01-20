import Select from "../../../components/ui/Select";
import Button from "../../../components/ui/Button";

const fontPreviewClasses = {
  "source-sans": "font-sans",
  crimson: "font-serif",
  "ibm-plex": "font-caption",
  jetbrains: "font-data",
};

const TypographySection = ({ settings, onSettingChange }) => {
  const fontFamilyOptions = [
    {
      value: "source-sans",
      label: "Source Sans 3",
      description: "Neutral grotesque optimized for readability",
    },
    {
      value: "crimson",
      label: "Crimson Text",
      description: "Elegant serif ideal for long-form books",
    },
    {
      value: "ibm-plex",
      label: "IBM Plex Sans",
      description: "Technical sans with excellent rhythm",
    },
    {
      value: "jetbrains",
      label: "JetBrains Mono",
      description: "Monospaced type for focused sessions",
    },
  ];

  const fontSizes = [
    { id: "sm", label: "SM", value: 14, description: "Small - 14px" },
    { id: "md", label: "MD", value: 16, description: "Medium - 16px" },
    { id: "lg", label: "LG", value: 20, description: "Large - 20px" },
    { id: "xl", label: "XL", value: 24, description: "Extra Large - 24px" },
  ];

  const getFontFamilyClass = (family) =>
    fontPreviewClasses?.[family] || fontPreviewClasses?.["source-sans"];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">
          Typography
        </h3>
        <p className="text-sm md:text-base text-muted-foreground">
          Adjust font style and size for optimal reading comfort
        </p>
      </div>
      <div className="space-y-6">
        <div>
          <Select
            label="Font Family"
            description="Choose the typeface for reading text"
            options={fontFamilyOptions}
            value={settings?.fontFamily || "source-sans"}
            onChange={(value) => onSettingChange("fontFamily", value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Font Size
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {fontSizes?.map((size) => (
              <Button
                key={size?.id}
                variant={
                  settings?.fontSize === size?.value ? "default" : "outline"
                }
                onClick={() => onSettingChange("fontSize", size?.value)}
                className="h-auto py-4 flex flex-col items-center gap-2"
              >
                <span className="text-lg font-semibold">{size?.label}</span>
                <span className="text-xs opacity-70">{size?.value}px</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="p-6 md:p-8 bg-muted/30 rounded-lg md:rounded-xl border border-border/60">
          <p className="text-xs md:text-sm text-muted-foreground mb-4">
            Live Preview
          </p>
          <p
            className={`${getFontFamilyClass(settings?.fontFamily || "sans")} text-foreground transition-all duration-300`}
            style={{ fontSize: `${settings?.fontSize || 16}px` }}
          >
            The quick brown fox jumps over the lazy dog. This preview
            demonstrates how your selected typography settings will appear
            during reading sessions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TypographySection;
