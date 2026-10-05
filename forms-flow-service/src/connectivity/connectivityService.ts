import { WEB_BASE_URL } from "../constants/constants";

/**
 * Tells whether the formsflow API can really be reached (FFF-3 offline).
 *
 * `navigator.onLine` alone is not trusted: it can say "online" on captive
 * Wi-Fi or a dead connection. When the browser says online, a small HEAD
 * request to our own API (`/checkpoint`, no login needed) decides. It never
 * asks the login server, so it does not depend on the identity provider.
 */
type Listener = (online: boolean) => void;

const PROBE_TIMEOUT_MS = 2000;
const OFFLINE_RECHECK_MS = 15000;

class ConnectivityService {
  private static online =
    typeof navigator === "undefined" ? true : navigator.onLine !== false;
  private static listeners = new Set<Listener>();
  private static started = false;
  private static recheckTimer: ReturnType<typeof setInterval> | null = null;

  /** Last known state (updated by `check()`). */
  public static isOnline(): boolean {
    return this.online;
  }

  /** Probes the API once and returns (and broadcasts) the result. */
  public static async check(): Promise<boolean> {
    const online = await this.probe();
    this.setOnline(online);
    return online;
  }

  /**
   * Calls `listener` whenever the state changes. Returns an unsubscribe
   * function. Starts watching the browser online/offline events on first use.
   */
  public static subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    this.start();
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static async probe(): Promise<boolean> {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      return false;
    }
    const controller =
      typeof AbortController === "undefined" ? null : new AbortController();
    const timeout = setTimeout(() => controller?.abort(), PROBE_TIMEOUT_MS);
    try {
      const response = await fetch(`${WEB_BASE_URL}/checkpoint`, {
        method: "HEAD",
        cache: "no-store",
        signal: controller?.signal,
      });
      return response.ok;
    } catch (error) {
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }

  private static setOnline(online: boolean): void {
    if (online === this.online) return;
    this.online = online;
    this.toggleRecheck(!online);
    this.listeners.forEach((listener) => listener(online));
  }

  // While offline, re-probe now and then: the browser "online" event alone
  // does not prove the API is reachable again.
  private static toggleRecheck(enable: boolean): void {
    if (enable && !this.recheckTimer) {
      this.recheckTimer = setInterval(() => {
        this.check();
      }, OFFLINE_RECHECK_MS);
    } else if (!enable && this.recheckTimer) {
      clearInterval(this.recheckTimer);
      this.recheckTimer = null;
    }
  }

  private static start(): void {
    if (this.started || typeof window === "undefined") return;
    if (typeof window.addEventListener !== "function") return;
    this.started = true;
    window.addEventListener("online", () => {
      this.check();
    });
    window.addEventListener("offline", () => this.setOnline(false));
  }
}

export default ConnectivityService;
