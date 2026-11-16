// initKeycloak failure reporting (FFF-3 offline, Phase 1): the optional
// onError argument is called when sign-in cannot complete; callers that omit
// it keep the previous behaviour (nothing is called).

const mockKc = {
  init: jest.fn(),
  loadUserInfo: jest.fn(),
  updateToken: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  token: "access-token",
  tokenParsed: { roles: ["formsflow-client"], exp: 2, iat: 1 },
};

jest.mock("keycloak-js", () => jest.fn().mockImplementation(() => mockKc));

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

(global as any).window = { location: { origin: "http://localhost:3000" } };
(global as any).sessionStorage = memoryStorage();
(global as any).localStorage = memoryStorage();

import KeycloakService from "./KeycloakService";

// Settles the init / loadUserInfo promise chain without real timers.
const flush = async () => {
  for (let i = 0; i < 10; i += 1) await Promise.resolve();
};

const freshInstance = () => {
  (KeycloakService as any).instance = undefined;
  return KeycloakService.getInstance("http://kc", "realm", "client");
};

describe("KeycloakService.initKeycloak failure reporting", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
    // The refresh loop schedules timers; keep them fake so nothing leaks.
    jest.useFakeTimers();
    mockKc.updateToken.mockResolvedValue(false);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test("calls onError when Keycloak init fails (e.g. sign-in server unreachable)", async () => {
    const error = new Error(
      "Timeout when waiting for 3rd party check iframe message."
    );
    mockKc.init.mockRejectedValue(error);
    const callback = jest.fn();
    const onError = jest.fn();

    freshInstance().initKeycloak(callback, onError);
    await flush();

    expect(onError).toHaveBeenCalledWith(error);
    expect(callback).not.toHaveBeenCalled();
  });

  test("calls onError when loading the user info fails", async () => {
    const error = new Error("network");
    mockKc.init.mockResolvedValue(true);
    mockKc.loadUserInfo.mockRejectedValue(error);
    const callback = jest.fn();
    const onError = jest.fn();

    freshInstance().initKeycloak(callback, onError);
    await flush();

    expect(onError).toHaveBeenCalledWith(error);
    expect(callback).not.toHaveBeenCalled();
  });

  test("without onError, a failed init still only logs (previous behaviour)", async () => {
    mockKc.init.mockRejectedValue(new Error("offline"));
    const callback = jest.fn();

    expect(() => freshInstance().initKeycloak(callback)).not.toThrow();
    await flush();

    expect(callback).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      "Failed to initialize KeycloakService",
      expect.any(Error)
    );
  });

  test("success path is unchanged: callback(true), onError not called", async () => {
    mockKc.init.mockResolvedValue(true);
    mockKc.loadUserInfo.mockResolvedValue({ name: "Field User" });
    const callback = jest.fn();
    const onError = jest.fn();

    const instance = freshInstance();
    instance.initKeycloak(callback, onError);
    await flush();

    expect(callback).toHaveBeenCalledWith(true);
    expect(onError).not.toHaveBeenCalled();
    expect(instance.getUserData()).toEqual({ name: "Field User" });
  });
});
