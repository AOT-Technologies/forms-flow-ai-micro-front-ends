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

/**
 * Removes every "/" at the end of `text` ("http://kc//" -> "http://kc").
 * A plain loop instead of the regex /\/+$/, which can backtrack a lot on
 * long runs of "/" (SonarCloud S8786).
 */
export const trimTrailingSlashes = (text: string): string => {
  let end = text.length;
  while (end > 0 && text[end - 1] === "/") end -= 1;
  return text.slice(0, end);
};

const decodeToken = (token: string): KeycloakTokenParsed | null => {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(payload), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
};
import ConnectivityService from "../connectivity/connectivityService";
import {
  clearOfflineSession,
  dropTokensFromSavedPass,
  isOfflineEnabled,
  isUsableOfflineSession,
  loadOfflineSession,
  saveOfflineSession,
} from "../offline/offlineSession";
import OfflineSettingsService from "../offline/offlineSettings";

/** online · offline (started or kept from the saved pass) · sign-in-needed */
export type ConnectionState = "online" | "offline" | "sign-in-needed";

/**
 * Runs before a user-started logout (FFF-3, Phase 5). Resolve false to cancel
 * the logout (e.g. the user chose to sync waiting forms first). A guard that
 * throws does not block the logout.
 */
export type LogoutGuard = () => boolean | Promise<boolean>;

class KeycloakService {
  /**
   * Used to create Keycloak object
   */
  private _keycloakConfig: KeycloakConfig | undefined;
  private kc: Keycloak | undefined;
  private static instance: KeycloakService;
  private static logoutGuards = new Set<LogoutGuard>();
  private token: string | undefined;
  private _tokenParsed: KeycloakTokenParsed | undefined;
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private userData: any;
  // Offline support (FFF-3). Only used when REACT_APP_OFFLINE_ENABLED is on.
  private kcInitialized = false;
  private reconnecting = false;
  private connectionState: ConnectionState = "online";
  private connectionListeners = new Set<(state: ConnectionState) => void>();
  private stopWatchingConnectivity: (() => void) | null = null;

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
    if (!this.kcInitialized) {
      // Started offline (FFF-3): keycloak-js can only log out after init(),
      // so clear the session here. The Keycloak sign-in (its session cookie)
      // must end too, or the next online start signs the same user in again:
      // online, go to Keycloak's logout now; offline, leave a note so the
      // next online start does it before any sign-in.
      // Leave at once: no page keeps running on a session already cleared
      // (a connection check first could take seconds). The note makes the
      // next online start end the Keycloak sign-in before anything else,
      // whether or not we are online now.
      StorageService.clear();
      this.token = undefined;
      KeycloakService.markServerLogoutDue();
      window.location.assign(`${window.location.origin}/`);
      return;
    }
    this.kc?.logout();
    StorageService.clear();
  }

  /** The note "end the Keycloak sign-in too" (written after the clean-up). */
  private static readonly SERVER_LOGOUT_DUE = "ff_offline_logout_due";

  private static markServerLogoutDue(): void {
    try {
      localStorage.setItem(KeycloakService.SERVER_LOGOUT_DUE, "1");
    } catch {
      // No storage: the Keycloak session ends by its own idle limit.
    }
  }

  /** True once when a logout while offline still has to end the Keycloak sign-in. */
  private static takeServerLogoutDue(): boolean {
    try {
      const due =
        localStorage.getItem(KeycloakService.SERVER_LOGOUT_DUE) === "1";
      if (due) localStorage.removeItem(KeycloakService.SERVER_LOGOUT_DUE);
      return due;
    } catch {
      return false;
    }
  }

  /**
   * Keycloak's logout address (end-session endpoint), built from the config:
   * keycloak-js knows its addresses only after init(), which an offline start
   * never ran. Without an ID token Keycloak may ask "Do you want to log out?".
   */
  private endSessionUrl(): string {
    const {
      url = "",
      realm = "",
      clientId = "",
    } = (this._keycloakConfig ?? {}) as {
      url?: string;
      realm?: string;
      clientId?: string;
    };
    const base = `${trimTrailingSlashes(
      String(url)
    )}/realms/${encodeURIComponent(realm)}`;
    const back = `${window.location.origin}/`;
    return (
      `${base}/protocol/openid-connect/logout` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&post_logout_redirect_uri=${encodeURIComponent(back)}`
    );
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
        instance.saveOfflineSnapshot();
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
    // One loop only: reconnect() starts it again after a connection drop,
    // while the old loop's timer may still be waiting.
    clearTimeout(this.timerId);

    const refreshLoop = async () => {
      // Offline or waiting for a new sign-in: reconnect() renews the login
      // and starts this loop again; refreshing here would only fail.
      if (this.connectionState !== "online") return;
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
        if (OfflineSettingsService.isOfflineAllowed()) {
          // Offline forms on: never log out from here, so saved offline
          // work stays. A lost connection: try again when it is back. An
          // expired login: offer a new sign-in, as reconnect() does.
          const online = await ConnectivityService.check();
          // reconnect() may have run meanwhile: its state wins.
          if (this.connectionState !== "online" || this.reconnecting) return;
          this.setConnectionState(online ? "sign-in-needed" : "offline");
          if (online) this.stopWatchingForReconnect();
          else this.watchConnectivity();
          return;
        }
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
   * @param onError - Optional - called when sign-in cannot complete (for example
   * the sign-in server cannot be reached), so the caller can show a message
   * instead of waiting forever. Callers that omit it behave exactly as before.
   */
  public initKeycloak(
    callback: (authenticated) => void = () => {},
    onError?: (error: unknown) => void
  ): void {
    if (isBrandingPreview()) {
      this.initPreviewSession(callback).catch((err) =>
        console.error("Failed to initialize branding preview session", err)
      );
      return;
    }
    if (!isOfflineEnabled()) {
      this.initOnline(callback, onError);
      return;
    }
    dropTokensFromSavedPass();
    // Offline enabled: ask our own API first (never the sign-in server), so
    // an offline start does not wait for Keycloak to time out.
    // Two-argument then: only a failed check reaches onError, not an
    // exception thrown inside the caller's own callback.
    ConnectivityService.check().then(
      (online) =>
        online
          ? this.initOnline(callback, onError)
          : this.startOffline(callback, onError),
      (error) => {
        console.error("Connection check before sign-in failed", error);
        onError?.(error);
      }
    );
  }

  /** The normal sign-in through the Keycloak server (unchanged behaviour). */
  private initOnline(
    callback: (authenticated) => void,
    onError?: (error: unknown) => void
  ): void {
    if (KeycloakService.takeServerLogoutDue()) {
      // A logout while offline could not reach Keycloak: end that sign-in
      // first, before check-sso would sign the same user in again.
      window.location.assign(this.endSessionUrl());
      return;
    }
    if (this.kcInitialized && this.kc?.authenticated) {
      // Signed in already: an earlier try failed while loading the user's
      // details. keycloak-js allows init() once, so only load them again.
      this.loadUserInfo(callback, onError);
      return;
    }
    this.kc
      ?.init(this.keycloakInitConfig)
      .then((authenticated) => {
        this.kcInitialized = true;
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
            this.loadUserInfo(callback, onError);
            this.refreshToken();
            // Notice a lost connection at once, not only at the next token
            // refresh (FFF-3 offline). Also started by loadOfflineSettings()
            // when the organization turns offline forms on.
            if (OfflineSettingsService.isOfflineAllowed())
              this.watchConnectivity();
          } else {
            this.logout();
          }
        } else {
          console.warn("not authenticated!");
          this.login();
        }
      })
      .catch((err) => {
        console.error("Failed to initialize KeycloakService", err);
        // keycloak-js allows init() once per object, even after a failure:
        // a fresh object lets "Try again" work (as reconnect() does).
        if (!this.kcInitialized) this.kc = new Keycloak(this._keycloakConfig);
        onError?.(err);
      });
  }

  /**
   * Loads the user's details after a sign-in, then calls `callback`.
   * Two-argument then: only a loadUserInfo failure reaches onError, not an
   * exception thrown inside the caller's own callback.
   */
  private loadUserInfo(
    callback: (authenticated) => void,
    onError?: (error: unknown) => void
  ): void {
    this.kc.loadUserInfo().then(
      (data) => {
        this.userData = data;
        StorageService.save(
          StorageService.User.USER_DETAILS,
          JSON.stringify(data)
        );
        this.saveOfflineSnapshot();
        callback(true);
        this.loadOfflineSettings();
      },
      (err) => {
        console.error("Failed to load Keycloak user info", err);
        onError?.(err);
      }
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
   * Starts the app from the saved pass without contacting the sign-in server.
   * Nothing is checked online here; the server checks everything again when
   * the internet is back.
   */
  private startOffline(
    callback: (authenticated) => void,
    onError?: (error: unknown) => void
  ): void {
    const session = loadOfflineSession();
    if (
      !OfflineSettingsService.isOfflineAllowed() ||
      !isUsableOfflineSession(session, this._keycloakConfig.clientId)
    ) {
      onError?.(new Error("No usable offline session"));
      return;
    }
    this.token = session.token;
    this.userData = session.userDetails;
    StorageService.save(
      StorageService.User.USER_ROLE,
      JSON.stringify(session.roles)
    );
    StorageService.save(StorageService.User.AUTH_TOKEN, session.token);
    if (session.userDetails) {
      StorageService.save(
        StorageService.User.USER_DETAILS,
        JSON.stringify(session.userDetails)
      );
    }
    this.setConnectionState("offline");
    this.watchConnectivity();
    callback(true);
  }

  /**
   * Reads the organization's offline switches after an online sign-in (FFF-3).
   * Offline forms on: keep the pass and watch the connection. Off: remove the
   * pass and stop watching, so the app behaves as if offline did not exist.
   */
  private loadOfflineSettings(): void {
    if (!isOfflineEnabled()) return;
    OfflineSettingsService.refresh(this.token)
      .then(() => {
        if (OfflineSettingsService.isOfflineAllowed()) {
          this.saveOfflineSnapshot();
          this.watchConnectivity();
        } else {
          clearOfflineSession();
          this.stopWatchingForReconnect();
        }
      })
      .catch((error) => {
        console.error("Failed to apply the offline settings", error);
      });
  }

  /**
   * Saves the pass used for the next offline start (offline forms on only).
   * No refresh token or ID token (decided 3 Nov 2026): a script that reads
   * localStorage must not be able to get new tokens; the pass only says who
   * the user is while offline.
   */
  private saveOfflineSnapshot(): void {
    if (!OfflineSettingsService.isOfflineAllowed() || !this.kc?.token) return;
    const parsed: any = this.kc.tokenParsed || {};
    saveOfflineSession({
      clientId: this._keycloakConfig.clientId,
      sub: parsed.sub,
      token: this.kc.token,
      roles: parsed.roles || parsed.role || parsed.client_roles || [],
      userDetails: this.userData,
      lastOnlineAuthAt: Date.now(),
    });
  }

  /**
   * Watches the connection for the rest of the session (offline enabled):
   * - lost while online -> "offline" right away, so pages use saved data
   *   instead of waiting on calls that cannot succeed;
   * - back while offline -> renew the login (reconnect).
   */
  private watchConnectivity(): void {
    if (this.stopWatchingConnectivity) return;
    this.stopWatchingConnectivity = ConnectivityService.subscribe((online) => {
      if (online) {
        this.reconnect().catch((error) => {
          console.error("Reconnect failed", error);
        });
      } else if (this.connectionState === "online") {
        // No refresh while offline: reconnect() starts it again.
        clearTimeout(this.timerId);
        this.setConnectionState("offline");
      }
    });
  }

  private stopWatchingForReconnect(): void {
    this.stopWatchingConnectivity?.();
    this.stopWatchingConnectivity = null;
  }

  /**
   * Back online: renew the login with the refresh token keycloak-js holds.
   * Started without a connection, there is none (the pass keeps no refresh
   * token), so the state becomes "sign-in-needed" at once. Also when the
   * login has expired — nothing is cleared, the caller offers signInAgain().
   */
  private async reconnect(): Promise<void> {
    if (this.connectionState === "online" || this.reconnecting) return;
    if (!this.kcInitialized) {
      this.stopWatchingForReconnect();
      this.setConnectionState("sign-in-needed");
      return;
    }
    this.reconnecting = true;
    try {
      await this.kc.updateToken(-1);
      if (!this.kc.token) throw new Error("No token after reconnect");
      this.token = this.kc.token;
      this._tokenParsed = this.kc.tokenParsed;
      StorageService.save(StorageService.User.AUTH_TOKEN, this.token);
      this.saveOfflineSnapshot();
      this.setConnectionState("online");
      this.refreshToken();
      this.loadOfflineSettings();
    } catch {
      // The renewal failed. Why does not matter here: if the connection
      // dropped again, try again when it is back; else sign in again.
      if (!(await ConnectivityService.check())) return;
      this.stopWatchingForReconnect();
      this.setConnectionState("sign-in-needed");
    } finally {
      this.reconnecting = false;
    }
  }

  private setConnectionState(state: ConnectionState): void {
    if (state === this.connectionState) return;
    this.connectionState = state;
    this.connectionListeners.forEach((listener) => listener(state));
  }

  /** online · offline · sign-in-needed (always "online" when offline is disabled). */
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /** Calls listener when the connection state changes; returns unsubscribe. */
  public subscribeConnectionState(
    listener: (state: ConnectionState) => void
  ): () => void {
    this.connectionListeners.add(listener);
    return () => {
      this.connectionListeners.delete(listener);
    };
  }

  /**
   * Opens the sign-in page without logging out, so saved offline work stays.
   */
  public signInAgain(): void {
    if (!this.kcInitialized) {
      // Started without a connection: keycloak-js was never initialised and
      // can only sign in after init(). Starting the app again (now online)
      // signs in through Keycloak; a live Keycloak session needs no password.
      window.location.reload();
      return;
    }
    this.login();
  }

  /**
   * Registers a check that runs before a user-started logout (FFF-3), for
   * example the offline "forms are waiting to sync" warning. Returns a
   * function that removes it.
   */
  public static registerLogoutGuard(guard: LogoutGuard): () => void {
    this.logoutGuards.add(guard);
    return () => {
      this.logoutGuards.delete(guard);
    };
  }

  private static async logoutAllowed(): Promise<boolean> {
    for (const guard of Array.from(this.logoutGuards)) {
      try {
        if ((await guard()) === false) return false;
      } catch (error) {
        console.error("Logout check failed; logging out anyway", error);
      }
    }
    return true;
  }

  /**
   * logs the user out and clear all user data from session.
   * Registered logout guards run first and may cancel it.
   */
  public userLogout(beforeLogout?: () => void): void {
    KeycloakService.logoutAllowed()
      .then((allowed) => {
        if (!allowed) return;
        // Runs only when the logout goes ahead (e.g. the menu moves to the
        // home page, so a cancelled logout leaves the user where they were).
        beforeLogout?.();
        StorageService.clear();
        this.logout();
      })
      .catch((error) => {
        console.error("Logout failed", error);
      });
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
