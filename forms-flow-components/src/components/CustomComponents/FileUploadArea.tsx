import { useState, useCallback, useMemo, forwardRef, memo } from "react";
import { FileUploadIcon } from "../SvgIcons";
import { useTranslation } from "react-i18next";
import { CustomProgressBar } from "../CustomComponents/ProgressBar";
import { V8CustomButton } from "../CustomComponents/CustomButton";

/**
 * FileUploadArea is a reusable, accessible file upload component for forms-flow apps.
 * 
 * Usage:
 * <FileUploadArea fileType=".json" onFileSelect={handleFile} file={file} progress={50} />
 * <FileUploadArea fileType=".pdf" onFileSelect={handleFile} file={null} progress={0} error="Upload failed" />
 */

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
    if (!validateFileSize(selectedFile)) {
      // Could emit an error here or show a toast
      console.warn(`File size exceeds ${maxFileSizeMB}MB limit`);
      return;
    }
    onFileSelect(selectedFile);
  }, [onFileSelect, validateFileSize, maxFileSizeMB]);

  // Memoized manual file selection handler
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    if (selected) handleFileSelection(selected);
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

  // Memoized click handler for upload area
  const handleAreaClick = useCallback(() => {
    if (!uploadState.hasFile) {
      document.getElementById(fileInputId)?.click();
    }
  }, [uploadState.hasFile, fileInputId]);

  // Memoized keyboard handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!uploadState.hasFile && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      document.getElementById(fileInputId)?.click();
    }
  }, [uploadState.hasFile, fileInputId]);

  // Memoized upload prompt component
  const renderUploadPrompt = useCallback(() => (
    <>
      <input
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
              progress={progress}
              color={uploadState.isError ? "error" : undefined}
            />
          </div>

          <p className="upload-status" aria-live="polite">
            {uploadState.isUploading
              ? t(`Importing ${file?.name}`)
              : uploadState.isError
              ? t("There was an error in the upload")
              : t("Upload Complete!")}
          </p>
        </div>
      );
    }, [uploadState, file, progress, t]);

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
              uploadState.isError) && (
              <div className="upload-action-row">

                {uploadState.isError && file && (
                  <V8CustomButton
                    className="file-upload-action-btn"
                    label={t("Try Again")}
                    onClick={() => onRetry?.(file)}
                    ariaLabel={t("Try Again")}
                    dataTestId="file-upload-retry-btn"
                    variant="primary"
                  />
                )}
                {uploadState.isCompleted && (
                  <V8CustomButton
                    className="file-upload-action-btn"
                    label={t(primaryButtonText)}
                    onClick={onDone}
                    ariaLabel={t(primaryButtonText)}
                    dataTestId="file-upload-action-btn"
                    variant="primary"
                  />
                )}
               {(uploadState.isUploading || uploadState.isCompleted) && (<V8CustomButton
                    className="file-upload-action-btn"
                    label="Cancel"
                    onClick={onCancel}
                    ariaLabel="Cancel File Upload"
                    dataTestId="file-upload-cancel-btn"
                    variant="secondary"
                  />)}
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
