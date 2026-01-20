"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import ReadingSessionHeader from "../../components/navigation/ReadingSessionHeader";
import QuickAccessControls from "../../components/navigation/QuickAccessControls";
import SettingsModal from "../../components/navigation/SettingsModal";
import RSVPDisplay from "./components/RSVPDisplay";
import PlaybackControls from "./components/PlaybackControls";
import ControlPanel from "./components/ControlPanel";
import {
  loadReaderSettings,
  saveReaderSettings,
  applyThemeFromSettings,
} from "../../utils/readerSettings";

const RSVPReaderView = () => {
  const searchParams = useSearchParams();

  const mockBookContent = `Speed reading is a collection of techniques that aim to increase reading speed without significantly reducing comprehension or retention. The concept gained popularity in the 1950s and 1960s with the development of various training programs and devices.\n\nOne of the most effective methods is RSVP, or Rapid Serial Visual Presentation. This technique displays words sequentially at a fixed location on the screen, eliminating the need for eye movement. By reducing the physical movement of the eyes, readers can focus entirely on processing the text, leading to significant improvements in reading speed.\n\nResearch has shown that the average person reads at about 200-250 words per minute. With proper training and the right tools, many people can double or even triple their reading speed while maintaining good comprehension. The key is consistent practice and gradually increasing the speed as you become more comfortable with the technique.\n\nModern technology has made speed reading more accessible than ever. Digital tools can automatically adjust the presentation speed, highlight focal points in words, and track your progress over time. These features help readers develop their skills more effectively than traditional methods.\n\nHowever, it's important to note that speed reading isn't suitable for all types of content. Complex technical material, poetry, or texts that require deep analysis may benefit from slower, more careful reading. The goal is to have the flexibility to adjust your reading speed based on the content and your purpose for reading.`;

  const [bookData] = useState({
    title: searchParams?.get("bookTitle") || "Introduction to Speed Reading",
    author: searchParams?.get("bookAuthor") || "Reading Expert",
    content: mockBookContent,
    totalWords: mockBookContent?.split(/\s+/)?.length,
  });

  const [readingState, setReadingState] = useState(() => {
    const persisted = loadReaderSettings();

    return {
      isPlaying: false,
      currentWordIndex: 0,
      readingSpeed: persisted?.readingSpeed ?? 350,
      wordsPerFrame: persisted?.wordsPerFrame ?? 1,
      fontSize: persisted?.fontSize ?? 16,
      fontFamily: persisted?.fontFamily || "source-sans",
      theme: persisted?.theme || "light",
      showFocalPoint:
        typeof persisted?.showFocalPoint === "boolean"
          ? persisted.showFocalPoint
          : true,
      smartHighlighting:
        typeof persisted?.smartHighlighting === "boolean"
          ? persisted.smartHighlighting
          : true,
      pauseOnPunctuation:
        typeof persisted?.pauseOnPunctuation === "boolean"
          ? persisted.pauseOnPunctuation
          : false,
      pauseOnLongWords:
        typeof persisted?.pauseOnLongWords === "boolean"
          ? persisted.pauseOnLongWords
          : false,
    };
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const words = bookData?.content?.split(/\s+/);
  const currentWord = words
    ?.slice(
      readingState?.currentWordIndex,
      readingState?.currentWordIndex + readingState?.wordsPerFrame,
    )
    ?.join(" ");

  const readingProgress =
    bookData?.totalWords > 0
      ? (readingState?.currentWordIndex / bookData?.totalWords) * 100
      : 0;

  useEffect(() => {
    applyThemeFromSettings(readingState?.theme);
  }, [readingState?.theme]);

  useEffect(() => {
    let intervalId;

    if (
      readingState?.isPlaying &&
      readingState?.currentWordIndex < bookData?.totalWords
    ) {
      const delay =
        (60000 / readingState?.readingSpeed) * readingState?.wordsPerFrame;

      intervalId = setInterval(() => {
        setReadingState((prev) => {
          const nextIndex = prev?.currentWordIndex + prev?.wordsPerFrame;

          if (nextIndex >= bookData?.totalWords) {
            return {
              ...prev,
              isPlaying: false,
              currentWordIndex: bookData?.totalWords - 1,
            };
          }

          const currentWord = words?.[nextIndex];
          let additionalDelay = 0;

          if (prev?.pauseOnPunctuation && /[.!?;:]$/?.test(currentWord)) {
            additionalDelay = 300;
          }

          if (prev?.pauseOnLongWords && currentWord?.length > 10) {
            additionalDelay = 200;
          }

          if (additionalDelay > 0) {
            setTimeout(() => {}, additionalDelay);
          }

          return { ...prev, currentWordIndex: nextIndex };
        });
      }, delay);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [
    readingState?.isPlaying,
    readingState?.readingSpeed,
    readingState?.wordsPerFrame,
    readingState?.pauseOnPunctuation,
    readingState?.pauseOnLongWords,
    readingState?.currentWordIndex,
    bookData?.totalWords,
    words,
  ]);

  const handlePlayPause = useCallback(() => {
    setReadingState((prev) => ({
      ...prev,
      isPlaying: !prev?.isPlaying,
    }));
  }, []);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e?.code === "Space" && !isSettingsOpen) {
        e?.preventDefault();
        handlePlayPause();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handlePlayPause, isSettingsOpen]);

  const handleRewind = useCallback(() => {
    setReadingState((prev) => ({
      ...prev,
      currentWordIndex: Math.max(0, prev?.currentWordIndex - 10),
      isPlaying: false,
    }));
  }, []);

  const handleForward = useCallback(() => {
    setReadingState((prev) => ({
      ...prev,
      currentWordIndex: Math.min(
        bookData?.totalWords - 1,
        prev?.currentWordIndex + 10,
      ),
      isPlaying: false,
    }));
  }, [bookData?.totalWords]);

  const handleProgressChange = useCallback((newWordIndex) => {
    setReadingState((prev) => ({
      ...prev,
      currentWordIndex: newWordIndex,
      isPlaying: false,
    }));
  }, []);

  const handleSpeedChange = useCallback((newSpeed) => {
    setReadingState((prev) => ({
      ...prev,
      readingSpeed: newSpeed,
    }));
  }, []);

  const handleWordsPerFrameChange = useCallback((newValue) => {
    setReadingState((prev) => ({
      ...prev,
      wordsPerFrame: newValue,
      isPlaying: false,
    }));
  }, []);

  const handleFontSizeChange = useCallback((newSize) => {
    setReadingState((prev) => ({
      ...prev,
      fontSize: newSize,
    }));
  }, []);

  const handleFontFamilyChange = useCallback((newFamily) => {
    setReadingState((prev) => ({
      ...prev,
      fontFamily: newFamily,
    }));
  }, []);

  const handleSettingsSave = useCallback((newSettings) => {
    const updatedState = {
      readingSpeed: newSettings?.readingSpeed,
      fontSize: newSettings?.fontSize,
      fontFamily: newSettings?.fontFamily,
      theme: newSettings?.theme,
      showFocalPoint: newSettings?.highlightWords,
      smartHighlighting: newSettings?.highlightWords,
    };

    setReadingState((prev) => ({
      ...prev,
      ...updatedState,
    }));

    const persisted = loadReaderSettings();
    const mergedSettings = {
      ...persisted,
      ...updatedState,
    };

    saveReaderSettings(mergedSettings);
    applyThemeFromSettings(mergedSettings?.theme);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ReadingSessionHeader
        onSettingsOpen={() => setIsSettingsOpen(true)}
        readingProgress={readingProgress}
      />
      <main className="flex-1 flex flex-col pt-16 md:pt-20">
        <RSVPDisplay
          currentWord={currentWord}
          wordsPerFrame={readingState?.wordsPerFrame}
          showFocalPoint={readingState?.showFocalPoint}
          smartHighlighting={readingState?.smartHighlighting}
          fontSize={readingState?.fontSize}
          fontFamily={readingState?.fontFamily}
          theme={readingState?.theme}
        />

        <PlaybackControls
          isPlaying={readingState?.isPlaying}
          currentProgress={readingProgress}
          totalWords={bookData?.totalWords}
          currentWordIndex={readingState?.currentWordIndex}
          onPlayPause={handlePlayPause}
          onRewind={handleRewind}
          onForward={handleForward}
          onProgressChange={handleProgressChange}
        />

        {/* <ControlPanel
          readingSpeed={readingState?.readingSpeed}
          wordsPerFrame={readingState?.wordsPerFrame}
          fontSize={readingState?.fontSize}
          fontFamily={readingState?.fontFamily}
          onSpeedChange={handleSpeedChange}
          onWordsPerFrameChange={handleWordsPerFrameChange}
          onFontSizeChange={handleFontSizeChange}
          onFontFamilyChange={handleFontFamilyChange}
        /> */}
      </main>
      <QuickAccessControls
        isPlaying={readingState?.isPlaying}
        currentSpeed={readingState?.readingSpeed}
        fontSize={readingState?.fontSize}
        onPlayPause={handlePlayPause}
        onSpeedChange={handleSpeedChange}
        onFontSizeChange={handleFontSizeChange}
        onSettingsOpen={() => setIsSettingsOpen(true)}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentSettings={{
          readingSpeed: readingState?.readingSpeed,
          fontSize: readingState?.fontSize,
          fontFamily: readingState?.fontFamily,
          theme: readingState?.theme,
          highlightWords: readingState?.smartHighlighting,
        }}
        onSave={handleSettingsSave}
      />
    </div>
  );
};

export default RSVPReaderView;
