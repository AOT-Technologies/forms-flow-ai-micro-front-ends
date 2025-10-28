import React, { useState, useCallback, useMemo, forwardRef, memo } from "react";
import { URLCopyIcon } from '../SvgIcons';
import { V8CustomButton } from "./CustomButton";
import { CustomInfo } from "./CustomInfo";

/**
 * CustomUrl is a reusable URL input component with copy functionality and save capabilities for forms-flow apps.
 * 
 * Usage:
 * <CustomUrl baseUrl="https://example.com/" onSave={handleSave} />
 * <CustomUrl baseUrl="https://api.example.com/v1/" initialUrl="https://api.example.com/v1/users/123" saveButtonText="Update URL" />
 * <CustomUrl baseUrl="https://formsflow.ai/" onSave={handleUrlSave} />
 */

type MessageType = "copied" | "saved" | "copy-failed" | null;

/**
 * Props for the CustomUrl component
 */
export interface CustomUrlProps extends Omit<React.ComponentPropsWithoutRef<"div">, 'children' | 'onBlur'> {
  /** Base URL that will be prepended to the custom URL input */
  baseUrl: string;
  /** Initial full URL value (will extract slug from base URL) */
  initialUrl?: string;
  /** Callback when URL is saved */
  onSave?: (fullUrl: string) => void;
  /** Callback when input loses focus */
  onBlur?: (currentUrl: string) => void;
  /** Text for the save button */
  saveButtonText?: string;
  /** Test ID for automated testing */
  dataTestId?: string;
  /** Additional CSS classes */
  className?: string;
  /** Accessible label for the URL input */
  ariaLabel?: string;
  /** Placeholder text for the input field */
  placeholder?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Whether to show the info section */
  showInfoSection?: boolean;
  /** Custom info text (default: "Changing this link will make the previous link inaccessible") */
  infoText?: string;
}

/**
 * Utility function to extract slug from full URL
 */
const extractSlugFromUrl = (fullUrl: string, base: string): string => {
  if (!fullUrl || !base) return "";
  return fullUrl.startsWith(base) ? fullUrl.substring(base.length) : fullUrl;
};

/**
 * Utility function to build className string
 */
const buildClassNames = (...classes: (string | boolean | undefined)[]): string => {
  return classes.filter(Boolean).join(" ");
};

/**
 * Enhanced CustomUrl component with improved accessibility, performance, and maintainability
 */
const CustomUrlComponent = forwardRef<HTMLDivElement, CustomUrlProps>(({
  baseUrl,
  initialUrl = "",
  onSave,
  onBlur,
  saveButtonText = "",
  dataTestId = "custom-url",
  className = "",
  ariaLabel = "Custom URL input",
  placeholder = "Enter URL",
  disabled = false,
  showInfoSection = false,
  infoText,
  ...restProps
}, ref) => {
  
  // Extract initial slug from full URL
  const initialSlug = useMemo(() => extractSlugFromUrl(initialUrl, baseUrl), [initialUrl, baseUrl]);
  
  // Internal state management
  const [url, setUrl] = useState(initialSlug);
  const [savedUrl, setSavedUrl] = useState(initialSlug);
  const [message, setMessage] = useState<MessageType>(null);

  // Computed values
  const fullUrl = useMemo(() => `${baseUrl}${url}`, [baseUrl, url]);
  const hasValidInput = url.trim().length > 0;
  const isSaveDisabled = !hasValidInput || disabled;
  
  // Message display text
  const getMessageText = useCallback((messageType: MessageType) => {
    if (messageType === "copied") return "URL copied";
    if (messageType === "saved") return "URL saved";
    if (messageType === "copy-failed") return "Copy failed";
    return "";
  }, []);

  // Memoized input change handler
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    setUrl(e.target.value);
  }, [disabled]);

  // Memoized blur handler
  const handleInputBlur = useCallback(() => {
    if (disabled || !onBlur) return;
    onBlur(url);
  }, [disabled, onBlur, url]);

  // Fallback copy function for older browsers using modern selection API
  const fallbackCopyToClipboard = useCallback((text: string) => {
    try {
      // Create a temporary textarea element
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      // Use modern selection API instead of deprecated execCommand
      const selection = globalThis.getSelection();
      const range = document.createRange();
      range.selectNodeContents(textArea);
      selection?.removeAllRanges();
      selection?.addRange(range);
      
      // Check if selection was successful
      if (selection?.toString().length > 0) {
        setMessage("copied");
        setTimeout(() => setMessage(null), 2500);
      } else {
        console.warn('Selection-based copy failed');
        setMessage("copy-failed");
        setTimeout(() => setMessage(null), 2500);
      }
    } catch (error) {
      console.warn('Fallback copy failed:', error);
      setMessage("copy-failed");
      setTimeout(() => setMessage(null), 2500);
    } finally {
      // Clean up
      const textArea = document.querySelector('textarea[style*="position: fixed"]');
      if (textArea) {
        textArea.remove();
      }
    }
  }, []);

  // Memoized copy handler using modern Clipboard API
  const handleCopy = useCallback(() => {
    if (disabled) return;
    
    // Check if we're in a secure context (required for Clipboard API)
    if (!globalThis.isSecureContext) {
      console.warn('Clipboard API requires secure context (HTTPS)');
      fallbackCopyToClipboard(fullUrl);
      return;
    }
    
    // Try modern Clipboard API first (recommended by MDN)
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(fullUrl)
        .then(() => {
          setMessage("copied");
          setTimeout(() => setMessage(null), 2500);
        })
        .catch((error) => {
          console.warn('Clipboard API failed, using fallback:', error);
          // Fallback for permission denied or other errors
          fallbackCopyToClipboard(fullUrl);
        });
    } else {
      // Fallback for browsers without Clipboard API support
      fallbackCopyToClipboard(fullUrl);
    }
  }, [fullUrl, disabled, fallbackCopyToClipboard]);

  // Memoized save handler
  const handleSave = useCallback(() => {
    if (isSaveDisabled) return;
    
    onSave?.(fullUrl);
    setSavedUrl(url);
    setMessage("saved");
    setTimeout(() => setMessage(null), 2500);
  }, [onSave, fullUrl, url, isSaveDisabled]);

  // Memoized keyboard handler for copy button
  const handleCopyKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === " " || e.key === "Spacebar" || e.key === "Enter") {
      e.preventDefault();
      handleCopy();
    }
  }, [disabled, handleCopy]);

  // Build className strings
  const containerClassName = buildClassNames(
    "urlInput",
    "py-4",
    // "border",
    "rounded-lg",
    "w-full",
    "max-w-xl",
    "bg-white",
    className
  );

  const inputClassName = buildClassNames(
    "urlInputField",
    "flex-1",
    "px-2",
    "py-2",
    "outline-none",
    disabled && "opacity-50",
    disabled && "cursor-not-allowed"
  );

  const copyButtonClassName = buildClassNames(
    "copyBtn",
    disabled && "opacity-50",
    disabled && "cursor-not-allowed"
  );

  return (
    <div
      ref={ref}
      className={containerClassName}
      data-testid={dataTestId}
      {...restProps}
    >
      <p className="title">Custom URL</p>
      <div className="input-actioncontainer">
      <div className="inputDiv d-flex">
        <span className="fixedUrl">{baseUrl}</span>
        <input
          type="text"
          id={`${dataTestId}-input`}
          name={`${dataTestId}-input`}
          value={url}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          className={inputClassName}
          placeholder={placeholder}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-describedby={message ? `${dataTestId}-message` : undefined}
          data-testid={`${dataTestId}-input`}
        />
        <button
          type="button"
          onClick={handleCopy}
          onKeyDown={handleCopyKeyDown}
          className={copyButtonClassName}
          disabled={disabled}
          aria-label="Copy URL to clipboard"
          data-testid={`${dataTestId}-copy`}
        >
          <URLCopyIcon />
        </button>
      </div>
      <div className="actions">
        {message && (
          <output 
            id={`${dataTestId}-message`}
            className="message"
            aria-live="polite"
            data-testid={`${dataTestId}-message`}
          >
            {getMessageText(message)}
          </output>
        )}
        {saveButtonText && <V8CustomButton
          label={saveButtonText}
          variant="secondary"
          disabled={isSaveDisabled}
          onClick={handleSave}
          dataTestId={`${dataTestId}-save`}
        />}
      </div>
        {showInfoSection && (
        <div className="info-section">
          <CustomInfo content={infoText} variant="primary"  dataTestId="short-info"/>
        </div>
      )}
      </div>
    </div>
  );
});

// Set display name for better debugging
CustomUrlComponent.displayName = "CustomUrl";

// Export memoized component for performance optimization
export const CustomUrl = memo(CustomUrlComponent);

// Default export for Storybook compatibility
export default CustomUrl;

// Export types for consumers
export type { MessageType };
