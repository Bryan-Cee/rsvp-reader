import { useEffect, useMemo, useRef } from "react";

const FONT_CLASS_MAP = {
  "source-sans": "font-sans",
  crimson: "font-serif",
  "ibm-plex": "font-caption",
  jetbrains: "font-data",
};

const THEME_CLASS_MAP = {
  light: "bg-background text-foreground",
  dark: "bg-background text-foreground",
  sepia: "bg-[#F4F1E8] text-[#3E2723]",
};

const RSVPDisplay = ({
  currentWord = "",
  wordsPerFrame = 1,
  showFocalPoint = true,
  smartHighlighting = true,
  fontSize = 16,
  fontFamily = "source-sans",
  theme = "light",
}) => {
  const displayRef = useRef(null);

  useEffect(() => {
    if (displayRef?.current) {
      displayRef?.current?.focus();
    }
  }, [currentWord]);

  const words = useMemo(() => {
    if (!currentWord) return [];
    return currentWord?.split(" ")?.slice(0, wordsPerFrame) ?? [];
  }, [currentWord, wordsPerFrame]);

  const fontFamilyClass = useMemo(
    () => FONT_CLASS_MAP?.[fontFamily] || FONT_CLASS_MAP?.["source-sans"],
    [fontFamily],
  );

  const themeClasses = useMemo(
    () => THEME_CLASS_MAP?.[theme] || THEME_CLASS_MAP?.light,
    [theme],
  );

  const getFocalPointIndex = (word) => {
    if (!showFocalPoint || !word) return -1;
    const length = word?.length;
    if (length <= 1) return 0;
    if (length <= 5) return 1;
    if (length <= 9) return 2;
    return 3;
  };

  const renderWord = (word) => {
    if (!word) return null;

    const focalIndex = getFocalPointIndex(word);

    if (!smartHighlighting || focalIndex === -1) {
      return <span>{word}</span>;
    }

    return (
      <span>
        {word?.split("")?.map((char, index) => (
          <span
            key={index}
            className={index === focalIndex ? "text-primary font-bold" : ""}
          >
            {char}
          </span>
        ))}
      </span>
    );
  };
  return (
    <div
      ref={displayRef}
      className={`flex items-center justify-center min-h-[40vh] md:min-h-[20vh]px-4 md:px-8 lg:px-12 ${themeClasses} transition-colors duration-300`}
      tabIndex={-1}
      role="region"
      aria-label="RSVP Reading Display"
      aria-live="polite"
    >
      <div className="text-center max-w-4xl w-full">
        <div
          className={`${fontFamilyClass} leading-relaxed transition-all duration-200`}
          style={{
            fontSize: `${fontSize}px`,
            wordSpacing: wordsPerFrame > 1 ? "0.5em" : "normal",
          }}
        >
          {words?.map((word, index) => (
            <span key={index} className="inline-block mx-2 md:mx-3 lg:mx-4">
              {renderWord(word)}
            </span>
          ))}
        </div>

        {showFocalPoint && currentWord && (
          <div className="mt-6 md:mt-8 lg:mt-10 flex justify-center">
            <div className="w-1 h-8 md:h-10 lg:h-12 bg-primary/30 rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
};

export default RSVPDisplay;
