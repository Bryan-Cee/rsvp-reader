const DB_NAME = "SpeedReaderDB";
const DB_VERSION = 1;
const MIGRATION_FLAG_KEY = "speedReader:migratedToIndexedDb";
const LEGACY_LIBRARY_KEY = "speedReader:libraryBooks";
const LEGACY_SETTINGS_KEY = "speedReader:settings";
const LEGACY_BOOK_CONTENT_PREFIX = "speedReader:bookContent:";
const LEGACY_PROGRESS_PREFIX = "speedReader:progress:";

export const STORE_NAMES = {
  books: "books",
  bookContents: "bookContents",
  library: "library",
  readingProgress: "readingProgress",
  readerSettings: "readerSettings",
  uploads: "uploads",
  ingestionQueue: "ingestionQueue",
};

export const MAX_STORAGE_BYTES = 200 * 1024 * 1024; // 200 MB budget

let dbPromise = null;

const getIndexedDb = () => {
  if (typeof window === "undefined") return null;
  return window.indexedDB || null;
};

const createStoreIfMissing = (db, name, options = {}, indexes = []) => {
  if (db.objectStoreNames.contains(name)) return;
  const store = db.createObjectStore(name, options);
  indexes.forEach((index) => {
    store.createIndex(index.name, index.keyPath, index.options ?? {});
  });
};

const handleUpgrade = (event) => {
  const db = event?.target?.result;
  if (!db) return;

  createStoreIfMissing(db, STORE_NAMES.books, { keyPath: "bookId" }, [
    { name: "title", keyPath: "bookSnapshot.title" },
    { name: "author", keyPath: "bookSnapshot.author" },
    { name: "categoryId", keyPath: "bookSnapshot.categoryId" },
  ]);

  createStoreIfMissing(db, STORE_NAMES.bookContents, { keyPath: "bookId" }, [
    { name: "cachedAt", keyPath: "cachedAt" },
  ]);

  createStoreIfMissing(db, STORE_NAMES.library, { keyPath: "bookId" }, [
    { name: "savedAt", keyPath: "savedAt" },
    { name: "hasDownloaded", keyPath: "hasDownloaded" },
  ]);

  createStoreIfMissing(db, STORE_NAMES.readingProgress, { keyPath: "bookId" });
  createStoreIfMissing(db, STORE_NAMES.readerSettings, { keyPath: "id" });

  createStoreIfMissing(db, STORE_NAMES.uploads, {
    keyPath: "uploadId",
    autoIncrement: true,
  });

  createStoreIfMissing(db, STORE_NAMES.ingestionQueue, {
    keyPath: "jobId",
    autoIncrement: true,
  });
};

export const isIndexedDbSupported = () => Boolean(getIndexedDb());

export const openDatabase = () => {
  if (typeof window === "undefined") return Promise.resolve(null);
  const indexedDb = getIndexedDb();
  if (!indexedDb) {
    console.warn("IndexedDB is not supported in this environment.");
    return Promise.resolve(null);
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDb.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = handleUpgrade;
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => db.close();
        resolve(db);
      };
      request.onerror = () => {
        dbPromise = null;
        reject(request.error ?? new Error("Failed to open IndexedDB"));
      };
      request.onblocked = () => {
        console.warn("SpeedReaderDB upgrade blocked by another tab.");
      };
    });
  }

  return dbPromise;
};

export const getAllFromStore = async (storeName) => {
  const db = await openDatabase();
  if (!db) return [];

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result ?? []);
    request.onerror = () => reject(request.error);
  });
};

export const getByKey = async (storeName, key) => {
  if (!key && key !== 0) return null;
  const db = await openDatabase();
  if (!db) return null;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
};

export const putValue = async (storeName, value) => {
  const db = await openDatabase();
  if (!db) return null;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    store.put(value);
    tx.oncomplete = () => resolve(value);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("Failed to persist value"));
  });
};

export const deleteByKey = async (storeName, key) => {
  const db = await openDatabase();
  if (!db) return null;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    store.delete(key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("Failed to delete value"));
  });
};

const textEncoder = typeof TextEncoder !== "undefined" ? new TextEncoder() : null;

export const estimateTextByteSize = (text = "") => {
  if (!textEncoder) return text.length * 2;
  return textEncoder.encode(text).length;
};

const countWords = (text = "") => {
  return text
    ?.trim()
    ?.split(/\s+/)
    ?.filter(Boolean)?.length ?? 0;
};

const normalizeBookId = (bookId) =>
  bookId !== undefined && bookId !== null ? String(bookId) : undefined;

const generateLocalBookId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `clipboard-${crypto.randomUUID()}`;
  }
  return `clipboard-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const mergeSnapshotWithLibrary = (entry) => {
  if (!entry) return null;
  const snapshot = entry.bookSnapshot ?? {};
  const localWordCount = entry.localWordCount ?? snapshot.wordCount ?? 0;
  const estimatedTime = snapshot.estimatedTime
    ? snapshot.estimatedTime
    : localWordCount > 0
      ? Math.max(1, Math.round(localWordCount / 250))
      : snapshot.estimatedTime;

  return {
    ...snapshot,
    id: snapshot.id ?? entry.bookId,
    acquisitionType: entry?.acquisitionType ?? "curated",
    hasCachedContent: Boolean(entry.hasDownloaded),
    readProgress: entry.readProgress ?? 0,
    wordCount: localWordCount,
    estimatedTime,
    category: snapshot.category ?? snapshot.categoryId ?? "classics",
    textUrl: snapshot.textUrl ?? null,
    hasDownloaded: Boolean(entry.hasDownloaded),
    savedAt: entry.savedAt,
    lastOpenedAt: entry.lastOpenedAt,
  };
};

export const getLibraryBooksForUI = async () => {
  const entries = await getAllFromStore(STORE_NAMES.library);
  return (entries ?? [])
    .map((entry) => mergeSnapshotWithLibrary(entry))
    .filter(Boolean)
    .sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0));
};

export const getLibraryEntry = async (bookId) => {
  const normalized = normalizeBookId(bookId);
  if (!normalized) return null;
  return getByKey(STORE_NAMES.library, normalized);
};

export const getBookRecord = async (bookId) => {
  const normalized = normalizeBookId(bookId);
  if (!normalized) return null;
  return getByKey(STORE_NAMES.books, normalized);
};

export const upsertLibraryBooks = async (books = [], options = {}) => {
  if (!books?.length) return [];
  const existingEntries = await getAllFromStore(STORE_NAMES.library);
  const entryMap = new Map(
    (existingEntries ?? []).map((entry) => [entry.bookId, entry])
  );

  const db = await openDatabase();
  if (!db) return [];

  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      [STORE_NAMES.books, STORE_NAMES.library],
      "readwrite",
    );
    const booksStore = tx.objectStore(STORE_NAMES.books);
    const libraryStore = tx.objectStore(STORE_NAMES.library);
    const timestamp = Date.now();

    books.forEach((book) => {
      const bookId = normalizeBookId(book?.id);
      if (!bookId) return;
      const previousEntry = entryMap.get(bookId);

      const snapshot = {
        ...book,
        id: bookId,
        categoryId: book?.category ?? book?.categoryId,
      };

      booksStore.put({ bookId, bookSnapshot: snapshot });

      const payload = {
        ...(previousEntry ?? {}),
        bookId,
        acquisitionType: previousEntry?.acquisitionType ?? options.acquisitionType ?? "curated",
        savedAt: previousEntry?.savedAt ?? timestamp,
        hasDownloaded: previousEntry?.hasDownloaded ?? Boolean(book?.hasCachedContent),
        localWordCount: previousEntry?.localWordCount ?? book?.wordCount ?? null,
        readProgress: previousEntry?.readProgress ?? book?.readProgress ?? 0,
        tags: previousEntry?.tags ?? [],
        bookSnapshot: snapshot,
      };

      libraryStore.put(payload);
    });

    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("Failed to upsert library"));
  });
};

export const getBookContentById = async (bookId) => {
  const normalized = normalizeBookId(bookId);
  if (!normalized) return null;
  return getByKey(STORE_NAMES.bookContents, normalized);
};

export const saveBookContentToStore = async (
  bookId,
  content,
  { fetchedVia = "proxy", bookSnapshot = null } = {},
) => {
  const normalized = normalizeBookId(bookId);
  if (!normalized || typeof content !== "string") {
    throw new Error("Invalid book content payload");
  }

  const byteSize = estimateTextByteSize(content);
  const wordCountActual = countWords(content);
  const record = {
    bookId: normalized,
    content,
    wordCountActual,
    estimatedMinutesActual: Math.max(1, Math.round(wordCountActual / 250)),
    textChecksum: null,
    fetchedVia,
    byteSize,
    cachedAt: Date.now(),
    updatedAt: Date.now(),
  };

  const db = await openDatabase();
  if (!db) return null;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      [STORE_NAMES.bookContents, STORE_NAMES.library],
      "readwrite",
    );
    const contentStore = tx.objectStore(STORE_NAMES.bookContents);
    const libraryStore = tx.objectStore(STORE_NAMES.library);

    contentStore.put(record);

    const libraryRequest = libraryStore.get(normalized);
    libraryRequest.onsuccess = () => {
      const existing = libraryRequest.result ?? {
        bookId: normalized,
        acquisitionType: "curated",
        savedAt: Date.now(),
        tags: [],
      };

      libraryStore.put({
        ...existing,
        hasDownloaded: true,
        localWordCount: record.wordCountActual,
        bookSnapshot: bookSnapshot ?? existing.bookSnapshot ?? null,
      });
    };
    libraryRequest.onerror = () => {
      libraryStore.put({
        bookId: normalized,
        acquisitionType: "curated",
        savedAt: Date.now(),
        tags: [],
        hasDownloaded: true,
        localWordCount: record.wordCountActual,
        bookSnapshot,
      });
    };

    tx.oncomplete = () => resolve(record);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("Failed to cache book"));
  });
};

export const saveReadingProgressRecord = async (bookId, progress) => {
  const normalized = normalizeBookId(bookId);
  if (!normalized || !progress) return null;

  const payload = {
    bookId: normalized,
    currentWordIndex: progress.currentWordIndex ?? 0,
    totalWords: progress.totalWords ?? 1,
    percentComplete:
      progress.percentComplete ??
      Math.min(
        100,
        Math.max(0, ((progress.currentWordIndex ?? 0) / Math.max(progress.totalWords ?? 1, 1)) * 100),
      ),
    updatedAt: progress.updatedAt ?? Date.now(),
    completedAt: progress.completedAt ?? null,
  };

  await putValue(STORE_NAMES.readingProgress, payload);

  const entry = await getLibraryEntry(normalized);
  if (entry) {
    await putValue(STORE_NAMES.library, {
      ...entry,
      readProgress: payload.percentComplete,
    });
  }

  return payload;
};

export const getReadingProgressRecord = async (bookId) => {
  const normalized = normalizeBookId(bookId);
  if (!normalized) return null;
  return getByKey(STORE_NAMES.readingProgress, normalized);
};

export const recordBookOpenedSnapshot = async (book) => {
  const bookId = normalizeBookId(book?.id);
  if (!bookId) return null;

  const entry = await getLibraryEntry(bookId);
  const payload = {
    ...(entry ?? {
      bookId,
      acquisitionType: "curated",
      savedAt: Date.now(),
      tags: [],
    }),
    lastOpenedAt: Date.now(),
    hasDownloaded: entry?.hasDownloaded ?? Boolean(book?.hasCachedContent),
    localWordCount: entry?.localWordCount ?? book?.wordCount ?? null,
    readProgress: entry?.readProgress ?? book?.readProgress ?? 0,
    bookSnapshot: {
      ...book,
      id: bookId,
    },
  };

  return putValue(STORE_NAMES.library, payload);
};

export const createClipboardBook = async ({ title, content, author = "Clipboard Import" }) => {
  const normalizedContent = content?.trim();
  if (!normalizedContent) {
    throw new Error("Pasted content cannot be empty.");
  }

  const bookTitle = title?.trim() || "Untitled Paste";
  const bookId = generateLocalBookId();
  const wordCountActual = countWords(normalizedContent);
  const estimatedMinutes = Math.max(1, Math.round(wordCountActual / 250));

  const snapshot = {
    id: bookId,
    title: bookTitle,
    author: author?.trim() || "Clipboard Import",
    sourceType: "clipboard",
    category: "quick-reads",
    wordCount: wordCountActual,
    estimatedTime: estimatedMinutes,
    hasCachedContent: true,
    readProgress: 0,
    textUrl: null,
    coverImage: null,
    coverImageAlt: `Clipboard entry for ${bookTitle}`,
  };

  await upsertLibraryBooks([snapshot], { acquisitionType: "clipboard" });
  await saveBookContentToStore(bookId, normalizedContent, {
    fetchedVia: "clipboard",
    bookSnapshot: snapshot,
  });

  const entry = await getLibraryEntry(bookId);
  return mergeSnapshotWithLibrary(entry) ?? snapshot;
};

export const updateClipboardBook = async ({ bookId, title, content }) => {
  const normalizedId = normalizeBookId(bookId);
  if (!normalizedId) {
    throw new Error("Invalid book id provided.");
  }

  const existingEntry = await getLibraryEntry(normalizedId);
  if (!existingEntry) {
    throw new Error("Unable to find this pasted book on your device.");
  }

  const existingSnapshot = existingEntry.bookSnapshot ?? {};
  const acquisition = existingEntry.acquisitionType ?? existingSnapshot.sourceType;
  const isClipboardSource =
    acquisition === "clipboard" || existingSnapshot?.sourceType === "clipboard";
  if (!isClipboardSource) {
    throw new Error("Only pasted books can be edited.");
  }

  const normalizedContent = content?.trim();
  if (!normalizedContent) {
    throw new Error("Updated content cannot be empty.");
  }

  const nextTitle = title?.trim() || existingSnapshot.title || "Untitled Paste";
  const wordCountActual = countWords(normalizedContent);
  const estimatedMinutes = Math.max(1, Math.round(wordCountActual / 250));

  const updatedSnapshot = {
    ...existingSnapshot,
    id: normalizedId,
    title: nextTitle,
    author: existingSnapshot.author ?? "Clipboard Import",
    sourceType: "clipboard",
    wordCount: wordCountActual,
    estimatedTime: estimatedMinutes,
    hasCachedContent: true,
    coverImage: existingSnapshot.coverImage ?? null,
    coverImageAlt:
      existingSnapshot.coverImageAlt ?? `Clipboard entry for ${nextTitle}`,
  };

  await saveBookContentToStore(normalizedId, normalizedContent, {
    fetchedVia: "clipboard-edit",
    bookSnapshot: updatedSnapshot,
  });

  const updatedEntry = await getLibraryEntry(normalizedId);
  return mergeSnapshotWithLibrary(updatedEntry) ?? updatedSnapshot;
};

export const deleteLibraryBook = async (bookId) => {
  const normalized = normalizeBookId(bookId);
  if (!normalized) return false;
  const db = await openDatabase();
  if (!db) return false;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      [
        STORE_NAMES.library,
        STORE_NAMES.books,
        STORE_NAMES.bookContents,
        STORE_NAMES.readingProgress,
      ],
      "readwrite",
    );

    tx.objectStore(STORE_NAMES.library).delete(normalized);
    tx.objectStore(STORE_NAMES.books).delete(normalized);
    tx.objectStore(STORE_NAMES.bookContents).delete(normalized);
    tx.objectStore(STORE_NAMES.readingProgress).delete(normalized);

    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () =>
      reject(tx.error ?? new Error("Failed to delete library book"));
  });
};

const summarizeBookContents = async () => {
  const entries = await getAllFromStore(STORE_NAMES.bookContents);
  const totalBytes = (entries ?? []).reduce(
    (total, entry) => total + (entry?.byteSize ?? 0),
    0,
  );
  return { entries: entries ?? [], totalBytes };
};

export const calculateEvictionPlan = async (requiredBytes) => {
  const targetBytes = Math.max(0, requiredBytes ?? 0);
  const { entries, totalBytes } = await summarizeBookContents();
  if (totalBytes + targetBytes <= MAX_STORAGE_BYTES) {
    return {
      canStore: true,
      totalBytes,
      maxBytes: MAX_STORAGE_BYTES,
      requiredBytes: targetBytes,
      suggested: [],
      bytesToFree: 0,
    };
  }

  const libraryEntries = await getAllFromStore(STORE_NAMES.library);
  const libraryMap = new Map(
    (libraryEntries ?? []).map((entry) => [entry.bookId, entry])
  );

  const sorted = entries
    .map((entry) => {
      const library = libraryMap.get(entry.bookId);
      return {
        bookId: entry.bookId,
        byteSize: entry.byteSize ?? 0,
        cachedAt: entry.cachedAt ?? 0,
        lastOpenedAt: library?.lastOpenedAt ?? 0,
        title: library?.bookSnapshot?.title ?? "Unknown title",
        author: library?.bookSnapshot?.author ?? "Unknown author",
      };
    })
    .sort((a, b) => {
      const aScore = a.lastOpenedAt ?? 0;
      const bScore = b.lastOpenedAt ?? 0;
      if (aScore === bScore) {
        return (a.cachedAt ?? 0) - (b.cachedAt ?? 0);
      }
      return aScore - bScore;
    });

  let bytesToFree = totalBytes + targetBytes - MAX_STORAGE_BYTES;
  const suggested = [];

  for (const entry of sorted) {
    if (bytesToFree <= 0) break;
    suggested.push(entry);
    bytesToFree -= entry.byteSize;
  }

  return {
    canStore: false,
    totalBytes,
    maxBytes: MAX_STORAGE_BYTES,
    requiredBytes: targetBytes,
    suggested,
    bytesToFree: Math.max(0, totalBytes + targetBytes - MAX_STORAGE_BYTES),
  };
};

export const evictBookContentEntries = async (bookIds = []) => {
  if (!bookIds?.length) return false;
  const db = await openDatabase();
  if (!db) return false;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      [STORE_NAMES.bookContents, STORE_NAMES.library],
      "readwrite",
    );
    const contentStore = tx.objectStore(STORE_NAMES.bookContents);
    const libraryStore = tx.objectStore(STORE_NAMES.library);

    bookIds.forEach((bookId) => {
      const normalized = normalizeBookId(bookId);
      if (!normalized) return;
      contentStore.delete(normalized);
      const request = libraryStore.get(normalized);
      request.onsuccess = () => {
        const entry = request.result;
        if (!entry) return;
        libraryStore.put({
          ...entry,
          hasDownloaded: false,
          localWordCount: null,
          readProgress: entry.readProgress ?? 0,
        });
      };
    });

    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("Failed to evict book content"));
  });
};

export const getReaderSettingsRecord = async () => {
  const record = await getByKey(STORE_NAMES.readerSettings, "global");
  if (!record) return null;
  const { id, ...settings } = record;
  return settings;
};

export const putReaderSettingsRecord = async (settings = {}) => {
  if (typeof window === "undefined") return null;
  return putValue(STORE_NAMES.readerSettings, {
    id: "global",
    ...settings,
    updatedAt: Date.now(),
  });
};

const migrateLegacyLibrary = async () => {
  try {
    const raw = window.localStorage.getItem(LEGACY_LIBRARY_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      await upsertLibraryBooks(parsed, { acquisitionType: "curated" });
    }
  } catch (error) {
    console.error("Failed to migrate legacy library", error);
  }
};

const migrateLegacySettings = async () => {
  try {
    const raw = window.localStorage.getItem(LEGACY_SETTINGS_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      await putReaderSettingsRecord(parsed);
    }
  } catch (error) {
    console.error("Failed to migrate legacy settings", error);
  }
};

const migrateLegacyBookContents = async () => {
  const keys = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (key?.startsWith(LEGACY_BOOK_CONTENT_PREFIX)) {
      keys.push(key);
    }
  }

  for (const key of keys) {
    const bookId = key.replace(LEGACY_BOOK_CONTENT_PREFIX, "");
    const content = window.localStorage.getItem(key);
    if (bookId && content) {
      try {
        await saveBookContentToStore(bookId, content, { fetchedVia: "legacy" });
      } catch (error) {
        console.error(`Failed to migrate book ${bookId}`, error);
      }
    }
    window.localStorage.removeItem(key);
  }
};

const migrateLegacyProgress = async () => {
  const keys = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (key?.startsWith(LEGACY_PROGRESS_PREFIX)) {
      keys.push(key);
    }
  }

  for (const key of keys) {
    const bookId = key.replace(LEGACY_PROGRESS_PREFIX, "");
    const payload = window.localStorage.getItem(key);
    if (bookId && payload) {
      try {
        const parsed = JSON.parse(payload);
        await saveReadingProgressRecord(bookId, parsed);
      } catch (error) {
        console.error(`Failed to migrate progress for ${bookId}`, error);
      }
    }
    window.localStorage.removeItem(key);
  }
};

export const migrateLegacyStorage = async () => {
  if (typeof window === "undefined") return;
  if (!isIndexedDbSupported()) return;
  if (window.localStorage.getItem(MIGRATION_FLAG_KEY) === "1") return;

  await migrateLegacyLibrary();
  await migrateLegacySettings();
  await migrateLegacyBookContents();
  await migrateLegacyProgress();

  window.localStorage.setItem(MIGRATION_FLAG_KEY, "1");
};
