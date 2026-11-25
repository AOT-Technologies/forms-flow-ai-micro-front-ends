import { startBrandingPreview } from "./brandingService";

// Node test environment (no jsdom): a minimal window/document with listener registries.
const listeners: Record<string, ((e: any) => void)[]> = {};
const on = (type: string, fn: (e: any) => void) =>
  (listeners[type] = [...(listeners[type] || []), fn]);
const fire = (type: string, event: any) =>
  (listeners[type] || []).forEach((fn) => fn(event));
const parent = { postMessage: jest.fn() };
const classes = new Set<string>();

(global as any).window = {
  location: { origin: "https://app.example", href: "https://app.example/home" },
  parent,
  addEventListener: on,
  removeEventListener: jest.fn(),
};
(global as any).document = {
  addEventListener: on,
  removeEventListener: jest.fn(),
  documentElement: {
    classList: {
      toggle: (c: string, v: boolean) =>
        v ? classes.add(c) : classes.delete(c),
    },
  },
};

describe("startBrandingPreview", () => {
  const onDraft = jest.fn();
  beforeAll(() => startBrandingPreview(onDraft));

  it("tells the parent it is ready", () => {
    expect(parent.postMessage).toHaveBeenCalledWith(
      { type: "ff-branding-preview-ready" },
      "https://app.example"
    );
  });

  it("ignores drafts from another origin or window", () => {
    const data = {
      type: "ff-branding-preview-draft",
      branding: { buttonShape: "square" },
    };
    fire("message", { origin: "https://evil.example", source: parent, data });
    fire("message", { origin: "https://app.example", source: {}, data });
    expect(onDraft).not.toHaveBeenCalled();
  });

  it("applies a draft from the parent", () => {
    const branding = { buttonShape: "square", displayName: "Acme" };
    fire("message", {
      origin: "https://app.example",
      source: parent,
      data: { type: "ff-branding-preview-draft", branding },
    });
    expect(onDraft).toHaveBeenCalledWith(branding);
    expect(classes.has("ff-button-square")).toBe(true);
  });

  it("cancels navigation away from home only", () => {
    const cancel = jest.fn();
    fire("single-spa:before-routing-event", {
      detail: { newUrl: "https://app.example/form", cancelNavigation: cancel },
    });
    fire("single-spa:before-routing-event", {
      detail: {
        newUrl: "https://app.example/tenant/acme/home",
        cancelNavigation: cancel,
      },
    });
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it("hands wheel scrolling to the parent page", () => {
    const event = {
      preventDefault: jest.fn(),
      deltaX: 0,
      deltaY: 120,
      deltaMode: 0,
      shiftKey: false,
    };
    fire("wheel", event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(parent.postMessage).toHaveBeenCalledWith(
      {
        type: "ff-branding-preview-wheel",
        deltaX: 0,
        deltaY: 120,
        deltaMode: 0,
        shiftKey: false,
      },
      "https://app.example"
    );
  });

  it("swallows clicks", () => {
    const event = { preventDefault: jest.fn(), stopPropagation: jest.fn() };
    fire("click", event);
    expect(event.preventDefault).toHaveBeenCalled();
  });
});
