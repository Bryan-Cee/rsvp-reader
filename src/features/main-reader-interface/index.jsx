"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "../../components/navigation/AppHeader";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { remapGutenbergTextUrl } from "../../utils/gutenberg";
import {
  getLibraryBooksForUI,
  upsertLibraryBooks,
} from "../../utils/storage/indexedDb";
import FileUploadZone from "./components/FileUploadZone";
import LibrarySection from "./components/LibrarySection";
import CategoryFilters from "./components/CategoryFilter";

const TARGET_BOOK_COUNT = 10;

const CATEGORIES = [
  { id: "science-fiction", keywords: ["science fiction"] },
  { id: "adventure", keywords: ["adventure"] },
  { id: "mystery", keywords: ["mystery", "detective"] },
  { id: "philosophy", keywords: ["philosophy"] },
  { id: "science", keywords: ["science", "astronomy", "mathematics"] },
  { id: "horror", keywords: ["horror", "ghost"] },
  { id: "romance", keywords: ["romance", "love stories"] },
  { id: "poetry", keywords: ["poetry"] },
  { id: "self-improvement", keywords: ["education", "conduct"] },
  { id: "humor", keywords: ["humor"] },
  { id: "classics", keywords: ["classic", "literature"] },
];

const deriveCategory = (subjects = [], wordCount = 0) => {
  const normalizedSubjects = subjects
    ?.map((subject) => subject?.toLowerCase?.() ?? "")
    ?.filter(Boolean);

  for (const category of CATEGORIES) {
    if (
      category.keywords?.some((keyword) =>
        normalizedSubjects?.some((subject) => subject.includes(keyword)),
      )
    ) {
      return category.id;
    }
  }

  if (wordCount && wordCount <= 20000) {
    return "quick-reads";
  }

  return "classics";
};

const extractTextUrl = (formats = {}) => {
  const rawUrl =
    formats?.["text/plain; charset=utf-8"] ||
    formats?.["text/plain; charset=us-ascii"] ||
    formats?.["text/plain; charset=iso-8859-1"] ||
    formats?.["text/plain"] ||
    null;

  return remapGutenbergTextUrl(rawUrl);
};

const mapGutenbergBook = (book) => {
  const downloadCount = book?.download_count ?? 0;
  const wordCount = Math.max(15000, Math.min(120000, downloadCount * 40));
  const estimatedTime = Math.max(45, Math.round(wordCount / 250));
  const progress = Math.min(95, Math.round(downloadCount % 100));

  return {
    id: book?.id,
    title: book?.title,
    author: book?.authors?.[0]?.name ?? "Unknown Author",
    coverImage: book?.cover_image ?? book?.formats?.["image/jpeg"],
    coverImageAlt: book?.title
      ? `Cover art for ${book.title}`
      : "Decorative book cover placeholder",
    wordCount,
    estimatedTime,
    progress,
    category: deriveCategory(book?.subjects, wordCount),
    textUrl: extractTextUrl(book?.formats),
    hasCachedContent: false,
  };
};

const MainReaderInterface = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const fetchBooks = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);

    try {
      const response = await fetch(`/api/books?limit=${TARGET_BOOK_COUNT}`, {
        cache: "no-store",
      });

      if (!response?.ok) {
        throw new Error("Unable to fetch curated books from Project Gutenberg");
      }

      const payload = await response.json();
      const curatedBooks = (payload?.results ?? []).map(mapGutenbergBook);
      await upsertLibraryBooks(curatedBooks, { acquisitionType: "curated" });
      const hydratedBooks = await getLibraryBooksForUI();
      setBooks(hydratedBooks);
    } catch (error) {
      console.error("Failed to load Project Gutenberg books", error);
      setFetchError(
        error?.message ?? "Something went wrong while loading your library.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const hydrateFromIndexedDb = async () => {
      try {
        const cachedBooks = await getLibraryBooksForUI();
        if (isMounted && Array.isArray(cachedBooks) && cachedBooks.length > 0) {
          setBooks(cachedBooks);
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error("Failed to load cached library", error);
      }

      if (!isMounted) return;
      fetchBooks();
    };

    hydrateFromIndexedDb();

    return () => {
      isMounted = false;
    };
  }, [fetchBooks]);

  const handleFileUpload = (file) => {
    console.log("File uploaded:", file?.name);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e?.target?.value);
  };

  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
  };

  const handleSettingsClick = () => {
    router.push("/settings-configuration");
  };

  const handleRetry = () => {
    if (!isLoading) {
      fetchBooks();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        navigationItems={[
          {
            key: "settings",
            label: "Settings",
            iconName: "Settings",
            variant: "outline",
            onClick: handleSettingsClick,
          },
        ]}
      />
      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 lg:py-12 space-y-6 md:space-y-8 lg:space-y-12">
        <section>
          <FileUploadZone onFileUpload={handleFileUpload} />
        </section>

        <section className="space-y-4 md:space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold text-foreground">
                Browse Library
              </h2>
              <p className="text-sm md:text-base text-muted-foreground mt-1">
                Search and filter your reading collection
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              type="search"
              placeholder="Search by title or author..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <CategoryFilters
              activeCategory={activeCategory}
              onCategoryChange={handleCategoryChange}
            />
          </div>

          <LibrarySection
            books={books}
            searchQuery={searchQuery}
            activeCategory={activeCategory}
            isLoading={isLoading}
            error={fetchError}
            onRetry={handleRetry}
          />
        </section>
      </main>
      <footer className="bg-card border-t border-border/60 mt-12 md:mt-16 lg:mt-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              © {new Date()?.getFullYear()} SpeedReader. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
              >
                Help Center
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainReaderInterface;
