# SpeedReader IndexedDB Schema Proposal

## Context

- Today the library screen caches curated Project Gutenberg results inside `localStorage` (`speedReader:libraryBooks`); see [src/features/main-reader-interface/index.jsx](src/features/main-reader-interface/index.jsx).
- The RSVP reader proxies plain-text files through `/api/book-text` and saves the payload plus metadata in `speedReader:bookContent:<bookId>`/`speedReader:openedBooks`; see [src/features/rsvp-reader-view/index.jsx](src/features/rsvp-reader-view/index.jsx).
- Reading progress lives in `speedReader:progress:<bookId>` and personalization in `speedReader:settings`; see [src/utils/readerSettings.js](src/utils/readerSettings.js) and [src/features/settings-configuration/index.jsx](src/features/settings-configuration/index.jsx).

Instead of shipping this data to a remote, multi-user database, we want a richer **client-side** persistence layer that only serves the person currently using the browser. IndexedDB gives us structured storage, transactions, and binary support without leaving the device.

## Design Goals & Assumptions

1. **Single-tenant per browser profile** – no shared accounts, so user identity columns disappear. Every object belongs implicitly to the active browser profile.
2. **Offline-first** – all reader experiences must work without a network connection once the assets are cached.
3. **Replace localStorage keys** – provide one consistent schema that covers library metadata, full text blobs, reading progress, uploads, and settings.
4. **Versioned migrations** – IndexedDB upgrades allow us to evolve stores without data loss; proposal targets `SpeedReaderDB` v1 but describes future-proofing hooks.
5. **Space awareness** – book content can be large, so stores must support incremental cleanup (LRU) and expose byte sizes for dashboards.

## Database Layout Overview

**Database Name:** `SpeedReaderDB`

**Version:** `1`

| Object Store      | Purpose                                                    | Key Path                           |
| ----------------- | ---------------------------------------------------------- | ---------------------------------- |
| `books`           | Curated + user-upload metadata (similar to library cards). | `bookId` (string)                  |
| `bookContents`    | Full plain-text payloads and derived stats.                | `bookId` (string)                  |
| `library`         | User-specific library state (download flags, custom tags). | `bookId` (string)                  |
| `readingProgress` | Last known position per book.                              | `bookId` (string)                  |
| `readerSettings`  | Singleton settings document.                               | `id` (string, constant `"global"`) |
| `uploads`         | Temporary metadata for files the user drags in.            | autoIncrement id                   |
| `ingestionQueue`  | Tracks pending background fetches/retries.                 | autoIncrement id                   |

Each store lives in the same IndexedDB database to simplify transactions (e.g., updating `books`, `bookContents`, and `library` within one `readwrite` scope).

## Store Specifications

### books

- **Key path:** `bookId` (string). Use Gutenberg numeric ids or locally generated UUIDs for uploads.
- **Fields:**
  - `sourceType`: `'gutenberg' | 'upload' | 'clipboard'`.
  - `sourceIdentifier`: Gutendex id, uploaded filename hash, etc. (string).
  - `title`, `author`, `description`, `language`.
  - `categoryId`: matches UI filter slugs (`science-fiction`, `quick-reads`).
  - `subjects`: array of lowercase subject tags from Gutendex.
  - `coverImage`: object `{ url, width, height, byteSize }` (images can also go to Cache Storage; store pointer only).
  - `downloadCount`, `wordCountEstimate`, `estimatedMinutes` for prefetch heuristics.
  - `metadata`: free-form object for raw Gutendex payload or ingestion diagnostics.
  - `createdAt`, `updatedAt` (ISO strings).
- **Indexes:**
  - `idx_books_title` on `title` (enable prefix search via `IDBKeyRange.bound`).
  - `idx_books_author` on `author`.
  - `idx_books_category` on `categoryId`.

### bookContents

- **Key path:** `bookId` (string).
- **Fields:**
  - `content`: either plain text (string) or a Blob reference (for large EPUB-to-text conversions).
  - `wordCountActual`, `estimatedMinutesActual`.
  - `textChecksum`: SHA-256 or MD5 to detect stale caches.
  - `fetchedVia`: `'proxy' | 'upload' | 'clipboard'`.
  - `byteSize`: integer used for eviction decisions.
  - `cachedAt`, `updatedAt`.
- **Indexes:** `idx_bookContents_cachedAt` for pruning old books.

### library

- **Key path:** `bookId` (string).
- **Fields:**
  - `acquisitionType`: `'curated' | 'upload' | 'external'`.
  - `savedAt` (ISO string) – when book first surfaced in the library.
  - `hasDownloaded`: boolean (former `hasCachedContent`).
  - `localWordCount`: actual words from `bookContents` snapshot for UI stats.
  - `readProgress`: cached percent for card rendering (mirrors `readingProgress`).
  - `customTitle`, `notes`, `tags` (string array).
  - `lastOpenedAt`, `lastCompletedAt`.
- **Indexes:** `idx_library_savedAt`, `idx_library_hasDownloaded` for quick filtering.

### readingProgress

- **Key path:** `bookId`.
- **Fields:**
  - `currentWordIndex`: integer.
  - `totalWords`: integer (>= 1).
  - `percentComplete`: float cached for cards (compute client-side during writes).
  - `updatedAt`, `completedAt` (if finished).
- **Usage:** Replace `speedReader:progress:<bookId>`; updates happen alongside playback ticks with throttling.

### readerSettings

- **Key path:** `id` with a single record `{ id: "global", ...settings }`.
- **Fields:** `readingSpeed`, `wordsPerFrame`, `fontSize`, `fontFamily`, `theme`, `pauseOnPunctuation`, `pauseOnLongWords`, `showFocalPoint`, `smartHighlighting`, plus `updatedAt`.
- **Indexes:** none (single row). Consider additional store `readerSettingsHistory` later if diffs are required.

### uploads

- **Key path:** auto-increment integer `uploadId`.
- **Fields:**
  - `filename`, `extension`, `mimeType`, `byteSize`.
  - `status`: `'pending' | 'processing' | 'ready' | 'failed'`.
  - `errorMessage`.
  - `temporaryContent`: optional Blob/Text for quick preview before creating canonical `bookId`.
  - `createdAt`, `updatedAt`.
- **Validation:** reject files larger than **5 MB** up front to keep parsing predictable; store the enforcement result (`isRejected`, `reason`) so the UI can surface context.
- **Indexes:** `idx_uploads_status` to resume interrupted conversions.

### ingestionQueue

- **Key path:** auto-increment `jobId`.
- **Fields:**
  - `bookId` (string) – optional for targeted refresh.
  - `requestUrl`: Gutendex page or Gutenberg text URL.
  - `status`: `'pending' | 'running' | 'failed'`.
  - `retryCount`, `lastError`, `scheduledAt`.
- **Usage:** Enables background sync (via Service Worker) to refresh curated books without blocking the UI.

## Object Store Relationships

- `books` ↔ `bookContents`: 1:1 by `bookId`.
- `books` ↔ `library`: 1:1 for titles the user actually sees; `library` entry can exist even if `bookContents` has been evicted (lazy re-download).
- `library` ↔ `readingProgress`: 1:1 by `bookId`.
- `uploads` produce new entries in `books`, `bookContents`, and `library` once processing finishes.

Because IndexedDB lacks native foreign keys, relationships are enforced in application code. Each write path should wrap related changes in a single `readwrite` transaction to keep records in sync.

## Upgrade & Migration Strategy

1. **Version 1 (initial release)** – create all stores listed above. During the first load, migrate existing `localStorage` keys into the new stores, then delete the legacy keys.
2. **Future versions** – bump the database version and handle upgrades via `onupgradeneeded`. Examples:
   - v2: add `readerSettingsHistory` store for audit logs.
   - v3: introduce `annotations` store for highlights.

## Data Flows

1. **Curated feed refresh**
   - Fetch via `/api/books`.
   - In a single transaction: upsert `books` metadata, ensure `library` entries for curated slots (up to `TARGET_BOOK_COUNT`), and enqueue `ingestionQueue` jobs for text bodies not yet cached.

2. **Book download**
   - Worker pulls next `ingestionQueue` job, fetches `/api/book-text`, writes `bookContents` (text + stats) and updates `library.hasDownloaded = true` + `localWordCount`.
   - Optional: enforce max storage budget by deleting the oldest `bookContents` (ordered by `cachedAt`) and clearing the corresponding `hasDownloaded` flag.

3. **User upload / clipboard paste**
   - Insert placeholder into `uploads` (status `pending`).
   - Once parsed, create a `bookId`, populate `books`, `bookContents`, `library`, and `readingProgress` (starting at zero). Set `uploads.status = 'ready'` with a pointer to the new `bookId` for navigation.

4. **Reading session**

- Persist `readingProgress` every N words (debounced). Each save also updates `library.readProgress` so the card grid stays in sync.

5. **Settings change**
   - Update the singleton row in `readerSettings`. If historical tracking is desired, append to a lightweight array inside the same record or add a new store in a later version.

## Storage & Cleanup Considerations

- Budget awareness: track aggregate `byteSize` across `bookContents` to avoid exceeding Safari/Chrome quotas; when near the threshold, **prompt the reader** with options to evict the oldest titles (showing size + last opened info) before deleting anything.
- Blobs vs strings: prefer `Blob` for large texts to keep memory usage predictable. Use `Response.blob()` when capturing Gutenberg payloads, then stream to text only when opening a book.
- Backups: because IndexedDB is device-local, consider exposing an "Export Library" action that serializes all stores to a JSON + text bundle so users can migrate data manually.

## Open Questions

1. **How aggressive should eviction be?** Need a UX decision on whether to auto-delete old books or prompt the reader first.
2. **Should uploads store raw files?** Browser storage quotas might punish large PDFs; we may prefer to keep only derived plain text while streaming the original from the temporary File handle when needed.
3. **Export/import flows?** Define a portable format so readers can move their offline library between devices since IndexedDB is per browser profile.

This IndexedDB-first schema mirrors everything SpeedReader already does with `localStorage` while adding structure for richer offline experiences, background sync, and eventual analytics—all without leaving the user's browser.
