import React, { useEffect, useState } from "react";
import Modal from "react-bootstrap/Modal";
import Dropdown from "react-bootstrap/Dropdown";
import {
  CloseIcon,
  SuccessIcon,
  FailedIcon,
  IButton,
  DropdownIcon,
} from "../SvgIcons";
import { CustomButton } from "../CustomComponents/Button";
import { useTranslation } from "react-i18next";
import { FileUploadArea } from "../CustomComponents/FileUploadArea";

// Define the types for props
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

interface ImportModalProps {
  showModal: boolean;
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
  CustomProgressBarProps: CustomProgressBarProps | null;
}

export const ImportModal: React.FC<ImportModalProps> = React.memo(
  ({
    showModal,
    onClose,
    uploadActionType,
    importError,
    importLoader,
    formName,
    description,
    handleImport,
    fileItems,
    fileType,
    primaryButtonText,
    headerText,
    processVersion,
  }) => {
    const { t } = useTranslation();
    const computedStyle = getComputedStyle(document.documentElement);
    const redColor = computedStyle.getPropertyValue("--ff-danger");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const hasVersion = (item) => item?.majorVersion != null || item?.minorVersion != null;
    const skipImport = t("Skip, do not import");
    const [selectedLayoutVersion, setSelectedLayoutVersion] = useState<{
      value: any;
      label: string;
    } | null>({
      value: true,
      label: skipImport,
    });
    const [selectedFlowVersion, setSelectedFlowVersion] = useState<{
      value: any;
      label: string;
    } | null>({
      value: true,
      label: skipImport,
    });

    const [showFileItems, setShowFileItems] = useState(false);
    const [inprogress, setInprogress] = useState(true);
    const layoutOptions = [
      { value: true, label: t("Skip, do not import") },
      {
        value: "major",
        label: t(`import as version ${
          fileItems?.form?.majorVersion + 1
        }.0 (only impacts new submissions)`),
      },
      {
        value: "minor",
        label: t(`import as version ${fileItems?.form?.majorVersion}.${
          fileItems?.form?.minorVersion + 1
        }  (impacts previous and new submissions)`),
      },
    ];

    const flowOptions = [
      { value: true, label:  t("Skip, do not import") },
      {
        value: "major",
        label: t(`import as version ${fileItems?.workflow?.majorVersion ?? 1}.${
          fileItems?.workflow?.minorVersion ?? 0
        } (only impacts new submissions)`),
      },
    ];

    const handleLayoutChange = (option: { value: any; label: string }) => {
      setSelectedLayoutVersion(option);
    };

    const handFlowChange = (option: { value: any; label: string }) => {
      setSelectedFlowVersion(option);
    };

    const onUpload = (evt: React.ChangeEvent<HTMLInputElement>) => {
      const file = evt.target.files ? evt.target.files[0] : null;
      setSelectedFile(file);
    };

    const resetState = () => {
      setSelectedFile(null);
      setUploadProgress(0);
    };

    const closeModal = () => {
      setSelectedFile(null);
      setUploadProgress(0);
      setSelectedLayoutVersion(null);
      setSelectedFlowVersion(null);
      setShowFileItems(false);
      onClose();
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


    const primaryButtonDisabled =
      !selectedFile ||
      inprogress ||
      importLoader ||
      (importError && primaryButtonText !== "Try Again") || 
      (showFileItems && fileItems &&
        selectedFlowVersion?.label === skipImport && 
        selectedLayoutVersion?.label === skipImport);
       
      useEffect(() => {
        const fileItemsHasVersion = fileItems && Object.values(fileItems).some(hasVersion);
        const processVersionHasVersion = hasVersion(processVersion);
        if (fileItemsHasVersion || processVersionHasVersion) {
          setShowFileItems(true);
         } else {
          setShowFileItems(false);
        }
      }, [importError, fileItems, processVersion]);

    useEffect(() => {
      if (!showModal) {
        closeModal();
      }
    }, [showModal]);

    // Retry with same file
    const handleRetry = () => {
        handleImport(
          selectedFile,
          uploadActionType.VALIDATE,
          selectedLayoutVersion?.value ?? null,
          selectedFlowVersion?.value ?? null
        );
    };
    useEffect(() => {
      let isMounted = true;

      if (selectedFile) {
        handleRetry();

        let start: number | null = null;
        const duration = 2000;
        // set max target based on error flag
        const maxProgress = importError ? 50 : 100;
        

        const animateProgress = (timestamp: number) => {
          //  exit immediately if not mounted
          if (!isMounted) return;

          if (!start) start = timestamp;
          const progress = Math.min(
            ((timestamp - start) / duration) * maxProgress,
            maxProgress
          );

            setUploadProgress(progress);
            setInprogress(progress < maxProgress);

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

    const renderUploadDetails = () => {
      return (
        <div className="upload-body">
          <div className="upload-details">
            <p className="upload-file-name">{selectedFile?.name}</p>
            <span className={getUploadStatusClass()}>
              {renderUploadStatusText()}
            </span>
            {renderUploadStatusIcon()}
          </div>
          <div
            className={`${
              importError && formName
                ? "upload-status-error"
                : "upload-form-details"
            }`}
          >
            {formName}
          </div>
          {!importError && description && (
            <div className="upload-form-details">{description}</div>
          )}
          {renderImportError()}
        </div>
      );
    };

    const getUploadStatusClass = () => {
      if (!importLoader && !importError && !inprogress) {
        return "upload-status-success";
      }

      if (!importLoader && importError && !inprogress) {
        return "upload-status-error";
      }

      if (inprogress) {
        return "upload-status-progress";
      }

      return "";
    };

    // Function to render the status text based on the upload condition
    const renderUploadStatusText = () => {
      if (!importLoader && !importError && !inprogress) {
        return t("Upload Successful");
      }
      if (!importLoader && importError && !inprogress) {
        return t("Upload Failed");
      }
      if (inprogress) {
        return t("Import in progress");
      }
      return null;
    };

    // Function to render the correct status icon based on upload progress
    const renderUploadStatusIcon = () => {
      if (!importLoader && importError) {
        return <FailedIcon color={redColor} />;
      }
      if (!importLoader && !inprogress) {
        return <SuccessIcon />;
      }
      return null;
    };

    // Function to render import errors
    const renderImportError = () => {
      return (
        importError && (
          <span className="upload-status-error">{importError}</span>
        )
      );
    };

    // Function to render the import file items and version options
    const renderFileItems = () => {
      if (showFileItems && !importError) {
        return (
          <div className="import-container">
            {renderImportNote()}
            {renderFileItemDetails()}
            {renderLayoutOptions()}
            {renderFlowOptions()}
            {renderProcessOption()}
          </div>
        );
      }
      return null;
    };

    // Function to render import note when file items are shown
    const renderImportNote = () => {
      return (
        <div className="import-error-note d-block">
          <div className="mx-2 d-flex align-items-center">
            <IButton />
            <span className="ms-2">
              {t("Import will create a new version.")}
            </span>
          </div>
        </div>
      );
    };

    // Function to render the file item details (e.g. type and import version)
    const renderFileItemDetails = () => {
      return (
        <>
          {(fileItems?.form?.majorVersion || processVersion?.majorVersion) && (
            <div className="import-details">
              <div className="file-item-header-text">{t("Type")}</div>
              <div className="file-item-header-text">{t("Import")}</div>
            </div>
          )}
        </>
      );
    };

    // Function to render layout version options
    const renderLayoutOptions = () => {
      return (
        fileItems?.form?.majorVersion && (
          <div className="file-item-content">
            <div className="import-layout-text">{t("Layout")}</div>
            <div className="flex-grow-1">
              <Dropdown className="dropdown-main">
                <Dropdown.Toggle variant="success" id="dropdown-basic">
                  <div className="d-flex justify-content-between align-items-center w-100">
                    <div className="text-truncate">
                      {selectedLayoutVersion
                        ? selectedLayoutVersion.label
                        : t("Skip, do not import")}
                    </div>
                    <DropdownIcon dataTestId="import-dropdown-layout"/>
                  </div>
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {layoutOptions.map((option) => (
                    <Dropdown.Item
                      key={option.value.toString()}
                      onClick={() => handleLayoutChange(option)}
                    >
                      {option.label}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>
        )
      );
    };

    // Function to render flow version options
    const renderFlowOptions = () => {
      return (
        fileItems?.workflow?.majorVersion && (
          <div className="file-item-content">
            <div className="import-workflow-text">Flow</div>
            <div className="flex-grow-1">
              <Dropdown className="dropdown-main">
                <Dropdown.Toggle variant="success" id="dropdown-basic">
                  <div className="d-flex justify-content-between align-items-center w-100">
                    <div className="text-truncate">
                      {selectedFlowVersion
                        ? selectedFlowVersion.label
                        : t("Skip, do not import")}
                    </div>
                    <DropdownIcon dataTestId="import-dropdown-flow" />
                  </div>
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {flowOptions.map((option) => (
                    <Dropdown.Item
                      key={option.value.toString()}
                      onClick={() => handFlowChange(option)}
                    >
                      {option.label}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>
        )
      );
    };

    const renderProcessOption = () => {
      return (
         processVersion?.majorVersion && (
          <div className="file-item-content">
            <div className="import-workflow-text">{processVersion.type}</div>
            <div className="flex-grow-1">
             {t(`Import as Version ${processVersion?.majorVersion}.${processVersion?.minorVersion} (only impacts new submissions)`)}
            </div>
          </div>
        )
      );
    }


    return (
      <Modal show={showModal} onHide={closeModal} size="sm">
        <Modal.Header>
          <Modal.Title>
            <p>{t(headerText)}</p>
          </Modal.Title>
          <div className="icon-close"
          data-testid="import-modal-close-icon"
          onClick={() => {
            resetState();
            closeModal();
          }}>
            <CloseIcon />
          </div>
        </Modal.Header>
        <Modal.Body className="p-5">
          <div className="d-flex justify-content-center">
          <FileUploadArea
            primaryButtonText={primaryButtonText}
            fileType={fileType}
            onFileSelect={setSelectedFile}
            file={selectedFile}
            progress={uploadProgress}
            error={importError}
            onRetry={handleRetry}
            onCancel={() => {resetState();}}
            onDone={() => {closeModal();}}
          />
          </div>
        </Modal.Body>
      </Modal>
    );
  }
);
