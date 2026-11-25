// Tenant application branding at runtime. Shared by root-config, nav and the
// Appearance preview (admin).

export interface AppBranding {
  displayName: string | null;
  buttonShape: "rounded" | "square" | null;
  logoUrl: string | null;
}

const BUTTON_SQUARE_CLASS = "ff-button-square";
// PubSub event published after branding is saved, so open MFEs update in place.
export const BRANDING_UPDATED_EVENT = "ES_BRANDING_UPDATED";

const CACHE_KEY = "ff_app_branding";
const DISPLAY_NAME_VISIBLE_CHARS = 15;

/** Display name as shown in the sidebar: first 15 characters, then an ellipsis. */
export const truncateDisplayName = (
  name: string | null | undefined
): string => {
  const trimmed = (name || "").trim();
  return trimmed.length > DISPLAY_NAME_VISIBLE_CHARS
    ? `${trimmed.slice(0, DISPLAY_NAME_VISIBLE_CHARS)}…`
    : trimmed;
};

/** Applies branding to an element (default <html>); unset fields keep the theme defaults. */
export const applyBranding = (
  branding: Partial<AppBranding> | null,
  element: HTMLElement = document.documentElement
): void => {
  element.classList.toggle(
    BUTTON_SQUARE_CLASS,
    branding?.buttonShape === "square"
  );
};

export const cacheBranding = (
  branding: Partial<AppBranding> | null,
  tenantKey: string | null = null
): void => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ tenantKey, branding }));
  } catch {
    // Storage full or blocked: branding still applies, it just isn't cached.
  }
};

export const getCachedBranding = (
  tenantKey: string | null = null
): Partial<AppBranding> | null => {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    return cached && cached.tenantKey === tenantKey ? cached.branding : null;
  } catch {
    return null;
  }
};

// ── Live preview (Manage -> Appearance renders the app's home route in an iframe) ──

/** Attribute the Appearance tab sets on its preview iframe. */
export const BRANDING_PREVIEW_ATTR = "data-ff-preview";
export const BRANDING_PREVIEW_DRAFT = "ff-branding-preview-draft";
export const BRANDING_PREVIEW_READY = "ff-branding-preview-ready";
// The preview frame can't redirect to Keycloak (it refuses to be framed), so it
// asks the parent page for the current session instead.
export const BRANDING_PREVIEW_AUTH_REQUEST = "ff-branding-preview-auth-request";
export const BRANDING_PREVIEW_AUTH = "ff-branding-preview-auth";
export const BRANDING_PREVIEW_UNAVAILABLE = "ff-branding-preview-unavailable";
// Wheel/trackpad scrolling over the preview scrolls the parent page instead.
export const BRANDING_PREVIEW_WHEEL = "ff-branding-preview-wheel";

const HOME_PATH = /\/home\/?$/;

/** True when this app instance is the Appearance tab's preview iframe. */
export const isBrandingPreview = (): boolean => {
  try {
    return (
      window.self !== window.top &&
      Boolean(window.frameElement?.hasAttribute(BRANDING_PREVIEW_ATTR))
    );
  } catch {
    return false;
  }
};

/**
 * Turns this app instance into a view-only preview: draft branding sent by the
 * parent page is applied live, clicks are swallowed, scrolling is handed to
 * the parent page and navigation away from the home route is cancelled.
 * Returns a cleanup function.
 */
export const startBrandingPreview = (
  onDraft: (branding: Partial<AppBranding>) => void
): (() => void) => {
  const origin = window.location.origin;

  const onMessage = (event: MessageEvent) => {
    if (event.origin !== origin || event.source !== window.parent) return;
    if (event.data?.type !== BRANDING_PREVIEW_DRAFT) return;
    applyBranding(event.data.branding);
    onDraft(event.data.branding);
  };
  const blockInteraction = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
  };
  const forwardWheel = (event: WheelEvent) => {
    event.preventDefault();
    const { deltaX, deltaY, deltaMode, shiftKey } = event;
    window.parent.postMessage(
      { type: BRANDING_PREVIEW_WHEEL, deltaX, deltaY, deltaMode, shiftKey },
      origin
    );
  };
  const blockRouting = (event: Event) => {
    const detail = (event as CustomEvent).detail;
    const next = new URL(detail?.newUrl ?? window.location.href);
    if (!HOME_PATH.test(next.pathname)) detail?.cancelNavigation?.();
  };

  window.addEventListener("message", onMessage);
  document.addEventListener("click", blockInteraction, true);
  document.addEventListener("submit", blockInteraction, true);
  // Not passive: preventDefault keeps the app inside the frame from scrolling.
  window.addEventListener("wheel", forwardWheel, {
    capture: true,
    passive: false,
  });
  window.addEventListener("single-spa:before-routing-event", blockRouting);
  window.parent.postMessage({ type: BRANDING_PREVIEW_READY }, origin);

  return () => {
    window.removeEventListener("message", onMessage);
    document.removeEventListener("click", blockInteraction, true);
    document.removeEventListener("submit", blockInteraction, true);
    window.removeEventListener("wheel", forwardWheel, true);
    window.removeEventListener("single-spa:before-routing-event", blockRouting);
  };
};
