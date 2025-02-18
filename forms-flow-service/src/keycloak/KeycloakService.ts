import Keycloak, {
    KeycloakInitOptions,
    KeycloakTokenParsed,
    KeycloakConfig,
  } from "keycloak-js";
  import StorageService from "../storage/storageService";
  
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
    private userData: any
  
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
      silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
      pkceMethod: "S256",
      checkLoginIframe: false,
    };
  
    private login(): void {
      this.kc?.login();
    }
  
    private logout(): void {
      this.kc?.logout();
      StorageService.clear()
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
    
    /**
     * Refresh the keycloak token before expiring
     */
    private refreshToken(): void {
      this.timerId = setInterval(() => {
        if (!navigator.onLine) {
          console.debug("Offline: Skipping token refresh.");
          return;
        }
    
        this.kc
          ?.updateToken(-1)
          .then((refreshed) => {
            if (refreshed) {
              console.log("Token refreshed!");
              clearInterval(this.timerId);
              this.token = this.kc.token;
              StorageService.save(StorageService.User.AUTH_TOKEN, this.token!);
              this.refreshToken();
            } else {
              console.log("Token is still valid!");
            }
          })
          .catch((err) => {
            console.error("Keycloak token update failed!", err);
            clearInterval(this.timerId);
            this.handleTokenRefreshFailure();
          });
      }, this.getTokenExpireTime());
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
          console.debug("Offline detected: Retrying token refresh when back online.");
          window.addEventListener("online", this.retryTokenRefresh, { once: true });
        }
      } else {
        this.logout();
      }
    }

    /**
     * Retry token refresh when the user is back online
    */
    private retryTokenRefresh = (): void => {
      console.log("Back online: Retrying token refresh.");
      this.isWaitingForOnline = false;
      this.refreshToken();
    };

  
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
      this.kc
        ?.init(this.keycloakInitConfig)
        .then((authenticated) => {
          if (authenticated) {
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
    public getUserData():any {
      return this.userData;
    }

    public isAuthenticated(): boolean {
      return !!this.token;
    }
  }
  
  export default KeycloakService;