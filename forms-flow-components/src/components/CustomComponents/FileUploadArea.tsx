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
  const [isDragOver, setIsDragOver] = useState(false); // 👈 track drag state
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
  console.log("isCompleted",isCompleted);
  const isError = !!error;

  // Upload area (initial state)
  const renderUploadPrompt = () => (
    <>
      <input
        id="file-input"
        data-testid="import-modal-file-input"
        type="file"
        style={{ display: "none" }}
        onChange={handleChange}
        accept={fileType}
      />
      <div className="upload-area">
        <FileUploadIcon />
        <p className="upload-text">
          {t(
            `Drag a file to this area to import it${
              fileType === ".json, .bpmn" ? " (form, layout or bpmn)" : ""
            }`
          )}
        </p>
        <div className="upload-size-text">
          <span>{t(`Support for a single ${fileType} file upload.`)}</span>
          <span className="mt-1">{t("Maximum file size 20MB.")}</span>
        </div>
      </div>
    </>
  );

// Upload progress + status
const renderUploadStatus = () => {
    let buttonLabel = "";
    let handleClick = () => {};
    if (isUploading) {
      buttonLabel = t("Cancel");
      handleClick = () => {
        onCancel?.();      // let parent stop upload
      };
    } else if (isError && file) {
      buttonLabel = t("Try Again");
      handleClick = () => {
        onRetry?.(file);   // let parent retry upload
      };
    } else if (isCompleted) {
      buttonLabel = t("Done");
      handleClick = () => {
        onDone?.();
      };
    }

  return (
    <div className="upload-progress">
      <FileUploadIcon />
      <div className="upload-progress-bar">
        <CustomProgressBar progress={progress} />
      </div>

      {isUploading && (
        <p className="upload-status">{t(`Importing ${file?.name}`)}</p>
      )}
      {isError && (
        <p className="upload-status">{t("There was an error in the upload")}</p>
      )}
      {isCompleted && (
        <p className="upload-status">{t("Upload Complete!")}</p>
      )}

      {/* Dynamic button */}
      {/* <div className=""> */}
        <V8CustomButton
          className="file-upload-action-btn"
          label={buttonLabel}
          onClick={handleClick}
          ariaLabel={buttonLabel}
          dataTestId="file-upload-action-btn"
          variant="secondary"
        />
      {/* </div> */}
    </div>
  );
};

  return (
    <div
      role="button"
      data-testid="import-modal-file-upload-area"
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
      aria-label="Upload file"
    >
      {!file ? renderUploadPrompt() : renderUploadStatus()}
    </div>
  );
};
