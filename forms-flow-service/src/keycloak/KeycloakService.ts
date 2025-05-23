import Keycloak, {
    KeycloakInitOptions,
    KeycloakTokenParsed,
    KeycloakConfig,
  } from "keycloak-js";
import StorageService from "../storage/storageService";
import HelperServices from "../helpers/helperServices";
import {
  APPLICATION_NAME,
  APP_BASE_ROUTE,
  DEFAULT_FORMIO_JWT_EXPIRE,
  FORMIO_JWT_EXPIRE,
} from "../constants/constants";
import { getUpdatedJwtToken } from "../request/jwtTokenService";

class KeycloakService {
    /**
     * Used to create Keycloak object
     */
    private _keycloakConfig: KeycloakConfig | undefined;
    private kc: Keycloak | undefined;
    private static instance: KeycloakService;
    private token: string | undefined;
    private _tokenParsed: KeycloakTokenParsed | undefined;
    private timerId: any = 0;
    private static jwtTimerId: any = 0;
    private userData: any;
    private isInitialized: boolean = false; // Track if Keycloak is initialized

    private constructor(url: string, realm: string, clientId: string, tenantId?: string) {
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
      silentCheckSsoRedirectUri: `${window.location.origin}${APP_BASE_ROUTE}/silent-check-sso.html`,
      pkceMethod: "S256",
      checkLoginIframe: false,
      scope: "openid offline_access"
    };
  
    private login(): void {
      this.kc?.login();
    }
  
    private logout (): void {
      this.isInitialized = false; // Reset initialization state
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

    private keycloackUpdateToken(timeEnabled = false): void {
      this.kc
        ?.updateToken(-1)
        .then((refreshed) => {
          if (refreshed) {
            console.log("Token refreshed!");
            this.token = this.kc.token;
            StorageService.save(StorageService.User.AUTH_TOKEN, this.token!);
            if (this.kc.refreshToken && APPLICATION_NAME === "roadsafety") {
              StorageService.save(
                StorageService.User.REFRESH_TOKEN,
                HelperServices.encrypt(this.kc.refreshToken)
              );
            } else {
              console.info(
                "Refreshing Tokens - Not storing the refresh token."
              );
            }
            this.refreshToken();
          } else {
            console.log("Token is still valid!");
          }
        })
        .catch((err) => {
          console.error("Keycloak token update failed!", err);
          this.handleTokenRefreshFailure();
        })
        .finally(() => {
          if (timeEnabled) {
            clearInterval(this.timerId);
          }
        });
    }

    /**
     * Refresh the keycloak token before expiring
     */
    private refreshToken(skipTimer: boolean = false): void {
      this.timerId = setInterval(
        () => {
          if (!navigator.onLine) {
            console.debug("Offline: Skipping token refresh.");
            return;
          }
          this.keycloackUpdateToken(true);
        },
        !skipTimer && APPLICATION_NAME === "roadsafety"
          ? this.getTokenExpireTime()
          : 0
      );
    }

    /**
     * Prevents multiple event listeners
     */
    private isWaitingForOnline = false;

    /**
     * Handle token refresh failure
     */
    private handleTokenRefreshFailure(): void {
      if (!navigator.onLine) {
        if (!this.isWaitingForOnline) {
          this.isWaitingForOnline = true;
          console.debug(
            "Offline detected: Retrying token refresh when back online."
          );
          window.addEventListener(
            "online",
            () => {
              this.retryTokenRefresh(); // This will be executed when the 'online' event occurs
            },
            { once: true }
          );
        }
      } else {
        this.logout();
      }
    }

    /**
     * Retry token refresh when the user is back online
    */
    public retryTokenRefresh(): void  {
      console.log("Back online: Retrying token refresh.");
      let skipTimer: boolean = false;
      if (APPLICATION_NAME === "roadsafety") {
        skipTimer = true;
        const storedEncryptedRefreshToken = StorageService.get(StorageService.User.REFRESH_TOKEN);
        if (storedEncryptedRefreshToken) {
          this.kc.refreshToken = HelperServices.decrypt(storedEncryptedRefreshToken);
        }
      }
      this.isWaitingForOnline = false;
    this.keycloackUpdateToken();
    };

    /**
     * Extracts the JWT token from the response headers and saves it 
     * to local storage for future authenticated requests.
     * 
     * @param response - The HTTP response containing the JWT token in headers.
     */
    private static saveJwtToken(response: any): void {
      const jwtToken = response.headers["x-jwt-token"];
      if (jwtToken) {
        StorageService.save(StorageService.User.FORMIO_TOKEN, jwtToken);
      }
    }

    /**
     * Fetches a new JWT token using the `getUpdatedJwtToken()` method and 
     * stores it using `saveJwtToken()`. This is useful for refreshing
     * the token periodically or on session extension.
     */
    public static async updateJwtToken(): Promise<void> {
      try {
        const response = await getUpdatedJwtToken();
        if (response) {
          this.saveJwtToken(response);
        }
      } catch (error) {
        console.error("Failed to update JWT token", error);
      }
    }

    /**
     * Stops the polling mechanism for refreshing the JWT token
     * by clearing the interval timer.
     */
    private static clearPolling(): void {
      if (this.jwtTimerId) {
        clearInterval(this.jwtTimerId);
        this.jwtTimerId = 0;
        console.log("Polling stopped.");
      }
    }


    /**
     * Starts a background polling mechanism to refresh the JWT token periodically before it expires.
     *
     * - Retrieves the JWT expiration interval from the environment/config (`FORMIO_JWT_EXPIRE`).
     * - If the value is invalid or missing, falls back to a default (`DEFAULT_FORMIO_JWT_EXPIRE`).
     * - Adds a small buffer (2 seconds) to ensure the token is refreshed slightly before actual expiration.
     * - Clears any existing polling interval before starting a new one.
     * - Sets up a `setInterval` that checks for online status and asynchronously refreshes the JWT token.
     * - If `skipTimer` is true or the application is not `"roadsafety"`, the interval is set to 0 (executes immediately).
     *
     * @param skipTimer - If true, bypasses the default interval check (used for forced/immediate refresh).
    */
    private static refreshJwtToken(skipTimer: boolean = false): void {
      const parsedValue = Number(FORMIO_JWT_EXPIRE);
      const jwtExpireMinutes = isNaN(parsedValue)
        ? DEFAULT_FORMIO_JWT_EXPIRE
        : parsedValue;

      // 2 seconds buffer (2000 ms)
      const checkInterval = jwtExpireMinutes * 60 * 1000 - 2000;

      this.clearPolling(); // Clear previous interval before starting new

      this.jwtTimerId = setInterval(
        () => {
          (async () => {
            if (!navigator.onLine) {
              console.debug("Offline: Skipping token refresh.");
              return;
            }
            await this.updateJwtToken();
          })(); // Async IIFE inside setInterval
        },
        !skipTimer && APPLICATION_NAME === "roadsafety" ? checkInterval : 0
      );
      console.log(
        `JWT polling started with interval: ${checkInterval} ms (${jwtExpireMinutes} minutes - 2 seconds)`
      );
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
    public initKeycloak (callback: (authenticated) => void = () => { }): void {
        if (this.isInitialized) {
          callback(true); // Proceed as initialized
          return; // Exit the method if already initialized
        }
      this.kc
        ?.init(this.keycloakInitConfig)
        .then((authenticated) => {
          if (authenticated) {
            this.isInitialized = true;  // Mark as initialized
            console.log("Authenticated");
            if (!!this.kc?.resourceAccess) {
              const UserRoles = this.kc?.resourceAccess[this.kc.clientId!]?.roles;
              if(!UserRoles){
                callback(false);
              }
              else{
              StorageService.save(StorageService.User.USER_ROLE, JSON.stringify(UserRoles));
              this.token = this.kc.token;
              this._tokenParsed = this.kc.tokenParsed;

              if (this.kc.refreshToken && APPLICATION_NAME === "roadsafety") {
                StorageService.save(StorageService.User.REFRESH_TOKEN, HelperServices.encrypt(this.kc.refreshToken));
                window.addEventListener(
                  "online",
                  () => {
                    this.retryTokenRefresh(); // This will be executed when the 'online' event occurs
                    KeycloakService.updateJwtToken();
                  },
                  { once: false }
                );
              } else {
                console.info("Init KC - not storing the refresh token.");
              }

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
              KeycloakService.refreshJwtToken();
              }
            }
              else {
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
     * logs the user out and clear all user data from session.
     */
    public userLogout (): void {
      this.isInitialized = false; // Reset initialization state
      KeycloakService.clearPolling();
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
    public getUserData():any {
      return this.userData;
    }

    public isAuthenticated(): boolean {
      return !!this.token;
    }
  }
  
  export default KeycloakService;