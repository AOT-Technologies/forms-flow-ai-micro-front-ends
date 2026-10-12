// The organization's offline switches (FFF-3 offline, Phase 4 part 2).

const memoryStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

(global as any).window = {
  _env_: { REACT_APP_OFFLINE_ENABLED: "true", REACT_APP_WEB_BASE_URL: "http://api" },
};
(global as any).localStorage = memoryStorage();
(global as any).sessionStorage = memoryStorage();

import OfflineSettingsService from "./offlineSettings";

const answer = (offline: { enabled: boolean; autoSync: boolean }) =>
  Promise.resolve({ ok: true, json: () => Promise.resolve({ offline }) });

describe("OfflineSettingsService", () => {
  beforeEach(() => {
    (global as any).localStorage.clear();
    (global as any).window._env_.REACT_APP_OFFLINE_ENABLED = "true";
    (global as any).fetch = jest.fn();
  });

  test("never read: counts as off", () => {
    expect(OfflineSettingsService.get()).toBeNull();
    expect(OfflineSettingsService.isOfflineAllowed()).toBe(false);
    expect(OfflineSettingsService.isAutoSyncAllowed()).toBe(false);
  });

  test("reads the switches with the user's token and keeps them", async () => {
    (global as any).fetch.mockReturnValue(answer({ enabled: true, autoSync: true }));

    await OfflineSettingsService.refresh("user-token");

    expect((global as any).fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/organization-settings$/),
      expect.objectContaining({ headers: { Authorization: "Bearer user-token" } })
    );
    expect(OfflineSettingsService.isOfflineAllowed()).toBe(true);
    expect(OfflineSettingsService.isAutoSyncAllowed()).toBe(true);
  });

  test("a network error keeps the last switches", async () => {
    (global as any).fetch.mockReturnValue(answer({ enabled: true, autoSync: false }));
    await OfflineSettingsService.refresh("t");
    (global as any).fetch.mockRejectedValue(new TypeError("Failed to fetch"));

    await OfflineSettingsService.refresh("t");

    expect(OfflineSettingsService.isOfflineAllowed()).toBe(true);
  });

  test("the env key off wins over a kept switch", async () => {
    (global as any).fetch.mockReturnValue(answer({ enabled: true, autoSync: true }));
    await OfflineSettingsService.refresh("t");
    (global as any).window._env_.REACT_APP_OFFLINE_ENABLED = "false";

    expect(OfflineSettingsService.isOfflineAllowed()).toBe(false);
    expect(await OfflineSettingsService.refresh("t")).toBeNull();
  });

  test("tells listeners when a switch changes, not when it stays the same", async () => {
    const listener = jest.fn();
    const unsubscribe = OfflineSettingsService.subscribe(listener);
    (global as any).fetch.mockReturnValue(answer({ enabled: true, autoSync: false }));

    await OfflineSettingsService.refresh("t");
    await OfflineSettingsService.refresh("t");

    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});
