import { useEffect, useState, type RefObject } from "react";

export type DropdownPosition = {
  top: number;
  left: number;
  width: number;
};

/**
 * INTERNAL hook (not exported from the package barrel).
 *
 * While `isOpen`, tracks the wrapper element's document position (recomputed
 * on capture-phase scroll and on resize) for a portal-rendered dropdown menu.
 * Returns the last computed position (kept, not reset, when the dropdown
 * closes) - byte-for-byte the same computation as the copy-pasted
 * updatePosition + scroll/resize effects this replaces (SelectDropdown /
 * SelectWithCustomValue).
 */
export const useDropdownPosition = (
  isOpen: boolean,
  wrapperRef: RefObject<HTMLDivElement | null>
): DropdownPosition | null => {
  const [position, setPosition] = useState<DropdownPosition | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleUpdate = () => {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    };
    handleUpdate();
    window.addEventListener("scroll", handleUpdate, true);
    window.addEventListener("resize", handleUpdate);
    return () => {
      window.removeEventListener("scroll", handleUpdate, true);
      window.removeEventListener("resize", handleUpdate);
    };
  }, [isOpen, wrapperRef]);

  return position;
};

export default useDropdownPosition;
