import { scrollFor } from "../LivePreview";

// A scroll container with the given overflow and scroll position.
const container = (
  overflow: { x?: string; y?: string },
  size: {
    scrollTop?: number;
    scrollHeight?: number;
    scrollLeft?: number;
    scrollWidth?: number;
  }
) => {
  const el = document.createElement("div");
  el.style.overflowX = overflow.x ?? "visible";
  el.style.overflowY = overflow.y ?? "visible";
  Object.defineProperties(el, {
    clientHeight: { value: 100 },
    clientWidth: { value: 100 },
    scrollHeight: { value: size.scrollHeight ?? 100 },
    scrollWidth: { value: size.scrollWidth ?? 100 },
  });
  el.scrollTop = size.scrollTop ?? 0;
  el.scrollLeft = size.scrollLeft ?? 0;
  el.scrollBy = jest.fn();
  return el;
};

const wheel = (deltaX: number, deltaY: number, extra = {}) => ({
  deltaX,
  deltaY,
  deltaMode: 0,
  shiftKey: false,
  ...extra,
});

describe("scrollFor (wheel over the preview scrolls the page)", () => {
  beforeEach(() => {
    window.scrollBy = jest.fn();
  });

  it("scrolls the nearest container that can move vertically", () => {
    const tabBody = container({ y: "auto" }, { scrollHeight: 500 });
    scrollFor([tabBody], wheel(0, 120));
    expect(tabBody.scrollBy).toHaveBeenCalledWith({ top: 120 });
  });

  it("skips a container already at the end and falls back to the window", () => {
    const atBottom = container(
      { y: "auto" },
      { scrollHeight: 500, scrollTop: 400 }
    );
    scrollFor([atBottom], wheel(0, 120));
    expect(atBottom.scrollBy).not.toHaveBeenCalled();
    expect(window.scrollBy).toHaveBeenCalledWith({ top: 120 });
  });

  it("scrolls sideways for horizontal swipes and Shift+wheel", () => {
    const row = container({ x: "auto" }, { scrollWidth: 400 });
    scrollFor([row], wheel(80, 0));
    expect(row.scrollBy).toHaveBeenCalledWith({ left: 80 });

    scrollFor([row], wheel(0, 60, { shiftKey: true }));
    expect(row.scrollBy).toHaveBeenCalledWith({ left: 60 });
  });

  it("converts line-based wheel deltas to pixels", () => {
    const tabBody = container({ y: "auto" }, { scrollHeight: 500 });
    scrollFor([tabBody], wheel(0, 3, { deltaMode: 1 }));
    expect(tabBody.scrollBy).toHaveBeenCalledWith({ top: 48 });
  });
});
