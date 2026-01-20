"use client";

import Button from "../ui/Button";

const formatBytes = (bytes) => {
  const safeValue = Number.isFinite(bytes) ? Math.max(0, bytes) : 0;
  const units = ["B", "KB", "MB", "GB"];
  let value = safeValue;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const precision = value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(precision)} ${units[unitIndex]}`;
};

const describeLastInteraction = (timestamp) => {
  if (!timestamp) return "Not opened recently";
  try {
    const formatter = new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
    });
    return `Last opened ${formatter.format(new Date(timestamp))}`;
  } catch (error) {
    console.warn("Failed to format timestamp", error);
    return "Recently opened";
  }
};

const StorageEvictionDialog = ({
  isOpen,
  plan,
  onConfirm,
  onCancel,
  isProcessing,
}) => {
  if (!isOpen || !plan) return null;

  const suggestions = Array.isArray(plan?.suggested) ? plan.suggested : [];
  const capacityStats = [
    {
      label: "Currently cached",
      value: formatBytes(plan?.totalBytes ?? 0),
    },
    {
      label: "Needed for this book",
      value: formatBytes(plan?.requiredBytes ?? 0),
    },
    {
      label: "Available budget",
      value: formatBytes(plan?.maxBytes ?? 0),
    },
    {
      label: "Will be freed",
      value: formatBytes(plan?.bytesToFree ?? 0),
    },
  ];

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && !isProcessing) {
      onCancel?.();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-background/95 backdrop-blur-sm flex items-center justify-center px-4 py-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="storage-eviction-title"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-2xl bg-card border border-border/80 rounded-2xl shadow-2xl p-6 space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary/80">
            Storage almost full
          </p>
          <h2
            id="storage-eviction-title"
            className="text-2xl font-semibold text-foreground"
          >
            Free up space to keep reading
          </h2>
          <p className="text-sm text-muted-foreground">
            The next download needs {formatBytes(plan?.requiredBytes)}. Remove
            the cached titles below or cancel to pick something else.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {capacityStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border/70 bg-muted/40 px-3 py-2 text-center"
            >
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </p>
              <p className="text-lg font-semibold text-foreground">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">
              Suggested downloads to remove
            </p>
            <p className="text-xs text-muted-foreground">
              {suggestions.length} selected • {formatBytes(plan?.bytesToFree)}{" "}
              to free
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 divide-y divide-border/60 bg-muted/30">
            {suggestions.length === 0 && (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                No cached titles can be removed automatically. Please cancel and
                try reading a different book.
              </p>
            )}
            {suggestions.map((entry) => (
              <div key={entry.bookId} className="px-4 py-4 flex flex-col gap-1">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <div>
                    <p className="text-base font-semibold text-foreground">
                      {entry.title || "Untitled"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {entry.author || "Unknown author"}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-foreground/80">
                    {formatBytes(entry.byteSize)}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {describeLastInteraction(entry.lastOpenedAt)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <Button
            variant="outline"
            className="flex-1 sm:flex-none"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Keep my downloads
          </Button>
          <Button
            variant="default"
            className="flex-1 sm:flex-none"
            onClick={onConfirm}
            disabled={isProcessing || suggestions.length === 0}
            iconName={isProcessing ? "Loader2" : "Trash2"}
            iconPosition="left"
          >
            {isProcessing ? "Clearing space..." : "Remove selected downloads"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StorageEvictionDialog;
