import { useRef, useState, MutableRefObject } from "react";

interface UseDownloadFileParams {
  apiDefinition: () => Promise<{ data: any }>;
  preDownloading: () => void;
  postDownloading: () => void;
  onError: (error?: any) => void;
  getFileName: () => string;
}

interface UseDownloadFileReturn {
  download: () => Promise<void>;
  ref: MutableRefObject<HTMLAnchorElement | null>;
  url: string | undefined;
  name: string | undefined;
}

export const useDownloadFile = ({
  apiDefinition,
  preDownloading,
  postDownloading,
  onError,
  getFileName,
}: UseDownloadFileParams): UseDownloadFileReturn => {
  const ref = useRef<HTMLAnchorElement | null>(null);
  const [url, setFileUrl] = useState<string | undefined>();
  const [name, setFileName] = useState<string | undefined>();

  const download = async (): Promise<void> => {
    try {
      preDownloading();
      const { data } = await apiDefinition();
      const url = URL.createObjectURL(new Blob([data]));
      setFileUrl(url);
      setFileName(getFileName());
      ref.current?.click();
      postDownloading();
      URL.revokeObjectURL(url);
    } catch (error) {
      onError(error);
    }
  };

  return { download, ref, url, name };
};
