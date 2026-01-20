import { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import BookCard from './BookCard';

const LibrarySection = ({ books, searchQuery, activeCategory }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const filteredBooks = books?.filter((book) => {
    const matchesSearch = book?.title?.toLowerCase()?.includes(searchQuery?.toLowerCase()) ||
                         book?.author?.toLowerCase()?.includes(searchQuery?.toLowerCase());
    const matchesCategory = activeCategory === 'all' || book?.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

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
              {filteredBooks?.length} {filteredBooks?.length === 1 ? 'book' : 'books'} available
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          iconName={isCollapsed ? 'ChevronDown' : 'ChevronUp'}
        />
      </div>
      {!isCollapsed && (
        <div className="px-4 md:px-6 pb-6 animate-slide-down">
          {filteredBooks?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 md:py-16 space-y-4">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-muted flex items-center justify-center">
                <Icon name="BookX" size={32} className="text-muted-foreground" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-base md:text-lg font-semibold text-foreground">
                  No books found
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  {searchQuery || activeCategory !== 'all' ?'Try adjusting your search or filters' :'Upload your first book to get started'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {filteredBooks?.map((book) => (
                <BookCard key={book?.id} book={book} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LibrarySection;