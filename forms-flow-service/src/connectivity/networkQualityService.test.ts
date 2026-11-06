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
  positiveFromEnv: jest.requireActual("./connectivityService").positiveFromEnv,
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

  test("failed API calls count as failures; their time is not used", () => {
    const apiFailed = { ok: false, ms: 0, source: "api" };
    expect(levelFromSamples([apiFailed, apiFailed], limits)).toBe("unstable");
  });
});

describe("levelFromBrowser", () => {
  const { levelFromBrowser } = loadService();

  test("from rtt, with the same limits as our checks", () => {
    expect(levelFromBrowser({ rtt: 50 }, limits)).toBe("good");
    expect(levelFromBrowser({ rtt: 575 }, limits)).toBe("slow"); // Slow 4G
    expect(levelFromBrowser({ rtt: 2000 }, limits)).toBe("unstable"); // 3G
  });

  test("from effectiveType when there is no rtt (or 0 = no estimate yet)", () => {
    expect(levelFromBrowser({ rtt: 0, effectiveType: "4g" }, limits)).toBe("good");
    expect(levelFromBrowser({ effectiveType: "3g" }, limits)).toBe("slow");
    expect(levelFromBrowser({ effectiveType: "2g" }, limits)).toBe("unstable");
    expect(levelFromBrowser({ effectiveType: "slow-2g" }, limits)).toBe("unstable");
  });

  test("no estimate (Safari, Firefox): null, so our checks decide", () => {
    expect(levelFromBrowser(null, limits)).toBeNull();
    expect(levelFromBrowser({ rtt: 0 }, limits)).toBeNull();
  });
});

describe("hintFromBrowser", () => {
  const { hintFromBrowser } = loadService();

  test("no estimate: good (no effect on the level)", () => {
    expect(hintFromBrowser(null, limits)).toBe("good");
  });

  test("on its own never worse than slow", () => {
    expect(hintFromBrowser({ rtt: 575 }, limits)).toBe("slow");
    expect(hintFromBrowser({ rtt: 2000 }, limits)).toBe("slow");
    expect(hintFromBrowser({ effectiveType: "2g" }, limits)).toBe("slow");
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

  // The check that brings us back comes in while we are still "offline".
  const goOffline = () => {
    mockOnline = false;
    onlineListener!(false);
  };
  const backOnlineWith = (sample: any) => {
    sampleListener!(sample);
    mockOnline = true;
    onlineListener!(true);
  };

  test("back online on Slow 4G (586 ms): slow at once, not good", () => {
    const { service, seen } = started();
    goOffline();
    backOnlineWith(probe(586));
    expect(service.getLevel()).toBe("slow");
    expect(seen).toEqual(["offline", "slow"]);
  });

  test("back online on 3G (2.1 s): unstable at once", () => {
    const { service } = started();
    goOffline();
    backOnlineWith(probe(2100));
    expect(service.getLevel()).toBe("unstable");
  });

  test("back online on a fast network: good", () => {
    const { service } = started();
    sampleListener!(failed);
    sampleListener!(failed);
    goOffline();
    backOnlineWith(probe(80));
    expect(service.getLevel()).toBe("good");
  });

  test("failed checks while offline are not kept; only the one that worked", () => {
    const { service } = started();
    goOffline();
    sampleListener!(failed);
    sampleListener!(failed);
    backOnlineWith(probe(586));
    expect(service.getLevel()).toBe("slow");
    // One more fast check is not yet enough to go up (3 in a row needed).
    sampleListener!(probe(80));
    expect(service.getLevel()).toBe("slow");
  });

  test("the back-online check is used once, not again on the next reconnect", () => {
    const { service } = started();
    goOffline();
    backOnlineWith(probe(2100));
    expect(service.getLevel()).toBe("unstable");
    goOffline();
    // Back online without a timed check (e.g. no sample reached us).
    mockOnline = true;
    onlineListener!(true);
    expect(service.getLevel()).toBe("good");
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

  describe("without a browser estimate (Safari, Firefox)", () => {
    test("checks every 15 s while slow or unstable", () => {
      const { service } = started();
      sampleListener!(probe(800));
      jest.advanceTimersByTime(1000); // the second check of a quick change
      sampleListener!(probe(800));
      expect(service.getLevel()).toBe("slow");
      mockCheck.mockReset();

      // Due 15 s after the last check; the timer looks every 5 s.
      jest.advanceTimersByTime(10000);
      expect(mockCheck).not.toHaveBeenCalled();
      jest.advanceTimersByTime(10000);
      expect(mockCheck).toHaveBeenCalledTimes(1);
    });

    test("quick change: a second check that agrees sets the new level at once", () => {
      const { service, seen } = started();
      [1, 2, 3].forEach(() => sampleListener!(probe(100)));
      sampleListener!(probe(2100)); // 3G now? (the median alone says good)
      expect(service.getLevel()).toBe("good");
      jest.advanceTimersByTime(1000);
      expect(mockCheck).toHaveBeenCalledTimes(1); // checked again right away
      sampleListener!(probe(2050));
      expect(service.getLevel()).toBe("unstable");

      // Back to a fast network: up at once too, not after 3 checks.
      sampleListener!(probe(90));
      jest.advanceTimersByTime(1000);
      sampleListener!(probe(80));
      expect(service.getLevel()).toBe("good");
      expect(seen).toEqual(["unstable", "good"]);
    });

    test("a bump that the second check does not confirm changes nothing", () => {
      const { service } = started();
      [1, 2, 3].forEach(() => sampleListener!(probe(100)));
      sampleListener!(probe(900));
      jest.advanceTimersByTime(1000);
      sampleListener!(probe(100));
      expect(service.getLevel()).toBe("good");
    });

    test("a failed check in between cancels the quick change", () => {
      const { service } = started();
      [1, 2, 3].forEach(() => sampleListener!(probe(100)));
      sampleListener!(probe(2100)); // candidate
      sampleListener!(failed); // e.g. the confirm check timed out
      jest.advanceTimersByTime(1000);
      expect(mockCheck).not.toHaveBeenCalled(); // its timer was stopped
      sampleListener!(probe(2000)); // a new candidate, not a confirm
      // No quick change to unstable: only the normal median rule applied
      // (median of 100, 100, 2100, 2000 = 1050 ms → slow).
      expect(service.getLevel()).toBe("slow");
    });

    test("unstable because checks failed: fast checks go up the normal way", () => {
      const { service } = started();
      sampleListener!(failed);
      sampleListener!(failed);
      sampleListener!(probe(100));
      jest.advanceTimersByTime(1000);
      sampleListener!(probe(100));
      expect(service.getLevel()).toBe("unstable");
    });
  });

  describe("with a browser estimate (Chrome, Edge, Android)", () => {
    const realNavigator = (global as any).navigator;
    let connection: any;
    let onChange: (() => void) | null;

    beforeEach(() => {
      onChange = null;
      connection = {
        rtt: 50,
        effectiveType: "4g",
        addEventListener: (type: string, fn: () => void) => {
          if (type === "change") onChange = fn;
        },
      };
      Object.defineProperty(global, "navigator", {
        value: { connection },
        configurable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(global, "navigator", {
        value: realNavigator,
        configurable: true,
      });
    });

    test("Wi-Fi → 3G: the hint warns at once, our checks then decide", () => {
      const { service, seen } = started();
      connection.rtt = 1950;
      onChange!();
      expect(service.getLevel()).toBe("slow"); // the hint, capped at slow
      expect(mockCheck).toHaveBeenCalledTimes(1); // our check right away

      sampleListener!(probe(2100));
      jest.advanceTimersByTime(1000); // the second check
      expect(mockCheck).toHaveBeenCalledTimes(2);
      sampleListener!(probe(2000));
      expect(service.getLevel()).toBe("unstable");
      expect(seen).toEqual(["slow", "unstable"]);
    });

    test("the browser alone never makes it better than our checks", () => {
      // Too optimistic (far or busy server): rtt 50, our checks ~1.7 s.
      const { service } = started();
      sampleListener!(probe(1700));
      jest.advanceTimersByTime(1000);
      sampleListener!(probe(1800));
      expect(service.getLevel()).toBe("unstable");
      onChange!(); // still rtt 50
      expect(service.getLevel()).toBe("unstable");
    });

    test("a pessimistic browser makes it at most slow", () => {
      connection.effectiveType = "2g";
      connection.rtt = 0;
      const { service } = started();
      [1, 2, 3].forEach(() => sampleListener!(probe(80)));
      expect(service.getLevel()).toBe("slow"); // not unstable
    });

    test("after the browser recovers, the level follows our checks", () => {
      connection.rtt = 2000;
      const { service } = started();
      expect(service.getLevel()).toBe("slow");
      connection.rtt = 50;
      onChange!();
      expect(service.getLevel()).toBe("good"); // our checks: no slow answers
    });

    test("many change events in a row start one check per 5 s", () => {
      started();
      [0, 800, 700, 1100].forEach((ms) => {
        jest.advanceTimersByTime(ms);
        onChange!();
      });
      expect(mockCheck).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(3400); // 6 s after the first one
      onChange!();
      expect(mockCheck).toHaveBeenCalledTimes(2);
    });

    test("a change that could not be checked does not use up the 5 s gap", () => {
      started();
      mockAllowed = false;
      onChange!(); // no check (offline forms off)
      expect(mockCheck).not.toHaveBeenCalled();
      mockAllowed = true;
      jest.advanceTimersByTime(1000);
      onChange!();
      expect(mockCheck).toHaveBeenCalledTimes(1);
    });

    test("checks every 15 s while the hint says slow", () => {
      connection.rtt = 800;
      started();
      jest.advanceTimersByTime(15000);
      expect(mockCheck).toHaveBeenCalledTimes(1);
    });
  });
});
