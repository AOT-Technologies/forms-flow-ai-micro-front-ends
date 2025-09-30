import React, { useState, useCallback, useMemo } from "react";
import { URLCopyIcon } from '../SvgIcons';
import { V8CustomButton } from "./CustomButton";

interface CustomUrlProps {
  baseUrl: string;
  initialUrl?: string;
  onSave?: (fullUrl: string) => void;
  saveButtonText?: string;
}

const extractSlugFromUrl = (fullUrl: string, base: string) => {
  if (!fullUrl || !base) return "";
  return fullUrl.startsWith(base) ? fullUrl.substring(base.length) : fullUrl;
};

const CustomUrl: React.FC<CustomUrlProps> = ({
  baseUrl,
  initialUrl = "",
  onSave,
  saveButtonText = "Save URL",
}) => {
  const initialSlug = useMemo(() => extractSlugFromUrl(initialUrl, baseUrl), [initialUrl, baseUrl]);
  const [url, setUrl] = useState(initialSlug);
  const [savedUrl, setSavedUrl] = useState(initialSlug);
  const [message, setMessage] = useState<"copied" | "saved" | null>(null);

  const fullUrl = useMemo(() => `${baseUrl}${url}`, [baseUrl, url]);
  const hasChanges = url !== savedUrl;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(fullUrl);
    setMessage("copied");
    setTimeout(() => setMessage(null), 2500);
  }, [fullUrl]);

  const handleSave = useCallback(() => {
    if (url.trim().length === 0) {
      return;
    }
    if (onSave) {
      onSave(fullUrl);
    }
    setSavedUrl(url);
    setMessage("saved");
    setTimeout(() => setMessage(null), 2500);
  }, [onSave, fullUrl, url]);

  return (
    <div className="urlInput p-4 border rounded-lg w-full max-w-xl bg-white">
      <p className="title">Custom URL</p>
      <div className="inputDiv d-flex">
        <span className="fixedUrl">{baseUrl}</span>
        <input
          type="text"
          id="custom-url-input"
          name="custom-url-input"
          value={url}
          onChange={e => setUrl(e.target.value)}
          className="urlInputField flex-1 px-2 py-2 outline-none"
          placeholder="Enter URL"
        />
        <button
          type="button"
          onClick={handleCopy}
          className="copyBtn"
          aria-label="Copy URL"
        >
          <URLCopyIcon />
        </button>
      </div>
      <div className="actions">
        {message && (
          <span className="message">
            {message === "copied" ? "URL copied" : "URL saved"}
          </span>
        )}
        <V8CustomButton 
          label={saveButtonText} 
          variant="secondary" 
          disabled={!hasChanges || url.trim().length === 0}
          onClick={handleSave}
        />
      </div>
    </div>
  );
};

export default CustomUrl;
