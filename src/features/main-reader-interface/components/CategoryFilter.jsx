import Button from '../../../components/ui/Button';

const CategoryFilters = ({ activeCategory, onCategoryChange }) => {
  const categories = [
    { id: 'all', label: 'All', icon: 'Library' },
    { id: 'quick-reads', label: 'Quick Reads', icon: 'Zap' },
    { id: 'philosophy', label: 'Philosophy', icon: 'Brain' },
    { id: 'adventure', label: 'Adventure', icon: 'Compass' },
    { id: 'mystery', label: 'Mystery', icon: 'Search' },
    { id: 'science-fiction', label: 'Science Fiction', icon: 'Rocket' },
    { id: 'horror', label: 'Horror', icon: 'Ghost' },
    { id: 'romance', label: 'Romance', icon: 'Heart' },
    { id: 'science', label: 'Science', icon: 'Atom' },
    { id: 'poetry', label: 'Poetry', icon: 'Feather' },
    { id: 'self-improvement', label: 'Self-Improvement', icon: 'TrendingUp' },
    { id: 'humor', label: 'Humor', icon: 'Smile' },
    { id: 'classics', label: 'Classics', icon: 'BookMarked' }
  ];

  return (
    <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
      <div className="flex items-center gap-2 min-w-max px-1">
        {categories?.map((category) => (
          <Button
            key={category?.id}
            variant={activeCategory === category?.id ? 'default' : 'outline'}
            size="sm"
            iconName={category?.icon}
            iconPosition="left"
            onClick={() => onCategoryChange(category?.id)}
            className="flex-shrink-0"
          >
            {category?.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilters;