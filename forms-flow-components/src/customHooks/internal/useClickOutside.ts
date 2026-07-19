import { useEffect, useRef, type RefObject } from "react";

/**
 * INTERNAL hook (not exported from the package barrel).
 *
 * Fires `onClickOutside` for any document `mousedown` that lands outside every
 * element in `refs`; a ref whose `current` is null counts as outside.
 *
 * The refs array and the handler are read through refs so the document
 * listener is registered exactly once per mount while always seeing the
 * latest values - observably equivalent to the per-component copy-pasted
 * effects this replaces (SelectDropdown / SelectWithCustomValue), which
 * closed over stable setters or re-registered on handler identity change.
 */
export const useClickOutside = (
  refs: ReadonlyArray<RefObject<HTMLElement | null>>,
  onClickOutside: (event: MouseEvent) => void
): void => {
  const handlerRef = useRef(onClickOutside);
  handlerRef.current = onClickOutside;
  const refsRef = useRef(refs);
  refsRef.current = refs;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      const target = event.target as Node;
      const clickedInside = refsRef.current.some((ref) =>
        ref.current?.contains(target)
      );
      if (!clickedInside) {
        handlerRef.current(event);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
};

export default useClickOutside;
