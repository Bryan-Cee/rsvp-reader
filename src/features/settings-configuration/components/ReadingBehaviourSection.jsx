import { Checkbox } from "../../../components/ui/Checkbox";

const ReadingBehaviorSection = ({ settings, onSettingChange }) => {
  const behaviorOptions = [
    {
      id: "pauseOnPunctuation",
      label: "Pause on Punctuation",
      description:
        "Automatically pause when encountering periods, commas, and other punctuation marks for natural reading rhythm",
    },
    {
      id: "pauseOnLongWords",
      label: "Pause on Long Words",
      description:
        "Add extra display time for words longer than 8 characters to improve comprehension",
    },
    {
      id: "showFocalPoint",
      label: "Show Focal Point",
      description:
        "Display a visual guide at the optimal reading position to reduce eye strain",
    },
    {
      id: "smartHighlighting",
      label: "Smart Highlighting",
      description:
        "Intelligently emphasize important words and phrases during reading",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">
          Reading Behavior
        </h3>
        <p className="text-sm md:text-base text-muted-foreground">
          Customize how text is displayed and paced during reading sessions
        </p>
      </div>
      <div className="space-y-4">
        {behaviorOptions?.map((option) => (
          <div
            key={option?.id}
            className="p-4 md:p-5 bg-card rounded-lg md:rounded-xl border border-border/60 hover:border-primary/30 transition-colors duration-200"
          >
            <Checkbox
              label={option?.label}
              description={option?.description}
              checked={settings?.[option?.id] || false}
              onChange={(e) => onSettingChange(option?.id, e?.target?.checked)}
              size="default"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReadingBehaviorSection;
