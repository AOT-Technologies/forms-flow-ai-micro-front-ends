jest.mock("@formsflow/service", () => ({
  BRANDING_PREVIEW_ATTR: "data-ff-preview",
  BRANDING_PREVIEW_AUTH: "ff-branding-preview-auth",
  BRANDING_PREVIEW_AUTH_REQUEST: "ff-branding-preview-auth-request",
  BRANDING_PREVIEW_DRAFT: "ff-branding-preview-draft",
  BRANDING_PREVIEW_READY: "ff-branding-preview-ready",
  BRANDING_PREVIEW_UNAVAILABLE: "ff-branding-preview-unavailable",
  BRANDING_PREVIEW_WHEEL: "ff-branding-preview-wheel",
  KeycloakService: { getSessionTokens: () => ({ token: "t1" }) },
}));

import {
  acquirePreviewFrame,
  hidePreviewFrame,
  placePreviewFrame,
  setPreviewWheelHandler,
} from "../previewFrameHost";

// jsdom has no DOMRect; placePreviewFrame only reads the edges.
const rect = (left: number, top: number, width: number, height: number) =>
  ({ left, top, right: left + width, bottom: top + height } as DOMRect);

const frames = () => document.querySelectorAll("iframe[data-ff-preview]");
const fromFrame = (type: string) => {
  const frame = frames()[0] as HTMLIFrameElement;
  window.dispatchEvent(
    new MessageEvent("message", {
      data: { type },
      origin: window.location.origin,
      source: frame.contentWindow,
    })
  );
  return frame;
};

describe("previewFrameHost", () => {
  it("creates the iframe once on <body> and reuses it on the next visit", () => {
    const release = acquirePreviewFrame("/home", "Preview", jest.fn());
    const first = frames()[0];
    expect(first.parentElement?.parentElement).toBe(document.body);
    release();
    hidePreviewFrame();

    acquirePreviewFrame("/home", "Preview", jest.fn());
    expect(frames()).toHaveLength(1);
    expect(frames()[0]).toBe(first);
  });

  it("reports ready to subscribers and replays status to late subscribers", () => {
    const onStatus = jest.fn();
    acquirePreviewFrame("/home", "Preview", onStatus);
    fromFrame("ff-branding-preview-ready");
    expect(onStatus).toHaveBeenLastCalledWith("ready");

    const late = jest.fn();
    acquirePreviewFrame("/home", "Preview", late);
    expect(late).toHaveBeenCalledWith("ready");
  });

  it("answers the frame's token request with this page's session", () => {
    const frame = frames()[0] as HTMLIFrameElement;
    const post = jest.spyOn(frame.contentWindow as Window, "postMessage");
    fromFrame("ff-branding-preview-auth-request");
    expect(post).toHaveBeenCalledWith(
      { type: "ff-branding-preview-auth", tokens: { token: "t1" } },
      window.location.origin
    );
  });

  it("passes wheel events from the frame to the visible panel", () => {
    const onWheel = jest.fn();
    setPreviewWheelHandler(onWheel);
    fromFrame("ff-branding-preview-wheel");
    expect(onWheel).toHaveBeenCalledWith({ type: "ff-branding-preview-wheel" });

    setPreviewWheelHandler(null);
    fromFrame("ff-branding-preview-wheel");
    expect(onWheel).toHaveBeenCalledTimes(1);
  });

  it("hides without destroying, and shows again when placed", () => {
    const wrapper = frames()[0].parentElement as HTMLElement;
    hidePreviewFrame();
    expect(wrapper.style.visibility).toBe("hidden");
    expect(frames()).toHaveLength(1);

    placePreviewFrame(rect(10, 20, 688, 808), rect(0, 0, 2000, 2000));
    expect(wrapper.style.left).toBe("10px");
    expect(wrapper.style.width).toBe("688px");
  });

  it("starts a fresh frame after a failure or for another tenant", () => {
    const old = frames()[0];
    fromFrame("ff-branding-preview-unavailable");
    acquirePreviewFrame("/home", "Preview", jest.fn());
    expect(frames()).toHaveLength(1);
    expect(frames()[0]).not.toBe(old);

    const current = frames()[0];
    acquirePreviewFrame("/tenant/other/home", "Preview", jest.fn());
    expect(frames()[0]).not.toBe(current);
    expect(frames()[0].getAttribute("src")).toBe("/tenant/other/home");
  });
});
