// The saved "pass" for offline start-up (FFF-3 offline, Phase 2).

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

(global as any).window = { _env_: {} };
(global as any).localStorage = memoryStorage();

import {
  clearOfflineSession,
  dropTokensFromSavedPass,
  getOfflineMaxHours,
  isOfflineEnabled,
  isUsableOfflineSession,
  loadOfflineSession,
  saveOfflineSession,
  OfflineSession,
} from "./offlineSession";

const HOUR = 60 * 60 * 1000;
const NOW = Date.UTC(2026, 9, 6, 12);

const session = (overrides: Partial<OfflineSession> = {}): OfflineSession => ({
  clientId: "forms-flow-web",
  sub: "user-1",
  token: "access-token",
  roles: ["create_submissions"],
  userDetails: { name: "Field User" },
  lastOnlineAuthAt: NOW - HOUR,
  ...overrides,
});

describe("offlineSession", () => {
  beforeEach(() => {
    (global as any).window._env_ = {};
    (global as any).localStorage.clear();
  });

  test("offline is off unless REACT_APP_OFFLINE_ENABLED is true", () => {
    expect(isOfflineEnabled()).toBe(false);
    (global as any).window._env_.REACT_APP_OFFLINE_ENABLED = "true";
    expect(isOfflineEnabled()).toBe(true);
  });

  test("the offline time limit defaults to 24 hours and can be configured", () => {
    expect(getOfflineMaxHours()).toBe(24);
    (global as any).window._env_.REACT_APP_OFFLINE_MAX_HOURS = "8";
    expect(getOfflineMaxHours()).toBe(8);
    (global as any).window._env_.REACT_APP_OFFLINE_MAX_HOURS = "nonsense";
    expect(getOfflineMaxHours()).toBe(24);
  });

  test("saves, loads and clears the pass", () => {
    expect(loadOfflineSession()).toBeNull();
    saveOfflineSession(session());
    expect(loadOfflineSession()).toEqual(session());
    clearOfflineSession();
    expect(loadOfflineSession()).toBeNull();
  });

  test("a pass saved by an older version loses its refresh and ID token", () => {
    (global as any).localStorage.setItem(
      "ff_offline_session",
      JSON.stringify({ ...session(), refreshToken: "refresh-token", idToken: "id-token" })
    );
    // Reading never hands them out...
    expect(loadOfflineSession()).toEqual(session());
    // ...and at app start they are removed from storage.
    dropTokensFromSavedPass();
    const stored = JSON.parse((global as any).localStorage.getItem("ff_offline_session"));
    expect(stored).not.toHaveProperty("refreshToken");
    expect(stored).not.toHaveProperty("idToken");
  });

  test("a pass younger than the limit, for the same client, can start the app", () => {
    expect(isUsableOfflineSession(session(), "forms-flow-web", NOW, 24)).toBe(
      true
    );
  });

  test("a pass older than the limit cannot start the app", () => {
    const old = session({ lastOnlineAuthAt: NOW - 25 * HOUR });
    expect(isUsableOfflineSession(old, "forms-flow-web", NOW, 24)).toBe(false);
  });

  test("a pass with a sign-in time in the future cannot start the app", () => {
    // The device clock was set back after the sign-in.
    const future = session({ lastOnlineAuthAt: NOW + 60 * 1000 });
    expect(isUsableOfflineSession(future, "forms-flow-web", NOW, 24)).toBe(false);
    const broken = session({ lastOnlineAuthAt: Number.NaN });
    expect(isUsableOfflineSession(broken, "forms-flow-web", NOW, 24)).toBe(false);
  });

  test("a pass from another tenant's client cannot start the app", () => {
    expect(
      isUsableOfflineSession(session(), "tenantB-forms-flow-web", NOW, 24)
    ).toBe(false);
  });

  test("no pass, or a pass without a token, cannot start the app", () => {
    expect(isUsableOfflineSession(null, "forms-flow-web", NOW, 24)).toBe(false);
    expect(
      isUsableOfflineSession(session({ token: "" }), "forms-flow-web", NOW, 24)
    ).toBe(false);
  });
});
