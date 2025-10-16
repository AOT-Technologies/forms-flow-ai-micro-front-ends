import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FileUploadArea } from "./FileUploadArea";

interface FileItem {
  form?: {
    majorVersion: number;
    minorVersion: number;
  };
  workflow?: {
    majorVersion: number;
    minorVersion: number;
  };
}

interface CustomProgressBarProps {
  progress: number;
  color: string;
}

interface ProcessVersion {
  majorVersion: number;
  minorVersion: number;
  type: string;
}

interface FileUploadPanelProps {
  onClose: () => void;
  uploadActionType: {
    IMPORT: string;
    VALIDATE: string;
  };
  importError: string | null;
  importLoader: boolean;
  formName: string;
  description: string;
  handleImport: (
    file: File,
    uploadActionType: string,
    layoutVersion: string | null,
    flowVersion: string | null
  ) => void;
  fileItems: FileItem | null;
  fileType: string;
  primaryButtonText: string;
  headerText: string;
  processVersion: ProcessVersion | null;
  CustomProgressBarProps?: CustomProgressBarProps | null;
}

const FileUploadPanel: React.FC<FileUploadPanelProps> = React.memo(
  ({
    uploadActionType,
    importError,
    handleImport,
    fileItems,
    fileType,
    primaryButtonText,
  }) => {
    const { t } = useTranslation();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    const selectedLayoutVersion =       {
      value: "minor",
      label: t(
        `import as version ${fileItems?.form?.majorVersion}.${
          fileItems?.form?.minorVersion + 1
        }  (impacts previous and new submissions)`
      ),
    };

    const selectedFlowVersion = { value: "true", label: t("Skip, do not import") };
    const resetState = () => {
      setSelectedFile(null);
      setUploadProgress(0);
    };

    const onImport = () => {
      if (selectedFile) {
        handleImport(
          selectedFile,
          uploadActionType.IMPORT,
          selectedLayoutVersion?.value,
          selectedFlowVersion?.value
        );
      }
    };

    const handleRetry = () => {
      if (selectedFile) {
        handleImport(
          selectedFile,
          uploadActionType.VALIDATE,
          selectedLayoutVersion?.value ?? null,
          selectedFlowVersion?.value ?? null
        );
      }
    };

    useEffect(() => {
      let isMounted = true;
      if (selectedFile) {
        handleRetry();
        let start: number | null = null;
        const duration = 2000;
        const maxProgress = importError ? 50 : 100;

        const animateProgress = (timestamp: number) => {
          if (!isMounted) return;
          if (!start) start = timestamp;
          const progress = Math.min(
            ((timestamp - start) / duration) * maxProgress,
            maxProgress
          );
          setUploadProgress(progress);
          if (progress < maxProgress) {
            requestAnimationFrame(animateProgress);
          }
        };

        const animation = requestAnimationFrame(animateProgress);
        return () => {
          isMounted = false;
          cancelAnimationFrame(animation);
        };
      }
    }, [selectedFile, importError]);
    return (
      <div className="import-section-container p-4">

        <div className="import-section-body">
          <div className="d-flex justify-content-center mb-3">
            <FileUploadArea
              primaryButtonText={primaryButtonText}
              fileType={fileType}
              onFileSelect={setSelectedFile}
              file={selectedFile}
              progress={uploadProgress}
              error={importError}
              onRetry={handleRetry}
              onCancel={resetState}
              onDone={onImport}
            />
          </div>
        </div>
      </div>
    );
  }
);

export default FileUploadPanel;
