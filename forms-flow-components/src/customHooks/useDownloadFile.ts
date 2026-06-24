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
  const [url, setUrl] = useState<string | undefined>();
  const [name, setName] = useState<string | undefined>();

  const download = async (): Promise<void> => {
    try {
      preDownloading();
      const { data } = await apiDefinition();
      const objectUrl = URL.createObjectURL(new Blob([data]));
      const fileName = getFileName();
      setUrl(objectUrl);
      setName(fileName);
      // Directly set href/download on the DOM element so the click doesn't race
      // against the async React state update
      if (ref.current) {
        ref.current.href = objectUrl;
        ref.current.download = fileName;
        ref.current.click();
      }
      postDownloading();
      // Delay revocation to give the browser time to start the download
      setTimeout(() => URL.revokeObjectURL(objectUrl), 150);
    } catch (error) {
      onError(error);
    }
  };

  return { download, ref, url, name };
};
