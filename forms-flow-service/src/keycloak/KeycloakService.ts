import Keycloak, {
  KeycloakInitOptions,
  KeycloakTokenParsed,
  KeycloakConfig,
} from "keycloak-js";
import StorageService from "../storage/storageService";
import {
  BRANDING_PREVIEW_AUTH,
  BRANDING_PREVIEW_AUTH_REQUEST,
  BRANDING_PREVIEW_UNAVAILABLE,
  isBrandingPreview,
} from "../helpers/brandingService";

// Only the access token reaches the preview frame; the refresh and ID tokens
// stay with the parent page.
interface PreviewSession {
  token: string;
  userInfo?: unknown;
}

const PREVIEW_AUTH_TIMEOUT_MS = 5000;

const decodeToken = (token: string): KeycloakTokenParsed | null => {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(payload), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
};

class KeycloakService {
  /**
   * Used to create Keycloak object
   */
  private _keycloakConfig: KeycloakConfig | undefined;
  private kc: Keycloak | undefined;
  private static instance: KeycloakService;
  private token: string | undefined;
  private _tokenParsed: KeycloakTokenParsed | undefined;
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private userData: any;

  private constructor(
    url: string,
    realm: string,
    clientId: string,
    tenantId?: string
  ) {
    this._keycloakConfig = {
      url: url,
      realm: realm,
      clientId: tenantId ? `${tenantId}-${clientId}` : clientId,
    };
    this.kc = new Keycloak(this._keycloakConfig);
  }

  /**
   * used to call the `init` method from keycloak
   */
  private keycloakInitConfig: KeycloakInitOptions = {
    onLoad: "check-sso",
    silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
    pkceMethod: "S256",
    checkLoginIframe: false,
  };

  private login(): void {
    this.kc?.login();
  }

  private logout(): void {
    this.kc?.logout();
    StorageService.clear();
  }

  /**
   *
   * @returns Keycloak token validity in milliseconds
   */
  private getTokenExpireTime(): number {
    const exp = this._tokenParsed?.exp;
    const iat = this._tokenParsed?.iat;
    if (exp && iat) {
      const toeknExpiretime =
        new Date(exp * 1000).valueOf() - new Date(iat * 1000).valueOf();
      return toeknExpiretime;
    } else {
      return 60000;
    }
  }

  /** Handed to the Appearance live-preview frame. */
  public static getPreviewSession(): PreviewSession | null {
    const instance = this.instance;
    return instance?.kc?.token
      ? { token: instance.kc.token, userInfo: instance.userData }
      : null;
  }

  private useParentToken(token: string): boolean {
    const tokenParsed = decodeToken(token);
    if (!tokenParsed || !this.kc) return false;
    this.token = token;
    this._tokenParsed = tokenParsed;
    this.kc.token = token;
    this.kc.tokenParsed = tokenParsed;
    this.kc.authenticated = true;
    return true;
  }

  /**
   * In the preview frame: the parent's refresh loop saves each new access token
   * to the session/local storage this frame shares, so adopt it from there.
   */
  private followParentSession(): void {
    window.addEventListener("storage", (event) => {
      if (
        event.key === StorageService.User.AUTH_TOKEN &&
        event.newValue &&
        event.newValue !== this.token
      ) {
        this.useParentToken(event.newValue);
      }
    });
  }

  /** In the preview frame: ask the parent page for its session tokens. */
  private requestParentSession(): Promise<PreviewSession | null> {
    return new Promise((resolve) => {
      const origin = window.location.origin;
      const timer = setTimeout(() => finish(null), PREVIEW_AUTH_TIMEOUT_MS);
      const onMessage = (event: MessageEvent) => {
        if (event.origin !== origin || event.source !== window.parent) return;
        if (event.data?.type === BRANDING_PREVIEW_AUTH) {
          finish(event.data.session ?? null);
        }
      };
      const finish = (session: PreviewSession | null) => {
        clearTimeout(timer);
        window.removeEventListener("message", onMessage);
        resolve(session);
      };
      window.addEventListener("message", onMessage);
      window.parent.postMessage(
        { type: BRANDING_PREVIEW_AUTH_REQUEST },
        origin
      );
    });
  }

  public static async updateToken(): Promise<string | null> {
    const instance = this.instance;
    if (!instance?.kc) return null;

    // Preview frame: never spend the parent's refresh token; take its current one.
    if (isBrandingPreview()) {
      const session = await instance.requestParentSession();
      return session && instance.useParentToken(session.token)
        ? session.token
        : null;
    }

    try {
      const refreshed = await instance.kc.updateToken(-1);

      if (refreshed) {
        instance.token = instance.kc.token!;
        StorageService.save(StorageService.User.AUTH_TOKEN, instance.token);
        return instance.token;
      } else {
        return null;
      }
    } catch (err) {
      throw "error updating token";
    }
  }

  /**
   * Refresh the keycloak token before expiring
   */
  private refreshToken(): void {
    if (!this.kc) return;

    const refreshLoop = async () => {
      try {
        const refreshed = await KeycloakService.updateToken();

        if (!refreshed) {
          console.log("Token is still valid.");
        }

        this.token = this.kc.token;

        // Schedule the next refresh
        this.timerId = setTimeout(refreshLoop, this.getTokenExpireTime());
      } catch (err) {
        console.error("Keycloak token update failed!", err);
        clearTimeout(this.timerId);
        this.logout(); // ensure logout is defined on the instance
      }
    };

    refreshLoop(); // start the refresh loop
  }
  /**
   *
   * @param url - Valid keycloak url
   * @param realm - Valid keycloak realm
   * @param clientId - Valid keycloak clientId
   * @param tenantId - Optional - Valid tenant Id for multitenant environments
   * @returns KeycloakService instance
   */
  public static getInstance(
    url: string,
    realm: string,
    clientId: string,
    tenantId?: string
  ): KeycloakService {
    return this.instance
      ? this.instance
      : (this.instance = new KeycloakService(url, realm, clientId, tenantId));
  }

  /**
   * Initialize the keycloak
   * make sure `silent-check-sso.html` is present in public folder
   * @param callback - Optional - callback function to excecute after succeessful authentication
   */
  public initKeycloak(callback: (authenticated) => void = () => {}): void {
    if (isBrandingPreview()) {
      this.initPreviewSession(callback);
      return;
    }
    this.kc
      ?.init(this.keycloakInitConfig)
      .then((authenticated) => {
        if (authenticated) {
          console.log("Authenticated");
          const tokenParsed = this.kc.tokenParsed;
          if (tokenParsed) {
            // A user who registered directly, without an invite, is authenticated
            // but not yet linked to an organisation, so Keycloak omits the roles
            // claim entirely. That is a valid session, not an auth failure - the
            // host app shows them the "contact your administrator" screen. Default
            // to an empty list so the session is still established for them.
            const UserRoles =
              tokenParsed.roles ||
              tokenParsed.role ||
              tokenParsed.client_roles ||
              [];
            StorageService.save(
              StorageService.User.USER_ROLE,
              JSON.stringify(UserRoles)
            );
            this.token = this.kc.token;
            this._tokenParsed = this.kc.tokenParsed;
            StorageService.save(StorageService.User.AUTH_TOKEN, this.token!);
            this.kc.loadUserInfo().then((data) => {
              this.userData = data;
              StorageService.save(
                StorageService.User.USER_DETAILS,
                JSON.stringify(data)
              );
              callback(true);
            });
            this.refreshToken();
          } else {
            this.logout();
          }
        } else {
          console.warn("not authenticated!");
          this.login();
        }
      })
      .catch((err) =>
        console.error("Failed to initialize KeycloakService", err)
      );
  }

  /**
   * The live-preview frame borrows the parent's access token: no redirect, no
   * refresh loop. kc.init is skipped because keycloak-js only accepts a
   * session that includes a refresh token.
   */
  private async initPreviewSession(
    callback: (authenticated) => void
  ): Promise<void> {
    const session = await this.requestParentSession();
    if (!session || !this.useParentToken(session.token)) {
      window.parent.postMessage(
        { type: BRANDING_PREVIEW_UNAVAILABLE },
        window.location.origin
      );
      return;
    }
    const tokenParsed = this._tokenParsed!;
    StorageService.save(
      StorageService.User.USER_ROLE,
      JSON.stringify(
        tokenParsed.roles || tokenParsed.role || tokenParsed.client_roles || []
      )
    );
    StorageService.save(StorageService.User.AUTH_TOKEN, session.token);
    this.userData = session.userInfo;
    StorageService.save(
      StorageService.User.USER_DETAILS,
      JSON.stringify(session.userInfo ?? {})
    );
    this.followParentSession();
    callback(true);
  }
  /**
   * logs the user out and clear all user data from session.
   */
  public userLogout(): void {
    StorageService.clear();
    this.logout();
  }
  /**
   *
   * @returns the user token
   */
  public getToken(): string {
    return this.token!;
  }
  /**
   *
   * @returns the user details
   */
  public getUserData(): any {
    return this.userData;
  }

  public isAuthenticated(): boolean {
    return !!this.token;
  }
}

export default KeycloakService;
