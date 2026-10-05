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

    await expect(service.check()).resolves.toBe(false);
    expect(service.isOnline()).toBe(false);
  });

  test("is offline when the API answers with an error status", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 503 });
    const service = loadService();

    await expect(service.check()).resolves.toBe(false);
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
    await service.check(); // online -> offline
    await service.check(); // still offline: no new call
    mockFetch.mockResolvedValue({ ok: true });
    await service.check(); // offline -> online

    expect(listener.mock.calls).toEqual([[false], [true]]);

    unsubscribe();
    mockFetch.mockRejectedValue(new TypeError("offline"));
    await service.check();
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
});
