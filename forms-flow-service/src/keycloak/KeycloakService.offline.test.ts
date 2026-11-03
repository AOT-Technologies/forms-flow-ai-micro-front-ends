// Offline start-up and reconnect in KeycloakService (FFF-3 offline, Phase 2).

const mockKc: any = {
  init: jest.fn(),
  loadUserInfo: jest.fn(),
  updateToken: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  token: "online-token",
  refreshToken: "online-refresh",
  idToken: "online-id",
  tokenParsed: { sub: "user-1", roles: ["create_submissions"], exp: 2, iat: 1 },
};

jest.mock("keycloak-js", () => jest.fn().mockImplementation(() => mockKc));

let connectivityListener: ((online: boolean) => void) | null = null;
const mockConnectivity = {
  check: jest.fn(),
  subscribe: jest.fn((listener: (online: boolean) => void) => {
    connectivityListener = listener;
    return () => {
      connectivityListener = null;
    };
  }),
};
// Imports are hoisted above this file's consts, so read the mock lazily.
jest.mock("../connectivity/connectivityService", () => ({
  __esModule: true,
  default: {
    check: (...args: any[]) => mockConnectivity.check(...args),
    subscribe: (...args: any[]) => mockConnectivity.subscribe(...args),
  },
}));

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
  location: { origin: "http://localhost:3000" },
  _env_: {
    REACT_APP_OFFLINE_ENABLED: "true",
    REACT_APP_OFFLINE_MAX_HOURS: "24",
  },
};
(global as any).sessionStorage = memoryStorage();
(global as any).localStorage = memoryStorage();

// The organization's offline switches (Phase 4 part 2), as the server answers.
let mockOrgOffline = true;
(global as any).fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({ offline: { enabled: mockOrgOffline, autoSync: false } }),
  })
);
const keepOrgSwitch = (on: boolean) =>
  (global as any).localStorage.setItem(
    "ff_offline_settings",
    JSON.stringify({ offlineEnabled: on, autoSyncEnabled: false, fetchedAt: 1 })
  );

import KeycloakService from "./KeycloakService";
import {
  loadOfflineSession,
  saveOfflineSession,
} from "../offline/offlineSession";

const HOUR = 60 * 60 * 1000;

const flush = async () => {
  for (let i = 0; i < 20; i += 1) await Promise.resolve();
};

const freshInstance = () => {
  (KeycloakService as any).instance = undefined;
  return KeycloakService.getInstance("http://kc", "realm", "forms-flow-web");
};

// Signed in online (keycloak-js initialised): logout goes through Keycloak.
const onlineInstance = () => {
  const service = freshInstance();
  (service as any).kcInitialized = true;
  return service;
};

const savePass = (overrides = {}) =>
  saveOfflineSession({
    clientId: "forms-flow-web",
    sub: "user-1",
    token: "saved-token",
    roles: ["create_submissions"],
    userDetails: { name: "Field User" },
    lastOnlineAuthAt: Date.now() - HOUR,
    ...overrides,
  });

describe("KeycloakService offline start-up", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.useFakeTimers();
    (global as any).window._env_.REACT_APP_OFFLINE_ENABLED = "true";
    (global as any).localStorage.clear();
    (global as any).sessionStorage.clear();
    mockOrgOffline = true;
    keepOrgSwitch(true);
    connectivityListener = null;
    mockKc.token = "online-token";
    mockKc.updateToken.mockResolvedValue(false);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test("online: signs in as before and saves the pass for later", async () => {
    mockConnectivity.check.mockResolvedValue(true);
    mockKc.init.mockResolvedValue(true);
    mockKc.loadUserInfo.mockResolvedValue({ name: "Field User" });
    const callback = jest.fn();

    freshInstance().initKeycloak(callback);
    await flush();

    expect(mockKc.init).toHaveBeenCalledWith(
      expect.objectContaining({ onLoad: "check-sso" })
    );
    expect(callback).toHaveBeenCalledWith(true);
    expect(loadOfflineSession()).toEqual(
      expect.objectContaining({
        clientId: "forms-flow-web",
        sub: "user-1",
        token: "online-token",
        userDetails: { name: "Field User" },
      })
    );
    // No refresh or ID token in localStorage (decided 3 Nov 2026).
    expect(loadOfflineSession()).not.toHaveProperty("refreshToken");
    expect(loadOfflineSession()).not.toHaveProperty("idToken");
  });

  test("offline with a recent pass: opens without calling Keycloak", async () => {
    mockConnectivity.check.mockResolvedValue(false);
    savePass();
    const callback = jest.fn();
    const onError = jest.fn();

    const instance = freshInstance();
    instance.initKeycloak(callback, onError);
    await flush();

    expect(mockKc.init).not.toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith(true);
    expect(onError).not.toHaveBeenCalled();
    expect(instance.isAuthenticated()).toBe(true);
    expect(instance.getToken()).toBe("saved-token");
    expect(instance.getUserData()).toEqual({ name: "Field User" });
    expect(instance.getConnectionState()).toBe("offline");
    expect((global as any).localStorage.getItem("AUTH_TOKEN")).toBe(
      "saved-token"
    );
  });

  test("offline with a pass older than the limit: reports an error instead", async () => {
    mockConnectivity.check.mockResolvedValue(false);
    savePass({ lastOnlineAuthAt: Date.now() - 25 * HOUR });
    const callback = jest.fn();
    const onError = jest.fn();

    freshInstance().initKeycloak(callback, onError);
    await flush();

    expect(callback).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();
  });

  test("offline with a pass from another tenant: reports an error instead", async () => {
    mockConnectivity.check.mockResolvedValue(false);
    savePass({ clientId: "tenantB-forms-flow-web" });
    const onError = jest.fn();

    freshInstance().initKeycloak(jest.fn(), onError);
    await flush();

    expect(onError).toHaveBeenCalled();
  });

  test("back online after an offline start: asks to sign in again, keeps everything", async () => {
    // The pass has no refresh token, so the login cannot be renewed silently.
    mockConnectivity.check.mockResolvedValue(false);
    savePass();
    const instance = freshInstance();
    const states: string[] = [];
    instance.subscribeConnectionState((state) => states.push(state));
    instance.initKeycloak(jest.fn());
    await flush();

    connectivityListener?.(true);
    await flush();

    expect(mockKc.init).not.toHaveBeenCalled();
    expect(instance.getConnectionState()).toBe("sign-in-needed");
    expect(states).toEqual(["offline", "sign-in-needed"]);
    expect(mockKc.logout).not.toHaveBeenCalled();
    expect(loadOfflineSession()?.token).toBe("saved-token");

    // keycloak-js was never initialised: Sign in starts the app again.
    (global as any).window.location.reload = jest.fn();
    instance.signInAgain();
    expect((global as any).window.location.reload).toHaveBeenCalled();
    expect(mockKc.login).not.toHaveBeenCalled();
  });

  test("started online, back online after the login expired: asks to sign in again", async () => {
    mockConnectivity.check.mockResolvedValue(true);
    mockKc.init.mockResolvedValue(true);
    mockKc.loadUserInfo.mockResolvedValue({ name: "Field User" });
    const instance = freshInstance();
    instance.initKeycloak(jest.fn());
    await flush();

    mockKc.updateToken.mockRejectedValue(new TypeError("Failed to fetch"));
    mockConnectivity.check.mockResolvedValue(false);
    jest.runOnlyPendingTimers(); // the refresh fails: offline
    await flush();
    expect(instance.getConnectionState()).toBe("offline");

    mockKc.updateToken.mockRejectedValue(new Error("refresh token expired"));
    mockConnectivity.check.mockResolvedValue(true);
    connectivityListener?.(true);
    await flush();

    expect(instance.getConnectionState()).toBe("sign-in-needed");
    expect(mockKc.logout).not.toHaveBeenCalled();
    instance.signInAgain();
    expect(mockKc.login).toHaveBeenCalled();
  });

  test("losing the connection while signed in: no logout, waits to reconnect", async () => {
    mockConnectivity.check.mockResolvedValue(true);
    mockKc.init.mockResolvedValue(true);
    mockKc.loadUserInfo.mockResolvedValue({ name: "Field User" });
    const instance = freshInstance();
    instance.initKeycloak(jest.fn());
    await flush();

    mockKc.updateToken.mockRejectedValue(new TypeError("Failed to fetch"));
    mockConnectivity.check.mockResolvedValue(false);
    jest.runOnlyPendingTimers(); // next scheduled refresh
    await flush();

    expect(mockKc.logout).not.toHaveBeenCalled();
    expect(instance.getConnectionState()).toBe("offline");
    expect(connectivityListener).not.toBeNull();
  });

  test("connection drops while the app is open: goes offline at once, back online after", async () => {
    mockConnectivity.check.mockResolvedValue(true);
    mockKc.init.mockResolvedValue(true);
    mockKc.loadUserInfo.mockResolvedValue({ name: "Field User" });
    const instance = freshInstance();
    const states: string[] = [];
    instance.subscribeConnectionState((state) => states.push(state));
    instance.initKeycloak(jest.fn());
    await flush();

    // The browser reports the connection is gone — no token refresh needed.
    connectivityListener?.(false);
    expect(instance.getConnectionState()).toBe("offline");
    expect(mockKc.logout).not.toHaveBeenCalled();

    mockKc.updateToken.mockResolvedValue(true);
    connectivityListener?.(true);
    await flush();

    expect(instance.getConnectionState()).toBe("online");
    expect(states).toEqual(["offline", "online"]);
    // Still watching: a second drop is noticed too.
    connectivityListener?.(false);
    expect(instance.getConnectionState()).toBe("offline");
  });

  test("first sign-in, switches not read yet: reads them, then keeps the pass", async () => {
    (global as any).localStorage.clear();
    mockConnectivity.check.mockResolvedValue(true);
    mockKc.init.mockResolvedValue(true);
    mockKc.loadUserInfo.mockResolvedValue({ name: "Field User" });

    freshInstance().initKeycloak(jest.fn());
    await flush();

    expect((global as any).fetch).toHaveBeenCalledWith(
      expect.stringContaining("/organization-settings"),
      expect.objectContaining({
        headers: { Authorization: "Bearer online-token" },
      })
    );
    expect(loadOfflineSession()?.token).toBe("online-token");
  });

  test("organization turned offline forms off: the pass is removed", async () => {
    savePass();
    mockOrgOffline = false;
    mockConnectivity.check.mockResolvedValue(true);
    mockKc.init.mockResolvedValue(true);
    mockKc.loadUserInfo.mockResolvedValue({ name: "Field User" });

    freshInstance().initKeycloak(jest.fn());
    await flush();

    expect(loadOfflineSession()).toBeNull();
    expect(connectivityListener).toBeNull();
  });

  test("offline start while the organization's switch is off: reports an error", async () => {
    keepOrgSwitch(false);
    savePass();
    mockConnectivity.check.mockResolvedValue(false);
    const callback = jest.fn();
    const onError = jest.fn();

    freshInstance().initKeycloak(callback, onError);
    await flush();

    expect(callback).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();
  });

  test("offline disabled: ignores the pass and signs in as before", async () => {
    (global as any).window._env_.REACT_APP_OFFLINE_ENABLED = "false";
    savePass();
    mockKc.init.mockRejectedValue(new Error("offline"));
    const callback = jest.fn();
    const onError = jest.fn();

    freshInstance().initKeycloak(callback, onError);
    await flush();

    expect(mockConnectivity.check).not.toHaveBeenCalled();
    expect(mockKc.init).toHaveBeenCalledWith(
      expect.objectContaining({ onLoad: "check-sso" })
    );
    expect(callback).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalled();
  });
});

describe("KeycloakService logout guards (FFF-3, Phase 5)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).localStorage.clear();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("no guard: logs out and clears storage", async () => {
    (global as any).localStorage.setItem("AUTH_TOKEN", "x");
    onlineInstance().userLogout();
    await flush();

    expect(mockKc.logout).toHaveBeenCalled();
    expect((global as any).localStorage.getItem("AUTH_TOKEN")).toBeNull();
  });

  test("a guard that says no cancels the logout and keeps everything", async () => {
    (global as any).localStorage.setItem("AUTH_TOKEN", "x");
    const remove = KeycloakService.registerLogoutGuard(() => Promise.resolve(false));

    onlineInstance().userLogout();
    await flush();

    expect(mockKc.logout).not.toHaveBeenCalled();
    expect((global as any).localStorage.getItem("AUTH_TOKEN")).toBe("x");
    remove();
  });

  test("guards run before storage is cleared; a failing guard does not block", async () => {
    const seen: (string | null)[] = [];
    const removeA = KeycloakService.registerLogoutGuard(() => {
      seen.push((global as any).localStorage.getItem("AUTH_TOKEN"));
      return true;
    });
    const removeB = KeycloakService.registerLogoutGuard(() => {
      throw new Error("boom");
    });
    (global as any).localStorage.setItem("AUTH_TOKEN", "x");

    onlineInstance().userLogout();
    await flush();

    expect(seen).toEqual(["x"]);
    expect(mockKc.logout).toHaveBeenCalled();
    removeA();
    removeB();
  });

  test("started offline: logout clears the session and restarts the app (keycloak-js was never initialised)", async () => {
    keepOrgSwitch(true);
    savePass();
    mockConnectivity.check.mockResolvedValue(false);
    (global as any).window.location.assign = jest.fn();
    const service = freshInstance();
    service.initKeycloak(jest.fn(), jest.fn());
    await flush();

    service.userLogout();
    await flush();

    expect(mockKc.logout).not.toHaveBeenCalled();
    expect((global as any).window.location.assign).toHaveBeenCalledWith("http://localhost:3000/");
    expect((global as any).localStorage.getItem("ff_offline_session")).toBeNull();
  });

  test("the before-logout step runs only when the logout goes ahead", async () => {
    const beforeLogout = jest.fn();
    const remove = KeycloakService.registerLogoutGuard(() => false);
    onlineInstance().userLogout(beforeLogout);
    await flush();
    expect(beforeLogout).not.toHaveBeenCalled();
    remove();

    onlineInstance().userLogout(beforeLogout);
    await flush();
    expect(beforeLogout).toHaveBeenCalledTimes(1);
    expect(mockKc.logout).toHaveBeenCalled();
  });
});

describe("KeycloakService sign-in retry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
    (global as any).window._env_.REACT_APP_OFFLINE_ENABLED = "false";
  });

  afterEach(() => {
    (global as any).window._env_.REACT_APP_OFFLINE_ENABLED = "true";
    jest.restoreAllMocks();
  });

  test("a failed init gets a fresh Keycloak object, so 'Try again' can init again", async () => {
    // keycloak-js allows init() once per object, even after a failure.
    const Keycloak = require("keycloak-js");
    mockKc.init.mockRejectedValue(new Error("Timeout when waiting for 3rd party check iframe message."));
    const service = freshInstance();
    const created = Keycloak.mock.calls.length;

    service.initKeycloak(jest.fn(), jest.fn());
    await flush();

    expect(Keycloak.mock.calls.length).toBe(created + 1);
  });

  test("a successful init keeps its Keycloak object", async () => {
    const Keycloak = require("keycloak-js");
    mockKc.init.mockResolvedValue(false); // not signed in: goes to login
    const service = freshInstance();
    const created = Keycloak.mock.calls.length;

    service.initKeycloak(jest.fn(), jest.fn());
    await flush();

    expect(Keycloak.mock.calls.length).toBe(created);
  });
});
