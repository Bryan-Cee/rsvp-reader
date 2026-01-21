"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import {
  recordBookOpenedSnapshot,
  deleteLibraryBook,
  getBookContentById,
  updateClipboardBook,
} from "../../../utils/storage/indexedDb";

const BookCard = ({ book, onRemove, onUpdated }) => {
  const router = useRouter();
  const [localBook, setLocalBook] = useState(book);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editTitle, setEditTitle] = useState(book?.title ?? "");
  const [editContent, setEditContent] = useState("");
  const [editError, setEditError] = useState("");

  useEffect(() => {
    setLocalBook(book);
    setEditTitle(book?.title ?? "");
  }, [book]);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    if (!isEditDialogOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarGap =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarGap > 0) {
      document.body.style.paddingRight = `${scrollbarGap}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [isEditDialogOpen]);

  const viewBook = localBook ?? book ?? {};
  const hasCachedContent = Boolean(viewBook?.hasCachedContent);
  const readProgress = hasCachedContent
    ? Math.max(0, viewBook?.readProgress ?? 0)
    : 0;

  const handleReadClick = () => {
    recordBookOpenedSnapshot(viewBook).catch((error) => {
      console.warn("Failed to cache opened book", error);
    });

    const params = new URLSearchParams({
      bookId: viewBook?.id ? String(viewBook.id) : "",
      bookTitle: viewBook?.title ?? "",
      bookAuthor: viewBook?.author ?? "",
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
    viewBook?.sourceType === "clipboard" ||
    viewBook?.acquisitionType === "clipboard";
  const actionLabel = isPastedContent ? "Edit pasted content" : "Delete book";
  const actionButtonClasses = isPastedContent
    ? ""
    : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto";

  const handleEditClick = async (event) => {
    event.stopPropagation();
    if (isLoadingEdit || isSavingEdit || !viewBook?.id) return;
    setIsEditDialogOpen(true);
    setIsLoadingEdit(true);
    setEditError("");
    setEditContent("");
    setEditTitle(viewBook?.title ?? "");

    try {
      const record = await getBookContentById(viewBook?.id);
      const existingContent = record?.content ?? "";
      setEditContent(existingContent);
      if (!existingContent) {
        setEditError(
          "We couldn't locate the stored text, but you can paste a new version.",
        );
      }
    } catch (error) {
      console.error("Failed to load pasted content", error);
      setEditError("Unable to load pasted text. Please try again.");
    } finally {
      setIsLoadingEdit(false);
    }
  };

  const handleCancelEdit = () => {
    if (isSavingEdit) return;
    setIsEditDialogOpen(false);
    setEditError("");
    setEditContent("");
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    if (isSavingEdit || isLoadingEdit) return;
    const content = editContent?.trim();
    if (!content) {
      setEditError("Please provide some text before saving.");
      return;
    }

    setIsSavingEdit(true);
    setEditError("");
    try {
      const updated = await updateClipboardBook({
        bookId: viewBook?.id,
        title: editTitle,
        content,
      });
      setLocalBook((prev) => ({ ...(prev ?? {}), ...updated }));
      setIsEditDialogOpen(false);
      setEditContent("");
      onUpdated?.();
    } catch (error) {
      console.error("Failed to update pasted book", error);
      setEditError(error?.message ?? "Unable to save changes right now.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteClick = (event) => {
    event?.stopPropagation?.();
    if (isDeleting) return;
    if (isEditDialogOpen) {
      setIsEditDialogOpen(false);
    }
    setIsConfirmingDelete(true);
  };

  const handleDeleteFromEdit = () => {
    if (isSavingEdit || isLoadingEdit || isDeleting) return;
    setIsEditDialogOpen(false);
    setTimeout(() => setIsConfirmingDelete(true), 100);
  };

  const handleCancelDelete = () => {
    if (isDeleting) return;
    setIsConfirmingDelete(false);
  };

  const handleConfirmDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const deleted = await deleteLibraryBook(viewBook?.id);
      if (deleted) {
        onRemove?.(viewBook?.id);
      }
    } catch (error) {
      console.error("Failed to delete book", error);
    } finally {
      setIsConfirmingDelete(false);
      setIsDeleting(false);
    }
  };

  const editWordCount = editContent?.trim()
    ? editContent.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const editCharCount = editContent.length;

  return (
    <div className="group w-full bg-card rounded-lg md:rounded-xl border border-border/60 overflow-hidden hover:shadow-sm hover:border-border hover:border-primary/30 transition-all duration-300">
      <div className="flex items-center justify-between px-4 md:px-5 py-3 bg-muted/30 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg bg-background/80 flex items-center justify-center">
            <Icon
              name={isPastedContent ? "FileText" : "BookOpen"}
              size={28}
              className="text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <span className="sr-only">
            {isPastedContent ? "Pasted document icon" : "Book placeholder icon"}
          </span>
        </div>
        <div className="flex items-center gap-2">
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
          />
          {isPastedContent && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              iconName="Trash2"
              className="text-destructive hover:text-destructive"
              aria-label="Delete pasted book"
              title="Delete pasted book"
              onClick={handleDeleteClick}
              loading={isDeleting}
              disabled={isDeleting}
            />
          )}
        </div>
      </div>
      <div className="p-4 md:p-5 space-y-3">
        <div className="space-y-1">
          <h3 className="text-base md:text-lg font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-200">
            {viewBook?.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {viewBook?.author}
          </p>
        </div>

        {hasCachedContent ? (
          <div className="flex items-center gap-4 text-xs md:text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Icon name="FileText" size={14} />
              <span className="font-data whitespace-nowrap">
                {viewBook?.wordCount?.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Icon name="Clock" size={14} />
              <span className="whitespace-nowrap">
                {formatReadingTime(viewBook?.estimatedTime)}
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

      {isEditDialogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`edit-dialog-title-${viewBook?.id}`}
          className="fixed inset-0 z-[85] flex items-center justify-center bg-background/90 backdrop-blur-sm px-4 overflow-y-auto"
        >
          <div
            className="w-full max-w-3xl bg-card border border-border/70 rounded-2xl shadow-2xl p-6 space-y-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/70">
                Edit pasted book
              </p>
              <h3
                id={`edit-dialog-title-${viewBook?.id}`}
                className="text-2xl font-semibold text-foreground"
              >
                Update your pasted text
              </h3>
              <p className="text-sm text-muted-foreground">
                Adjust the title or content below. Changes stay on this device
                and update instantly in your library.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleEditSubmit}>
              <div className="space-y-2">
                <label
                  htmlFor={`edit-title-${viewBook?.id}`}
                  className="text-sm font-medium text-foreground"
                >
                  Title
                </label>
                <Input
                  id={`edit-title-${viewBook?.id}`}
                  value={editTitle}
                  onChange={(event) => setEditTitle(event?.target?.value)}
                  disabled={isLoadingEdit || isSavingEdit}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor={`edit-content-${viewBook?.id}`}
                    className="text-sm font-medium text-foreground"
                  >
                    Pasted text
                  </label>
                  {isLoadingEdit && (
                    <span className="text-xs text-muted-foreground">
                      Loading saved text...
                    </span>
                  )}
                </div>
                <textarea
                  id={`edit-content-${viewBook?.id}`}
                  className="w-full min-h-[260px] rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  value={editContent}
                  onChange={(event) => setEditContent(event?.target?.value)}
                  disabled={isLoadingEdit || isSavingEdit}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {editWordCount} words • {editCharCount} characters
                  </span>
                  <span>
                    Estimated{" "}
                    {Math.max(1, Math.round(Math.max(editWordCount, 1) / 250))}{" "}
                    min read
                  </span>
                </div>
              </div>

              {editError && (
                <p className="text-sm text-destructive" role="status">
                  {editError}
                </p>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:flex-1"
                  onClick={handleCancelEdit}
                  disabled={isSavingEdit}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  className="w-full sm:flex-1"
                  iconName={isSavingEdit ? "Loader2" : "Save"}
                  iconPosition="left"
                  loading={isSavingEdit}
                  disabled={isSavingEdit || isLoadingEdit}
                >
                  {isSavingEdit ? "Saving..." : "Save changes"}
                </Button>
              </div>

              {isPastedContent && (
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full"
                  iconName={isDeleting ? "Loader2" : "Trash2"}
                  iconPosition="left"
                  onClick={handleDeleteFromEdit}
                  disabled={isDeleting || isSavingEdit || isLoadingEdit}
                >
                  {isDeleting ? "Deleting..." : "Delete from library"}
                </Button>
              )}
            </form>
          </div>
        </div>
      )}

      {isConfirmingDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`delete-dialog-title-${viewBook?.id}`}
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
                id={`delete-dialog-title-${viewBook?.id}`}
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
                {viewBook?.title || "Untitled"}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {viewBook?.author || "Unknown author"}
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
