import { useState, useRef } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import {
  createClipboardBook,
  createUploadedBook,
} from "../../../utils/storage/indexedDb";
import {
  parseUploadedFile,
  supportedUploadExtensions,
} from "../../../utils/fileParsers";

const tabs = [
  { id: "upload", label: "Upload file", icon: "Upload" },
  { id: "paste", label: "Paste text", icon: "ClipboardPaste" },
];

const FileUploadZone = ({ onFileUpload, onBookCreated }) => {
  const [activeTab, setActiveTab] = useState("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [pasteTitle, setPasteTitle] = useState("");
  const [pasteContent, setPasteContent] = useState("");
  const [pasteError, setPasteError] = useState("");
  const [isSavingPaste, setIsSavingPaste] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadingFileName, setUploadingFileName] = useState("");

  const supportedFormats = [
    { extension: ".txt", label: "TXT", icon: "FileText" },
    { extension: ".md", label: "Markdown", icon: "FileCode" },
    { extension: ".pdf", label: "PDF", icon: "FileType" },
    { extension: ".epub", label: "EPUB", icon: "BookOpen" },
  ];

  const handleDragEnter = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (isUploading) return;
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
    if (isUploading) return;
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
    if (e?.target) {
      e.target.value = "";
    }
  };

  const handleFileProcess = async (file) => {
    const fileExtension = "." + file?.name?.split(".")?.pop()?.toLowerCase();

    if (!supportedUploadExtensions.includes(fileExtension)) {
      setUploadError("Please upload a TXT, Markdown, PDF, or EPUB file.");
      return;
    }

    setIsUploading(true);
    setUploadError("");
    setUploadingFileName(file?.name ?? "");
    setUploadProgress(6);

    try {
      const parsed = await parseUploadedFile(file);
      setUploadProgress(55);

      const created = await createUploadedBook({
        title: parsed.title,
        author: parsed.author,
        content: parsed.content,
        category: parsed.suggestedCategory,
        sourceType: parsed.sourceType,
        fileName: parsed.fileName,
      });

      setUploadProgress(100);
      onFileUpload?.(created);
      await onBookCreated?.();
    } catch (error) {
      console.error("Failed to process upload", error);
      setUploadError(error?.message ?? "Unable to process this file.");
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setUploadingFileName("");
      }, 350);
    }
  };

  const handleBrowseClick = () => {
    if (isUploading) return;
    fileInputRef?.current?.click();
  };

  const resetPasteForm = () => {
    setPasteTitle("");
    setPasteContent("");
    setPasteError("");
  };

  const handleClipboardFill = async () => {
    if (!navigator?.clipboard?.readText) {
      setPasteError(
        "Clipboard access is not supported in this browser. Please paste content manually.",
      );
      return;
    }

    try {
      const text = await navigator.clipboard.readText();
      if (!text?.trim()) {
        setPasteError("Your clipboard is empty or does not contain any text.");
        return;
      }
      setPasteContent((prev) => (prev ? `${prev}\n${text}` : text));
      setPasteError("");
      if (activeTab !== "paste") {
        setActiveTab("paste");
      }
    } catch (error) {
      console.error("Error reading from clipboard", error);
      setPasteError(
        "Unable to read from clipboard. Please allow clipboard access and try again.",
      );
    }
  };

  const handlePasteSubmit = async (event) => {
    event?.preventDefault();
    const content = pasteContent?.trim();
    if (!content) {
      setPasteError("Please provide some text to save.");
      return;
    }
    setIsSavingPaste(true);
    setPasteError("");
    try {
      await createClipboardBook({ title: pasteTitle, content });
      await onBookCreated?.();
      resetPasteForm();
    } catch (error) {
      console.error("Failed to save pasted text", error);
      setPasteError(error?.message ?? "Unable to save pasted text.");
    } finally {
      setIsSavingPaste(false);
    }
  };

  const pasteWordCount = pasteContent?.trim()
    ? pasteContent.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const pasteCharCount = pasteContent.length;

  return (
    <div className="w-full bg-card rounded-2xl border border-border/60 p-4 sm:p-6 md:p-8 space-y-6 shadow-sm">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/70">
          Add new content
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h3 className="text-2xl font-semibold text-foreground">
              Upload or paste to build your library
            </h3>
            <p className="text-sm text-muted-foreground">
              Everything stays on this device. Choose a method that fits the way
              you collect reading material.
            </p>
          </div>
          <div
            role="tablist"
            aria-label="Add content modes"
            className="flex flex-col gap-2 sm:flex-row sm:flex-none"
          >
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                type="button"
                variant={activeTab === tab.id ? "default" : "outline"}
                size="sm"
                iconName={tab.icon}
                iconPosition="left"
                className="w-full sm:w-auto"
                aria-pressed={activeTab === tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === "upload") {
                    setPasteError("");
                  } else {
                    setUploadError("");
                  }
                }}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.pdf,.epub"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="File upload input"
      />

      {activeTab === "upload" ? (
        <div
          className="w-full border-2 border-dashed border-border/60 rounded-xl p-5 sm:p-8 md:p-10 transition-all duration-300 cursor-pointer hover:border-primary/60 hover:bg-orange-50"
          onClick={handleBrowseClick}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div
            className={`flex flex-col items-start text-left sm:items-center sm:text-center space-y-5 transition-all duration-300 ${
              isDragging ? "scale-[1.01] opacity-85" : "scale-100 opacity-100"
            }`}
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon
                name={isUploading ? "Loader2" : "Upload"}
                size={48}
                className={
                  isUploading ? "animate-spin text-primary" : "text-primary"
                }
              />
            </div>

            {isUploading ? (
              <div className="w-full max-w-md space-y-3">
                <p className="text-base md:text-lg font-medium text-foreground">
                  {uploadingFileName
                    ? `Importing ${uploadingFileName}`
                    : "Parsing your content..."}
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
                  <h4 className="text-lg md:text-2xl font-semibold text-foreground">
                    Drop a file here or tap to browse
                  </h4>
                  <p className="text-sm md:text-base text-muted-foreground max-w-2xl sm:mx-auto">
                    TXT, Markdown, PDF, and EPUB are supported. We parse
                    everything locally so your data never leaves your device.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-start sm:justify-center gap-3 md:gap-4 pt-4 w-full">
                  {supportedFormats?.map((format) => (
                    <div
                      key={format?.extension}
                      className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border border-border/40"
                    >
                      <Icon
                        name={format?.icon}
                        size={16}
                        className="text-primary"
                      />
                      <span className="text-xs md:text-sm font-medium text-foreground">
                        {format?.label}
                      </span>
                    </div>
                  ))}
                </div>

                {uploadError && (
                  <p className="text-sm text-destructive" role="status">
                    {uploadError}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={handlePasteSubmit}>
          <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
            <div className="space-y-3">
              <label
                htmlFor="paste-title"
                className="text-sm font-medium text-foreground"
              >
                Title
              </label>
              <Input
                id="paste-title"
                placeholder="e.g. Morning Notes or Chapter Draft"
                value={pasteTitle}
                onChange={(event) => setPasteTitle(event?.target?.value)}
              />
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Quick actions
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                iconName="ClipboardPaste"
                iconPosition="left"
                className="w-full md:w-auto"
                onClick={handleClipboardFill}
              >
                Paste from clipboard
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <label
              htmlFor="paste-content"
              className="text-sm font-medium text-foreground"
            >
              Pasted text
            </label>
            <textarea
              id="paste-content"
              className="w-full min-h-[260px] rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Paste or type your text here..."
              value={pasteContent}
              onChange={(event) => setPasteContent(event?.target?.value)}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {pasteWordCount} words • {pasteCharCount} characters
              </span>
              <span>
                Estimated{" "}
                {Math.max(1, Math.round(Math.max(pasteWordCount, 1) / 250))} min
                read
              </span>
            </div>
          </div>

          {pasteError && (
            <p className="text-sm text-destructive" role="status">
              {pasteError}
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:flex-1"
              onClick={() => {
                resetPasteForm();
                setPasteError("");
              }}
              disabled={isSavingPaste}
            >
              Clear form
            </Button>
            <Button
              type="submit"
              variant="default"
              className="w-full sm:flex-1"
              iconName={isSavingPaste ? "Loader2" : "Save"}
              iconPosition="left"
              loading={isSavingPaste}
              disabled={isSavingPaste}
            >
              {isSavingPaste ? "Saving..." : "Save to library"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default FileUploadZone;
