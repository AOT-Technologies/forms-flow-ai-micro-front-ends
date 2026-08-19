import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

// Two distinct palettes — 21 colours each, rendered as 7 columns × 3 rows
const NEUTRAL_PALETTE: string[] = [
  // Row 1 – whites / pastels
  "#FFFFFF", "#F9FAFB", "#FEE2E2", "#FCE7F3", "#F5D0FE", "#EDE9FE", "#DDD6FE",
  // Row 2 – light blues / greens
  "#DBEAFE", "#BFDBFE", "#BAE6FD", "#A5F3FC", "#99F6E4", "#D1FAE5", "#ECFCCB",
  // Row 3 – darks
  "#FEF3C7", "#FFE4E6", "#111827", "#1F2937", "#374151", "#1E3A8A", "#134E4A",
];

const VIVID_PALETTE: string[] = [
  // Row 1 – warm / cool spectrum
  "#F97316", "#EF4444", "#EC4899", "#D946EF", "#A855F7", "#8B5CF6", "#3B82F6",
  // Row 2 – blues / greens
  "#2563EB", "#0EA5E9", "#06B6D4", "#0D9488", "#16A34A", "#65A30D", "#CA8A04",
  // Row 3 – earthy / dark
  "#B45309", "#C2410C", "#9F1239", "#111827", "#374151", "#1F2937", "#030712",
];

const HEX_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
const FULL_HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

// Expands a 3-digit hex ("#f0c") to 6-digit ("#ff00cc"); returns null if not valid hex.
const toFullHex = (raw: string): string | null => {
  const normalised = raw.startsWith("#") ? raw : `#${raw}`;
  if (FULL_HEX_REGEX.test(normalised)) return normalised;
  if (/^#[0-9A-Fa-f]{3}$/.test(normalised)) {
    return `#${normalised[1]}${normalised[1]}${normalised[2]}${normalised[2]}${normalised[3]}${normalised[3]}`;
  }
  return null;
};

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  palette?: "neutral" | "vivid";
  label?: string;
}

interface Position {
  top: number;
  left: number;
  minWidth: number;
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  palette = "vivid",
  label,
}) => {
  const [open, setOpen] = useState<boolean>(false);
  const [customInput, setCustomInput] = useState<string>(value || "");
  const [inputError, setInputError] = useState<boolean>(false);
  const [position, setPosition] = useState<Position | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const swatches = palette === "neutral" ? NEUTRAL_PALETTE : VIVID_PALETTE;

  useEffect(() => {
    setCustomInput(value || "");
  }, [value]);

  // The dropdown is portaled to <body> so a scrollable/overflow ancestor
  // (e.g. the Manage-templates edit panel, which scrolls) can't clip it.
  // Position is computed from the trigger's viewport rect and kept in sync
  // with position: fixed, so no scroll-offset math is needed.
  useEffect(() => {
    if (!open) return undefined;

    const updatePosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({ top: rect.bottom + 6, left: rect.left, minWidth: rect.width });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  // Close on outside click — checks both the trigger container AND the
  // portaled dropdown, since the dropdown no longer lives inside
  // containerRef's DOM subtree.
  useEffect(() => {
    if (!open) return undefined;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      const inTrigger = containerRef.current?.contains(target);
      const inDropdown = dropdownRef.current?.contains(target);
      if (!inTrigger && !inDropdown) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const selectColor = useCallback(
    (hex: string) => {
      onChange(hex);
      setCustomInput(hex);
      setInputError(false);
      setOpen(false);
    },
    [onChange]
  );

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setCustomInput(raw);
    const normalised = raw.startsWith("#") ? raw : `#${raw}`;
    if (HEX_REGEX.test(normalised)) {
      setInputError(false);
      onChange(normalised);
    } else {
      setInputError(true);
    }
  };

  const handleCustomInputBlur = () => {
    const normalised = customInput.startsWith("#") ? customInput : `#${customInput}`;
    if (!HEX_REGEX.test(normalised)) setInputError(true);
  };

  const handleNativeColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    setCustomInput(hex);
    setInputError(false);
    onChange(hex);
  };

  const displayValue = value ? value.replace("#", "").toUpperCase() : "------";

  return (
    <div className="ff-color-picker" ref={containerRef}>
      {label && (
        <span className="ff-color-picker__label" id={`cp-label-${label}`}>
          {label}
        </span>
      )}

      <button
        type="button"
        ref={triggerRef}
        className="ff-color-picker__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Colour picker: ${label || "colour"}, current value ${displayValue}`}
      >
        <span
          className="ff-color-picker__swatch"
          style={{ backgroundColor: value || "#FFFFFF" }}
          aria-hidden="true"
        />
        <span className="ff-color-picker__hex">{displayValue}</span>
        <svg
          className={`ff-color-picker__chevron${open ? " ff-color-picker__chevron--up" : ""}`}
          width="12"
          height="8"
          viewBox="0 0 12 8"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M1 1l5 5 5-5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && position && createPortal(
        <div
          ref={dropdownRef}
          className="ff-color-picker__dropdown ff-color-picker__dropdown--portal"
          style={{ top: position.top, left: position.left, minWidth: position.minWidth }}
          role="dialog"
          aria-label="Colour picker"
          aria-modal="false"
        >
          <div className="ff-color-picker__grid" role="listbox" aria-label="Preset colours">
            {swatches.map((hex) => (
              <button
                key={hex}
                type="button"
                role="option"
                aria-selected={value === hex}
                aria-label={hex}
                className={`ff-color-picker__cell${value === hex ? " ff-color-picker__cell--selected" : ""}`}
                style={{ backgroundColor: hex }}
                onClick={() => selectColor(hex)}
              />
            ))}
          </div>

          <div className="ff-color-picker__custom-row">
            <span className="ff-color-picker__custom-label">Custom colour</span>
            <div
              className={`ff-color-picker__custom-input-wrap${inputError ? " ff-color-picker__custom-input-wrap--error" : ""}`}
            >
              <label
                className="ff-color-picker__custom-swatch"
                style={{ backgroundColor: toFullHex(customInput) || "#FFFFFF" }}
                aria-label="Open colour picker"
              >
                <input
                  type="color"
                  className="ff-color-picker__native-input"
                  value={toFullHex(customInput) || "#FFFFFF"}
                  onChange={handleNativeColorChange}
                  tabIndex={-1}
                  aria-hidden="true"
                />
              </label>
              <input
                type="text"
                className="ff-color-picker__custom-input"
                value={customInput.replace("#", "").toUpperCase()}
                onChange={handleCustomInputChange}
                onBlur={handleCustomInputBlur}
                maxLength={7}
                placeholder="FFFFFF"
                aria-label="Custom hex colour"
                aria-invalid={inputError}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ColorPicker;
