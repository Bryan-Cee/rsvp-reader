"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppHeader from "../../components/navigation/AppHeader";
import QuickAccessControls from "../../components/navigation/QuickAccessControls";
import SettingsModal from "../../components/navigation/SettingsModal";
import Button from "../../components/ui/Button";
import RSVPDisplay from "./components/RSVPDisplay";
import PlaybackControls from "./components/PlaybackControls";
import ControlPanel from "./components/ControlPanel";
import {
  loadReaderSettings,
  saveReaderSettings,
  applyThemeFromSettings,
} from "../../utils/readerSettings";
import { remapGutenbergTextUrl } from "../../utils/gutenberg";

const DEFAULT_BOOK_CONTENT = `Speed reading is a collection of techniques that aim to increase reading speed without significantly reducing comprehension or retention. The concept gained popularity in the 1950s and 1960s with the development of various training programs and devices.\n\nOne of the most effective methods is RSVP, or Rapid Serial Visual Presentation. This technique displays words sequentially at a fixed location on the screen, eliminating the need for eye movement. By reducing the physical movement of the eyes, readers can focus entirely on processing the text, leading to significant improvements in reading speed.\n\nResearch has shown that the average person reads at about 200-250 words per minute. With proper training and the right tools, many people can double or even triple their reading speed while maintaining good comprehension. The key is consistent practice and gradually increasing the speed as you become more comfortable with the technique.\n\nModern technology has made speed reading more accessible than ever. Digital tools can automatically adjust the presentation speed, highlight focal points in words, and track your progress over time. These features help readers develop their skills more effectively than traditional methods.\n\nHowever, it's important to note that speed reading isn't suitable for all types of content. Complex technical material, poetry, or texts that require deep analysis may benefit from slower, more careful reading. The goal is to have the flexibility to adjust your reading speed based on the content and your purpose for reading.`;

const LIBRARY_STORAGE_KEY = "speedReader:libraryBooks";
const OPENED_BOOKS_KEY = "speedReader:openedBooks";
const BOOK_CONTENT_CACHE_PREFIX = "speedReader:bookContent:";
const PROGRESS_STORAGE_PREFIX = "speedReader:progress:";

const RSVPReaderView = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [bookMeta, setBookMeta] = useState(null);
  const [bookData, setBookData] = useState(() => {
    const fallbackContent = DEFAULT_BOOK_CONTENT;
    return {
      title: searchParams?.get("bookTitle") || "Introduction to Speed Reading",
      author: searchParams?.get("bookAuthor") || "Reading Expert",
      content: fallbackContent,
      totalWords: fallbackContent?.split(/\s+/)?.length ?? 0,
    };
  });
  const [isContentLoading, setIsContentLoading] = useState(true);
  const [contentError, setContentError] = useState(null);

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

  useEffect(() => {
    if (typeof window === "undefined") return;

    const bookId = searchParams?.get("bookId");
    const fallbackMeta = {
      id: bookId,
      title: searchParams?.get("bookTitle") || "Introduction to Speed Reading",
      author: searchParams?.get("bookAuthor") || "Reading Expert",
      textUrl: searchParams?.get("textUrl") || null,
    };

    const safeParse = (value) => {
      if (!value) return null;
      try {
        return JSON.parse(value);
      } catch (error) {
        console.warn("Failed to parse stored value", error);
        return null;
      }
    };

    let resolvedMeta = fallbackMeta;

    if (bookId) {
      const library = safeParse(
        window.localStorage.getItem(LIBRARY_STORAGE_KEY),
      );
      if (Array.isArray(library)) {
        const fromLibrary = library.find(
          (entry) => String(entry?.id) === String(bookId),
        );
        if (fromLibrary) {
          resolvedMeta = fromLibrary;
        }
      }

      if (!resolvedMeta?.textUrl) {
        const openedBooks = safeParse(
          window.localStorage.getItem(OPENED_BOOKS_KEY),
        );
        if (openedBooks?.[bookId]) {
          resolvedMeta = openedBooks[bookId];
        }
      }
    }

    setBookMeta(resolvedMeta);
    setIsContentLoading(true);
    setContentError(null);
  }, [searchParams]);

  useEffect(() => {
    if (!bookMeta) return;

    const cacheKey = bookMeta?.id
      ? `${BOOK_CONTENT_CACHE_PREFIX}${bookMeta.id}`
      : null;
    const preferredTextUrl = remapGutenbergTextUrl(bookMeta?.textUrl);
    const candidateUrls = Array.from(
      new Set(
        [preferredTextUrl, bookMeta?.textUrl].filter(
          (url) => typeof url === "string" && url.length > 0,
        ),
      ),
    );

    const fallbackTitle =
      bookMeta?.title || searchParams?.get("bookTitle") || "Untitled Book";
    const fallbackAuthor =
      bookMeta?.author || searchParams?.get("bookAuthor") || "Unknown Author";

    const applyContent = (content) => {
      const cleanedContent =
        content && content.trim().length > 0 ? content : DEFAULT_BOOK_CONTENT;
      setBookData({
        title: fallbackTitle,
        author: fallbackAuthor,
        content: cleanedContent,
        totalWords: Math.max(1, cleanedContent.split(/\s+/)?.length ?? 1),
      });
      setIsContentLoading(false);
    };

    if (typeof window !== "undefined" && cacheKey) {
      const cachedContent = window.localStorage.getItem(cacheKey);
      if (cachedContent) {
        applyContent(cachedContent);
        return;
      }
    }

    if (candidateUrls.length === 0) {
      setContentError("This title does not provide a plain text format.");
      applyContent(DEFAULT_BOOK_CONTENT);
      return;
    }

    let didCancel = false;

    const fetchContent = async () => {
      setIsContentLoading(true);
      let lastError = null;

      for (const url of candidateUrls) {
        try {
          const proxyUrl = `/api/book-text?url=${encodeURIComponent(url)}`;
          const response = await fetch(proxyUrl, { cache: "no-store" });
          if (!response?.ok) {
            throw new Error("Unable to download book content.");
          }
          const text = await response.text();
          if (didCancel) return;

          if (typeof window !== "undefined" && cacheKey) {
            window.localStorage.setItem(cacheKey, text);

            if (bookMeta?.id) {
              try {
                const openedRaw = window.localStorage.getItem(OPENED_BOOKS_KEY);
                const opened = openedRaw ? JSON.parse(openedRaw) : {};
                opened[bookMeta.id] = {
                  ...bookMeta,
                  textUrl: url,
                };
                window.localStorage.setItem(
                  OPENED_BOOKS_KEY,
                  JSON.stringify(opened),
                );
              } catch (storageError) {
                console.warn(
                  "Failed to persist opened book metadata",
                  storageError,
                );
              }
            }
          }

          applyContent(text);
          return;
        } catch (error) {
          lastError = error;
        }
      }

      if (didCancel) return;
      console.error("Failed to load book content", lastError);
      setContentError(lastError?.message ?? "Failed to load book content.");
      applyContent(DEFAULT_BOOK_CONTENT);
    };

    fetchContent();

    return () => {
      didCancel = true;
    };
  }, [bookMeta, searchParams]);

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
  const loadingBookTitle =
    bookMeta?.title || searchParams?.get("bookTitle") || bookData?.title;

  useEffect(() => {
    applyThemeFromSettings(readingState?.theme);
  }, [readingState?.theme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!bookMeta?.id || isContentLoading) return;

    const totalWords = bookData?.totalWords ?? 0;
    if (totalWords <= 0) return;

    const progressPayload = {
      currentWordIndex: Math.min(
        readingState?.currentWordIndex ?? 0,
        Math.max(0, totalWords - 1),
      ),
      totalWords,
      updatedAt: Date.now(),
    };

    try {
      window.localStorage.setItem(
        `${PROGRESS_STORAGE_PREFIX}${bookMeta.id}`,
        JSON.stringify(progressPayload),
      );
    } catch (error) {
      console.warn("Failed to persist reading progress", error);
    }
  }, [
    bookMeta?.id,
    bookData?.totalWords,
    readingState?.currentWordIndex,
    isContentLoading,
  ]);

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
    <div className="min-h-screen bg-background flex flex-col relative">
      <AppHeader
        actions={
          <>
            <Button
              variant="ghost"
              size="sm"
              iconName="Settings"
              iconPosition="left"
              onClick={() => setIsSettingsOpen(true)}
            >
              Settings
            </Button>
            <Button
              variant="outline"
              size="sm"
              iconName="ArrowLeft"
              iconPosition="left"
              onClick={() => router.push("/main-reader-interface")}
            >
              Library
            </Button>
          </>
        }
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

      {isContentLoading && (
        <div
          className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 px-6 text-center bg-background/95 backdrop-blur"
          role="status"
          aria-live="polite"
        >
          <div className="w-16 h-16 rounded-full border-4 border-muted-foreground/40 border-t-primary animate-spin" />
          <div className="space-y-2 max-w-xl">
            <p className="text-lg font-semibold text-foreground">
              Loading {loadingBookTitle || "your selection"}
            </p>
            <p className="text-sm text-muted-foreground">
              We are downloading the plain-text edition and preparing it for the
              RSVP reader.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RSVPReaderView;
