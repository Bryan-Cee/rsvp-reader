import { useState, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const FileUploadZone = ({ onFileUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const supportedFormats = [
    { extension: '.txt', label: 'TXT', icon: 'FileText' },
    { extension: '.md', label: 'Markdown', icon: 'FileCode' },
    { extension: '.pdf', label: 'PDF', icon: 'FileType' },
    { extension: '.epub', label: 'EPUB', icon: 'BookOpen' }
  ];

  const handleDragEnter = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
  };

  const handleDrop = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setIsDragging(false);

    const files = e?.dataTransfer?.files;
    if (files && files?.length > 0) {
      handleFileProcess(files?.[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e?.target?.files;
    if (files && files?.length > 0) {
      handleFileProcess(files?.[0]);
    }
  };

  const handleFileProcess = (file) => {
    const validExtensions = ['.txt', '.md', '.pdf', '.epub'];
    const fileExtension = '.' + file?.name?.split('.')?.pop()?.toLowerCase();

    if (!validExtensions?.includes(fileExtension)) {
      alert('Please upload a valid file format (TXT, Markdown, PDF, or EPUB)');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => {
            setIsUploading(false);
            setUploadProgress(0);
            if (onFileUpload) {
              onFileUpload(file);
            }
          }, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  const handleBrowseClick = () => {
    fileInputRef?.current?.click();
  };

  return (
    <div className="w-full bg-card rounded-lg md:rounded-xl lg:rounded-2xl border-2 border-dashed border-border/60 p-6 md:p-8 lg:p-12 transition-all duration-300">
      <div
        className={`relative transition-all duration-300 ${
          isDragging ? 'scale-105 opacity-80' : 'scale-100 opacity-100'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.pdf,.epub"
          onChange={handleFileSelect}
          className="hidden"
          aria-label="File upload input"
        />

        <div className="flex flex-col items-center justify-center text-center space-y-4 md:space-y-6">
          <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon
              name={isUploading ? 'Loader2' : 'Upload'}
              size={32}
              color="var(--color-primary)"
              className={isUploading ? 'animate-spin' : ''}
            />
          </div>

          {isUploading ? (
            <div className="w-full max-w-md space-y-3">
              <p className="text-base md:text-lg font-medium text-foreground">
                Uploading your book...
              </p>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="font-data text-sm text-muted-foreground">
                {uploadProgress}% complete
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <h3 className="text-xl md:text-2xl lg:text-3xl font-semibold text-foreground">
                  Upload Your Book
                </h3>
                <p className="text-sm md:text-base text-muted-foreground max-w-md">
                  Drag and drop your file here, or click to browse
                </p>
              </div>

              <Button
                variant="default"
                size="lg"
                iconName="FolderOpen"
                iconPosition="left"
                onClick={handleBrowseClick}
              >
                Browse Files
              </Button>

              <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 pt-4">
                {supportedFormats?.map((format) => (
                  <div
                    key={format?.extension}
                    className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border border-border/40"
                  >
                    <Icon name={format?.icon} size={16} className="text-primary" />
                    <span className="text-xs md:text-sm font-medium text-foreground">
                      {format?.label}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUploadZone;