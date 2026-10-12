import { WEB_BASE_URL } from "../constants/constants";
import StorageService from "../storage/storageService";
import { isOfflineEnabled } from "./offlineSession";

/**
 * The organization's offline switches (FFF-3, Phase 4 part 2).
 *
 * Offline support needs two keys: the env key (REACT_APP_OFFLINE_ENABLED)
 * allows it on the installation, and the organization's admin turns it on in
 * Manage -> Organization. The switches are read from the server after every
 * online sign-in and kept in localStorage, so an offline start knows them
 * too. Logout and tenant switch clear localStorage, so they are cleared too.
 * Unknown (never read yet) counts as off.
 */
export interface OfflineSettings {
  offlineEnabled: boolean;
  autoSyncEnabled: boolean;
  /** When the switches were last read from the server (ms since epoch). */
  fetchedAt: number;
}

type Listener = (settings: OfflineSettings | null) => void;

const SETTINGS_KEY = "ff_offline_settings";
const SETTINGS_URL = () => `${WEB_BASE_URL}/organization-settings`;

class OfflineSettingsService {
  private static listeners = new Set<Listener>();
  private static pending: Promise<OfflineSettings | null> | null = null;

  /** The last switches read from the server, or null if never read. */
  public static get(): OfflineSettings | null {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? (JSON.parse(raw) as OfflineSettings) : null;
    } catch (error) {
      return null;
    }
  }

  /** Offline forms are on: env key and the organization's switch. */
  public static isOfflineAllowed(): boolean {
    return isOfflineEnabled() && this.get()?.offlineEnabled === true;
  }

  /** Auto sync is on (only when offline forms are on too). */
  public static isAutoSyncAllowed(): boolean {
    return this.isOfflineAllowed() && this.get()?.autoSyncEnabled === true;
  }

  /**
   * Reads the switches from the server and keeps them. On a network error the
   * kept copy stays as it is. Calls that start while one is running share it.
   */
  public static refresh(token?: string): Promise<OfflineSettings | null> {
    if (!isOfflineEnabled()) return Promise.resolve(null);
    if (!this.pending) {
      this.pending = this.fetchSettings(token).finally(() => {
        this.pending = null;
      });
    }
    return this.pending;
  }

  /** Calls listener when the switches change; returns unsubscribe. */
  public static subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static async fetchSettings(
    token?: string
  ): Promise<OfflineSettings | null> {
    const bearer = token || StorageService.get(StorageService.User.AUTH_TOKEN);
    try {
      const response = await fetch(SETTINGS_URL(), {
        headers: bearer ? { Authorization: `Bearer ${bearer}` } : {},
        cache: "no-store",
      });
      if (!response.ok) return this.get();
      const body = await response.json();
      const settings: OfflineSettings = {
        offlineEnabled: body?.offline?.enabled === true,
        autoSyncEnabled: body?.offline?.autoSync === true,
        fetchedAt: Date.now(),
      };
      this.save(settings);
      return settings;
    } catch (error) {
      // Offline or the server is down: keep what we had.
      return this.get();
    }
  }

  private static save(settings: OfflineSettings): void {
    const before = this.get();
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      // Storage blocked: the switches count as off.
    }
    const changed =
      before?.offlineEnabled !== settings.offlineEnabled ||
      before?.autoSyncEnabled !== settings.autoSyncEnabled;
    if (changed) this.listeners.forEach((listener) => listener(settings));
  }
}

export default OfflineSettingsService;
