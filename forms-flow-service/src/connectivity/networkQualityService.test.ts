// NetworkQualityService (FFF-3 offline, Phase 6): four network levels from
// timed checks, without flickering.

(global as any).window = { _env_: {} };

let mockOnline = true;
let mockAllowed = true;
let sampleListener: ((sample: any) => void) | null = null;
let onlineListener: ((online: boolean) => void) | null = null;
const mockCheck = jest.fn();

jest.mock("./connectivityService", () => ({
  __esModule: true,
  default: {
    isOnline: () => mockOnline,
    check: (...args: unknown[]) => mockCheck(...args),
    subscribeSamples: (listener: (sample: any) => void) => {
      sampleListener = listener;
      return () => {};
    },
    subscribe: (listener: (online: boolean) => void) => {
      onlineListener = listener;
      return () => {};
    },
  },
}));
jest.mock("../offline/offlineSettings", () => ({
  __esModule: true,
  default: { isOfflineAllowed: () => mockAllowed },
}));

const probe = (ms: number) => ({ ok: true, ms, source: "probe" });
const failed = { ok: false, ms: 0, source: "probe" };
const limits = { goodMs: 300, slowMs: 1500, unstableFailures: 2 };

const loadService = () => {
  let module: any;
  jest.isolateModules(() => {
    module = require("./networkQualityService");
  });
  return module;
};

describe("levelFromSamples", () => {
  const { levelFromSamples } = loadService();

  test("fast checks and no failures: good", () => {
    expect(levelFromSamples([probe(100), probe(200), probe(150)], limits)).toBe("good");
  });

  test("typical time 300 ms - 1.5 s: slow", () => {
    expect(levelFromSamples([probe(200), probe(800), probe(900)], limits)).toBe("slow");
  });

  test("typical time over 1.5 s: unstable", () => {
    expect(levelFromSamples([probe(1600), probe(1800), probe(200)], limits)).toBe("unstable");
  });

  test("2 failures in the last 5 checks: unstable, even when the others are fast", () => {
    expect(
      levelFromSamples([probe(200), probe(300), failed, probe(200), failed], limits)
    ).toBe("unstable");
  });

  test("one failure alone does not make it unstable", () => {
    expect(levelFromSamples([probe(100), failed, probe(100)], limits)).toBe("good");
  });

  test("the browser says 2G: at least slow", () => {
    expect(levelFromSamples([probe(100)], limits, true)).toBe("slow");
  });

  test("failed API calls count as failures; their time is not used", () => {
    const apiFailed = { ok: false, ms: 0, source: "api" };
    expect(levelFromSamples([apiFailed, apiFailed], limits)).toBe("unstable");
  });
});

describe("getNetworkLimits", () => {
  test("defaults, and env keys when they are valid numbers", () => {
    const { getNetworkLimits } = loadService();
    expect(getNetworkLimits()).toEqual(limits);
    (global as any).window._env_ = {
      REACT_APP_OFFLINE_NETWORK_GOOD_MS: "500",
      REACT_APP_OFFLINE_NETWORK_SLOW_MS: "nonsense",
      REACT_APP_OFFLINE_NETWORK_UNSTABLE_FAILURES: "3",
    };
    expect(getNetworkLimits()).toEqual({ goodMs: 500, slowMs: 1500, unstableFailures: 3 });
    (global as any).window._env_ = {};
  });
});

describe("NetworkQualityService", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockOnline = true;
    mockAllowed = true;
    mockCheck.mockReset();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  const started = () => {
    const service = loadService().default;
    const seen: string[] = [];
    service.subscribe((level: string) => seen.push(level));
    return { service, seen };
  };

  test("goes down at once and up only after 3 better checks in a row", () => {
    const { service } = started();
    sampleListener!(failed);
    sampleListener!(failed);
    expect(service.getLevel()).toBe("unstable");

    // Fast checks push the failures out of the last 5 …
    [1, 2, 3].forEach(() => sampleListener!(probe(100)));
    expect(service.getLevel()).toBe("unstable"); // still 2 failures in the last 5
    sampleListener!(probe(100)); // 1st better check
    sampleListener!(probe(100)); // 2nd
    expect(service.getLevel()).toBe("unstable");
    sampleListener!(probe(100)); // 3rd
    expect(service.getLevel()).toBe("good");
  });

  test("offline when ConnectivityService cannot reach the API", () => {
    const { service } = started();
    mockOnline = false;
    expect(service.getLevel()).toBe("offline");
  });

  test("back online: old failures are forgotten", () => {
    const { service, seen } = started();
    sampleListener!(failed);
    sampleListener!(failed);
    mockOnline = false;
    onlineListener!(false);
    mockOnline = true;
    onlineListener!(true);
    expect(service.getLevel()).toBe("good");
    expect(seen).toEqual(["unstable", "offline", "good"]);
  });

  test("checks every 60 s only while allowed, visible and online", () => {
    started();
    jest.advanceTimersByTime(60000);
    expect(mockCheck).toHaveBeenCalledTimes(1);

    mockAllowed = false;
    jest.advanceTimersByTime(60000);
    mockAllowed = true;
    mockOnline = false;
    jest.advanceTimersByTime(60000);
    expect(mockCheck).toHaveBeenCalledTimes(1);
  });
});
