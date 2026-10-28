import {
  applyBranding,
  cacheBranding,
  getCachedBranding,
  truncateDisplayName,
} from "./brandingService";

// Node test environment (no jsdom): minimal stand-ins for an element and localStorage.
const fakeElement = () => {
  const classes = new Set<string>();
  return {
    classList: {
      toggle: (c: string, on: boolean) =>
        on ? classes.add(c) : classes.delete(c),
      contains: (c: string) => classes.has(c),
    },
  } as unknown as HTMLElement;
};

const store = new Map<string, string>();
(global as any).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => store.set(k, v),
};

describe("applyBranding", () => {
  it("toggles the square-button class", () => {
    const el = fakeElement();
    applyBranding({ buttonShape: "square" }, el);
    expect(el.classList.contains("ff-button-square")).toBe(true);

    applyBranding(null, el);
    expect(el.classList.contains("ff-button-square")).toBe(false);
  });
});

describe("truncateDisplayName", () => {
  it("keeps names up to 15 characters and shortens longer ones", () => {
    expect(truncateDisplayName("New appearence")).toBe("New appearence");
    expect(truncateDisplayName("Ministry of Health")).toBe("Ministry of Hea…");
    expect(truncateDisplayName(null)).toBe("");
  });
});

describe("branding cache", () => {
  it("only returns branding for the same tenant", () => {
    cacheBranding({ buttonShape: "square" }, "tenant-a");
    expect(getCachedBranding("tenant-a")).toEqual({ buttonShape: "square" });
    expect(getCachedBranding("tenant-b")).toBeNull();
  });
});
