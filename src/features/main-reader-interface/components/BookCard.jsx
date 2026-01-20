import { useRouter } from "next/navigation";
import Icon from "../../../components/AppIcon";
import Image from "../../../components/AppImage";
import Button from "../../../components/ui/Button";

const BookCard = ({ book }) => {
  const router = useRouter();

  const handleReadClick = () => {
    const params = new URLSearchParams({
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

  return (
    <div className="group w-full bg-card rounded-lg md:rounded-xl border border-border/60 overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-300">
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        <Image
          src={book?.coverImage}
          alt={book?.coverImageAlt}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {book?.progress > 0 && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-background/90 backdrop-blur-sm rounded-md">
            <span className="font-data text-xs font-semibold text-foreground">
              {book?.progress}%
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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

        {book?.progress > 0 && (
          <div className="space-y-1">
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${getProgressColor(book?.progress)} transition-all duration-300`}
                style={{ width: `${book?.progress}%` }}
              />
            </div>
          </div>
        )}

        <Button
          variant={book?.progress > 0 ? "default" : "outline"}
          size="sm"
          iconName={book?.progress > 0 ? "PlayCircle" : "BookOpen"}
          iconPosition="left"
          fullWidth
          onClick={handleReadClick}
        >
          {book?.progress > 0 ? "Continue Reading" : "Start Reading"}
        </Button>
      </div>
    </div>
  );
};

export default BookCard;
