enum User {
  AUTH_TOKEN = "AUTH_TOKEN",
  USER_DETAILS = "USER_DETAILS",
  USER_ROLE = "USER_ROLE"
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
   *
   * @param key
   * @returns the current value present in the session storage for
   * the given key, null if key is not present
   */
  
  public static getParsedData(key: string): Object | null {
    const data = sessionStorage.getItem(key);
    return data ? JSON.parse(data) : null
  }
  /**
   * sets a new value for the key if present in the session storage
   * new key/value pair is created if the key is not present
   * @param key
   * @param value
   */
  public static save(key: string, value: string): void {
    sessionStorage.setItem(key, value);
    localStorage.setItem(key,value);
  }
  /**
   * sets a new value for the key if present in the session storage
   * new key/value pair is created if the key is not present
   * @param key - key to be set in the session storage
   * @param value - value to be set in the session storage don't need to be stringified
   */
  public static saveDataToSessionStorage(key: string, value: Object): void {
    sessionStorage.setItem(key, JSON.stringify(value));
  }
  /**
   * removes the key value pair from the session storage if
   * the key is present.
   * @param key
   */
  public static delete(key: string): void {
    sessionStorage.removeItem(key);
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
}

export default StorageService;