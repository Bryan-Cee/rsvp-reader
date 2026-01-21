"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import {
  recordBookOpenedSnapshot,
  deleteLibraryBook,
} from "../../../utils/storage/indexedDb";

const BookCard = ({ book, onRemove }) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const hasCachedContent = Boolean(book?.hasCachedContent);
  const readProgress = hasCachedContent
    ? Math.max(0, book?.readProgress ?? 0)
    : 0;

  const handleReadClick = () => {
    recordBookOpenedSnapshot(book).catch((error) => {
      console.warn("Failed to cache opened book", error);
    });

    const params = new URLSearchParams({
      bookId: book?.id ? String(book.id) : "",
      bookTitle: book?.title ?? "",
      bookAuthor: book?.author ?? "",
    });
    router.push(`/rsvp-reader-view?${params.toString()}`);
  };

  const formatReadingTime = (minutes) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getProgressColor = (progress) => {
    if (progress === 0) return "bg-muted";
    if (progress < 30) return "bg-warning";
    if (progress < 70) return "bg-secondary";
    return "bg-success";
  };
  const isPastedContent =
    book?.sourceType === "clipboard" || book?.acquisitionType === "clipboard";
  const actionLabel = isPastedContent ? "Edit pasted content" : "Delete book";
  const actionButtonClasses = isPastedContent
    ? ""
    : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto";

  const handleEditClick = (event) => {
    event.stopPropagation();
    console.log("Edit pasted content", book?.id ?? book?.title);
  };

  const handleDeleteClick = (event) => {
    event.stopPropagation();
    if (isDeleting) return;
    setIsConfirmingDelete(true);
  };

  const handleCancelDelete = () => {
    if (isDeleting) return;
    setIsConfirmingDelete(false);
  };

  const handleConfirmDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const deleted = await deleteLibraryBook(book?.id);
      if (deleted) {
        onRemove?.(book?.id);
      }
    } catch (error) {
      console.error("Failed to delete book", error);
    } finally {
      setIsConfirmingDelete(false);
      setIsDeleting(false);
    }
  };

  return (
    <div className="group w-full bg-card rounded-lg md:rounded-xl border border-border/60 overflow-hidden hover:shadow-sm hover:border-border hover:border-primary/30 transition-all duration-300">
      <div className="flex items-center justify-between px-4 md:px-5 py-3 bg-muted/30 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg bg-background/80 flex items-center justify-center">
            <Icon
              name="BookOpen"
              size={28}
              className="text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <span className="sr-only">Book placeholder icon</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          iconName={isPastedContent ? "Edit3" : "Trash2"}
          className={`transition-all duration-200 ${actionButtonClasses}`}
          aria-label={actionLabel}
          title={actionLabel}
          onClick={isPastedContent ? handleEditClick : handleDeleteClick}
          loading={isDeleting}
          disabled={isDeleting}
        >
          {isPastedContent ? "Edit" : "Delete"}
        </Button>
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <div className="space-y-1">
          <h3 className="text-base md:text-lg font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-200">
            {book?.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {book?.author}
          </p>
        </div>

        {hasCachedContent ? (
          <div className="flex items-center gap-4 text-xs md:text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Icon name="FileText" size={14} />
              <span className="font-data whitespace-nowrap">
                {book?.wordCount?.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Icon name="Clock" size={14} />
              <span className="whitespace-nowrap">
                {formatReadingTime(book?.estimatedTime)}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs md:text-sm text-muted-foreground italic">
            Start reading to view stats
          </p>
        )}

        {hasCachedContent && readProgress > 0 && (
          <div className="space-y-1">
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${getProgressColor(readProgress)} transition-all duration-300`}
                style={{ width: `${readProgress}%` }}
              />
            </div>
          </div>
        )}

        <Button
          variant={hasCachedContent ? "default" : "outline"}
          size="sm"
          iconName={hasCachedContent ? "PlayCircle" : "BookOpen"}
          iconPosition="left"
          fullWidth
          onClick={handleReadClick}
        >
          {hasCachedContent && readProgress > 0
            ? "Continue Reading"
            : "Start Reading"}
        </Button>
      </div>
      {isConfirmingDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`delete-dialog-title-${book?.id}`}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-background/90 backdrop-blur-sm px-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              handleCancelDelete();
            }
          }}
        >
          <div className="w-full max-w-md bg-card border border-border/70 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-destructive/70">
                Confirm delete
              </p>
              <h3
                id={`delete-dialog-title-${book?.id}`}
                className="text-xl font-semibold text-foreground"
              >
                Remove this book from your library?
              </h3>
              <p className="text-sm text-muted-foreground">
                This action deletes the cached book, its reading progress, and
                any downloaded content stored on this device. You can always
                reimport it later if needed.
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
              <p className="text-sm font-semibold text-foreground line-clamp-1">
                {book?.title || "Untitled"}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {book?.author || "Unknown author"}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <Button
                variant="outline"
                className="flex-1 sm:flex-none"
                onClick={handleCancelDelete}
                disabled={isDeleting}
              >
                Keep book
              </Button>
              <Button
                variant="destructive"
                className="flex-1 sm:flex-none"
                iconName={isDeleting ? "Loader2" : "Trash2"}
                iconPosition="left"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete book"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookCard;
