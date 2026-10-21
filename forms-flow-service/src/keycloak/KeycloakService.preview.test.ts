// Preview-frame login path: the Appearance live preview runs the app in an
// iframe that must reuse the parent page's session instead of redirecting.

const mockKc: any = {
  init: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  updateToken: jest.fn(),
  loadUserInfo: jest.fn(() => Promise.resolve({ name: "Kane" })),
};
jest.mock("keycloak-js", () => jest.fn(() => mockKc));

let mockPreview = true;
jest.mock("../helpers/brandingService", () => ({
  ...jest.requireActual("../helpers/brandingService"),
  isBrandingPreview: () => mockPreview,
}));

// Node test environment (no jsdom): minimal window, storage and parent frame.
const listeners: ((event: any) => void)[] = [];
const parent = { postMessage: jest.fn() };
const memoryStorage = () => {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => data.set(k, v),
    removeItem: (k: string) => data.delete(k),
    clear: () => data.clear(),
  };
};
Object.assign(global as any, {
  window: {
    location: { origin: "https://app.example" },
    parent,
    addEventListener: (type: string, fn: (e: any) => void) => {
      if (type === "message") listeners.push(fn);
    },
    removeEventListener: (type: string, fn: (e: any) => void) => {
      const i = listeners.indexOf(fn);
      if (i >= 0) listeners.splice(i, 1);
    },
  },
  sessionStorage: memoryStorage(),
  localStorage: memoryStorage(),
});

// The parent answers each auth request with these tokens.
let parentTokens: any = {
  token: "parent-token",
  refreshToken: "r",
  idToken: "i",
};
parent.postMessage.mockImplementation((message: any) => {
  if (message.type !== "ff-branding-preview-auth-request") return;
  const reply = {
    origin: "https://app.example",
    source: parent,
    data: { type: "ff-branding-preview-auth", tokens: parentTokens },
  };
  [...listeners].forEach((fn) => fn(reply));
});

import KeycloakService from "./KeycloakService";

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("KeycloakService in the preview frame", () => {
  const service = KeycloakService.getInstance("https://kc", "realm", "web");

  beforeEach(() => {
    mockPreview = true;
    parentTokens = { token: "parent-token", refreshToken: "r", idToken: "i" };
    Object.values(mockKc).forEach((fn: any) => fn.mockClear?.());
    parent.postMessage.mockClear();
  });

  it("logs in with the parent's tokens instead of redirecting", async () => {
    mockKc.init.mockImplementation(() => {
      mockKc.token = "parent-token";
      mockKc.tokenParsed = { roles: ["admin"], exp: 2, iat: 1 };
      return Promise.resolve(true);
    });
    const callback = jest.fn();
    service.initKeycloak(callback);
    await flush();
    await flush();

    expect(mockKc.init).toHaveBeenCalledWith(
      expect.objectContaining({ token: "parent-token", refreshToken: "r" })
    );
    expect(mockKc.login).not.toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith(true);
    // No refresh loop in the frame: the parent owns the refresh token.
    expect(mockKc.updateToken).not.toHaveBeenCalled();
  });

  it("reports unavailable (and never redirects) when the parent has no session", async () => {
    parentTokens = null;
    service.initKeycloak();
    await flush();
    await flush();

    expect(mockKc.init).not.toHaveBeenCalled();
    expect(mockKc.login).not.toHaveBeenCalled();
    expect(parent.postMessage).toHaveBeenCalledWith(
      { type: "ff-branding-preview-unavailable" },
      "https://app.example"
    );
  });

  it("asks the parent for a fresh token on 401 instead of refreshing", async () => {
    parentTokens = { token: "fresh-token" };
    const token = await KeycloakService.updateToken();

    expect(token).toBe("fresh-token");
    expect(mockKc.updateToken).not.toHaveBeenCalled();
    expect(mockKc.token).toBe("fresh-token");
  });

  it("refreshes normally outside the preview", async () => {
    mockPreview = false;
    mockKc.updateToken.mockResolvedValue(true);
    mockKc.token = "refreshed";
    await KeycloakService.updateToken();
    expect(mockKc.updateToken).toHaveBeenCalledWith(-1);
  });

  it("hands its current tokens to a preview frame", () => {
    mockKc.token = "t";
    mockKc.refreshToken = "r";
    mockKc.idToken = "i";
    expect(KeycloakService.getSessionTokens()).toEqual({
      token: "t",
      refreshToken: "r",
      idToken: "i",
    });
  });
});
