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

const savePass = (overrides = {}) =>
  saveOfflineSession({
    clientId: "forms-flow-web",
    sub: "user-1",
    token: "saved-token",
    refreshToken: "saved-refresh",
    idToken: "saved-id",
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
        refreshToken: "online-refresh",
        userDetails: { name: "Field User" },
      })
    );
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

  test("back online: renews the login with the saved tokens and goes online", async () => {
    mockConnectivity.check.mockResolvedValue(false);
    savePass();
    const instance = freshInstance();
    const states: string[] = [];
    instance.subscribeConnectionState((state) => states.push(state));
    instance.initKeycloak(jest.fn());
    await flush();

    mockKc.init.mockResolvedValue(true);
    mockKc.token = "renewed-token";
    connectivityListener?.(true);
    await flush();

    expect(mockKc.init).toHaveBeenCalledWith(
      expect.objectContaining({
        token: "saved-token",
        refreshToken: "saved-refresh",
        checkLoginIframe: false,
      })
    );
    expect(mockKc.init.mock.calls[0][0].onLoad).toBeUndefined();
    expect(instance.getToken()).toBe("renewed-token");
    expect(instance.getConnectionState()).toBe("online");
    expect(states).toEqual(["offline", "online"]);
    expect(loadOfflineSession()?.token).toBe("renewed-token");
  });

  test("back online but the login expired: asks to sign in again, logs nobody out", async () => {
    mockConnectivity.check.mockResolvedValue(false);
    savePass();
    const instance = freshInstance();
    instance.initKeycloak(jest.fn());
    await flush();

    mockKc.init.mockRejectedValue(new Error("refresh token expired"));
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
