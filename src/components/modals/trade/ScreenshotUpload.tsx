import React, {
  useState,
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef,
  useEffect,
  useMemo,
} from "react";
import { Upload, X, ImageIcon, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import {
  useTradeScreenshots,
  TradeScreenshot,
  MAX_SCREENSHOT_COUNT,
  MAX_SCREENSHOT_SIZE,
  ACCEPTED_IMAGE_TYPES,
} from "../../../hooks/useTradeScreenshots";
import toast from "react-hot-toast";

export interface ScreenshotUploadHandle {
  uploadPending: (tradeId: string) => Promise<boolean>;
  hasPending: boolean;
}

interface PendingFile {
  id: string;
  file: File;
  previewUrl: string;
}

interface ScreenshotUploadProps {
  tradeId?: string;
  disabled?: boolean;
}

interface LightboxImage {
  url: string;
  fileName: string;
}

function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return `${file.name}: only PNG, JPG, WEBP, or GIF allowed`;
  }
  if (file.size > MAX_SCREENSHOT_SIZE) {
    return `${file.name}: must be under 5MB`;
  }
  return null;
}

const ScreenshotUpload = forwardRef<ScreenshotUploadHandle, ScreenshotUploadProps>(
  function ScreenshotUpload({ tradeId, disabled = false }, ref) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const { screenshots, loading, uploading, uploadFiles, deleteScreenshot } =
      useTradeScreenshots(tradeId);

    const totalCount = screenshots.length + pendingFiles.length;
    const remainingSlots = MAX_SCREENSHOT_COUNT - totalCount;
    const atMax = remainingSlots <= 0;

    const addFiles = useCallback(
      async (files: FileList | File[]) => {
        if (remainingSlots <= 0) {
          toast.error(`Maximum of ${MAX_SCREENSHOT_COUNT} screenshots per trade`);
          return;
        }

        const fileArray = Array.from(files);
        const valid: File[] = [];

        for (const file of fileArray) {
          const error = validateImageFile(file);
          if (error) {
            toast.error(error);
          } else {
            valid.push(file);
          }
        }

        if (valid.length === 0) return;

        const filesToAdd = valid.slice(0, remainingSlots);
        if (filesToAdd.length < valid.length) {
          toast.error(
            `Only ${remainingSlots} more screenshot${remainingSlots === 1 ? "" : "s"} allowed`
          );
        }

        if (tradeId) {
          await uploadFiles(filesToAdd, tradeId);
          return;
        }

        const newPending = filesToAdd.map((file) => ({
          id: crypto.randomUUID(),
          file,
          previewUrl: URL.createObjectURL(file),
        }));

        setPendingFiles((prev) => [...prev, ...newPending]);
      },
      [tradeId, uploadFiles, remainingSlots]
    );

    const removePending = useCallback((id: string) => {
      setPendingFiles((prev) => {
        const item = prev.find((p) => p.id === id);
        if (item) URL.revokeObjectURL(item.previewUrl);
        return prev.filter((p) => p.id !== id);
      });
    }, []);

    const uploadPending = useCallback(
      async (targetTradeId: string) => {
        if (pendingFiles.length === 0) return true;
        const files = pendingFiles.map((p) => p.file);
        const success = await uploadFiles(files, targetTradeId);
        if (success) {
          pendingFiles.forEach((p) => URL.revokeObjectURL(p.previewUrl));
          setPendingFiles([]);
        }
        return success;
      },
      [pendingFiles, uploadFiles]
    );

    useImperativeHandle(ref, () => ({
      uploadPending,
      hasPending: pendingFiles.length > 0,
    }));

    const handleDrop = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (disabled || uploading || atMax) return;
        addFiles(e.dataTransfer.files);
      },
      [addFiles, disabled, uploading, atMax]
    );

    const handleDelete = async (screenshot: TradeScreenshot) => {
      if (disabled || uploading) return;
      await deleteScreenshot(screenshot);
    };

    const isBusy = disabled || uploading;
    const hasContent = screenshots.length > 0 || pendingFiles.length > 0;

    const viewableImages = useMemo<LightboxImage[]>(
      () => [
        ...screenshots.filter((s) => s.url).map((s) => ({ url: s.url, fileName: s.file_name })),
        ...pendingFiles.map((p) => ({ url: p.previewUrl, fileName: p.file.name })),
      ],
      [screenshots, pendingFiles]
    );

    const lightboxImage = lightboxIndex !== null ? (viewableImages[lightboxIndex] ?? null) : null;

    const openLightbox = (index: number) => {
      if (viewableImages[index]) setLightboxIndex(index);
    };

    const closeLightbox = () => setLightboxIndex(null);

    const showPrev = useCallback(() => {
      setLightboxIndex((current) => {
        if (current === null || viewableImages.length <= 1) return current;
        return (current - 1 + viewableImages.length) % viewableImages.length;
      });
    }, [viewableImages.length]);

    const showNext = useCallback(() => {
      setLightboxIndex((current) => {
        if (current === null || viewableImages.length <= 1) return current;
        return (current + 1) % viewableImages.length;
      });
    }, [viewableImages.length]);

    useEffect(() => {
      if (lightboxIndex === null) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") closeLightbox();
        if (e.key === "ArrowLeft") showPrev();
        if (e.key === "ArrowRight") showNext();
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [lightboxIndex, showPrev, showNext]);

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-black">Trade Screenshots</h3>
          <span className="text-xs font-medium text-gray-500">
            {totalCount}/{MAX_SCREENSHOT_COUNT}
            {pendingFiles.length > 0 && !tradeId && " · uploads on save"}
          </span>
        </div>

        {!atMax && (
          <div
            role="button"
            tabIndex={0}
            onClick={() => !isBusy && inputRef.current?.click()}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && !isBusy) {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (!isBusy) setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
            onDrop={handleDrop}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-4 border-dashed p-6 transition-colors ${
              isDragging
                ? "border-yellow-500 bg-yellow-50"
                : "border-black bg-gray-50 hover:bg-yellow-50"
            } ${isBusy ? "cursor-not-allowed opacity-50" : ""}`}
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
            ) : (
              <Upload className="h-8 w-8 text-gray-600" />
            )}
            <div className="text-center">
              <p className="text-sm font-bold text-black">
                {uploading ? "Uploading..." : "Drag & drop or click to upload"}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Up to {MAX_SCREENSHOT_COUNT} images, 5MB each · PNG, JPG, WEBP, GIF
              </p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(",")}
              multiple
              className="hidden"
              disabled={isBusy}
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>
        )}

        {loading && !hasContent && (
          <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading screenshots...
          </div>
        )}

        {hasContent && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {screenshots.map((screenshot, index) => (
              <div
                key={screenshot.id}
                className="group relative overflow-hidden rounded-xl border-4 border-black bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                {screenshot.url ? (
                  <button
                    type="button"
                    onClick={() => openLightbox(index)}
                    className="block w-full cursor-zoom-in"
                    aria-label={`View ${screenshot.file_name}`}
                  >
                    <img
                      src={screenshot.url}
                      alt={screenshot.file_name}
                      className="aspect-video w-full object-cover"
                    />
                  </button>
                ) : (
                  <div className="flex aspect-video items-center justify-center bg-gray-100">
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <p className="truncate px-2 py-1 text-xs font-medium text-gray-600">
                  {screenshot.file_name}
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(screenshot);
                  }}
                  disabled={isBusy}
                  className="absolute right-1 top-1 z-10 rounded-lg border-2 border-black bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-50"
                  aria-label={`Remove ${screenshot.file_name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}

            {pendingFiles.map((pending, index) => (
              <div
                key={pending.id}
                className="group relative overflow-hidden rounded-xl border-4 border-dashed border-gray-400 bg-white"
              >
                <button
                  type="button"
                  onClick={() => openLightbox(screenshots.filter((s) => s.url).length + index)}
                  className="block w-full cursor-zoom-in"
                  aria-label={`View ${pending.file.name}`}
                >
                  <img
                    src={pending.previewUrl}
                    alt={pending.file.name}
                    className="aspect-video w-full object-cover"
                  />
                </button>
                <p className="truncate px-2 py-1 text-xs font-medium text-gray-600">
                  {pending.file.name}
                </p>
                <span className="absolute left-1 top-1 rounded bg-yellow-400 px-1.5 py-0.5 text-[10px] font-bold text-black">
                  Pending
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removePending(pending.id);
                  }}
                  disabled={isBusy}
                  className="absolute right-1 top-1 z-10 rounded-lg border-2 border-black bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-50"
                  aria-label={`Remove ${pending.file.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {lightboxImage && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
            onClick={closeLightbox}
            role="dialog"
            aria-modal="true"
            aria-label={`Viewing ${lightboxImage.fileName}`}
          >
            <div
              className="relative flex max-h-[90vh] max-w-5xl flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={closeLightbox}
                className="absolute -right-2 -top-2 z-10 rounded-xl border-4 border-black bg-white p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-shadow hover:bg-gray-50 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                aria-label="Close lightbox"
              >
                <X className="h-5 w-5" />
              </button>

              {viewableImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={showPrev}
                    className="absolute left-0 top-1/2 z-10 -translate-x-full -translate-y-1/2 rounded-xl border-4 border-black bg-white p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-shadow hover:bg-gray-50 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] sm:-left-14"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={showNext}
                    className="absolute right-0 top-1/2 z-10 translate-x-full -translate-y-1/2 rounded-xl border-4 border-black bg-white p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-shadow hover:bg-gray-50 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] sm:-right-14"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              <img
                src={lightboxImage.url}
                alt={lightboxImage.fileName}
                className="max-h-[80vh] max-w-full rounded-xl border-4 border-black object-contain shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              />
              <p className="mt-3 max-w-full truncate text-center text-sm font-bold text-white">
                {lightboxImage.fileName}
                {viewableImages.length > 1 && lightboxIndex !== null && (
                  <span className="ml-2 font-normal text-gray-300">
                    ({lightboxIndex + 1} / {viewableImages.length})
                  </span>
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default ScreenshotUpload;
