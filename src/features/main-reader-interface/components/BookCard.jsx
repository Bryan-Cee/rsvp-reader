"use client";

import { useRouter } from "next/navigation";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";

const OPENED_BOOKS_KEY = "speedReader:openedBooks";

const BookCard = ({ book }) => {
  const router = useRouter();
  const hasCachedContent = Boolean(book?.hasCachedContent);
  const readProgress = hasCachedContent
    ? Math.max(0, book?.readProgress ?? 0)
    : 0;

  const handleReadClick = () => {
    if (typeof window !== "undefined") {
      try {
        const existing = window.localStorage.getItem(OPENED_BOOKS_KEY);
        const parsed = existing ? JSON.parse(existing) : {};
        if (book?.id) {
          parsed[book.id] = book;
        }
        window.localStorage.setItem(OPENED_BOOKS_KEY, JSON.stringify(parsed));
      } catch (error) {
        console.warn("Failed to cache opened book", error);
      }
    }

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

  const fallbackCover = "/assets/images/no_image.png";
  const coverImageSrc = book?.coverImage || fallbackCover;
  const coverImageAlt =
    book?.coverImageAlt ||
    (book?.title ? `Cover art for ${book.title}` : "Book cover placeholder");

  return (
    <div className="group w-full bg-card rounded-lg md:rounded-xl border border-border/60 overflow-hidden hover:shadow-sm hover:border-border hover:border-primary/30 transition-all duration-300">
      <div className="relative w-full bg-muted/50 aspect-[3/4] overflow-hidden">
        <img
          src={coverImageSrc}
          alt={coverImageAlt}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(event) => {
            if (event?.currentTarget?.src !== fallbackCover) {
              event.currentTarget.src = fallbackCover;
            }
          }}
        />
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
    </div>
  );
};

export default BookCard;
