import { 
  UserManager, 
  User, 
  UserManagerSettings,
  WebStorageStateStore,
  Log
} from "oidc-client-ts";
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
     * Used to create UserManager object
     */
    private _userManagerConfig: UserManagerSettings | undefined;
    private userManager: UserManager | undefined;
    private static instance: KeycloakService;
    private token: string | undefined;
    private _user: User | undefined;
    private timerId: any = 0;
    private static jwtTimerId: any = 0;
    private userData: any;
    private isInitialized: boolean = false; // Track if UserManager is initialized
    private isOfflineMode: boolean = false; // Track if running in offline mode

    private constructor(url: string, realm: string, clientId: string, tenantId?: string) {
      const actualClientId = tenantId ? `${tenantId}-${clientId}` : clientId;
      this._userManagerConfig = {
        authority: `${url}/realms/${realm}`,
        client_id: actualClientId,
        redirect_uri: `${window.location.origin}${APP_BASE_ROUTE}/callback`,
        response_type: "code",
        scope: "openid profile email offline_access",
        post_logout_redirect_uri: `${window.location.origin}${APP_BASE_ROUTE}/`,
        silent_redirect_uri: `${window.location.origin}${APP_BASE_ROUTE}/silent-check-sso.html`,
        automaticSilentRenew: true,
        userStore: new WebStorageStateStore({ store: window.localStorage }),
        monitorSession: true,
        loadUserInfo: true
      };
      this.userManager = new UserManager(this._userManagerConfig);
      
      // Set up event handlers
      this.setupEventHandlers();
    }

    /**
     * Set up event handlers for oidc-client-ts
     */
    private setupEventHandlers(): void {
      this.userManager!.events.addAccessTokenExpiring(() => {
        console.log("Access token expiring...");
      });

      this.userManager!.events.addAccessTokenExpired(() => {
        console.log("Access token expired");
        this.handleTokenRefreshFailure();
      });

      this.userManager!.events.addSilentRenewError((error) => {
        console.error("Silent renew error:", error);
        this.handleTokenRefreshFailure();
      });

      this.userManager!.events.addUserLoaded((user) => {
        console.log("User loaded:", user);
        this.handleUserLoaded(user);
      });

      this.userManager!.events.addUserUnloaded(() => {
        console.log("User unloaded");
        this.handleUserUnloaded();
      });
    }

    /**
     * Handle when user is loaded
     */
    private handleUserLoaded(user: User): void {
      this._user = user;
      this.token = user.access_token;
      this.userData = user.profile;
      
      StorageService.save(StorageService.User.AUTH_TOKEN, this.token);
      StorageService.save(StorageService.User.USER_DETAILS, JSON.stringify(this.userData));
      
      // Handle refresh token for roadsafety application
      if (user.refresh_token && APPLICATION_NAME === "roadsafety") {
        StorageService.save(
          StorageService.User.REFRESH_TOKEN,
          HelperServices.encrypt(user.refresh_token)
        );
      }
    }

    /**
     * Handle when user is unloaded
     */
    private handleUserUnloaded(): void {
      this._user = undefined;
      this.token = undefined;
      this.userData = undefined;
      this.isInitialized = false;
      this.isOfflineMode = false;
    }
  
    private async login(): Promise<void> {
      if (this.userManager) {
        await this.userManager.signinRedirect();
      }
    }
  
    private async logout(): Promise<void> {
      this.isInitialized = false; // Reset initialization state
      this.isOfflineMode = false; // Reset offline mode
      if (this.userManager) {
        await this.userManager.signoutRedirect();
      }
      StorageService.clear();
    }

    /**
     * Check if we have valid stored credentials for offline mode
    */
    private hasValidOfflineCredentials(): boolean {
      const storedToken = StorageService.get(StorageService.User.AUTH_TOKEN);
      const storedUserDetails = StorageService.get(StorageService.User.USER_DETAILS);
      const storedUserRole = StorageService.get(StorageService.User.USER_ROLE);
      
      return !!(storedToken && storedUserDetails && storedUserRole);
    }


    /**
   * Initialize offline mode with stored credentials
   */
  private initOfflineMode(): boolean {
    if (!this.hasValidOfflineCredentials()) {
      return false;
    }

    try {
      this.token = StorageService.get(StorageService.User.AUTH_TOKEN);
      const userDetailsStr = StorageService.get(StorageService.User.USER_DETAILS);
      
      if (userDetailsStr) {
        this.userData = JSON.parse(userDetailsStr);
      }

      this.isOfflineMode = true;
      this.isInitialized = true;
      
      console.log("Initialized in offline mode with stored credentials");
      
      // Set up online listener to reinitialize when back online
      this.setupOnlineListener();
      
      return true;
    } catch (error) {
      console.error("Failed to initialize offline mode:", error);
      return false;
    }
  }

  /**
   * Setup listener for when the user comes back online
   */
  private setupOnlineListener(): void {
    const handleOnline = () => {
      console.log("Back online: Reinitializing Keycloak");
      this.isOfflineMode = false;
      this.isInitialized = false;
      
      // Reinitialize Keycloak when back online
      this.initKeycloak((authenticated) => {
        if (authenticated) {
          console.log("Successfully reinitialized Keycloak after coming back online");
        }
      });
      
      // Remove the listener as we've handled the online event
      window.removeEventListener("online", handleOnline);
    };

    window.addEventListener("online", handleOnline, { once: true });
  }
  
    /**
     *
     * @returns Token validity in milliseconds
     */
    private getTokenExpireTime(): number {
      if (this._user?.expires_at) {
        const currentTime = Math.floor(Date.now() / 1000);
        const tokenExpireTime = (this._user.expires_at - currentTime) * 1000;
        return Math.max(tokenExpireTime, 60000); // Minimum 1 minute
      } else {
        return 60000; // Default 1 minute
      }
    }

    private async oidcUpdateToken(timeEnabled = false): Promise<void> {
      // Skip token update if in offline mode
      if (this.isOfflineMode) {
        console.debug("Offline mode: Skipping token update");
        return;
      }

      try {
        const user = await this.userManager!.signinSilent();
        if (user) {
          console.log("Token refreshed!");
          this.handleUserLoaded(user);
        }
      } catch (error) {
        console.error("OIDC token update failed!", error);
        this.handleTokenRefreshFailure();
      } finally {
        if (timeEnabled) {
          clearInterval(this.timerId);
        }
      }
    }

    /**
     * Refresh the token before expiring
     */
    private refreshToken(skipTimer: boolean = false): void {
      // Skip token refresh setup if in offline mode
      if (this.isOfflineMode) {
        console.debug("Offline mode: Skipping token refresh setup");
        return;
      }
      
      this.timerId = setInterval(
        async () => {
          if (!navigator.onLine) {
            console.debug("Offline: Skipping token refresh.");
            return;
          }
          await this.oidcUpdateToken(true);
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
    public async retryTokenRefresh(): Promise<void> {
      console.log("Back online: Retrying token refresh.");
      let skipTimer: boolean = false;
      if (APPLICATION_NAME === "roadsafety") {
        skipTimer = true;
        const storedEncryptedRefreshToken = StorageService.get(StorageService.User.REFRESH_TOKEN);
        if (storedEncryptedRefreshToken) {
          // With oidc-client-ts, refresh tokens are handled automatically
          console.log("Found stored refresh token for retry");
        }
      }
      this.isWaitingForOnline = false;
      await this.oidcUpdateToken();
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
     * Initialize the OIDC client
     * make sure `silent-check-sso.html` is present in public folder
     * @param callback - Optional - callback function to execute after successful authentication
     */
    public async initKeycloak(callback: (authenticated: boolean) => void = () => {}): Promise<void> {
      if (this.isInitialized) {
        callback(true); // Proceed as initialized
        return; // Exit the method if already initialized
      }

      // Check if offline and try to initialize with stored credentials
      if (!navigator.onLine) {
        console.log("Offline detected during initialization");
        if (this.initOfflineMode()) {
          callback(true);
          return;
        } else {
          console.warn("No valid offline credentials found");
          callback(false);
          return;
        }
      }

      try {
        // Check if user is already authenticated
        let user = await this.userManager!.getUser();
        
        if (!user) {
          // Try silent signin first with a timeout
          try {
            console.log("Attempting silent signin...");
            user = await Promise.race([
              this.userManager!.signinSilent(),
              new Promise<User | null>((_, reject) => 
                setTimeout(() => reject(new Error("Silent signin timeout")), 2000)
              )
            ]);
          } catch (silentError) {
            console.log("Silent signin failed:", silentError.message);
            
            // Check if this is a callback from authentication
            if (window.location.pathname.includes('/callback')) {
              try {
                console.log("Handling authentication callback...");
                user = await this.userManager!.signinCallback();
              } catch (callbackError) {
                console.error("Signin redirect callback failed:", callbackError);
                callback(false);
                return;
              }
            }
          }
        }

        if (user && !user.expired) {
          this.isInitialized = true;
          console.log("Authenticated");
          
          // Extract user roles from token claims
          const userRoles = this.extractUserRoles(user);
          if (!userRoles || userRoles.length === 0) {
            console.warn("No user roles found");
            callback(false);
            return;
          }

          StorageService.save(StorageService.User.USER_ROLE, JSON.stringify(userRoles));
          this.handleUserLoaded(user);

          if (user.refresh_token && APPLICATION_NAME === "roadsafety") {
            StorageService.save(
              StorageService.User.REFRESH_TOKEN, 
              HelperServices.encrypt(user.refresh_token)
            );
            
            window.addEventListener(
              "online",
              async () => {
                await this.retryTokenRefresh();
                await KeycloakService.updateJwtToken();
              },
              { once: false }
            );
          } else {
            console.info("Init OIDC - not storing the refresh token.");
          }

          this.refreshToken();
          KeycloakService.refreshJwtToken();
          callback(true);
        } else {
          console.warn("Not authenticated! Initiating login...");
          // Don't await the login as it will redirect the page
          // The callback should be called with false to indicate auth is needed
          callback(false);
          // Start the login process without waiting
          this.login().catch(error => {
            console.error("Login initiation failed:", error);
          });
        }
      } catch (error) {
        console.error("Failed to initialize OIDC Service", error);
        callback(false);
      }
    }

    /**
     * Extract user roles from OIDC user token
     */
    private extractUserRoles(user: User): string[] | null {
      // Try to get roles from various possible claim locations
      const profile = user.profile as any;
      
      // Check resource_access for client-specific roles (Keycloak style)
      if (profile.resource_access) {
        const clientId = this._userManagerConfig?.client_id;
        if (clientId && profile.resource_access[clientId]?.roles) {
          console.log("Found roles in resource_access for client:", clientId);
          return profile.resource_access[clientId].roles;
        }
      }
      
      // Check realm_access for realm roles
      if (profile.realm_access?.roles) {
        console.log("Found roles in realm_access");
        return profile.realm_access.roles;
      }
      
      // Check direct roles claim
      if (profile.role && Array.isArray(profile.role)) {
        console.log("Found roles in direct role claim");
        return profile.role;
      }
      
      // Check groups as roles
      if (profile.groups && Array.isArray(profile.groups)) {
        console.log("Found roles in groups");
        return profile.groups;
      }
      
      return null;
    }
    /**
     * logs the user out and clear all user data from session.
     */
    public async userLogout(): Promise<void> {
      this.isInitialized = false; // Reset initialization state
      this.isOfflineMode = false; // Reset offline mode
      KeycloakService.clearPolling();
      StorageService.clear();
      await this.logout();
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
      return !!this.token && !!this._user && !this._user.expired;
    }
    
    /**
     * Check if currently running in offline mode
     */
    public isInOfflineMode(): boolean {
      return this.isOfflineMode;
    }

    /**
     * Get the current user object
     */
    public getUser(): User | undefined {
      return this._user;
    }

    /**
     * Handle signin redirect callback
     */
    public async handleCallback(): Promise<User | null> {
      try {
        const user = await this.userManager!.signinRedirectCallback();
        if (user) {
          this.handleUserLoaded(user);
          this.isInitialized = true;
        }
        return user;
      } catch (error) {
        console.error("Error handling signin callback:", error);
        return null;
      }
    }

    /**
     * Manually trigger login process
     * This is a public method that can be called when authentication is needed
     */
    public async triggerLogin(): Promise<void> {
      console.log("Manually triggering login process");
      await this.login();
    }

    /**
     * Check if user needs authentication
     * Returns true if user needs to authenticate, false if already authenticated
     */
    public needsAuthentication(): boolean {
      return !this.isAuthenticated() && !this.isOfflineMode;
    }
  }
  
  export default KeycloakService;