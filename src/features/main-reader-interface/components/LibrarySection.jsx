import { useState } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import BookCard from "./BookCard";

const LibrarySection = ({
  books,
  searchQuery,
  activeCategory,
  isLoading = false,
  error = null,
  onRetry,
  onBookRemoved,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const filteredBooks = books?.filter((book) => {
    const matchesSearch =
      book?.title?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
      book?.author?.toLowerCase()?.includes(searchQuery?.toLowerCase());
    const matchesCategory =
      activeCategory === "all" || book?.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const downloadedBooks =
    filteredBooks?.filter((book) => book?.hasCachedContent) ?? [];
  const suggestedBooks =
    filteredBooks?.filter((book) => !book?.hasCachedContent) ?? [];

  const renderBookGrid = (collection) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {collection?.map((book) => (
        <BookCard
          key={book?.id ?? book?.title}
          book={book}
          onRemove={onBookRemoved}
        />
      ))}
    </div>
  );

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="w-full bg-card rounded-lg md:rounded-xl lg:rounded-2xl border border-border/60 overflow-hidden transition-all duration-300">
      <div
        className="flex items-center justify-between px-4 md:px-6 py-4 cursor-pointer hover:bg-muted/30 transition-colors duration-200"
        onClick={toggleCollapse}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon name="Library" size={20} color="var(--color-primary)" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl lg:text-2xl font-semibold text-foreground">
              Your Library
            </h2>
            <p className="text-sm text-muted-foreground">
              {filteredBooks?.length}{" "}
              {filteredBooks?.length === 1 ? "book" : "books"} available
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          iconName={isCollapsed ? "ChevronDown" : "ChevronUp"}
        />
      </div>
      {!isCollapsed && (
        <div className="px-4 md:px-6 pb-6 animate-slide-down">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 md:py-16 space-y-4">
              <div className="w-12 h-12 border-4 border-muted rounded-full border-t-primary animate-spin" />
              <div className="text-center space-y-1">
                <p className="text-base font-semibold text-foreground">
                  Loading curated titles
                </p>
                <p className="text-sm text-muted-foreground">
                  Pulling fresh books from Gutendex...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 md:py-16 space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <Icon
                  name="AlertTriangle"
                  size={32}
                  className="text-destructive"
                />
              </div>
              <div className="space-y-2">
                <h3 className="text-base md:text-lg font-semibold text-foreground">
                  Couldn&apos;t load your library
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  {error}
                </p>
              </div>
              {onRetry && (
                <Button variant="outline" onClick={onRetry}>
                  Try again
                </Button>
              )}
            </div>
          ) : filteredBooks?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 md:py-16 space-y-4">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-muted flex items-center justify-center">
                <Icon
                  name="BookX"
                  size={32}
                  className="text-muted-foreground"
                />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-base md:text-lg font-semibold text-foreground">
                  No books found
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  {searchQuery || activeCategory !== "all"
                    ? "Try adjusting your search or filters"
                    : "Upload your first book to get started"}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {downloadedBooks?.length > 0 && (
                <section className="space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <h3 className="text-base md:text-lg font-semibold text-foreground">
                        Your Library
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Titles you have already downloaded
                      </p>
                    </div>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground/80">
                      {downloadedBooks.length}{" "}
                      {downloadedBooks.length === 1 ? "Book" : "Books"}
                    </span>
                  </div>
                  {renderBookGrid(downloadedBooks)}
                </section>
              )}

              {suggestedBooks?.length > 0 && (
                <section className="space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <h3 className="text-base md:text-lg font-semibold text-foreground">
                        More Books
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Explore additional recommendations to download
                      </p>
                    </div>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground/80">
                      {suggestedBooks.length}{" "}
                      {suggestedBooks.length === 1
                        ? "Suggestion"
                        : "Suggestions"}
                    </span>
                  </div>
                  {renderBookGrid(suggestedBooks)}
                </section>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LibrarySection;
