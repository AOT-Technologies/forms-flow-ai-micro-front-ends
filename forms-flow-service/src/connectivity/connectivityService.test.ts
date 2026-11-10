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
    await jest.advanceTimersByTimeAsync(3000); // the second try
    // Only the probes count (the failed call itself does not).
    expect(samples.slice(1).map((sample) => [sample.ok, sample.source])).toEqual([
      [false, "probe"],
      [false, "probe"],
    ]);
  });

  test("a failed API call does not count when the probe works (server reason, not the network)", async () => {
    // E.g. a missing endpoint: the browser hides the refused CORS pre-check
    // and the call looks like "no answer", but the network is fine.
    mockFetch.mockResolvedValue({ ok: true });
    const service = loadService();
    const samples: any[] = [];
    service.subscribeSamples((sample: any) => samples.push(sample));

    service.reportNetworkError();
    await jest.advanceTimersByTimeAsync(0);

    expect(samples).toEqual([{ ok: true, ms: expect.any(Number), source: "probe" }]);
    expect(service.isOnline()).toBe(true);
  });

  test("while offline, checks again every 10 seconds and comes back online", async () => {
    mockFetch.mockRejectedValue(new Error("Network Error"));
    const service = loadService();
    const changes: boolean[] = [];
    service.subscribe((online: boolean) => changes.push(online));
    await checkAndWait(service);
    expect(service.isOnline()).toBe(false);
    const callsWhenOffline = mockFetch.mock.calls.length;

    await jest.advanceTimersByTimeAsync(9999);
    expect(mockFetch.mock.calls).toHaveLength(callsWhenOffline); // not yet

    mockFetch.mockResolvedValue({ ok: true });
    await jest.advanceTimersByTimeAsync(1);
    expect(mockFetch.mock.calls).toHaveLength(callsWhenOffline + 1);
    expect(service.isOnline()).toBe(true);
    expect(changes).toEqual([false, true]);
  });

  // A server that answers after `ms`, and gives up when the probe aborts.
  const answerAfter = (ms: number) =>
    mockFetch.mockImplementation(
      (_url: string, init: any) =>
        new Promise((resolve, reject) => {
          const timer = setTimeout(() => resolve({ ok: true }), ms);
          init?.signal?.addEventListener("abort", () => {
            clearTimeout(timer);
            reject(new DOMException("Aborted", "AbortError"));
          });
        })
    );

  test("a slow 3G answer (2.5 s) still counts as online, with its real time", async () => {
    answerAfter(2500);
    const service = loadService();
    const samples: any[] = [];
    service.subscribeSamples((sample: any) => samples.push(sample));

    const result = service.check();
    await jest.advanceTimersByTimeAsync(2500);

    await expect(result).resolves.toBe(true);
    expect(service.isOnline()).toBe(true);
    expect(samples).toEqual([{ ok: true, ms: 2500, source: "probe" }]);
  });

  test("an answer slower than the wait counts as failed (6 s by default)", async () => {
    answerAfter(7000);
    const service = loadService();
    const samples: any[] = [];
    service.subscribeSamples((sample: any) => samples.push(sample));

    const result = service.check();
    await jest.advanceTimersByTimeAsync(6000); // first try gives up
    expect(samples).toEqual([{ ok: false, ms: 6000, source: "probe" }]);
    // The second try starts at once (3 s have passed already) and gives up
    // too: offline after 12 s, not 6 + 3 + 6 = 15 s.
    expect(mockFetch).toHaveBeenCalledTimes(2);
    await jest.advanceTimersByTimeAsync(5999);
    expect(service.isOnline()).toBe(true); // not yet
    await jest.advanceTimersByTimeAsync(1);

    await expect(result).resolves.toBe(false);
    expect(service.isOnline()).toBe(false);
  });

  test("a quick failure still waits 3 s before the second try", async () => {
    answerAfter(100); // from the second call on
    mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch")); // 1st
    const service = loadService();

    const result = service.check();
    await jest.advanceTimersByTimeAsync(2999);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    await jest.advanceTimersByTimeAsync(100);
    await expect(result).resolves.toBe(true);
  });

  test("the env key sets the wait", async () => {
    setProbeTimeoutEnv("2000");
    try {
      answerAfter(2500);
      const service = loadService();
      const samples: any[] = [];
      service.subscribeSamples((sample: any) => samples.push(sample));

      service.check();
      await jest.advanceTimersByTimeAsync(2000);
      expect(samples).toEqual([{ ok: false, ms: 2000, source: "probe" }]);
    } finally {
      setProbeTimeoutEnv(undefined);
    }
  });
});

describe("getProbeTimeoutMs", () => {
  const load = () => {
    let fn: any;
    jest.isolateModules(() => {
      fn = require("./connectivityService").getProbeTimeoutMs;
    });
    return fn;
  };

  afterEach(() => setProbeTimeoutEnv(undefined));

  test("6000 by default, the env value when it is a positive number", () => {
    const getProbeTimeoutMs = load();
    expect(getProbeTimeoutMs()).toBe(6000);
    setProbeTimeoutEnv("8000");
    expect(getProbeTimeoutMs()).toBe(8000);
    setProbeTimeoutEnv("nonsense");
    expect(getProbeTimeoutMs()).toBe(6000);
    setProbeTimeoutEnv("0");
    expect(getProbeTimeoutMs()).toBe(6000);
  });
});

// Sets (or, with undefined, removes) the probe wait env key.
function setProbeTimeoutEnv(value: string | undefined) {
  const env = (global as any).window._env_;
  const key = "REACT_APP_OFFLINE_NETWORK_PROBE_TIMEOUT_MS";
  if (value === undefined) delete env[key];
  else env[key] = value;
}
