import React, { useEffect, useState } from "react";
import Modal from "react-bootstrap/Modal";
import ProgressBar from "react-bootstrap/ProgressBar";
import Dropdown from "react-bootstrap/Dropdown";
import { Translation } from "react-i18next";
import {
  CloseIcon,
  UploadIcon,
  SuccessIcon,
  FailedIcon,
  IButton,
  DropdownIcon,
} from "../SvgIcons";
import { CustomButton } from "../CustomComponents/Button";

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

interface ProcessVersion {
  majorVersion: number;
  minorVersion: number;
  type: string;
}

interface ImportModalProps {
  importModal: boolean;
  onClose: () => void;
  uploadActionType: {
    IMPORT: string;
    VALIDATE: string;
  };
  importError: string | null;
  importLoader: boolean;
  formName: string;
  description: string;
  handleImport: (file: File, uploadActionType: string, layoutVersion: string | null, flowVersion: string | null) => void
  fileItems: FileItem | null;
  fileType: string;
  primaryButtonText: string;
  headerText: string;
  processVersion: ProcessVersion | null;
}

export const ImportModal: React.FC<ImportModalProps> = React.memo(({
  importModal,
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
  processVersion
}) => {
  const computedStyle = getComputedStyle(document.documentElement);
  const redColor = computedStyle.getPropertyValue("--ff-red-000");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedLayoutVersion, setSelectedLayoutOption] = useState<{ value: any; label: string } | null>(null);
  const [selectedFlowVersion, setSelectedFlowOption] = useState<{ value: any; label: string } | null>(null);
  const [showFileItems, setShowFileItems] = useState(false);
  const [inprogress, setInprogress] = useState(true);

  const layoutOptions = [
    { value: true, label: 'Skip, do not import' },
    { value: 'major', label: `import as version ${fileItems?.form?.majorVersion + 1}.0 (only impacts new submissions)` },
    { value: 'minor', label: `import as version ${fileItems?.form?.majorVersion}.${fileItems?.form?.minorVersion} (impacts previous and new submissions)` }
  ];

  const flowOptions = [
    { value: true, label: 'Skip, do not import' },
    { value: 'major', label: `import as version ${fileItems?.workflow?.majorVersion ?? 1}.${fileItems?.workflow?.minorVersion ?? 0} (only impacts new submissions)` }
  ];

  const handleLayoutChange = (option: { value: any; label: string }) => {
    setSelectedLayoutOption(option);
  };

  const handFlowChange = (option: { value: any; label: string }) => {
    setSelectedFlowOption(option);
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
    setSelectedLayoutOption(null);
    setSelectedFlowOption(null);
    setShowFileItems(false);
    onClose();
  };

  const onImport = () => {
    if (selectedFile) {
      handleImport(selectedFile, uploadActionType.IMPORT,
        selectedLayoutVersion?.value, selectedFlowVersion?.value);
    }
  };

  useEffect(() => {
    if (fileItems && !importError && Object.values(fileItems).some(item =>
      item?.majorVersion != null || item?.minorVersion != null)) {
      setShowFileItems(true);
    } else if (processVersion?.majorVersion != null || processVersion?.minorVersion != null) {
      setShowFileItems(true);
    } else {
      setShowFileItems(false);
    }
  }, [importError, fileItems]);

  useEffect(() => {
    if (!importModal) {
      closeModal();
    }
  }, [importModal]);

  useEffect(() => {
    let isMounted = true;

    if (selectedFile) {
      handleImport(
        selectedFile,
        uploadActionType.VALIDATE,
        selectedLayoutVersion?.value ?? null,
        selectedFlowVersion?.value ?? null     
      );

      let start: number | null = null;
      const duration = 2000;

      const animateProgress = (timestamp: number) => {
        if (!start) start = timestamp;
        const progress = Math.min(((timestamp - start) / duration) * 100, 100);

        if (isMounted) {
          setUploadProgress(progress);
          setInprogress(progress < 100);
        }

        if (progress < 100) {
          requestAnimationFrame(animateProgress);
        }
      };

      const animation = requestAnimationFrame(animateProgress);

      return () => {
        isMounted = false;
        cancelAnimationFrame(animation);
      };
    }
  }, [selectedFile]);

  return (
    <Modal show={importModal} onHide={closeModal} centered size="sm">
      <Modal.Header>
        <Modal.Title>
          <b><Translation>{(t) => t(headerText)}</Translation></b>
        </Modal.Title>
        <div className="d-flex align-items-center">
          <CloseIcon width={16.5} height={16.5} onClick={() => { resetState(); closeModal(); }} />
        </div>
      </Modal.Header>
      <Modal.Body className="p-5">
        {selectedFile ? (
          <>
            <ProgressBar now={uploadProgress} />
            <div className="upload-body">
              <div className="upload-details">
                <p className="upload-file-name">{selectedFile.name}</p>
                <span className={`${!importLoader && !importError && !inprogress ? 'upload-status-success' :
                  !importLoader && importError && !inprogress ? 'upload-status-error' : inprogress ? 'upload-status-progress' : ''}`}>
                  {!importLoader && !importError && !inprogress ? (
                    <Translation>{(t) => t("Upload Successful")}</Translation>
                  ) : !importLoader && importError && !inprogress ? (
                    <Translation>{(t) => t("Upload Failed")}</Translation>
                  ) : inprogress ? (
                    <Translation>{(t) => t("Import in progress")}</Translation>
                  ) : null}
                </span>
                {!importLoader && importError ? <FailedIcon color={redColor} />
                  : !importLoader && !inprogress ? <SuccessIcon /> : null}
              </div>
              <div className={`${importError && formName ? 'upload-status-error' : "upload-form-details"}`}>{formName}</div>
              {!importError && description && <div className="upload-form-details">{description}</div>}
              <div>{importError && <span className="upload-status-error">{importError}</span>}</div>
              {importError && importError.includes("already exists") && fileType === ".json" &&
                <div className="import-error-note">
                  <div className="d-flex gap-2 align-items-center">
                    <IButton />
                    <Translation>{(t) => t("Note")}</Translation>
                  </div>
                  <div>
                    <Translation>{(t) => t(`If you want to replace an existing form, open the form in the design menu that you want to update, click "Actions", and then click "Import".`)}</Translation>
                  </div>
                </div>}
              <div>
                {importError && !importError.includes("already exists") &&
                  <span className="upload-status-error">
                    <Translation>{(t) => t("A system error occurred during import. Please try again to import.")}</Translation>
                  </span>}
              </div>
            </div>
            {showFileItems && !importError && (
              <div className="import-container">
                <div className="import-error-note d-block">
                  <div className="mx-2 d-flex align-items-center">
                    <IButton />
                    <span className="ms-2">
                      <Translation>{(t) => t("Import will create a new version.")}</Translation>
                    </span>
                  </div>
                </div>
                <div className="import-details">
                  <div className="file-item-header-text">Type</div>
                  <div className="file-item-header-text">Import</div>
                </div>

                {processVersion?.majorVersion && <div className="file-item-content">
                  <div className="import-layout-text">{processVersion.type}</div>
                  <div>{`Import as Version ${processVersion?.majorVersion}.${processVersion?.minorVersion} (only impacts new submissions)`}</div>
                </div>}
                {fileItems?.form?.majorVersion && <div className="file-item-content">
                  <div className="import-layout-text">Layout</div>
                  <div className="flex-grow-1">
                    <Dropdown className="dropdown-main">
                      <Dropdown.Toggle variant="success" id="dropdown-basic">
                        <div className="d-flex justify-content-between align-items-center w-100">
                          <div className="text-truncate">
                            {selectedLayoutVersion ? selectedLayoutVersion.label : 'Skip, do not import'}
                          </div>
                          <DropdownIcon />
                        </div>
                      </Dropdown.Toggle>

                      <Dropdown.Menu>
                        {layoutOptions.map((option, index) => (
                          <Dropdown.Item key={index} onClick={() => handleLayoutChange(option)}>
                            {option.label}
                          </Dropdown.Item>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </div>}

                {fileItems?.workflow?.majorVersion && <div className="file-item-content">
                  <div className="import-workflow-text">Flow</div>
                  <div className="flex-grow-1">
                    <Dropdown className="dropdown-main">
                      <Dropdown.Toggle variant="success" id="dropdown-basic">
                        <div className="d-flex justify-content-between align-items-center w-100">
                          <div className="text-truncate">
                            {selectedFlowVersion ? selectedFlowVersion.label : 'Skip, do not import'}
                          </div>
                          <DropdownIcon />
                        </div>
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        {flowOptions.map((option, index) => (
                          <Dropdown.Item key={index} onClick={() => handFlowChange(option)}>
                            {option.label}
                          </Dropdown.Item>
                        ))}
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </div>}
              </div>
            )}
          </>
        ) : (
          <div className="file-upload" onClick={() => document.getElementById('file-input')?.click()}>
            <input
              id="file-input"
              type="file"
              style={{ display: 'none' }}
              onChange={onUpload}
              accept={fileType}
            />
            <div className="upload-area">
              <UploadIcon />
              <p className="upload-text"><Translation>{(t) => t(`Click or drag a file to this area to import${fileType === ".json, .bpmn" ? " (form, layout or bpmn)" : ""}`)}</Translation></p>
              <p className="upload-size-text"><Translation>{(t) => t(`Support for a single ${fileType} file upload. Maximum file size 20MB.`)}</Translation></p>
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <CustomButton
          variant={(!selectedFile || (importError && primaryButtonText !== "Try Again")) ? "dark" : "primary"}
          disabled={!selectedFile || (importError && primaryButtonText !== "Try Again")}
          size="md"
          label={primaryButtonText}
          onClick={() => { primaryButtonText === "Try Again" ? closeModal() : onImport(); }}
          buttonLoading={!importError && importLoader}
        />
        <CustomButton
          variant="secondary"
          size="md"
          label="Cancel"
          onClick={() => { resetState(); closeModal(); }}
        />
      </Modal.Footer>
    </Modal>
  );
});


