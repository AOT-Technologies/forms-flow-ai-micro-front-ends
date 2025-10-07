import React, { useState, useCallback, useMemo, forwardRef, memo } from "react";
import { URLCopyIcon } from '../SvgIcons';
import { V8CustomButton } from "./CustomButton";

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
interface CustomUrlProps extends Omit<React.ComponentPropsWithoutRef<"div">, 'children'> {
  /** Base URL that will be prepended to the custom URL input */
  baseUrl: string;
  /** Initial full URL value (will extract slug from base URL) */
  initialUrl?: string;
  /** Callback when URL is saved */
  onSave?: (fullUrl: string) => void;
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
  saveButtonText = "Save URL",
  dataTestId = "custom-url",
  className = "",
  ariaLabel = "Custom URL input",
  placeholder = "Enter URL",
  disabled = false,
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

  // Memoized input change handler
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    setUrl(e.target.value);
  }, [disabled]);

  // Memoized copy handler
  const handleCopy = useCallback(() => {
    if (disabled) return;
    
    // Try modern clipboard API first
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(fullUrl)
        .then(() => {
          setMessage("copied");
          setTimeout(() => setMessage(null), 2500);
        })
        .catch((error) => {
          console.warn('Failed to copy URL to clipboard:', error);
          // Fallback for older browsers
          fallbackCopyToClipboard(fullUrl);
        });
    } else {
      // Fallback for older browsers
      fallbackCopyToClipboard(fullUrl);
    }
  }, [fullUrl, disabled]);

  // Fallback copy function for older browsers
  const fallbackCopyToClipboard = useCallback((text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const success = document.execCommand('copy');
      if (success) {
        setMessage("copied");
        setTimeout(() => setMessage(null), 2500);
      } else {
        console.warn('Copy command failed');
        setMessage("copy-failed");
        setTimeout(() => setMessage(null), 2500);
      }
    } catch (error) {
      console.warn('execCommand is deprecated and failed:', error);
      setMessage("copy-failed");
      setTimeout(() => setMessage(null), 2500);
    } finally {
      textArea.remove();
    }
  }, []);

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
    "p-4",
    "border",
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
      <div className="inputDiv d-flex">
        <span className="fixedUrl">{baseUrl}</span>
        <input
          type="text"
          id={`${dataTestId}-input`}
          name={`${dataTestId}-input`}
          value={url}
          onChange={handleInputChange}
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
            {message === "copied" ? "URL copied" : message === "saved" ? "URL saved" : "Copy failed"}
          </output>
        )}
        <V8CustomButton
          label={saveButtonText}
          variant="secondary"
          disabled={isSaveDisabled}
          onClick={handleSave}
          dataTestId={`${dataTestId}-save`}
        />
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
export type { CustomUrlProps, MessageType };
