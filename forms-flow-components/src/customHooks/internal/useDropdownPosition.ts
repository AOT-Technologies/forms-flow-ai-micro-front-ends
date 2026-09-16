import { useEffect, useState, type RefObject } from "react";

/** Side of the trigger the menu is placed on. */
export type DropdownPlacement = "bottom" | "top";

export type DropdownPosition = {
  /**
   * Document-space offset the menu wrapper anchors to: the trigger's bottom
   * edge for `bottom` placement, its top edge for `top` placement (the
   * consumer pulls the menu up with `translateY(-100%)`).
   */
  top: number;
  left: number;
  width: number;
  /** Always "bottom" unless flipping is enabled and the menu would not fit below. */
  placement: DropdownPlacement;
  /** Room left for the menu on `placement`'s side, in px. `null` when flipping is off. */
  availableHeight: number | null;
};

export interface UseDropdownPositionOptions {
  /** Place the menu above the trigger when there is not enough room below it. */
  flip?: boolean;
  /** Menu height used to decide whether it fits below. Defaults to 20rem. */
  preferredHeight?: number;
  /** Gap kept between the menu and the viewport edge. */
  viewportPadding?: number;
  /** Floor for `availableHeight` so a cramped viewport still shows a scrollable menu. */
  minHeight?: number;
}

/** 20rem — matches the `max-height` the menus use in the theme. */
const DEFAULT_PREFERRED_HEIGHT = 320;
const DEFAULT_VIEWPORT_PADDING = 8;
const DEFAULT_MIN_HEIGHT = 120;

/**
 * INTERNAL hook (not exported from the package barrel).
 *
 * While `isOpen`, tracks the wrapper element's document position (recomputed
 * on capture-phase scroll and on resize) for a portal-rendered dropdown menu.
 * Returns the last computed position (kept, not reset, when the dropdown
 * closes).
 *
 * Without `options.flip` the menu always sits below the trigger - byte-for-byte
 * the same computation as the copy-pasted updatePosition + scroll/resize
 * effects this replaces (SelectDropdown / SelectWithCustomValue).
 *
 * With `options.flip` the menu is placed above the trigger whenever it would
 * not fit below and there is more room above, and `availableHeight` reports how
 * much vertical space the chosen side offers so the consumer can cap the menu.
 */
export const useDropdownPosition = (
  isOpen: boolean,
  wrapperRef: RefObject<HTMLDivElement | null>,
  options: UseDropdownPositionOptions = {}
): DropdownPosition | null => {
  const {
    flip = false,
    preferredHeight = DEFAULT_PREFERRED_HEIGHT,
    viewportPadding = DEFAULT_VIEWPORT_PADDING,
    minHeight = DEFAULT_MIN_HEIGHT,
  } = options;
  const [position, setPosition] = useState<DropdownPosition | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleUpdate = () => {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      const left = rect.left + window.scrollX;

      if (!flip) {
        setPosition({
          top: rect.bottom + window.scrollY,
          left,
          width: rect.width,
          placement: "bottom",
          availableHeight: null,
        });
        return;
      }

      const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
      const spaceAbove = rect.top - viewportPadding;
      const placeOnTop =
        spaceBelow < preferredHeight && spaceAbove > spaceBelow;

      setPosition({
        top: (placeOnTop ? rect.top : rect.bottom) + window.scrollY,
        left,
        width: rect.width,
        placement: placeOnTop ? "top" : "bottom",
        availableHeight: Math.max(
          placeOnTop ? spaceAbove : spaceBelow,
          minHeight
        ),
      });
    };
    handleUpdate();
    window.addEventListener("scroll", handleUpdate, true);
    window.addEventListener("resize", handleUpdate);
    return () => {
      window.removeEventListener("scroll", handleUpdate, true);
      window.removeEventListener("resize", handleUpdate);
    };
  }, [isOpen, wrapperRef, flip, preferredHeight, viewportPadding, minHeight]);

  return position;
};

export default useDropdownPosition;
