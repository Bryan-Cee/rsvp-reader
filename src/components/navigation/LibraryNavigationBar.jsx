import { useState } from 'react';
import Icon from '../AppIcon';
import Input from '../ui/Input';
import Button from '../ui/Button';

const LibraryNavigationBar = ({ onSearchChange, onFilterChange, onViewChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const filterOptions = [
    { id: 'all', label: 'All Books', icon: 'Library' },
    { id: 'recent', label: 'Recent', icon: 'Clock' },
    { id: 'favorites', label: 'Favorites', icon: 'Star' },
    { id: 'in-progress', label: 'In Progress', icon: 'BookOpen' },
    { id: 'completed', label: 'Completed', icon: 'CheckCircle' }
  ];

  const handleSearchChange = (e) => {
    const value = e?.target?.value;
    setSearchQuery(value);
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  const handleFilterClick = (filterId) => {
    setActiveFilter(filterId);
    if (onFilterChange) {
      onFilterChange(filterId);
    }
    setIsFilterDrawerOpen(false);
  };

  const handleViewToggle = (mode) => {
    setViewMode(mode);
    if (onViewChange) {
      onViewChange(mode);
    }
  };

  return (
    <nav className="library-nav-bar">
      <div className="library-nav-content">
        <div className="library-search-container">
          <Input
            type="search"
            placeholder="Search books by title, author..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>

        <div className="hidden md:flex library-filter-chips">
          {filterOptions?.map((filter) => (
            <Button
              key={filter?.id}
              variant={activeFilter === filter?.id ? 'default' : 'outline'}
              size="sm"
              iconName={filter?.icon}
              iconPosition="left"
              onClick={() => handleFilterClick(filter?.id)}
            >
              {filter?.label}
            </Button>
          ))}
        </div>

        <div className="md:hidden">
          <Button
            variant="outline"
            size="sm"
            iconName="Filter"
            onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
          >
            Filter
          </Button>
        </div>

        <div className="library-view-toggle hidden md:flex">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="icon"
            iconName="Grid3x3"
            onClick={() => handleViewToggle('grid')}
          />
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="icon"
            iconName="List"
            onClick={() => handleViewToggle('list')}
          />
        </div>
      </div>
      {isFilterDrawerOpen && (
        <div className="md:hidden border-t border-border/60 bg-muted/30 px-4 py-3 animate-slide-down">
          <div className="space-y-2">
            {filterOptions?.map((filter) => (
              <button
                key={filter?.id}
                onClick={() => handleFilterClick(filter?.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  activeFilter === filter?.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-foreground hover:bg-muted'
                }`}
              >
                <Icon name={filter?.icon} size={18} />
                <span>{filter?.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default LibraryNavigationBar;