// ConnectivityService (FFF-3 offline, Phase 1): decides online/offline with a
// real request to our own API, not just navigator.onLine.

const windowListeners: Record<string, Array<() => void>> = {};
(global as any).window = {
  _env_: { REACT_APP_WEB_BASE_URL: "http://api.test" },
  addEventListener: (type: string, fn: () => void) => {
    (windowListeners[type] = windowListeners[type] || []).push(fn);
  },
};
const navigatorState = { onLine: true };
Object.defineProperty(global, "navigator", {
  value: navigatorState,
  configurable: true,
});

const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

const loadService = () => {
  let service: any;
  jest.isolateModules(() => {
    service = require("./connectivityService").default;
  });
  return service;
};

// A failed probe while online is tried once more after 3 s (Phase 6).
const checkAndWait = async (service: any) => {
  const result = service.check();
  await jest.advanceTimersByTimeAsync(3000);
  return result;
};

describe("ConnectivityService", () => {
  beforeEach(() => {
    // The offline re-check uses setInterval; keep timers fake so none leak.
    jest.useFakeTimers();
    mockFetch.mockReset();
    navigatorState.onLine = true;
    Object.keys(windowListeners).forEach((key) => delete windowListeners[key]);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test("probes our own API with a HEAD /checkpoint that is never cached", async () => {
    mockFetch.mockResolvedValue({ ok: true });
    const service = loadService();

    await expect(service.check()).resolves.toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://api.test/checkpoint",
      expect.objectContaining({ method: "HEAD", cache: "no-store" })
    );
  });

  test("is offline when the browser says online but the API cannot be reached", async () => {
    mockFetch.mockRejectedValue(new TypeError("Failed to fetch"));
    const service = loadService();

    await expect(checkAndWait(service)).resolves.toBe(false);
    expect(service.isOnline()).toBe(false);
    expect(mockFetch).toHaveBeenCalledTimes(2); // tried twice
  });

  test("one failed check while online is not an outage: the second check decides", async () => {
    mockFetch
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValue({ ok: true });
    const service = loadService();
    const samples: any[] = [];
    service.subscribeSamples((sample: any) => samples.push(sample));

    await expect(checkAndWait(service)).resolves.toBe(true);
    expect(service.isOnline()).toBe(true);
    // The first failure still counts for the network level.
    expect(samples.map((sample) => sample.ok)).toEqual([false, true]);
  });

  test("is offline when the API answers with an error status", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 503 });
    const service = loadService();

    await expect(checkAndWait(service)).resolves.toBe(false);
  });

  test("does not send a request when the browser already knows it is offline", async () => {
    navigatorState.onLine = false;
    const service = loadService();

    await expect(service.check()).resolves.toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test("notifies subscribers only when the state changes, and stops after unsubscribe", async () => {
    const service = loadService();
    const listener = jest.fn();
    const unsubscribe = service.subscribe(listener);

    mockFetch.mockRejectedValue(new TypeError("offline"));
    await checkAndWait(service); // online -> offline
    await service.check(); // still offline: no new call (and no second try)
    mockFetch.mockResolvedValue({ ok: true });
    await service.check(); // offline -> online

    expect(listener.mock.calls).toEqual([[false], [true]]);

    unsubscribe();
    mockFetch.mockRejectedValue(new TypeError("offline"));
    await checkAndWait(service);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  test("the browser offline event switches to offline without a request", () => {
    const service = loadService();
    const listener = jest.fn();
    service.subscribe(listener);

    windowListeners.offline.forEach((fn) => fn());

    expect(service.isOnline()).toBe(false);
    expect(listener).toHaveBeenCalledWith(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test("checks that start together share one request", async () => {
    mockFetch.mockResolvedValue({ ok: true });
    const service = loadService();

    const results = await Promise.all([service.check(), service.check(), service.check()]);

    expect(results).toEqual([true, true, true]);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  test("a failed API call triggers a check, at most once every few seconds", async () => {
    mockFetch.mockRejectedValue(new TypeError("Failed to fetch"));
    const service = loadService();
    const listener = jest.fn();
    service.subscribe(listener);

    service.reportNetworkError();
    await jest.advanceTimersByTimeAsync(3000); // the second try
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenCalledWith(false);

    service.reportNetworkError(); // right after: skipped
    expect(mockFetch).toHaveBeenCalledTimes(2);

    await jest.advanceTimersByTimeAsync(5000);
    service.reportNetworkError(); // later: checks again (offline now: one try)
    await jest.advanceTimersByTimeAsync(0);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  test("tells sample listeners each check's result and time (network level)", async () => {
    mockFetch.mockResolvedValue({ ok: true });
    const service = loadService();
    const samples: any[] = [];
    service.subscribeSamples((sample: any) => samples.push(sample));

    await service.check();
    expect(samples).toEqual([{ ok: true, ms: expect.any(Number), source: "probe" }]);

    mockFetch.mockRejectedValue(new TypeError("Failed to fetch"));
    service.reportNetworkError();
    expect(samples[1]).toEqual({ ok: false, ms: 0, source: "api" });
  });
});
