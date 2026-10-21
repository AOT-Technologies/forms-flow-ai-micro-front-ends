import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  PANEL_HEIGHT,
  PANEL_WIDTH,
  PreviewStatus,
  PreviewWheel,
  acquirePreviewFrame,
  hidePreviewFrame,
  placePreviewFrame,
  sendPreviewDraft,
  setPreviewWheelHandler,
} from "./previewFrameHost";

export interface PreviewBranding {
  displayName: string | null;
  buttonShape: "rounded" | "square";
  logoUrl: string | null;
}

interface LivePreviewProps {
  src: string;
  branding: PreviewBranding;
}

// Ancestors that clip their content (scroll containers such as the Manage tab
// body). The frame floats on <body>, so it must be clipped to all of them or it
// draws over the tab header when the page scrolls.
const getClippingAncestors = (element: HTMLElement): HTMLElement[] => {
  const ancestors: HTMLElement[] = [];
  for (let node = element.parentElement; node; node = node.parentElement) {
    const { overflow, overflowX, overflowY } = getComputedStyle(node);
    if (/auto|scroll|hidden|clip/.test(`${overflow}${overflowX}${overflowY}`)) {
      ancestors.push(node);
    }
  }
  return ancestors;
};

const visibleArea = (ancestors: HTMLElement[]): DOMRect =>
  ancestors.reduce(
    (area, ancestor) => {
      const r = ancestor.getBoundingClientRect();
      return {
        left: Math.max(area.left, r.left),
        top: Math.max(area.top, r.top),
        right: Math.min(area.right, r.right),
        bottom: Math.min(area.bottom, r.bottom),
      } as DOMRect;
    },
    {
      left: 0,
      top: 0,
      right: window.innerWidth,
      bottom: window.innerHeight,
    } as DOMRect
  );

const LINE_HEIGHT_PX = 16;

const canScroll = (el: HTMLElement, axis: "x" | "y", delta: number) => {
  const style = getComputedStyle(el);
  if (!/auto|scroll/.test(axis === "x" ? style.overflowX : style.overflowY)) {
    return false;
  }
  return axis === "x"
    ? delta < 0
      ? el.scrollLeft > 0
      : el.scrollLeft + el.clientWidth < el.scrollWidth
    : delta < 0
    ? el.scrollTop > 0
    : el.scrollTop + el.clientHeight < el.scrollHeight;
};

// Scrolls whatever would have scrolled had the wheel event happened on the
// panel itself: the nearest ancestor that can move that way, else the window.
export const scrollFor = (ancestors: HTMLElement[], wheel: PreviewWheel) => {
  const unit =
    wheel.deltaMode === 1
      ? LINE_HEIGHT_PX
      : wheel.deltaMode === 2
      ? window.innerHeight
      : 1;
  let dx = wheel.deltaX * unit;
  let dy = wheel.deltaY * unit;
  if (wheel.shiftKey && !dx) [dx, dy] = [dy, 0];
  (
    [
      ["x", dx],
      ["y", dy],
    ] as const
  ).forEach(([axis, delta]) => {
    if (!delta) return;
    const target = ancestors.find((el) => canScroll(el, axis, delta));
    const by = axis === "x" ? { left: delta } : { top: delta };
    if (target) target.scrollBy(by);
    else window.scrollBy(by);
  });
};

// Placeholder for the long-lived preview iframe (see previewFrameHost): it
// reserves the panel's space and keeps the frame positioned over it.
const LivePreview: React.FC<LivePreviewProps> = ({ src, branding }) => {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLElement>(null);
  const [status, setStatus] = useState<PreviewStatus>("loading");

  useEffect(
    () => acquirePreviewFrame(src, t("Application preview"), setStatus),
    [src, t]
  );

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return undefined;
    const ancestors = getClippingAncestors(panel);
    // Synchronous, not deferred to the next frame, so the frame never trails
    // the panel while scrolling.
    const update = () =>
      placePreviewFrame(panel.getBoundingClientRect(), visibleArea(ancestors));
    update();
    setPreviewWheelHandler((wheel) => scrollFor(ancestors, wheel));
    const observer = new ResizeObserver(update);
    observer.observe(panel);
    observer.observe(document.body);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      setPreviewWheelHandler(null);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      hidePreviewFrame();
    };
  }, [src]);

  useEffect(() => sendPreviewDraft(branding), [branding]);

  return (
    <section
      ref={panelRef}
      className="ff-appearance-live"
      style={{ width: PANEL_WIDTH, height: PANEL_HEIGHT }}
      aria-label={t("Preview")}
    >
      {status !== "ready" && (
        <div className="ff-appearance-live__loading" role="status">
          {status === "unavailable"
            ? t("Preview unavailable. Reopen this tab to try again.")
            : t("Loading preview…")}
        </div>
      )}
    </section>
  );
};

export default LivePreview;
