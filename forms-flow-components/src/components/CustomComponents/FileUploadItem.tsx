import React, { forwardRef, memo } from "react";
import { useTranslation } from "react-i18next";
import { CustomProgressBar } from "./ProgressBar";
import { V8CustomButton } from "./CustomButton";
import {
  CloseIcon,
  EditOutlineIcon,
  FileDownloadIcon,
  FileIcon,
  FileUploadIcon,
  TrashOutlineIcon,
} from "../SvgIcons";

/**
 * FileUploadItem renders a single uploaded file row in one of three states.
 *
 * Usage:
 * <FileUploadItem status="uploading" fileName="a.pdf" progress={40} onCancel={...} />
 * <FileUploadItem status="success" fileName="Policy 56677" onDownload={...} onEdit={...} onDelete={...} />
 * <FileUploadItem status="error" fileName="a.pdf" progress={20} onRetry={...} onCancel={...} />
 */

type FileUploadStatus = "uploading" | "success" | "error";

interface FileUploadItemProps
  extends Omit<React.ComponentPropsWithoutRef<"div">, "children"> {
  /** Name of the file (or document title once uploaded) */
  fileName: string;
  /** Current upload state */
  status: FileUploadStatus;
  /** Upload progress (0-100), used in the uploading and error states */
  progress?: number;
  /** Message shown in the error state (translation key) */
  errorMessage?: string;
  /** Cancels an in-progress upload or dismisses a failed one */
  onCancel?: () => void;
  /** Retries a failed upload */
  onRetry?: () => void;
  /** Downloads the uploaded file; the button is hidden when omitted */
  onDownload?: () => void;
  /** Edits the uploaded file; the button is hidden when omitted */
  onEdit?: () => void;
  /** Deletes the uploaded file; the button is hidden when omitted */
  onDelete?: () => void;
  /** Test ID prefix for automated testing */
  dataTestId?: string;
  /** Additional CSS classes */
  className?: string;
}

interface IconActionProps {
  label: string;
  onClick: () => void;
  testId: string;
  className?: string;
  children: React.ReactNode;
}

const PROGRESS_HEIGHT = "0.375rem";
const PROGRESS_MIN_WIDTH = "0";
// Per-state colors are defined on .file-upload-item in the theme
const PROGRESS_BAR_COLOR = "var(--file-upload-item-bar)";
const PROGRESS_TRACK_COLOR = "var(--file-upload-item-track)";

const IconAction = ({
  label,
  onClick,
  testId,
  className = "",
  children,
}: IconActionProps) => (
  <button
    type="button"
    className={`file-upload-item__action ${className}`.trim()}
    onClick={onClick}
    aria-label={label}
    title={label}
    data-testid={testId}
  >
    <span aria-hidden="true">{children}</span>
  </button>
);

const FileUploadItemComponent = forwardRef<HTMLDivElement, FileUploadItemProps>(
  (
    {
      fileName,
      status,
      progress = 0,
      errorMessage = "Upload error",
      onCancel,
      onRetry,
      onDownload,
      onEdit,
      onDelete,
      dataTestId = "file-upload-item",
      className = "",
      ...restProps
    },
    ref
  ) => {
    const { t } = useTranslation();
    const isSuccess = status === "success";
    const isError = status === "error";

    const renderProgress = () => (
      <>
        <div className="file-upload-item__progress">
          <CustomProgressBar
            progress={progress}
            color={isError ? "error" : undefined}
            height={PROGRESS_HEIGHT}
            minWidth={PROGRESS_MIN_WIDTH}
            barColor={PROGRESS_BAR_COLOR}
            trackColor={PROGRESS_TRACK_COLOR}
            ariaLabel={t("Upload progress for {{fileName}}", { fileName })}
            dataTestId={`${dataTestId}-progress`}
          />
        </div>
        <span
          className="file-upload-item__status"
          title={isError ? t(errorMessage) : fileName}
          aria-live="polite"
          data-testid={`${dataTestId}-status`}
        >
          {isError ? t(errorMessage) : fileName}
        </span>
        {isError && onRetry && (
          <V8CustomButton
            className="file-upload-item__retry"
            label="Try again"
            onClick={onRetry}
            ariaLabel={t("Try again")}
            dataTestId={`${dataTestId}-retry-btn`}
            variant="secondary"
          />
        )}
        {onCancel && (
          <IconAction
            label={isError ? t("Dismiss") : t("Cancel upload")}
            onClick={onCancel}
            testId={`${dataTestId}-cancel-btn`}
            className="file-upload-item__action--close"
          >
            <CloseIcon />
          </IconAction>
        )}
      </>
    );

    const renderUploaded = () => (
      <>
        <span
          className="file-upload-item__name"
          title={fileName}
          data-testid={`${dataTestId}-name`}
        >
          {fileName}
        </span>
        <div className="file-upload-item__actions">
          {onDownload && (
            <IconAction
              label={t("Download {{fileName}}", { fileName })}
              onClick={onDownload}
              testId={`${dataTestId}-download-btn`}
            >
              <FileDownloadIcon />
            </IconAction>
          )}
          {onEdit && (
            <IconAction
              label={t("Edit {{fileName}}", { fileName })}
              onClick={onEdit}
              testId={`${dataTestId}-edit-btn`}
            >
              <EditOutlineIcon />
            </IconAction>
          )}
          {onDelete && (
            <IconAction
              label={t("Delete {{fileName}}", { fileName })}
              onClick={onDelete}
              testId={`${dataTestId}-delete-btn`}
              className="file-upload-item__action--danger"
            >
              <TrashOutlineIcon />
            </IconAction>
              // <DeleteIcon onClick={onDelete}/>
          )}
        </div>
      </>
    );

    return (
      <div
        ref={ref}
        className={`file-upload-item file-upload-item--${status} ${className}`.trim()}
        data-testid={dataTestId}
        {...restProps}
      >
        <span className="file-upload-item__icon" aria-hidden="true">
          {isSuccess ? <FileIcon /> : <FileUploadIcon />}
        </span>
        {isSuccess ? renderUploaded() : renderProgress()}
      </div>
    );
  }
);

FileUploadItemComponent.displayName = "FileUploadItem";

export const FileUploadItem = memo(FileUploadItemComponent);

export type { FileUploadItemProps, FileUploadStatus };
