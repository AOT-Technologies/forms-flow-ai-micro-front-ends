import fs from "fs";
import path from "path";
import {
  BREAKPOINTS,
  CONTAINERS,
  BREAKPOINT_TIERS,
  mediaFrom,
  mediaBelow,
  resolveTier,
} from "./breakpoints";

// R2.2 requires one source feeding three consumers. The SCSS maps are that
// source; this suite fails if the TS mirror drifts from them.
const SCSS = path.resolve(
  __dirname,
  "../../../forms-flow-theme/scss/v8-scss/_mixins.scss"
);

const parseMap = (name: string): Record<string, number> => {
  const src = fs.readFileSync(SCSS, "utf8");
  const block = new RegExp(`\\$${name}:\\s*\\(([^)]*)\\)`, "s").exec(src);
  if (!block) throw new Error(`$${name} not found in ${SCSS}`);
  const out: Record<string, number> = {};
  for (const [, key, value] of block[1].matchAll(
    /([a-z0-9-]+)\s*:\s*(\d+)px/g
  )) {
    out[key] = Number(value);
  }
  return out;
};

describe("breakpoint tokens mirror the SCSS source", () => {
  it("has the same thresholds as $breakpoints", () => {
    expect(parseMap("breakpoints")).toEqual(BREAKPOINTS);
  });

  it("has the same container widths as $containers", () => {
    expect(parseMap("containers")).toEqual(CONTAINERS);
  });
});

describe("breakpoint tokens", () => {
  it("lists tiers in ascending threshold order", () => {
    const values = BREAKPOINT_TIERS.map((t) => BREAKPOINTS[t]);
    expect(values).toEqual([...values].sort((a, b) => a - b));
  });

  it("derives container widths from the column formula", () => {
    // container = (168px column + 16px gutter) x columns - 16px
    const columns: Record<string, number> = {
      mobile: 2,
      tablet: 3,
      "desktop-sm": 4,
      "desktop-md": 6,
      "desktop-lg": 6,
      "desktop-xl": 8,
      "desktop-2xl": 8,
    };
    for (const tier of BREAKPOINT_TIERS) {
      expect(CONTAINERS[tier]).toBe(184 * columns[tier] - 16);
    }
  });

  it("builds mobile-first queries anchored on the threshold", () => {
    expect(mediaFrom("tablet")).toBe("(min-width: 744px)");
  });

  it("keeps mediaBelow and mediaFrom mutually exclusive", () => {
    expect(mediaBelow("tablet")).toBe("(max-width: 743.98px)");
  });

  it("resolves the widest tier a width has reached", () => {
    expect(resolveTier(401)).toBeNull();
    expect(resolveTier(402)).toBe("mobile");
    expect(resolveTier(1439)).toBe("desktop-md");
    expect(resolveTier(4000)).toBe("desktop-2xl");
  });
});
