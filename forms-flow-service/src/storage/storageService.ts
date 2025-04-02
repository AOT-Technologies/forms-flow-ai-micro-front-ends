enum User {
  AUTH_TOKEN = "AUTH_TOKEN",
  USER_DETAILS = "USER_DETAILS",
  USER_ROLE = "USER_ROLE",
  FORMIO_TOKEN = "formioToken" // Added Formio token key
}

class StorageService {
  public static readonly User = User;
  /**
   *
   * @param key
   * @returns the current value present in the session storage for
   * the given key, null if key is not present
   */
  public static get(key: string): string | null {
    return sessionStorage.getItem(key);
  }
  
  /**
   * Get item from localStorage instead of sessionStorage
   * @param key
   * @returns the current value present in the local storage for
   * the given key, null if key is not present
   */
  public static getFromLocal(key: string): string | null {
    return localStorage.getItem(key);
  }
  
  /**
   *
   * @param key
   * @returns the current value present in the session storage for
   * the given key, null if key is not present
   */
  public static getParsedData(key: string): Object | null {
    const data = sessionStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }
  
  /**
   * Get and parse JSON data from localStorage
   * @param key
   * @returns the parsed object from localStorage, null if not present or invalid
   */
  public static getParsedDataFromLocal(key: string): Object | null {
    const data = localStorage.getItem(key);
    try {
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error(`Error parsing localStorage data for key: ${key}`, e);
      return null;
    }
  }
  
  /**
   * sets a new value for the key if present in the session storage
   * new key/value pair is created if the key is not present
   * @param key
   * @param value
   */
  public static save(key: string, value: string): void {
    sessionStorage.setItem(key, value);
    localStorage.setItem(key, value);
  }
  
  /**
   * Save data only to localStorage, not sessionStorage
   * @param key
   * @param value
   */
  public static saveToLocal(key: string, value: string): void {
    localStorage.setItem(key, value);
  }
  
  /**
   * Save object data as JSON string to localStorage
   * @param key
   * @param value
   */
  public static saveObjectToLocal(key: string, value: Object): void {
    localStorage.setItem(key, JSON.stringify(value));
  }
  
  /**
   * removes the key value pair from the session storage if
   * the key is present.
   * @param key
   */
  public static delete(key: string): void {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key); // Also remove from localStorage
  }
  
  /**
   * removes the key value pair only from localStorage
   * @param key
   */
  public static deleteFromLocal(key: string): void {
    localStorage.removeItem(key);
  }
  
  /**
   * Removes all key/value pairs present in the session storage
   * if any.
   */
  public static clear(): void {
    sessionStorage.clear();
    localStorage.clear();
  }
  
  /**
   * Formio specific methods
   */
  
  /**
   * Store the Formio authentication token
   * @param token The JWT token returned from Formio
   */
  public static saveFormioToken(token: string): void {
    localStorage.setItem(User.FORMIO_TOKEN, token);
  }
  
  /**
   * Get the stored Formio token
   * @returns The Formio token or null if not found
   */
  public static getFormioToken(): string | null {
    return localStorage.getItem(User.FORMIO_TOKEN);
  }
  
  /**
   * Store role IDs received from Formio
   * @param roleIds Object containing role information
   */
  public static saveRoleIds(roleIds: Object): void {
    localStorage.setItem("roleIds", JSON.stringify(roleIds));
  }
  
  /**
   * Get the stored role IDs
   * @returns Parsed role IDs object or null if not found
   */
  public static getRoleIds(): Object | null {
    const data = localStorage.getItem("roleIds");
    try {
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error("Error parsing role IDs:", e);
      return null;
    }
  }
}

export default StorageService;