import React, { useState } from "react";
import { RequestService } from "@formsflow/service";
import API from "../../api/endpoints";
import { useDownloadFile } from "../../customHooks/useDownloadFile";
import { useTranslation } from "react-i18next";
import { withFeature } from "../../api/config";
import { V8CustomButton } from "../../components/CustomComponents/CustomButton";
import { replaceUrl } from "../../helper/helper";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Define interfaces for better type safety
interface DownloadPDFButtonProps {
  form_id: string;
  submission_id: string;
  title: string;
  onPreDownload?: () => void;
  onPostDownload?: () => void;
  disabled?: boolean;
}

interface DownloadFileParams {
  timezone: string;
}

interface UseDownloadFileOptions {
  apiDefinition: () => Promise<any>;
  preDownloading: () => void;
  postDownloading: () => void;
  onError: () => void;
  getFileName: () => string;
}

interface UseDownloadFileReturn {
  ref: React.RefObject<HTMLAnchorElement>;
  url: string;
  download: () => void;
  name: string;
}

const DownloadPDFButton: React.FC<DownloadPDFButtonProps> = React.memo(
  ({ form_id, submission_id, title, onPreDownload, onPostDownload, disabled = false }) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const { t } = useTranslation();

    const preDownloading = (): void => {
      setIsLoading(true);
      onPreDownload?.();
    };

    const postDownloading = (): void => {
      setIsLoading(false);
      onPostDownload?.();
    };

    const onErrorDownloadFile = (): void => {
      setIsLoading(false);
      toast.error(t("Something went wrong. Please try again!"));
    };

    const getFileName = (): string => {
      return `${title}_submission_${form_id}.pdf`;
    };

    const getClientTimeZone = (): string => {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    };

    const getExporturl = (): string => {
      let apiUrlExportPdf: string = replaceUrl(
        API.EXPORT_FORM_PDF,
        "<form_id>",
        form_id
      );
      apiUrlExportPdf = replaceUrl(
        apiUrlExportPdf,
        "<submission_id>",
        submission_id
      );
      return apiUrlExportPdf;
    };

    const downloadSamplePdfFile = (): Promise<any> => {
      const params: DownloadFileParams = {
        timezone: getClientTimeZone(),
      };

      return RequestService.httpPOSTBlobRequest(getExporturl(), params, {});
    };

    const downloadFileOptions: UseDownloadFileOptions = {
      apiDefinition: downloadSamplePdfFile,
      preDownloading,
      postDownloading,
      onError: onErrorDownloadFile,
      getFileName,
    };

    const { ref, url, download, name }: UseDownloadFileReturn =
      useDownloadFile(downloadFileOptions);

    return (
      <>
        <div className="d-flex flex-column">
          <a
            href={url}
            download={name}
            className="hidden"
            ref={ref}
            id="export-btn"
            style={{ display: "none" }}
          />
          <V8CustomButton
            variant="secondary"
            label={t("Export PDF")}
            onClick={download}
            loading={isLoading}
            dataTestId="export-pdf-button"
            ariaLabel="Export PDF Button"
            disabled={disabled}
          />
        </div>
        <ToastContainer
          position="bottom-right"
          autoClose={3000}
          hideProgressBar
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover={false}
          theme="colored"
        />
      </>
    );
  }
);

// Add display name for better debugging
DownloadPDFButton.displayName = "DownloadPDFButton";

export default withFeature("exportPdf")(DownloadPDFButton);
