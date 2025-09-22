import React, { useState } from "react";
import { FileUploadIcon } from "../SvgIcons";
import { useTranslation } from "react-i18next";
import { CustomProgressBar } from "../CustomComponents/ProgressBar";
import { V8CustomButton } from "../../formsflow-components";

interface FileUploadAreaProps {
  fileType: string;
  onFileSelect: (file: File) => void;
  onCancel?: () => void;   // called when user cancels
  onRetry?: (file: File) => void; // called when retrying
  onDone?: () => void;     // called when done clicked
  file: File | null;       // currently selected file
  progress: number;        // upload progress (0–100)
  error?: string | null;   // error message if upload fails
}

export const FileUploadArea: React.FC<FileUploadAreaProps> = ({
  fileType,
  onFileSelect,
  onCancel,
  onRetry,
  onDone,
  file,
  progress,
  error,
}) => {
  const { t } = useTranslation();
  const [isDragOver, setIsDragOver] = useState(false); // track drag state
  // Handle manual file selection
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    if (selected) onFileSelect(selected);
  };

  // Handle drag events
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  // Handle drag-and-drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const selected = e.dataTransfer.files?.[0] || null;
    if (selected) onFileSelect(selected);
  };

  // State helpers
  const isUploading = file && !error && progress < 100;
  const isCompleted = file && !error && progress === 100;
  const isError = !!error;

  // Upload area (initial state)
  const renderUploadPrompt = () => (
    <>
      <input
        id="file-input"
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
          <span className="mt-1">{t("Maximum file size 20MB.")}</span>
        </div>
      </div>
    </>
  );

// Upload progress + status
const renderUploadStatus = () => {
  // Map states to config
  const stateConfig = {
    uploading: {
      status: t(`Importing ${file?.name}`),
      label: t("Cancel"),
      onClick: () => onCancel?.(),
    },
    error: {
      status: t("There was an error in the upload"),
      label: t("Try Again"),
      onClick: () => file && onRetry?.(file),
    },
    completed: {
      status: t("Upload Complete!"),
      label: t("Done"),
      onClick: () => onDone?.(),
    },
  };

  // Determine current state
  const current =
    isUploading
      ? stateConfig.uploading
      : isError && file
      ? stateConfig.error
      : isCompleted
      ? stateConfig.completed
      : null;

    return (
      <div
        className="upload-progress"
        aria-label={t("File upload progress")}
        data-testid="file-upload-progress"
      >
        <FileUploadIcon aria-hidden="true" />

        <div
          className="upload-progress-bar"
          aria-label={t("Upload progress bar")}
          data-testid="file-upload-progress-bar"
        >
          <CustomProgressBar progress={progress} />
        </div>

      {/* Status text */}
      {current?.status && (
        <p
          className="upload-status"
          aria-live="polite"
          data-testid="file-upload-status"
        >
          {current.status}
        </p>
        )}

      {/* Action button */}
      {current && (
        <V8CustomButton
          className="file-upload-action-btn"
          label={current.label}
          onClick={current.onClick}
          ariaLabel={current.label}
          dataTestId="file-upload-action-btn"
          variant="secondary"
        />
      )}
    </div>
  );
};

  return (
    <div
      role="button"
      data-testid="file-upload-container"
      className={`file-upload ${file ? "file-upload-progress" : ""} ${
        isDragOver ? "file-upload-dragover" : ""
      }`}
      tabIndex={0}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !file && document.getElementById("file-input")?.click()}
      onKeyDown={(e) => {
        if (!file && (e.key === "Enter" || e.key === " ")) {
          document.getElementById("file-input")?.click();
        }
      }}
      aria-label={t("Upload file area")}
    >
      {!file ? renderUploadPrompt() : renderUploadStatus()}
    </div>
  );
};
