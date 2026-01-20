"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "../../components/navigation/AppHeader";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import FileUploadZone from "./components/FileUploadZone";
import LibrarySection from "./components/LibrarySection";
import CategoryFilters from "./components/CategoryFilter";

const MainReaderInterface = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const mockBooks = [
    {
      id: 1,
      title: "The Art of Speed Reading",
      author: "Dr. Sarah Mitchell",
      coverImage:
        "https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg",
      coverImageAlt:
        "Close-up of open book pages with soft lighting creating depth and texture in reading material",
      wordCount: 45000,
      estimatedTime: 180,
      progress: 45,
      category: "self-improvement",
    },
    {
      id: 2,
      title: "Quantum Mechanics Simplified",
      author: "Prof. James Chen",
      coverImage:
        "https://images.pexels.com/photos/256559/pexels-photo-256559.jpeg",
      coverImageAlt:
        "Stack of hardcover science textbooks with blue and white covers on wooden desk surface",
      wordCount: 78000,
      estimatedTime: 312,
      progress: 0,
      category: "science",
    },
    {
      id: 3,
      title: "Mystery at Midnight Manor",
      author: "Elizabeth Blackwood",
      coverImage:
        "https://images.pexels.com/photos/1130980/pexels-photo-1130980.jpeg",
      coverImageAlt:
        "Dark atmospheric image of vintage mansion at night with moonlight casting shadows on gothic architecture",
      wordCount: 62000,
      estimatedTime: 248,
      progress: 78,
      category: "mystery",
    },
    {
      id: 4,
      title: "The Philosophy of Existence",
      author: "Marcus Aurelius Jr.",
      coverImage:
        "https://images.pexels.com/photos/1319854/pexels-photo-1319854.jpeg",
      coverImageAlt:
        "Ancient leather-bound philosophy book with gold embossed text on burgundy cover resting on marble surface",
      wordCount: 52000,
      estimatedTime: 208,
      progress: 23,
      category: "philosophy",
    },
    {
      id: 5,
      title: "Adventures in the Amazon",
      author: "Carlos Rodriguez",
      coverImage:
        "https://images.pexels.com/photos/1666021/pexels-photo-1666021.jpeg",
      coverImageAlt:
        "Lush green Amazon rainforest canopy with misty morning light filtering through dense tropical vegetation",
      wordCount: 71000,
      estimatedTime: 284,
      progress: 0,
      category: "adventure",
    },
    {
      id: 6,
      title: "Starship Chronicles",
      author: "Nova Sterling",
      coverImage:
        "https://images.pexels.com/photos/2150/sky-space-dark-galaxy.jpg",
      coverImageAlt:
        "Deep space scene with distant galaxies and nebulae in purple and blue hues against black cosmic background",
      wordCount: 89000,
      estimatedTime: 356,
      progress: 12,
      category: "science-fiction",
    },
    {
      id: 7,
      title: "Whispers in the Dark",
      author: "H.P. Lovecraft III",
      coverImage:
        "https://images.pexels.com/photos/1666021/pexels-photo-1666021.jpeg",
      coverImageAlt:
        "Eerie foggy forest path at dusk with twisted bare trees creating ominous silhouettes in dim light",
      wordCount: 54000,
      estimatedTime: 216,
      progress: 0,
      category: "horror",
    },
    {
      id: 8,
      title: "Love in Paris",
      author: "Amélie Dubois",
      coverImage:
        "https://images.pexels.com/photos/1850629/pexels-photo-1850629.jpeg",
      coverImageAlt:
        "Romantic Parisian street scene with Eiffel Tower in background during golden hour sunset with couple silhouette",
      wordCount: 48000,
      estimatedTime: 192,
      progress: 56,
      category: "romance",
    },
    {
      id: 9,
      title: "Verses of the Soul",
      author: "Maya Angelou II",
      coverImage:
        "https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg",
      coverImageAlt:
        "Elegant fountain pen resting on handwritten poetry manuscript with flowing cursive text on cream paper",
      wordCount: 12000,
      estimatedTime: 48,
      progress: 0,
      category: "poetry",
    },
    {
      id: 10,
      title: "The Productivity Paradox",
      author: "Tim Ferriss Jr.",
      coverImage:
        "https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg",
      coverImageAlt:
        "Modern minimalist workspace with laptop, notebook, and coffee cup arranged neatly on white desk surface",
      wordCount: 38000,
      estimatedTime: 152,
      progress: 89,
      category: "self-improvement",
    },
    {
      id: 11,
      title: "Laugh Out Loud",
      author: "Jerry Seinfeld Jr.",
      coverImage:
        "https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg",
      coverImageAlt:
        "Colorful comic book style illustration with bright yellow and red speech bubbles on vibrant background",
      wordCount: 28000,
      estimatedTime: 112,
      progress: 0,
      category: "humor",
    },
    {
      id: 12,
      title: "Pride and Prejudice Revisited",
      author: "Jane Austen Estate",
      coverImage:
        "https://images.pexels.com/photos/1130980/pexels-photo-1130980.jpeg",
      coverImageAlt:
        "Vintage Victorian-era book with ornate floral patterns on leather cover displayed on antique wooden table",
      wordCount: 82000,
      estimatedTime: 328,
      progress: 34,
      category: "classics",
    },
    {
      id: 13,
      title: "5-Minute Mindfulness",
      author: "Zen Master Lee",
      coverImage:
        "https://images.pexels.com/photos/1051838/pexels-photo-1051838.jpeg",
      coverImageAlt:
        "Peaceful meditation scene with person sitting cross-legged on yoga mat in serene natural outdoor setting",
      wordCount: 8500,
      estimatedTime: 34,
      progress: 0,
      category: "quick-reads",
    },
    {
      id: 14,
      title: "The Cosmic Connection",
      author: "Dr. Neil deGrasse Tyson II",
      coverImage:
        "https://images.pexels.com/photos/1169754/pexels-photo-1169754.jpeg",
      coverImageAlt:
        "Stunning view of Milky Way galaxy with countless stars and cosmic dust clouds in deep space photograph",
      wordCount: 67000,
      estimatedTime: 268,
      progress: 0,
      category: "science",
    },
    {
      id: 15,
      title: "Desert Storm Adventure",
      author: "Lawrence of Arabia Jr.",
      coverImage:
        "https://images.pexels.com/photos/1670732/pexels-photo-1670732.jpeg",
      coverImageAlt:
        "Vast golden sand dunes stretching to horizon under bright blue sky in Middle Eastern desert landscape",
      wordCount: 73000,
      estimatedTime: 292,
      progress: 67,
      category: "adventure",
    },
  ];

  const handleFileUpload = (file) => {
    console.log("File uploaded:", file?.name);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e?.target?.value);
  };

  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
  };

  const handleSettingsClick = () => {
    router.push("/settings-configuration");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        actions={
          <Button
            variant="outline"
            size="sm"
            iconName="Settings"
            iconPosition="left"
            onClick={handleSettingsClick}
          >
            Settings
          </Button>
        }
      />
      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 lg:py-12 space-y-6 md:space-y-8 lg:space-y-12">
        <section>
          <FileUploadZone onFileUpload={handleFileUpload} />
        </section>

        <section className="space-y-4 md:space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold text-foreground">
                Browse Library
              </h2>
              <p className="text-sm md:text-base text-muted-foreground mt-1">
                Search and filter your reading collection
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              type="search"
              placeholder="Search by title or author..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <CategoryFilters
              activeCategory={activeCategory}
              onCategoryChange={handleCategoryChange}
            />
          </div>

          <LibrarySection
            books={mockBooks}
            searchQuery={searchQuery}
            activeCategory={activeCategory}
          />
        </section>
      </main>
      <footer className="bg-card border-t border-border/60 mt-12 md:mt-16 lg:mt-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              © {new Date()?.getFullYear()} SpeedReader. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
              >
                Help Center
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainReaderInterface;
