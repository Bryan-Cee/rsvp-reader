"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppHeader from "../../components/navigation/AppHeader";
import QuickAccessControls from "../../components/navigation/QuickAccessControls";
import SettingsModal from "../../components/navigation/SettingsModal";
import Button from "../../components/ui/Button";
import RSVPDisplay from "./components/RSVPDisplay";
import PlaybackControls from "./components/PlaybackControls";
import ControlPanel from "./components/ControlPanel";
import {
  DEFAULT_READER_SETTINGS,
  loadReaderSettings,
  saveReaderSettings,
  applyThemeFromSettings,
} from "../../utils/readerSettings";
import { remapGutenbergTextUrl } from "../../utils/gutenberg";
import StorageEvictionDialog from "../../components/storage/StorageEvictionDialog";
import {
  calculateEvictionPlan,
  evictBookContentEntries,
  getBookContentById,
  getBookRecord,
  getLibraryEntry,
  getReadingProgressRecord,
  recordBookOpenedSnapshot,
  saveBookContentToStore,
  saveReadingProgressRecord,
  estimateTextByteSize,
} from "../../utils/storage/indexedDb";

const DEFAULT_BOOK_CONTENT = `Speed reading is a collection of techniques that aim to increase reading speed without significantly reducing comprehension or retention. The concept gained popularity in the 1950s and 1960s with the development of various training programs and devices.\n\nOne of the most effective methods is RSVP, or Rapid Serial Visual Presentation. This technique displays words sequentially at a fixed location on the screen, eliminating the need for eye movement. By reducing the physical movement of the eyes, readers can focus entirely on processing the text, leading to significant improvements in reading speed.\n\nResearch has shown that the average person reads at about 200-250 words per minute. With proper training and the right tools, many people can double or even triple their reading speed while maintaining good comprehension. The key is consistent practice and gradually increasing the speed as you become more comfortable with the technique.\n\nModern technology has made speed reading more accessible than ever. Digital tools can automatically adjust the presentation speed, highlight focal points in words, and track your progress over time. These features help readers develop their skills more effectively than traditional methods.\n\nHowever, it's important to note that speed reading isn't suitable for all types of content. Complex technical material, poetry, or texts that require deep analysis may benefit from slower, more careful reading. The goal is to have the flexibility to adjust your reading speed based on the content and your purpose for reading.`;

const buildBaseReadingState = () => ({
  isPlaying: false,
  currentWordIndex: 0,
  ...DEFAULT_READER_SETTINGS,
});

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
  const [retrySignal, setRetrySignal] = useState(0);

  const [readingState, setReadingState] = useState(buildBaseReadingState);
  const [hasHydratedSettings, setHasHydratedSettings] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [pendingContentJob, setPendingContentJob] = useState(null);
  const [evictionPlan, setEvictionPlan] = useState(null);
  const [isEvicting, setIsEvicting] = useState(false);
  const playbackTimeoutRef = useRef(null);

  const persistableSettings = useMemo(
    () => ({
      readingSpeed: readingState?.readingSpeed,
      wordsPerFrame: readingState?.wordsPerFrame,
      fontSize: readingState?.fontSize,
      fontFamily: readingState?.fontFamily,
      theme: readingState?.theme,
      pauseOnPunctuation: readingState?.pauseOnPunctuation,
      pauseOnLongWords: readingState?.pauseOnLongWords,
      showFocalPoint: readingState?.showFocalPoint,
      smartHighlighting: readingState?.smartHighlighting,
    }),
    [
      readingState?.readingSpeed,
      readingState?.wordsPerFrame,
      readingState?.fontSize,
      readingState?.fontFamily,
      readingState?.theme,
      readingState?.pauseOnPunctuation,
      readingState?.pauseOnLongWords,
      readingState?.showFocalPoint,
      readingState?.smartHighlighting,
    ],
  );

  const persistContentToIndexedDb = useCallback(
    async (text, fetchedVia = "proxy") => {
      if (!bookMeta?.id || typeof text !== "string") return;
      try {
        const byteSize = estimateTextByteSize(text);
        const plan = await calculateEvictionPlan(byteSize);
        if (!plan || plan.canStore) {
          await saveBookContentToStore(bookMeta.id, text, {
            fetchedVia,
            bookSnapshot: bookMeta,
          });
          return;
        }

        setPendingContentJob({
          text,
          fetchedVia,
          byteSize,
          bookSnapshot: bookMeta,
        });
        setEvictionPlan(plan);
      } catch (error) {
        console.error("Failed to persist book content", error);
      }
    },
    [bookMeta],
  );

  useEffect(() => {
    let isMounted = true;

    const hydrateBookMeta = async () => {
      const bookId = searchParams?.get("bookId");
      const fallbackMeta = {
        id: bookId,
        title:
          searchParams?.get("bookTitle") || "Introduction to Speed Reading",
        author: searchParams?.get("bookAuthor") || "Reading Expert",
        textUrl: searchParams?.get("textUrl") || null,
      };

      let resolvedMeta = fallbackMeta;

      if (bookId) {
        try {
          const libraryEntry = await getLibraryEntry(bookId);
          if (libraryEntry?.bookSnapshot) {
            resolvedMeta = libraryEntry.bookSnapshot;
          } else {
            const bookRecord = await getBookRecord(bookId);
            if (bookRecord?.bookSnapshot) {
              resolvedMeta = bookRecord.bookSnapshot;
            }
          }
        } catch (error) {
          console.error("Failed to hydrate book metadata", error);
        }
      }

      if (!isMounted) return;
      setBookMeta(resolvedMeta);
      setIsContentLoading(true);
      setContentError(null);
    };

    hydrateBookMeta();

    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  useEffect(() => {
    if (!bookMeta?.id) return;
    recordBookOpenedSnapshot(bookMeta).catch((error) => {
      console.warn("Failed to record book opened state", error);
    });
  }, [bookMeta]);

  useEffect(() => {
    if (!bookMeta) return;

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

    let didCancel = false;

    const hydrateFromCache = async () => {
      if (!bookMeta?.id) return false;
      try {
        const cached = await getBookContentById(bookMeta.id);
        if (cached?.content && !didCancel) {
          applyContent(cached.content);
          return true;
        }
      } catch (error) {
        console.warn("Failed to load cached book content", error);
      }
      return false;
    };

    const fetchContent = async () => {
      setIsContentLoading(true);
      setContentError(null);
      let lastError = null;

      for (const url of candidateUrls) {
        try {
          const proxyUrl = `/api/book-text?url=${encodeURIComponent(url)}`;
          const response = await fetch(proxyUrl, { cache: "no-store" });
          if (!response?.ok) {
            if (response?.status === 429) {
              const rateLimitError = new Error(
                "We're hitting the Project Gutenberg rate limit. Please wait a moment and try again.",
              );
              rateLimitError.code = 429;
              throw rateLimitError;
            }
            throw new Error("Unable to download book content.");
          }
          const text = await response.text();
          if (didCancel) return;

          applyContent(text);
          await persistContentToIndexedDb(text, "proxy");
          return;
        } catch (error) {
          lastError = error;
        }
      }

      if (didCancel) return;
      console.error("Failed to load book content", lastError);
      setContentError(
        lastError?.message ?? "Failed to load book content. Please try again.",
      );
      applyContent(DEFAULT_BOOK_CONTENT);
    };

    const resolveContent = async () => {
      const hasCache = await hydrateFromCache();
      if (hasCache) return;

      if (candidateUrls.length === 0) {
        setContentError("This title does not provide a plain text format.");
        applyContent(DEFAULT_BOOK_CONTENT);
        return;
      }

      await fetchContent();
    };

    resolveContent();

    return () => {
      didCancel = true;
    };
  }, [bookMeta, persistContentToIndexedDb, retrySignal, searchParams]);

  const handleRetryContentLoad = useCallback(() => {
    setContentError(null);
    setIsContentLoading(true);
    setEvictionPlan(null);
    setPendingContentJob(null);
    setRetrySignal((prev) => prev + 1);
  }, []);

  const handleNavigateHome = useCallback(() => {
    router.push("/main-reader-interface");
  }, [router]);

  const handleConfirmEviction = useCallback(async () => {
    if (!bookMeta?.id || !pendingContentJob || !evictionPlan) return;
    if (!evictionPlan?.suggested?.length) {
      setEvictionPlan(null);
      return;
    }

    setIsEvicting(true);
    try {
      const idsToEvict = evictionPlan.suggested
        .map((entry) => entry?.bookId)
        .filter(Boolean);
      if (idsToEvict.length > 0) {
        await evictBookContentEntries(idsToEvict);
      }

      const recheckPlan = await calculateEvictionPlan(
        pendingContentJob.byteSize,
      );
      if (recheckPlan && !recheckPlan.canStore) {
        setEvictionPlan(recheckPlan);
        return;
      }

      await saveBookContentToStore(bookMeta.id, pendingContentJob.text, {
        fetchedVia: pendingContentJob.fetchedVia ?? "proxy",
        bookSnapshot: pendingContentJob.bookSnapshot ?? bookMeta,
      });
      setPendingContentJob(null);
      setEvictionPlan(null);
    } catch (error) {
      console.error("Failed to evict cached books", error);
    } finally {
      setIsEvicting(false);
    }
  }, [bookMeta, pendingContentJob, evictionPlan]);

  const handleCancelEvictionPrompt = useCallback(() => {
    setPendingContentJob(null);
    setEvictionPlan(null);
  }, []);

  const words = useMemo(() => {
    if (!bookData?.content) return [];
    return bookData?.content?.split(/\s+/) ?? [];
  }, [bookData?.content]);

  const totalWords = bookData?.totalWords ?? words?.length ?? 0;

  const currentWord = useMemo(() => {
    if (!words?.length) return "";
    return words
      ?.slice(
        readingState?.currentWordIndex,
        readingState?.currentWordIndex + readingState?.wordsPerFrame,
      )
      ?.join(" ");
  }, [words, readingState?.currentWordIndex, readingState?.wordsPerFrame]);

  const readingProgress =
    totalWords > 0 ? (readingState?.currentWordIndex / totalWords) * 100 : 0;
  const loadingBookTitle =
    bookMeta?.title || searchParams?.get("bookTitle") || bookData?.title;

  useEffect(() => {
    applyThemeFromSettings(readingState?.theme);
  }, [readingState?.theme]);

  useEffect(() => {
    if (!bookMeta?.id || !bookData?.totalWords) return;
    let didCancel = false;

    const restoreProgress = async () => {
      try {
        const progress = await getReadingProgressRecord(bookMeta.id);
        if (!progress || didCancel) return;
        setReadingState((prev) => ({
          ...prev,
          currentWordIndex: Math.min(
            progress.currentWordIndex ?? 0,
            Math.max(0, (bookData?.totalWords ?? 1) - 1),
          ),
        }));
      } catch (error) {
        console.warn("Failed to restore reading progress", error);
      }
    };

    restoreProgress();

    return () => {
      didCancel = true;
    };
  }, [bookMeta?.id, bookData?.totalWords]);

  useEffect(() => {
    let isMounted = true;

    const hydrateReaderSettings = async () => {
      try {
        const persisted = await loadReaderSettings();
        if (!isMounted) return;
        setReadingState((prev) => ({
          ...prev,
          readingSpeed: persisted?.readingSpeed ?? prev.readingSpeed,
          wordsPerFrame: persisted?.wordsPerFrame ?? prev.wordsPerFrame,
          fontSize: persisted?.fontSize ?? prev.fontSize,
          fontFamily: persisted?.fontFamily || prev.fontFamily,
          theme: persisted?.theme || prev.theme,
          showFocalPoint:
            typeof persisted?.showFocalPoint === "boolean"
              ? persisted.showFocalPoint
              : prev.showFocalPoint,
          smartHighlighting:
            typeof persisted?.smartHighlighting === "boolean"
              ? persisted.smartHighlighting
              : prev.smartHighlighting,
          pauseOnPunctuation:
            typeof persisted?.pauseOnPunctuation === "boolean"
              ? persisted.pauseOnPunctuation
              : prev.pauseOnPunctuation,
          pauseOnLongWords:
            typeof persisted?.pauseOnLongWords === "boolean"
              ? persisted.pauseOnLongWords
              : prev.pauseOnLongWords,
        }));

        setHasHydratedSettings(true);
      } catch (error) {
        console.error("Failed to load reader settings", error);
        if (!isMounted) return;
        setHasHydratedSettings(true);
      }
    };

    hydrateReaderSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasHydratedSettings) return;
    let didCancel = false;

    const persistSettings = async () => {
      try {
        await saveReaderSettings(persistableSettings);
      } catch (error) {
        if (!didCancel) {
          console.error("Failed to persist reader settings", error);
        }
      }
    };

    persistSettings();

    return () => {
      didCancel = true;
    };
  }, [persistableSettings, hasHydratedSettings]);

  useEffect(() => {
    if (!bookMeta?.id || isContentLoading) return;

    const totalTrackedWords = totalWords ?? 0;
    if (totalTrackedWords <= 0) return;

    const progressPayload = {
      currentWordIndex: Math.min(
        readingState?.currentWordIndex ?? 0,
        Math.max(0, totalTrackedWords - 1),
      ),
      totalWords: totalTrackedWords,
      updatedAt: Date.now(),
    };

    saveReadingProgressRecord(bookMeta.id, progressPayload).catch((error) => {
      console.warn("Failed to persist reading progress", error);
    });
  }, [
    bookMeta?.id,
    totalWords,
    readingState?.currentWordIndex,
    isContentLoading,
  ]);

  useEffect(() => {
    if (playbackTimeoutRef.current) {
      clearTimeout(playbackTimeoutRef.current);
      playbackTimeoutRef.current = null;
    }

    if (
      !readingState?.isPlaying ||
      totalWords <= 0 ||
      readingState?.currentWordIndex >= totalWords - 1
    ) {
      return undefined;
    }

    const baseDelay =
      (60000 / readingState?.readingSpeed) * readingState?.wordsPerFrame;
    const nextIndex = Math.min(
      readingState?.currentWordIndex + readingState?.wordsPerFrame,
      totalWords - 1,
    );
    const upcomingWord = words?.[nextIndex];

    let delay = baseDelay;

    if (readingState?.pauseOnPunctuation && /[.!?;:]$/?.test(upcomingWord)) {
      delay += 300;
    }

    if (readingState?.pauseOnLongWords && upcomingWord?.length > 10) {
      delay += 200;
    }

    playbackTimeoutRef.current = setTimeout(() => {
      setReadingState((prev) => {
        const candidateIndex = prev?.currentWordIndex + prev?.wordsPerFrame;

        if (candidateIndex >= totalWords) {
          return {
            ...prev,
            isPlaying: false,
            currentWordIndex: totalWords - 1,
          };
        }

        return { ...prev, currentWordIndex: candidateIndex };
      });
    }, delay);

    return () => {
      if (playbackTimeoutRef.current) {
        clearTimeout(playbackTimeoutRef.current);
        playbackTimeoutRef.current = null;
      }
    };
  }, [
    readingState?.isPlaying,
    readingState?.readingSpeed,
    readingState?.wordsPerFrame,
    readingState?.pauseOnPunctuation,
    readingState?.pauseOnLongWords,
    readingState?.currentWordIndex,
    totalWords,
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
        Math.max(0, totalWords - 1),
        prev?.currentWordIndex + 10,
      ),
      isPlaying: false,
    }));
  }, [totalWords]);

  const handleProgressChange = useCallback(
    (newWordIndex) => {
      const targetIndex = Math.min(
        Math.max(newWordIndex, 0),
        Math.max(0, totalWords - 1),
      );

      setReadingState((prev) => ({
        ...prev,
        currentWordIndex: targetIndex,
        isPlaying: false,
      }));
    },
    [totalWords],
  );

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

  const handleSettingsSave = useCallback(async (newSettings) => {
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

    try {
      const persisted = await loadReaderSettings();
      const mergedSettings = {
        ...persisted,
        ...updatedState,
      };

      await saveReaderSettings(mergedSettings);
      applyThemeFromSettings(mergedSettings?.theme);
    } catch (error) {
      console.error("Failed to save reader settings", error);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <AppHeader
        navigationItems={[
          {
            key: "settings",
            label: "Settings",
            iconName: "Settings",
            variant: "ghost",
            onClick: () => setIsSettingsOpen(true),
          },
          {
            key: "library",
            label: "Library",
            iconName: "ArrowLeft",
            variant: "outline",
            onClick: () => router.push("/main-reader-interface"),
          },
        ]}
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

      {contentError && !isContentLoading && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 bg-background/95 backdrop-blur"
          role="alertdialog"
          aria-modal="true"
          aria-live="assertive"
        >
          <div className="w-full max-w-md bg-card border border-border/80 rounded-xl shadow-lg p-6 space-y-4 text-center">
            <div className="space-y-2">
              <p className="text-lg font-semibold text-foreground">
                We couldn’t load that book
              </p>
              <p className="text-sm text-muted-foreground">{contentError}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="default"
                className="flex-1"
                iconName="RotateCw"
                iconPosition="left"
                onClick={handleRetryContentLoad}
              >
                Retry download
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                iconName="Home"
                iconPosition="left"
                onClick={handleNavigateHome}
              >
                Back to library
              </Button>
            </div>
          </div>
        </div>
      )}

      <StorageEvictionDialog
        isOpen={Boolean(evictionPlan && !evictionPlan.canStore)}
        plan={evictionPlan}
        onConfirm={handleConfirmEviction}
        onCancel={handleCancelEvictionPrompt}
        isProcessing={isEvicting}
      />
    </div>
  );
};

export default RSVPReaderView;
