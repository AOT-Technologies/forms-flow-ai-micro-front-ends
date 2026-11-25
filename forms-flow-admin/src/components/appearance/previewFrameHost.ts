// Keeps the Appearance live-preview iframe alive for the life of the page, so
// coming back to the tab (or to /admin) shows it instantly instead of booting
// the app again. The iframe is attached to <body> once and never moved, since
// re-parenting an iframe reloads it; it is positioned over the preview panel
// while the tab is open and hidden otherwise.
import {
  BRANDING_PREVIEW_ATTR,
  BRANDING_PREVIEW_AUTH,
  BRANDING_PREVIEW_AUTH_REQUEST,
  BRANDING_PREVIEW_DRAFT,
  BRANDING_PREVIEW_READY,
  BRANDING_PREVIEW_UNAVAILABLE,
  BRANDING_PREVIEW_WHEEL,
  KeycloakService,
} from "@formsflow/service";

export type PreviewStatus = "loading" | "ready" | "unavailable";

// The app renders at desktop size inside the iframe and is scaled to the panel.
export const FRAME_WIDTH = 1440;
export const PANEL_WIDTH = 688;
export const PANEL_HEIGHT = 808;
const SCALE = PANEL_WIDTH / FRAME_WIDTH;
const READY_TIMEOUT_MS = 20000;

interface Host {
  src: string;
  wrapper: HTMLDivElement;
  frame: HTMLIFrameElement;
  status: PreviewStatus;
  listeners: Set<(status: PreviewStatus) => void>;
  timer: number;
  draft: unknown;
  shown: boolean;
}

export interface PreviewWheel {
  deltaX: number;
  deltaY: number;
  deltaMode: number;
  shiftKey: boolean;
}

let host: Host | null = null;
let wheelHandler: ((wheel: PreviewWheel) => void) | null = null;

/** Set by the visible preview panel to scroll the page for wheel events over the frame. */
export const setPreviewWheelHandler = (
  handler: ((wheel: PreviewWheel) => void) | null
): void => {
  wheelHandler = handler;
};

const updateVisibility = () => {
  if (!host) return;
  const { wrapper } = host;
  const visible =
    host.shown &&
    host.status === "ready" &&
    wrapper.offsetWidth > 0 &&
    wrapper.offsetHeight > 0;
  wrapper.style.visibility = visible ? "visible" : "hidden";
};

const postDraft = () => {
  if (host?.status !== "ready" || host.draft === undefined) return;
  host.frame.contentWindow?.postMessage(
    { type: BRANDING_PREVIEW_DRAFT, branding: host.draft },
    window.location.origin
  );
};

const setStatus = (status: PreviewStatus) => {
  if (!host || host.status === status) return;
  host.status = status;
  if (status !== "loading") window.clearTimeout(host.timer);
  if (status === "ready") postDraft();
  updateVisibility();
  host.listeners.forEach((listener) => listener(status));
};

// Lives as long as the frame, so token requests from the frame (initial login
// and later 401 retries) are answered even while the tab is closed.
const onMessage = (event: MessageEvent) => {
  const frame = host?.frame.contentWindow;
  if (!frame || event.origin !== window.location.origin) return;
  if (event.source !== frame) return;
  switch (event.data?.type) {
    case BRANDING_PREVIEW_READY:
      setStatus("ready");
      break;
    case BRANDING_PREVIEW_AUTH_REQUEST:
      frame.postMessage(
        {
          type: BRANDING_PREVIEW_AUTH,
          session: KeycloakService.getPreviewSession?.() ?? null,
        },
        window.location.origin
      );
      break;
    case BRANDING_PREVIEW_UNAVAILABLE:
      setStatus("unavailable");
      break;
    case BRANDING_PREVIEW_WHEEL:
      wheelHandler?.(event.data);
      break;
    default:
  }
};

const destroy = () => {
  if (!host) return;
  window.clearTimeout(host.timer);
  window.removeEventListener("message", onMessage);
  host.wrapper.remove();
  host = null;
};

const create = (src: string, title: string): Host => {
  const wrapper = document.createElement("div");
  wrapper.className = "ff-appearance-live-host";
  Object.assign(wrapper.style, {
    position: "fixed",
    overflow: "hidden",
    visibility: "hidden",
    zIndex: "10",
    left: "0px",
    top: "0px",
    width: "0px",
    height: "0px",
  });

  const frame = document.createElement("iframe");
  frame.src = src;
  frame.title = title;
  frame.tabIndex = -1;
  frame.setAttribute(BRANDING_PREVIEW_ATTR, "");
  Object.assign(frame.style, {
    position: "absolute",
    border: "0",
    width: `${FRAME_WIDTH}px`,
    height: `${PANEL_HEIGHT / SCALE}px`,
    transform: `scale(${SCALE})`,
    transformOrigin: "top left",
  });

  wrapper.appendChild(frame);
  document.body.appendChild(wrapper);
  window.addEventListener("message", onMessage);

  host = {
    src,
    wrapper,
    frame,
    status: "loading",
    listeners: new Set(),
    timer: window.setTimeout(() => setStatus("unavailable"), READY_TIMEOUT_MS),
    draft: undefined,
    shown: false,
  };
  return host;
};

/**
 * Starts the preview frame (or reuses the live one) and subscribes to its
 * status. A different src (e.g. another tenant) or a previous failure starts a
 * fresh frame. Returns an unsubscribe function.
 */
export const acquirePreviewFrame = (
  src: string,
  title: string,
  onStatus: (status: PreviewStatus) => void
): (() => void) => {
  if (host && (host.src !== src || host.status === "unavailable")) destroy();
  const current = host ?? create(src, title);
  current.listeners.add(onStatus);
  onStatus(current.status);
  return () => {
    current.listeners.delete(onStatus);
  };
};

/** Positions the frame over the panel, clipped to the visible area of `bounds`. */
export const placePreviewFrame = (panel: DOMRect, bounds: DOMRect): void => {
  if (!host) return;
  const left = Math.max(panel.left, bounds.left, 0);
  const top = Math.max(panel.top, bounds.top, 0);
  const right = Math.min(panel.right, bounds.right, window.innerWidth);
  const bottom = Math.min(panel.bottom, bounds.bottom, window.innerHeight);
  Object.assign(host.wrapper.style, {
    left: `${left}px`,
    top: `${top}px`,
    width: `${Math.max(0, right - left)}px`,
    height: `${Math.max(0, bottom - top)}px`,
  });
  Object.assign(host.frame.style, {
    left: `${panel.left - left}px`,
    top: `${panel.top - top}px`,
  });
  host.shown = true;
  updateVisibility();
};

/** Hides the frame (it keeps running) when the preview panel goes away. */
export const hidePreviewFrame = (): void => {
  if (!host) return;
  host.shown = false;
  updateVisibility();
};

/** Sends the current draft; it is replayed once the frame is ready. */
export const sendPreviewDraft = (branding: unknown): void => {
  if (!host) return;
  host.draft = branding;
  postDraft();
};
