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

// A JWT-shaped access token; only the payload is read.
const jwt = (claims: object) =>
  `h.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.s`;
const PARENT_TOKEN = jwt({ roles: ["admin"], name: "Kåne", exp: 2, iat: 1 });

// The parent answers each auth request with this session.
let parentSession: any = null;
parent.postMessage.mockImplementation((message: any) => {
  if (message.type !== "ff-branding-preview-auth-request") return;
  const reply = {
    origin: "https://app.example",
    source: parent,
    data: { type: "ff-branding-preview-auth", session: parentSession },
  };
  [...listeners].forEach((fn) => fn(reply));
});

import KeycloakService from "./KeycloakService";
import StorageService from "../storage/storageService";

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("KeycloakService in the preview frame", () => {
  const service = KeycloakService.getInstance("https://kc", "realm", "web");

  beforeEach(() => {
    mockPreview = true;
    parentSession = { token: PARENT_TOKEN, userInfo: { name: "Kåne" } };
    Object.values(mockKc).forEach((fn: any) => fn.mockClear?.());
    parent.postMessage.mockClear();
  });

  it("borrows the parent's access token without kc.init or a redirect", async () => {
    const callback = jest.fn();
    service.initKeycloak(callback);
    await flush();

    expect(mockKc.init).not.toHaveBeenCalled();
    expect(mockKc.login).not.toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith(true);
    expect(service.getToken()).toBe(PARENT_TOKEN);
    expect(mockKc.tokenParsed).toMatchObject({ roles: ["admin"], name: "Kåne" });
    expect(service.getUserData()).toEqual({ name: "Kåne" });
    expect(StorageService.get(StorageService.User.USER_ROLE)).toBe('["admin"]');
    // No refresh loop in the frame: the parent owns the refresh token.
    expect(mockKc.updateToken).not.toHaveBeenCalled();
  });

  it("reports unavailable (and never redirects) when the parent has no session", async () => {
    parentSession = null;
    service.initKeycloak();
    await flush();

    expect(mockKc.init).not.toHaveBeenCalled();
    expect(mockKc.login).not.toHaveBeenCalled();
    expect(parent.postMessage).toHaveBeenCalledWith(
      { type: "ff-branding-preview-unavailable" },
      "https://app.example"
    );
  });

  it("reports unavailable for a token it can't read", async () => {
    parentSession = { token: "not-a-jwt" };
    service.initKeycloak();
    await flush();

    expect(parent.postMessage).toHaveBeenCalledWith(
      { type: "ff-branding-preview-unavailable" },
      "https://app.example"
    );
  });

  it("asks the parent for a fresh token on 401 instead of refreshing", async () => {
    const fresh = jwt({ roles: [], exp: 3, iat: 2 });
    parentSession = { token: fresh };
    const token = await KeycloakService.updateToken();

    expect(token).toBe(fresh);
    expect(mockKc.updateToken).not.toHaveBeenCalled();
    expect(mockKc.token).toBe(fresh);
  });

  it("refreshes normally outside the preview", async () => {
    mockPreview = false;
    mockKc.updateToken.mockResolvedValue(true);
    mockKc.token = "refreshed";
    await KeycloakService.updateToken();
    expect(mockKc.updateToken).toHaveBeenCalledWith(-1);
  });

  it("hands a preview frame only the access token and user info", () => {
    mockKc.token = "t";
    mockKc.refreshToken = "r";
    mockKc.idToken = "i";
    const session = KeycloakService.getPreviewSession();
    expect(session).toEqual({ token: "t", userInfo: { name: "Kåne" } });
    expect(JSON.stringify(session)).not.toMatch(/"r"|"i"/);
  });
});
