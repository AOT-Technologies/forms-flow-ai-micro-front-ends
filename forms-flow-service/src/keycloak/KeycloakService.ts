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

  public static async updateToken(): Promise<string | null> {
    const instance = this.instance;
    if (!instance?.kc) return null;

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
    this.kc
      ?.init(this.keycloakInitConfig)
      .then((authenticated) => {
        if (authenticated) {
          console.log("Authenticated");
          const tokenParsed = this.kc.tokenParsed;
          if (tokenParsed) {
            const UserRoles =
              tokenParsed.roles || tokenParsed.role || tokenParsed.client_roles;
            if (!UserRoles) {
              callback(false);
            } else {
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
            }
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
