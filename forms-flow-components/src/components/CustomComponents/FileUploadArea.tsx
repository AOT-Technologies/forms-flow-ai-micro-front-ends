import { useState, useCallback, useMemo, forwardRef, memo, useRef, useEffect } from "react";
import { FileUploadIcon } from "../SvgIcons";
import { useTranslation } from "react-i18next";
import { CustomProgressBar } from "../CustomComponents/ProgressBar";
import { V8CustomButton } from "../CustomComponents/CustomButton";


interface FileUploadAreaProps extends Omit<React.ComponentPropsWithoutRef<"div">, 'children'> {
  /** Accepted file types (e.g., ".json", ".bpmn", ".pdf") */
  fileType: string;
  /** Called when a file is selected */
  onFileSelect: (file: File) => void;
  /** Called when user cancels the upload */
  onCancel?: () => void;
  /** Called when user retries the upload */
  onRetry?: (file: File) => void;
  /** Called when user clicks done */
  onDone?: () => void;
  /** Currently selected file */
  file: File | null;
  primaryButtonText: string;
  /** Upload progress (0-100) */
  progress: number;
  /** Error message if upload fails */
  error?: string | null;
  /** Accessible label for screen readers */
  ariaLabel?: string;
  /** Test ID for automated testing */
  dataTestId?: string;
  /** Additional CSS classes */
  className?: string;
  /** Maximum file size in MB */
  maxFileSizeMB?: number;
}

/**
 * Utility function to build className string
 */
const buildClassNames = (...classes: (string | boolean | undefined)[]): string => {
  return classes.filter(Boolean).join(" ");
};

/**
 * Enhanced FileUploadArea component with improved accessibility, performance, and maintainability
 */
const FileUploadAreaComponent = forwardRef<HTMLDivElement, FileUploadAreaProps>(({
  fileType,
  onFileSelect,
  onCancel,
  onRetry,
  onDone,
  file,
  progress,
  error,
  ariaLabel,
  dataTestId,
  className = "",
  maxFileSizeMB = 20,
  primaryButtonText = "Done",
  ...restProps
}, ref) => {
  const { t } = useTranslation();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDoneLoading, setIsDoneLoading] = useState(false);
  const isProcessingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastSelectedFileRef = useRef<File | null>(null);

  // Memoized file input ID to avoid re-renders
  const fileInputId = useMemo(() => {
    const crypto = globalThis.crypto || (globalThis as any).msCrypto;
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return `file-input-${array[0].toString(36)}`;
  }, []);

  // Memoized state helpers for better performance
  const uploadState = useMemo(() => ({
    isUploading: file && !error && progress < 100,
    isCompleted: file && !error && progress === 100,
    isError: !!error,
    hasFile: !!file,
  }), [file, error, progress]);

  // Memoized file size validation
  const validateFileSize = useCallback((file: File): boolean => {
    const maxSizeBytes = maxFileSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  }, [maxFileSizeMB]);

  // Memoized file selection handler
  const handleFileSelection = useCallback((selectedFile: File) => {
    // Prevent processing the same file twice
    if (isProcessingRef.current || lastSelectedFileRef.current === selectedFile) {
      return;
    }
    if (!validateFileSize(selectedFile)) {
      // Could emit an error here or show a toast
      console.warn(`File size exceeds ${maxFileSizeMB}MB limit`);
      return;
    }
    isProcessingRef.current = true;
    lastSelectedFileRef.current = selectedFile;
    onFileSelect(selectedFile);
  }, [onFileSelect, validateFileSize, maxFileSizeMB]);

  // Memoized manual file selection handler
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    if (selected) {
      // Stop event propagation to prevent any parent handlers
      e.stopPropagation();
      handleFileSelection(selected);
      // Reset the input immediately after processing to prevent re-triggering
      // But use a small delay to ensure the selection is processed
      setTimeout(() => {
        if (fileInputRef.current && e.target) {
          (e.target as HTMLInputElement).value = "";
        }
      }, 0);
    }
  }, [handleFileSelection]);

  // Memoized drag event handlers
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const selected = e.dataTransfer.files?.[0] || null;
    if (selected) handleFileSelection(selected);
  }, [handleFileSelection]);

  // Reset file input when file prop is set (to allow selecting the same file again)
  useEffect(() => {
    if (file && fileInputRef.current) {
      // File has been set by parent, now safe to reset the input and processing flag
      const timer = setTimeout(() => {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        isProcessingRef.current = false;
        // Clear the last selected file ref after a delay to allow same file selection again
        setTimeout(() => {
          lastSelectedFileRef.current = null;
        }, 500);
      }, 200);
      return () => clearTimeout(timer);
    } else if (!file) {
      // If file is cleared, reset processing flag and last selected file
      isProcessingRef.current = false;
      lastSelectedFileRef.current = null;
      // Reset done loading state when file is cleared
      setIsDoneLoading(false);
    }
  }, [file]);

  // Reset done loading state only when file is cleared or error occurs
  // Don't reset when uploadState.isCompleted changes to prevent resetting during import process
  useEffect(() => {
    if (!file || uploadState.isError) {
      setIsDoneLoading(false);
    }
  }, [file, uploadState.isError]);

  // Memoized click handler for upload area
  const handleAreaClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent clicking if we're clicking on a button or input
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input[type="file"]')) {
      return;
    }
    // Prevent clicking if we're processing or if a file is already selected
    if (isProcessingRef.current || file) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    // Only open file picker if no file is selected and not currently processing
    if (fileInputRef.current) {
      e.preventDefault();
      e.stopPropagation();
      // Reset the input value before opening to ensure onChange fires even for same file
      fileInputRef.current.value = "";
      // Use requestAnimationFrame to ensure this happens after any pending state updates
      requestAnimationFrame(() => {
        if (fileInputRef.current && !isProcessingRef.current && !file) {
          fileInputRef.current.click();
        }
      });
    }
  }, [file]);

  // Memoized keyboard handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    // Prevent keyboard activation if processing or file is already selected
    if (isProcessingRef.current || file) {
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
        fileInputRef.current.click();
      }
    }
  }, [file]);

  // Memoized upload prompt component
  const renderUploadPrompt = useCallback(() => (
    <>
      <input
        ref={fileInputRef}
        id={fileInputId}
        data-testid="file-upload-input"
        type="file"
        style={{ display: "none" }}
        onChange={handleChange}
        accept={fileType}
        aria-label={t("Choose a file to upload")}
      />
      <div
        className="upload-area"
        aria-label={t("File upload area")}
        data-testid="file-upload-area-prompt"
      >
        <FileUploadIcon aria-hidden="true" />
        <p className="upload-text">{t(
          `Drag a file to this area to import it${
            fileType === ".json, .bpmn" ? " (form, layout or bpmn)" : ""
          }`
        )}</p>
        <div className="upload-size-text">
          <span>{t(`Support for a single ${fileType} file upload.`)}</span>
          <span className="mt-1">{t(`Maximum file size ${maxFileSizeMB}MB.`)}</span>
        </div>
      </div>
    </>
  ), [fileInputId, handleChange, fileType, t, maxFileSizeMB]);

    const renderUploadStatus = useCallback(() => {
      let statusText = "";
        if (uploadState.isUploading) {
          statusText = t(`Importing ${file?.name}`);
        } else if (uploadState.isError) {
          statusText = t("There was an error in the upload");
        } else if (isDoneLoading) {
          statusText = t(`Importing ${file?.name}`);
        } else {
          statusText = t("Import successful!");
        }
  return (
        <div
          className="upload-progress-section"
          aria-label={t("File upload progress")}
          data-testid="file-upload-progress"
        >
          <FileUploadIcon aria-hidden="true" />

          <div
            className="upload-progress-bar"
            aria-label={t("Upload progress bar")}
            data-testid="file-upload-progress-bar"
          >
            <CustomProgressBar
              progress={isDoneLoading ? 100 : progress}
              color={uploadState.isError ? "error" : undefined}
            />
          </div>
          <p className="upload-status" aria-live="polite" title={statusText}>
            {statusText}
          </p>
        </div>
      );
    }, [uploadState, file, progress, isDoneLoading, t]);

    const containerClassName = useMemo(
      () =>
        buildClassNames(
          "file-upload",
          uploadState.hasFile && "file-upload-progress",
          isDragOver && "file-upload-dragover",
          className
        ),
      [uploadState.hasFile, isDragOver, className]
    );

    const primaryButtonLabel = t(primaryButtonText);
    const isPrimaryButtonTryAgain = primaryButtonLabel === t("Try Again");

    return (
      <div
        ref={ref}
        role="button"
        data-testid={dataTestId || "file-upload-container"}
        className={containerClassName}
        tabIndex={0}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleAreaClick}
        onKeyDown={handleKeyDown}
        aria-label={ariaLabel || t("Upload file area")}
        {...restProps}
      >
        {!uploadState.hasFile ? (
          renderUploadPrompt()
        ) : (
          <div className="upload-status-section">
            {renderUploadStatus()}

            {(uploadState.isUploading ||
              uploadState.isCompleted ||
              uploadState.isError ||
              isDoneLoading) && (
              <div className="upload-action-row">

                {uploadState.isError && file && (
                  <V8CustomButton
                    className="file-upload-action-btn"
                    label={t("Try Again")}
                    onClick={() => {
                      // Check if primaryButtonText is "Try Again" to reset the component
                      const isTryAgain = primaryButtonText === "Try Again" || t(primaryButtonText) === t("Try Again");
                      if (isTryAgain) {
                        // Reset file input and call onCancel to reset parent state
                        isProcessingRef.current = false;
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                        onCancel?.();
                      } else {
                        onRetry?.(file);
                      }
                    }}
                    ariaLabel={t("Try Again")}
                    dataTestId="file-upload-retry-btn"
                    variant="primary"
                  />
                )}
                {(uploadState.isCompleted || isDoneLoading) && (
                  <V8CustomButton
                    className="file-upload-action-btn"
                    label={primaryButtonLabel}
                    loading={isDoneLoading}
                    onClick={() => {
                      if (isPrimaryButtonTryAgain) {
                        onCancel?.();
                      } else {
                        // Set loading state if button label is "Done"
                        // Set state synchronously to prevent flicker
                        if (primaryButtonLabel === t("Done")) {
                          setIsDoneLoading(true);
                        }
                        onDone?.();
                      }
                    }}
                    ariaLabel={primaryButtonLabel}
                    dataTestId="file-upload-action-btn"
                    variant="primary"
                  />
                )}
               {!isDoneLoading && (uploadState.isUploading || uploadState.isCompleted) && (
                  <V8CustomButton
                    className="file-upload-action-btn"
                    label="Cancel"
                    onClick={onCancel}
                    ariaLabel="Cancel File Upload"
                    dataTestId="file-upload-cancel-btn" 
                    variant="secondary"
                  />
                )}
                </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

FileUploadAreaComponent.displayName = "FileUploadArea";
export const FileUploadArea = memo(FileUploadAreaComponent);
export type { FileUploadAreaProps };
