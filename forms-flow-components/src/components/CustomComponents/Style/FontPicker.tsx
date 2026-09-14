import React, { useState, useRef, useEffect } from "react";
import { FontKey } from "./themeConstants";

interface FontOption {
  key: FontKey;
  label: string;
  preview: string;
}

export const FONT_OPTIONS: FontOption[] = [
  {
    key: "serif",
    label: "Serif",
    preview: 'Georgia, "Times New Roman", Times, serif',
  },
  {
    key: "sans",
    label: "Sans",
    preview:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  {
    key: "heavy-sans",
    label: "Heavy Sans",
    preview: '"Arial Black", "Impact", Gadget, sans-serif',
  },
  {
    key: "mono",
    label: "Mono",
    preview: '"Courier New", Courier, monospace',
  },
  {
    key: "slab",
    label: "Slab",
    preview:
      'Rockwell, "Courier Bold", Courier, Georgia, Times, "Times New Roman", serif',
  },
];

interface FontPickerProps {
  value: FontKey;
  onChange: (key: FontKey) => void;
  label?: string;
}

const FontPicker: React.FC<FontPickerProps> = ({ value, onChange, label }) => {
  const [open, setOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = FONT_OPTIONS.find((f) => f.key === value) || FONT_OPTIONS[1];

  useEffect(() => {
    if (!open) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleSelect = (key: FontKey) => {
    onChange(key);
    setOpen(false);
  };

  return (
    <div className="ff-font-picker" ref={containerRef}>
      {label && <label className="ff-font-picker__label">{label}</label>}
      <button
        type="button"
        className="ff-font-picker__trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{ fontFamily: selected.preview }}
      >
        {selected.label}
        <svg
          className="ff-font-picker__chevron"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M2 4L6 8L10 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <ul
          className="ff-font-picker__dropdown"
          role="listbox"
          aria-label={label || "Font picker"}
        >
          {FONT_OPTIONS.map((option) => (
            <li
              key={option.key}
              role="option"
              aria-selected={value === option.key}
              className={`ff-font-picker__option${value === option.key ? " ff-font-picker__option--selected" : ""}`}
              style={{ fontFamily: option.preview }}
              onClick={() => handleSelect(option.key)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelect(option.key);
                }
              }}
              tabIndex={0}
            >
              {option.label}
              {value === option.key && (
                <svg
                  className="ff-font-picker__checkmark"
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2.5 7L5.5 10L11.5 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FontPicker;
