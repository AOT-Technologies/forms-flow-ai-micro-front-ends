import React, { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export const LOGO_TYPES = ["image/jpeg", "image/png", "image/gif"];
const LOGO_MAX_BYTES = 3 * 1024 * 1024;
const LOGO_MIN_SIZE = 20;

export interface SelectedLogo {
  file: File;
  name: string;
  dataUrl: string;
}

// What the card shows: a newly chosen file, or the saved logo.
export interface LogoCard {
  name: string;
  dataUrl: string;
}

interface LogoUploadProps {
  enabled: boolean;
  selected: LogoCard | null;
  onSelect: (logo: SelectedLogo) => void;
  onClear: () => void;
  onError: (message: string) => void;
}

const imageSize = (src: string): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () =>
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = src;
  });

const SearchIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const FileUpIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M12 12v6" />
    <path d="m15 15-3-3-3 3" />
  </svg>
);

const CloseIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const TrashIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" x2="10" y1="11" y2="17" />
    <line x1="14" x2="14" y1="11" y2="17" />
  </svg>
);

// Figma 30551:2253 (empty), 30551:2557 (loading), 30551:2656 (selected).
const LogoUpload: React.FC<LogoUploadProps> = ({
  enabled,
  selected,
  onSelect,
  onClear,
  onError,
}) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const readerRef = useRef<FileReader | null>(null);
  const progressLabelId = useId();
  const [loading, setLoading] = useState<{
    name: string;
    progress: number;
  } | null>(null);

  useEffect(() => () => readerRef.current?.abort(), []);

  const cancel = () => {
    readerRef.current?.abort();
    readerRef.current = null;
    setLoading(null);
  };

  const read = (file: File | undefined) => {
    if (!file || !enabled) return;
    if (!LOGO_TYPES.includes(file.type)) {
      onError(t("Image file type is not supported"));
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      onError(t("Image is larger than 3MB"));
      return;
    }

    // data: URL rather than a blob: URL -- the app CSP allows data: images only.
    const reader = new FileReader();
    readerRef.current = reader;
    setLoading({ name: file.name, progress: 0 });
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        setLoading({ name: file.name, progress: event.loaded / event.total });
      }
    };
    reader.onerror = () => {
      setLoading(null);
      onError(t("Image file type is not supported"));
    };
    reader.onload = async () => {
      if (readerRef.current !== reader) return; // cancelled
      const dataUrl = reader.result as string;
      try {
        const { width, height } = await imageSize(dataUrl);
        if (readerRef.current !== reader) return;
        if (width < LOGO_MIN_SIZE || height < LOGO_MIN_SIZE) {
          onError(t("Image is too small"));
        } else {
          onSelect({ file, name: file.name, dataUrl });
        }
      } catch {
        if (readerRef.current === reader) {
          onError(t("Image file type is not supported"));
        }
      } finally {
        if (readerRef.current === reader) {
          readerRef.current = null;
          setLoading(null);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  let body: React.ReactNode;
  if (loading) {
    body = (
      <div
        className="ff-logo-upload__card ff-logo-upload__card--loading"
        role="status"
      >
        <span className="ff-logo-upload__file-icon">
          <FileUpIcon />
        </span>
        <div className="ff-logo-upload__progress-wrap">
          <progress
            className="ff-logo-upload__progress"
            max={100}
            value={Math.round(loading.progress * 100)}
            aria-labelledby={progressLabelId}
          />
          <span
            id={progressLabelId}
            className="ff-logo-upload__name"
            title={loading.name}
          >
            {loading.name}
          </span>
        </div>
        <button
          type="button"
          className="ff-logo-upload__icon-btn"
          onClick={cancel}
          aria-label={t("Cancel upload")}
        >
          <CloseIcon />
        </button>
      </div>
    );
  } else if (selected) {
    body = (
      <div className="ff-logo-upload__card ff-logo-upload__card--selected">
        <span className="ff-logo-upload__thumb">
          <img src={selected.dataUrl} alt="" />
        </span>
        <span className="ff-logo-upload__name" title={selected.name}>
          {selected.name}
        </span>
        <button
          type="button"
          className="ff-logo-upload__icon-btn ff-logo-upload__icon-btn--danger"
          onClick={onClear}
          aria-label={t("Delete logo")}
          data-testid="appearance-logo-discard"
        >
          <TrashIcon />
        </button>
      </div>
    );
  } else {
    body = (
      <button
        type="button"
        className="ff-logo-upload__dropzone"
        disabled={!enabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          read(e.dataTransfer.files?.[0]);
        }}
        data-testid="appearance-logo-dropzone"
      >
        <SearchIcon />
        {t("Choose an image or file to upload")}
      </button>
    );
  }

  return (
    <div className="ff-logo-upload">
      {body}
      <input
        ref={inputRef}
        type="file"
        accept={LOGO_TYPES.join(",")}
        hidden
        onChange={(e) => {
          read(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
};

export default LogoUpload;
